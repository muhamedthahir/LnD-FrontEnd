import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import './Layout.css'

function Layout() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
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
    try {
      const response = await fetch('http://localhost:3000/api/auth/check', {
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
      <Sidebar user={user} logout={logout} />
      <main className="layout-main">
        <Outlet context={{ user, logout }} />
      </main>
    </div>
  )
}

export default Layout

