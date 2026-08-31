import type { Curriculum, Session } from '../api'
import { findTrackForModule } from './curriculumActivity'
import { getActivePeriodsForScope, isLessonScope, type PeriodPhase } from './observationScope'

type MicrofeedbackSession = Pick<
  Session,
  'observation_scope' | 'module_id' | 'drills' | 'checkins' | 'microfeedback' | 'state' | 'id' | 'game_info'
>

function isFoundationModuleId(moduleId?: string | null): boolean {
  const id = String(moduleId || '').trim().toUpperCase()
  return id === 'T0' || id.startsWith('T0')
}

/**
 * Period microfeedback (P1/P2/P3) is a live-session hygiene check.
 * Foundation / Track 0 lessons do not collect it.
 */
export function sessionExpectsPeriodMicrofeedback(
  session: MicrofeedbackSession | null | undefined,
  curriculum?: Curriculum | null,
): boolean {
  if (!session) return true
  if (isLessonScope(session.observation_scope)) return false
  if ((session.drills || []).some((drill) => drill?.drill_type === 'foundation_lesson')) return false

  const track = findTrackForModule(curriculum, session.module_id)
  if (track?.trackType === 'foundation') return false
  if (track?.requiresMicrofeedback === false) return false
  if (!track && isFoundationModuleId(session.module_id)) return false
  return true
}

/** Same gate as Session.needsMicrofeedback: only when the drill defines miniFeedback questions. */
export function sessionDrillDefinesMiniFeedback(session: MicrofeedbackSession | null | undefined): boolean {
  const drill = session?.drills?.[0] as { miniFeedback?: { groups?: unknown } } | undefined
  const groups = drill?.miniFeedback?.groups
  if (!Array.isArray(groups) || groups.length === 0) return false
  return groups.some((group) => {
    if (!group || typeof group !== 'object') return false
    const questions = (group as { questions?: unknown }).questions
    return Array.isArray(questions) && questions.some((q) => String(q || '').trim())
  })
}

/**
 * A period check-in only "counts" for microfeedback hygiene when it holds real
 * observation content. Empty shells (phase marker only) and draft-only keys do not.
 */
export function checkinHasObservationPayload(checkin: { answers?: unknown } | null | undefined): boolean {
  const answers = checkin?.answers
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false

  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (key.startsWith('__') && key !== '__session_sidequests') continue
    if (key === '__session_sidequests' && Array.isArray(value) && value.length > 0) return true
    if (Array.isArray(value) && value.length > 0) return true
    if (typeof value === 'string' && value.trim()) return true
    if (typeof value === 'number' || typeof value === 'boolean') return true
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      return true
    }
  }
  return false
}

function checkedLivePhasesWithPayload(session: MicrofeedbackSession): Set<PeriodPhase> {
  const phases = new Set<PeriodPhase>()
  for (const checkin of session.checkins || []) {
    const phase = String(checkin?.phase || '').trim().toUpperCase()
    if (phase !== 'P1' && phase !== 'P2' && phase !== 'P3') continue
    if (!checkinHasObservationPayload(checkin)) continue
    phases.add(phase)
  }
  return phases
}

/**
 * Periods that must have microfeedback.done for a completed live session.
 * Aligns with the in-session guard: scope ∩ real check-ins ∩ drill miniFeedback.
 */
export function periodsRequiringMicrofeedback(
  session: MicrofeedbackSession | null | undefined,
  curriculum?: Curriculum | null,
): PeriodPhase[] {
  if (!session || !sessionExpectsPeriodMicrofeedback(session, curriculum)) return []
  if (!sessionDrillDefinesMiniFeedback(session)) return []
  if (String(session.state || '').toUpperCase() !== 'COMPLETED') return []

  const checked = checkedLivePhasesWithPayload(session)
  return getActivePeriodsForScope(session.observation_scope).filter((phase) => checked.has(phase))
}

export function missingPeriodMicrofeedbackLabels(
  session: MicrofeedbackSession,
  curriculum?: Curriculum | null,
): string[] {
  const matchup =
    session.game_info?.team_home && session.game_info?.team_away
      ? `${session.game_info.team_home} vs ${session.game_info.team_away}`
      : session.id

  return periodsRequiringMicrofeedback(session, curriculum)
    .filter((phase) => {
      const mf = session.microfeedback?.[phase]
      return !mf || !mf.done
    })
    .map((phase) => `${matchup}: Microfeedback fehlt in ${phase}`)
}
