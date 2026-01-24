import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useApi } from '../../contexts/ApiContext'
import styles from './Header.module.css'

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
    <header className={styles.header}>
      <div className={styles.left}>
        <button 
          className={styles.sidebarToggleBtn}
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
          <div className={styles.courseProgress}>
            {courseName && (
              <span className={styles.courseName}>{courseName}</span>
            )}
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${courseProgress.progress_percentage || 0}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>{courseProgress.progress_percentage || 0}%</span>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.userMenuContainer} ref={menuRef}>
          <button 
            className={styles.userProfileBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className={`${styles.userAvatar} ${styles.headerUserAvatar}`}>
              {getUserInitial()}
            </div>
            <span className={styles.userName}>{getUserName()}</span>
            <svg 
              className={`${styles.menuArrow} ${showUserMenu ? styles.open : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className={styles.menuDropdown}>
              <div className={styles.menuInfo}>
                <div className={styles.avatarLarge}>
                  {getUserInitial()}
                </div>
                <div className={styles.menuDetails}>
                  <div className={styles.menuName}>{getUserName()}</div>
                  <div className={styles.menuEmail}>{user?.email || ''}</div>
                  <div className={styles.menuRole}>{user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}</div>
                </div>
              </div>
              <div className={styles.menuDivider}></div>
              <button 
                className={styles.menuItem}
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
              {user?.role === 'primary_admin' && (
                <>
                  <button 
                    className={styles.menuItem}
                    onClick={() => {
                      navigate('/admin/settings')
                      setShowUserMenu(false)
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Settings</span>
                  </button>
                </>
              )}
              <div className={styles.menuDivider}></div>
              <button 
                className={styles.menuLogout}
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

