import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

/** After JWT expiry, send the user back to the login overview. */
export function AuthExpiredRedirect() {
  const { user, authExpiredMessage } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!authExpiredMessage || user) return
    if (location.pathname === '/') return
    navigate('/', { replace: true })
  }, [authExpiredMessage, user, location.pathname, navigate])

  return null
}
