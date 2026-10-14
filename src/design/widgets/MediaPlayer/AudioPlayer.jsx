import { createViewStyles } from "../../viewStyles";
const styles = createViewStyles("AudioPlayer");
import { ActionButton } from "../../Primitives";
import { useState, useRef, useEffect, useCallback } from 'react';
import useResolvedMediaUrl from "../../../hooks/useResolvedMediaUrl";
function AudioPlayer({
  url,
  fileName = '',
  mediaKey = null,
  compact = false,
  autoPlay = false,
  onError = null,
  onProgressUpdate = null,
  onComplete = null,
  thresholdValue = 100,
  segmentId = null,
  initialProgress = 0
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(initialProgress);
  const [isComplete, setIsComplete] = useState(initialProgress >= thresholdValue);
  const audioRef = useRef(null);
  const lastReportedProgressRef = useRef(0);
  const {
    playbackUrl,
    resolving
  } = useResolvedMediaUrl(url, mediaKey);
  const resolvedUrl = playbackUrl || url;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const total = audio.duration;
      setCurrentTime(current);
      if (total > 0 && !isNaN(total)) {
        const progress = Math.round(current / total * 100);
        setProgressPercent(progress);
        if (Math.abs(progress - lastReportedProgressRef.current) >= 5) {
          lastReportedProgressRef.current = progress;
          if (onProgressUpdate) {
            onProgressUpdate(current, total, progress);
          }
        }
        if (progress >= thresholdValue && !isComplete) {
          setIsComplete(true);
          if (onComplete) {
            onComplete(current, total, progress);
          }
        }
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onProgressUpdate) {
        onProgressUpdate(audio.duration, audio.duration, 100);
      }
      if (!isComplete && 100 >= thresholdValue) {
        setIsComplete(true);
        if (onComplete) {
          onComplete(audio.duration, audio.duration, 100);
        }
      }
    };
    const handleError = e => {
      setError(true);
      setLoading(false);
      if (onError) onError(e);
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [resolvedUrl, onError, onProgressUpdate, onComplete, thresholdValue, isComplete]);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  const handleProgressChange = e => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };
  const handleVolumeChange = e => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };
  const formatTime = time => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  if (!resolvedUrl) {
    return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>No audio available</span>
        </div>
      </div>;
  }
  if (error) {
    return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>Failed to load audio</span>
          {fileName && <p className={styles.fileNameText}>{fileName}</p>}
        </div>
      </div>;
  }
  return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <audio ref={audioRef} src={resolvedUrl} preload="metadata" autoPlay={autoPlay} />

      <div className={styles.player}>
        {}
        <ActionButton className={styles.playBtn} onClick={togglePlay} disabled={loading} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {loading ? <div className={styles.btnSpinner}></div> : isPlaying ? <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg> : <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>}
        </ActionButton>

        {}
        <div className={styles.progressSection}>
          {fileName && <div className={styles.fileName} title={fileName}>{fileName}</div>}

          <div className={styles.progressRow}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <div className={styles.progressWrapper}>
              <input aria-label="Audio position" type="range" className={styles.progressSlider} min="0" max={duration || 0} value={currentTime} onChange={handleProgressChange} disabled={loading} />
              {thresholdValue < 100 && <div className={styles.thresholdMarker} style={{
              left: `${thresholdValue}%`
            }} title={`Completion threshold: ${thresholdValue}%`} />}
            </div>
            <span className={styles.time}>{formatTime(duration)}</span>
          </div>
        </div>

        {}
        {isComplete && <div className={styles.completeBadge} title="Completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>}

        {}
        {!compact && <div className={styles.volumeControl}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <input aria-label="Audio volume" type="range" className={styles.volumeSlider} min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} />
          </div>}
      </div>

      {}
      {!compact && <div className={styles.progressInfo}>
          <span className={`${styles.progressPercent} ${isComplete ? styles.complete : ''}`}>
            {isComplete ? 'Completed' : `${progressPercent}% listened`}
          </span>
        </div>}
    </div>;
}
export default AudioPlayer;
