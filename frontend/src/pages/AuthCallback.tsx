import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import Card from '../components/Card'
import styles from '../pages/Dashboard.module.css'

/**
 * OAuth return URL for Supabase Google login.
 * Exchanges the session from the URL hash/query, then hydrates RinQ auth via /api/me.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { completeSupabaseSession } = useUser()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Supabase ist nicht konfiguriert.')
        return
      }
      try {
        // PKCE / detectSessionInUrl: session should be available after redirect
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        const token = data.session?.access_token
        if (!token) {
          // Some flows need getSession after a tick
          await new Promise((r) => setTimeout(r, 50))
          const again = await supabase.auth.getSession()
          if (!again.data.session?.access_token) {
            throw new Error('Keine Session nach Google Login.')
          }
          if (cancelled) return
          const ok = await completeSupabaseSession(again.data.session.access_token)
          if (!ok.ok) throw new Error(ok.error || 'Anmeldung fehlgeschlagen')
        } else {
          if (cancelled) return
          const ok = await completeSupabaseSession(token)
          if (!ok.ok) throw new Error(ok.error || 'Anmeldung fehlgeschlagen')
        }
        if (!cancelled) navigate('/', { replace: true })
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Google Login fehlgeschlagen')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [completeSupabaseSession, navigate])

  return (
    <div className={styles.dashboardPage}>
      <Card>
        <h1 className="ui-page-title">Anmeldung</h1>
        {error ? (
          <p className={styles.errorMsg}>{error}</p>
        ) : (
          <p className="ui-page-lead">Google Login wird abgeschlossen…</p>
        )}
      </Card>
    </div>
  )
}
