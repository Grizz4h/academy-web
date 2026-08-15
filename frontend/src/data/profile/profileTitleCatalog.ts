import type { ProfileTitleAsset } from './types'

/**
 * Data-driven profile titles. No gameplay logic attached to individual titles.
 */
export const profileTitleCatalog: ProfileTitleAsset[] = [
  { id: 'rink_rat', label: 'Rink Rat', description: 'Immer irgendwo am Glas.' },
  { id: 'slot_watcher', label: 'Slot Watcher', description: 'Augen auf die gefährlichen Räume.' },
  { id: 'puck_detective', label: 'Puck Detective', description: 'Folgt dem Puck und den Optionen dahinter.' },
  { id: 'tape_to_tape', label: 'Tape-to-Tape', description: 'Saubere Verbindungen zählen.' },
  { id: 'blue_line_student', label: 'Blue Line Student', description: 'Lernt an der blauen Linie.' },
  { id: 'five_man_unit', label: 'Five-Man Unit', description: 'Denkt in Fünferstrukturen.' },
  { id: 'neutral_zone_tourist', label: 'Neutral Zone Tourist', description: 'Unterwegs zwischen den Linien.' },
  { id: 'hockey_observer', label: 'Hockey Observer', description: 'Beobachtet, bevor er urteilt.' },
]

export const DEFAULT_PROFILE_TITLE_ID = 'rink_rat'

export function getProfileTitle(id: string | null | undefined): ProfileTitleAsset | undefined {
  if (!id) return undefined
  return profileTitleCatalog.find((item) => item.id === id)
}

/** Catalog label, otherwise the stored title string if it is already display text. */
export function resolveProfileTitleLabel(raw: string | null | undefined): string | null {
  if (!raw) return null
  const catalog = getProfileTitle(raw)
  if (catalog) return catalog.label
  if (raw.startsWith('title_catalog_')) {
    return getProfileTitle(raw.slice('title_catalog_'.length))?.label || null
  }
  if (/^[a-z0-9_]+$/.test(raw)) {
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
  return raw
}
