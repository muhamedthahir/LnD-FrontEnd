import { useNavigate, useOutletContext } from 'react-router-dom'
import styles from './CourseCard.module.css'

function CourseCard({ course, showProgress = false }) {
  const navigate = useNavigate()
  const { user } = useOutletContext() || {}
  const isAdmin = user?.role === 'primary_admin' || user?.role === 'college_admin'
  
  // Check if course is expired (for students)
  // Check enrollment_status, user_course_status, or course_status
  const isExpired = !isAdmin && (
    course.enrollment_status === 'expired' || 
    course.enrollment_status === 'Expired' || 
    course.user_course_status === 'expired' ||
    course.course_status === 'expired'
  )

  const handleClick = () => {
    // Don't allow navigation if course is expired (for students)
    if (isExpired) {
      return
    }
    
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
    <div className={`${styles.card} ${isExpired ? styles.expired : ''}`} onClick={handleClick}>
      {/* Top Half - Thumbnail with Proficiency Badge */}
      <div className={styles.thumbnail}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.name} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
        )}
        {/* Proficiency Badge - Bottom Left */}
        {course.competency_level && (
          <div className={styles.proficiencyBadgeContainer}>
            <span className={`${styles.proficiencyBadge} ${styles[course.competency_level]}`}>
              {course.competency_level.charAt(0).toUpperCase() + course.competency_level.slice(1)}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom Half - Course Details */}
      <div className={styles.info}>
        <div className={styles.category}>{course.category || 'Uncategorized'}</div>
        <h3 className={styles.name}>{course.name}</h3>
        
        {/* Progress Bar for user courses */}
        {showProgress && !isExpired && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className={styles.progressText}>{progressPercentage}% Complete</span>
          </div>
        )}
        
        {/* Expired Badge */}
        {isExpired && (
          <div className={styles.expiredBadge}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Expired</span>
          </div>
        )}
        
        {!showProgress && !isExpired && (
          <div className={styles.statusWrapper}>
            <span className={`${styles.status} ${styles[course.status]}`}>
              {course.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseCard

