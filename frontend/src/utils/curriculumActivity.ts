import type { Curriculum, Session, Track } from '../api'
import { getRealSessions } from './sessionEligibility'

export type CurriculumNextFocus = {
  trackId: string
  moduleId: string
  drillId: string
  drillTitle: string
  moduleTitle: string
}

export function findTrackForModule(
  curriculum: Curriculum | null | undefined,
  moduleId?: string | null,
): Track | undefined {
  const id = String(moduleId || '').trim()
  if (!curriculum?.tracks?.length || !id) return undefined
  return curriculum.tracks.find((track) => (track.modules || []).some((module) => module.id === id))
}

function sessionHistoryTime(session: Session): number {
  const created = Date.parse(session.created_at || '')
  return Number.isFinite(created) ? created : 0
}

function isFoundationTrack(track: Track): boolean {
  return track.trackType === 'foundation' || track.id === 'T0'
}

/** Track of the most recently completed (or created) real session. */
export function getLastActivityTrackId(
  sessions: Session[] | null | undefined,
  curriculum: Curriculum | null | undefined,
): string | null {
  const last = lastActivitySession(sessions)
  return findTrackForModule(curriculum, last?.module_id)?.id ?? null
}

export function collectCompletedDrillIds(sessions: Session[] | null | undefined): Set<string> {
  const completed = new Set<string>()
  for (const session of getRealSessions(sessions || [])) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      if (drill?.id) completed.add(drill.id)
    }
    if (session.drill_id) completed.add(session.drill_id)
    // Fallback: module-level completion marks first drill when drills[] missing
    if ((!session.drills || session.drills.length === 0) && session.module_id) {
      completed.add(session.module_id)
    }
  }
  return completed
}

/** Drill of the newest completed Verlauf session (same order as History). */
export function getLastActivityDrillId(sessions: Session[] | null | undefined): string | null {
  const last = lastActivitySession(sessions)
  if (!last) return null
  if (last.drill_id) return last.drill_id
  const listed = last.drills || []
  const completed = last.progress?.completed_drills || []
  for (let index = completed.length - 1; index >= 0; index -= 1) {
    if (completed[index]) return completed[index]
  }
  const currentIndex = last.progress?.current_drill_index
  if (typeof currentIndex === 'number' && listed[currentIndex]?.id) {
    return listed[currentIndex].id
  }
  for (let index = listed.length - 1; index >= 0; index -= 1) {
    if (listed[index]?.id) return listed[index].id
  }
  return null
}

export function getLastActivityModuleId(sessions: Session[] | null | undefined): string | null {
  const last = lastActivitySession(sessions)
  const moduleId = String(last?.module_id || '').trim()
  return moduleId || null
}

function lastActivitySession(sessions: Session[] | null | undefined): Session | null {
  const real = getRealSessions(sessions).filter(
    (session) => String(session.state || '').toUpperCase() === 'COMPLETED',
  )
  if (!real.length) return null
  return [...real].sort((a, b) => sessionHistoryTime(b) - sessionHistoryTime(a))[0] ?? null
}

type DrillRef = CurriculumNextFocus

function orderedCurriculumTracks(
  curriculum: Curriculum,
  skipTrackIds?: Iterable<string>,
  restrictToFoundation = false,
): Track[] {
  const skip = new Set(skipTrackIds || [])
  return [...curriculum.tracks]
    .filter((track) => !skip.has(track.id))
    .filter((track) => (restrictToFoundation ? isFoundationTrack(track) : true))
    .sort((a, b) => {
      const aF = isFoundationTrack(a) ? 0 : 1
      const bF = isFoundationTrack(b) ? 0 : 1
      return aF - bF
    })
}

function flattenCurriculumDrills(
  curriculum: Curriculum,
  skipTrackIds?: Iterable<string>,
  restrictToFoundation = false,
): DrillRef[] {
  const refs: DrillRef[] = []
  for (const track of orderedCurriculumTracks(curriculum, skipTrackIds, restrictToFoundation)) {
    for (const module of track.modules || []) {
      if (module.active === false) continue
      for (const drill of module.drills || []) {
        if (!drill?.id) continue
        refs.push({
          trackId: track.id,
          moduleId: module.id,
          moduleTitle: module.title || module.id,
          drillId: drill.id,
          drillTitle: drill.title || drill.id,
        })
      }
    }
  }
  return refs
}

/**
 * Next drill after the last Verlauf observation: always +1 in curriculum order.
 * Does not skip ahead to the next overall gap (A2 D1 → A2 D2, even if C has holes).
 */
export function getNextCurriculumFocus(
  curriculum: Curriculum | null | undefined,
  _completedDrillIds: Iterable<string>,
  options?: {
    skipTrackIds?: Iterable<string>
    restrictToFoundation?: boolean
    lastCompletedDrillId?: string | null
    lastModuleId?: string | null
  },
): CurriculumNextFocus | null {
  if (!curriculum?.tracks?.length) return null
  const sequence = flattenCurriculumDrills(
    curriculum,
    options?.skipTrackIds,
    options?.restrictToFoundation === true,
  )
  if (!sequence.length) return null

  const lastId = String(options?.lastCompletedDrillId || '').trim()
  const lastModuleId = String(options?.lastModuleId || '').trim()
  const lastIndex = lastId ? sequence.findIndex((item) => item.drillId === lastId) : -1
  if (lastIndex >= 0) {
    return sequence[lastIndex + 1] ?? null
  }

  if (lastModuleId) {
    const moduleStart = sequence.findIndex((item) => item.moduleId === lastModuleId)
    if (moduleStart >= 0) return sequence[moduleStart]
  }

  return sequence[0] ?? null
}
