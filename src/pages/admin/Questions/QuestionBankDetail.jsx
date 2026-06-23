import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import './QuestionForm.css'
import './Questions.css'

function QuestionBankDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { apiBaseUrl, accessToken } = useApi()

  const [pageLoading, setPageLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionBank, setQuestionBank] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionsTotal, setQuestionsTotal] = useState(0)
  const [questionsPage, setQuestionsPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const questionsAbortRef = useRef(null)

  useLayoutEffect(() => {
    setQuestionsPage(1)
  }, [id])

  const fetchQuestionBankOnly = useCallback(async () => {
    const response = await fetch(
      `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.GET(id)}?include_questions=false`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      }
    )
    if (!response.ok) {
      toast.error('Failed to fetch question bank')
      navigate('/admin/questions/banks')
      return null
    }
    const data = await response.json()
    return data.questionBank
  }, [apiBaseUrl, accessToken, id, navigate])

  const fetchQuestionsPage = useCallback(async () => {
    if (!apiBaseUrl || !id) return

    if (questionsAbortRef.current) {
      questionsAbortRef.current.abort()
    }
    questionsAbortRef.current = new AbortController()

    setQuestionsLoading(true)
    try {
      const offset = (questionsPage - 1) * pageSize
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.LIST}`)
      url.searchParams.set('question_bank_id', id)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('offset', String(offset))

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        signal: questionsAbortRef.current.signal
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setQuestionsTotal(data.total || 0)
      } else {
        toast.error('Failed to fetch questions')
        setQuestions([])
        setQuestionsTotal(0)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching questions:', error)
        toast.error('Failed to fetch questions')
        setQuestions([])
        setQuestionsTotal(0)
      }
    } finally {
      setQuestionsLoading(false)
    }
  }, [apiBaseUrl, accessToken, id, questionsPage, pageSize])

  useEffect(() => {
    if (!id) return
    if (!apiBaseUrl) return

    let cancelled = false
    setPageLoading(true)
    setQuestionBank(null)

    ;(async () => {
      try {
        const bank = await fetchQuestionBankOnly()
        if (cancelled) return
        if (bank) setQuestionBank(bank)
      } catch (error) {
        console.error('Error fetching question bank:', error)
        if (!cancelled) {
          toast.error('Failed to fetch question bank')
          navigate('/admin/questions/banks')
        }
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, id, fetchQuestionBankOnly, navigate])

  useEffect(() => {
    if (!apiBaseUrl || !id) return
    fetchQuestionsPage()
    return () => {
      if (questionsAbortRef.current) {
        questionsAbortRef.current.abort()
      }
    }
  }, [apiBaseUrl, id, fetchQuestionsPage])

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toUpperCase()) {
      case 'PUBLISHED':
        return 'status-published'
      case 'DRAFT':
        return 'status-draft'
      case 'REVIEW':
        return 'status-review'
      default:
        return ''
    }
  }

  const getLevelBadgeClass = (levelName) => {
    switch (levelName?.toLowerCase()) {
      case 'easy':
        return 'level-easy'
      case 'medium':
        return 'level-medium'
      case 'hard':
        return 'level-hard'
      default:
        return ''
    }
  }

  const getTypeBadgeClass = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'mcq':
        return 'type-mcq'
      case 'multi select':
        return 'type-multi-select'
      case 'programming':
        return 'type-programming'
      default:
        return ''
    }
  }

  const handleQuestionRowClick = (question) => {
    navigate(`/admin/questions/list/${question.id}`)
  }

  if (pageLoading) {
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
    <div className="question-form-page questions-page">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn-secondary back-btn"
            onClick={() => navigate('/admin/questions/banks')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h1>{questionBank.name}</h1>
          <div className="page-meta">
            <span className={`status-badge ${getStatusBadgeClass(questionBank.status_name)}`}>
              {questionBank.status_name}
            </span>
            {questionBank.institution_name && (
              <span className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18v-2H3v2z" />
                  <path d="M5 21V8l7-4 7 4v13" />
                </svg>
                {questionBank.institution_name}
              </span>
            )}
            <span className="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {questionsTotal} Questions
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate(`/admin/questions/banks/${id}/edit`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>

      {questionBank.description && (
        <div className="detail-card">
          <h2>Description</h2>
          <div
            className="description-content"
            dangerouslySetInnerHTML={{ __html: questionBank.description }}
          />
        </div>
      )}

      {questionBank.tags && questionBank.tags.length > 0 && (
        <div className="detail-card">
          <h2>Tags</h2>
          <div className="tags-list">
            {questionBank.tags.map((tag) => (
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

      <div className="detail-card">
        <div className="card-header">
          <h2>Questions ({questionsTotal})</h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate(`/admin/questions/list/create?bank=${id}`)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Question
          </button>
        </div>

        <div className="table-container">
          {questionsLoading ? (
            <div className="loading-state">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p>No questions in this bank yet</p>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td className="code-cell">{question.code}</td>
                    <td
                      className="name-cell clickable"
                      onClick={() => handleQuestionRowClick(question)}
                    >
                      {question.name}
                    </td>
                    <td>
                      <span
                        className={`type-badge ${getTypeBadgeClass(question.question_type_name)}`}
                      >
                        {question.question_type_name}
                      </span>
                    </td>
                    <td>
                      {question.level_name && (
                        <span
                          className={`level-badge ${getLevelBadgeClass(question.level_name)}`}
                        >
                          {question.level_name}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${getStatusBadgeClass(question.status_name)}`}
                      >
                        {question.status_name}
                      </span>
                    </td>
                    <td>{new Date(question.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="action-btn view"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/questions/list/${question.id}`)
                        }}
                        title="View"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/questions/list/${question.id}/edit`)
                        }}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {!questionsLoading && questionsTotal > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={questionsPage}
              pageSize={pageSize}
              totalCount={questionsTotal}
              itemName="questions"
              onPageChange={setQuestionsPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionBankDetail
