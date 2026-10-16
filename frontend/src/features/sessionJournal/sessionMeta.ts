import type { Session } from '../../api'
import { getObservationScopeLabel } from '../../utils/observationScope'
import type { UiPillTone } from '../../components/ui'

export type SessionStatusMeta = { tone: UiPillTone; label: string }

export function getSessionStatusMeta(status: string): SessionStatusMeta {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'COMPLETED') return { tone: 'ok', label: 'Abgeschlossen' }
  if (normalized === 'ABORTED') return { tone: 'danger', label: 'Abgebrochen' }
  if (normalized === 'POST') return { tone: 'accent', label: 'Debrief' }
  return { tone: 'warn', label: 'In Bearbeitung' }
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    PRE: 'Vorbereitung',
    P1: '1. Drittel',
    P2: '2. Drittel',
    P3: '3. Drittel',
    POST: 'Debrief',
  }
  return labels[phase] || phase
}

export function formatJournalDate(iso?: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatOptionLabel(text: string): string {
  if (!text) return text
  const trimmed = text.trim()
  const hasUnderscore = trimmed.includes('_')
  const isNaturalSentence = trimmed.includes(' ') && !hasUnderscore && /[.!?]$/.test(trimmed)
  if (isNaturalSentence) return trimmed
  if (!hasUnderscore && trimmed.includes(' ')) return trimmed
  return trimmed
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function getSessionDrill(session: Session) {
  const drills = session.drills || []
  if (session.drill_id) {
    const match = drills.find((drill) => drill.id === session.drill_id)
    if (match) return match
  }
  return drills[0] || null
}

export function getSessionMatchup(session: Session): {
  teamHome: string
  teamAway: string
  observedTeam: string
  opponentTeam: string
  title: string
} {
  const teamHome = session.game_info?.team_home || ''
  const teamAway = session.game_info?.team_away || ''
  const observedTeam =
    session.observed_team
    || session.game_info?.observed_team
    || session.observed_team_name
    || ''
  const opponentTeam =
    observedTeam && teamHome && teamAway
      ? observedTeam === teamHome
        ? teamAway
        : observedTeam === teamAway
          ? teamHome
          : ''
      : ''
  const title = teamHome && teamAway
    ? `${teamHome} vs ${teamAway}`
    : session.module_id || 'Session'
  return { teamHome, teamAway, observedTeam, opponentTeam, title }
}

export function getSessionFocusLabel(session: Session): string {
  const drill = getSessionDrill(session)
  if (drill?.title) return drill.title
  if (session.module_id) return session.module_id
  return 'Drill'
}

export function getSessionScopeLabel(session: Session): string {
  return getObservationScopeLabel(session.observation_scope)
}

export type JournalSceneEntry = {
  id: string
  game_time: string
  period?: string
  created_at: string
  scene_code?: string | null
  note?: string | null
  observation_id?: string | null
  observation_label?: string | null
}
