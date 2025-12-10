import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import './Courses.css'

function Courses() {
  const { user } = useOutletContext()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('invited')
  const statuses = ['invited', 'inProgress', 'completed', 'Expired']

  useEffect(() => {
    fetchCourses()
  }, [activeStatus])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `http://localhost:3000/api/enrollments?status=${activeStatus}`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.enrollments || [])
      } else {
        console.error('Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      invited: '#3b82f6',
      inProgress: '#f59e0b',
      completed: '#10b981',
      Expired: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const getStatusLabel = (status) => {
    const labels = {
      invited: 'Invited',
      inProgress: 'In Progress',
      completed: 'Completed',
      Expired: 'Expired'
    }
    return labels[status] || status
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>My Courses</h1>
        <p>Manage and track your course enrollments</p>
      </div>

      <div className="status-navbar">
        {statuses.map((status) => (
          <button
            key={status}
            className={`status-tab ${activeStatus === status ? 'active' : ''}`}
            onClick={() => setActiveStatus(status)}
            style={{
              '--status-color': getStatusColor(status)
            }}
          >
            {getStatusLabel(status)}
            {courses.length > 0 && (
              <span className="status-count">
                {courses.filter(c => c.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="courses-content">
        {loading ? (
          <div className="courses-loading">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="courses-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <h3>No courses found</h3>
            <p>You don't have any courses with status "{getStatusLabel(activeStatus)}"</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((enrollment) => (
              <div key={enrollment.id} className="course-card">
                <div className="course-header">
                  <h3>{enrollment.course_name}</h3>
                  <span 
                    className="course-status-badge"
                    style={{ backgroundColor: getStatusColor(enrollment.status) }}
                  >
                    {getStatusLabel(enrollment.status)}
                  </span>
                </div>
                <p className="course-description">
                  {enrollment.course_description || 'No description available'}
                </p>
                <div className="course-footer">
                  <span className="course-date">
                    Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </span>
                  <button className="course-action-btn">
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses

