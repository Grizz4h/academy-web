import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'

export default function UserBadge() {
  const { user, setUser, logout } = useUser()
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

  const handleLogoutClick = () => {
    logout()
    setNameInput('')
    setPasswordInput('')
    setLoginError('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {user ? (
        <>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>Angemeldet: {user}</span>
          <button
            type="button"
            onClick={handleLogoutClick}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#f7f7ff',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <input
            autoComplete="username"
            placeholder="Name"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setLoginError('') }}
            style={{
              padding: '0.35rem 0.5rem',
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
                padding: '0.35rem 2.5rem 0.35rem 0.5rem',
                borderRadius: '4px',
                border: loginError ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)',
                color: '#f7f7ff'
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
              padding: '0.35rem 0.6rem',
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
            <span style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>{loginError}</span>
          )}
        </>
      )}
    </div>
  )
}

