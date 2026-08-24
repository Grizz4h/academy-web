import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useCreatorMode } from '../features/creator'

/** Blocks creator-only routes unless /api/me reports creator_mode. */
export default function CreatorRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const creatorMode = useCreatorMode()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!creatorMode) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
