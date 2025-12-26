import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import './Layout.css'

function Layout() {
  const { apiBaseUrl, accessToken, refreshToken, clearTokens } = useApi()
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
      checkAuth()
    }
  }, [apiBaseUrl, accessToken]) // Also check when access token changes

  const logout = async () => {
    try {
      // Call logout endpoint if refresh token exists
      if (refreshToken) {
        await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
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
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add Authorization header if access token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
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
        // Access token is invalid or expired
        // Try to refresh if we have a refresh token
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refreshToken })
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.accessToken && refreshData.user) {
                localStorage.setItem('accessToken', refreshData.accessToken)
                localStorage.setItem('user', JSON.stringify(refreshData.user))
                setUser(refreshData.user)
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

