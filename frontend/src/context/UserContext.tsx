import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as apiLogin } from '../api'

type UserContextValue = {
  user: string | null
  setUser: (username: string | null, password?: string) => Promise<boolean>
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
  const setUser = async (username: string | null, password?: string): Promise<boolean> => {
    if (!username) {
      setUserState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.token')
      return true
    }
    if (!password) return false;
    try {
      const res = await apiLogin(username, password)
      setUserState(res.username)
      localStorage.setItem('academy.user', res.username)
      localStorage.setItem('academy.token', res.token)
      return true
    } catch (e) {
      setUserState(null)
      localStorage.removeItem('academy.user')
      localStorage.removeItem('academy.token')
      return false
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