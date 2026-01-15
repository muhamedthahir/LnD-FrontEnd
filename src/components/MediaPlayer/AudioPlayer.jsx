import { useState, useRef, useEffect, useCallback } from 'react'
import './AudioPlayer.css'

/**
 * AudioPlayer component for displaying audio content
 * Custom styled audio player with play/pause, progress, and volume controls
 * Tracks playback progress and reports to parent/backend
 */
function AudioPlayer({ 
  url, 
  fileName = '', 
  compact = false,
  autoPlay = false,
  onError = null,
  onProgressUpdate = null,  // Callback for progress updates: (currentTime, duration, progressPercent)
  onComplete = null,        // Callback when threshold is met
  thresholdValue = 100,     // Percentage threshold to mark as complete
  segmentId = null,         // Segment ID for tracking
  initialProgress = 0       // Initial progress percentage
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progressPercent, setProgressPercent] = useState(initialProgress)
  const [isComplete, setIsComplete] = useState(initialProgress >= thresholdValue)
  const audioRef = useRef(null)
  const lastReportedProgressRef = useRef(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setLoading(false)
    }

    const handleTimeUpdate = () => {
      const current = audio.currentTime
      const total = audio.duration
      setCurrentTime(current)
      
      if (total > 0 && !isNaN(total)) {
        const progress = Math.round((current / total) * 100)
        setProgressPercent(progress)
        
        // Report progress every 5% change
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
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Mark as 100% when audio ends
      if (onProgressUpdate) {
        onProgressUpdate(audio.duration, audio.duration, 100)
      }
      if (!isComplete && 100 >= thresholdValue) {
        setIsComplete(true)
        if (onComplete) {
          onComplete(audio.duration, audio.duration, 100)
        }
      }
    }

    const handleError = (e) => {
      setError(true)
      setLoading(false)
      if (onError) onError(e)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [url, onError, onProgressUpdate, onComplete, thresholdValue, isComplete])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!url) {
    return (
      <div className={`audio-player-container ${compact ? 'compact' : ''}`}>
        <div className="audio-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <span>No audio available</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`audio-player-container ${compact ? 'compact' : ''}`}>
        <div className="audio-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Failed to load audio</span>
          {fileName && <p className="file-name">{fileName}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`audio-player-container ${compact ? 'compact' : ''}`}>
      <audio 
        ref={audioRef} 
        src={url} 
        preload="metadata"
        autoPlay={autoPlay}
      />
      
      <div className="audio-player">
        {/* Play/Pause Button */}
        <button 
          className="play-btn" 
          onClick={togglePlay}
          disabled={loading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? (
            <div className="btn-spinner"></div>
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        {/* Progress Section */}
        <div className="audio-progress-section">
          {fileName && (
            <div className="audio-file-name" title={fileName}>{fileName}</div>
          )}
          
          <div className="progress-row">
            <span className="time">{formatTime(currentTime)}</span>
            <div className="audio-progress-wrapper">
              <input
                type="range"
                className="progress-slider"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
                disabled={loading}
              />
              {thresholdValue < 100 && (
                <div 
                  className="audio-threshold-marker" 
                  style={{ left: `${thresholdValue}%` }}
                  title={`Completion threshold: ${thresholdValue}%`}
                />
              )}
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Completion Status */}
        {isComplete && (
          <div className="audio-complete-badge" title="Completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}

        {/* Volume Control */}
        {!compact && (
          <div className="volume-control">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        )}
      </div>
      
      {/* Progress percentage display */}
      {!compact && (
        <div className="audio-progress-info">
          <span className={`audio-progress-percent ${isComplete ? 'complete' : ''}`}>
            {isComplete ? 'Completed' : `${progressPercent}% listened`}
          </span>
        </div>
      )}
    </div>
  )
}

export default AudioPlayer

