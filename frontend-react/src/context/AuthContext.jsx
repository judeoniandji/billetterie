import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('billetterieUser')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = useCallback(async (telephone) => {
    const { ok, data } = await api.auth({ telephone })
    if (!ok) throw new Error(data.message || 'Erreur de connexion')
    setUser(data.utilisateur)
    localStorage.setItem('billetterieUser', JSON.stringify(data.utilisateur))
    return data
  }, [])

  const register = useCallback(async (body) => {
    const { ok, data } = await api.auth(body)
    if (!ok) throw new Error(data.message || 'Erreur d\'inscription')
    setUser(data.utilisateur)
    localStorage.setItem('billetterieUser', JSON.stringify(data.utilisateur))
    return data
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('billetterieUser')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
