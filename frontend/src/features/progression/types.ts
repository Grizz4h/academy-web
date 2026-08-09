/** RINK Tank progression foundation — Phase 1 types. */

export type RewardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export type RewardPolicy = 'always' | 'first_only' | 'daily_capped' | 'milestone'

export type CosmeticType =
  | 'emblem'
  | 'banner'
  | 'avatar'
  | 'frame'
  | 'title'
  | 'tagline'
  // Future (no Phase-1 renderers):
  | 'character'
  | 'card'
  | 'sticker'
  | 'masteryCoin'
  | 'rinkSkin'
  | 'markerSkin'
  | 'drawingSkin'
  | 'nameplate'
  | 'jerseyNumberStyle'
  | 'profileEffect'
  | 'profileBackground'
  | 'stickModel'
  | 'stickSkin'
  | 'puckModel'
  | 'puckSkin'

export type RewardOrigin =
  | { type: 'achievement'; achievementId: string }
  | { type: 'level'; level: number }
  | { type: 'track_mastery'; trackId: string }
  | { type: 'starter' }
  | { type: 'pux_shop' }
  | { type: 'battle_pass'; seasonId: string }
  | { type: 'collection'; collectionId: string }
  | { type: 'event'; eventId: string }
  | { type: 'secret'; achievementId?: string }
  | { type: 'artist_series'; seriesId: string }

export type RewardGrant =
  | { type: 'xp'; amount: number }
  | { type: 'pux'; amount: number }
  | { type: 'cosmetic'; cosmeticId: string }

export type ActivityEventBase = {
  id: string
  type: string
  occurredAt: string
}

export type SessionCompletedEvent = ActivityEventBase & {
  type: 'session_completed'
  sessionId: string
  drillId: string
  trackId: string
  observedTeamId?: string
  leagueId?: string
  mechanicIds?: string[]
  tags?: string[]
  isDummy?: boolean
  isFirstSessionOfDrill?: boolean
}

export type SceneCreatedEvent = ActivityEventBase & {
  type: 'scene_created'
  sceneId: string
  sessionId?: string
  drillId?: string
  trackId?: string
  isDummy?: boolean
}

export type SceneRatedEvent = ActivityEventBase & {
  type: 'scene_rated'
  sceneId: string
  rating: number
  isDummy?: boolean
}

export type TrackCompletedEvent = ActivityEventBase & {
  type: 'track_completed'
  trackId: string
  completionVersion: string
}

export type SidequestCompletedEvent = ActivityEventBase & {
  type: 'sidequest_completed'
  sidequestId: string
  category: 'special_teams' | 'numerical_situation' | string
  sessionId?: string
  situationType?: string
  isDummy?: boolean
}

export type MechanicUsedEvent = ActivityEventBase & {
  type: 'mechanic_used'
  mechanicId: string
  sessionId?: string
  count?: number
  isDummy?: boolean
}

export type PredictionCompletedEvent = ActivityEventBase & {
  type: 'prediction_completed'
  predictionId: string
  sessionId?: string
  isDummy?: boolean
}

export type RinkActivityEvent =
  | SessionCompletedEvent
  | SceneCreatedEvent
  | SceneRatedEvent
  | TrackCompletedEvent
  | SidequestCompletedEvent
  | MechanicUsedEvent
  | PredictionCompletedEvent

export type AchievementCategory =
  | 'activity'
  | 'curriculum'
  | 'specialization'
  | 'teams_leagues'
  | 'game_context'
  | 'scene_pool'
  | 'mechanics'
  | 'breadth'
  | 'depth'
  | 'secret'

export type AchievementCondition =
  | {
      type: 'event_count'
      eventType: RinkActivityEvent['type']
      target: number
    }
  | {
      type: 'unique_count'
      eventType: RinkActivityEvent['type']
      field: string
      target: number
    }
  | {
      type: 'field_count'
      eventType: RinkActivityEvent['type']
      field: string
      value: string
      target: number
    }
  | {
      type: 'track_completed'
      trackId: string
    }
  | {
      type: 'track_completed_count'
      target: number
    }
  | {
      type: 'mechanic_usage'
      mechanicId: string
      target: number
    }
  | {
      type: 'tag_count'
      tag: string
      target: number
    }
  | {
      type: 'sidequest_category'
      category: string
      target: number
    }
  | {
      /** Max frequency of any single value for field across events of type. */
      type: 'max_field_frequency'
      eventType: RinkActivityEvent['type']
      field: string
      target: number
    }

export type AchievementDefinition = {
  id: string
  name: string
  description: string
  category: AchievementCategory
  visibility: 'visible' | 'secret'
  rarity?: RewardRarity
  conditions: AchievementCondition[]
  rewards: RewardGrant[]
  iconAssetId?: string
  progression?: { target: number }
}

export type AchievementUnlock = {
  achievementId: string
  unlockedAt: string
  sourceEventId: string
}

export type CosmeticDefinition = {
  id: string
  type: CosmeticType
  name: string
  description?: string
  /** Short flavor / lore line for Locker detail. */
  flavorText?: string
  rarity: RewardRarity
  assetId?: string
  collectionId?: string
  origin: RewardOrigin
  /** Locker visibility before unlock. Default: visible. */
  visibility?: CosmeticVisibility
  /** For titles/taglines: display text when equipped. */
  text?: string
  metadata?: Record<string, unknown>
}

export type CosmeticVisibility = 'visible' | 'silhouette' | 'secret'

export type CosmeticUnlock = {
  cosmeticId: string
  unlockedAt: string
  sourceType: string
  sourceId?: string
  /** When set, item is no longer shown as NEU in Locker. */
  seenAt?: string
  /** purchased | achievement | level | collection | mastery | starter | bootstrap | … */
  earnKind?: 'derived' | 'purchased' | 'manual' | 'starter'
}

export type EquipmentSlot =
  | 'avatar'
  | 'banner'
  | 'emblem'
  | 'frame'
  | 'title'
  | 'tagline'
  | 'stickModel'
  | 'stickSkin'
  | 'puckModel'
  | 'puckSkin'
  | 'nameplate'
  | 'jerseyNumberStyle'
  | 'profileBackground'

export type EquippedCosmetics = Partial<Record<EquipmentSlot, string>>

export type CollectionDefinition = {
  id: string
  name: string
  description?: string
  itemIds: string[]
  completionRewards?: RewardGrant[]
  visibility?: 'visible' | 'secret'
  artworkAssetId?: string
}

export type ShopListing = {
  id: string
  cosmeticId: string
  pricePux: number
  availability: 'evergreen'
  category?: string
}

export type PuxTransaction = {
  id: string
  type: 'earn' | 'spend'
  amount: number
  sourceType: string
  sourceId?: string
  occurredAt: string
  balanceAfter?: number
}

export type MasteryMilestone = {
  threshold: number
  label: string
  rewards: RewardGrant[]
}

export type MasteryDefinition = {
  id: string
  scope: 'drill' | 'track' | 'domain'
  targetId: string
  name: string
  description?: string
  milestones: MasteryMilestone[]
}

export type MasteryProgressUnlock = {
  masteryId: string
  milestoneThreshold: number
  unlockedAt: string
  sourceEventId: string
}

export type UnlockHistoryEntry = {
  id: string
  kind: 'achievement' | 'level' | 'cosmetic' | 'xp' | 'pux' | 'bootstrap' | 'collection' | 'mastery' | 'shop'
  title: string
  description?: string
  occurredAt: string
  sourceEventId?: string
  achievementId?: string
  cosmeticId?: string
  collectionId?: string
  masteryId?: string
  level?: number
  amountXp?: number
  amountPux?: number
}

export type ProcessedEventRecord = {
  eventId: string
  processedAt: string
  grantedXp: number
  grantedPux: number
}

export type XpRuleDefinition = {
  key: string
  eventType: RinkActivityEvent['type'] | 'first_session_of_drill'
  amount: number
  policy: RewardPolicy
  /** For daily_capped */
  dailyCap?: number
}

export type LevelRewardDefinition = {
  level: number
  rewards: RewardGrant[]
}

export type ProgressionApplyResult = {
  eventId: string
  evaluatedAt: string
  grantedXp: number
  grantedPux: number
  unlockedAchievements: AchievementUnlock[]
  unlockedCosmetics: CosmeticUnlock[]
  unlockHistory: UnlockHistoryEntry[]
  levelsGained: number[]
  rewardEvents: Array<Record<string, unknown>>
  bootstrapSummary?: {
    achievements: number
    cosmetics: number
    level: number
    xp: number
  }
  nextXp: number
  nextLevel: number
  activityEventsAppended: RinkActivityEvent[]
  alreadyProcessed: boolean
  completedCollections?: string[]
  masteryUnlocks?: MasteryProgressUnlock[]
}

/** Equipable cosmetic types in Phase 2 UI. */
export const EQUIPABLE_COSMETIC_TYPES: CosmeticType[] = [
  'avatar',
  'banner',
  'emblem',
  'frame',
  'title',
  'tagline',
]

export const COSMETIC_TYPE_TO_SLOT: Partial<Record<CosmeticType, EquipmentSlot>> = {
  avatar: 'avatar',
  banner: 'banner',
  emblem: 'emblem',
  frame: 'frame',
  title: 'title',
  tagline: 'tagline',
  stickModel: 'stickModel',
  stickSkin: 'stickSkin',
  puckModel: 'puckModel',
  puckSkin: 'puckSkin',
  nameplate: 'nameplate',
  jerseyNumberStyle: 'jerseyNumberStyle',
  profileBackground: 'profileBackground',
}
