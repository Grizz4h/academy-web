import type { LevelRewardDefinition } from './types'

export {
  BASE_XP_PER_UNIT,
  PROGRESSION_CURVE_VERSION,
  cumulativeXpForLevel,
  getLevelFromXp,
  getLevelFromXpLegacy,
  getXpProgressForLevel,
  levelsGainedBetween,
  migrateProgressionCurve,
  unitsRequiredForLevel,
  xpRequiredForLevel,
  xpRequiredForLevelLegacy,
} from './levelCurve'
export type { CurveMigrationSlice, LevelProgressView } from './levelCurve'

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
