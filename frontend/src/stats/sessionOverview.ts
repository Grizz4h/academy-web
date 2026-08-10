import type { Session } from '../api'

export type SessionOverview = {
  total: number
  completed: number
  aborted: number
  inProgress: number
  sceneCount?: number
}

/** Live session states (excludes COMPLETED / ABORTED). */
export function isInProgressSessionState(state: string | undefined): boolean {
  const value = String(state || '').toUpperCase()
  if (value === 'COMPLETED' || value === 'ABORTED') return false
  return (
    value === 'IN_PROGRESS'
    || value === 'PRE'
    || value === 'P1'
    || value === 'P2'
    || value === 'P3'
    || value === 'POST'
  )
}

export function computeSessionOverview(
  sessions: Session[],
  options?: { sceneCount?: number },
): SessionOverview {
  let completed = 0
  let aborted = 0
  let inProgress = 0

  for (const session of sessions) {
    const state = String(session.state || '').toUpperCase()
    if (state === 'COMPLETED') completed += 1
    else if (state === 'ABORTED') aborted += 1
    else if (isInProgressSessionState(session.state)) inProgress += 1
  }

  return {
    total: sessions.length,
    completed,
    aborted,
    inProgress,
    sceneCount: options?.sceneCount,
  }
}

export function sessionCompletionRate(overview: SessionOverview): number {
  if (overview.total <= 0) return 0
  return Math.round((overview.completed / overview.total) * 100)
}
