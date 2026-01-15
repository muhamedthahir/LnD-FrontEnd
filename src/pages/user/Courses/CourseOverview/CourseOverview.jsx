import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import './CourseOverview.css'

function CourseOverview() {
  const { apiBaseUrl, accessToken } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionLessons, setSectionLessons] = useState({})
  const [sectionPracticeSegments, setSectionPracticeSegments] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({})
  const [stats, setStats] = useState({
    lessons: 0,
    practiceExercises: 0,
    assessments: 0
  })
  const [courseProgress, setCourseProgress] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [lastAccessedSegment, setLastAccessedSegment] = useState(null)

  useEffect(() => {
    if (id) {
      fetchCourse()
      fetchSections()
      fetchCourseProgress()
    }
    
    // Listen for progress updates to refresh course progress
    const handleProgressUpdate = (event) => {
      if (event.detail?.courseId === id || event.detail?.courseId === parseInt(id)) {
        fetchCourseProgress()
      }
    }
    
    window.addEventListener('courseProgressUpdated', handleProgressUpdate)
    
    return () => {
      window.removeEventListener('courseProgressUpdated', handleProgressUpdate)
    }
  }, [id])

  useEffect(() => {
    calculateStats()
  }, [sectionLessons, sectionPracticeSegments])

  const fetchCourseProgress = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/submissions/progress/course/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Normalize the progress data to use consistent field names
        const normalizedData = {
          ...data,
          progress_percentage: data.overall_progress || data.progress_percentage || 0,
          status: data.overall_status || data.status || 'not_started'
        }
        setCourseProgress(normalizedData)
        
        // Check if user has started the course (has any progress)
        const hasProgress = normalizedData.progress_percentage > 0 || 
          data.topics?.some(t => t.progress_status === 'in_progress' || t.progress_status === 'completed')
        setHasStarted(hasProgress)
        
        // Find the last accessed segment to resume from
        if (data.topics) {
          let lastAccessed = null
          let latestTime = null
          
          for (const topic of data.topics) {
            // Check regular lessons
            if (topic.lessons) {
              for (const lesson of topic.lessons) {
                if (lesson.last_accessed_at) {
                  const accessTime = new Date(lesson.last_accessed_at)
                  if (!latestTime || accessTime > latestTime) {
                    latestTime = accessTime
                    lastAccessed = {
                      type: 'lesson',
                      segmentId: lesson.id,
                      topicId: topic.id,
                      status: lesson.progress_status
                    }
                  }
                }
              }
            }
            // Check practice segments
            if (topic.practice_segments) {
              for (const practice of topic.practice_segments) {
                if (practice.last_accessed_at) {
                  const accessTime = new Date(practice.last_accessed_at)
                  if (!latestTime || accessTime > latestTime) {
                    latestTime = accessTime
                    lastAccessed = {
                      type: 'practice',
                      segmentId: practice.id,
                      topicId: topic.id,
                      status: practice.progress_status
                    }
                  }
                }
              }
            }
          }
          setLastAccessedSegment(lastAccessed)
        }
      }
    } catch (error) {
      console.error('Error fetching course progress:', error)
    }
  }

  // Get progress for a specific topic
  const getTopicProgress = (topicId) => {
    if (!courseProgress?.topics) return null
    return courseProgress.topics.find(t => t.id === topicId)
  }

  // Get progress for a specific segment
  const getSegmentProgress = (segmentId, isPractice = false) => {
    if (!courseProgress?.topics) return null
    
    for (const topic of courseProgress.topics) {
      if (isPractice && topic.practice_segments) {
        const practice = topic.practice_segments.find(p => p.id === segmentId)
        if (practice) return practice
      } else if (topic.lessons) {
        const lesson = topic.lessons.find(l => l.id === segmentId)
        if (lesson) return lesson
      }
    }
    return null
  }

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'in_progress': return 'status-in-progress'
      default: return 'status-not-started'
    }
  }

  // Format status text
  const formatStatus = (status) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      default: return 'Not Started'
    }
  }

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      navigate('/courses/user-courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.GET_BY_COURSE(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) throw new Error('Failed to fetch sections')

      const data = await response.json()
      setSections(data)

      // Fetch lessons and practice segments for all sections
      const lessonsMap = {}
      const practiceSegmentsMap = {}
      
      for (const section of data) {
        // Fetch regular segments (lessons)
        try {
          const lessonsResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET_BY_TOPIC(section.id)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
            }
          })
          if (lessonsResponse.ok) {
            const lessons = await lessonsResponse.json()
            lessonsMap[section.id] = lessons
          }
        } catch (err) {
          console.error(`Error fetching lessons for section ${section.id}:`, err)
          lessonsMap[section.id] = []
        }

        // Fetch practice segments
        try {
          const practiceResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.LIST_BY_TOPIC(section.id)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
            }
          })
          if (practiceResponse.ok) {
            const practiceSegments = await practiceResponse.json()
            practiceSegmentsMap[section.id] = practiceSegments
          }
        } catch (err) {
          console.error(`Error fetching practice segments for section ${section.id}:`, err)
          practiceSegmentsMap[section.id] = []
        }
      }
      
      setSectionLessons(lessonsMap)
      setSectionPracticeSegments(practiceSegmentsMap)
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const calculateStats = () => {
    let totalLessons = 0
    let totalPracticeExercises = 0
    let totalAssessments = 0

    // Count regular segments (lessons and assessments)
    Object.values(sectionLessons).forEach(lessons => {
      lessons.forEach(lesson => {
        const segmentType = (lesson.segment_type || '').toLowerCase()
        
        // Check if it's an assessment
        if (segmentType === 'assessment' || segmentType.includes('assessment')) {
          totalAssessments++
        } else {
          // Count as lesson (video, audio, document, article, etc.)
          totalLessons++
        }
      })
    })

    // Count practice segments from the practice_segments table
    Object.values(sectionPracticeSegments).forEach(practiceSegments => {
      totalPracticeExercises += practiceSegments.length
    })

    setStats({
      lessons: totalLessons,
      practiceExercises: totalPracticeExercises,
      assessments: totalAssessments
    })
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleLessonClick = (lesson) => {
    // Navigate to lesson view if needed
    console.log('Lesson clicked:', lesson)
    // You can implement lesson viewing logic here
  }

  const handleStartCourse = async () => {
    try {
      // If resuming, navigate directly to the last accessed segment
      if (hasStarted && lastAccessedSegment) {
        if (lastAccessedSegment.type === 'practice') {
          navigate(`/courses/${id}/practice/${lastAccessedSegment.segmentId}`)
        } else {
          navigate(`/courses/${id}/current`)
        }
        return
      }

      const response = await fetch(`${apiBaseUrl}/api/user-courses/start/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start course')
      }

      // Navigate to current course page
      navigate(`/courses/${id}/current`)
    } catch (error) {
      console.error('Error starting course:', error)
      alert(error.message || 'Failed to start course')
    }
  }

  if (loading) {
    return (
      <div className="course-overview-page">
        <div className="loading">Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="course-overview-page">
        <div className="empty-state">
          <h3>Course not found</h3>
          <button onClick={() => navigate('/courses/user-courses')} className="btn-back">
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="course-overview-page">
      <button onClick={() => navigate('/courses/user-courses')} className="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Courses
      </button>

      <div className="course-header">
        {course.thumbnail && (
          <div className="course-thumbnail-large">
            <img src={course.thumbnail} alt={course.name} />
          </div>
        )}
        <div className="course-header-content">
          <div className="course-meta">
            {course.category && (
              <span className="course-category-badge">{course.category}</span>
            )}
            {course.competency_level && (
              <span className={`competency-badge ${course.competency_level}`}>
                {course.competency_level.charAt(0).toUpperCase() + course.competency_level.slice(1)}
              </span>
            )}
          </div>
          <div className="course-title-row">
            <h1>{course.name}</h1>
            <button 
              className={`btn-start-course ${hasStarted ? 'resume' : ''}`}
              onClick={handleStartCourse}
            >
              {hasStarted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Resume Course
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Start Course
                </>
              )}
            </button>
          </div>
          
          {/* Course Progress Badge */}
          {(courseProgress?.progress_percentage > 0 || hasStarted) && (
            <div className={`course-progress-badge ${courseProgress?.progress_percentage >= 100 ? 'completed' : 'in-progress'}`}>
              {courseProgress?.progress_percentage >= 100 ? (
                <>
                  <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="badge-text">Course Completed</span>
                </>
              ) : (
                <>
                  <span className="badge-percent">{courseProgress?.progress_percentage || 0}%</span>
                  <span className="badge-text">Completed</span>
                </>
              )}
            </div>
          )}
          {course.short_description && (
            <p className="course-description">{course.short_description}</p>
          )}

          {/* Course Statistics */}
          <div className="course-stats">
            <div className="stat-item">
              <div className="stat-icon lessons-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.lessons}</span>
                <span className="stat-label">Lessons</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon exercises-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.practiceExercises}</span>
                <span className="stat-label">Practice Exercises</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon assessments-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.assessments}</span>
                <span className="stat-label">Assessments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {course.course_outcomes && (
        <div className="course-section">
          <h2>Course Outcomes</h2>
          <div className="course-outcomes">
            {course.course_outcomes.split('\n').filter(line => line.trim()).map((outcome, index) => (
              <div key={index} className="outcome-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{outcome.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="course-section">
        <h2>Course Content</h2>
        {sections.length === 0 ? (
          <div className="empty-content">
            <p>No content available for this course yet.</p>
          </div>
        ) : (
          <div className="sections-list">
            {sections.map((section, index) => {
              const lessons = sectionLessons[section.id] || []
              const practiceSegments = sectionPracticeSegments[section.id] || []
              const isExpanded = expandedSections[section.id]
              const topicProgress = getTopicProgress(section.id)
              
              // Separate lessons and assessments
              const regularLessons = lessons.filter(l => {
                const segmentType = (l.segment_type || '').toLowerCase()
                return !segmentType.includes('assessment')
              })
              const assessments = lessons.filter(l => {
                const segmentType = (l.segment_type || '').toLowerCase()
                return segmentType.includes('assessment')
              })
              
              // Calculate total items count
              const totalItems = regularLessons.length + practiceSegments.length + assessments.length

              return (
                <div key={section.id} className={`section-item ${topicProgress?.progress_status ? getStatusClass(topicProgress.progress_status) : ''}`}>
                  <button
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="section-header-left">
                      <span className={`section-number ${topicProgress?.progress_status === 'completed' ? 'completed' : ''}`}>
                        {topicProgress?.progress_status === 'completed' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="section-title-wrapper">
                        <h3>{section.title || section.name}</h3>
                        {section.description && (
                          <p className="section-description">{section.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="section-header-right">
                      {/* Topic Progress Bar - Always visible for sections with content */}
                      {totalItems > 0 && (
                        <div className={`section-progress ${topicProgress?.progress_status === 'completed' ? 'completed' : topicProgress?.progress_percentage > 0 ? 'in-progress' : ''}`}>
                          <div className="section-progress-bar">
                            <div 
                              className={`section-progress-fill ${topicProgress?.progress_status === 'completed' ? 'completed' : ''}`}
                              style={{ width: `${topicProgress?.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className={`section-progress-text ${topicProgress?.progress_status === 'completed' ? 'completed' : ''}`}>
                            {topicProgress?.progress_percentage || 0}%
                          </span>
                        </div>
                      )}
                      <div className="section-counts">
                        {regularLessons.length > 0 && (
                          <span className="count-badge lessons-badge">
                            {regularLessons.length} {regularLessons.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                        )}
                        {practiceSegments.length > 0 && (
                          <span className="count-badge practice-badge">
                            {practiceSegments.length} {practiceSegments.length === 1 ? 'practice' : 'practices'}
                          </span>
                        )}
                        {assessments.length > 0 && (
                          <span className="count-badge assessment-badge">
                            {assessments.length} {assessments.length === 1 ? 'assessment' : 'assessments'}
                          </span>
                        )}
                        {totalItems === 0 && (
                          <span className="count-badge empty-badge">No content</span>
                        )}
                      </div>
                      <svg
                        className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {isExpanded && totalItems > 0 && (
                    <div className="lessons-list">
                      {/* Regular Lessons */}
                      {regularLessons.map((lesson, lessonIndex) => {
                        const segmentType = (lesson.segment_type || '').toLowerCase()
                        const segmentProgress = getSegmentProgress(lesson.id, false)
                        const isCompleted = segmentProgress?.progress_status === 'completed'
                        const isInProgress = segmentProgress?.progress_status === 'in_progress'
                        
                        return (
                          <button
                            key={`lesson-${lesson.id}`}
                            className={`lesson-item ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <span className={`lesson-icon ${isCompleted ? 'completed' : ''}`}>
                              {isCompleted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : segmentType.includes('video') ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              ) : segmentType.includes('audio') ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 18V5l12-2v13"/>
                                  <circle cx="6" cy="18" r="3"/>
                                  <circle cx="18" cy="16" r="3"/>
                                </svg>
                              ) : segmentType.includes('document') ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                              ) : segmentType.includes('article') ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                              )}
                            </span>
                            <span className="lesson-title">{lesson.title || lesson.name || 'Untitled Lesson'}</span>
                            <div className="lesson-status-area">
                              {segmentProgress && segmentProgress.progress_percentage > 0 && !isCompleted && (
                                <span className="segment-progress-badge">{segmentProgress.progress_percentage}%</span>
                              )}
                              {isCompleted && (
                                <span className="segment-status-badge completed">Completed</span>
                              )}
                              {isInProgress && !isCompleted && (
                                <span className="segment-status-badge in-progress">In Progress</span>
                              )}
                              <span className="item-type-tag lesson-tag">Lesson</span>
                            </div>
                          </button>
                        )
                      })}
                      
                      {/* Practice Segments */}
                      {practiceSegments.map((practice) => {
                        const practiceProgress = getSegmentProgress(practice.id, true)
                        const isCompleted = practiceProgress?.progress_status === 'completed'
                        const isInProgress = practiceProgress?.progress_status === 'in_progress'
                        
                        return (
                          <button
                            key={`practice-${practice.id}`}
                            className={`lesson-item practice-item ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`}
                            onClick={() => handleLessonClick(practice)}
                          >
                            <span className={`lesson-icon practice-icon ${isCompleted ? 'completed' : ''}`}>
                              {isCompleted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                              )}
                            </span>
                            <span className="lesson-title">{practice.name || 'Practice Exercise'}</span>
                            <div className="lesson-status-area">
                              {practiceProgress && practiceProgress.progress_percentage > 0 && !isCompleted && (
                                <span className="segment-progress-badge">{practiceProgress.progress_percentage}%</span>
                              )}
                              {isCompleted && (
                                <span className="segment-status-badge completed">Completed</span>
                              )}
                              {isInProgress && !isCompleted && (
                                <span className="segment-status-badge in-progress">In Progress</span>
                              )}
                              <span className="item-type-tag practice-tag">Practice</span>
                            </div>
                          </button>
                        )
                      })}
                      
                      {/* Assessments */}
                      {assessments.map((assessment) => {
                        const assessmentProgress = getSegmentProgress(assessment.id, false)
                        const isCompleted = assessmentProgress?.progress_status === 'completed'
                        
                        return (
                          <button
                            key={`assessment-${assessment.id}`}
                            className={`lesson-item assessment-item ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleLessonClick(assessment)}
                          >
                            <span className={`lesson-icon assessment-icon ${isCompleted ? 'completed' : ''}`}>
                              {isCompleted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                              )}
                            </span>
                            <span className="lesson-title">{assessment.title || assessment.name || 'Assessment'}</span>
                            <div className="lesson-status-area">
                              {isCompleted && (
                                <span className="segment-status-badge completed">Completed</span>
                              )}
                              <span className="item-type-tag assessment-tag">Assessment</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseOverview

