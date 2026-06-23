import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getConfig } from '../config'
import { API_ENDPOINTS } from '../constants/constants'

const ApiContext = createContext()

/** Persisted so "Remember me" preference survives reloads; cleared with auth. */
export const AUTH_REMEMBER_ME_KEY = 'lnd_auth_remember'

const readTokensFromStorage = () => ({
  access: localStorage.getItem('accessToken') || null,
  refresh: localStorage.getItem('refreshToken') || null
})

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

  const setTokens = useCallback((nextAccess, refreshTokenValue) => {
    setAccessToken(nextAccess || null)
    if (refreshTokenValue) {
      setRefreshToken(refreshTokenValue)
    }
  }, [])

  // Other tabs / same-tab: keep React state aligned with localStorage (storage does not fire in the tab that wrote).
  useEffect(() => {
    const applyStoredTokens = () => {
      const { access, refresh } = readTokensFromStorage()
      setAccessToken((prev) => (prev !== access ? access : prev))
      setRefreshToken((prev) => (prev !== refresh ? refresh : prev))
    }

    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return
      if (
        e.key === 'accessToken' ||
        e.key === 'refreshToken' ||
        e.key === null
      ) {
        applyStoredTokens()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', applyStoredTokens)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', applyStoredTokens)
    }
  }, [])

  const clearTokens = useCallback(() => {
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem(AUTH_REMEMBER_ME_KEY)
  }, [])

  // Auto-refresh token when access token expires
  useEffect(() => {
    if (!apiBaseUrl) return

    const getStoredRefresh = () => refreshToken || localStorage.getItem('refreshToken')
    const getStoredAccess = () => accessToken || localStorage.getItem('accessToken')

    const refreshAccessToken = async () => {
      const rt = getStoredRefresh()
      if (!rt) return

      try {
        const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken: rt })
        })

        if (!response.ok) {
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

    const checkAndRefresh = async () => {
      const at = getStoredAccess()
      const rt = getStoredRefresh()

      if (!at) {
        if (rt) await refreshAccessToken()
        return
      }

      try {
        const payload = JSON.parse(atob(at.split('.')[1]))
        const expirationTime = payload.exp * 1000
        const timeUntilExpiry = expirationTime - Date.now()

        if (timeUntilExpiry < 5 * 60 * 1000) {
          await refreshAccessToken()
        }
      } catch {
        if (rt) await refreshAccessToken()
      }
    }

    checkAndRefresh()
    const interval = setInterval(checkAndRefresh, 60 * 1000)

    return () => clearInterval(interval)
  }, [apiBaseUrl, accessToken, refreshToken, clearTokens])

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

