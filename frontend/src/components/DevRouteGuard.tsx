import { Navigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { useUser } from '../context/UserContext'
import { api } from '../api'

/**
 * Production: /dev* requires server-confirmed admin (is_admin from /api/me).
 * Vite DEV: routes stay available for local engineering.
 */
export function DevRouteGuard({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [allowed, setAllowed] = useState<boolean | null>(import.meta.env.DEV ? true : null)

  useEffect(() => {
    if (import.meta.env.DEV) {
      setAllowed(true)
      return
    }
    if (!user) {
      setAllowed(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const me = await api.getMe()
        if (!cancelled) setAllowed(Boolean(me.is_admin))
      } catch {
        if (!cancelled) setAllowed(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/" replace />
  return <>{children}</>
}
