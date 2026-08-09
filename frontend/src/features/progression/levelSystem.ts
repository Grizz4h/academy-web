import type { LevelRewardDefinition } from './types'

/** Progressive XP curve: level N requires base * N^1.35 XP within that level. */
const BASE_XP_PER_LEVEL = 100

export function xpRequiredForLevel(level: number): number {
  if (level < 1) return 0
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(level, 1.35))
}

/** Cumulative XP required to reach the start of `level` (level 1 = 0). */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let l = 1; l < level; l += 1) {
    total += xpRequiredForLevel(l)
  }
  return total
}

export function getLevelFromXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = 1
  let remaining = xp
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level)
    level += 1
    if (level > 500) break
  }
  return level
}

export function getXpProgressForLevel(totalXp: number): {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  xpToNextLevel: number
  progress01: number
  totalXp: number
} {
  const safeTotal = Math.max(0, Math.floor(totalXp || 0))
  const level = getLevelFromXp(safeTotal)
  const floor = cumulativeXpForLevel(level)
  const xpIntoLevel = safeTotal - floor
  const xpForNextLevel = xpRequiredForLevel(level)
  const xpToNextLevel = Math.max(0, xpForNextLevel - xpIntoLevel)
  const progress01 = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1
  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    xpToNextLevel,
    progress01,
    totalXp: safeTotal,
  }
}

/** Levels crossed when going from previousXp → nextXp (exclusive of starting level). */
export function levelsGainedBetween(previousXp: number, nextXp: number): number[] {
  const from = getLevelFromXp(previousXp)
  const to = getLevelFromXp(nextXp)
  if (to <= from) return []
  const gained: number[] = []
  for (let level = from + 1; level <= to; level += 1) {
    gained.push(level)
  }
  return gained
}

export const LEVEL_REWARDS: LevelRewardDefinition[] = [
  {
    level: 5,
    rewards: [
      { type: 'pux', amount: 50 },
      { type: 'cosmetic', cosmeticId: 'title_level_5_observer' },
    ],
  },
  {
    level: 10,
    rewards: [
      { type: 'pux', amount: 100 },
      { type: 'cosmetic', cosmeticId: 'banner_level_10' },
    ],
  },
  {
    level: 15,
    rewards: [
      { type: 'pux', amount: 150 },
      { type: 'cosmetic', cosmeticId: 'title_level_15_analyst' },
    ],
  },
  {
    level: 20,
    rewards: [
      { type: 'pux', amount: 200 },
      { type: 'cosmetic', cosmeticId: 'emblem_level_20' },
    ],
  },
]

export function getLevelRewards(level: number): LevelRewardDefinition | undefined {
  return LEVEL_REWARDS.find((entry) => entry.level === level)
}
