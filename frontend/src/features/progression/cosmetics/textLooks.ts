import type { CosmeticDefinition, CosmeticType, RewardRarity } from '../types'
import { COSMETIC_CATALOG, getCosmetic } from './cosmeticCatalog'
import { getProfileTitle, resolveProfileTitleLabel } from '../../../data/profile/profileTitleCatalog'

function textCosmeticMatches(item: CosmeticDefinition, raw: string): boolean {
  return (
    item.id === raw
    || item.text === raw
    || item.name === raw
    || item.metadata?.profileTitleId === raw
    || item.id === `title_catalog_${raw}`
  )
}

/** Resolve a stored title/tagline. Prefer the cosmetic id; legacy aliases keep the starter/common variant. */
export function resolveTextCosmetic(
  type: Extract<CosmeticType, 'title' | 'tagline'>,
  raw: string | null | undefined,
): CosmeticDefinition | null {
  if (!raw) return null
  const direct = getCosmetic(raw)
  if (direct?.type === type) return direct

  const matches = COSMETIC_CATALOG.filter((item) => item.type === type && textCosmeticMatches(item, raw))
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  const catalogStarter = matches.find((item) => item.id === `title_catalog_${raw}`)
  if (catalogStarter) return catalogStarter
  const starter = matches.find((item) => item.origin.type === 'starter')
  if (starter) return starter
  return matches[0]
}

export function resolveEquippedTitle(raw: string | null | undefined): { label: string; rarity: RewardRarity } | null {
  const match = resolveTextCosmetic('title', raw)
  if (match) return { label: match.text || match.name, rarity: match.rarity }
  if (!raw) return null
  const catalog = getProfileTitle(raw)
  if (catalog) return { label: catalog.label, rarity: 'common' }
  const label = resolveProfileTitleLabel(raw)
  return label ? { label, rarity: 'common' } : null
}

export function resolveEquippedTagline(raw: string | null | undefined): { label: string; rarity: RewardRarity } | null {
  if (!raw) return null
  const match = resolveTextCosmetic('tagline', raw)
  return { label: match?.text || match?.name || raw, rarity: match?.rarity || 'common' }
}
