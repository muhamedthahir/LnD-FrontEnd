import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import CodeEditor from '../../../CodeEditor/CodeEditor'
import './CourseAssessment.css'

function CourseAssessment() {
  const { apiBaseUrl, accessToken } = useApi()
  const { courseId, segmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  
  const [segment, setSegment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(40)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  // Assessment content - this would typically be fetched from the segment content
  const [assessmentQuestions, setAssessmentQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submittedAssessment, setSubmittedAssessment] = useState(false)
  const [assessmentResults, setAssessmentResults] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    if (segmentId) {
      fetchSegment()
    }
  }, [segmentId])

  useEffect(() => {
    let timer
    if (timerActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            handleSubmitAssessment()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [timerActive, timeRemaining])

  const fetchSegment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET(segmentId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) throw new Error('Failed to fetch segment')
      const data = await response.json()
      setSegment(data)

      // Parse assessment content if available
      if (data.content) {
        try {
          const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
          if (content.questions) {
            setAssessmentQuestions(content.questions)
          }
          if (content.duration) {
            setTimeRemaining(content.duration * 60) // Convert minutes to seconds
          }
        } catch (e) {
          console.error('Error parsing assessment content:', e)
        }
      }
    } catch (error) {
      console.error('Error fetching segment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartAssessment = () => {
    setStarted(true)
    if (timeRemaining) {
      setTimerActive(true)
    }
  }

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (submittedAssessment) return
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleGoToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const handleSubmitAssessment = async () => {
    setTimerActive(false)
    
    // Calculate results
    let correctCount = 0
    const questionResults = assessmentQuestions.map((q, index) => {
      const selectedIndex = selectedAnswers[q.id || index]
      const isCorrect = selectedIndex === q.correct_option_index
      if (isCorrect) correctCount++
      
      return {
        questionId: q.id || index,
        selectedIndex,
        correctIndex: q.correct_option_index,
        isCorrect
      }
    })

    const results = {
      totalQuestions: assessmentQuestions.length,
      correctAnswers: correctCount,
      score: Math.round((correctCount / assessmentQuestions.length) * 100),
      questionResults
    }

    setAssessmentResults(results)
    setSubmittedAssessment(true)

    // Optionally save results to backend
    try {
      await fetch(`${apiBaseUrl}/api/user-courses/complete-segment/${courseId}/${segmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          score: results.score,
          details: results
        })
      })
      
      // Trigger progress update event
      window.dispatchEvent(new CustomEvent('courseProgressUpdated', { detail: { courseId } }))
    } catch (error) {
      console.error('Error saving assessment results:', error)
    }
  }

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}/current`)
  }

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length
  }

  if (loading) {
    return (
      <div className="course-assessment-page">
        <div className="loading">Loading assessment...</div>
      </div>
    )
  }

  const currentQuestion = assessmentQuestions[currentQuestionIndex]

  // Before starting
  if (!started) {
    return (
      <div className="course-assessment-page">
        <div className="assessment-intro">
          <button className="btn-back" onClick={handleBackToCourse}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div className="intro-card">
            <div className="intro-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            
            <h1>{segment?.name || segment?.title || 'Assessment'}</h1>
            {segment?.description && <p className="intro-description">{segment.description}</p>}
            
            <div className="intro-info">
              <div className="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>{assessmentQuestions.length} Questions</span>
              </div>
              {timeRemaining && (
                <div className="info-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{Math.floor(timeRemaining / 60)} Minutes</span>
                </div>
              )}
            </div>

            <div className="intro-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Read each question carefully before answering</li>
                <li>You can navigate between questions using the question palette</li>
                <li>All questions must be answered before submission</li>
                {timeRemaining && <li>Timer will start once you begin the assessment</li>}
                <li>Your progress will be saved automatically</li>
              </ul>
            </div>

            <button className="btn-start-assessment" onClick={handleStartAssessment}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  // After submission - show results
  if (submittedAssessment && assessmentResults) {
    return (
      <div className="course-assessment-page">
        <div className="assessment-results">
          <button className="btn-back" onClick={handleBackToCourse}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div className="results-card">
            <div className={`results-score ${assessmentResults.score >= 70 ? 'pass' : 'fail'}`}>
              <div className="score-circle">
                <span className="score-value">{assessmentResults.score}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
            
            <h1>Assessment Complete</h1>
            <p className="results-summary">
              You answered {assessmentResults.correctAnswers} out of {assessmentResults.totalQuestions} questions correctly.
            </p>

            <div className="results-breakdown">
              <h3>Question Summary</h3>
              <div className="question-summary-grid">
                {assessmentResults.questionResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`summary-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
                    onClick={() => handleGoToQuestion(index)}
                  >
                    <span className="summary-number">{index + 1}</span>
                    {result.isCorrect ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="results-actions">
              <button className="btn-review" onClick={() => setCurrentQuestionIndex(0)}>
                Review Answers
              </button>
              <button className="btn-finish" onClick={handleBackToCourse}>
                Continue Course
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // During assessment
  return (
    <div className="course-assessment-page" ref={containerRef}>
      {/* Header */}
      <div className="assessment-header">
        <div className="header-left">
          <h2>{segment?.name || segment?.title || 'Assessment'}</h2>
        </div>
        <div className="header-center">
          {timerActive && timeRemaining !== null && (
            <div className={`timer ${timeRemaining < 300 ? 'warning' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <span className="progress-text">
            {getAnsweredCount()} / {assessmentQuestions.length} answered
          </span>
          <button 
            className="btn-submit"
            onClick={handleSubmitAssessment}
            disabled={getAnsweredCount() < assessmentQuestions.length}
          >
            Submit Assessment
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="assessment-content">
        {/* Question Panel */}
        <div className={`question-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {currentQuestion && (
            <>
              <div className="question-header">
                <span className="question-number">Question {currentQuestionIndex + 1} of {assessmentQuestions.length}</span>
              </div>
              
              <div className="question-body">
                <div className="question-text">
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion.question_text || currentQuestion.title || '' }} />
                </div>
                
                <div className="question-options">
                  {(currentQuestion.options || []).map((option, index) => {
                    const questionId = currentQuestion.id || currentQuestionIndex
                    const isSelected = selectedAnswers[questionId] === index
                    const showResult = submittedAssessment
                    const isCorrect = showResult && index === currentQuestion.correct_option_index
                    const isWrong = showResult && isSelected && !isCorrect

                    return (
                      <button
                        key={index}
                        className={`option-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                        onClick={() => handleAnswerSelect(questionId, index)}
                        disabled={submittedAssessment}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                        <span className="option-text">{option}</span>
                        {isCorrect && (
                          <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {isWrong && (
                          <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>

                {submittedAssessment && currentQuestion.explanation && (
                  <div className="question-explanation">
                    <h4>Explanation</h4>
                    <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                  </div>
                )}
              </div>

              <div className="question-nav">
                <button 
                  className="nav-btn" 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Previous
                </button>
                <button 
                  className="nav-btn" 
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === assessmentQuestions.length - 1}
                >
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <aside className="question-palette">
          <h3>Questions</h3>
          <div className="palette-grid">
            {assessmentQuestions.map((q, index) => {
              const questionId = q.id || index
              const isAnswered = selectedAnswers[questionId] !== undefined
              const isCurrent = currentQuestionIndex === index
              let status = ''
              
              if (submittedAssessment && assessmentResults) {
                const result = assessmentResults.questionResults[index]
                status = result?.isCorrect ? 'correct' : 'incorrect'
              }

              return (
                <button
                  key={index}
                  className={`palette-item ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''} ${status}`}
                  onClick={() => handleGoToQuestion(index)}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          
          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-dot answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot unanswered"></span>
              <span>Not Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot current"></span>
              <span>Current</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CourseAssessment

