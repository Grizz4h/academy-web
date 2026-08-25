import { ACHIEVEMENTS } from './achievements'

/** Legacy medal achievements (pre-Tank). Frozen when unified pipeline is on. */
export const LEGACY_ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((item) => item.id))

/** Overlap map from Phase 4 — block double Tank grant when legacy id exists. */
export const LEGACY_TO_TANK_EQUIVALENT: Record<string, string> = {
  'first-drill-complete': 'first_shift',
  'ten-drills-complete': 'getting_warm',
  'fifty-drills-complete': 'rink_rat',
}

export function isLegacyAchievementId(id: string): boolean {
  return LEGACY_ACHIEVEMENT_IDS.has(id)
}

export function isLegacyAchievementsReadOnly(): boolean {
  return true
}

export function isTankBlockedByLegacyUnlock(
  tankAchievementId: string,
  unlockedAchievements: Record<string, unknown>,
): boolean {
  if (!isLegacyAchievementsReadOnly()) return false
  for (const [legacyId, tankId] of Object.entries(LEGACY_TO_TANK_EQUIVALENT)) {
    if (tankId === tankAchievementId && unlockedAchievements[legacyId]) return true
  }
  return false
}
