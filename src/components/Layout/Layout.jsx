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
      checkAuth()
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

  const checkAuth = async () => {
    if (!apiBaseUrl) return // Wait for API config to load
    
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}`, {
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
      } else {
        // Clear stale localStorage if session is invalid
        localStorage.removeItem('user')
        navigate('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Don't rely on localStorage if API call fails - force login
      localStorage.removeItem('user')
      navigate('/login')
    } finally {
      setLoading(false)
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

