import type { ProfileAsset } from './types'

/**
 * Data-driven emblem pool.
 * Workflow: add file under /public/profile/emblems/ → add entry here.
 * Rarity variants of the same motif need their own SVG — do not alias a starter file.
 * Custom emblems from a future layer editor use emblem.type === "custom".
 */
export const emblemCatalog: ProfileAsset[] = [
  {
    id: 'emblem_puck_01',
    label: 'Puck',
    src: '/profile/emblems/emblem_puck_01.svg',
    category: 'equipment',
    tags: ['puck'],
  },
  {
    id: 'emblem_blue_line_01',
    label: 'Blue Line',
    src: '/profile/emblems/emblem_blue_line_01.svg',
    category: 'rink',
    tags: ['blue-line'],
  },
  {
    id: 'emblem_arrow_01',
    label: 'Direction Arrow',
    src: '/profile/emblems/emblem_arrow_01.svg',
    category: 'tactics',
    tags: ['arrow', 'steering'],
  },
  {
    id: 'emblem_rink_01',
    label: 'Rink Outline',
    src: '/profile/emblems/emblem_rink_01.svg',
    category: 'rink',
    tags: ['rink'],
  },
  {
    id: 'emblem_crease_01',
    label: 'Crease',
    src: '/profile/emblems/emblem_crease_01.svg',
    category: 'rink',
    tags: ['crease'],
  },
  {
    id: 'emblem_slot_resident',
    label: 'Slot Resident',
    src: '/profile/emblems/emblem_slot_resident.svg',
    category: 'rink',
    tags: ['crease', 'slot'],
    starter: false,
  },
  {
    id: 'emblem_blue_line_inspector',
    label: 'Blue Line Inspector',
    src: '/profile/emblems/emblem_blue_line_inspector.svg',
    category: 'rink',
    tags: ['blue-line'],
    starter: false,
  },
  {
    id: 'emblem_level_20',
    label: 'Level 20 Crest',
    src: '/profile/emblems/emblem_level_20.svg',
    category: 'identity',
    tags: ['blue-line', 'crest'],
    starter: false,
  },
  {
    id: 'emblem_arrow_unlock',
    label: 'Follow The Arrow',
    src: '/profile/emblems/emblem_arrow_unlock.svg',
    category: 'tactics',
    tags: ['arrow', 'steering'],
    starter: false,
  },
  {
    id: 'emblem_shop_chalk',
    label: 'Chalk Mark',
    src: '/profile/emblems/emblem_shop_chalk.svg',
    category: 'chalk',
    tags: ['chalk', 'tactics'],
    starter: false,
  },
  {
    id: 'emblem_shop_simple_crest',
    label: 'Simple Crest',
    src: '/profile/emblems/emblem_shop_simple_crest.svg',
    category: 'identity',
    tags: ['rink', 'crest'],
    starter: false,
  },
  {
    id: 'emblem_goblin',
    label: 'Goblin Emblem',
    src: '/profile/emblems/emblem_goblin.svg',
    category: 'equipment',
    tags: ['puck', 'goblin'],
    starter: false,
  },
  {
    id: 'emblem_night_circuit',
    label: 'Grid Crest',
    src: '/profile/emblems/emblem_night_circuit.svg',
    category: 'abstract',
    tags: ['cyberpunk', 'night-circuit'],
    starter: false,
  },
]

export const DEFAULT_EMBLEM_ID = 'emblem_puck_01'

export function getEmblemAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return emblemCatalog.find((item) => item.id === id)
}
