import { useState, useRef, useEffect, useCallback } from 'react'
import './VideoPlayer.css'

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
  const [progressPercent, setProgressPercent] = useState(initialProgress)
  const [isComplete, setIsComplete] = useState(initialProgress >= thresholdValue)
  const videoRef = useRef(null)
  const lastReportedProgressRef = useRef(0)

  // Check if URL is an embedded video (YouTube, Vimeo, etc.)
  const isEmbedded = url && (
    url.includes('youtube.com') || 
    url.includes('youtu.be') || 
    url.includes('vimeo.com') ||
    url.includes('dailymotion.com')
  )

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (videoUrl) => {
    if (!videoUrl) return ''
    
    // YouTube
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = new URL(videoUrl).searchParams.get('v')
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    // Vimeo
    if (videoUrl.includes('vimeo.com/')) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    
    return videoUrl
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
      setProgressPercent(progress)
      
      // Report progress every 5% change or every 10 seconds
      if (Math.abs(progress - lastReportedProgressRef.current) >= 5) {
        lastReportedProgressRef.current = progress
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

  if (!url) {
    return (
      <div className={`video-player-container ${compact ? 'compact' : ''}`}>
        <div className="video-placeholder">
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
      <div className={`video-player-container ${compact ? 'compact' : ''}`}>
        <div className="video-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Failed to load video</span>
          {fileName && <p className="file-name">{fileName}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`video-player-container ${compact ? 'compact' : ''}`}>
      {loading && (
        <div className="video-loading">
          <div className="spinner"></div>
          <span>Loading video...</span>
        </div>
      )}
      
      {isEmbedded ? (
        <iframe
          className="video-iframe"
          src={getEmbedUrl(url)}
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
          className="video-element"
          src={url}
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
        <div className="video-progress-info">
          <div className="video-progress-bar">
            <div 
              className="video-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
            {thresholdValue < 100 && (
              <div 
                className="video-threshold-marker" 
                style={{ left: `${thresholdValue}%` }}
                title={`Completion threshold: ${thresholdValue}%`}
              />
            )}
          </div>
          <div className="video-progress-details">
            <span className="video-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <span className={`video-progress-percent ${isComplete ? 'complete' : ''}`}>
              {isComplete ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="check-icon">
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
        <div className="video-info">
          <span className="file-name" title={fileName}>{fileName}</span>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer

