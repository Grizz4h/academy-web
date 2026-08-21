import type { Curriculum, Session } from '../api'
import { findTrackForModule } from './curriculumActivity'
import { isLessonScope } from './observationScope'

type MicrofeedbackSession = Pick<Session, 'observation_scope' | 'module_id' | 'drills'>

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
