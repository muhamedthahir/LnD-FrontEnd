import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import './Layout.css'

function Layout() {
  const { apiBaseUrl } = useApi()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed))
    document.documentElement.setAttribute('data-sidebar-collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  useEffect(() => {
    if (apiBaseUrl) {
      // Add a small delay to ensure session cookie is set after login
      // This prevents the refresh loop when navigating immediately after login
      const timer = setTimeout(() => {
        checkAuth()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [apiBaseUrl])

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        credentials: 'include'
      })
      localStorage.removeItem('user')
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      localStorage.removeItem('user')
      setUser(null)
      navigate('/login')
    }
  }

  const checkAuth = async (retryCount = 0) => {
    if (!apiBaseUrl) return // Wait for API config to load
    
    // First check localStorage - if user exists, set it immediately for better UX
    const cachedUser = localStorage.getItem('user')
    if (cachedUser && retryCount === 0) {
      try {
        const user = JSON.parse(cachedUser)
        setUser(user)
        setLoading(false) // Show UI immediately
      } catch (e) {
        // Invalid cached user, continue with API check
      }
    }
    
    try {
      // Add cache-busting to prevent 304 responses
      const timestamp = new Date().getTime()
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}?t=${timestamp}`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
        // If we have a cached user and haven't retried yet, retry once
        // The user might have just logged in and cookie hasn't propagated yet
        if (cachedUser && retryCount === 0) {
          console.warn('Session check failed but cached user exists. Retrying in 1000ms...')
          setTimeout(() => {
            checkAuth(1) // Retry once
          }, 1000)
        } else {
          // Clear stale localStorage if session is invalid
          localStorage.removeItem('user')
          setUser(null)
          setLoading(false)
          // Only navigate to login if we're not already there
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true })
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // If we have cached user and haven't retried, retry once
      if (cachedUser && retryCount === 0) {
        console.warn('Auth check error but cached user exists. Retrying in 1000ms...')
        setTimeout(() => {
          checkAuth(1) // Retry once
        }, 1000)
      } else {
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
        // Only navigate to login if we're not already there
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="layout-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="layout">
      <Sidebar user={user} isCollapsed={isSidebarCollapsed} />
      <Header 
        user={user} 
        logout={logout} 
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <main className="layout-main">
        <Outlet context={{ user, logout }} />
      </main>
    </div>
  )
}

export default Layout

