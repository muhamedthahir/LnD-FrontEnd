import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useApi } from '../../contexts/ApiContext'
import './Header.css'

function Header({ user, logout, onToggleSidebar, isSidebarCollapsed }) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const { apiBaseUrl, accessToken } = useApi()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [courseProgress, setCourseProgress] = useState(null)
  const [courseName, setCourseName] = useState(null)
  const menuRef = useRef(null)
  
  // Check if we're on the current course page
  const isCurrentCoursePage = location.pathname.includes('/courses/') && location.pathname.includes('/current')
  const courseId = isCurrentCoursePage ? params.id : null

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Fetch course progress when on current course page
  useEffect(() => {
    if (isCurrentCoursePage && courseId) {
      fetchCourseProgress.current(courseId)
      fetchCourseName.current(courseId)
    } else {
      setCourseProgress(null)
      setCourseName(null)
    }
  }, [isCurrentCoursePage, courseId, apiBaseUrl, accessToken])

  // Listen for progress updates
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      if (event.detail?.courseId === courseId && isCurrentCoursePage) {
        fetchCourseProgress.current(courseId)
      }
    }

    window.addEventListener('courseProgressUpdated', handleProgressUpdate)
    return () => {
      window.removeEventListener('courseProgressUpdated', handleProgressUpdate)
    }
  }, [courseId, isCurrentCoursePage])

  const fetchCourseProgress = useRef(async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/user-courses/progress/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCourseProgress(data)
      }
    } catch (error) {
      console.error('Error fetching course progress:', error)
    }
  })

  const fetchCourseName = useRef(async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/courses/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCourseName(data.name)
      }
    } catch (error) {
      console.error('Error fetching course name:', error)
    }
  })

  const handleLogout = async () => {
    if (logout) {
      await logout()
    } else {
      // Fallback: just clear local storage and navigate
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      navigate('/login')
    }
    setShowUserMenu(false)
  }

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getUserName = () => {
    return user?.name || user?.email || 'User'
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-btn-header"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isSidebarCollapsed ? (
              <path d="M9 18l6-6-6-6"/>
            ) : (
              <path d="M15 18l-6-6 6-6"/>
            )}
          </svg>
        </button>
        
        {/* Course Progress Bar - shown only on current course page */}
        {isCurrentCoursePage && courseProgress && (
          <div className="header-course-progress">
            {courseName && (
              <span className="header-course-name">{courseName}</span>
            )}
            <div className="header-progress-bar">
              <div 
                className="header-progress-fill" 
                style={{ width: `${courseProgress.progress_percentage || 0}%` }}
              ></div>
            </div>
            <span className="header-progress-text">{courseProgress.progress_percentage || 0}%</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="user-menu-container" ref={menuRef}>
          <button 
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className="user-avatar header-user-avatar">
              {getUserInitial()}
            </div>
            <span className="user-name">{getUserName()}</span>
            <svg 
              className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-info">
                <div className="user-avatar-large">
                  {getUserInitial()}
                </div>
                <div className="user-menu-details">
                  <div className="user-menu-name">{getUserName()}</div>
                  <div className="user-menu-email">{user?.email || ''}</div>
                  <div className="user-menu-role">{user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}</div>
                </div>
              </div>
              <div className="user-menu-divider"></div>
              <button 
                className="user-menu-item"
                onClick={() => {
                  navigate('/personal-details')
                  setShowUserMenu(false)
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Personal Details</span>
              </button>
              <div className="user-menu-divider"></div>
              <button 
                className="user-menu-logout"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

