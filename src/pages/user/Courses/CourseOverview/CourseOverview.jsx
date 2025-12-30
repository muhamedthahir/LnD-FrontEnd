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
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({})
  const [stats, setStats] = useState({
    lessons: 0,
    practiceExercises: 0,
    assessments: 0
  })

  useEffect(() => {
    if (id) {
      fetchCourse()
      fetchSections()
    }
  }, [id])

  useEffect(() => {
    calculateStats()
  }, [sectionLessons])

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

      // Fetch lessons for all sections
      const lessonsMap = {}
      for (const section of data) {
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
      }
      setSectionLessons(lessonsMap)
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const calculateStats = () => {
    let totalLessons = 0
    let totalPracticeExercises = 0

    Object.values(sectionLessons).forEach(lessons => {
      lessons.forEach(lesson => {
        // Check if it's a practice exercise based on segment_type or name
        const segmentType = (lesson.segment_type || '').toLowerCase()
        const lessonName = ((lesson.name || lesson.title || '')).toLowerCase()
        
        const isPracticeExercise = 
          segmentType.includes('practice') || 
          segmentType.includes('exercise') ||
          segmentType === 'practice' ||
          lessonName.includes('practice') ||
          lessonName.includes('exercise')
        
        if (isPracticeExercise) {
          totalPracticeExercises++
        } else {
          // Count as lesson if not a practice exercise
          totalLessons++
        }
      })
    })

    setStats({
      lessons: totalLessons,
      practiceExercises: totalPracticeExercises,
      assessments: 0 // Assessments would need to be fetched separately if available
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
              className="btn-start-course"
              onClick={handleStartCourse}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Course
            </button>
          </div>
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
              const isExpanded = expandedSections[section.id]

              return (
                <div key={section.id} className="section-item">
                  <button
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="section-header-left">
                      <span className="section-number">{index + 1}</span>
                      <div className="section-title-wrapper">
                        <h3>{section.title}</h3>
                        {section.description && (
                          <p className="section-description">{section.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="section-header-right">
                      <span className="lesson-count">{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span>
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

                  {isExpanded && lessons.length > 0 && (
                    <div className="lessons-list">
                      {lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          className="lesson-item"
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <span className="lesson-number">{lessonIndex + 1}</span>
                          <span className="lesson-title">{lesson.title || lesson.name || 'Untitled Lesson'}</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      ))}
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

