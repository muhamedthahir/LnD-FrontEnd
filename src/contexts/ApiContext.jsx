import { createContext, useContext, useState, useEffect } from 'react'
import { getConfig } from '../config'

const ApiContext = createContext()

export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

export const ApiProvider = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(() => {
    // Load access token from localStorage on initialization
    return localStorage.getItem('accessToken') || null
  })
  const [refreshToken, setRefreshToken] = useState(() => {
    // Load refresh token from localStorage on initialization
    return localStorage.getItem('refreshToken') || null
  })

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
    } else {
      localStorage.removeItem('accessToken')
    }
  }, [accessToken])

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }, [refreshToken])

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig()
        setApiBaseUrl(config.BACKEND_URL || '')
      } catch (error) {
        console.error('Failed to load API config:', error)
        setApiBaseUrl('')
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const setTokens = (accessToken, refreshTokenValue) => {
    setAccessToken(accessToken)
    if (refreshTokenValue) {
      setRefreshToken(refreshTokenValue)
    }
  }

  const clearTokens = () => {
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  // Auto-refresh token when access token expires
  useEffect(() => {
    if (!apiBaseUrl || !refreshToken) return

    const refreshAccessToken = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        })

        if (!response.ok) {
          // Refresh token is invalid, clear everything
          clearTokens()
          localStorage.removeItem('user')
          return
        }

        const data = await response.json()
        
        if (data.accessToken) {
          setAccessToken(data.accessToken)
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        clearTokens()
        localStorage.removeItem('user')
      }
    }

    // Check if access token is expired and refresh if needed
    const checkAndRefresh = async () => {
      if (!accessToken) {
        // No access token, try to refresh
        if (refreshToken) {
          await refreshAccessToken()
        }
        return
      }

      try {
        // Decode JWT to check expiration (without verification)
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        const expirationTime = payload.exp * 1000 // Convert to milliseconds
        const now = Date.now()
        const timeUntilExpiry = expirationTime - now

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await refreshAccessToken()
        }
      } catch (error) {
        // Token is invalid, try to refresh
        if (refreshToken) {
          await refreshAccessToken()
        }
      }
    }

    // Check immediately
    checkAndRefresh()

    // Set up interval to check every minute
    const interval = setInterval(checkAndRefresh, 60 * 1000)

    return () => clearInterval(interval)
  }, [apiBaseUrl, accessToken, refreshToken])

  return (
    <ApiContext.Provider value={{ 
      apiBaseUrl,
      isLoading, 
      accessToken, 
      refreshToken,
      setTokens, 
      clearTokens,
      // Legacy support
      token: accessToken,
      setToken: (token) => setAccessToken(token),
      clearToken: clearTokens
    }}>
      {children}
    </ApiContext.Provider>
  )
}

