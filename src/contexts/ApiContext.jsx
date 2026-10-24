import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getConfig } from '../config'
import { API_ENDPOINTS } from '../constants/constants'
import { isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken } from '../utils/authToken'

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
    if (accessToken) localStorage.setItem('accessToken', accessToken)
  }, [accessToken])

  useEffect(() => {
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
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

  const refreshInFlight = useRef(null)

  const refreshSession = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current

    const run = async () => {
      const rt = readStoredRefreshToken()
      if (!rt || !apiBaseUrl) return readStoredAccessToken()

      const requestRefresh = () => fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      })

      const keepSession = () => readStoredAccessToken()
      try {
        let response
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await requestRefresh()
          if (response.ok || response.status === 401) break
          if (![500, 502, 503, 504].includes(response.status) || attempt === 2) {
            return keepSession()
          }
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)))
        }

        if (response.status === 401) {
          clearTokens()
          localStorage.removeItem('user')
          return null
        }

        if (!response.ok) return keepSession()

        const data = await response.json()
        if (data.accessToken) {
          setAccessToken(data.accessToken)
          localStorage.setItem('accessToken', data.accessToken)
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
          return data.accessToken
        }
        return keepSession()
      } catch (error) {
        console.error('Token refresh failed:', error)
        return keepSession()
      }
    }

    refreshInFlight.current = run().finally(() => {
      refreshInFlight.current = null
    })
    return refreshInFlight.current
  }, [apiBaseUrl, clearTokens])

  const ensureAccessToken = useCallback(async ({ force = false } = {}) => {
    const current = readStoredAccessToken()
    if (!force && isAccessTokenUsable(current)) return current
    if (!readStoredRefreshToken()) return isAccessTokenUsable(current, 0) ? current : null
    const refreshed = await refreshSession()
    if (isAccessTokenUsable(refreshed, 0)) return refreshed
    return isAccessTokenUsable(current, 0) ? current : null
  }, [refreshSession])

  useEffect(() => {
    if (!apiBaseUrl) return
    ensureAccessToken()
    const interval = setInterval(() => { ensureAccessToken() }, 60 * 1000)
    return () => clearInterval(interval)
  }, [apiBaseUrl, ensureAccessToken])

  return (
    <ApiContext.Provider value={{ 
      apiBaseUrl,
      isLoading, 
      accessToken, 
      refreshToken,
      setTokens, 
      clearTokens,
      ensureAccessToken,
      // Legacy support
      token: accessToken,
      setToken: (token) => setAccessToken(token),
      clearToken: clearTokens
    }}>
      {children}
    </ApiContext.Provider>
  )
}

