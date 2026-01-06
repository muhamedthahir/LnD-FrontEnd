import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { useAutoLoadMasterData } from '../../../hooks/useMasterData'
import { API_ENDPOINTS } from '../../../constants/constants'
import Pagination from '../../../components/Pagination/Pagination'
import Dropdown from '../../../components/Dropdown/Dropdown'
import './Questions.css'

function QuestionList() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Use Redux for master data (filters)
  const { questionTypes, levels, statuses } = useAutoLoadMasterData()
  
  // Filter selections
  const [selectedType, setSelectedType] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  
  // Prevent duplicate API calls
  const abortControllerRef = useRef(null)

  const fetchQuestions = useCallback(async () => {
    if (!apiBaseUrl) return
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      const offset = (currentPage - 1) * pageSize
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.LIST}`)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', offset.toString())
      if (search) url.searchParams.append('search', search)
      if (selectedType) url.searchParams.append('question_type_id', selectedType)
      if (selectedLevel) url.searchParams.append('level_id', selectedLevel)
      if (selectedStatus) url.searchParams.append('status_id', selectedStatus)

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        signal: abortControllerRef.current.signal
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error('Failed to fetch questions')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching questions:', error)
        toast.error('Failed to fetch questions')
      }
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, currentPage, pageSize, search, selectedType, selectedLevel, selectedStatus])

  // Fetch when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions()
    }, search ? 300 : 0) // Debounce only for search
    
    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchQuestions])

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

  const getTypeBadgeClass = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'mcq': return 'type-mcq'
      case 'multi select': return 'type-multi-select'
      case 'programming': return 'type-programming'
      default: return ''
    }
  }

  const handleRowClick = (question) => {
    navigate(`/admin/questions/list/${question.id}`)
  }

  const clearFilters = () => {
    setSelectedType(null)
    setSelectedLevel(null)
    setSelectedStatus(null)
    setSearch('')
  }

  const hasFilters = selectedType || selectedLevel || selectedStatus || search

  return (
    <div className="questions-page">
      <div className="page-header">
        <div>
          <h1>Questions</h1>
          <p className="page-subtitle">Manage all your questions across question banks</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/questions/list/create')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Question
        </button>
      </div>

      <div className="table-card">
        <div className="table-filters">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group filter-dropdown">
            <Dropdown
              label="Type"
              options={questionTypes}
              value={selectedType}
              onChange={setSelectedType}
              placeholder="All Types"
            />
          </div>
          <div className="filter-group filter-dropdown">
            <Dropdown
              label="Level"
              options={levels}
              value={selectedLevel}
              onChange={setSelectedLevel}
              placeholder="All Levels"
            />
          </div>
          <div className="filter-group filter-dropdown">
            <Dropdown
              label="Status"
              options={statuses}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="All Statuses"
            />
          </div>
          {hasFilters && (
            <button className="btn-clear-filters" onClick={clearFilters} title="Clear filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          )}
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-state">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3>No Questions Found</h3>
              <p>Create your first question to get started</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Question Bank</th>
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
                      onClick={() => handleRowClick(question)}
                    >
                      {question.name}
                    </td>
                    <td>
                      <span className={`type-badge ${getTypeBadgeClass(question.question_type_name)}`}>
                        {question.question_type_name}
                      </span>
                    </td>
                    <td>
                      {question.level_name && (
                        <span className={`level-badge ${getLevelBadgeClass(question.level_name)}`}>
                          {question.level_name}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(question.status_name)}`}>
                        {question.status_name}
                      </span>
                    </td>
                    <td>{question.question_bank_name || '-'}</td>
                    <td>{new Date(question.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/questions/list/${question.id}/edit`)
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
            </table>
          )}
        </div>

        {!loading && totalCount > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              itemName="questions"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionList




