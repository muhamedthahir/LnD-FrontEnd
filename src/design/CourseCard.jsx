import { Link, useOutletContext } from 'react-router-dom'
import Icon from './Icon'
export default function CourseCard({ course, showProgress = false }) {
  const { user } = useOutletContext() || {}
  const isAdmin = ['primary_admin','campuszen_admin','college_admin'].includes(user?.role)
  const expired = !isAdmin && [course.enrollment_status,course.user_course_status,course.course_status].some(value => String(value).toLowerCase() === 'expired')
  const progress = Math.max(0,Math.min(100,Number(course.progress_percentage) || 0))
  const href = isAdmin ? `/admin/courses/management/${course.id}/edit` : `/courses/${course.id}`
  return <article className={`cz-course-card ${expired ? 'is-expired' : ''}`}>
    <div className="cz-course-cover">{course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy"/> : <Icon name="book"/>}<span>{course.competency_level || 'Learning path'}</span></div>
    <div className="cz-course-content"><span className="cz-eyebrow">{course.category || 'Course'}</span><h3>{course.name}</h3>{showProgress ? <div className="cz-course-progress"><progress aria-label={`${course.name} progress`} value={progress} max={100}/><span>{progress}% complete</span></div> : <span className="cz-course-status">{course.status === 'published' ? 'Published' : 'Draft'}</span>}
      {expired ? <span className="cz-course-expired">Access expired</span> : <Link className="cz-course-action" to={href}>{isAdmin ? 'Manage course' : progress > 0 ? 'Continue learning' : 'Explore course'}<Icon name="arrow"/></Link>}</div>
  </article>
}
