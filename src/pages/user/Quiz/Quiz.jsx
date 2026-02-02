import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import './Quiz.css'

function Quiz() {
  const { apiBaseUrl, accessToken } = useApi()
  const { courseId, practiceId } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()

  // Assessment flag - if true, show intro and results screens; if false, go directly to quiz
  const isAssessment = false

  // Quiz State
  const [practiceSegment, setPracticeSegment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(!isAssessment) // Auto-start if not assessment
  
  // Answer state - supports both single and multiple selections
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  
  // Quiz completion state
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Time tracking
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [timeSpent, setTimeSpent] = useState({})

  useEffect(() => {
    if (practiceId) {
      fetchPracticeSegment()
      fetchQuestions()
    }
  }, [practiceId])

  useEffect(() => {
    // Track time when question changes
    if (started && questions.length > 0) {
      setQuestionStartTime(Date.now())
      
      // Mark question as attempted
      const markAttempted = async () => {
        const currentQuestion = questions[currentQuestionIndex]
        if (!currentQuestion || !practiceId || !courseId || !apiBaseUrl) return

        try {
          await fetch(`${apiBaseUrl}/api/submissions/practice/attempt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && { 
                'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
              })
            },
            body: JSON.stringify({
              question_id: currentQuestion.id,
              question_type: 'MCQ',
              practice_segment_id: parseInt(practiceId),
              course_id: parseInt(courseId)
            })
          })
        } catch (error) {
          console.error('Error marking question as attempted:', error)
        }
      }
      
      markAttempted()
    }
  }, [currentQuestionIndex, started, questions, practiceId, courseId, apiBaseUrl])

  // Fetch previous submissions when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      fetchPreviousSubmissions()
    }
  }, [questions])

  const fetchPracticeSegment = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.GET(practiceId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        }
      })

      if (!response.ok) throw new Error('Failed to fetch practice segment')
      const data = await response.json()
      setPracticeSegment(data)
    } catch (error) {
      console.error('Error fetching practice segment:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      
      // Fetch MCQ questions with options
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.MCQ_QUESTIONS(practiceId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Fetch full details for each MCQ question (including options)
        const questionsWithDetails = await Promise.all(
          data.map(async (q) => {
            try {
              const detailsResponse = await fetch(`${apiBaseUrl}/api/questions/${q.id}`, {
                headers: {
                  'Content-Type': 'application/json',
                  ...((accessToken || localStorage.getItem('accessToken')) && { 
                    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
                  })
                }
              })
              
              if (detailsResponse.ok) {
                const details = await detailsResponse.json()
                return {
                  ...q,
                  ...details.question,
                  mcqQuestion: details.mcqQuestion,
                  options: details.options || [],
                  is_multi_select: details.mcqQuestion?.is_multi_select || false
                }
              }
            } catch (err) {
              console.error(`Error fetching details for question ${q.id}:`, err)
            }
            return q
          })
        )
        
        setQuestions(questionsWithDetails)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch previous submissions for this quiz
  const fetchPreviousSubmissions = async () => {
    try {
      const previousAnswers = {}
      const previousSubmissions = {}
      let hasSubmissions = false

      for (const question of questions) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/submissions/mcq/${question.id}/history`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && { 
                'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
              })
            }
          })

          if (response.ok) {
            const data = await response.json()
            
            if (data.submission) {
              hasSubmissions = true
              
              // Parse selected options from the submission
              let selectedOptions = []
              try {
                selectedOptions = typeof data.submission.last_selected_options === 'string' 
                  ? JSON.parse(data.submission.last_selected_options) 
                  : data.submission.last_selected_options || []
              } catch (e) {
                selectedOptions = []
              }

              // Get correct options for this question
              const correctOptions = question.options
                .filter(opt => opt.is_correct)
                .map(opt => opt.id)

              // Check if answer was correct
              const selectedSet = new Set(selectedOptions)
              const correctSet = new Set(correctOptions)
              const isCorrect = selectedSet.size === correctSet.size && 
                               [...selectedSet].every(opt => correctSet.has(opt))

              previousAnswers[question.id] = selectedOptions
              previousSubmissions[question.id] = {
                selectedOptions,
                correctOptions,
                isCorrect,
                score: data.submission.best_score || 0,
                timeSpent: data.submission.total_time_spent_seconds || 0
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching submission for question ${question.id}:`, err)
        }
      }

      if (hasSubmissions) {
        setSelectedAnswers(previousAnswers)
        setSubmittedAnswers(previousSubmissions)
      }
    } catch (error) {
      console.error('Error fetching previous submissions:', error)
    }
  }

  // Reset answer for current question - allows re-answering
  const handleResetQuestion = (questionId) => {
    // Clear selected answers for this question
    setSelectedAnswers(prev => {
      const updated = { ...prev }
      delete updated[questionId]
      return updated
    })
    
    // Clear submitted answer for this question
    setSubmittedAnswers(prev => {
      const updated = { ...prev }
      delete updated[questionId]
      return updated
    })
    
    // Reset time tracking for this question
    setQuestionStartTime(Date.now())
  }

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex]
  }

  const handleStartQuiz = () => {
    setStarted(true)
    setQuestionStartTime(Date.now())
  }

  // Handle answer selection for MCQ (single select - radio)
  const handleSingleSelect = (questionId, optionId) => {
    if (submittedAnswers[questionId]) return
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: [optionId]
    }))
  }

  // Handle answer selection for Multi-select (checkbox)
  const handleMultiSelect = (questionId, optionId) => {
    if (submittedAnswers[questionId]) return
    
    setSelectedAnswers(prev => {
      const currentSelection = prev[questionId] || []
      
      if (currentSelection.includes(optionId)) {
        // Remove from selection
        return {
          ...prev,
          [questionId]: currentSelection.filter(id => id !== optionId)
        }
      } else {
        // Add to selection
        return {
          ...prev,
          [questionId]: [...currentSelection, optionId]
        }
      }
    })
  }

  // Calculate time spent on current question
  const calculateTimeSpent = () => {
    if (!questionStartTime) return 0
    return Math.floor((Date.now() - questionStartTime) / 1000)
  }

  // Save time spent when navigating
  const saveTimeSpent = useCallback(() => {
    const currentQuestion = getCurrentQuestion()
    if (currentQuestion && questionStartTime) {
      const spent = calculateTimeSpent()
      setTimeSpent(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + spent
      }))
    }
  }, [questionStartTime, currentQuestionIndex, questions])

  // Submit answer for current question
  const handleSubmitAnswer = async () => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    const selectedOptionIds = selectedAnswers[currentQuestion.id] || []
    if (selectedOptionIds.length === 0) return

    // Calculate time spent
    const timeSpentOnQuestion = (timeSpent[currentQuestion.id] || 0) + calculateTimeSpent()

    // Determine correct options
    const correctOptions = currentQuestion.options
      .filter(opt => opt.is_correct)
      .map(opt => opt.id)

    // Check if answer is correct
    const selectedSet = new Set(selectedOptionIds)
    const correctSet = new Set(correctOptions)
    
    const isCorrect = selectedSet.size === correctSet.size && 
                      [...selectedSet].every(opt => correctSet.has(opt))

    const score = isCorrect ? 100 : 0

    // Submit to backend
    try {
      const response = await fetch(`${apiBaseUrl}/api/submissions/mcq/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        },
        body: JSON.stringify({
          mcq_question_id: currentQuestion.id,
          practice_segment_id: parseInt(practiceId),
          course_id: parseInt(courseId),
          selected_options: selectedOptionIds,
          time_spent_seconds: timeSpentOnQuestion
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        setSubmittedAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            selectedOptions: selectedOptionIds,
            correctOptions,
            isCorrect,
            score,
            timeSpent: timeSpentOnQuestion
          }
        }))

        // Dispatch event to update progress
        window.dispatchEvent(new CustomEvent('courseProgressUpdated', { detail: { courseId } }))
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      
      // Still mark as submitted locally even if API fails
      setSubmittedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          selectedOptions: selectedOptionIds,
          correctOptions,
          isCorrect,
          score,
          timeSpent: timeSpentOnQuestion
        }
      }))
    }

    // Reset time tracking for this question
    setQuestionStartTime(Date.now())
  }

  // Navigate to next question
  const handleNextQuestion = () => {
    saveTimeSpent()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Navigate to previous question
  const handlePrevQuestion = () => {
    saveTimeSpent()
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Handle complete quiz button click
  const handleCompleteQuizClick = () => {
    const answeredCount = Object.keys(submittedAnswers).length
    const totalQuestions = questions.length

    // If not all questions are answered, show confirmation modal
    if (answeredCount < totalQuestions) {
      setShowConfirmModal(true)
    } else {
      completeQuiz()
    }
  }

  // Complete quiz and navigate back (or show results if assessment)
  const completeQuiz = () => {
    saveTimeSpent()
    setShowConfirmModal(false)
    
    if (isAssessment) {
      // Calculate overall results for assessment
      let totalCorrect = 0
      let totalQuestions = questions.length
      let totalTimeSpent = 0
      
      const questionResults = questions.map((q, index) => {
        const submission = submittedAnswers[q.id]
        if (submission) {
          if (submission.isCorrect) totalCorrect++
          totalTimeSpent += submission.timeSpent || 0
        }
        
        return {
          questionIndex: index,
          questionId: q.id,
          questionName: q.name,
          isAnswered: !!submission,
          isCorrect: submission?.isCorrect || false,
          selectedOptions: submission?.selectedOptions || [],
          correctOptions: submission?.correctOptions || q.options.filter(o => o.is_correct).map(o => o.id),
          timeSpent: submission?.timeSpent || 0
        }
      })

      const results = {
        totalQuestions,
        totalAnswered: Object.keys(submittedAnswers).length,
        totalCorrect,
        totalIncorrect: Object.keys(submittedAnswers).length - totalCorrect,
        totalSkipped: totalQuestions - Object.keys(submittedAnswers).length,
        score: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        totalTimeSpent,
        questionResults
      }

      setQuizResults(results)
      setQuizCompleted(true)
    } else {
      // For non-assessment, just navigate back to course
      navigate(`/courses/${courseId}/current`)
    }
  }

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}/current`)
  }

  const handleReviewAnswers = () => {
    setQuizCompleted(false)
    setCurrentQuestionIndex(0)
  }

  const getAnsweredCount = () => {
    return Object.keys(submittedAnswers).length
  }

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">
          <div className="loading-spinner"></div>
          <span>Loading quiz...</span>
        </div>
      </div>
    )
  }

  // Quiz intro screen (only for assessment mode)
  if (isAssessment && !started) {
    return (
      <div className="quiz-page">
        <div className="quiz-intro">
          <button className="btn-back" onClick={handleBackToCourse}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div className="intro-card">
            <div className="intro-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            
            <h1>{practiceSegment?.name || 'Quiz'}</h1>
            {practiceSegment?.description && (
              <p className="intro-description">{practiceSegment.description}</p>
            )}
            
            <div className="intro-stats">
              <div className="stat-item">
                <div className="stat-value">{questions.length}</div>
                <div className="stat-label">Questions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {questions.filter(q => q.is_multi_select).length}
                </div>
                <div className="stat-label">Multi-Select</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {questions.filter(q => !q.is_multi_select).length}
                </div>
                <div className="stat-label">MCQ</div>
              </div>
            </div>

            <div className="intro-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Read each question carefully before answering</li>
                <li>For <strong>MCQ</strong> questions, select one correct answer (radio buttons)</li>
                <li>For <strong>Multi-Select</strong> questions, select all correct answers (checkboxes)</li>
                <li>Click "Submit Answer" after selecting your response</li>
                <li>You can navigate between questions using the navigation buttons</li>
                <li>Explanations will be shown after submitting each answer</li>
              </ul>
            </div>

            <button className="btn-start-quiz" onClick={handleStartQuiz} disabled={questions.length === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              {questions.length > 0 ? 'Start Quiz' : 'No Questions Available'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz results screen (only for assessment mode)
  if (isAssessment && quizCompleted && quizResults) {
    return (
      <div className="quiz-page">
        <div className="quiz-results">
          <button className="btn-back" onClick={handleBackToCourse}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div className="results-card">
            <div className={`results-score-circle ${quizResults.score >= 70 ? 'pass' : 'fail'}`}>
              <svg className="score-ring" viewBox="0 0 100 100">
                <circle className="ring-bg" cx="50" cy="50" r="45"/>
                <circle 
                  className="ring-progress" 
                  cx="50" cy="50" r="45"
                  style={{ 
                    strokeDasharray: `${quizResults.score * 2.83} 283`,
                    stroke: quizResults.score >= 70 ? '#10b981' : '#ef4444'
                  }}
                />
              </svg>
              <div className="score-content">
                <span className="score-value">{quizResults.score}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
            
            <h1>Quiz Completed!</h1>
            <p className="results-summary">
              You answered <strong>{quizResults.totalCorrect}</strong> out of <strong>{quizResults.totalQuestions}</strong> questions correctly.
            </p>

            <div className="results-breakdown">
              <div className="breakdown-item correct">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="breakdown-value">{quizResults.totalCorrect}</span>
                <span className="breakdown-label">Correct</span>
              </div>
              <div className="breakdown-item incorrect">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span className="breakdown-value">{quizResults.totalIncorrect}</span>
                <span className="breakdown-label">Incorrect</span>
              </div>
              <div className="breakdown-item skipped">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                <span className="breakdown-value">{quizResults.totalSkipped}</span>
                <span className="breakdown-label">Skipped</span>
              </div>
            </div>

            <div className="question-summary-section">
              <h3>Question Summary</h3>
              <div className="question-summary-grid">
                {quizResults.questionResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`summary-item ${result.isAnswered ? (result.isCorrect ? 'correct' : 'incorrect') : 'skipped'}`}
                    onClick={() => {
                      setQuizCompleted(false)
                      setCurrentQuestionIndex(index)
                    }}
                    title={result.questionName}
                  >
                    <span className="summary-number">{index + 1}</span>
                    {result.isAnswered ? (
                      result.isCorrect ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="results-actions">
              <button className="btn-review" onClick={handleReviewAnswers}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Review Answers
              </button>
              <button className="btn-finish" onClick={handleBackToCourse}>
                Continue Course
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const isMultiSelect = currentQuestion?.is_multi_select
  const currentSelected = selectedAnswers[currentQuestion?.id] || []
  const isSubmitted = submittedAnswers[currentQuestion?.id]

  // Main quiz interface
  return (
    <div className="quiz-page">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Quiz Not Complete</h3>
            <p>
              You have answered <strong>{getAnsweredCount()}</strong> out of <strong>{questions.length}</strong> questions. 
              Are you sure you want to complete the quiz?
            </p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                Continue Quiz
              </button>
              <button className="btn-confirm" onClick={completeQuiz}>
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="quiz-header">
        <div className="header-left">
          <button className="btn-back-small" onClick={handleBackToCourse} title="Back to Course">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2>{practiceSegment?.name || 'Quiz'}</h2>
        </div>
        
        {/* Navigation in Header */}
        <div className="header-nav">
          <button 
            className="nav-btn prev" 
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            title="Previous Question"
            aria-label="Previous Question"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path 
                d="M15 18l-6-6 6-6" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="nav-indicator">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button 
            className="nav-btn next" 
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            title="Next Question"
            aria-label="Next Question"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path 
                d="M9 18l6-6-6-6" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="header-right">
          <button 
            className="btn-complete"
            onClick={handleCompleteQuizClick}
          >
            <span className="btn-text">Complete Quiz</span>
            <span className="btn-text-mobile">Done</span>
          </button>
        </div>
      </div>

      {/* Main Content - Full Width (No Sidebar) */}
      <div className="quiz-content">
        <div className="question-main full-width">
          {currentQuestion && (
            <div className="question-card">
              {/* Question Text */}
              <div className="question-text">
                <div className="question-number-badge">Question {currentQuestionIndex + 1}</div>
                <h3 dangerouslySetInnerHTML={{ __html: currentQuestion.name }} />
                {currentQuestion.description && (
                  <div 
                    className="question-description"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.description }} 
                  />
                )}
              </div>

              {/* Hint for multi-select */}
              {isMultiSelect && !isSubmitted && (
                <div className="question-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Select all correct answers
                </div>
              )}

              {/* Options */}
              <div className="options-container">
                {(currentQuestion.options || []).map((option, index) => {
                  const isSelected = currentSelected.includes(option.id)
                  const isCorrect = isSubmitted && option.is_correct
                  const isWrong = isSubmitted && isSelected && !option.is_correct

                  return (
                    <div
                      key={option.id}
                      className={`option-item ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                      onClick={() => {
                        if (!isSubmitted) {
                          if (isMultiSelect) {
                            handleMultiSelect(currentQuestion.id, option.id)
                          } else {
                            handleSingleSelect(currentQuestion.id, option.id)
                          }
                        }
                      }}
                    >
                      <div className={`option-selector ${isMultiSelect ? 'checkbox' : 'radio'}`}>
                        {isMultiSelect ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isSelected && <polyline points="20 6 9 17 4 12"/>}
                          </svg>
                        ) : (
                          isSelected && <span className="radio-dot"></span>
                        )}
                      </div>
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="option-text" dangerouslySetInnerHTML={{ __html: option.text }} />
                      {isSubmitted && (
                        <div className="option-status">
                          {isCorrect && (
                            <svg className="status-icon correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                          {isWrong && (
                            <svg className="status-icon wrong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="question-actions">
                {/* Submit Button */}
                {!isSubmitted && currentSelected.length > 0 && (
                  <button className="btn-submit-answer" onClick={handleSubmitAnswer}>
                    Submit Answer
                  </button>
                )}

                {/* Try Again Button - shown after submission */}
                {isSubmitted && (
                  <button 
                    className="btn-try-again" 
                    onClick={() => handleResetQuestion(currentQuestion.id)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Try Again
                  </button>
                )}
              </div>

              {/* Explanation */}
              {isSubmitted && currentQuestion.explanation && (
                <div className="explanation-box">
                  <div className="explanation-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                    <h4>Explanation</h4>
                  </div>
                  <div 
                    className="explanation-content"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quiz
