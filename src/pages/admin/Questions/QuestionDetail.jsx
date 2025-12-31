import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import './QuestionForm.css'

function QuestionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState(null)
  const [programmingQuestion, setProgrammingQuestion] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [options, setOptions] = useState([])

  useEffect(() => {
    fetchQuestion()
  }, [id])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.GET(id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setQuestion(data.question)
        setProgrammingQuestion(data.programmingQuestion || null)
        setTestCases(data.testCases || [])
        setOptions(data.options || [])
      } else {
        toast.error('Failed to fetch question')
        navigate('/admin/questions/list')
      }
    } catch (error) {
      console.error('Error fetching question:', error)
      toast.error('Failed to fetch question')
      navigate('/admin/questions/list')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toUpperCase()) {
      case 'PUBLISHED': return 'status-published'
      case 'DRAFT': return 'status-draft'
      case 'REVIEW': return 'status-review'
      default: return ''
    }
  }

  const getLevelBadgeClass = (levelName) => {
    switch (levelName?.toLowerCase()) {
      case 'easy': return 'level-easy'
      case 'medium': return 'level-medium'
      case 'hard': return 'level-hard'
      default: return ''
    }
  }

  const isProgramming = question?.question_type_name === 'Programming'
  const isMCQ = question?.question_type_name === 'MCQ' || question?.question_type_name === 'Multi Select'

  if (loading) {
    return (
      <div className="question-form-page">
        <div className="loading-state">Loading question...</div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="question-form-page">
        <div className="empty-state">Question not found</div>
      </div>
    )
  }

  return (
    <div className="question-form-page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/admin/questions/list')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Questions
          </button>
          <h1>{question.name}</h1>
          <div className="page-meta">
            <span className="question-code">{question.code}</span>
            <span className={`type-badge type-${question.question_type_name?.toLowerCase().replace(' ', '-')}`}>
              {question.question_type_name}
            </span>
            {question.level_name && (
              <span className={`level-badge ${getLevelBadgeClass(question.level_name)}`}>
                {question.level_name}
              </span>
            )}
            <span className={`status-badge ${getStatusBadgeClass(question.status_name)}`}>
              {question.status_name}
            </span>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate(`/admin/questions/list/${id}/edit`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
      </div>

      {/* Description */}
      {question.description && (
        <div className="detail-card">
          <h2>Problem Description</h2>
          <div 
            className="description-content"
            dangerouslySetInnerHTML={{ __html: question.description }}
          />
        </div>
      )}

      {/* Scoring Info */}
      <div className="detail-card">
        <h2>Scoring & Time</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Points</span>
            <span className="info-value">{question.points || 1}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Negative Marks</span>
            <span className="info-value">{question.negative_marks || 0}</span>
          </div>
          {question.time_to_solve && (
            <div className="info-item">
              <span className="info-label">Time to Solve</span>
              <span className="info-value">{question.time_to_solve} seconds</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="detail-card">
          <h2>Tags</h2>
          <div className="tags-list">
            {question.tags.map(tag => (
              <span 
                key={tag.id} 
                className="tag-badge"
                style={{ 
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation & Hint */}
      {(question.explanation || question.hint) && (
        <div className="detail-card">
          <h2>Help & Explanation</h2>
          {question.hint && (
            <div className="hint-section">
              <h3>Hint</h3>
              <p>{question.hint}</p>
            </div>
          )}
          {question.explanation && (
            <div className="explanation-section">
              <h3>Explanation</h3>
              <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
            </div>
          )}
        </div>
      )}

      {/* MCQ Options */}
      {isMCQ && options.length > 0 && (
        <div className="detail-card">
          <h2>Answer Options ({options.length})</h2>
          <div className="options-display">
            {options.map((option, index) => (
              <div 
                key={option.id || index} 
                className={`option-display-item ${option.is_correct ? 'correct' : ''}`}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <div className="option-text" dangerouslySetInnerHTML={{ __html: option.text }} />
                {option.is_correct && (
                  <span className="correct-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programming Details */}
      {isProgramming && programmingQuestion && (
        <>
          <div className="detail-card">
            <h2>Programming Configuration</h2>
            <div className="info-grid">
              {programmingQuestion.time_limit && (
                <div className="info-item">
                  <span className="info-label">Time Limit</span>
                  <span className="info-value">{programmingQuestion.time_limit}s</span>
                </div>
              )}
              {programmingQuestion.memory_limit && (
                <div className="info-item">
                  <span className="info-label">Memory Limit</span>
                  <span className="info-value">{programmingQuestion.memory_limit} MB</span>
                </div>
              )}
              {programmingQuestion.threshold && (
                <div className="info-item">
                  <span className="info-label">Pass Threshold</span>
                  <span className="info-value">{programmingQuestion.threshold}%</span>
                </div>
              )}
              {programmingQuestion.no_of_submission_allowed && (
                <div className="info-item">
                  <span className="info-label">Max Submissions</span>
                  <span className="info-value">{programmingQuestion.no_of_submission_allowed}</span>
                </div>
              )}
            </div>

            {programmingQuestion.languages && programmingQuestion.languages.length > 0 && (
              <div className="languages-section">
                <h3>Allowed Languages</h3>
                <div className="languages-list">
                  {programmingQuestion.languages.map(lang => (
                    <span key={lang.id} className="language-badge">
                      {lang.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sample I/O */}
          {(programmingQuestion.sample_input || programmingQuestion.sample_output) && (
            <div className="detail-card">
              <h2>Sample Input/Output</h2>
              <div className="io-sections">
                {programmingQuestion.sample_input && (
                  <div className="io-section">
                    <h3>Sample Input</h3>
                    <pre className="code-block">{programmingQuestion.sample_input}</pre>
                  </div>
                )}
                {programmingQuestion.sample_output && (
                  <div className="io-section">
                    <h3>Sample Output</h3>
                    <pre className="code-block">{programmingQuestion.sample_output}</pre>
                  </div>
                )}
              </div>
              {programmingQuestion.constraints && (
                <div className="constraints-section">
                  <h3>Constraints</h3>
                  <p>{programmingQuestion.constraints}</p>
                </div>
              )}
            </div>
          )}

          {/* Test Cases */}
          <div className="detail-card">
            <div className="card-header">
              <h2>Test Cases ({testCases.length})</h2>
              <button 
                className="btn-primary btn-sm"
                onClick={() => navigate(`/admin/questions/list/${id}/edit?tab=testcases`)}
              >
                Manage Test Cases
              </button>
            </div>

            {testCases.length === 0 ? (
              <div className="warning-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>No test cases added yet. Add test cases to enable code evaluation.</span>
              </div>
            ) : (
              <div className="testcases-list">
                {testCases.map((tc, index) => (
                  <div key={tc.id} className={`testcase-item ${tc.is_hidden ? 'hidden' : ''}`}>
                    <div className="testcase-header">
                      <span className="testcase-number">#{index + 1}</span>
                      <span className="testcase-name">{tc.name}</span>
                      <div className="testcase-badges">
                        {tc.is_hidden && <span className="badge hidden">Hidden</span>}
                        {!tc.is_active && <span className="badge inactive">Inactive</span>}
                      </div>
                    </div>
                    <div className="testcase-io">
                      <div className="testcase-input">
                        <span className="io-label">Input:</span>
                        <pre>{tc.input}</pre>
                      </div>
                      <div className="testcase-output">
                        <span className="io-label">Expected:</span>
                        <pre>{tc.expected_result}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Question Bank Link */}
      {question.question_bank_id && (
        <div className="detail-card link-card" onClick={() => navigate(`/admin/questions/banks/${question.question_bank_id}`)}>
          <div className="link-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="link-content">
            <span className="link-label">Part of Question Bank</span>
            <span className="link-value">{question.question_bank_name}</span>
          </div>
          <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default QuestionDetail

