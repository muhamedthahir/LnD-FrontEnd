import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import './Sidebar.css'

function Sidebar({ user, isCollapsed }) {
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

  const isAdmin = user?.role === 'primary_admin' || user?.role === 'college_admin'
  const isPrimaryAdmin = user?.role === 'primary_admin'

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>Menu</h2>
        <div className="sidebar-header-actions">
          <div className="sidebar-theme-toggle">
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {/* Dashboard - Standalone */}
        <Link 
          to="/dashboard" 
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
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
          <div className="nav-section">
            <div className="nav-section-label">User Administration</div>
            
            {isPrimaryAdmin && (
              <Link 
                to="/admin/institutions" 
                className={`nav-item ${isActive('/admin') && location.pathname.includes('institutions') ? 'active' : ''}`}
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
              className={`nav-item ${isActive('/admin') && location.pathname.includes('users') ? 'active' : ''}`}
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
              className={`nav-item ${isActive('/admin') && location.pathname.includes('groups') ? 'active' : ''}`}
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
          </div>
        )}

        {/* Course Management Section */}
        <div className="nav-section">
          <div className="nav-section-label">Course</div>
          
          {!isAdmin && (
            <Link 
              to="/courses/user-courses" 
              className={`nav-item ${isActive('/courses/user-courses') ? 'active' : ''}`}
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
                className={`nav-item ${isActive('/admin') && location.pathname.includes('courses/management') ? 'active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Management</span>
              </Link>

              <Link 
                to="/admin/courses/administrations" 
                className={`nav-item ${isActive('/admin') && location.pathname.includes('courses/administrations') ? 'active' : ''}`}
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
        <div className="nav-section">
          <div className="nav-section-label">Assessment</div>
          
          {!isPrimaryAdmin && (
            <Link 
              to="/assessments" 
              className={`nav-item ${isActive('/assessments') ? 'active' : ''}`}
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
                className={`nav-item ${isActive('/admin') && location.pathname.includes('assessments/management') ? 'active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Management</span>
              </Link>

              <Link 
                to="/admin/assessments/administrations" 
                className={`nav-item ${isActive('/admin') && location.pathname.includes('assessments/administrations') ? 'active' : ''}`}
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
      </nav>
    </aside>
  )
}

export default Sidebar

