import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as apiLogin, api } from '../api'
import { getSupabaseAccessToken, signOutSupabase } from '../lib/supabase'

type LoginResult = {
  ok: boolean
  error?: string
}

type AuthMode = 'legacy' | 'supabase' | null

type UserContextValue = {
  /** Display name / legacy username (not the app ownership id). */
  user: string | null
  /** Stable RinQ UUID when known. */
  userId: string | null
  authMode: AuthMode
  setUser: (username: string | null, password?: string) => Promise<LoginResult>
  /** After Supabase OAuth callback — store token and load /api/me. */
  completeSupabaseSession: (accessToken: string) => Promise<LoginResult>
  logout: () => void
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

function clearLocalAuth() {
  localStorage.removeItem('academy.user')
  localStorage.removeItem('academy.userId')
  localStorage.removeItem('academy.token')
  localStorage.removeItem('academy.authMode')
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<string | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>(null)

  const applyMe = useCallback(async (token: string, mode: AuthMode) => {
    localStorage.setItem('academy.token', token)
    if (mode) localStorage.setItem('academy.authMode', mode)
    const me = await api.getMe()
    const display = me.display_name || me.profile?.displayName || me.username || 'Spieler'
    const rid = me.rinq_user_id || me.user_id || null
    setUserState(display)
    setUserIdState(rid)
    setAuthMode(mode)
    localStorage.setItem('academy.user', display)
    if (rid) localStorage.setItem('academy.userId', rid)
    else localStorage.removeItem('academy.userId')
    return { ok: true as const }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Prefer live Supabase session if present
      const supabaseToken = await getSupabaseAccessToken()
      if (cancelled) return
      if (supabaseToken) {
        try {
          await applyMe(supabaseToken, 'supabase')
          return
        } catch {
          await signOutSupabase()
          clearLocalAuth()
        }
      }
      const storedToken = localStorage.getItem('academy.token')
      const storedMode = (localStorage.getItem('academy.authMode') as AuthMode) || 'legacy'
      const storedUser = localStorage.getItem('academy.user')
      const storedId = localStorage.getItem('academy.userId')
      if (storedToken && storedUser) {
        setUserState(storedUser)
        if (storedId) setUserIdState(storedId)
        setAuthMode(storedMode)
        // Refresh me in background
        try {
          await applyMe(storedToken, storedMode)
        } catch {
          // keep optimistic local state; next API call may 401
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyMe])

  const setUser = async (username: string | null, password?: string): Promise<LoginResult> => {
    if (!username) {
      setUserState(null)
      setUserIdState(null)
      setAuthMode(null)
      clearLocalAuth()
      return { ok: true }
    }
    if (!password) return { ok: false, error: 'Passwort erforderlich' }
    try {
      await signOutSupabase()
      const res = await apiLogin(username, password)
      const resolved = res.username || username
      const rid = res.rinq_user_id || res.user_id || null
      setUserState(resolved)
      setUserIdState(rid)
      setAuthMode('legacy')
      localStorage.setItem('academy.user', resolved)
      localStorage.setItem('academy.authMode', 'legacy')
      if (rid) localStorage.setItem('academy.userId', rid)
      else localStorage.removeItem('academy.userId')
      localStorage.setItem('academy.token', res.token)
      return { ok: true }
    } catch (e: any) {
      setUserState(null)
      setUserIdState(null)
      setAuthMode(null)
      clearLocalAuth()
      return { ok: false, error: e?.message || 'Login fehlgeschlagen' }
    }
  }

  const completeSupabaseSession = useCallback(
    async (accessToken: string): Promise<LoginResult> => {
      try {
        await applyMe(accessToken, 'supabase')
        return { ok: true }
      } catch (e: any) {
        clearLocalAuth()
        setUserState(null)
        setUserIdState(null)
        setAuthMode(null)
        return { ok: false, error: e?.message || 'Google Login fehlgeschlagen' }
      }
    },
    [applyMe],
  )

  const logout = () => {
    void signOutSupabase()
    setUserState(null)
    setUserIdState(null)
    setAuthMode(null)
    clearLocalAuth()
  }

  const value = useMemo(
    () => ({ user, userId, authMode, setUser, completeSupabaseSession, logout }),
    [user, userId, authMode, completeSupabaseSession],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

/** Sync token for API calls — legacy or supabase access token in academy.token. */
export function getStoredAccessToken(): string | null {
  return localStorage.getItem('academy.token')
}
