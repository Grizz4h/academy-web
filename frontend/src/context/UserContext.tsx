import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as apiLogin } from '../api'

type LoginResult = {
  ok: boolean
  error?: string
}

type UserContextValue = {
  user: string | null
  setUser: (username: string | null, password?: string) => Promise<LoginResult>
  logout: () => void
}


const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('academy.user')
    if (stored) setUserState(stored)
  }, [])

  // setUser wird für API-Login neu implementiert
  // Login via API, speichere Token und Username in localStorage
  const setUser = async (username: string | null, password?: string): Promise<LoginResult> => {
    if (!username) {
      setUserState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.token')
      return { ok: true }
    }
    if (!password) return { ok: false, error: 'Passwort erforderlich' }
    try {
      const res = await apiLogin(username, password)
      // Username immer mit erstem Buchstaben groß speichern
      const normalized = res.username ? res.username.charAt(0).toUpperCase() + res.username.slice(1).toLowerCase() : res.username
      setUserState(normalized)
      localStorage.setItem('academy.user', normalized)
      localStorage.setItem('academy.token', res.token)
      return { ok: true }
    } catch (e: any) {
      setUserState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.token')
      return { ok: false, error: e?.message || 'Login fehlgeschlagen' }
    }
  }

  const logout = () => {
    setUserState(null)
    localStorage.removeItem('academy.user')
    localStorage.removeItem('academy.token')
  }

  const value = useMemo(() => ({ user, setUser, logout }), [user])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}