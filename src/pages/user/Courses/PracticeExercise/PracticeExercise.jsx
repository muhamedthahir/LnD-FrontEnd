import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import CodeEditor from '../../../CodeEditor/CodeEditor'
import './PracticeExercise.css'

function PracticeExercise() {
  const { apiBaseUrl, accessToken } = useApi()
  const { courseId, practiceId } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  
  const [practiceSegment, setPracticeSegment] = useState(null)
  const [programmingQuestions, setProgrammingQuestions] = useState([])
  const [mcqQuestions, setMcqQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestionType, setCurrentQuestionType] = useState('programming') // 'programming' or 'mcq'
  const [loading, setLoading] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(30)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  // MCQ state
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})

  useEffect(() => {
    if (practiceId) {
      fetchPracticeSegment()
      fetchQuestions()
    }
  }, [practiceId])

  const fetchPracticeSegment = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.GET(practiceId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
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
      
      // Fetch programming questions
      const progResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.PROGRAMMING_QUESTIONS(practiceId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (progResponse.ok) {
        const progData = await progResponse.json()
        
        // Fetch full details for each programming question (including test cases and code templates)
        const questionsWithDetails = await Promise.all(
          progData.map(async (q) => {
            try {
              // Fetch programming question details (test cases, languages, code templates)
              const detailsResponse = await fetch(`${apiBaseUrl}/api/questions/${q.id}/programming-details`, {
                headers: {
                  'Content-Type': 'application/json',
                  ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                }
              })
              
              if (detailsResponse.ok) {
                const details = await detailsResponse.json()
                return {
                  ...q,
                  ...details,
                  testCases: details.testCases || [],
                  languages: details.languages || [],
                  codeTemplates: details.codeTemplates || []
                }
              }
            } catch (err) {
              console.error(`Error fetching details for question ${q.id}:`, err)
            }
            return q
          })
        )
        
        setProgrammingQuestions(questionsWithDetails)
      }

      // Fetch MCQ questions
      const mcqResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.MCQ_QUESTIONS(practiceId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (mcqResponse.ok) {
        const mcqData = await mcqResponse.json()
        setMcqQuestions(mcqData)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
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

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'difficulty-easy'
      case 'medium': return 'difficulty-medium'
      case 'hard': return 'difficulty-hard'
      default: return ''
    }
  }

  const getCurrentQuestion = () => {
    if (currentQuestionType === 'programming') {
      return programmingQuestions[currentQuestionIndex]
    }
    return mcqQuestions[currentQuestionIndex]
  }

  const getTotalQuestions = () => {
    return currentQuestionType === 'programming' 
      ? programmingQuestions.length 
      : mcqQuestions.length
  }

  const handleNextQuestion = () => {
    const total = getTotalQuestions()
    if (currentQuestionIndex < total - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSwitchQuestionType = (type) => {
    setCurrentQuestionType(type)
    setCurrentQuestionIndex(0)
  }

  const handleMcqSelect = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const handleMcqSubmit = (questionId) => {
    const question = mcqQuestions.find(q => q.id === questionId)
    if (!question) return

    const selectedIndex = selectedAnswers[questionId]
    const isCorrect = selectedIndex === question.correct_option_index

    setSubmittedAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedIndex,
        isCorrect
      }
    }))
  }

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}/current`)
  }

  if (loading) {
    return (
      <div className="practice-exercise-page">
        <div className="loading">Loading practice exercise...</div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const totalQuestions = getTotalQuestions()
  const hasProgrammingQuestions = programmingQuestions.length > 0
  const hasMcqQuestions = mcqQuestions.length > 0

  return (
    <div className="practice-exercise-page" ref={containerRef}>
      {/* Header */}
      <div className="practice-header">
        <div className="header-top-row">
          <button className="btn-back" onClick={handleBackToCourse}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          <div className="practice-title">
            <h1>{practiceSegment?.name || 'Practice Exercise'}</h1>
          </div>

          {/* Question Navigation - moved to header */}
        {totalQuestions > 0 && (
          <div className="header-nav-row">
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
            <span className="question-counter">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <button 
              className="nav-btn" 
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}
          
        </div>
        
        
      </div>

      {/* Main Content */}
      {totalQuestions === 0 ? (
        <div className="no-questions">
          <h3>No questions available</h3>
          <p>There are no {currentQuestionType === 'programming' ? 'programming' : 'MCQ'} questions in this practice exercise yet.</p>
        </div>
      ) : (
        <div className="practice-content">
          {/* Question Content */}
          {currentQuestionType === 'programming' && currentQuestion && (
            <div className="programming-question-layout">
              {/* Left Panel - Question Description */}
              <div 
                className={`question-panel ${sidebarCollapsed ? 'collapsed' : ''}`}
                style={{ width: sidebarCollapsed ? '0' : `${leftPanelWidth}%` }}
              >
                {!sidebarCollapsed && (
                  <>
                    <div className="question-header">
                      <h2 className="question-title">{currentQuestion.title}</h2>
                      <span className={`difficulty-badge ${getDifficultyClass(currentQuestion.difficulty_level)}`}>
                        {currentQuestion.difficulty_level || 'Medium'}
                      </span>
                    </div>
                    <div className="question-content">
                      <div 
                        className="question-description"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.description || currentQuestion.problem_statement || '' }}
                      />
                      
                      {currentQuestion.constraints && (
                        <div className="question-constraints">
                          <h4>Constraints</h4>
                          <div dangerouslySetInnerHTML={{ __html: currentQuestion.constraints }} />
                        </div>
                      )}
                      
                      {currentQuestion.input_format && (
                        <div className="question-format">
                          <h4>Input Format</h4>
                          <div dangerouslySetInnerHTML={{ __html: currentQuestion.input_format }} />
                        </div>
                      )}
                      
                      {currentQuestion.output_format && (
                        <div className="question-format">
                          <h4>Output Format</h4>
                          <div dangerouslySetInnerHTML={{ __html: currentQuestion.output_format }} />
                        </div>
                      )}
                      
                      {currentQuestion.sample_input && (
                        <div className="question-sample">
                          <h4>Sample Input</h4>
                          <pre>{currentQuestion.sample_input}</pre>
                        </div>
                      )}
                      
                      {currentQuestion.sample_output && (
                        <div className="question-sample">
                          <h4>Sample Output</h4>
                          <pre>{currentQuestion.sample_output}</pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Collapse Button */}
              <button 
                className="collapse-btn"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Show question' : 'Hide question'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points={sidebarCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}/>
                </svg>
              </button>

              {/* Resizer */}
              {!sidebarCollapsed && (
                <div 
                  className="vertical-resizer"
                  onMouseDown={handleMouseDown}
                >
                  <div className="resizer-handle">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              {/* Right Panel - Code Editor */}
              <div 
                className="editor-panel"
                style={{ width: sidebarCollapsed ? '100%' : `${100 - leftPanelWidth}%` }}
              >
                <CodeEditor 
                  questionId={currentQuestion.id}
                  allowedLanguages={currentQuestion.languages || []}
                  codeTemplates={currentQuestion.codeTemplates || []}
                  testCases={currentQuestion.testCases || []}
                  onSubmit={async (data) => {
                    try {
                      const response = await fetch(`${apiBaseUrl}/api/submissions/programming/submit`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                        },
                        body: JSON.stringify({
                          programming_question_id: currentQuestion.id,
                          practice_segment_id: parseInt(practiceId),
                          course_id: parseInt(courseId),
                          submitted_code: data.code,
                          language_used: data.language,
                          test_cases_passed: data.testCasesPassed || 0,
                          test_cases_total: data.testCasesTotal || 0
                        })
                      })
                      
                      if (response.ok) {
                        const result = await response.json()
                        console.log('Submission result:', result)
                        // Dispatch event to update progress in sidebar
                        window.dispatchEvent(new CustomEvent('courseProgressUpdated', { detail: { courseId } }))
                        return result
                      } else {
                        console.error('Submission failed')
                      }
                    } catch (error) {
                      console.error('Error submitting code:', error)
                    }
                  }}
                />
              </div>
            </div>
          )}

          {currentQuestionType === 'mcq' && currentQuestion && (
            <div className="mcq-question-layout">
              <div className="mcq-question-card">
                <div className="mcq-question-header">
                  <span className="mcq-question-number">Question {currentQuestionIndex + 1}</span>
                  <span className={`difficulty-badge ${getDifficultyClass(currentQuestion.difficulty_level)}`}>
                    {currentQuestion.difficulty_level || 'Medium'}
                  </span>
                </div>
                
                <div className="mcq-question-text">
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion.question_text || currentQuestion.title || '' }} />
                </div>
                
                <div className="mcq-options">
                  {(currentQuestion.options || []).map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === index
                    const isSubmitted = submittedAnswers[currentQuestion.id]
                    const isCorrect = isSubmitted && index === currentQuestion.correct_option_index
                    const isWrong = isSubmitted && isSelected && !isCorrect

                    return (
                      <button
                        key={index}
                        className={`mcq-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                        onClick={() => !isSubmitted && handleMcqSelect(currentQuestion.id, index)}
                        disabled={!!isSubmitted}
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

                {!submittedAnswers[currentQuestion.id] && selectedAnswers[currentQuestion.id] !== undefined && (
                  <button 
                    className="btn-submit-mcq"
                    onClick={() => handleMcqSubmit(currentQuestion.id)}
                  >
                    Submit Answer
                  </button>
                )}

                {submittedAnswers[currentQuestion.id] && (
                  <div className={`mcq-result ${submittedAnswers[currentQuestion.id].isCorrect ? 'correct' : 'wrong'}`}>
                    {submittedAnswers[currentQuestion.id].isCorrect ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Correct!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Incorrect. The correct answer is {String.fromCharCode(65 + currentQuestion.correct_option_index)}.
                      </>
                    )}
                  </div>
                )}

                {currentQuestion.explanation && submittedAnswers[currentQuestion.id] && (
                  <div className="mcq-explanation">
                    <h4>Explanation</h4>
                    <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PracticeExercise

