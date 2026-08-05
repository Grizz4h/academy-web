export const SESSION_SIDEQUESTS_KEY = '__session_sidequests'

export type SessionSidequest = {
  id: string
  type: 'special_teams_sidequest'
  category: 'special_teams'
  gameState: 'power_play' | 'penalty_kill'
  miniDrillId: string
  parentDrillId?: string
  phase: string
  gameTime?: string
  observedTeam?: string
  answers: Record<string, unknown>
  createdAt: string
}

export function readSidequests(answers: any): SessionSidequest[] {
  const raw = answers?.[SESSION_SIDEQUESTS_KEY]
  return Array.isArray(raw) ? raw : []
}

export function appendSidequest(answers: any, entry: SessionSidequest): any {
  const safe = answers && typeof answers === 'object' ? answers : {}
  const existing = readSidequests(safe)
  return {
    ...safe,
    [SESSION_SIDEQUESTS_KEY]: [...existing, entry],
  }
}

export function createSidequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
