import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'

function Header({ user, logout, onToggleSidebar, isSidebarCollapsed }) {
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

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

