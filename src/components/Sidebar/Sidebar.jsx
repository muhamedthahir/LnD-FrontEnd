import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import styles from './Sidebar.module.css'

function Sidebar({ user, isCollapsed, isOpen = false }) {
  const location = useLocation()
  const { theme } = useTheme()
  
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true
    if (path === '/courses/user-courses' && location.pathname === '/courses/user-courses') return true
    if (path === '/courses' && location.pathname.startsWith('/courses') && !location.pathname.startsWith('/admin/courses') && location.pathname !== '/courses/user-courses') return true
    if (path === '/assessments' && location.pathname.startsWith('/assessments') && !location.pathname.startsWith('/admin/assessments')) return true
    if (path === '/admin' && location.pathname.startsWith('/admin')) return true
    return false
  }

  const skillvantixEmail = 'mdfaridh142002@gmail.com'
  const isSkillvantixAdmin = user?.email && String(user.email).trim().toLowerCase() === skillvantixEmail
  const effectiveRole = isSkillvantixAdmin ? 'skillvantix_admin' : user?.role
  const adminRoles = ['primary_admin', 'college_admin', 'skillvantix_admin']
  const fullAdminRoles = ['primary_admin', 'skillvantix_admin']
  const isAdmin = adminRoles.includes(effectiveRole) || isSkillvantixAdmin
  const isPrimaryAdmin = effectiveRole === 'primary_admin'
  const isFullAdmin = fullAdminRoles.includes(effectiveRole) || isSkillvantixAdmin

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <h2>Menu</h2>
        <div className={styles.headerActions}>
          <div className={styles.themeToggle}>
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <nav className={styles.nav}>
        {/* Dashboard - Standalone */}
        <Link 
          to="/dashboard" 
          className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </Link>


        {/* User Administration Section */}
        {isAdmin && (
          <div className={styles.navSection}>
            <div className={styles.sectionLabel}>User Administration</div>
            
            {isFullAdmin && (
              <Link 
                to="/admin/institutions" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('institutions') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18v-2H3v2z"/>
                  <path d="M5 21V8l7-4 7 4v13"/>
                  <path d="M5 8h14"/>
                  <path d="M9 8v13"/>
                  <path d="M15 8v13"/>
                  <path d="M3 8l9-5 9 5"/>
                  <path d="M12 3v5"/>
                </svg>
                <span>Institutions</span>
              </Link>
            )}

            <Link 
              to="/admin/users" 
              className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('users') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Users</span>
            </Link>

            <Link 
              to="/admin/groups" 
              className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('groups') ? styles.active : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="6" r="2.2"/>
                <ellipse cx="12" cy="9.2" rx="3.2" ry="1.2"/>
                <circle cx="6.5" cy="14" r="2.0"/>
                <ellipse cx="6.5" cy="17" rx="3.0" ry="1.1"/>
                <circle cx="17.5" cy="14" r="2.0"/>
                <ellipse cx="17.5" cy="17" rx="3.0" ry="1.1"/>
              </svg>
              <span>Groups</span>
            </Link>

            {isFullAdmin && (
              <Link 
                to="/admin/mailer-templates" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('mailer-templates') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Mailer Templates</span>
              </Link>
            )}

          </div>
        )}

        {/* Question Management Section */}
        {isAdmin && (
          <div className={styles.navSection}>
            <div className={styles.sectionLabel}>Question Management</div>
            
            <Link 
              to="/admin/questions/banks" 
              className={`${styles.navItem} ${location.pathname.includes('/questions/banks') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Question Banks</span>
            </Link>

            <Link 
              to="/admin/questions/list" 
              className={`${styles.navItem} ${location.pathname.includes('/questions/list') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Questions</span>
            </Link>
          </div>
        )}

        {/* Course Management Section */}
        <div className={styles.navSection}>
          <div className={styles.sectionLabel}>Course</div>
          
          {!isAdmin && (
            <Link 
              to="/courses/user-courses" 
              className={`${styles.navItem} ${isActive('/courses/user-courses') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>My Courses</span>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link 
                to="/admin/courses/management" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('courses/management') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Management</span>
              </Link>

              <Link 
                to="/admin/courses/administrations" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('courses/administrations') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <span>Administrations</span>
              </Link>
            </>
          )}
        </div>

        {/* Assessment Management Section */}
        <div className={styles.navSection}>
          <div className={styles.sectionLabel}>Assessment</div>
          
          {!isFullAdmin && (
            <Link 
              to="/assessments" 
              className={`${styles.navItem} ${isActive('/assessments') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span>Assessments</span>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link 
                to="/admin/assessments/management" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('assessments/management') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Management</span>
              </Link>

              <Link 
                to="/admin/assessments/configurations" 
                className={`${styles.navItem} ${isActive('/admin') && location.pathname.includes('assessments/configurations') ? styles.active : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Configuration</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar

