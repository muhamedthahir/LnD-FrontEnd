import { useState, useRef } from 'react'
import './VideoPlayer.css'

/**
 * VideoPlayer component for displaying video content
 * Supports both uploaded files (S3 URLs) and embedded URLs (YouTube, Vimeo, etc.)
 */
function VideoPlayer({ 
  url, 
  fileName = '', 
  compact = false,
  autoPlay = false,
  controls = true,
  onError = null
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef(null)

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

  const handleError = (e) => {
    console.error('Video error:', e, url)
    setError(true)
    setLoading(false)
    if (onError) onError(e)
  }

  const handleLoad = () => {
    setLoading(false)
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
      
      {fileName && !loading && (
        <div className="video-info">
          <span className="file-name" title={fileName}>{fileName}</span>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer

