/** Cosmetics removed from product picker — ownership kept server-side (deprecated_hidden). */
export const REMOVED_COSMETIC_IDS = [
  'avatar_zamboni',
  'banner_zamboni_shift',
  'banner_property_of_the_slot',
  'emblem_zamboni',
  'emblem_slot_resident',
  'sticker_fresh_sheet',
  'sticker_slot',
] as const

export type RemovedCosmeticId = (typeof REMOVED_COSMETIC_IDS)[number]

export const REMOVED_COSMETIC_ID_SET = new Set<string>(REMOVED_COSMETIC_IDS)

/** Minimal starter bundle for new accounts (Soll — no frame). */
export const STARTER_COSMETIC_IDS = [
  'avatar_chalk_01',
  'banner_neutral_01',
  'emblem_puck_01',
  'title_catalog_prospect',
  'tagline_starter',
] as const

export const STARTER_COSMETIC_ID_SET = new Set<string>(STARTER_COSMETIC_IDS)

export const STARTER_DEFAULTS = {
  avatarId: 'avatar_chalk_01',
  bannerId: 'banner_neutral_01',
  emblemId: 'emblem_puck_01',
  frameId: null as string | null,
  profileTitleId: 'prospect',
  profileTitleCosmeticId: 'title_catalog_prospect',
  taglineId: 'tagline_starter',
} as const

export function isRemovedCosmeticId(id: string | null | undefined): boolean {
  return Boolean(id && REMOVED_COSMETIC_ID_SET.has(id))
}

export function purgeRemovedCosmeticMap<T>(
  map: Record<string, T> | null | undefined,
): Record<string, T> {
  if (!map || typeof map !== 'object') return {}
  const next: Record<string, T> = {}
  for (const [id, value] of Object.entries(map)) {
    if (!REMOVED_COSMETIC_ID_SET.has(id)) next[id] = value
  }
  return next
}

export function purgeRemovedIdList(ids: string[] | null | undefined): string[] {
  if (!Array.isArray(ids)) return []
  return ids.filter((id) => id && !REMOVED_COSMETIC_ID_SET.has(id))
}
