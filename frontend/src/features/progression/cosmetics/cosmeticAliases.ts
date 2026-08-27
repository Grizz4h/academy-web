/**
 * Canonical cosmetic ID aliases (Grundprogression Phase 3 rewire).
 * Ist shop_* IDs remain readable; unlock keys / grants use canonical IDs.
 */

export const COSMETIC_MIGRATION_PHASE3_ID = 'cosmetic_migration_phase3_grundprogression_v1'

/** Alias (Ist) → canonical */
export const CANONICAL_BY_ALIAS: Record<string, string> = {
  frame_shop_basic: 'frame_basic',
  banner_shop_soft_ice: 'banner_soft_ice',
  frame_shop_rare_trim: 'frame_rare_trim',
}

export const ALIASES_BY_CANONICAL: Record<string, readonly string[]> = {
  frame_basic: ['frame_shop_basic'],
  banner_soft_ice: ['banner_shop_soft_ice'],
  frame_rare_trim: ['frame_shop_rare_trim'],
}

export function canonicalCosmeticId(cosmeticId: string | null | undefined): string | null {
  if (!cosmeticId) return cosmeticId ?? null
  return CANONICAL_BY_ALIAS[cosmeticId] || cosmeticId
}

export function aliasIdsFor(cosmeticId: string | null | undefined): string[] {
  if (!cosmeticId) return []
  const canon = canonicalCosmeticId(cosmeticId) || cosmeticId
  const aliases = ALIASES_BY_CANONICAL[canon] || []
  return Array.from(new Set([canon, ...aliases]))
}

export function ownsCosmeticUnlock(
  unlocked: Record<string, unknown> | null | undefined,
  cosmeticId: string | null | undefined,
): boolean {
  if (!cosmeticId || !unlocked) return false
  return aliasIdsFor(cosmeticId).some((id) => Boolean(unlocked[id]))
}
