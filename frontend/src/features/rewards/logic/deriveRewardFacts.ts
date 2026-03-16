import type { Session } from '../../../api'
import type { RewardEvaluationInput, RewardFacts } from '../types'

function toDayKey(dateValue: string | undefined): string | null {
  if (!dateValue) return null
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function mergeSessions(currentSession: Session, sessions: Session[]): Session[] {
  const sessionMap = new Map<string, Session>()

  for (const session of sessions) {
    sessionMap.set(session.id, session)
  }

  sessionMap.set(currentSession.id, currentSession)
  return Array.from(sessionMap.values())
}

function buildCurrentDayStreak(dayKeys: string[]): number {
  if (!dayKeys.length) return 0

  const ordered = [...new Set(dayKeys)].sort((left, right) => right.localeCompare(left))
  let streak = 0
  let expected = new Date(`${ordered[0]}T00:00:00.000Z`)

  for (const dayKey of ordered) {
    const current = new Date(`${dayKey}T00:00:00.000Z`)
    if (current.toISOString().slice(0, 10) !== expected.toISOString().slice(0, 10)) {
      break
    }

    streak += 1
    expected.setUTCDate(expected.getUTCDate() - 1)
  }

  return streak
}

function buildCompletedSessionStreak(sessions: Session[]): number {
  const ordered = [...sessions].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )

  let streak = 0
  for (const session of ordered) {
    if (session.state !== 'COMPLETED') break
    streak += 1
  }

  return streak
}

export function deriveRewardFacts(input: RewardEvaluationInput): RewardFacts {
  const mergedSessions = mergeSessions(input.currentSession, input.sessions)
  const completedSessions = mergedSessions.filter((session) => session.state === 'COMPLETED')
  const completedDayKeys = completedSessions
    .map((session) => toDayKey(session.post?.completed_at || session.created_at))
    .filter((value): value is string => Boolean(value))

  const drillStatsById: RewardFacts['drillStatsById'] = {}

  for (const session of completedSessions) {
    for (const drill of session.drills || []) {
      const existing = drillStatsById[drill.id] || {
        runs: 0,
        averageAccuracy: null,
        perfectRuns: 0,
      }

      existing.runs += 1
      drillStatsById[drill.id] = existing
    }
  }

  const completedAt = new Date(input.context.completedAt)
  const completionHour = Number.isNaN(completedAt.getTime()) ? 0 : completedAt.getHours()
  const startedAt = new Date(input.currentSession.created_at)
  const currentSessionDurationSeconds =
    Number.isNaN(startedAt.getTime()) || Number.isNaN(completedAt.getTime())
      ? 0
      : Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000))

  const completedDrills = completedSessions.flatMap((session) => session.drills || [])

  return {
    completedSessionsCount: completedSessions.length,
    completedDrillsCount: completedDrills.length,
    distinctDrillsCount: new Set(completedDrills.map((drill) => drill.id)).size,
    activeDaysCount: new Set(completedDayKeys).size,
    currentStreakDays: buildCurrentDayStreak(completedDayKeys),
    completedSessionStreak: buildCompletedSessionStreak(mergedSessions),
    currentSessionDrillCount: input.currentSession.drills?.length || 0,
    currentSessionDurationSeconds,
    completionHour,
    noteLength: input.context.noteText?.trim().length || 0,
    deviceType: input.context.deviceType,
    drillStatsById,
  }
}
