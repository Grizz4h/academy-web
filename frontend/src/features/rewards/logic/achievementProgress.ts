import { ACHIEVEMENTS } from '../data/achievements'
import { isLegacyAchievementsReadOnly } from '../data/legacyAchievements'
import type {
  AchievementCondition,
  AchievementDefinition,
  RewardState,
} from '../types'
import type { Session } from '../../../api'
import { getRealSessions } from '../../../utils/sessionEligibility'

export type AchievementProgressItem = {
  achievement: AchievementDefinition
  progress: number
  current: number
  target: number
  label: string
  isUnlocked: boolean
  /** Legacy medals frozen under unified pipeline — display only if already unlocked. */
  isReadOnly?: boolean
}

export type RecentUnlockedItem = {
  achievement: AchievementDefinition
  unlockedAt: string
}

type DerivedStats = {
  completedSessions: Session[]
  completedSessionsCount: number
  completedDrillsCount: number
  distinctDrillsCount: number
  activeDaysCount: number
  completedSessionStreak: number
  maxDrillsInOneSession: number
  maxNoteLength: number
  minCompletedDurationSeconds: number | null
}

function isCompleted(session: Session): boolean {
  return session.state === 'COMPLETED'
}

function toDayKey(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function buildCompletedSessionStreak(sessions: Session[]): number {
  const ordered = [...sessions].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )

  let streak = 0
  for (const session of ordered) {
    if (!isCompleted(session)) break
    streak += 1
  }

  return streak
}

function matchesHourWindow(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour <= end
  return hour >= start || hour <= end
}

function deriveStats(sessions: Session[]): DerivedStats {
  const realSessions = getRealSessions(sessions)
  const completedSessions = realSessions.filter(isCompleted)
  const completedDrills = completedSessions.flatMap((session) => session.drills || [])
  const dayKeys = completedSessions
    .map((session) => toDayKey(session.post?.completed_at || session.created_at))
    .filter((key): key is string => Boolean(key))

  let maxDrillsInOneSession = 0
  let maxNoteLength = 0
  let minCompletedDurationSeconds: number | null = null

  for (const session of completedSessions) {
    maxDrillsInOneSession = Math.max(maxDrillsInOneSession, session.drills?.length || 0)

    const summaryLength = session.post?.summary?.length || 0
    const unclearLength = session.post?.unclear?.length || 0
    const goalLength = session.goal?.length || 0
    maxNoteLength = Math.max(maxNoteLength, summaryLength + unclearLength + goalLength)

    const startedAt = new Date(session.created_at)
    const completedAt = new Date(session.post?.completed_at || session.created_at)
    if (!Number.isNaN(startedAt.getTime()) && !Number.isNaN(completedAt.getTime())) {
      const seconds = Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000))
      minCompletedDurationSeconds =
        minCompletedDurationSeconds === null ? seconds : Math.min(minCompletedDurationSeconds, seconds)
    }
  }

  return {
    completedSessions,
    completedSessionsCount: completedSessions.length,
    completedDrillsCount: completedDrills.length,
    distinctDrillsCount: new Set(completedDrills.map((drill) => drill.id)).size,
    activeDaysCount: new Set(dayKeys).size,
    completedSessionStreak: buildCompletedSessionStreak(realSessions),
    maxDrillsInOneSession,
    maxNoteLength,
    minCompletedDurationSeconds,
  }
}

function computeProgressFromCondition(
  condition: AchievementCondition,
  stats: DerivedStats,
): Pick<AchievementProgressItem, 'progress' | 'current' | 'target' | 'label'> {
  switch (condition.type) {
    case 'completed_drills_total': {
      const current = stats.completedDrillsCount
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} abgeschlossene Drills`,
      }
    }
    case 'completed_sessions_total': {
      const current = stats.completedSessionsCount
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} abgeschlossene Sessions`,
      }
    }
    case 'completed_session_streak': {
      const current = stats.completedSessionStreak
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} Session-Streak`,
      }
    }
    case 'active_days_total': {
      const current = stats.activeDaysCount
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} aktive Tage`,
      }
    }
    case 'distinct_drills_total': {
      const current = stats.distinctDrillsCount
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} verschiedene Drills`,
      }
    }
    case 'current_session_drill_count': {
      const current = stats.maxDrillsInOneSession
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} Drills in einer Session`,
      }
    }
    case 'note_length': {
      const current = stats.maxNoteLength
      const target = condition.min
      return {
        progress: Math.min(1, current / target),
        current,
        target,
        label: `${current}/${target} Zeichen Notizen`,
      }
    }
    case 'completion_hour_between': {
      const target = 1
      const current = stats.completedSessions.some((session) => {
        const completedAt = new Date(session.post?.completed_at || session.created_at)
        if (Number.isNaN(completedAt.getTime())) return false
        return matchesHourWindow(completedAt.getHours(), condition.start, condition.end)
      })
        ? 1
        : 0

      return {
        progress: current,
        current,
        target,
        label: current ? 'Zeitfenster getroffen' : 'Zeitfenster noch offen',
      }
    }
    case 'session_duration_max_seconds': {
      const target = condition.max
      if (stats.minCompletedDurationSeconds === null) {
        return {
          progress: 0,
          current: 0,
          target,
          label: `Beste Zeit: - / ${target}s`,
        }
      }

      const current = stats.minCompletedDurationSeconds
      const done = current <= target
      return {
        progress: done ? 1 : Math.min(1, target / current),
        current,
        target,
        label: `Beste Zeit: ${current}s (Ziel <= ${target}s)`,
      }
    }
    case 'device_type': {
      return {
        progress: 0,
        current: 0,
        target: 1,
        label: `Noch kein Device-Signal fuer ${condition.device}`,
      }
    }
    default:
      return {
        progress: 0,
        current: 0,
        target: 1,
        label: 'Keine Fortschrittsdaten',
      }
  }
}

export function getAchievementProgressItems(
  sessions: Session[],
  rewardState: RewardState,
): AchievementProgressItem[] {
  const stats = deriveStats(sessions)
  const legacyReadOnly = isLegacyAchievementsReadOnly()

  const items = ACHIEVEMENTS.map((achievement) => {
    const isUnlocked = Boolean(rewardState.unlockedAchievements[achievement.id])
    const progressData = computeProgressFromCondition(achievement.condition, stats)

    return {
      achievement,
      ...progressData,
      isUnlocked,
      isReadOnly: legacyReadOnly && !isUnlocked,
    }
  })

  if (legacyReadOnly) {
    return items.filter((item) => item.isUnlocked)
  }

  return items
}

export function getTopNearAchievements(
  sessions: Session[],
  rewardState: RewardState,
  limit = 5,
): AchievementProgressItem[] {
  return getAchievementProgressItems(sessions, rewardState)
    .filter((item) => !item.isUnlocked)
    .filter((item) => item.progress > 0 && item.progress < 1)
    .sort((left, right) => {
      if (right.progress !== left.progress) return right.progress - left.progress
      return (left.target - left.current) - (right.target - right.current)
    })
    .slice(0, limit)
}

export function getRecentUnlockedAchievements(
  rewardState: RewardState,
  limit = 5,
): RecentUnlockedItem[] {
  return Object.values(rewardState.unlockedAchievements)
    .map((entry) => {
      const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === entry.id)
      if (!achievement) return null
      return {
        achievement,
        unlockedAt: entry.unlockedAt,
      }
    })
    .filter((item): item is RecentUnlockedItem => Boolean(item))
    .sort((left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime())
    .slice(0, limit)
}
