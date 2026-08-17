import { avatarCatalog } from '../../../data/profile/avatarCatalog'
import { bannerCatalog } from '../../../data/profile/bannerCatalog'
import { emblemCatalog } from '../../../data/profile/emblemCatalog'
import { profileTitleCatalog } from '../../../data/profile/profileTitleCatalog'
import type { CosmeticDefinition } from '../types'
import { PHASE2_COSMETICS } from './phase2Cosmetics'
import { PUCK_POC_COSMETICS } from './puckSkins'
import { STICK_POC_COSMETICS } from './stickSkins'

/** Unlockable preset taglines (text cosmetics). */
export const TAGLINE_PRESETS: Array<{ id: string; text: string; description?: string }> = [
  { id: 'tagline_structure_before_outcome', text: 'Structure before outcome.' },
  { id: 'tagline_watch_the_center', text: 'Watch the center.' },
  { id: 'tagline_one_more_replay', text: 'One more replay.' },
  { id: 'tagline_no_slot', text: 'No slot.' },
  { id: 'tagline_paused_for_research', text: 'I paused it for research.' },
  { id: 'tagline_starter', text: 'Ich bringe mir gerade Hockey bei.', description: 'Starter-Tagline' },
]

function starterAvatarCosmetics(): CosmeticDefinition[] {
  return avatarCatalog.filter((asset) => asset.starter !== false).map((asset) => ({
    id: asset.id,
    type: 'avatar' as const,
    name: asset.label,
    rarity: 'common' as const,
    assetId: asset.id,
    origin: { type: 'starter' as const },
  }))
}

function starterBannerCosmetics(): CosmeticDefinition[] {
  return bannerCatalog.filter((asset) => asset.starter !== false).map((asset) => ({
    id: asset.id,
    type: 'banner' as const,
    name: asset.label,
    rarity: 'common' as const,
    assetId: asset.id,
    origin: { type: 'starter' as const },
  }))
}

function starterEmblemCosmetics(): CosmeticDefinition[] {
  return emblemCatalog.filter((asset) => asset.starter !== false).map((asset) => ({
    id: asset.id,
    type: 'emblem' as const,
    name: asset.label,
    rarity: 'common' as const,
    assetId: asset.id,
    origin: { type: 'starter' as const },
  }))
}

function starterTitleCosmetics(): CosmeticDefinition[] {
  return profileTitleCatalog.map((title) => ({
    id: `title_catalog_${title.id}`,
    type: 'title' as const,
    name: title.label,
    description: title.description,
    rarity: 'common' as const,
    assetId: title.id,
    text: title.label,
    origin: { type: 'starter' as const },
    metadata: { profileTitleId: title.id },
  }))
}

/** Achievement / level exclusives (may alias existing visual assets). */
const REWARD_COSMETICS: CosmeticDefinition[] = [
  {
    id: 'title_first_shift',
    type: 'title',
    name: 'First Shift',
    text: 'First Shift',
    rarity: 'common',
    origin: { type: 'achievement', achievementId: 'first_shift' },
    metadata: { profileTitleId: 'hockey_observer' },
  },
  {
    id: 'title_clip_goblin',
    type: 'title',
    name: 'Clip Goblin',
    text: 'Clip Goblin',
    flavorText: 'Just one more scene.',
    rarity: 'rare',
    origin: { type: 'achievement', achievementId: 'clip_goblin' },
    collectionId: undefined,
  },
  {
    id: 'title_ice_cartographer',
    type: 'title',
    name: 'Ice Cartographer',
    text: 'Ice Cartographer',
    flavorText: 'Maps first. Opinions later.',
    rarity: 'rare',
    origin: { type: 'achievement', achievementId: 'ice_cartographer' },
    collectionId: 'blue_line_department',
  },
  {
    id: 'title_slot_watcher',
    type: 'title',
    name: 'Slot Watcher',
    text: 'Slot Watcher',
    flavorText: 'Eyes on the dangerous square.',
    rarity: 'uncommon',
    origin: { type: 'achievement', achievementId: 'five_man_conspiracy' },
    metadata: { profileTitleId: 'slot_watcher' },
    collectionId: 'the_slot',
  },
  {
    id: 'title_blue_line_student',
    type: 'title',
    name: 'Blue Line Student',
    text: 'Blue Line Student',
    flavorText: 'Clipboard optional.',
    rarity: 'rare',
    origin: { type: 'achievement', achievementId: 'blue_line_inspector' },
    metadata: { profileTitleId: 'blue_line_student' },
    collectionId: 'blue_line_department',
  },
  {
    id: 'title_neutral_zone_tourist',
    type: 'title',
    name: 'Neutral Zone Tourist',
    text: 'Neutral Zone Tourist',
    flavorText: 'Between the lines on purpose.',
    rarity: 'rare',
    origin: { type: 'achievement', achievementId: 'neutral_zone_tourist' },
    metadata: { profileTitleId: 'neutral_zone_tourist' },
    collectionId: 'neutral_zone_goblins',
  },
  {
    id: 'title_puck_detective',
    type: 'title',
    name: 'Puck Detective',
    text: 'Puck Detective',
    flavorText: 'Follow the puck — and the options behind it.',
    rarity: 'uncommon',
    origin: { type: 'achievement', achievementId: 'scouting_around' },
    metadata: { profileTitleId: 'puck_detective' },
    collectionId: 'rink_rat_starter',
  },
  {
    id: 'title_rink_rat',
    type: 'title',
    name: 'Rink Rat',
    text: 'Rink Rat',
    flavorText: 'Immer irgendwo am Glas.',
    rarity: 'rare',
    origin: { type: 'achievement', achievementId: 'rink_rat' },
    metadata: { profileTitleId: 'rink_rat' },
    collectionId: 'rink_rat_starter',
  },
  {
    id: 'title_level_5_observer',
    type: 'title',
    name: 'Level 5 Observer',
    text: 'Level 5 Observer',
    rarity: 'uncommon',
    origin: { type: 'level', level: 5 },
  },
  {
    id: 'title_level_15_analyst',
    type: 'title',
    name: 'Film Room Analyst',
    text: 'Film Room Analyst',
    rarity: 'epic',
    origin: { type: 'level', level: 15 },
  },
  {
    id: 'banner_level_10',
    type: 'banner',
    name: 'Level 10 Blue Line',
    rarity: 'rare',
    assetId: 'banner_level_10',
    origin: { type: 'level', level: 10 },
  },
  {
    id: 'emblem_level_20',
    type: 'emblem',
    name: 'Level 20 Crest',
    rarity: 'epic',
    assetId: 'emblem_level_20',
    origin: { type: 'level', level: 20 },
  },
  {
    id: 'emblem_arrow_unlock',
    type: 'emblem',
    name: 'Follow The Arrow',
    rarity: 'uncommon',
    assetId: 'emblem_arrow_unlock',
    origin: { type: 'achievement', achievementId: 'follow_the_arrow' },
  },
  ...TAGLINE_PRESETS.map((preset) => ({
    id: preset.id,
    type: 'tagline' as const,
    name: preset.text,
    description: preset.description,
    text: preset.text,
    rarity: (preset.id === 'tagline_starter' ? 'common' : 'uncommon') as CosmeticDefinition['rarity'],
    origin:
      preset.id === 'tagline_starter'
        ? ({ type: 'starter' } as const)
        : ({ type: 'achievement', achievementId: 'clip_hoarder' } as const),
  })),
]

/** Override tagline origins to match their real achievements. */
function fixTaglineOrigins(list: CosmeticDefinition[]): CosmeticDefinition[] {
  const originById: Record<string, CosmeticDefinition['origin']> = {
    tagline_starter: { type: 'starter' },
    tagline_structure_before_outcome: { type: 'achievement', achievementId: 'numerical_nonsense' },
    tagline_watch_the_center: { type: 'achievement', achievementId: 'neutral_zone_tourist' },
    tagline_one_more_replay: { type: 'achievement', achievementId: 'clip_hoarder' },
    tagline_no_slot: { type: 'achievement', achievementId: 'slot_squatter' },
    tagline_paused_for_research: { type: 'secret', achievementId: 'no_idea_yet' },
  }
  return list.map((item) => {
    if (item.type !== 'tagline') return item
    const origin = originById[item.id]
    return origin ? { ...item, origin } : item
  })
}

function uniqueCosmetics(items: CosmeticDefinition[]): CosmeticDefinition[] {
  const map = new Map<string, CosmeticDefinition>()
  for (const item of items) map.set(item.id, item)
  return Array.from(map.values())
}

export const COSMETIC_CATALOG: CosmeticDefinition[] = uniqueCosmetics([
  ...starterAvatarCosmetics(),
  ...starterBannerCosmetics(),
  ...starterEmblemCosmetics(),
  ...starterTitleCosmetics(),
  ...fixTaglineOrigins(REWARD_COSMETICS).map((item) => {
    if (item.id === 'tagline_no_slot') return { ...item, collectionId: 'the_slot' }
    if (item.id === 'tagline_watch_the_center') return { ...item, collectionId: 'neutral_zone_goblins' }
    return item
  }),
  ...PHASE2_COSMETICS,
  ...PUCK_POC_COSMETICS,
  ...STICK_POC_COSMETICS,
])

export const COSMETIC_BY_ID: Record<string, CosmeticDefinition> = Object.fromEntries(
  COSMETIC_CATALOG.map((item) => [item.id, item]),
)
export function getCosmetic(id: string): CosmeticDefinition | undefined {
  return COSMETIC_BY_ID[id]
}

export function getStarterCosmeticIds(): string[] {
  return COSMETIC_CATALOG.filter((item) => item.origin.type === 'starter').map((item) => item.id)
}

export function isStarterCosmetic(id: string): boolean {
  return getCosmetic(id)?.origin.type === 'starter'
}

export const RARITY_LABELS: Record<CosmeticDefinition['rarity'], string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
}

/** Common → mythic. Used for locker/shop lists. */
export const RARITY_RANK: Record<CosmeticDefinition['rarity'], number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
}
