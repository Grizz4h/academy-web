import { TANK_ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_LABELS } from '../achievements/achievementCatalog'
import { COLLECTIONS } from '../collections/collectionCatalog'
import {
  selectUnassignedCosmeticPool,
  type CosmeticPoolEntry,
} from '../cosmetics/cosmeticAssignmentPool'
import { COSMETIC_CATALOG, getCosmetic } from '../cosmetics/cosmeticCatalog'
import { LEVEL_REWARDS } from '../levelSystem'
import { TRACK_MASTERY_DEFINITIONS } from '../mastery/masteryCatalog'
import type { AchievementCategory, RewardGrant } from '../types'
import type { ChallengeDefinition, ChallengeType } from '../challenges/types'

export type RewardCoverageStatus = 'has_cosmetic' | 'currency_only' | 'empty'

export type ProgressionLaneId =
  | 'grundprogression'
  | 'achievements'
  | 'daily'
  | 'weekly'
  | 'matchday'
  | 'challenge_other'
  | 'levels'
  | 'mastery'
  | 'collections'
  | 'cosmetic_pool'

export type RewardSummary = {
  cosmeticIds: string[]
  cosmeticLabels: string[]
  xp: number
  pux: number
  status: RewardCoverageStatus
}

export type ProgressionCoverageRow = {
  lane: ProgressionLaneId
  id: string
  title: string
  subtitle?: string
  group: string
  rewards: RewardSummary
}

export type ProgressionLaneSummary = {
  lane: ProgressionLaneId
  label: string
  total: number
  withCosmetic: number
  currencyOnly: number
  empty: number
  rows: ProgressionCoverageRow[]
}

export type ProgressionCoverageReport = {
  generatedAt: string
  kpis: {
    cosmeticsTotal: number
    cosmeticsAssigned: number
    cosmeticsPool: number
    achievementsTotal: number
    achievementsWithCosmetic: number
    achievementsCurrencyOnly: number
    challengesTotal: number
    challengesWithCosmetic: number
    challengesCurrencyOnly: number
  }
  lanes: ProgressionLaneSummary[]
  pool: CosmeticPoolEntry[]
  /** Achievements that grant XP/PUX but no cosmetic — primary watch list. */
  achievementsMissingCosmetic: ProgressionCoverageRow[]
  challengesMissingCosmetic: ProgressionCoverageRow[]
}

export const PROGRESSION_LANE_LABELS: Record<ProgressionLaneId, string> = {
  grundprogression: 'Grundprogression',
  achievements: 'Achievements',
  daily: 'Daily',
  weekly: 'Weekly',
  matchday: 'Matchday',
  challenge_other: 'Challenges · Sonstige',
  levels: 'Level-Rewards',
  mastery: 'Track-Mastery',
  collections: 'Collections',
  cosmetic_pool: 'Cosmetic-Vorrat',
}

const GRUNDPROGRESSION_SLOTS: Array<{ id: string; title: string; cosmeticId: string }> = [
  { id: 'track0_bundle', title: 'Track 0 Bundle', cosmeticId: 'frame_basic' },
  { id: 'early_slot:2', title: 'Early Slot · 2 Units', cosmeticId: 'emblem_arrow_01' },
  { id: 'early_slot:4', title: 'Early Slot · 4 Units', cosmeticId: 'avatar_ice_01' },
  { id: 'early_slot:10', title: 'Early Slot · 10 Units', cosmeticId: 'banner_soft_ice' },
  { id: 'early_slot:24', title: 'Early Slot · 24 Units', cosmeticId: 'frame_rare_trim' },
  { id: 'early_slot:48', title: 'Early Slot · 48 Units', cosmeticId: 'avatar_slot_01' },
]

function summarizeGrants(rewards: RewardGrant[] | undefined): RewardSummary {
  const cosmeticIds: string[] = []
  let xp = 0
  let pux = 0
  for (const reward of rewards || []) {
    if (reward.type === 'cosmetic') cosmeticIds.push(reward.cosmeticId)
    if (reward.type === 'xp') xp += reward.amount
    if (reward.type === 'pux') pux += reward.amount
  }
  const cosmeticLabels = cosmeticIds.map((id) => getCosmetic(id)?.name || id)
  const status: RewardCoverageStatus =
    cosmeticIds.length > 0 ? 'has_cosmetic' : xp > 0 || pux > 0 ? 'currency_only' : 'empty'
  return { cosmeticIds, cosmeticLabels, xp, pux, status }
}

function summarizeCosmeticIds(cosmeticIds: string[], xp = 0, pux = 0): RewardSummary {
  const cosmeticLabels = cosmeticIds.map((id) => getCosmetic(id)?.name || id)
  const status: RewardCoverageStatus =
    cosmeticIds.length > 0 ? 'has_cosmetic' : xp > 0 || pux > 0 ? 'currency_only' : 'empty'
  return { cosmeticIds, cosmeticLabels, xp, pux, status }
}

function challengeLane(type: ChallengeType): ProgressionLaneId {
  if (type === 'daily') return 'daily'
  if (type === 'weekly') return 'weekly'
  if (type === 'matchday') return 'matchday'
  return 'challenge_other'
}

function challengeGroupLabel(type: ChallengeType): string {
  if (type === 'daily') return 'Daily'
  if (type === 'weekly') return 'Weekly'
  if (type === 'matchday') return 'Matchday'
  return type
}

function buildLane(
  lane: ProgressionLaneId,
  rows: ProgressionCoverageRow[],
): ProgressionLaneSummary {
  return {
    lane,
    label: PROGRESSION_LANE_LABELS[lane],
    total: rows.length,
    withCosmetic: rows.filter((row) => row.rewards.status === 'has_cosmetic').length,
    currencyOnly: rows.filter((row) => row.rewards.status === 'currency_only').length,
    empty: rows.filter((row) => row.rewards.status === 'empty').length,
    rows,
  }
}

export function buildProgressionCoverageReport(
  challenges: ChallengeDefinition[] = [],
): ProgressionCoverageReport {
  const pool = selectUnassignedCosmeticPool()
  const cosmeticsTotal = COSMETIC_CATALOG.length

  const grundRows: ProgressionCoverageRow[] = GRUNDPROGRESSION_SLOTS.map((slot) => ({
    lane: 'grundprogression',
    id: slot.id,
    title: slot.title,
    subtitle: slot.cosmeticId,
    group: 'Units / Track 0',
    rewards: summarizeCosmeticIds([slot.cosmeticId]),
  }))

  const achievementRows: ProgressionCoverageRow[] = TANK_ACHIEVEMENTS.map((item) => ({
    lane: 'achievements',
    id: item.id,
    title: item.name,
    subtitle: item.description,
    group: ACHIEVEMENT_CATEGORY_LABELS[item.category as AchievementCategory] || item.category,
    rewards: summarizeGrants(item.rewards),
  }))

  const challengeRows: ProgressionCoverageRow[] = challenges.map((item) => ({
    lane: challengeLane(item.type),
    id: item.id,
    title: item.title,
    subtitle: item.description,
    group: challengeGroupLabel(item.type),
    rewards: summarizeGrants(item.rewards),
  }))

  const levelRows: ProgressionCoverageRow[] = LEVEL_REWARDS.map((item) => ({
    lane: 'levels',
    id: `level_${item.level}`,
    title: `Level ${item.level}`,
    group: 'Account-Level',
    rewards: summarizeGrants(item.rewards),
  }))

  const masteryRows: ProgressionCoverageRow[] = TRACK_MASTERY_DEFINITIONS.flatMap((def) =>
    def.milestones.map((milestone) => ({
      lane: 'mastery' as const,
      id: `${def.id}:${milestone.threshold}`,
      title: `${def.name} · ${milestone.label}`,
      subtitle: `Track ${def.targetId} · Threshold ${milestone.threshold}`,
      group: def.targetId,
      rewards: summarizeGrants(milestone.rewards),
    })),
  )

  const collectionRows: ProgressionCoverageRow[] = COLLECTIONS.map((item) => ({
    lane: 'collections',
    id: item.id,
    title: item.name,
    subtitle: `${item.itemIds.length} Items`,
    group: 'Collections',
    rewards: summarizeGrants(item.completionRewards),
  }))

  const poolRows: ProgressionCoverageRow[] = pool.map((entry) => ({
    lane: 'cosmetic_pool',
    id: entry.definition.id,
    title: entry.definition.name,
    subtitle: `${entry.definition.type} · ${entry.poolReason}`,
    group: entry.poolReason,
    rewards: summarizeCosmeticIds([entry.definition.id]),
  }))

  const lanes = [
    buildLane('grundprogression', grundRows),
    buildLane('achievements', achievementRows),
    buildLane('daily', challengeRows.filter((row) => row.lane === 'daily')),
    buildLane('weekly', challengeRows.filter((row) => row.lane === 'weekly')),
    buildLane('matchday', challengeRows.filter((row) => row.lane === 'matchday')),
    buildLane('challenge_other', challengeRows.filter((row) => row.lane === 'challenge_other')),
    buildLane('levels', levelRows),
    buildLane('mastery', masteryRows),
    buildLane('collections', collectionRows),
    buildLane('cosmetic_pool', poolRows),
  ]

  const achievementsMissingCosmetic = achievementRows.filter((row) => row.rewards.status !== 'has_cosmetic')
  const challengesMissingCosmetic = challengeRows.filter((row) => row.rewards.status !== 'has_cosmetic')

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      cosmeticsTotal,
      cosmeticsAssigned: cosmeticsTotal - pool.length,
      cosmeticsPool: pool.length,
      achievementsTotal: achievementRows.length,
      achievementsWithCosmetic: achievementRows.length - achievementsMissingCosmetic.length,
      achievementsCurrencyOnly: achievementsMissingCosmetic.filter((row) => row.rewards.status === 'currency_only').length,
      challengesTotal: challengeRows.length,
      challengesWithCosmetic: challengeRows.length - challengesMissingCosmetic.length,
      challengesCurrencyOnly: challengesMissingCosmetic.filter((row) => row.rewards.status === 'currency_only').length,
    },
    lanes,
    pool,
    achievementsMissingCosmetic,
    challengesMissingCosmetic,
  }
}

export function coverageStatusLabel(status: RewardCoverageStatus): string {
  switch (status) {
    case 'has_cosmetic':
      return 'Mit Cosmetic'
    case 'currency_only':
      return 'Nur XP/PUX'
    default:
      return 'Keine Rewards'
  }
}
