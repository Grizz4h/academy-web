import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  clearGoogleLinkFlow,
  getSupabase,
  isGoogleLinkIntent,
  peekGoogleLinkLegacyToken,
  signOutSupabase,
} from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { api } from '../api'
import Card from '../components/Card'
import styles from '../pages/Dashboard.module.css'

/**
 * OAuth return URL for Supabase Google login / account linking.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { completeSupabaseSession } = useUser()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Google wird abgeschlossen…')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Supabase ist nicht konfiguriert.')
        return
      }
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        let token = data.session?.access_token
        if (!token) {
          await new Promise((r) => setTimeout(r, 50))
          const again = await supabase.auth.getSession()
          token = again.data.session?.access_token
        }
        if (!token) throw new Error('Keine Session nach Google Login.')
        if (cancelled) return

        if (isGoogleLinkIntent()) {
          setStatus('Google-Konto wird verknüpft…')
          const legacyToken = peekGoogleLinkLegacyToken()
          if (!legacyToken) {
            clearGoogleLinkFlow()
            throw new Error('Verknüpfung abgebrochen — bitte erneut als bestehender Account anmelden.')
          }
          // Keep legacy session as the authorizing identity for the link call
          localStorage.setItem('academy.token', legacyToken)
          localStorage.setItem('academy.authMode', 'legacy')
          await api.linkGoogleAccount(token)
          clearGoogleLinkFlow()
          await signOutSupabase()
          if (!cancelled) navigate('/account?google=linked', { replace: true })
          return
        }

        const ok = await completeSupabaseSession(token)
        if (!ok.ok) throw new Error(ok.error || 'Anmeldung fehlgeschlagen')
        if (!cancelled) navigate('/', { replace: true })
      } catch (e: any) {
        clearGoogleLinkFlow()
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
          <>
            <p className={styles.errorMsg}>{error}</p>
            <p className="ui-page-lead">
              <Link to="/account">Zurück zum Account</Link>
              {' · '}
              <Link to="/">Zum Dashboard</Link>
            </p>
          </>
        ) : (
          <p className="ui-page-lead">{status}</p>
        )}
      </Card>
    </div>
  )
}
