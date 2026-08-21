import type { Curriculum, Session, Track } from '../api'
import { getRealSessions } from './sessionEligibility'

export function findTrackForModule(
  curriculum: Curriculum | null | undefined,
  moduleId?: string | null,
): Track | undefined {
  const id = String(moduleId || '').trim()
  if (!curriculum?.tracks?.length || !id) return undefined
  return curriculum.tracks.find((track) => (track.modules || []).some((module) => module.id === id))
}

function sessionActivityTime(session: Session): number {
  const completed = Date.parse(session.post?.completed_at || '')
  if (Number.isFinite(completed) && completed > 0) return completed
  const created = Date.parse(session.created_at || '')
  return Number.isFinite(created) ? created : 0
}

/** Track of the most recently completed (or created) real session. */
export function getLastActivityTrackId(
  sessions: Session[] | null | undefined,
  curriculum: Curriculum | null | undefined,
): string | null {
  const real = getRealSessions(sessions)
  if (!real.length) return null
  const last = [...real].sort((a, b) => sessionActivityTime(b) - sessionActivityTime(a))[0]
  return findTrackForModule(curriculum, last?.module_id)?.id ?? null
}
