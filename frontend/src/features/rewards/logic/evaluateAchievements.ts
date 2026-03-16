import { ACHIEVEMENTS } from '../data/achievements'
import type { AchievementCondition, AchievementDefinition, RewardEvaluationInput, RewardFacts } from '../types'

function matchesHourWindow(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    return hour >= start && hour <= end
  }

  return hour >= start || hour <= end
}

function isConditionMet(condition: AchievementCondition, facts: RewardFacts): boolean {
  switch (condition.type) {
    case 'completed_drills_total':
      return facts.completedDrillsCount >= condition.min
    case 'completed_sessions_total':
      return facts.completedSessionsCount >= condition.min
    case 'completed_session_streak':
      return facts.completedSessionStreak >= condition.min
    case 'active_days_total':
      return facts.activeDaysCount >= condition.min
    case 'distinct_drills_total':
      return facts.distinctDrillsCount >= condition.min
    case 'current_session_drill_count':
      return facts.currentSessionDrillCount >= condition.min
    case 'note_length':
      return facts.noteLength >= condition.min
    case 'completion_hour_between':
      return matchesHourWindow(facts.completionHour, condition.start, condition.end)
    case 'device_type':
      return facts.deviceType === condition.device
    case 'session_duration_max_seconds':
      return facts.currentSessionDurationSeconds > 0 && facts.currentSessionDurationSeconds <= condition.max
    default:
      return false
  }
}

export function evaluateAchievements(
  input: RewardEvaluationInput,
  facts: RewardFacts,
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((achievement) => {
    if (input.rewardState.unlockedAchievements[achievement.id]) {
      return false
    }

    return isConditionMet(achievement.condition, facts)
  })
}
