import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import styles from './SecureLayout.module.css'

/**
 * SecureLayout - A minimal layout for secure/proctored assessment windows
 * No sidebar, no header navigation - just the content
 */
function SecureLayout() {
  const { apiBaseUrl, accessToken, refreshToken, clearTokens } = useApi()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [apiBaseUrl, accessToken])

  const checkAuth = async () => {
    if (!apiBaseUrl) {
      setLoading(true)
      return
    }

    try {
      const token = accessToken || localStorage.getItem('accessToken')
      
      if (!token) {
        clearTokens()
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
        // In secure mode, just show an error instead of redirecting
        return
      }

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        setLoading(false)
      } else {
        // Token is invalid, try refresh
        const storedRefreshToken = refreshToken || localStorage.getItem('refreshToken')
        if (storedRefreshToken) {
          try {
            const refreshResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.REFRESH_TOKEN}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refreshToken: storedRefreshToken })
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

        clearTokens()
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading secure assessment...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Session Expired</h2>
          <p>Your session has expired. Please close this window and start the assessment again from the main window.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.secureLayout}>
      <main className={styles.main}>
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}

export default SecureLayout

