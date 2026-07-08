import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import styles from './Layout.module.css'

function Layout() {
  const { apiBaseUrl, accessToken, refreshToken, clearTokens, setTokens } = useApi()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // For small screens
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed))
    document.documentElement.setAttribute('data-sidebar-collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  const toggleSidebar = () => {
    // On small screens, toggle open state instead of collapsed state
    if (window.innerWidth <= 600) {
      setIsSidebarOpen(!isSidebarOpen)
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed)
    }
  }
  
  // Close sidebar when clicking outside on small screens
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 600 && isSidebarOpen) {
        const sidebar = document.querySelector('[class*="sidebar"]')
        if (sidebar && !sidebar.contains(event.target) && !event.target.closest('[class*="sidebarToggleBtn"]')) {
          setIsSidebarOpen(false)
        }
      }
    }
    
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (apiBaseUrl) {
      checkAuth()
    }
  }, [apiBaseUrl, accessToken]) // Also check when access token changes

  const logout = async () => {
    try {
      // Call logout endpoint if refresh token exists
      const rt = refreshToken || localStorage.getItem('refreshToken')
      if (rt) {
        await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken: rt })
        })
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Clear tokens and user data regardless of API call result
      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  const checkAuth = async (retryCount = 0) => {
    if (!apiBaseUrl) return // Wait for API config to load
    
    // First check localStorage - if user exists, set it immediately for better UX
    const cachedUser = localStorage.getItem('user')
    if (cachedUser && retryCount === 0) {
      try {
        const parsed = JSON.parse(cachedUser)
        setUser(parsed)
        setLoading(false) // Show UI immediately
      } catch (e) {
        // Invalid cached user, continue with API check
      }
    }
    
    const effectiveAccess = accessToken || localStorage.getItem('accessToken')
    const effectiveRefresh = refreshToken || localStorage.getItem('refreshToken')

    try {
      // Add cache-busting to prevent 304 responses
      const timestamp = new Date().getTime()
      const headers = {
        'Content-Type': 'application/json'
      }

      if (effectiveAccess) {
        headers['Authorization'] = `Bearer ${effectiveAccess}`
      }

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}?t=${timestamp}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.authenticated && data.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setLoading(false)
      } else {
        if (effectiveRefresh) {
          try {
            const refreshResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refreshToken: effectiveRefresh })
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.accessToken) {
                setTokens(refreshData.accessToken, effectiveRefresh)
                localStorage.setItem('accessToken', refreshData.accessToken)
                if (refreshData.user) {
                  localStorage.setItem('user', JSON.stringify(refreshData.user))
                  setUser(refreshData.user)
                }
                setLoading(false)
                return
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
          }
        }

        // If refresh failed or no refresh token, clear everything
        clearTokens()
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
        // Only navigate to login if we're not already there
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear tokens on error
      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
      // Only navigate to login if we're not already there
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {isSidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar 
        user={user} 
        isCollapsed={isSidebarCollapsed} 
        isOpen={isSidebarOpen}
      />
      <Header 
        user={user} 
        logout={logout} 
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <main className={styles.main}>
        <Outlet context={{ user, logout }} />
      </main>
    </div>
  )
}

export default Layout

