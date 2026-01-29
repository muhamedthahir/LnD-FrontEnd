import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../components/Button/Button'
import './Assessments.css'

function Assessments() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('in_progress') // 'in_progress', 'not_started', 'completed'

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchAssessments = useCallback(async () => {
    if (!apiBaseUrl) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/my-assessments`, {
        headers: getAuthHeader()
      })

      if (response.ok) {
        const data = await response.json()
        // Handle both paginated response and direct array
        const assessmentsList = data.assessments || (Array.isArray(data) ? data : [])
        // Normalize field names (handle both snake_case and camelCase)
        const normalizedAssessments = assessmentsList.map(assessment => ({
          ...assessment,
          user_mapping_id: assessment.user_mapping_id || assessment.id,
          total_duration: assessment.total_duration || assessment.total_time || assessment.totalDuration || assessment.totalTime,
          start_date_time: assessment.start_date_time || assessment.startDateTime,
          end_date_time: assessment.end_date_time || assessment.endDateTime
        }))
        console.log('Fetched assessments:', normalizedAssessments.length, normalizedAssessments)
        setAssessments(normalizedAssessments)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching assessments:', errorData)
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
      INVITED: { label: 'Not Started', color: 'not-started', canStart: true },
      NOT_STARTED: { label: 'Not Started', color: 'not-started', canStart: true },
      IN_PROGRESS: { label: 'In Progress', color: 'in-progress', canStart: true },
      COMPLETED: { label: 'Completed', color: 'completed', canStart: false },
      SUBMITTED: { label: 'Completed', color: 'completed', canStart: false },
      EXPIRED: { label: 'Expired', color: 'expired', canStart: false },
      PAUSED: { label: 'In Progress', color: 'in-progress', canStart: true }
    }
    return configs[status] || { label: 'Not Started', color: 'not-started', canStart: true }
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

  // Helper function to open assessment in secure popup
  const openAssessmentInPopup = (mappingId, isResume = false) => {
    const screenWidth = window.screen.availWidth || window.screen.width
    const screenHeight = window.screen.availHeight || window.screen.height
    
    const windowFeatures = [
      `width=${screenWidth}`,
      `height=${screenHeight}`,
      'top=0',
      'left=0',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'directories=no',
      'status=no',
      'personalbar=no',
      'scrollbars=yes',
      'resizable=no',
      'copyhistory=no',
      'popup=yes'
    ].join(',')
    
    // Use secure route without sidebar/header for proctored assessments
    const assessmentUrl = `${window.location.origin}/secure/assessment/${mappingId}/take`
    console.log('Opening assessment in popup:', assessmentUrl)
    
    const assessmentWindow = window.open(assessmentUrl, 'assessment_window', windowFeatures)
    
    if (assessmentWindow) {
      assessmentWindow.focus()
      toast.success(isResume ? 'Assessment resumed in secure window' : 'Assessment opened in secure window')
    } else {
      toast.warning('Popup was blocked by browser. Opening in current window...')
      navigate(`/user/assessments/${mappingId}/take`)
    }
  }

  const handleStartAssessment = (assessment) => {
    const mappingId = assessment.user_mapping_id || assessment.id
    if (!mappingId) {
      console.error('No mapping ID found for assessment:', assessment)
      toast.error('Invalid assessment data')
      return
    }
    
    if (assessment.status === 'IN_PROGRESS') {
      // Always open in secure popup for resume
      openAssessmentInPopup(mappingId, true)
    } else {
      // Go to start page first (which will then open popup after agreement)
      navigate(`/user/assessments/${mappingId}/start`)
    }
  }

  const handleViewResults = (assessment) => {
    const mappingId = assessment.user_mapping_id || assessment.id
    if (!mappingId) {
      console.error('No mapping ID found for assessment:', assessment)
      toast.error('Invalid assessment data')
      return
    }
    navigate(`/user/assessments/${mappingId}/results`)
  }

  // Count assessments by category
  const inProgressCount = assessments.filter(a => ['IN_PROGRESS', 'PAUSED'].includes(a.status)).length
  const notStartedCount = assessments.filter(a => ['INVITED', 'NOT_STARTED'].includes(a.status)).length
  const completedCount = assessments.filter(a => ['COMPLETED', 'SUBMITTED'].includes(a.status)).length

  // Tab configuration
  const tabs = [
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'not_started', label: 'Not Yet Started', count: notStartedCount },
    { id: 'completed', label: 'Completed', count: completedCount }
  ]

  // Filter and sort assessments based on active tab
  const getFilteredAssessments = () => {
    let filtered = []
    
    switch (activeTab) {
      case 'in_progress':
        filtered = assessments.filter(a => ['IN_PROGRESS', 'PAUSED'].includes(a.status))
        break
      case 'not_started':
        filtered = assessments.filter(a => ['INVITED', 'NOT_STARTED'].includes(a.status))
        break
      case 'completed':
        filtered = assessments.filter(a => ['COMPLETED', 'SUBMITTED'].includes(a.status))
        break
      default:
        filtered = []
    }

    // Sort by end date (soonest first for active, most recent for completed)
    return filtered.sort((a, b) => {
      if (activeTab === 'completed') {
        // For completed, show most recently completed first
        return new Date(b.completed_at || b.end_date_time || 0) - new Date(a.completed_at || a.end_date_time || 0)
      } else {
        // For active, show soonest deadline first
        return new Date(a.end_date_time || Infinity) - new Date(b.end_date_time || Infinity)
      }
    })
  }

  const filteredAssessments = getFilteredAssessments()

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

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'in_progress':
        return {
          title: 'No assessments in progress',
          message: 'Assessments you start will appear here. Check "Not Yet Started" tab for pending assessments.'
        }
      case 'not_started':
        return {
          title: 'No pending assessments',
          message: 'All caught up! New assessments will appear here when assigned to you.'
        }
      case 'completed':
        return {
          title: 'No completed assessments',
          message: 'Assessments you complete will appear here with your scores and results.'
        }
      default:
        return { title: 'No assessments', message: '' }
    }
  }

  return (
    <div className="assessments-page">
      <div className="assessments-header">
        <h1>My Assessments</h1>
        <p>View and take your assigned assessments</p>
      </div>

      {/* Tabs */}
      <div className="assessments-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {filteredAssessments.length === 0 ? (
        <div className="assessments-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <h3>{getEmptyStateMessage().title}</h3>
          <p>{getEmptyStateMessage().message}</p>
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
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span>Starts: {formatDateTime(assessment.start_date_time)}</span>
                    </div>
                    <div className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>Ends: {formatDateTime(assessment.end_date_time)}</span>
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
                    >
                      {assessment.status === 'IN_PROGRESS' ? 'Continue' : 
                       assessment.status === 'PAUSED' ? 'Resume' : 
                       assessment.status === 'INVITED' ? 'Start Assessment' : 'Start Assessment'}
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
