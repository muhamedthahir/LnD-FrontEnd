import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../../constants/constants'
import styles from './ProgressReport.module.css'

function ProgressReport() {
  const { id, userId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [expandedSegments, setExpandedSegments] = useState({})
  const [codeModalData, setCodeModalData] = useState(null)

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
    if (!status) return styles.statusNotStarted
    const s = status.toLowerCase().replace('_', '-').replace(' ', '-')
    if (s === 'completed') return styles.statusCompleted
    if (s === 'in-progress' || s === 'in_progress') return styles.statusInProgress
    return styles.statusNotStarted
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981'
    if (percentage >= 75) return '#3b82f6'
    if (percentage >= 50) return '#f59e0b'
    if (percentage > 0) return '#ef4444'
    return '#9ca3af'
  }

  // Lesson types (video, audio, document, text) for display in report
  const getLessonTypeLabel = (segmentType) => {
    if (!segmentType) return 'Lesson'
    const t = String(segmentType).toLowerCase()
    if (t === 'lesson_video') return 'Video'
    if (t === 'lesson_audio') return 'Audio'
    if (t === 'lesson_document') return 'Document'
    if (t === 'lesson_text') return 'Text'
    if (t === 'reference_videos' || t === 'articles') return segmentType.replace(/_/g, ' ')
    return segmentType.replace(/_/g, ' ')
  }

  const getLessonTypeBadgeClass = (segmentType) => {
    if (!segmentType) return styles.segmentTypeBadgeLesson
    const t = String(segmentType).toLowerCase()
    if (t === 'lesson_video') return styles.segmentTypeBadgeVideo
    if (t === 'lesson_audio') return styles.segmentTypeBadgeAudio
    if (t === 'lesson_document') return styles.segmentTypeBadgeDocument
    return styles.segmentTypeBadgeLesson
  }

  if (loading) {
    return (
      <div className={styles.progressReportPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading progress report...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className={styles.progressReportPage}>
        <div className={styles.errorContainer}>
          <p>Failed to load progress report</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }

  const { user, course, administration, courseProgress, topics } = reportData

  return (
    <div className={styles.progressReportPage}>
      {/* Header */}
      <div className={styles.reportHeader}>
        <button 
          className={styles.btnBack}
          onClick={() => navigate(`/admin/courses/administrations/${id}`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Administration
        </button>
        <h1>Progress Report</h1>
      </div>

      {/* Student Information - Full Width */}
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
              <span>
                <Link to={`/admin/users/${user.id}`} className={styles.userLink}>
                  {user.name}
                </Link>
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <span>{user.email}</span>
            </div>
            <div className={styles.infoItem}>
              <label>College</label>
              <span>{user.college_name || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Department</label>
              <span>{user.department || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Roll Number</label>
              <span>{user.roll_number || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course & Administration Info - Combined Card */}
      <div className={`${styles.infoCard} ${styles.courseAdminCard} ${styles.fullWidthCard}`}>
        <div className={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3>Course & Administration Details</h3>
          <div className={styles.infoGridHorizontal}>
            <div className={styles.infoItem}>
              <label>Course Name</label>
              <span className={styles.courseName}>{course.name}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Category</label>
              <span className={`${styles.badge} ${styles.badgeCategory}`}>{course.category || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Level</label>
              <span className={`${styles.badge} ${styles.badgeLevel}`}>{course.competency_level || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Administration</label>
              <span>{administration.name}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Start Date</label>
              <span>{formatDate(administration.start_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>End Date</label>
              <span>{formatDate(administration.end_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress Overview */}
      <div className={styles.progressOverviewCard}>
        <h2>Course Progress Overview</h2>
        <div className={styles.progressStats}>
          <div className={styles.statItem}>
            <div className={styles.statCircle} style={{ '--progress-color': getProgressColor(courseProgress.progress_percentage) }}>
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
              <span className={styles.statValue}>{courseProgress.progress_percentage}%</span>
            </div>
            <span className={styles.statLabel}>Overall Progress</span>
          </div>
          
          <div className={styles.statDetails}>
            <div className={styles.detailRow}>
              <label>Status</label>
              <span className={`${styles.statusBadge} ${getStatusClass(courseProgress.status)}`}>
                {courseProgress.status || 'Not Started'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <label>Started At</label>
              <span>{formatDate(courseProgress.started_at)}</span>
            </div>
            <div className={styles.detailRow}>
              <label>Completed At</label>
              <span>{formatDate(courseProgress.completed_at)}</span>
            </div>
            <div className={styles.detailRow}>
              <label>Last Visited</label>
              <span>{formatDate(courseProgress.last_accessed_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topic-wise Progress */}
      <div className={styles.topicsSection}>
        <h2>Topic-wise Progress</h2>
        
        {topics.length === 0 ? (
          <div className={styles.emptyTopics}>
            <p>No topics available for this course.</p>
          </div>
        ) : (
          <div className={styles.topicsList}>
            {topics.map((topic, index) => (
              <div key={topic.id} className={styles.topicCard}>
                <div 
                  className={`${styles.topicHeader} ${expandedTopics[topic.id] ? styles.topicHeaderExpanded : ''}`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  <div className={styles.topicInfo}>
                    <span className={styles.topicNumber}>{index + 1}</span>
                    <div className={styles.topicDetails}>
                      <h4>{topic.name || topic.title}</h4>
                      <p className={styles.topicMeta}>
                        {topic.progress?.segments_completed || 0} / {topic.progress?.segments_total || 0} segments completed
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.topicProgress}>
                    <div className={styles.progressBarWrapper}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ 
                          width: `${topic.progress?.progress_percentage || 0}%`,
                          backgroundColor: getProgressColor(topic.progress?.progress_percentage || 0)
                        }}
                      />
                    </div>
                    <span className={styles.progressText}>{topic.progress?.progress_percentage || 0}%</span>
                    <span className={`${styles.statusBadge} ${styles.statusBadgeSmall} ${getStatusClass(topic.progress?.status)}`}>
                      {topic.progress?.status || 'Not Started'}
                    </span>
                    <svg className={`${styles.expandIcon} ${expandedTopics[topic.id] ? styles.expandIconRotated : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {expandedTopics[topic.id] && (
                  <div className={styles.topicContent}>
                    <div className={styles.topicStats}>
                      <div className={styles.miniStat}>
                        <label>Started</label>
                        <span>{formatDate(topic.progress?.started_at)}</span>
                      </div>
                      <div className={styles.miniStat}>
                        <label>Completed</label>
                        <span>{formatDate(topic.progress?.completed_at)}</span>
                      </div>
                    </div>

                    {/* Segments List */}
                    <div className={styles.segmentsList}>
                      {topic.segments && topic.segments.length > 0 ? (
                        topic.segments.map((segment, segIndex) => {
                          const isPractice = segment.type_category === 'practice';
                          const hasQuestions = segment.questions?.length > 0;
                          const isExpandable = isPractice && hasQuestions;
                          const isExpanded = expandedSegments[`${segment.type_category}-${segment.id}`];
                          
                          return (
                            <div key={`${segment.type_category}-${segment.id}`} className={styles.segmentCard}>
                              <div 
                                className={`${styles.segmentHeader} ${isExpandable ? styles.segmentHeaderClickable : ''} ${isExpanded ? styles.segmentHeaderExpanded : ''}`}
                                onClick={() => isExpandable && toggleSegment(`${segment.type_category}-${segment.id}`)}
                              >
                                <div className={styles.segmentInfo}>
                                  <span className={`${styles.segmentTypeBadge} ${segment.type_category === 'lesson' ? getLessonTypeBadgeClass(segment.segment_type) : styles.segmentTypeBadgePractice}`}>
                                    {segment.type_category === 'lesson'
                                      ? (segment.segment_type === 'lesson_video'
                                        ? '🎬'
                                        : segment.segment_type === 'lesson_audio'
                                        ? '🎵'
                                        : segment.segment_type === 'lesson_document'
                                        ? '📄'
                                        : '📖')
                                      : '💻'}
                                  </span>
                                  <div className={styles.segmentDetails}>
                                    <h5>{segment.title || segment.name}</h5>
                                    <p className={styles.segmentMeta}>
                                      {segment.type_category === 'lesson'
                                        ? getLessonTypeLabel(segment.segment_type)
                                        : 'Practice'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className={styles.segmentProgress}>
                                  <span className={`${styles.statusBadge} ${styles.statusBadgeTiny} ${getStatusClass(segment.progress?.status)}`}>
                                    {segment.progress?.status || 'Not Started'}
                                  </span>
                                  <div className={`${styles.progressBarWrapper} ${styles.progressBarWrapperSmall}`}>
                                    <div 
                                      className={styles.progressBarFill}
                                      style={{ 
                                        width: `${segment.progress?.progress_percentage || 0}%`,
                                        backgroundColor: getProgressColor(segment.progress?.progress_percentage || 0)
                                      }}
                                    />
                                  </div>
                                  <span className={styles.progressText}>{segment.progress?.progress_percentage || 0}%</span>
                                  {isExpandable && (
                                    <svg className={`${styles.expandIcon} ${styles.expandIconSmall} ${isExpanded ? styles.expandIconRotated : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {/* Questions List - Expandable for Practice segments */}
                              {isExpanded && hasQuestions && (
                                <div className={styles.segmentContent}>
                                  <div className={styles.questionsList}>
                                    <div className={styles.questionsHeader}>
                                      <span>Question</span>
                                      <span>Type</span>
                                      <span>Score</span>
                                      <span>Test Cases</span>
                                      <span>Attempts</span>
                                      <span>Status</span>
                                      <span>Action</span>
                                    </div>
                                    {segment.questions.map((question, qIndex) => (
                                      <div key={question.id} className={styles.questionRow}>
                                        <span className={styles.questionText}>
                                          {qIndex + 1}. {question.question_text?.substring(0, 50)}
                                          {question.question_text?.length > 50 ? '...' : ''}
                                        </span>
                                        <span className={`${styles.questionType} ${question.question_type === 'mcq' ? styles.questionTypeMcq : styles.questionTypeProgramming}`}>
                                          {question.question_type === 'mcq' ? 'MCQ' : 'Code'}
                                        </span>
                                        <span className={styles.questionScore}>
                                          {question.question_type === 'mcq' 
                                            ? `${question.best_score || 0}/${question.max_score || 100}`
                                            : `${question.best_score || 0}/${question.max_score || 100}`
                                          }
                                        </span>
                                        <span className={styles.questionTestCases}>
                                          {question.question_type === 'programming' 
                                            ? `${question.best_test_cases_passed || 0}/${question.test_cases_total || 0}`
                                            : '-'
                                          }
                                        </span>
                                        <span className={styles.questionAttempts}>
                                          {question.attempt_count || 0}
                                        </span>
                                        <span className={`${styles.questionStatus} ${question.is_correct ? styles.questionStatusCorrect : question.status === 'answered' || question.status === 'submitted' || question.status === 'completed' ? styles.questionStatusAttempted : styles.questionStatusUnattempted}`}>
                                          {question.is_correct ? '✓ Correct' : question.status === 'answered' || question.status === 'submitted' || question.status === 'completed' ? 'Attempted' : 'Not Attempted'}
                                        </span>
                                        <span className={styles.questionAction}>
                                          {question.question_type === 'programming' && (question.best_submitted_code || question.last_submitted_code) ? (
                                            <button 
                                              className={styles.btnShowCode}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCodeModalData({
                                                  questionName: question.question_text,
                                                  language: question.language_used || 'Unknown',
                                                  code: question.best_submitted_code || question.last_submitted_code,
                                                  bestScore: question.best_score,
                                                  testCasesPassed: question.best_test_cases_passed,
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
                                          ) : (
                                            <span className={styles.noAction}>-</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.emptySegments}>
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
                    Score: {codeModalData.bestScore}/{100}
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
                  toast.success('Code copied to clipboard!');
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

export default ProgressReport
