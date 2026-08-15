import type { Curriculum, Session } from '../../api'

export type DrillAttempt = {
  drillId: string
  drillName: string
  timestamp: string
  moduleId?: string
  trackTitle?: string
  drillNumber?: number
}

export type TrackProgressMap = Record<string, { total: number; completed: number; title: string }>

export function buildDrillAttempts(sessions: Session[], curriculum?: Curriculum | null): DrillAttempt[] {
  const drillContextMap = new Map<string, { moduleId: string; trackTitle: string; drillNumber: number }>()
  if (curriculum) {
    for (const track of curriculum.tracks) {
      for (const module of track.modules) {
        module.drills.forEach((drill, index) => {
          drillContextMap.set(drill.id, {
            moduleId: module.id,
            trackTitle: track.title,
            drillNumber: index + 1,
          })
        })
      }
    }
  }

  const attempts: DrillAttempt[] = []
  for (const session of sessions) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      const context = drillContextMap.get(drill.id)
      attempts.push({
        drillId: drill.id,
        drillName: drill.title,
        timestamp: session.created_at,
        moduleId: context?.moduleId,
        trackTitle: context?.trackTitle,
        drillNumber: context?.drillNumber,
      })
    }
  }
  return attempts
}

export function selectLearningTeaser(input: {
  trackProgress: TrackProgressMap
  attempts: DrillAttempt[]
}): {
  focus: { id: string; title: string; completed: number; total: number } | null
  recent: Array<{ drillId: string; drillName: string; sessions: number }>
} {
  const tracks = Object.entries(input.trackProgress).map(([id, track]) => ({ id, ...track }))
  const focusTrack =
    tracks.find((track) => track.total > 0 && track.completed < track.total)
    || tracks.find((track) => track.completed > 0)
    || tracks[0]
    || null

  const counts = new Map<string, { drillName: string; sessions: number; last: string }>()
  for (const attempt of input.attempts) {
    const prev = counts.get(attempt.drillId)
    if (!prev) {
      counts.set(attempt.drillId, { drillName: attempt.drillName, sessions: 1, last: attempt.timestamp })
      continue
    }
    prev.sessions += 1
    if (attempt.timestamp > prev.last) {
      prev.last = attempt.timestamp
      prev.drillName = attempt.drillName
    }
  }

  const recent = Array.from(counts.entries())
    .sort((a, b) => b[1].last.localeCompare(a[1].last))
    .slice(0, 2)
    .map(([drillId, item]) => ({ drillId, drillName: item.drillName, sessions: item.sessions }))

  return {
    focus: focusTrack
      ? { id: focusTrack.id, title: focusTrack.title, completed: focusTrack.completed, total: focusTrack.total }
      : null,
    recent,
  }
}
