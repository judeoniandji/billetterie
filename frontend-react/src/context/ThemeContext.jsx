import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const ThemeContext = createContext(null)

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('eventpass-theme') || 'system')

  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : theme
    applyTheme(resolved)
    localStorage.setItem('eventpass-theme', theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(media.matches ? 'dark' : 'light')
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      if (current === 'light') return 'dark'
      if (current === 'dark') return 'light'
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
