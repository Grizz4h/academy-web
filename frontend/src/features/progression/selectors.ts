import { evaluateAchievementProgress } from './achievements/achievementEngine'
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  TANK_ACHIEVEMENTS,
  getTankAchievement,
} from './achievements/achievementCatalog'
import { getCosmetic, getStarterCosmeticIds, isStarterCosmetic } from './cosmetics/cosmeticCatalog'
import { ownsCosmeticUnlock } from './cosmetics/cosmeticAliases'
import { getXpProgressForLevel } from './levelSystem'
import type {
  AchievementCategory,
  AchievementDefinition,
  CosmeticDefinition,
  CosmeticUnlock,
  EquippedCosmetics,
  RewardRarity,
  RinkActivityEvent,
  UnlockHistoryEntry,
} from './types'

export type ProgressionViewState = {
  xp: number
  progressionCurveVersion?: number
  levelGrandfatherFloor?: number
  unlockedAchievements: Record<string, { id: string; unlockedAt: string; sourceEventId?: string }>
  unlockedCosmetics: Record<string, CosmeticUnlock>
  activityLog: RinkActivityEvent[]
  unlockHistory: UnlockHistoryEntry[]
  currency?: { PUX?: number }
}

export function selectLevelProgress(state: ProgressionViewState) {
  return getXpProgressForLevel(state.xp || 0, {
    grandfatherFloor: state.levelGrandfatherFloor,
  })
}

export function selectPux(state: ProgressionViewState): number {
  return Number(state.currency?.PUX || 0)
}

export function isCosmeticOwned(state: ProgressionViewState, cosmeticId: string): boolean {
  if (isStarterCosmetic(cosmeticId)) return true
  if (ownsCosmeticUnlock(state.unlockedCosmetics, cosmeticId)) return true
  // Starter pool by id even if catalog origin missing
  if (getStarterCosmeticIds().includes(cosmeticId)) return true
  return false
}

export function selectOwnedCosmetics(state: ProgressionViewState, type?: CosmeticDefinition['type']): CosmeticDefinition[] {
  const ownedIds = new Set<string>([
    ...getStarterCosmeticIds(),
    ...Object.keys(state.unlockedCosmetics || {}),
  ])
  // Resolve aliases to canonical catalog ids for display (dedupe)
  const resolved = new Set<string>()
  for (const id of ownedIds) {
    const def = getCosmetic(id)
    resolved.add(def?.id || id)
  }
  const list: CosmeticDefinition[] = []
  for (const id of resolved) {
    const def = getCosmetic(id)
    if (!def) continue
    if (type && def.type !== type) continue
    list.push(def)
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

export type AchievementViewItem = {
  definition: AchievementDefinition
  unlocked: boolean
  unlockedAt?: string
  current: number
  target: number
  ratio: number
  secretHidden: boolean
}

export function selectAchievementViews(state: ProgressionViewState): AchievementViewItem[] {
  const events = state.activityLog || []
  return TANK_ACHIEVEMENTS.map((definition) => {
    const unlock = state.unlockedAchievements?.[definition.id]
    const progress = evaluateAchievementProgress(definition, events)
    const unlocked = Boolean(unlock)
    const secretHidden = definition.visibility === 'secret' && !unlocked
    return {
      definition,
      unlocked,
      unlockedAt: unlock?.unlockedAt,
      current: unlocked ? progress.target : progress.current,
      target: progress.target,
      ratio: unlocked ? 1 : progress.ratio,
      secretHidden,
    }
  })
}

export function selectAchievementsByCategory(state: ProgressionViewState): Array<{
  category: AchievementCategory
  label: string
  items: AchievementViewItem[]
}> {
  const views = selectAchievementViews(state)
  const order: AchievementCategory[] = [
    'activity',
    'scene_pool',
    'curriculum',
    'mechanics',
    'specialization',
    'teams_leagues',
    'breadth',
    'game_context',
    'depth',
    'secret',
  ]
  return order
    .map((category) => ({
      category,
      label: ACHIEVEMENT_CATEGORY_LABELS[category],
      items: views.filter((item) => item.definition.category === category),
    }))
    .filter((group) => group.items.length > 0)
}

export function selectRecentUnlocks(state: ProgressionViewState, limit = 8): UnlockHistoryEntry[] {
  return [...(state.unlockHistory || [])]
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
    .slice(0, limit)
}

export function resolveEquippedCosmetics(
  equipped: EquippedCosmetics | null | undefined,
  state: ProgressionViewState,
): EquippedCosmetics {
  const pick = (id: string | undefined) => (id && isCosmeticOwned(state, id) ? id : undefined)
  return {
    avatar: pick(equipped?.avatar),
    banner: pick(equipped?.banner),
    emblem: pick(equipped?.emblem),
    frame: pick(equipped?.frame),
    title: pick(equipped?.title),
    tagline: pick(equipped?.tagline),
    stickModel: pick(equipped?.stickModel),
    stickSkin: pick(equipped?.stickSkin),
    puckModel: pick(equipped?.puckModel),
    puckSkin: pick(equipped?.puckSkin),
  }
}

export function selectTitleOptions(state: ProgressionViewState): Array<{ id: string; label: string; cosmeticId: string; rarity: RewardRarity }> {
  return selectOwnedCosmetics(state, 'title').map((cosmetic) => ({
    id: cosmetic.id,
    label: cosmetic.text || cosmetic.name,
    cosmeticId: cosmetic.id,
    rarity: cosmetic.rarity,
  }))
}

export function selectTaglineOptions(state: ProgressionViewState): Array<{ id: string; label: string; rarity: RewardRarity }> {
  return selectOwnedCosmetics(state, 'tagline').map((cosmetic) => ({
    id: cosmetic.id,
    label: cosmetic.text || cosmetic.name,
    rarity: cosmetic.rarity,
  }))
}

export function getAchievementDisplayName(achievementId: string): string {
  return getTankAchievement(achievementId)?.name || achievementId
}
