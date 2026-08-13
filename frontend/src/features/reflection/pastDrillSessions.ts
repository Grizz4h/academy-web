import type { Session } from '../../api'
import type { StoredAiReflection } from './types'
import { resolveDrillId } from '../../stats/exposureStats'
import { getRealSessions } from '../../utils/sessionEligibility'

export type PastDrillRecap = {
  latest: Session
  older: Session[]
  count: number
  reflection: StoredAiReflection | null
  reflectionSession: Session | null
  reflectionIsFromLatest: boolean
}

function asTime(value?: string): number {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : 0
}

export function findPastSessionsForDrill(
  sessions: Session[] | null | undefined,
  drillId: string | undefined,
): Session[] {
  if (!drillId) return []
  return getRealSessions(sessions)
    .filter((session) => session.state === 'COMPLETED' && resolveDrillId(session) === drillId)
    .sort((a, b) => asTime(b.created_at) - asTime(a.created_at))
}

function hasUsableReflection(session: Session): boolean {
  const focus = session.ai_reflection?.content?.nextObservationFocus?.trim()
  return Boolean(focus)
}

export function buildPastDrillRecap(
  sessions: Session[] | null | undefined,
  drillId: string | undefined,
): PastDrillRecap | null {
  const past = findPastSessionsForDrill(sessions, drillId)
  if (!past.length) return null

  const latest = past[0]
  const reflectionSession = past.find(hasUsableReflection) ?? null

  return {
    latest,
    older: past.slice(1, 3),
    count: past.length,
    reflection: reflectionSession?.ai_reflection ?? null,
    reflectionSession,
    reflectionIsFromLatest: reflectionSession?.id === latest.id,
  }
}

export function formatSessionDate(value?: string): string {
  if (!value) return 'Unbekanntes Datum'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Unbekanntes Datum'
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatSessionMatchup(session: Session): string {
  const home = session.game_info?.team_home
  const away = session.game_info?.team_away
  if (home && away) return `${home} vs ${away}`
  return home || away || 'Ohne Spielpaarung'
}

export function isSameMatchup(
  session: Session,
  homeTeam?: string,
  awayTeam?: string,
): boolean {
  if (!homeTeam || !awayTeam) return false
  const home = session.game_info?.team_home
  const away = session.game_info?.team_away
  if (!home || !away) return false
  return (home === homeTeam && away === awayTeam) || (home === awayTeam && away === homeTeam)
}
