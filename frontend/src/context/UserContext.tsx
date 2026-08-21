import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as apiLogin } from '../api'

type LoginResult = {
  ok: boolean
  error?: string
}

type UserContextValue = {
  /** Display / legacy username (not the app ownership id). */
  user: string | null
  /** Stable RinQ UUID when known (from login or /api/me). */
  userId: string | null
  setUser: (username: string | null, password?: string) => Promise<LoginResult>
  logout: () => void
}


const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<string | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('academy.user')
    const storedId = localStorage.getItem('academy.userId')
    if (stored) setUserState(stored)
    if (storedId) setUserIdState(storedId)
  }, [])

  const setUser = async (username: string | null, password?: string): Promise<LoginResult> => {
    if (!username) {
      setUserState(null)
      setUserIdState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.userId')
      localStorage.removeItem('academy.token')
      return { ok: true }
    }
    if (!password) return { ok: false, error: 'Passwort erforderlich' }
    try {
      const res = await apiLogin(username, password)
      const resolved = res.username || username
      const rid = res.rinq_user_id || res.user_id || null
      setUserState(resolved)
      setUserIdState(rid)
      localStorage.setItem('academy.user', resolved)
      if (rid) localStorage.setItem('academy.userId', rid)
      else localStorage.removeItem('academy.userId')
      localStorage.setItem('academy.token', res.token)
      return { ok: true }
    } catch (e: any) {
      setUserState(null)
      setUserIdState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.userId')
      localStorage.removeItem('academy.token')
      return { ok: false, error: e?.message || 'Login fehlgeschlagen' }
    }
  }

  const logout = () => {
    setUserState(null)
    setUserIdState(null)
    localStorage.removeItem('academy.user')
    localStorage.removeItem('academy.userId')
    localStorage.removeItem('academy.token')
  }

  const value = useMemo(() => ({ user, userId, setUser, logout }), [user, userId])

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
