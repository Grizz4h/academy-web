import { useUser } from '../context/UserContext'

export default function UserBadge() {
  const { user, logout } = useUser()

  const handleLogoutClick = () => {
    logout()
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
      ) : null}
    </div>
  )
}

