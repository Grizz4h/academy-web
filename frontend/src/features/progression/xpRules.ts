import type { RinkActivityEvent, XpRuleDefinition } from './types'

/**
 * Central XP balancing table. Policies are evaluated in the progression engine;
 * Phase 1 activates always / first_only. daily_capped & milestone are reserved.
 */
export const XP_RULES: XpRuleDefinition[] = [
  {
    key: 'session_completed',
    eventType: 'session_completed',
    amount: 100,
    policy: 'always',
  },
  {
    key: 'first_session_of_drill',
    eventType: 'first_session_of_drill',
    amount: 25,
    policy: 'first_only',
  },
  {
    key: 'track_completed',
    eventType: 'track_completed',
    amount: 500,
    policy: 'first_only',
  },
  {
    key: 'scene_created',
    eventType: 'scene_created',
    amount: 20,
    policy: 'always',
  },
  {
    key: 'scene_rated_five',
    eventType: 'scene_rated',
    amount: 10,
    policy: 'always',
  },
  {
    key: 'sidequest_completed',
    eventType: 'sidequest_completed',
    amount: 25,
    policy: 'always',
  },
]

export function getXpRulesForEvent(event: RinkActivityEvent): XpRuleDefinition[] {
  const matched = XP_RULES.filter((rule) => {
    if (rule.eventType === event.type) return true
    if (
      rule.eventType === 'first_session_of_drill' &&
      event.type === 'session_completed' &&
      event.isFirstSessionOfDrill
    ) {
      return true
    }
    return false
  })

  if (event.type === 'scene_rated' && event.rating !== 5) {
    return matched.filter((rule) => rule.key !== 'scene_rated_five')
  }

  return matched
}
