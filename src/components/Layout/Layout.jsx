import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import { LoadingState } from '../../design/Primitives'
import { isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken } from '../../utils/authToken'

function Layout() {
  const { apiBaseUrl, accessToken, refreshToken, clearTokens, ensureAccessToken } = useApi()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // For small screens
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth <= 600
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

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
  
  useEffect(() => {
    if (apiBaseUrl) {
      if (user && (accessToken || localStorage.getItem('accessToken'))) {
        return
      }
      checkAuth()
    }
  }, [apiBaseUrl, accessToken]) // Re-check only when session is missing, not on token rotation

  const logout = async () => {
    try {
      // Call logout endpoint if refresh token exists
      const rt = refreshToken || localStorage.getItem('refreshToken')
      if (apiBaseUrl) {
        await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          credentials: 'include',
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
    
    const effectiveAccess = await ensureAccessToken() || accessToken || readStoredAccessToken()

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
        const next = await ensureAccessToken({ force: true })
        if (next && isAccessTokenUsable(next, 0)) {
          const retry = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}?t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${next}`
            }
          })
          if (retry.ok) {
            const retryData = await retry.json()
            if (retryData.authenticated && retryData.user) {
              setUser(retryData.user)
              localStorage.setItem('user', JSON.stringify(retryData.user))
              setLoading(false)
              return
            }
          }
        }

        if (readStoredRefreshToken() || readStoredAccessToken()) {
          setLoading(false)
          return
        }

        clearTokens()
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      if (readStoredRefreshToken() || readStoredAccessToken()) {
        setLoading(false)
        return
      }
      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    }
  }

  if (loading) {
    return (
      <div className="cz-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (pathname.startsWith('/admin/') && !['primary_admin', 'campuszen_admin', 'college_admin', 'admin'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="cz-shell">
      <a href="#workspace-content" className="cz-skip-link">Skip to content</a>
      <Sidebar 
        user={user} 
        isCollapsed={isSidebarCollapsed} 
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Header 
        user={user} 
        logout={logout} 
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        isSidebarOpen={isSidebarOpen}
        isMobile={isMobile}
      />
      <main className="cz-workspace" id="workspace-content">
        <Suspense fallback={<div className="cz-loading" role="status" aria-label="Loading page"><div className="spinner" /></div>}>
          <Outlet context={{ user, logout }} />
        </Suspense>
      </main>
    </div>
  )
}

export default Layout
