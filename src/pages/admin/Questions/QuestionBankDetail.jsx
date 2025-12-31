import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import './QuestionForm.css'

function QuestionBankDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [questionBank, setQuestionBank] = useState(null)
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    fetchQuestionBank()
  }, [id])

  const fetchQuestionBank = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.GET(id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setQuestionBank(data.questionBank)
        setQuestions(data.questions || [])
      } else {
        toast.error('Failed to fetch question bank')
        navigate('/admin/questions/banks')
      }
    } catch (error) {
      console.error('Error fetching question bank:', error)
      toast.error('Failed to fetch question bank')
      navigate('/admin/questions/banks')
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

  if (loading) {
    return (
      <div className="question-form-page">
        <div className="loading-state">Loading question bank...</div>
      </div>
    )
  }

  if (!questionBank) {
    return (
      <div className="question-form-page">
        <div className="empty-state">Question bank not found</div>
      </div>
    )
  }

  return (
    <div className="question-form-page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/admin/questions/banks')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Question Banks
          </button>
          <h1>{questionBank.name}</h1>
          <div className="page-meta">
            <span className={`status-badge ${getStatusBadgeClass(questionBank.status_name)}`}>
              {questionBank.status_name}
            </span>
            {questionBank.institution_name && (
              <span className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18v-2H3v2z"/>
                  <path d="M5 21V8l7-4 7 4v13"/>
                </svg>
                {questionBank.institution_name}
              </span>
            )}
            <span className="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {questions.length} Questions
            </span>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate(`/admin/questions/banks/${id}/edit`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
      </div>

      {/* Description */}
      {questionBank.description && (
        <div className="detail-card">
          <h2>Description</h2>
          <div 
            className="description-content"
            dangerouslySetInnerHTML={{ __html: questionBank.description }}
          />
        </div>
      )}

      {/* Tags */}
      {questionBank.tags && questionBank.tags.length > 0 && (
        <div className="detail-card">
          <h2>Tags</h2>
          <div className="tags-list">
            {questionBank.tags.map(tag => (
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

      {/* Questions List */}
      <div className="detail-card">
        <div className="card-header">
          <h2>Questions ({questions.length})</h2>
          <button 
            className="btn-primary btn-sm"
            onClick={() => navigate(`/admin/questions/list/create?bank=${id}`)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="empty-state small">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>No questions in this bank yet</p>
          </div>
        ) : (
          <div className="questions-list">
            {questions.map((question, index) => (
              <div 
                key={question.id} 
                className="question-item"
                onClick={() => navigate(`/admin/questions/list/${question.id}`)}
              >
                <div className="question-number">{index + 1}</div>
                <div className="question-info">
                  <div className="question-header">
                    <span className="question-code">{question.code}</span>
                    <span className="question-name">{question.name}</span>
                  </div>
                  <div className="question-meta">
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
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionBankDetail

