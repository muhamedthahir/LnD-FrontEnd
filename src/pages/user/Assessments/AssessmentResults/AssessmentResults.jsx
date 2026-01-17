import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentResults.css'

function AssessmentResults() {
  const { mappingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' })
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchResults = useCallback(async () => {
    if (!apiBaseUrl || !mappingId) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/results`, {
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to fetch results')

      const data = await response.json()
      setResults(data)
      
      // Check if feedback modal should be shown
      if (data.show_feedback && !data.feedback_submitted) {
        setTimeout(() => setShowFeedbackModal(true), 1000)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, mappingId, accessToken])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleSubmitFeedback = async () => {
    if (feedback.rating === 0) {
      toast.warning('Please select a rating')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/feedback`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(feedback)
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast.success('Thank you for your feedback!')
      setShowFeedbackModal(false)
      setFeedbackSubmitted(true)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="results-page">
        <div className="error-state">
          <h3>Results not available</h3>
          <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <button className="back-link" onClick={() => navigate('/user/assessments')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Assessments
          </button>
          <h1>{results.display_name}</h1>
          <p className="assessment-title">{results.assessment_title}</p>
        </div>

        {/* Score Card */}
        <div className={`score-card ${results.passed ? 'passed' : 'failed'}`}>
          <div className="score-visual">
            <svg viewBox="0 0 120 120" className="score-ring">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.2"/>
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(results.score / 100) * 339.292} 339.292`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{Math.round(results.score)}</span>
              <span className="score-percent">%</span>
            </div>
          </div>
          <div className="score-info">
            <h2 className="result-status">
              {results.passed ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Congratulations! You Passed
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Keep Trying!
                </>
              )}
            </h2>
            <p className="result-message">
              {results.passed 
                ? 'You have successfully completed this assessment.'
                : `You need ${results.threshold_for_pass}% to pass. Don't give up!`}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{results.correct_answers || 0}/{results.total_questions || 0}</span>
              <span className="stat-label">Correct Answers</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatDuration(results.time_taken)}</span>
              <span className="stat-label">Time Taken</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{results.attempted || 0}/{results.total_questions || 0}</span>
              <span className="stat-label">Attempted</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{results.marks_obtained || 0}/{results.total_marks || 0}</span>
              <span className="stat-label">Marks Obtained</span>
            </div>
          </div>
        </div>

        {/* Segment-wise Results */}
        {results.segments && results.segments.length > 0 && (
          <div className="segments-results">
            <h3>Segment-wise Performance</h3>
            <div className="segments-list">
              {results.segments.map((segment, index) => (
                <div key={segment.id} className="segment-result">
                  <div className="segment-header">
                    <span className="segment-number">{index + 1}</span>
                    <span className="segment-name">{segment.name}</span>
                    <span className={`segment-score ${segment.percentage >= results.threshold_for_pass ? 'passed' : 'failed'}`}>
                      {Math.round(segment.percentage)}%
                    </span>
                  </div>
                  <div className="segment-progress">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </div>
                  <div className="segment-details">
                    <span>{segment.correct}/{segment.total} correct</span>
                    <span>•</span>
                    <span>{segment.marks_obtained}/{segment.total_marks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers Review (if enabled) */}
        {results.show_answers && results.answers && (
          <div className="answers-review">
            <h3>Answer Review</h3>
            <div className="answers-list">
              {results.answers.map((answer, index) => (
                <div key={index} className={`answer-item ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                  <div className="answer-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className={`status-icon ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                      {answer.is_correct ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="question-text">{answer.question_text}</div>
                  <div className="answer-details">
                    <div className="your-answer">
                      <span className="label">Your Answer:</span>
                      <span className="value">{answer.user_answer || 'Not Answered'}</span>
                    </div>
                    {!answer.is_correct && (
                      <div className="correct-answer">
                        <span className="label">Correct Answer:</span>
                        <span className="value">{answer.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          {results.can_retry && results.attempts_remaining > 0 && (
            <Button variant="primary" onClick={() => navigate(`/user/assessments/${mappingId}/start`)}>
              Try Again ({results.attempts_remaining} attempts left)
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/user/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content feedback-modal">
            <div className="modal-header">
              <h2>How was your experience?</h2>
            </div>
            <div className="modal-body">
              <p>Your feedback helps us improve!</p>
              
              <div className="rating-section">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${feedback.rating >= star ? 'active' : ''}`}
                      onClick={() => setFeedback({ ...feedback, rating: star })}
                    >
                      <svg viewBox="0 0 24 24" fill={feedback.rating >= star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="32" height="32">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="rating-label">
                  {feedback.rating === 0 ? 'Select a rating' :
                   feedback.rating === 1 ? 'Poor' :
                   feedback.rating === 2 ? 'Fair' :
                   feedback.rating === 3 ? 'Good' :
                   feedback.rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>

              <div className="comment-section">
                <label>Additional Comments (optional)</label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                  placeholder="Share your thoughts..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                Skip
              </Button>
              <Button variant="primary" onClick={handleSubmitFeedback}>
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentResults

