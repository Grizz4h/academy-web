import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type UserContextValue = {
  user: string | null
  setUser: (username: string | null, password?: string) => boolean
  logout: () => void
}

// Simple credentials mapping (for demo/internal use only)
const VALID_USERS: Record<string, string> = {
  'tobi': 'tobi123',
  'christoph': 'christoph123',
  'martin': 'martin123'
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('academy.user')
    if (stored) setUserState(stored)
  }, [])

  const setUser = (username: string | null, password?: string): boolean => {
    if (!username) {
      setUserState(null)
      localStorage.removeItem('academy.user')
      return true
    }

    // Check credentials
    const expectedPassword = VALID_USERS[username.toLowerCase()]
    if (expectedPassword && password === expectedPassword) {
      setUserState(username)
      localStorage.setItem('academy.user', username)
      return true
    }

    return false
  }

  const logout = () => {
    setUserState(null)
    localStorage.removeItem('academy.user')
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