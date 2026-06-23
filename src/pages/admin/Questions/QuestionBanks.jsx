import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import './Questions.css'
import { stripHtml } from './questionUtils'

function QuestionBanks() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [questionBanks, setQuestionBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Prevent duplicate API calls
  const abortControllerRef = useRef(null)

  const fetchQuestionBanks = useCallback(async () => {
    if (!apiBaseUrl) return
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      const offset = (currentPage - 1) * pageSize
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.LIST}`)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', offset.toString())
      if (search) url.searchParams.append('search', search)

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        signal: abortControllerRef.current.signal
      })

      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data.questionBanks || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error('Failed to fetch question banks')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching question banks:', error)
        toast.error('Failed to fetch question banks')
      }
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, currentPage, pageSize, search])

  // Fetch when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestionBanks()
    }, search ? 300 : 0) // Debounce only for search
    
    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchQuestionBanks])

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toUpperCase()) {
      case 'PUBLISHED': return 'status-published'
      case 'DRAFT': return 'status-draft'
      case 'REVIEW': return 'status-review'
      default: return ''
    }
  }

  const handleRowClick = (bank) => {
    navigate(`/admin/questions/banks/${bank.id}`)
  }

  return (
    <div className="questions-page">
      <div className="page-header">
        <div>
          <h1>Question Banks</h1>
          <p className="page-subtitle">Manage your question banks and organize questions</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/questions/banks/create')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Question Bank
        </button>
      </div>

      <div className="table-card">
        <div className="table-filters">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search question banks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-state">Loading question banks...</div>
          ) : questionBanks.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>No Question Banks Found</h3>
              <p>Create your first question bank to organize questions</p>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Institution</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questionBanks.map((bank) => (
                  <tr key={bank.id}>
                    <td 
                      className="name-cell clickable"
                      onClick={() => handleRowClick(bank)}
                    >
                      {bank.name}
                    </td>
                    <td className="description-cell">
                      {bank.description ? stripHtml(bank.description) : '-'}
                    </td>
                    <td>{bank.institution_name || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(bank.status_name)}`}>
                        {bank.status_name}
                      </span>
                    </td>
                    <td>{bank.question_count || 0}</td>
                    <td>{new Date(bank.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="action-btn view"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/questions/banks/${bank.id}`)
                        }}
                        title="View"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/questions/banks/${bank.id}/edit`)
                        }}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {!loading && totalCount > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              itemName="question banks"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionBanks




