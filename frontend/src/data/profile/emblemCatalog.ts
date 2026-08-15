import type { ProfileAsset } from './types'

/**
 * Data-driven emblem pool.
 * Workflow: add file under /public/profile/emblems/ → add entry here.
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
