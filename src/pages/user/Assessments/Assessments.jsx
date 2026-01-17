import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../contexts/ApiContext'
import Button from '../../../components/Button/Button'
import './Assessments.css'

function Assessments() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchAssessments = useCallback(async () => {
    if (!apiBaseUrl) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments`, {
        headers: getAuthHeader()
      })

      if (response.ok) {
        const data = await response.json()
        setAssessments(data || [])
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  const getStatusConfig = (status) => {
    const configs = {
      NOT_STARTED: { label: 'Not Started', color: 'pending', canStart: true },
      IN_PROGRESS: { label: 'In Progress', color: 'active', canStart: true },
      COMPLETED: { label: 'Completed', color: 'completed', canStart: false },
      SUBMITTED: { label: 'Submitted', color: 'completed', canStart: false },
      EXPIRED: { label: 'Expired', color: 'expired', canStart: false },
      PAUSED: { label: 'Paused', color: 'paused', canStart: true }
    }
    return configs[status] || { label: status, color: '', canStart: false }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  const handleStartAssessment = (assessment) => {
    if (assessment.status === 'IN_PROGRESS') {
      navigate(`/user/assessments/${assessment.user_mapping_id}/take`)
    } else {
      navigate(`/user/assessments/${assessment.user_mapping_id}/start`)
    }
  }

  const handleViewResults = (assessment) => {
    navigate(`/user/assessments/${assessment.user_mapping_id}/results`)
  }

  const filteredAssessments = assessments.filter(a => {
    if (filter === 'all') return true
    if (filter === 'active') return ['NOT_STARTED', 'IN_PROGRESS', 'PAUSED'].includes(a.status)
    if (filter === 'completed') return ['COMPLETED', 'SUBMITTED'].includes(a.status)
    return true
  })

  if (loading) {
    return (
      <div className="assessments-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your assessments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="assessments-page">
      <div className="assessments-header">
        <div>
          <h1>My Assessments</h1>
          <p>View and take your assigned assessments</p>
        </div>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({assessments.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredAssessments.length === 0 ? (
        <div className="assessments-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <h3>
            {filter === 'all' ? 'No assessments available' : `No ${filter} assessments`}
          </h3>
          <p>
            {filter === 'all' 
              ? 'Assessments will appear here once they are assigned to you.'
              : 'Check other tabs for more assessments.'}
          </p>
        </div>
      ) : (
        <div className="assessments-grid">
          {filteredAssessments.map(assessment => {
            const statusConfig = getStatusConfig(assessment.status)
            return (
              <div key={assessment.user_mapping_id} className="assessment-card">
                <div className="card-header">
                  <span className={`status-badge ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  {assessment.attempts_used > 0 && (
                    <span className="attempts-badge">
                      Attempt {assessment.attempts_used}/{assessment.max_attempts}
                    </span>
                  )}
                </div>

                <div className="card-body">
                  <h3>{assessment.display_name}</h3>
                  <p className="assessment-title">{assessment.assessment_title}</p>
                  
                  {assessment.target_audience && (
                    <p className="target-audience">{assessment.target_audience}</p>
                  )}

                  <div className="card-meta">
                    <div className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>{formatDuration(assessment.total_duration)}</span>
                    </div>
                    <div className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{formatDateTime(assessment.end_date_time)}</span>
                    </div>
                    {assessment.segment_count && (
                      <div className="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span>{assessment.segment_count} segments</span>
                      </div>
                    )}
                  </div>

                  {assessment.status === 'COMPLETED' && assessment.score !== undefined && (
                    <div className="score-display">
                      <div className="score-circle">
                        <svg viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--bg-tertiary)"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={assessment.passed ? '#28a745' : '#dc3545'}
                            strokeWidth="3"
                            strokeDasharray={`${assessment.score}, 100`}
                          />
                        </svg>
                        <span className="score-value">{Math.round(assessment.score)}%</span>
                      </div>
                      <span className={`pass-status ${assessment.passed ? 'passed' : 'failed'}`}>
                        {assessment.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {statusConfig.canStart && (
                    <Button 
                      variant="primary" 
                      onClick={() => handleStartAssessment(assessment)}
                      disabled={!assessment.can_access}
                    >
                      {assessment.status === 'IN_PROGRESS' ? 'Continue' : 
                       assessment.status === 'PAUSED' ? 'Resume' : 'Start Assessment'}
                    </Button>
                  )}
                  {['COMPLETED', 'SUBMITTED'].includes(assessment.status) && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewResults(assessment)}
                    >
                      View Results
                    </Button>
                  )}
                  {!assessment.can_access && statusConfig.canStart && (
                    <p className="access-warning">
                      {assessment.access_message || 'This assessment is not currently available'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Assessments
