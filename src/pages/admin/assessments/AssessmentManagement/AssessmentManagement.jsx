import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import Pagination from '../../../../components/Pagination/Pagination'
import Table from '../../../../components/Table/Table'
import './AssessmentManagement.css'

function AssessmentManagement() {
  const { apiBaseUrl, accessToken } = useApi()
  const navigate = useNavigate()
  
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const fetchAssessments = useCallback(async () => {
    if (!apiBaseUrl) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        ...(search && { search }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch assessments')

      const data = await response.json()
      setAssessments(data.assessments || [])
      setTotalCount(data.total || 0)
    } catch (error) {
      console.error('Error fetching assessments:', error)
      toast.error('Failed to fetch assessments')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, search, selectedStatus, currentPage, pageSize])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssessments()
    }, search ? 300 : 0)
    
    return () => clearTimeout(timer)
  }, [fetchAssessments])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'status-badge published'
      case 'DRAFT': return 'status-badge draft'
      case 'ARCHIVED': return 'status-badge archived'
      default: return 'status-badge'
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="assessment-management-page">
      <div className="page-header">
        <div>
          <h1>Assessment Management</h1>
          <p>Create and manage assessments for your organization</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/assessments/create')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Assessment
        </Button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <h3>No Assessments Found</h3>
          <p>Get started by creating your first assessment.</p>
          <Button variant="primary" onClick={() => navigate('/admin/assessments/create')}>Create Assessment</Button>
        </div>
      ) : (
        <>
          <div className="assessments-table-container">
            <Table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Segments</th>
                  <th>Duration</th>
                  <th>Configurations</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>View/Edit</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(assessment => (
                  <tr key={assessment.id}>
                    <td>
                      <div className="assessment-info">
                        <span className="assessment-id">{assessment.unique_id}</span>
                        <span className="assessment-title">{assessment.title}</span>
                        {assessment.topic_name && (
                          <span className="assessment-topic">{assessment.topic_name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="count-badge">{assessment.segment_count || 0}</span>
                    </td>
                    <td>{formatDuration(assessment.total_duration)}</td>
                    <td>
                      <span className="count-badge">{assessment.config_count || 0}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(assessment.status)}>
                        {assessment.status}
                      </span>
                    </td>
                    <td>
                      <span className="date-text">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit"
                          onClick={() => navigate(`/admin/assessments/${assessment.id}/edit`)}
                          title="Open View/Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {totalCount > pageSize && (
            <div className="pagination-wrapper">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}

      </div>
  )
}

export default AssessmentManagement
