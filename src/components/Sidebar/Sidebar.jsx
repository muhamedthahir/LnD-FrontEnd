import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import './Sidebar.css'

function Sidebar({ user, logout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true
    if (path === '/courses' && location.pathname.startsWith('/courses')) return true
    if (path === '/assessments' && location.pathname.startsWith('/assessments')) return true
    if (path === '/admin' && location.pathname.startsWith('/admin')) return true
    return false
  }

  const isAdmin = user?.role === 'primary_admin' || user?.role === 'college_admin'
  const isPrimaryAdmin = user?.role === 'primary_admin'

  const handleLogout = async () => {
    if (logout) {
      await logout()
    } else {
      try {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })
        localStorage.removeItem('user')
        navigate('/login')
      } catch (error) {
        console.error('Logout failed:', error)
        localStorage.removeItem('user')
        navigate('/login')
      }
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Menu</h2>
        <div className="sidebar-theme-toggle">
          <ThemeToggle />
        </div>
      </div>
      
      <nav className="sidebar-nav">
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

        {!isPrimaryAdmin && (
          <>
            <Link 
              to="/courses" 
              className={`nav-item ${isActive('/courses') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>Courses</span>
            </Link>

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
          </>
        )}

        {user?.role === 'primary_admin' && (
          <div className="nav-section">
            <div className="nav-section-label">Institutions</div>
            
            <Link 
              to="/admin/institutions" 
              className={`nav-item ${isActive('/admin') && location.pathname.includes('institutions') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Institutions</span>
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="nav-section">
            <div className="nav-section-label">Administration</div>
            
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Groups</span>
            </Link>

            <Link 
              to="/admin/courses" 
              className={`nav-item ${isActive('/admin') && location.pathname.includes('courses') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>Courses</span>
            </Link>

            <Link 
              to="/admin/assessments" 
              className={`nav-item ${isActive('/admin') && location.pathname.includes('assessments') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span>Assessments</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

