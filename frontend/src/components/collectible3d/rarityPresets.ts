/**
 * Collectible rarity for 3D loot. Locker catalog currently spells the top tier
 * `mythic`; this PoC uses the product word `mystic` and accepts both.
 */
export const COLLECTIBLE_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mystic',
] as const

export type CollectibleRarity = (typeof COLLECTIBLE_RARITIES)[number]

export type RarityPreset = {
  id: CollectibleRarity
  shellMaterial: 'base' | 'accent' | 'physical' | 'mystic'
  cage: boolean
  halo: boolean
  shards: boolean
  particles: boolean
  idle: boolean
  energyChannels: boolean
}

export const RARITY_PRESETS: Record<CollectibleRarity, RarityPreset> = {
  common: {
    id: 'common',
    shellMaterial: 'base',
    cage: false,
    halo: false,
    shards: false,
    particles: false,
    idle: false,
    energyChannels: false,
  },
  uncommon: {
    id: 'uncommon',
    shellMaterial: 'accent',
    cage: false,
    halo: false,
    shards: false,
    particles: false,
    idle: true,
    energyChannels: false,
  },
  rare: {
    id: 'rare',
    shellMaterial: 'physical',
    cage: false,
    halo: false,
    shards: false,
    particles: false,
    idle: true,
    energyChannels: true,
  },
  epic: {
    id: 'epic',
    shellMaterial: 'physical',
    cage: true,
    halo: false,
    shards: false,
    particles: false,
    idle: true,
    energyChannels: true,
  },
  legendary: {
    id: 'legendary',
    shellMaterial: 'mystic',
    cage: true,
    halo: false,
    shards: true,
    particles: false,
    idle: true,
    energyChannels: true,
  },
  mystic: {
    id: 'mystic',
    shellMaterial: 'mystic',
    cage: true,
    halo: true,
    shards: true,
    particles: true,
    idle: true,
    energyChannels: true,
  },
}

export function resolveCollectibleRarity(
  rarity: CollectibleRarity | 'mythic' | undefined,
): CollectibleRarity {
  if (!rarity || rarity === 'mythic') return 'mystic'
  return rarity
}

export function getRarityPreset(
  rarity: CollectibleRarity | 'mythic' | undefined,
): RarityPreset {
  return RARITY_PRESETS[resolveCollectibleRarity(rarity)]
}
