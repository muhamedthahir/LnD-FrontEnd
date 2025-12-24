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

  return (
    <ApiContext.Provider value={{ apiBaseUrl, isLoading }}>
      {children}
    </ApiContext.Provider>
  )
}

