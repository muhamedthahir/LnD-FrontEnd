import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import CodeEditor from '../../../CodeEditor/CodeEditor'
import styles from './AssessmentTake.module.css'

function AssessmentTake() {
  const { mappingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { apiBaseUrl, accessToken } = useApi()
  
  // Check if running in secure window mode (either via URL param or secure route)
  const searchParams = new URLSearchParams(location.search)
  const isSecureWindow = searchParams.get('secure') === 'true' || location.pathname.startsWith('/secure/')
  
  // Assessment state
  const [assessmentData, setAssessmentData] = useState(null)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [segmentTimeRemaining, setSegmentTimeRemaining] = useState(0)
  const [totalTimeWorked, setTotalTimeWorked] = useState(0)
  const timerRef = useRef(null)
  const progressSaveRef = useRef(null)
  
  // Progress save interval in seconds (configurable - default 10 seconds)
  const PROGRESS_SAVE_INTERVAL = 10
  
  // UI state
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showSegmentEndModal, setShowSegmentEndModal] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  
  // Proctoring state
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [proctoringWarning, setProctoringWarning] = useState(null)
  const [showFullscreenExitModal, setShowFullscreenExitModal] = useState(false)
  const [pendingFullscreenExit, setPendingFullscreenExit] = useState(false)
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false)
  const [tabSwitchCountdown, setTabSwitchCountdown] = useState(5)
  const [isTabLimitExceeded, setIsTabLimitExceeded] = useState(false)
  const countdownTimerRef = useRef(null)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  // Fetch assessment data
  const fetchAssessmentData = useCallback(async () => {
    if (!apiBaseUrl || !mappingId) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/take`, {
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch assessment' }))
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch assessment')
      }

      const data = await response.json()
      setAssessmentData(data)
      setQuestions(data.questions || [])
      setTimeRemaining(data.time_remaining || data.total_duration)
      setSegmentTimeRemaining(data.segment_time_remaining || data.current_segment?.time_remaining || data.segments?.[0]?.segment_duration || 0)
      setCurrentSegmentIndex(data.current_segment_index || 0)
      setCurrentQuestionIndex(data.current_question_index || 0)
      setTotalTimeWorked(data.total_time_worked || 0)
      
      // Restore tab switch count from server (for resume scenarios)
      if (data.tab_switch_count > 0) {
        setTabSwitchCount(data.tab_switch_count)
      }
      
      // Restore saved answers
      if (data.saved_answers) {
        setAnswers(data.saved_answers)
      }
      
      // Show resume notification if resuming
      if (data.resume_count > 0) {
        toast.info(`Resuming assessment (Resume #${data.resume_count}). Time remaining: ${formatTime(data.time_remaining)}`)
      }

      // Enter fullscreen if required
      if (data.proctoring?.full_screen_mandatory) {
        enterFullScreen()
      }
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to load assessment')
      navigate('/user/assessments')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, mappingId, accessToken, navigate])

  useEffect(() => {
    fetchAssessmentData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progressSaveRef.current) clearInterval(progressSaveRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [fetchAssessmentData])

  // Secure Window Mode: Auto fullscreen and window close prevention
  useEffect(() => {
    if (!isSecureWindow) return

    // Auto-enter fullscreen when in secure window mode
    const enterFullscreenOnLoad = async () => {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullScreen(true)
      } catch (error) {
        console.error('Auto fullscreen failed:', error)
        toast.warning('Please enable fullscreen mode for this assessment')
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(enterFullscreenOnLoad, 500)

    // Prevent window close with beforeunload
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'You have an assessment in progress. Are you sure you want to leave?'
      return e.returnValue
    }

    // Block Alt+F4 and other close shortcuts
    const handleKeyDown = (e) => {
      // Block Alt+F4
      if (e.altKey && e.key === 'F4') {
        e.preventDefault()
        setShowCloseWarning(true)
        return
      }
      // Block Ctrl+W
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        setShowCloseWarning(true)
        return
      }
      // Block Ctrl+Shift+W
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault()
        setShowCloseWarning(true)
        return
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isSecureWindow])

  // Secure Window Mode: Stricter blur/focus monitoring
  useEffect(() => {
    if (!isSecureWindow) return

    const handleWindowBlur = () => {
      // Window lost focus - likely tab switch or another window
      const newCount = tabSwitchCount + 1
      setTabSwitchCount(newCount)
      
      const maxAllowed = assessmentData?.proctoring?.max_tab_switch_allowed ?? -1
      
      // Log the event
      logProctoringEvent('WINDOW_BLUR', { count: newCount, maxAllowed })
      
      // Show modal with warning
      setShowTabSwitchModal(true)
      
      // Check if limit exceeded or if limit is 0 (no tab switch allowed)
      if (maxAllowed >= 0 && (maxAllowed === 0 || newCount > maxAllowed)) {
        setIsTabLimitExceeded(true)
        // Don't restart countdown if already running
        if (!countdownTimerRef.current) {
          startExceededCountdown()
        }
      } else if (maxAllowed >= 0) {
        setIsTabLimitExceeded(false)
      }
    }

    const handleWindowFocus = () => {
      // Window regained focus
      // Re-enter fullscreen if not in fullscreen
      if (!document.fullscreenElement && !pendingFullscreenExit) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
      
      // Only clear countdown if limit NOT exceeded
      if (!isTabLimitExceeded && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isSecureWindow, tabSwitchCount, assessmentData, pendingFullscreenExit, isTabLimitExceeded])

  // Timer logic
  useEffect(() => {
    if (!assessmentData || timeRemaining <= 0) return

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })

      // Increment total time worked
      setTotalTimeWorked(prev => prev + 1)

      if (assessmentData.timing_mode !== 'OVERALL') {
        setSegmentTimeRemaining(prev => {
          if (prev <= 1) {
            handleSegmentTimeout()
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [assessmentData, timeRemaining])

  // Proctoring: Tab visibility - Show modal on focus out
  useEffect(() => {
    if (!assessmentData?.proctoring?.proctoring_enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1
        setTabSwitchCount(newCount)
        
        const maxAllowed = assessmentData.proctoring.max_tab_switch_allowed ?? -1
        
        // Log the tab switch event
        logProctoringEvent('TAB_SWITCH', { count: newCount, maxAllowed })
        
        // Show modal with warning
        setShowTabSwitchModal(true)
        
        // Check if limit exceeded or if limit is 0 (no tab switch allowed)
        if (maxAllowed >= 0 && (maxAllowed === 0 || newCount > maxAllowed)) {
          setIsTabLimitExceeded(true)
          // Don't restart countdown if already running
          if (!countdownTimerRef.current) {
            startExceededCountdown()
          }
        } else {
          setIsTabLimitExceeded(false)
        }
      } else {
        // User returned to tab - only clear countdown if limit NOT exceeded
        if (!isTabLimitExceeded && countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [assessmentData, tabSwitchCount, isTabLimitExceeded])

  // Proctoring: Fullscreen change
  useEffect(() => {
    if (!assessmentData?.proctoring?.full_screen_mandatory) return

    const handleFullScreenChange = () => {
      const isFS = !!document.fullscreenElement
      setIsFullScreen(isFS)
      
      // If user exited fullscreen without confirming, re-enter fullscreen
      if (!isFS && assessmentData?.proctoring?.full_screen_mandatory && !pendingFullscreenExit) {
        // Re-enter fullscreen immediately
        document.documentElement.requestFullscreen().catch(() => {
          setProctoringWarning('Please return to fullscreen mode to continue.')
        })
        logProctoringEvent('FULLSCREEN_EXIT_ATTEMPT')
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [assessmentData, pendingFullscreenExit])

  // Proctoring: Escape key prevention - show warning modal instead
  useEffect(() => {
    if (!assessmentData?.proctoring?.full_screen_mandatory) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault()
        e.stopPropagation()
        setShowFullscreenExitModal(true)
      }
    }

    // Capture escape key before it triggers fullscreen exit
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [assessmentData, isFullScreen])

  // Proctoring: Copy/Paste prevention
  useEffect(() => {
    if (!assessmentData?.proctoring?.disable_copy_paste) return

    const preventDefault = (e) => {
      e.preventDefault()
      toast.warning('Copy/Paste is disabled for this assessment')
    }

    document.addEventListener('copy', preventDefault)
    document.addEventListener('paste', preventDefault)
    document.addEventListener('cut', preventDefault)

    return () => {
      document.removeEventListener('copy', preventDefault)
      document.removeEventListener('paste', preventDefault)
      document.removeEventListener('cut', preventDefault)
    }
  }, [assessmentData])

  // Proctoring: Right-click prevention
  useEffect(() => {
    if (!assessmentData?.proctoring?.disable_right_click) return

    const preventContextMenu = (e) => {
      e.preventDefault()
    }

    document.addEventListener('contextmenu', preventContextMenu)
    return () => document.removeEventListener('contextmenu', preventContextMenu)
  }, [assessmentData])

  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullScreen(true)
      setPendingFullscreenExit(false)
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const handleConfirmExitFullscreen = () => {
    setPendingFullscreenExit(true)
    setShowFullscreenExitModal(false)
    logProctoringEvent('FULLSCREEN_EXIT_CONFIRMED')
    
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false)
        setProctoringWarning('You have exited fullscreen mode. Click "Return to Fullscreen" to continue.')
      })
    }
  }

  const handleCancelExitFullscreen = () => {
    setShowFullscreenExitModal(false)
  }

  const handleReturnToFullscreen = () => {
    setProctoringWarning(null)
    enterFullScreen()
  }

  const logProctoringEvent = async (eventType, details = {}) => {
    try {
      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/proctoring-log`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ event_type: eventType, details })
      })
    } catch (error) {
      console.error('Failed to log proctoring event:', error)
    }
  }

  // Save progress to server (called periodically)
  const saveProgress = useCallback(async () => {
    if (!apiBaseUrl || !mappingId || !assessmentData) return
    
    try {
      // Get current segment info for segment_id and time_spent calculation
      const currentSegment = assessmentData?.segments?.[currentSegmentIndex]
      const segmentId = currentSegment?.id || null
      const segmentDuration = currentSegment?.segment_duration || 0
      const timeSpent = segmentDuration - segmentTimeRemaining // Calculate time spent in current segment

      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-progress`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          current_segment_index: currentSegmentIndex,
          current_question_index: currentQuestionIndex,
          time_remaining: timeRemaining,
          segment_time_remaining: segmentTimeRemaining,
          total_time_worked: totalTimeWorked,
          segment_id: segmentId,
          time_spent: timeSpent > 0 ? timeSpent : 0
        })
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }, [apiBaseUrl, mappingId, assessmentData, currentSegmentIndex, currentQuestionIndex, timeRemaining, segmentTimeRemaining, totalTimeWorked])

  // Auto-save progress at regular intervals
  useEffect(() => {
    if (!assessmentData) return
    
    // Save progress every PROGRESS_SAVE_INTERVAL seconds
    progressSaveRef.current = setInterval(() => {
      saveProgress()
    }, PROGRESS_SAVE_INTERVAL * 1000)
    
    // Also save on page unload
    const handleBeforeUnload = () => {
      saveProgress()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      if (progressSaveRef.current) {
        clearInterval(progressSaveRef.current)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [assessmentData, saveProgress])

  const handleAutoSubmit = async () => {
    toast.info('Time is up! Auto-submitting your assessment...')
    await submitAssessment(true)
  }

  // Start countdown when tab switch limit is exceeded
  const startExceededCountdown = () => {
    // Clear any existing countdown
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    
    setTabSwitchCountdown(5)
    
    // Use a more robust approach - store the end time and calculate remaining
    const endTime = Date.now() + 5000
    
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000)
      
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        setTabSwitchCountdown(0)
        
        // Auto-submit and close popup
        submitAssessment(true).then(() => {
          // Close the popup window after submission
          if (isSecureWindow) {
            toast.success('Assessment submitted. Closing window...')
            setTimeout(() => {
              window.close()
            }, 1500)
          }
        })
      } else {
        setTabSwitchCountdown(remaining)
      }
    }, 100) // Check more frequently for smoother countdown
  }

  const handleSegmentTimeout = () => {
    if (currentSegmentIndex < (assessmentData?.segments?.length || 1) - 1) {
      setShowSegmentEndModal(true)
    } else {
      handleAutoSubmit()
    }
  }

  // Answer handling
  const handleAnswerChange = async (questionId, answer, type) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    // Auto-save answer
    try {
      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          question_id: questionId,
          question_type: type,
          answer: answer
        })
      })
    } catch (error) {
      console.error('Failed to save answer:', error)
    }
  }

  // Navigation
  const currentQuestion = questions[currentQuestionIndex]
  const currentSegment = assessmentData?.segments?.[currentSegmentIndex]
  
  // Always allow going back within the same segment
  const canGoBack = currentQuestionIndex > 0
  const canGoNext = currentQuestionIndex < questions.length - 1
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (isLastQuestion) {
      setShowSubmitModal(true)
    }
  }

  const handleJumpToQuestion = (index) => {
    // Always allow jumping to any question within the current segment
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }

  const handleMoveToNextSegment = async () => {
    setShowSegmentEndModal(false)
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/next-segment`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSegmentIndex(prev => prev + 1)
        setQuestions(data.questions || [])
        setCurrentQuestionIndex(0)
        setSegmentTimeRemaining(data.segment_duration)
        setAnswers(prev => ({ ...prev, ...data.saved_answers }))
      }
    } catch (error) {
      console.error('Error moving to next segment:', error)
      toast.error('Failed to move to next segment')
    }
  }

  const handleSegmentSwitch = async (targetIndex) => {
    if (targetIndex === currentSegmentIndex) return
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/switch-segment`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ segment_index: targetIndex })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSegmentIndex(targetIndex)
        setQuestions(data.questions || [])
        setCurrentQuestionIndex(0)
        setSegmentTimeRemaining(data.segment_duration || 0)
        setAnswers(prev => ({ ...prev, ...data.saved_answers }))
        toast.success(`Switched to ${assessmentData.segments[targetIndex]?.name || 'segment'}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Cannot switch segment')
      }
    } catch (error) {
      console.error('Error switching segment:', error)
      toast.error('Failed to switch segment')
    }
  }

  // Submission
  const submitAssessment = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/submit`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          answers,
          is_auto_submit: isAutoSubmit,
          time_taken: (assessmentData?.total_duration || 0) - timeRemaining
        })
      })

      if (!response.ok) throw new Error('Failed to submit')

      const data = await response.json()
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }

      toast.success('Assessment submitted successfully!')
      
      // If in secure window mode, close the window
      if (isSecureWindow) {
        // Show success message before closing
        setTimeout(() => {
          window.close()
          // If window.close() fails (some browsers block it), navigate instead
          if (!window.closed) {
            navigate('/user/assessments')
          }
        }, 2000)
      } else {
        if (data.show_score) {
          navigate(`/user/assessments/${mappingId}/results`, {
            state: { immediate: true, score: data.score }
          })
        } else {
          navigate('/user/assessments')
        }
      }
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Failed to submit assessment')
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  // Utility functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (index) => {
    const q = questions[index]
    if (!q) return ''
    if (answers[q.id]) return 'answered'
    if (index === currentQuestionIndex) return 'current'
    if (index < currentQuestionIndex) return 'visited'
    return ''
  }

  const getAnsweredCount = () => {
    return questions.filter(q => answers[q.id]).length
  }

  if (loading) {
    return (
      <div className={`${styles.assessmentTakePage} ${styles.loading}`}>
        <div className={styles.spinner}></div>
        <p>Loading assessment...</p>
      </div>
    )
  }

  if (!assessmentData) {
    return (
      <div className={`${styles.assessmentTakePage} ${styles.error}`}>
        <h3>Could not load assessment</h3>
        <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
      </div>
    )
  }

  return (
    <div className={`${styles.assessmentTakePage} ${isFullScreen ? styles.fullscreen : ''}`}>
      {/* Proctoring Warning */}
      {proctoringWarning && (
        <div className={styles.proctoringWarning}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{proctoringWarning}</span>
          {pendingFullscreenExit && assessmentData?.proctoring?.full_screen_mandatory && (
            <button 
              onClick={handleReturnToFullscreen}
              style={{ 
                background: 'white', 
                color: 'var(--error)', 
                padding: '4px 12px', 
                borderRadius: '4px',
                fontWeight: '600',
                marginLeft: '8px'
              }}
            >
              Return to Fullscreen
            </button>
          )}
          <button onClick={() => setProctoringWarning(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <header className={styles.assessmentHeader}>
        <div className={styles.headerLeft}>
          <h1>{assessmentData.display_name}</h1>
          {currentSegment && (
            <span className={styles.segmentBadge}>{currentSegment.name}</span>
          )}
        </div>
        
        <div className={styles.headerCenter}>
          <div className={styles.timer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className={timeRemaining < 300 ? styles.timerWarning : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          {assessmentData.timing_mode !== 'OVERALL' && (
            <div className={`${styles.timer} ${styles.segmentTimer}`}>
              <span className={styles.timerLabel}>Segment:</span>
              <span className={segmentTimeRemaining < 60 ? styles.timerWarning : ''}>
                {formatTime(segmentTimeRemaining)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          <span className={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button 
            className={styles.toggleNavBtn}
            onClick={() => setShowQuestionNav(!showQuestionNav)}
            title={showQuestionNav ? 'Hide navigation' : 'Show navigation'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.assessmentBody}>
        {/* Question Area */}
        <main className={styles.questionArea}>
          {currentQuestion ? (
            <div className={styles.questionContainer}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {currentQuestionIndex + 1}</span>
                <span className={styles.questionType}>
                  {(currentQuestion.type === 'PROGRAMMING' || currentQuestion.question_type === 'PROGRAMMING') ? 'Coding' : 'MCQ'}
                </span>
              </div>

              {(currentQuestion.type === 'MCQ' || currentQuestion.question_type === 'MCQ') ? (
                <div className={styles.mcqQuestion}>
                  <div className={styles.questionText} dangerouslySetInnerHTML={{ 
                    __html: currentQuestion.question_text || currentQuestion.name || currentQuestion.description || 'Question not available' 
                  }} />
                  
                  <div className={styles.optionsList}>
                    {(currentQuestion.options || []).map((option, idx) => {
                      const optionValue = option.value || option.id
                      const optionText = option.text || option.option_text || `Option ${idx + 1}`
                      const isMultiSelect = currentQuestion.is_multiselect || currentQuestion.is_multi_select
                      const currentAnswer = answers[currentQuestion.id]
                      const isSelected = isMultiSelect
                        ? (Array.isArray(currentAnswer) && currentAnswer.includes(optionValue))
                        : currentAnswer === optionValue
                      
                      return (
                        <label 
                          key={option.id || idx} 
                          className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                        >
                          <input
                            type={isMultiSelect ? 'checkbox' : 'radio'}
                            name={`question-${currentQuestion.id}`}
                            value={optionValue}
                            checked={isSelected}
                            onChange={(e) => {
                              if (isMultiSelect) {
                                const current = Array.isArray(currentAnswer) ? currentAnswer : []
                                const newVal = e.target.checked 
                                  ? [...current, optionValue]
                                  : current.filter(v => v !== optionValue)
                                handleAnswerChange(currentQuestion.id, newVal, 'MCQ')
                              } else {
                                handleAnswerChange(currentQuestion.id, optionValue, 'MCQ')
                              }
                            }}
                          />
                          <span className={styles.optionMarker}>{String.fromCharCode(65 + idx)}</span>
                          <span className={styles.optionText} dangerouslySetInnerHTML={{ __html: optionText }} />
                        </label>
                      )
                    })}
                  </div>
                  {(!currentQuestion.options || currentQuestion.options.length === 0) && (
                    <p className={styles.noOptions}>No options available for this question.</p>
                  )}
                </div>
              ) : (currentQuestion.type === 'PROGRAMMING' || currentQuestion.question_type === 'PROGRAMMING') ? (
                <div className={styles.programmingQuestion}>
                  {/* Problem Statement Panel */}
                  <div className={styles.problemPanel}>
                    <div className={styles.problemContent}>
                      {/* Problem Description */}
                      <div className={styles.problemDescription}>
                        <h4 className={styles.sectionTitle}>Description</h4>
                        <div className={styles.descriptionContent} dangerouslySetInnerHTML={{ 
                          __html: currentQuestion.problem_statement || currentQuestion.description || currentQuestion.name || 'Question not available' 
                        }} />
                      </div>
                      
                      {/* Input/Output Format if available */}
                      {(currentQuestion.input_format || currentQuestion.output_format) && (
                        <div className={styles.formatSection}>
                          {currentQuestion.input_format && (
                            <div className={styles.formatBlock}>
                              <h4 className={styles.sectionTitle}>Input Format</h4>
                              <div className={styles.formatContent} dangerouslySetInnerHTML={{ __html: currentQuestion.input_format }} />
                            </div>
                          )}
                          {currentQuestion.output_format && (
                            <div className={styles.formatBlock}>
                              <h4 className={styles.sectionTitle}>Output Format</h4>
                              <div className={styles.formatContent} dangerouslySetInnerHTML={{ __html: currentQuestion.output_format }} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Constraints */}
                      {currentQuestion.constraints && (
                        <div className={styles.constraintsSection}>
                          <h4 className={styles.sectionTitle}>Constraints</h4>
                          <div className={styles.constraintsContent} dangerouslySetInnerHTML={{ __html: currentQuestion.constraints }} />
                        </div>
                      )}
                    
                      {/* Examples */}
                      {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                        <div className={styles.examplesSection}>
                          <h4 className={styles.sectionTitle}>Examples</h4>
                          {currentQuestion.examples.map((example, idx) => (
                            <div key={idx} className={styles.exampleItem}>
                              <div className={styles.exampleHeader}>Example {idx + 1}</div>
                              <div className={styles.exampleIo}>
                                <div className={styles.ioBlock}>
                                  <span className={styles.ioLabel}>Input:</span>
                                  <pre className={styles.ioContent}>{example.input}</pre>
                                </div>
                                <div className={styles.ioBlock}>
                                  <span className={styles.ioLabel}>Output:</span>
                                  <pre className={styles.ioContent}>{example.output}</pre>
                                </div>
                              </div>
                              {example.explanation && (
                                <div className={styles.exampleExplanation}>
                                  <span className={styles.ioLabel}>Explanation:</span>
                                  <p>{example.explanation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sample Test Cases (non-hidden) */}
                      {(() => {
                        const visibleTestCases = (currentQuestion.test_cases || []).filter(tc => !tc.is_hidden);
                        if (visibleTestCases.length === 0) return null;
                        return (
                          <div className={styles.testCasesSection}>
                            <h4 className={styles.sectionTitle}>Sample Test Cases</h4>
                            <div className={styles.testCasesList}>
                              {visibleTestCases.map((testCase, idx) => (
                                <div key={testCase.id || idx} className={styles.testCaseItem}>
                                  <div className={styles.testCaseHeader}>
                                    <span className={styles.testCaseNumber}>Test Case {idx + 1}</span>
                                    {testCase.description && <span className={styles.testCaseDesc}>{testCase.description}</span>}
                                  </div>
                                  <div className={styles.testCaseIo}>
                                    <div className={styles.ioBlock}>
                                      <span className={styles.ioLabel}>Input:</span>
                                      <pre className={styles.ioContent}>{testCase.input || testCase.input_data}</pre>
                                    </div>
                                    <div className={styles.ioBlock}>
                                      <span className={styles.ioLabel}>Expected Output:</span>
                                      <pre className={styles.ioContent}>{testCase.expected_output || testCase.output}</pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className={styles.hiddenTestsNote}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                              </svg>
                              Additional hidden test cases will be used to evaluate your solution.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Code Editor Section */}
                  <div className={styles.codeEditorWrapper}>
                    <CodeEditor
                      questionId={currentQuestion.id}
                      initialCode={answers[currentQuestion.id] || currentQuestion.boilerplate_code || ''}
                      allowedLanguages={currentQuestion.allowed_languages || []}
                      codeTemplates={currentQuestion.code_templates || []}
                      testCases={currentQuestion.test_cases || []}
                      assessmentMode={true}
                      assessmentMappingId={mappingId}
                      onSubmit={async (submissionData) => {
                        // Save the code answer for this question
                        handleAnswerChange(currentQuestion.id, submissionData.code, 'PROGRAMMING')
                        
                        // Submit to assessment-specific endpoint
                        try {
                          const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/submit-code`, {
                            method: 'POST',
                            headers: getAuthHeader(),
                            body: JSON.stringify({
                              question_id: currentQuestion.id,
                              code: submissionData.code,
                              language: submissionData.language
                            })
                          })
                          
                          if (response.ok) {
                            const data = await response.json()
                            const visiblePassed = data.test_cases_passed - (data.hidden_passed || 0)
                            const visibleTotal = data.test_cases_total - (data.hidden_total || 0)
                            toast.success(`Code submitted! ${data.test_cases_passed}/${data.test_cases_total} test cases passed`)
                            return { 
                              success: true, 
                              testCasesPassed: data.test_cases_passed,
                              testCasesTotal: data.test_cases_total,
                              score: data.score,
                              results: data.results,
                              hiddenPassed: data.hidden_passed,
                              hiddenTotal: data.hidden_total
                            }
                          } else {
                            toast.error('Failed to submit code')
                          }
                        } catch (error) {
                          console.error('Code submission error:', error)
                          toast.error('Code submission error')
                        }
                        return { success: false }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.unknownQuestion}>
                  <div className={styles.questionText} dangerouslySetInnerHTML={{ __html: currentQuestion.description || currentQuestion.name || 'Question content not available' }} />
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noQuestion}>
              <p>No question available</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            <Button 
              variant="secondary" 
              onClick={handlePrevious}
              disabled={!canGoBack}
            >
              Previous
            </Button>
            <Button 
              variant="primary" 
              onClick={handleNext}
            >
              {isLastQuestion ? 'Review & Submit' : 'Next'}
            </Button>
          </div>
        </main>

        {/* Question Navigation Panel */}
        {showQuestionNav && (
          <aside className={`${styles.questionNav} ${showQuestionNav ? styles.questionNavVisible : ''}`}>
            {/* Segments Section */}
            {assessmentData?.segments && assessmentData.segments.length > 1 && (
              <div className={styles.segmentsSection}>
                <h3>Segments</h3>
                <div className={styles.segmentsList}>
                  {assessmentData.segments.map((segment, index) => {
                    const isCurrentSegment = index === currentSegmentIndex
                    const isPastSegment = index < currentSegmentIndex
                    const isFutureSegment = index > currentSegmentIndex
                    const canSwitch = assessmentData.allow_segment_switch && !isPastSegment
                    
                    return (
                      <button
                        key={segment.id}
                        className={`${styles.segmentItem} ${isCurrentSegment ? styles.segmentItemCurrent : ''} ${isPastSegment ? styles.segmentItemCompleted : ''} ${isFutureSegment ? styles.segmentItemUpcoming : ''}`}
                        onClick={() => canSwitch && handleSegmentSwitch(index)}
                        disabled={!canSwitch}
                        title={!canSwitch && isFutureSegment ? 'Complete current segment first' : (isPastSegment ? 'Segment completed' : segment.name)}
                      >
                        <span className={styles.segmentNumber}>{index + 1}</span>
                        <span className={styles.segmentName}>{segment.name}</span>
                        {isCurrentSegment && <span className={styles.segmentBadgeCurrent}>Current</span>}
                        {isPastSegment && (
                          <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className={styles.navHeader}>
              <h3>Questions</h3>
              <div className={styles.navStats}>
                <span className={`${styles.stat} ${styles.statAnswered}`}>{getAnsweredCount()} answered</span>
                <span className={styles.stat}>{questions.length - getAnsweredCount()} remaining</span>
              </div>
            </div>
            <div className={styles.navGrid}>
              {questions.map((q, index) => {
                const status = getQuestionStatus(index)
                return (
                  <button
                    key={q.id || index}
                    className={`${styles.navItem} ${status === 'current' ? styles.navItemCurrent : ''} ${status === 'answered' ? styles.navItemAnswered : ''} ${status === 'visited' ? styles.navItemVisited : ''}`}
                    onClick={() => handleJumpToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <div className={styles.navLegend}>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotCurrent}`}></span> Current</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotAnswered}`}></span> Answered</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotVisited}`}></span> Visited</span>
              <span className={styles.legendItem}><span className={styles.dot}></span> Not visited</span>
            </div>
            <button 
              className={styles.submitBtn}
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Assessment
            </button>
          </aside>
        )}
      </div>

      {/* Fullscreen Exit Warning Modal */}
      {showFullscreenExitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>⚠️ Exit Fullscreen?</h2>
            <p className={styles.warningText}>
              This assessment requires fullscreen mode for proctoring purposes. 
              Exiting fullscreen will be logged and may affect your assessment.
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Are you sure you want to exit fullscreen mode?
            </p>
            <div className={styles.modalActions}>
              <button 
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} 
                onClick={handleCancelExitFullscreen}
              >
                Stay in Fullscreen
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.modalBtnSecondary}`} 
                onClick={handleConfirmExitFullscreen}
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Submit Assessment?</h2>
            <div className={styles.submitSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Questions</span>
                <span className={styles.summaryValue}>{questions.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Answered</span>
                <span className={`${styles.summaryValue} ${styles.summaryValueSuccess}`}>{getAnsweredCount()}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Unanswered</span>
                <span className={`${styles.summaryValue} ${styles.summaryValueWarning}`}>{questions.length - getAnsweredCount()}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Time Remaining</span>
                <span className={styles.summaryValue}>{formatTime(timeRemaining)}</span>
              </div>
            </div>
            {questions.length - getAnsweredCount() > 0 && (
              <p className={styles.warningText}>
                You have {questions.length - getAnsweredCount()} unanswered question(s). 
                Are you sure you want to submit?
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnSecondary}`} onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                Continue Assessment
              </button>
              <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => submitAssessment(false)} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment End Modal */}
      {showSegmentEndModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Segment Complete</h2>
            <p>You have completed "{currentSegment?.name}". Ready to move to the next segment?</p>
            <p className={styles.note}>Note: You will not be able to return to this segment.</p>
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleMoveToNextSegment}>
                Continue to Next Segment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Window Warning Modal (Secure Mode) */}
      {showCloseWarning && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>⛔ Cannot Close Window</h2>
            <p className={styles.warningText}>
              You cannot close this window while the assessment is in progress. 
              Closing or minimizing this window is not allowed during proctored assessments.
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Please complete and submit the assessment to close this window.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} 
                onClick={() => setShowCloseWarning(false)}
              >
                Continue Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showTabSwitchModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.tabSwitchModal}`}>
            {isTabLimitExceeded ? (
              <>
                <div className={styles.warningIcon}>⚠️</div>
                <h2 className={styles.errorTitle}>Tab Switch Limit Exceeded!</h2>
                <p className={styles.warningText}>
                  You have exceeded the maximum number of allowed tab switches.
                  Your assessment will be automatically submitted.
                </p>
                <div className={styles.countdownContainer}>
                  <div className={styles.countdownCircle}>
                    <span className={styles.countdownNumber}>{tabSwitchCountdown}</span>
                  </div>
                  <p className={styles.countdownText}>
                    Assessment will be submitted in {tabSwitchCountdown} second{tabSwitchCountdown !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className={styles.submittingMessage}>
                  Please wait while we submit your assessment...
                </p>
              </>
            ) : (
              <>
                <div className={styles.warningIcon}>⚠️</div>
                <h2 className={styles.warningTitle}>Tab Switch Detected!</h2>
                <p className={styles.warningText}>
                  You switched away from the assessment window. This action has been recorded.
                </p>
                <p className={styles.tabSwitchInfo}>
                  Tab switches: <strong>{tabSwitchCount}</strong> / {assessmentData?.proctoring?.max_tab_switch_allowed ?? '∞'}
                </p>
                {(assessmentData?.proctoring?.max_tab_switch_allowed ?? -1) >= 0 && (
                  <p className={styles.tabSwitchWarning}>
                    ⚠️ {assessmentData.proctoring.max_tab_switch_allowed - tabSwitchCount} more switch{assessmentData.proctoring.max_tab_switch_allowed - tabSwitchCount !== 1 ? 'es' : ''} allowed before auto-submission
                  </p>
                )}
                <div className={styles.modalActions}>
                  <button 
                    className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} 
                    onClick={() => setShowTabSwitchModal(false)}
                  >
                    Continue Assessment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentTake
