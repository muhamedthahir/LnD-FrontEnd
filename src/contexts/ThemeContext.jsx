import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(() => {
    const savedPreference = localStorage.getItem('themePreference')
    if (['light', 'dark', 'system'].includes(savedPreference)) return savedPreference
    const savedTheme = localStorage.getItem('theme')
    return ['light', 'dark'].includes(savedTheme) ? savedTheme : 'system'
  })
  const [systemTheme, setSystemTheme] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const theme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = event => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('theme', theme)
    localStorage.setItem('themePreference', preference)
    let chromeColor = document.querySelector('meta[name="theme-color"]')
    if (!chromeColor) { chromeColor = document.createElement('meta'); chromeColor.name = 'theme-color'; document.head.append(chromeColor) }
    chromeColor.content = theme === 'dark' ? '#070b17' : '#f2f5fb'
  }, [theme, preference])

  const toggleTheme = () => {
    setPreference(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

