import { Outlet } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import styles from './SecureLayout.module.css'

/**
 * SecureLayout - A minimal layout for secure/proctored assessment windows
 * No sidebar, no header navigation - just the content
 */
function SecureLayout() {
  const { apiBaseUrl, accessToken, refreshToken, clearTokens, setTokens, isLoading: apiLoading } = useApi()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const checkAuth = useCallback(async () => {
    // Wait for API context to finish loading
    if (apiLoading || !apiBaseUrl) {
      return
    }

    try {
      const token = accessToken || localStorage.getItem('accessToken')
      
      if (!token) {
        // Try to get user from localStorage as fallback
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
            setLoading(false)
            return
          } catch (e) {
            // Invalid stored user
          }
        }
        
        clearTokens()
        localStorage.removeItem('user')
        setUser(null)
        setLoading(false)
        return
      }

      // Use the correct auth check endpoint
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
        return
      }

      const storedRefreshToken = refreshToken || localStorage.getItem('refreshToken')
      if (storedRefreshToken) {
        try {
          const refreshResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: storedRefreshToken })
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            if (refreshData.accessToken) {
              setTokens(refreshData.accessToken, storedRefreshToken)
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

      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setLoading(false)
          return
        } catch (e) {
          // Invalid stored user
        }
      }

      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
    } catch (error) {
      console.error('Auth check failed:', error)
      
      // Even on network error, try to use stored user data for popup windows
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setLoading(false)
          return
        } catch (e) {
          // Invalid stored user
        }
      }
      
      clearTokens()
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, refreshToken, clearTokens, setTokens, apiLoading])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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


