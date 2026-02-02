import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import styles from './AssessmentResult.module.css'

function AssessmentResult() {
  const { mappingId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [expandedSegments, setExpandedSegments] = useState({})
  const [codeModalData, setCodeModalData] = useState(null)

  useEffect(() => {
    fetchAssessmentResult()
  }, [mappingId])

  const fetchAssessmentResult = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/mappings/${mappingId}/result`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        // Auto-expand first segment if available
        if (data.segment_progress && data.segment_progress.length > 0) {
          setExpandedSegments({ [data.segment_progress[0].assessment_segment_id]: true })
        }
      }
    } catch (error) {
      console.error('Error fetching assessment result:', error)
    } finally {
      setLoading(false)
    }
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
    if (!status) return styles.statusNotStarted
    const s = status.toUpperCase()
    if (s === 'COMPLETED' || s === 'SUBMITTED') return styles.statusCompleted
    if (s === 'IN_PROGRESS' || s === 'ACTIVE') return styles.statusInProgress
    if (s === 'DISQUALIFIED') return styles.statusDisqualified
    return styles.statusNotStarted
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
      <div className={styles.progressReportPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading assessment report...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className={styles.progressReportPage}>
        <div className={styles.errorContainer}>
          <p>Failed to load assessment report</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }

  const { mapping, segment_progress, proctoring_logs, proctoring_summary } = reportData

  const handleRefreshViolation = async () => {
    if (!window.confirm('Refresh violation? This will reset the tab switch count and allow the user to continue the assessment.')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user-mappings/${mappingId}/refresh-violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Violation refreshed! User can now continue. (Refresh count: ${data.refresh_violation_count})`)
        fetchAssessmentResult() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to refresh violation')
      }
    } catch (error) {
      console.error('Error refreshing violation:', error)
      alert('Failed to refresh violation')
    }
  }

  return (
    <div className={styles.progressReportPage}>
      {/* Header */}
      <div className={styles.reportHeader}>
        <button 
          className={styles.btnBack}
          onClick={() => navigate(-1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>Assessment Progress Report</h1>
        {mapping.status === 'DISQUALIFIED' && (
          <button 
            className={styles.btnRefreshViolation}
            onClick={handleRefreshViolation}
            title="Allow user to continue by refreshing violation count"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refresh Violation
          </button>
        )}
      </div>

      {/* Student Information */}
      <div className={`${styles.infoCard} ${styles.userCard} ${styles.fullWidthCard}`}>
        <div className={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3>Student Information</h3>
          <div className={styles.infoGridHorizontal}>
            <div className={styles.infoItem}>
              <label>Name</label>
              <span>{mapping.user_name}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <span>{mapping.user_email}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Mapping ID</label>
              <span>{mapping.id}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Status</label>
              <span className={`${styles.statusBadge} ${getStatusClass(mapping.status)}`}>
                {mapping.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment & Configuration Details */}
      <div className={`${styles.infoCard} ${styles.courseAdminCard} ${styles.fullWidthCard}`}>
        <div className={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3>Assessment & Configuration Details</h3>
          <div className={styles.infoGridHorizontal}>
            <div className={styles.infoItem}>
              <label>Assessment Title</label>
              <span className={styles.courseName}>{mapping.assessment_title}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Configuration</label>
              <span>{mapping.administrator_name}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Started At</label>
              <span>{formatDate(mapping.assessment_started_time)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Submitted At</label>
              <span>{formatDate(mapping.submitted_at)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Attempts Used</label>
              <span>{mapping.attempts_used} / {mapping.max_attempts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Progress Overview */}
      <div className={styles.progressOverviewCard}>
        <h2>Assessment Performance Overview</h2>
        <div className={styles.progressStats}>
          <div className={styles.statItem}>
            <div className={styles.statCircle} style={{ '--progress-color': getProgressColor(mapping.percentage_score || 0) }}>
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
                  strokeDasharray={`${mapping.percentage_score || 0}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={styles.statValue}>{Math.round(mapping.percentage_score || 0)}%</span>
            </div>
            <span className={styles.statLabel}>Overall Score</span>
          </div>
          
          <div className={styles.statDetails}>
            <div className={styles.detailRow}>
              <label>Total Score</label>
              <span>{mapping.total_score || 0}</span>
            </div>
            <div className={styles.detailRow}>
              <label>Time Spent</label>
              <span>{Math.floor((mapping.total_time_worked || 0) / 60)}m {(mapping.total_time_worked || 0) % 60}s</span>
            </div>
            <div className={styles.detailRow}>
              <label>Tab Switches</label>
              <span className={mapping.tab_switch_count > 2 ? styles.textDanger : ''}>
                {mapping.tab_switch_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segment-wise Progress */}
      <div className={styles.topicsSection}>
        <h2>Segment-wise Performance</h2>
        
        {segment_progress.length === 0 ? (
          <div className={styles.emptyTopics}>
            <p>No segment progress recorded.</p>
          </div>
        ) : (
          <div className={styles.topicsList}>
            {segment_progress.map((segment, index) => (
              <div key={segment.assessment_segment_id} className={styles.topicCard}>
                <div 
                  className={`${styles.topicHeader} ${expandedSegments[segment.assessment_segment_id] ? styles.topicHeaderExpanded : ''}`}
                  onClick={() => toggleSegment(segment.assessment_segment_id)}
                >
                  <div className={styles.topicInfo}>
                    <span className={styles.topicNumber}>{index + 1}</span>
                    <div className={styles.topicDetails}>
                      <h4>{segment.segment_name}</h4>
                      <p className={styles.topicMeta}>
                        {segment.questions_attempted || 0} questions attempted
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.topicProgress}>
                    <div className={styles.progressBarWrapper}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ 
                          width: `${(segment.score / segment.max_score) * 100 || 0}%`,
                          backgroundColor: getProgressColor((segment.score / segment.max_score) * 100 || 0)
                        }}
                      />
                    </div>
                    <span className={styles.progressText}>{Math.round((segment.score / segment.max_score) * 100) || 0}%</span>
                    <span className={`${styles.statusBadge} ${styles.statusBadgeSmall} ${getStatusClass(segment.status)}`}>
                      {segment.status || 'NOT STARTED'}
                    </span>
                    <svg className={`${styles.expandIcon} ${expandedSegments[segment.assessment_segment_id] ? styles.expandIconRotated : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {expandedSegments[segment.assessment_segment_id] && (
                  <div className={styles.topicContent}>
                    <div className={styles.topicStats}>
                      <div className={styles.miniStat}>
                        <label>Score</label>
                        <span>{segment.score} / {segment.max_score}</span>
                      </div>
                      <div className={styles.miniStat}>
                        <label>Time Used</label>
                        <span>{Math.floor((segment.time_used || 0) / 60)}m {(segment.time_used || 0) % 60}s</span>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className={styles.segmentsList}>
                      {segment.questions && segment.questions.length > 0 ? (
                        <div className={styles.questionsList}>
                          <div className={styles.questionsHeader}>
                            <span>Question</span>
                            <span>Type</span>
                            <span>Score</span>
                            <span>Status</span>
                            <span>Action</span>
                          </div>
                          {segment.questions.map((question, qIndex) => (
                            <div key={question.id} className={styles.questionRow}>
                              <span className={styles.questionText}>
                                {qIndex + 1}. {question.question_title?.substring(0, 50)}
                                {question.question_title?.length > 50 ? '...' : ''}
                              </span>
                              <span className={`${styles.questionType} ${question.question_type === 'MCQ' ? styles.questionTypeMcq : styles.questionTypeProgramming}`}>
                                {question.question_type === 'MCQ' ? 'MCQ' : 'Code'}
                              </span>
                              <span className={styles.questionScore}>
                                {question.score || 0} / 1
                              </span>
                              <span className={`${styles.questionStatus} ${question.score > 0 ? styles.questionStatusCorrect : question.is_attempted ? styles.questionStatusAttempted : styles.questionStatusUnattempted}`}>
                                {question.score > 0 ? '✓ Correct' : question.is_attempted ? 'Attempted' : 'Not Attempted'}
                              </span>
                              <span className={styles.questionAction}>
                                {question.question_type === 'PROGRAMMING' && question.submitted_code ? (
                                  <button 
                                    className={styles.btnShowCode}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCodeModalData({
                                        questionName: question.question_title,
                                        language: question.language_used || 'Unknown',
                                        code: question.submitted_code,
                                        score: question.score,
                                        testCasesPassed: question.test_cases_passed,
                                        testCasesTotal: question.test_cases_total
                                      });
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="16 18 22 12 16 6"></polyline>
                                      <polyline points="8 6 2 12 8 18"></polyline>
                                    </svg>
                                    View Code
                                  </button>
                                ) : question.question_type === 'MCQ' && question.user_answer ? (
                                  <span className={styles.mcqAnswer}>
                                    Ans: {question.user_answer}
                                  </span>
                                ) : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptySegments}>
                          <p>No questions found for this segment.</p>
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

      {/* Proctoring Summary */}
      {proctoring_summary && (
        <div className={`${styles.infoCard} ${styles.fullWidthCard}`}>
          <div className={styles.cardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h3>Proctoring Summary</h3>
            <div className={styles.infoGridHorizontal}>
              <div className={styles.infoItem}>
                <label>Current Tab Switch Count</label>
                <span className={proctoring_summary.current_tab_switch_count > 0 ? styles.warningText : ''}>
                  {proctoring_summary.current_tab_switch_count}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Max Allowed</label>
                <span>{proctoring_summary.max_tab_switch_allowed === -1 ? 'Unlimited' : proctoring_summary.max_tab_switch_allowed}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Refresh Violation Count</label>
                <span className={proctoring_summary.refresh_violation_count > 1 ? styles.warningText : ''}>
                  {proctoring_summary.refresh_violation_count}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Total Violations</label>
                <span className={proctoring_summary.total_violations > 0 ? styles.errorText : ''}>
                  {proctoring_summary.total_violations}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Logs Section */}
      <div className={styles.topicsSection}>
        <h2>Proctoring Logs</h2>
        <div className={styles.logsContainer}>
          {proctoring_logs && proctoring_logs.length > 0 ? (
            <div className={styles.logsTableWrapper}>
              <table className={styles.logsTable}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Segment</th>
                    <th>Violation Cycle</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {proctoring_logs.map((log, idx) => (
                    <tr key={idx} className={log.event_type === 'TAB_SWITCH' || log.event_type === 'WINDOW_BLUR' ? styles.logWarning : ''}>
                      <td>{formatDate(log.event_timestamp)}</td>
                      <td>
                        <span className={`${styles.logTypeBadge} ${styles['logType' + log.event_type]}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td>{log.segment_name || '-'}</td>
                      <td>{log.violation_cycle || 1}</td>
                      <td>
                        {log.metadata ? (
                          <pre className={styles.logMetadata}>
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyLogs}>
              <p>No proctoring logs recorded for this assessment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Modal */}
      {codeModalData && (
        <div className={styles.codeModalOverlay} onClick={() => setCodeModalData(null)}>
          <div className={styles.codeModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.codeModalHeader}>
              <div className={styles.codeModalTitle}>
                <h3>{codeModalData.questionName}</h3>
                <div className={styles.codeModalMeta}>
                  <span className={styles.languageBadge}>{codeModalData.language}</span>
                  <span className={styles.scoreBadge}>
                    Score: {codeModalData.score}/1
                  </span>
                  <span className={styles.testCasesBadge}>
                    Test Cases: {codeModalData.testCasesPassed}/{codeModalData.testCasesTotal}
                  </span>
                </div>
              </div>
              <button 
                className={styles.codeModalClose}
                onClick={() => setCodeModalData(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.codeModalBody}>
              <pre className={styles.codeBlock}>
                <code>{codeModalData.code}</code>
              </pre>
            </div>
            <div className={styles.codeModalFooter}>
              <button 
                className={styles.btnCopyCode}
                onClick={() => {
                  navigator.clipboard.writeText(codeModalData.code);
                  alert('Code copied to clipboard!');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Code
              </button>
              <button 
                className={styles.btnCloseModal}
                onClick={() => setCodeModalData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentResult

