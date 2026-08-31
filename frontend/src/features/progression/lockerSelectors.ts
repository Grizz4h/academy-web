import { getAvatarAsset } from '../../data/profile/avatarCatalog'
import { getBannerAsset } from '../../data/profile/bannerCatalog'
import { getCoinAsset } from '../../data/profile/coinCatalog'
import { getEmblemAsset } from '../../data/profile/emblemCatalog'
import { getStickerAsset } from '../../data/profile/stickerCatalog'
import { getTankAchievement } from './achievements/achievementCatalog'
import { COLLECTIONS } from './collections/collectionCatalog'
import { selectCollectionProgress } from './collections/collectionEngine'
import { COSMETIC_CATALOG, getCosmetic, isStarterCosmetic, RARITY_LABELS, RARITY_RANK } from './cosmetics/cosmeticCatalog'
import { selectLevelProgress, isCosmeticOwned, type ProgressionViewState } from './selectors'
import { SHOP_LISTINGS } from './shop/shopCatalog'
import type {
  CosmeticDefinition,
  CosmeticType,
  RewardOrigin,
  RewardRarity,
} from './types'
import { EQUIPABLE_COSMETIC_TYPES } from './types'

export type LockerFilterType =
  | 'all'
  | CosmeticType
  | 'unlocked'
  | 'locked'
  | 'new'
  | 'favorites'
  | RewardRarity

export type LockerItemView = {
  definition: CosmeticDefinition
  owned: boolean
  isNew: boolean
  isFavorite: boolean
  hidden: boolean
  silhouette: boolean
  mystery: boolean
  displayName: string
  displayDescription?: string
  artworkUrl?: string
  originLabel: string
  unlockHint?: string
}

const EVENT_ORIGIN_LABELS: Record<string, string> = {
  track0_bundle: 'Track 0 abgeschlossen',
  'early_slot:2': '2 Beobachtungs-Units abgeschlossen',
  'early_slot:4': '4 Beobachtungs-Units abgeschlossen',
  'early_slot:10': '10 Beobachtungs-Units abgeschlossen',
  'early_slot:24': '24 Beobachtungs-Units abgeschlossen',
  'early_slot:48': '48 Beobachtungs-Units abgeschlossen',
}

const EVENT_UNLOCK_HINTS: Record<string, string> = {
  track0_bundle: 'Track 0 abschließen',
  'early_slot:2': '2 Beobachtungs-Units abschließen',
  'early_slot:4': '4 Beobachtungs-Units abschließen',
  'early_slot:10': '10 Beobachtungs-Units abschließen',
  'early_slot:24': '24 Beobachtungs-Units abschließen',
  'early_slot:48': '48 Beobachtungs-Units abschließen',
}

const TRACK_MASTERY_LABELS: Record<string, string> = {
  C1: 'Defensive Zone Mastery',
  C2: 'Neutral Zone Mastery',
  D2: 'Special Teams Mastery',
  D3: 'Powerplay/PK Mastery',
}

const COLLECTION_BY_ID = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c]))

function achievementLabel(achievementId: string): string {
  const def = getTankAchievement(achievementId)
  return def?.name || achievementId
}

/** How to unlock (locked state) — action-oriented. */
export function formatUnlockHow(origin: RewardOrigin): string {
  switch (origin.type) {
    case 'achievement':
      return `Achievement „${achievementLabel(origin.achievementId)}“ freischalten`
    case 'level':
      return `Account-Level ${origin.level} erreichen`
    case 'track_mastery':
      return `${TRACK_MASTERY_LABELS[origin.trackId] || `Track ${origin.trackId}`} abschließen`
    case 'starter':
      return 'Vom Start an verfügbar'
    case 'pux_shop':
      return SHOP_LISTINGS.length > 0 ? 'Im Pux Shop kaufen' : 'Bald im Pux Shop'
    case 'battle_pass':
      return `Battle-Pass-Saison ${origin.seasonId}`
    case 'collection': {
      const name = COLLECTION_BY_ID[origin.collectionId]?.name
      return name ? `Collection „${name}“ vervollständigen` : 'Collection vervollständigen'
    }
    case 'challenge':
      return 'Challenge abschließen'
    case 'event':
      return EVENT_UNLOCK_HINTS[origin.eventId] || 'Durch Spielen freischalten'
    case 'secret':
      return 'Geheim — später im Spiel'
    case 'artist_series':
      return 'Artist Series'
    default:
      return 'Noch nicht freigeschaltet'
  }
}

/** Provenance when owned — what you did. */
export function formatOriginLabel(origin: RewardOrigin): string {
  switch (origin.type) {
    case 'achievement':
      return `Achievement „${achievementLabel(origin.achievementId)}“`
    case 'level':
      return `Level ${origin.level} erreicht`
    case 'track_mastery':
      return TRACK_MASTERY_LABELS[origin.trackId] || `Track-Mastery ${origin.trackId}`
    case 'starter':
      return 'Starter-Ausstattung'
    case 'pux_shop':
      return 'Im Pux Shop gekauft'
    case 'battle_pass':
      return `Battle Pass ${origin.seasonId}`
    case 'collection': {
      const name = COLLECTION_BY_ID[origin.collectionId]?.name
      return name ? `Collection „${name}“` : 'Collection'
    }
    case 'challenge':
      return 'Challenge abgeschlossen'
    case 'event':
      return EVENT_ORIGIN_LABELS[origin.eventId] || 'Durch Spielen verdient'
    case 'secret':
      return 'Geheim freigeschaltet'
    case 'artist_series':
      return 'Artist Series'
    default:
      return 'Unbekannt'
  }
}

function artworkFor(def: CosmeticDefinition): string | undefined {
  const assetId = def.assetId || def.id
  if (def.type === 'avatar') return getAvatarAsset(assetId)?.src
  if (def.type === 'banner') return getBannerAsset(assetId)?.src
  if (def.type === 'emblem') return getEmblemAsset(assetId)?.src
  if (def.type === 'sticker') return getStickerAsset(assetId)?.src
  if (def.type === 'masteryCoin') return getCoinAsset(assetId)?.src
  return undefined
}

export function selectLockerItems(
  state: ProgressionViewState & {
    favoriteCosmeticIds?: string[]
  },
  options?: { revealAll?: boolean },
): LockerItemView[] {
  const revealAll = options?.revealAll === true
  const favorites = new Set(state.favoriteCosmeticIds || [])
  return COSMETIC_CATALOG.map((definition) => {
    const owned = isCosmeticOwned(state, definition.id)
    const unlock = state.unlockedCosmetics?.[definition.id]
    const visibility = definition.visibility || 'visible'
    const mystery = !revealAll && !owned && visibility === 'secret'
    const silhouette = !revealAll && !owned && visibility === 'silhouette'
    const isNew = Boolean(owned && unlock && !unlock.seenAt && unlock.earnKind !== 'starter' && !isStarterCosmetic(definition.id))

    return {
      definition,
      owned,
      isNew,
      isFavorite: favorites.has(definition.id),
      hidden: mystery,
      silhouette,
      mystery,
      displayName: mystery ? 'Geheimnis' : definition.name,
      displayDescription: mystery
        ? 'Noch nicht entdeckt.'
        : definition.description && definition.description !== definition.flavorText
          ? definition.description
          : undefined,
      artworkUrl: mystery ? undefined : artworkFor(definition),
      originLabel: mystery ? 'Geheimnis' : formatOriginLabel(definition.origin),
      unlockHint: owned
        ? unlock?.unlockedAt
          ? `Freigeschaltet: ${new Date(unlock.unlockedAt).toLocaleDateString('de-DE')}`
          : 'Freigeschaltet'
        : mystery
          ? 'Geheimnis — weiter spielen'
          : formatUnlockHow(definition.origin),
    }
  })
}

export function filterLockerItems(
  items: LockerItemView[],
  filters: {
    type?: CosmeticType | 'all'
    ownership?: 'all' | 'unlocked' | 'locked' | 'new' | 'favorites'
    rarity?: RewardRarity | 'all'
    collectionId?: string | 'all'
    originType?: RewardOrigin['type'] | 'all'
    query?: string
  },
): LockerItemView[] {
  const type = filters.type || 'all'
  const ownership = filters.ownership || 'all'
  const rarity = filters.rarity || 'all'
  const collectionId = filters.collectionId || 'all'
  const originType = filters.originType || 'all'
  const query = (filters.query || '').trim().toLowerCase()

  return items
    .filter((item) => {
      // Hide empty future categories with zero catalog entries of that type already handled by catalog
      if (type !== 'all' && item.definition.type !== type) return false
      if (ownership === 'unlocked' && !item.owned) return false
      if (ownership === 'locked' && item.owned) return false
      if (ownership === 'new' && !item.isNew) return false
      if (ownership === 'favorites' && !item.isFavorite) return false
      if (rarity !== 'all' && item.definition.rarity !== rarity) return false
      if (collectionId !== 'all' && item.definition.collectionId !== collectionId) return false
      if (originType !== 'all' && item.definition.origin.type !== originType) return false
      if (query) {
        const hay = `${item.displayName} ${item.definition.type} ${item.originLabel}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      return true
    })
    .sort(compareLockerItems)
}

function compareLockerItems(left: LockerItemView, right: LockerItemView): number {
  const rarity = RARITY_RANK[left.definition.rarity] - RARITY_RANK[right.definition.rarity]
  if (rarity !== 0) return rarity
  const type = left.definition.type.localeCompare(right.definition.type)
  if (type !== 0) return type
  return left.displayName.localeCompare(right.displayName, 'de')
}

export function selectLockerStats(state: ProgressionViewState & { favoriteCosmeticIds?: string[] }) {
  const items = selectLockerItems(state)
  const owned = items.filter((item) => item.owned).length
  const total = items.length
  const neu = items.filter((item) => item.isNew).length
  const legendary = items.filter((item) => item.owned && item.definition.rarity === 'legendary').length
  const secrets = Object.values(state.unlockedAchievements || {}).filter((item) => {
    // approximate discovered secrets via unlocked secret cosmetics
    const cosmetic = getCosmetic(item.id)
    return cosmetic?.visibility === 'secret'
  }).length
  const secretCosmetics = items.filter(
    (item) => item.owned && (item.definition.visibility === 'secret' || item.definition.origin.type === 'secret'),
  ).length
  const collections = selectCollectionProgress(state.unlockedCosmetics || {}, (id) => isStarterCosmetic(id) || isCosmeticOwned(state, id))
  const collectionsDone = collections.filter((c) => c.completed).length
  const level = selectLevelProgress(state)
  const openAchievements = Math.max(
    0,
    // rough: visible achievements not unlocked — caller may refine
    0,
  )

  return {
    level: level.level,
    xpIntoLevel: level.xpIntoLevel,
    xpForNextLevel: level.xpForNextLevel,
    totalXp: level.totalXp,
    pux: Number(state.currency?.PUX || 0),
    cosmeticsOwned: owned,
    cosmeticsTotal: total,
    newUnlocks: neu,
    legendary,
    secretsDiscovered: secretCosmetics + secrets,
    collectionsDone,
    collectionsTotal: COLLECTIONS.length,
    openAchievements,
    shopListings: SHOP_LISTINGS.length,
  }
}

export function isEquipableCosmetic(def: CosmeticDefinition): boolean {
  return EQUIPABLE_COSMETIC_TYPES.includes(def.type)
}

export const LOCKER_TYPE_CHIPS: Array<{ id: CosmeticType | 'all'; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'emblem', label: 'Embleme' },
  { id: 'banner', label: 'Banner' },
  { id: 'avatar', label: 'Avatare' },
  { id: 'frame', label: 'Frames' },
  { id: 'title', label: 'Titel' },
  { id: 'tagline', label: 'Taglines' },
  { id: 'sticker', label: 'Sticker' },
  { id: 'masteryCoin', label: 'Coins' },
  { id: 'stickModel', label: 'Sticks' },
  { id: 'puckModel', label: 'Pucks' },
]

export { RARITY_LABELS }
