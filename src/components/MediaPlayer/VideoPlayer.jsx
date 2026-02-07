import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './VideoPlayer.module.css'

/**
 * VideoPlayer component for displaying video content
 * Supports both uploaded files (S3 URLs) and embedded URLs (YouTube, Vimeo, etc.)
 * Tracks playback progress and reports to parent/backend
 */
function VideoPlayer({ 
  url, 
  fileName = '', 
  compact = false,
  autoPlay = false,
  controls = true,
  onError = null,
  onProgressUpdate = null,  // Callback for progress updates: (currentTime, duration, progressPercent)
  onComplete = null,        // Callback when threshold is met
  thresholdValue = 100,     // Percentage threshold to mark as complete
  segmentId = null,         // Segment ID for tracking
  initialProgress = 0       // Initial progress percentage
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isComplete, setIsComplete] = useState(initialProgress >= thresholdValue)
  const videoRef = useRef(null)
  const lastReportedProgressRef = useRef(0)
  const lastReportedTimeRef = useRef(0)
  const progressPercentRef = useRef(initialProgress)

  // Extract clean URL if user pasted iframe HTML or messy string
  const normalizeVideoUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return ''
    const trimmed = raw.trim()
    // Extract src from iframe HTML (e.g. user pasted Share > Embed from YouTube)
    const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i)
    if (iframeMatch) return iframeMatch[1].trim()
    // Already a URL
    return trimmed
  }

  const cleanUrl = normalizeVideoUrl(url)

  // Check if URL is an embedded video (YouTube, Vimeo, etc.)
  const isEmbedded = cleanUrl && (
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be') ||
    cleanUrl.includes('vimeo.com') ||
    cleanUrl.includes('dailymotion.com')
  )

  // Convert to embeddable URL (accepts regular link or embed link)
  const getEmbedUrl = (videoUrl) => {
    const u = normalizeVideoUrl(videoUrl)
    if (!u) return ''

    // YouTube - already in embed form
    if (u.includes('youtube.com/embed/')) {
      try {
        const parsed = new URL(u)
        const id = parsed.pathname.split('/embed/')[1]?.split('/')[0]?.split('?')[0]
        if (id) return `https://www.youtube.com/embed/${id}`
      } catch (_) {}
      return u
    }
    // YouTube watch link
    if (u.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(u).searchParams.get('v')
        if (videoId) return `https://www.youtube.com/embed/${videoId}`
      } catch (_) {}
    }
    if (u.includes('youtu.be/')) {
      const videoId = u.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }

    // Vimeo
    if (u.includes('vimeo.com/')) {
      const videoId = u.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0]
      if (videoId && !videoId.includes('<')) return `https://player.vimeo.com/video/${videoId}`
    }

    return u
  }

  // Handle progress tracking
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isEmbedded) return
    
    const video = videoRef.current
    const current = video.currentTime
    const total = video.duration
    
    if (total > 0 && !isNaN(total)) {
      const progress = Math.round((current / total) * 100)
      setCurrentTime(current)
      progressPercentRef.current = progress
      
      // Report progress every 5% change or every 5 seconds
      const now = Date.now()
      const shouldReportByPercent = Math.abs(progress - lastReportedProgressRef.current) >= 5
      const shouldReportByTime = now - lastReportedTimeRef.current >= 5000
      if (shouldReportByPercent || shouldReportByTime) {
        lastReportedProgressRef.current = progress
        lastReportedTimeRef.current = now
        if (onProgressUpdate) {
          onProgressUpdate(current, total, progress)
        }
      }
      
      // Check if threshold is met
      if (progress >= thresholdValue && !isComplete) {
        setIsComplete(true)
        if (onComplete) {
          onComplete(current, total, progress)
        }
      }
    }
  }, [onProgressUpdate, onComplete, thresholdValue, isComplete, isEmbedded])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setLoading(false)
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video || isEmbedded) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', () => {
      // Mark as 100% when video ends
      if (onProgressUpdate) {
        onProgressUpdate(video.duration, video.duration, 100)
      }
      if (!isComplete && 100 >= thresholdValue) {
        setIsComplete(true)
        if (onComplete) {
          onComplete(video.duration, video.duration, 100)
        }
      }
    })

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [handleTimeUpdate, handleLoadedMetadata, onProgressUpdate, onComplete, thresholdValue, isComplete, isEmbedded])

  useEffect(() => {
    progressPercentRef.current = initialProgress
    lastReportedProgressRef.current = initialProgress
  }, [initialProgress])

  const handleError = (e) => {
    console.error('Video error:', e, url)
    setError(true)
    setLoading(false)
    if (onError) onError(e)
  }

  const handleLoad = () => {
    setLoading(false)
  }

  // Format time for display
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0
    ? Math.round((currentTime / duration) * 100)
    : Math.round(progressPercentRef.current)

  if (!cleanUrl) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>No video available</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Failed to load video</span>
          {fileName && <p className={styles.fileName}>{fileName}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {loading && (
        <div className={styles.loading}>
          <div className="spinner"></div>
          <span>Loading video...</span>
        </div>
      )}
      
      {isEmbedded ? (
        <iframe
          className={styles.videoIframe}
          src={getEmbedUrl(cleanUrl)}
          title={fileName || 'Video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <video
          ref={videoRef}
          className={styles.videoElement}
          src={cleanUrl}
          controls={controls}
          autoPlay={autoPlay}
          onLoadedData={handleLoad}
          onError={handleError}
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Progress tracking info */}
      {!isEmbedded && !loading && !compact && (
        <div className={styles.progressInfo}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercent}%` }}
            />
            {thresholdValue < 100 && (
              <div 
                className={styles.thresholdMarker} 
                style={{ left: `${thresholdValue}%` }}
                title={`Completion threshold: ${thresholdValue}%`}
              />
            )}
          </div>
          <div className={styles.progressDetails}>
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <span className={`${styles.progressPercent} ${isComplete ? styles.complete : ''}`}>
              {isComplete ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.checkIcon}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Complete
                </>
              ) : (
                `${progressPercent}%`
              )}
            </span>
          </div>
        </div>
      )}
      
      {fileName && !loading && (
        <div className={styles.info}>
          <span className={styles.fileName} title={fileName}>{fileName}</span>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer

