import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../../constants/constants'
import './ProgressReport.css'

function ProgressReport() {
  const { id, userId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [expandedSegments, setExpandedSegments] = useState({})

  useEffect(() => {
    fetchProgressReport()
  }, [id, userId])

  const fetchProgressReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.USER_PROGRESS(id, userId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        // Auto-expand first topic
        if (data.topics && data.topics.length > 0) {
          setExpandedTopics({ [data.topics[0].id]: true })
        }
      }
    } catch (error) {
      console.error('Error fetching progress report:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }))
  }

  const toggleSegment = (segmentId) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getStatusClass = (status) => {
    if (!status) return 'not-started'
    return status.toLowerCase().replace('_', '-').replace(' ', '-')
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981'
    if (percentage >= 75) return '#3b82f6'
    if (percentage >= 50) return '#f59e0b'
    if (percentage > 0) return '#ef4444'
    return '#9ca3af'
  }

  if (loading) {
    return (
      <div className="progress-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading progress report...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="progress-report-page">
        <div className="error-container">
          <p>Failed to load progress report</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }

  const { user, course, administration, courseProgress, topics } = reportData

  return (
    <div className="progress-report-page">
      {/* Header */}
      <div className="report-header">
        <button 
          className="btn-back"
          onClick={() => navigate(`/admin/courses/administrations/${id}`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Administration
        </button>
        <h1>Progress Report</h1>
      </div>

      {/* User & Course Info Cards */}
      <div className="info-cards-grid">
        {/* User Details Card */}
        <div className="info-card user-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="card-content">
            <h3>Student Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>
                  <Link to={`/admin/users/${user.id}`} className="user-link">
                    {user.name}
                  </Link>
                </span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>College</label>
                <span>{user.college_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Department</label>
                <span>{user.department || '-'}</span>
              </div>
              <div className="info-item">
                <label>Roll Number</label>
                <span>{user.roll_number || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Details Card */}
        <div className="info-card course-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div className="card-content">
            <h3>Course Information</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Course Name</label>
                <span className="course-name">{course.name}</span>
              </div>
              <div className="info-item full-width">
                <label>Description</label>
                <span className="description">{course.description || '-'}</span>
              </div>
              <div className="info-item">
                <label>Category</label>
                <span className="badge category">{course.category || '-'}</span>
              </div>
              <div className="info-item">
                <label>Level</label>
                <span className="badge level">{course.competency_level || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Administration Details Card */}
        <div className="info-card admin-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="card-content">
            <h3>Administration Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Administration ID</label>
                <span className="mono">{administration.display_id || administration.id}</span>
              </div>
              <div className="info-item">
                <label>Name</label>
                <span>{administration.name}</span>
              </div>
              <div className="info-item">
                <label>Start Date</label>
                <span>{formatDate(administration.start_date)}</span>
              </div>
              <div className="info-item">
                <label>End Date</label>
                <span>{formatDate(administration.end_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress Overview */}
      <div className="progress-overview-card">
        <h2>Course Progress Overview</h2>
        <div className="progress-stats">
          <div className="stat-item">
            <div className="stat-circle" style={{ '--progress-color': getProgressColor(courseProgress.progress_percentage) }}>
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--progress-color)"
                  strokeWidth="3"
                  strokeDasharray={`${courseProgress.progress_percentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="stat-value">{courseProgress.progress_percentage}%</span>
            </div>
            <span className="stat-label">Overall Progress</span>
          </div>
          
          <div className="stat-details">
            <div className="detail-row">
              <label>Status</label>
              <span className={`status-badge ${getStatusClass(courseProgress.status)}`}>
                {courseProgress.status || 'Not Started'}
              </span>
            </div>
            <div className="detail-row">
              <label>Started At</label>
              <span>{formatDate(courseProgress.started_at)}</span>
            </div>
            <div className="detail-row">
              <label>Completed At</label>
              <span>{formatDate(courseProgress.completed_at)}</span>
            </div>
            <div className="detail-row">
              <label>Last Visited</label>
              <span>{formatDate(courseProgress.last_accessed_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topic-wise Progress */}
      <div className="topics-section">
        <h2>Topic-wise Progress</h2>
        
        {topics.length === 0 ? (
          <div className="empty-topics">
            <p>No topics available for this course.</p>
          </div>
        ) : (
          <div className="topics-list">
            {topics.map((topic, index) => (
              <div key={topic.id} className="topic-card">
                <div 
                  className={`topic-header ${expandedTopics[topic.id] ? 'expanded' : ''}`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  <div className="topic-info">
                    <span className="topic-number">{index + 1}</span>
                    <div className="topic-details">
                      <h4>{topic.name || topic.title}</h4>
                      <p className="topic-meta">
                        {topic.progress?.segments_completed || 0} / {topic.progress?.segments_total || 0} segments completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="topic-progress">
                    <div className="progress-bar-wrapper">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${topic.progress?.progress_percentage || 0}%`,
                          backgroundColor: getProgressColor(topic.progress?.progress_percentage || 0)
                        }}
                      />
                    </div>
                    <span className="progress-text">{topic.progress?.progress_percentage || 0}%</span>
                    <span className={`status-badge small ${getStatusClass(topic.progress?.status)}`}>
                      {topic.progress?.status || 'Not Started'}
                    </span>
                    <svg className="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {expandedTopics[topic.id] && (
                  <div className="topic-content">
                    <div className="topic-stats">
                      <div className="mini-stat">
                        <label>Started</label>
                        <span>{formatDate(topic.progress?.started_at)}</span>
                      </div>
                      <div className="mini-stat">
                        <label>Completed</label>
                        <span>{formatDate(topic.progress?.completed_at)}</span>
                      </div>
                    </div>

                    {/* Segments List */}
                    <div className="segments-list">
                      {topic.segments && topic.segments.length > 0 ? (
                        topic.segments.map((segment, segIndex) => (
                          <div key={`${segment.segment_type}-${segment.id}`} className="segment-item">
                            <div 
                              className={`segment-header ${segment.questions?.length > 0 ? 'clickable' : ''} ${expandedSegments[`${segment.segment_type}-${segment.id}`] ? 'expanded' : ''}`}
                              onClick={() => segment.questions?.length > 0 && toggleSegment(`${segment.segment_type}-${segment.id}`)}
                            >
                              <div className="segment-info">
                                <span className={`segment-type-badge ${segment.segment_type}`}>
                                  {segment.segment_type === 'lesson' ? '📖' : segment.segment_type === 'mcq' ? '❓' : '💻'}
                                  {segment.segment_type}
                                </span>
                                <span className="segment-title">{segment.title || segment.name}</span>
                              </div>
                              
                              <div className="segment-progress-info">
                                <div className="mini-progress-bar">
                                  <div 
                                    className="mini-progress-fill"
                                    style={{ 
                                      width: `${segment.progress?.progress_percentage || 0}%`,
                                      backgroundColor: getProgressColor(segment.progress?.progress_percentage || 0)
                                    }}
                                  />
                                </div>
                                <span className="segment-progress-text">{segment.progress?.progress_percentage || 0}%</span>
                                <span className={`status-badge tiny ${getStatusClass(segment.progress?.status)}`}>
                                  {segment.progress?.status || 'Not Started'}
                                </span>
                                {segment.questions?.length > 0 && (
                                  <svg className="expand-icon small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Questions List */}
                            {expandedSegments[`${segment.segment_type}-${segment.id}`] && segment.questions?.length > 0 && (
                              <div className="questions-list">
                                <div className="questions-header">
                                  <span>Question</span>
                                  <span>Type</span>
                                  <span>Score</span>
                                  <span>Attempts</span>
                                  <span>Status</span>
                                </div>
                                {segment.questions.map((question, qIndex) => (
                                  <div key={question.id} className="question-row">
                                    <span className="question-text">
                                      {qIndex + 1}. {question.question_text?.substring(0, 50)}
                                      {question.question_text?.length > 50 ? '...' : ''}
                                    </span>
                                    <span className={`question-type ${question.question_type}`}>
                                      {question.question_type === 'mcq' ? 'MCQ' : 'Code'}
                                    </span>
                                    <span className="question-score">
                                      {question.question_type === 'mcq' 
                                        ? `${question.best_score || 0}/${question.max_score || 100}`
                                        : question.test_cases_passed !== undefined 
                                          ? `${question.test_cases_passed}/${question.test_cases_total}`
                                          : `${question.score || 0}/${question.max_score || 100}`
                                      }
                                    </span>
                                    <span className="question-attempts">
                                      {question.attempt_count || (question.status === 'submitted' ? 1 : 0)}
                                    </span>
                                    <span className={`question-status ${question.is_correct ? 'correct' : question.status === 'answered' || question.status === 'submitted' ? 'attempted' : 'unattempted'}`}>
                                      {question.is_correct ? '✓ Correct' : question.status === 'answered' || question.status === 'submitted' ? 'Attempted' : 'Not Attempted'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="empty-segments">
                          <p>No segments in this topic.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressReport


