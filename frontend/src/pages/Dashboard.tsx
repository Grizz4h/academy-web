import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { user, setUser } = useUser()
  const [nameInput, setNameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (user) {
      setNameInput('')
      setPasswordInput('')
      setLoginError('')
    }
  }, [user])

  const handleLogin = () => {
    const name = nameInput.trim()
    if (!name || !passwordInput) {
      setLoginError('Benutzername und Passwort erforderlich')
      return
    }
    
    const success = setUser(name, passwordInput)
    if (!success) {
      setLoginError('Ungültige Anmeldedaten')
      setPasswordInput('')
      return
    }
  }

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Login</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
          <input
            autoComplete="username"
            placeholder="Name"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setLoginError('') }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: loginError ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.08)',
              color: '#f7f7ff'
            }}
          />
          <div style={{ position: 'relative' }}>
            <input
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Passwort"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setLoginError('') }}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                padding: '0.5rem 2.5rem 0.5rem 0.5rem',
                borderRadius: '4px',
                border: loginError ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)',
                color: '#f7f7ff',
                width: '100%'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogin}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #5191a2',
              background: '#5191a2',
              color: '#050712',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
          {loginError && (
            <span style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>{loginError}</span>
          )}
        </div>
      </div>
    </div>
  )
  if (isLoading) return <div className="card">Lade Sessions...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const activeSession = sessions?.find(s => s.state !== 'COMPLETED')
  const completedSessions = sessions?.filter(s => s.state === 'COMPLETED') || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Dashboard</h1>

      {activeSession && (
        <div className="card">
          <h2>Aktive Session</h2>
          <p><strong>Modul:</strong> {activeSession.module_id}</p>
          <p><strong>Ziel:</strong> {activeSession.goal}</p>
          <p><strong>Status:</strong> {activeSession.state}</p>
          <a
            href={`/session/${activeSession.id}`}
            className="btn"
          >
            Fortfahren
          </a>
        </div>
      )}

      <div className="card">
        <h2>Session-Historie</h2>
        {completedSessions.length === 0 ? (
          <p>Keine abgeschlossenen Sessions.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {completedSessions.map((session: Session) => (
              <li key={session.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <p><strong>Modul:</strong> {session.module_id}</p>
                <p><strong>Abgeschlossen:</strong> {new Date(session.post?.completed_at || '').toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}