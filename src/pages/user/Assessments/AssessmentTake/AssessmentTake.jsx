import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentTake.css'

function AssessmentTake() {
  const { mappingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { apiBaseUrl, accessToken } = useApi()
  
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
  const timerRef = useRef(null)
  
  // UI state
  const [showQuestionNav, setShowQuestionNav] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showSegmentEndModal, setShowSegmentEndModal] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  
  // Proctoring state
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [proctoringWarning, setProctoringWarning] = useState(null)

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

      if (!response.ok) throw new Error('Failed to fetch assessment')

      const data = await response.json()
      setAssessmentData(data)
      setQuestions(data.questions || [])
      setTimeRemaining(data.time_remaining || data.total_duration)
      setSegmentTimeRemaining(data.current_segment?.time_remaining || data.segments?.[0]?.segment_duration || 0)
      setCurrentSegmentIndex(data.current_segment_index || 0)
      setCurrentQuestionIndex(data.current_question_index || 0)
      
      // Restore saved answers
      if (data.saved_answers) {
        setAnswers(data.saved_answers)
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
    }
  }, [fetchAssessmentData])

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

  // Proctoring: Tab visibility
  useEffect(() => {
    if (!assessmentData?.proctoring?.proctoring_enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1
        setTabSwitchCount(newCount)
        
        const maxAllowed = assessmentData.proctoring.max_tab_switch_allowed
        if (maxAllowed >= 0 && newCount > maxAllowed) {
          setProctoringWarning(`Tab switch limit exceeded! Your assessment will be submitted.`)
          setTimeout(() => handleAutoSubmit(), 3000)
        } else if (maxAllowed >= 0) {
          setProctoringWarning(`Tab switch detected! (${newCount}/${maxAllowed} allowed)`)
          logProctoringEvent('TAB_SWITCH')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [assessmentData, tabSwitchCount])

  // Proctoring: Fullscreen change
  useEffect(() => {
    if (!assessmentData?.proctoring?.full_screen_mandatory) return

    const handleFullScreenChange = () => {
      const isFS = !!document.fullscreenElement
      setIsFullScreen(isFS)
      if (!isFS && assessmentData?.proctoring?.full_screen_mandatory) {
        setProctoringWarning('Please return to fullscreen mode to continue.')
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [assessmentData])

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
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
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

  const handleAutoSubmit = async () => {
    toast.info('Time is up! Auto-submitting your assessment...')
    await submitAssessment(true)
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
  
  const canGoBack = assessmentData?.allow_back_navigation && currentQuestionIndex > 0
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
    if (assessmentData?.allow_back_navigation || index > currentQuestionIndex) {
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
      
      if (data.show_score) {
        navigate(`/user/assessments/${mappingId}/results`, {
          state: { immediate: true, score: data.score }
        })
      } else {
        navigate('/user/assessments')
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
      <div className="assessment-take-page loading">
        <div className="spinner"></div>
        <p>Loading assessment...</p>
      </div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="assessment-take-page error">
        <h3>Could not load assessment</h3>
        <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
      </div>
    )
  }

  return (
    <div className={`assessment-take-page ${isFullScreen ? 'fullscreen' : ''}`}>
      {/* Proctoring Warning */}
      {proctoringWarning && (
        <div className="proctoring-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{proctoringWarning}</span>
          <button onClick={() => setProctoringWarning(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <header className="assessment-header">
        <div className="header-left">
          <h1>{assessmentData.display_name}</h1>
          {currentSegment && (
            <span className="segment-badge">{currentSegment.name}</span>
          )}
        </div>
        
        <div className="header-center">
          <div className="timer overall-timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className={timeRemaining < 300 ? 'warning' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          {assessmentData.timing_mode !== 'OVERALL' && (
            <div className="timer segment-timer">
              <span className="timer-label">Segment:</span>
              <span className={segmentTimeRemaining < 60 ? 'warning' : ''}>
                {formatTime(segmentTimeRemaining)}
              </span>
            </div>
          )}
        </div>

        <div className="header-right">
          <span className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button 
            className="toggle-nav-btn"
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

      <div className="assessment-body">
        {/* Question Area */}
        <main className="question-area">
          {currentQuestion ? (
            <div className="question-container">
              <div className="question-header">
                <span className="question-number">Question {currentQuestionIndex + 1}</span>
                <span className="question-type">{currentQuestion.type === 'PROGRAMMING' ? 'Coding' : 'MCQ'}</span>
                {currentQuestion.weightage && (
                  <span className="question-marks">{currentQuestion.weightage} marks</span>
                )}
              </div>

              {currentQuestion.type === 'MCQ' ? (
                <div className="mcq-question">
                  <div className="question-text" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />
                  
                  <div className="options-list">
                    {currentQuestion.options?.map((option, idx) => (
                      <label 
                        key={idx} 
                        className={`option-item ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                      >
                        <input
                          type={currentQuestion.is_multiselect ? 'checkbox' : 'radio'}
                          name={`question-${currentQuestion.id}`}
                          value={option.value}
                          checked={
                            currentQuestion.is_multiselect
                              ? (answers[currentQuestion.id] || []).includes(option.value)
                              : answers[currentQuestion.id] === option.value
                          }
                          onChange={(e) => {
                            if (currentQuestion.is_multiselect) {
                              const current = answers[currentQuestion.id] || []
                              const newVal = e.target.checked 
                                ? [...current, option.value]
                                : current.filter(v => v !== option.value)
                              handleAnswerChange(currentQuestion.id, newVal, 'MCQ')
                            } else {
                              handleAnswerChange(currentQuestion.id, option.value, 'MCQ')
                            }
                          }}
                        />
                        <span className="option-marker">{String.fromCharCode(65 + idx)}</span>
                        <span className="option-text">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="programming-question">
                  <div className="question-text" dangerouslySetInnerHTML={{ __html: currentQuestion.problem_statement }} />
                  
                  {currentQuestion.examples && (
                    <div className="examples-section">
                      <h4>Examples:</h4>
                      {currentQuestion.examples.map((example, idx) => (
                        <div key={idx} className="example-item">
                          <div className="example-io">
                            <div>
                              <span className="io-label">Input:</span>
                              <pre>{example.input}</pre>
                            </div>
                            <div>
                              <span className="io-label">Output:</span>
                              <pre>{example.output}</pre>
                            </div>
                          </div>
                          {example.explanation && (
                            <div className="example-explanation">
                              <span className="io-label">Explanation:</span>
                              <p>{example.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="code-editor-section">
                    <div className="editor-header">
                      <select className="language-select">
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                    <textarea
                      className="code-editor"
                      value={answers[currentQuestion.id] || currentQuestion.boilerplate_code || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'PROGRAMMING')}
                      placeholder="Write your code here..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-question">
              <p>No question available</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
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
          <aside className="question-nav">
            <div className="nav-header">
              <h3>Questions</h3>
              <div className="nav-stats">
                <span className="stat answered">{getAnsweredCount()} answered</span>
                <span className="stat remaining">{questions.length - getAnsweredCount()} remaining</span>
              </div>
            </div>
            <div className="nav-grid">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  className={`nav-item ${getQuestionStatus(index)}`}
                  onClick={() => handleJumpToQuestion(index)}
                  disabled={!assessmentData.allow_back_navigation && index < currentQuestionIndex}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="nav-legend">
              <span className="legend-item"><span className="dot current"></span> Current</span>
              <span className="legend-item"><span className="dot answered"></span> Answered</span>
              <span className="legend-item"><span className="dot visited"></span> Visited</span>
              <span className="legend-item"><span className="dot"></span> Not visited</span>
            </div>
            <Button 
              variant="primary" 
              className="submit-btn"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Assessment
            </Button>
          </aside>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Submit Assessment?</h2>
            <div className="submit-summary">
              <div className="summary-item">
                <span className="label">Total Questions</span>
                <span className="value">{questions.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Answered</span>
                <span className="value success">{getAnsweredCount()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Unanswered</span>
                <span className="value warning">{questions.length - getAnsweredCount()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Time Remaining</span>
                <span className="value">{formatTime(timeRemaining)}</span>
              </div>
            </div>
            {questions.length - getAnsweredCount() > 0 && (
              <p className="warning-text">
                You have {questions.length - getAnsweredCount()} unanswered question(s). 
                Are you sure you want to submit?
              </p>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                Continue Assessment
              </Button>
              <Button variant="primary" onClick={() => submitAssessment(false)} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Segment End Modal */}
      {showSegmentEndModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Segment Complete</h2>
            <p>You have completed "{currentSegment?.name}". Ready to move to the next segment?</p>
            <p className="note">Note: You will not be able to return to this segment.</p>
            <div className="modal-actions">
              <Button variant="primary" onClick={handleMoveToNextSegment}>
                Continue to Next Segment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentTake

