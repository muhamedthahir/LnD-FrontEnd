import { useNavigate, useOutletContext } from 'react-router-dom'
import './CourseCard.css'

function CourseCard({ course, showProgress = false }) {
  const navigate = useNavigate()
  const { user } = useOutletContext() || {}
  const isAdmin = user?.role === 'primary_admin' || user?.role === 'college_admin'

  const handleClick = () => {
    if (isAdmin) {
      // For admins, navigate to admin edit page
      navigate(`/admin/courses/management/${course.id}/edit`)
    } else {
      // For users, navigate to view page
      navigate(`/courses/${course.id}`)
    }
  }

  // Get progress percentage (default to 0 if not available)
  const progressPercentage = course.progress_percentage || 0

  return (
    <div className="course-card" onClick={handleClick}>
      {/* Top Half - Thumbnail with Proficiency Badge */}
      <div className="course-thumbnail">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.name} />
        ) : (
          <div className="course-thumbnail-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
        )}
        {/* Proficiency Badge - Bottom Left */}
        {course.competency_level && (
          <div className="proficiency-badge-container">
            <span className={`proficiency-badge ${course.competency_level}`}>
              {course.competency_level.charAt(0).toUpperCase() + course.competency_level.slice(1)}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom Half - Course Details */}
      <div className="course-info">
        <div className="course-category">{course.category || 'Uncategorized'}</div>
        <h3 className="course-name">{course.name}</h3>
        
        {/* Progress Bar for user courses */}
        {showProgress && (
          <div className="course-progress-container">
            <div className="course-progress-bar">
              <div 
                className="course-progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="course-progress-text">{progressPercentage}% Complete</span>
          </div>
        )}
        
        {!showProgress && (
          <div className="course-status-wrapper">
            <span className={`course-status ${course.status}`}>
              {course.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseCard

