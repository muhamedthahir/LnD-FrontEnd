import { useState, useRef, useEffect } from 'react'
import './AudioPlayer.css'

/**
 * AudioPlayer component for displaying audio content
 * Custom styled audio player with play/pause, progress, and volume controls
 */
function AudioPlayer({ 
  url, 
  fileName = '', 
  compact = false,
  autoPlay = false,
  onError = null
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
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
  }, [url, onError])

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
            <input
              type="range"
              className="progress-slider"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              disabled={loading}
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

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
    </div>
  )
}

export default AudioPlayer

