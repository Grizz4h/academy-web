import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import type { RewardRarity } from '../types'

export type FrameLook = {
  id: string
  rarity: RewardRarity
}

const FRAME_IDS = new Set([
  'frame_shop_basic',
  'frame_slot',
  'frame_rink_rat',
  'frame_shop_rare_trim',
  'frame_ice_legend',
  'frame_night_circuit',
])

export function resolveFrameLook(frameId: string | null | undefined): FrameLook | null {
  if (!frameId) return null
  const cosmetic = getCosmetic(frameId)
  if (!cosmetic || cosmetic.type !== 'frame') {
    if (FRAME_IDS.has(frameId)) {
      return { id: frameId, rarity: 'common' }
    }
    return null
  }
  return { id: cosmetic.id, rarity: cosmetic.rarity }
}

export function isKnownFrameId(frameId: string | null | undefined): boolean {
  return Boolean(frameId && (FRAME_IDS.has(frameId) || getCosmetic(frameId)?.type === 'frame'))
}
