import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, ERROR_MESSAGES } from '../../../../constants/constants'
import './CourseView.css'

function CourseView() {
  const { apiBaseUrl, accessToken } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sections')
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionLessons, setSectionLessons] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    if (!id || id === 'new') {
      toast.error('Invalid course')
      navigate('/courses')
      return
    }
    fetchCourse()
    fetchSections()
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      if (!response.ok) throw new Error('Failed to fetch course')
      const data = await response.json()
      
      // Only allow viewing published courses
      if (data.status !== 'published') {
        toast.error('This course is not available for viewing')
        navigate('/courses')
        return
      }
      
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error(ERROR_MESSAGES.COURSE_FETCH_FAILED)
      navigate('/courses')
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
      toast.error(ERROR_MESSAGES.SECTION_FETCH_FAILED)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleViewLesson = (lesson) => {
    // Navigate to lesson view (can be implemented later)
    toast.info(`Viewing lesson: ${lesson.name}`)
  }

  if (loading) {
    return <div className="course-edit-loading">Loading course...</div>
  }

  if (!course) {
    return null
  }

  return (
    <div className="course-edit-page">
      <div className="course-edit-header">
        <button className="back-button" onClick={() => navigate('/courses')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-content">
          <h1>{course.name}</h1>
        </div>
      </div>

      <div className="course-edit-tabs">
        <button 
          className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Course Content
        </button>
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Course Details
        </button>
      </div>

      <div className="course-edit-content">
        {activeTab === 'sections' && (
          <div className="sections-tab">
            {sections.length === 0 ? (
              <div className="empty-sections">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <h3>No Content Available</h3>
                <p>This course doesn't have any sections yet.</p>
              </div>
            ) : (
              <div className="sections-list">
                {sections.map(section => (
                  <div key={section.id} className="section-item">
                    <div className="section-header" onClick={() => toggleSection(section.id)}>
                      <div className="section-info">
                        <h4>{section.name}</h4>
                        {section.description && <p>{section.description}</p>}
                      </div>
                      <svg 
                        className={`expand-icon ${expandedSections[section.id] ? 'expanded' : ''}`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                    {expandedSections[section.id] && (
                      <div className="section-content">
                        <div className="section-items">
                          {sectionLessons[section.id] && sectionLessons[section.id].length > 0 ? (
                            <div className="lessons-list">
                              {sectionLessons[section.id].map(lesson => (
                                <div key={lesson.id} className="lesson-item" onClick={() => handleViewLesson(lesson)}>
                                  <div className="lesson-info">
                                    <h5>{lesson.name}</h5>
                                    <span className="lesson-type">{lesson.segment_type?.replace('lesson_', '') || 'Lesson'}</span>
                                  </div>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                  </svg>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-message">
                              <p>No lessons in this section</p>
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
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="course-details-view">
              <div className="details-content">
                <div className="detail-item">
                  <label>Course Name</label>
                  <p>{course.name || 'Not set'}</p>
                </div>
                <div className="detail-item">
                  <label>Category</label>
                  <p>{course.category || 'Not set'}</p>
                </div>
                <div className="detail-item">
                  <label>Short Description</label>
                  <p>{course.short_description || 'Not set'}</p>
                </div>
                <div className="detail-item">
                  <label>Competency Level</label>
                  <p>{course.competency_level ? course.competency_level.charAt(0).toUpperCase() + course.competency_level.slice(1) : 'Not set'}</p>
                </div>
                <div className="detail-item">
                  <label>Course Outcomes</label>
                  <p>{course.course_outcomes || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseView
