import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import { canonicalCosmeticId } from '../cosmetics/cosmeticAliases'
import type { RewardRarity } from '../types'

export type FrameLook = {
  id: string
  rarity: RewardRarity
}

const FRAME_IDS = new Set([
  'frame_basic',
  'frame_shop_basic', // Ist alias
  'frame_slot',
  'frame_rink_rat',
  'frame_century',
  'frame_spatial',
  'frame_rare_trim',
  'frame_shop_rare_trim', // Ist alias
  'frame_ice_legend',
  'frame_night_circuit',
])

export function resolveFrameLook(frameId: string | null | undefined): FrameLook | null {
  if (!frameId) return null
  const resolvedId = canonicalCosmeticId(frameId) || frameId
  const cosmetic = getCosmetic(resolvedId) || getCosmetic(frameId)
  if (!cosmetic || cosmetic.type !== 'frame') {
    if (FRAME_IDS.has(frameId) || FRAME_IDS.has(resolvedId)) {
      return { id: resolvedId, rarity: 'common' }
    }
    return null
  }
  return { id: cosmetic.id, rarity: cosmetic.rarity }
}

export function isKnownFrameId(frameId: string | null | undefined): boolean {
  if (!frameId) return false
  const resolvedId = canonicalCosmeticId(frameId) || frameId
  return (
    FRAME_IDS.has(frameId) ||
    FRAME_IDS.has(resolvedId) ||
    getCosmetic(resolvedId)?.type === 'frame' ||
    getCosmetic(frameId)?.type === 'frame'
  )
}
