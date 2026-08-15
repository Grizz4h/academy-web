import type { RewardRarity } from '../types'
import { getCosmetic } from './cosmeticCatalog'

export const AVATAR_SHAPE_BY_RARITY: Record<RewardRarity, string> = {
  common: 'circle(50%)',
  uncommon: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
  rare: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  epic: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  legendary: 'polygon(50% 0%, 70% 16%, 100% 16%, 84% 50%, 100% 84%, 70% 84%, 50% 100%, 30% 84%, 0% 84%, 16% 50%, 0% 16%, 30% 16%)',
  mythic: 'polygon(50% 0%, 63% 28%, 100% 28%, 72% 52%, 82% 91%, 50% 70%, 18% 91%, 28% 52%, 0% 28%, 37% 28%)',
}

export function resolveAvatarRarity(avatarId: string | null | undefined): RewardRarity {
  if (!avatarId) return 'common'
  const cosmetic = getCosmetic(avatarId)
  if (cosmetic?.type === 'avatar') return cosmetic.rarity
  return 'common'
}
