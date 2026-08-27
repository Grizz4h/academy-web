import type { ProfileAsset } from './types'

/**
 * Data-driven banner pool.
 * Workflow: add file under /public/profile/banners/ → add entry here.
 * Rarity variants of the same motif need their own SVG — do not alias a starter file.
 */
export const bannerCatalog: ProfileAsset[] = [
  {
    id: 'banner_neutral_01',
    label: 'Neutral Zone',
    src: '/profile/banners/banner_neutral_01.svg',
    category: 'rink',
    tags: ['neutral', 'rink'],
    starter: true,
  },
  {
    id: 'banner_blue_line_01',
    label: 'Blue Line',
    src: '/profile/banners/banner_blue_line_01.svg',
    category: 'rink',
    tags: ['blue-line'],
    starter: false,
  },
  {
    id: 'banner_chalk_01',
    label: 'Chalk Board',
    src: '/profile/banners/banner_chalk_01.svg',
    category: 'chalk',
    tags: ['chalk', 'tactics'],
    starter: false,
  },
  {
    id: 'banner_crease_01',
    label: 'Crease View',
    src: '/profile/banners/banner_crease_01.svg',
    category: 'rink',
    tags: ['crease', 'goal'],
    starter: false,
  },
  {
    id: 'banner_high_slot',
    label: 'High Slot',
    src: '/profile/banners/banner_high_slot.svg',
    category: 'rink',
    tags: ['crease', 'slot'],
    starter: false,
  },
  {
    id: 'banner_scene_century',
    label: 'Scene Century',
    src: '/profile/banners/banner_scene_century.svg',
    category: 'abstract',
    tags: ['scenes', 'filmstrip'],
    starter: false,
  },
  {
    id: 'banner_ten_team_tour',
    label: 'Ten Team Tour',
    src: '/profile/banners/banner_ten_team_tour.svg',
    category: 'rink',
    tags: ['teams', 'breadth'],
    starter: false,
  },
  {
    id: 'banner_level_10',
    label: 'Level 10 Blue Line',
    src: '/profile/banners/banner_level_10.svg',
    category: 'rink',
    tags: ['blue-line'],
    starter: false,
  },
  {
    id: 'banner_blue_line_wizard',
    label: 'Blue Line Wizard',
    src: '/profile/banners/banner_blue_line_wizard.svg',
    category: 'rink',
    tags: ['blue-line'],
    starter: false,
  },
  {
    id: 'banner_neutral_zone_goblin_shop',
    label: 'Neutral Zone Goblin',
    src: '/profile/banners/banner_neutral_zone_goblin_shop.svg',
    category: 'rink',
    tags: ['neutral', 'goblin'],
    starter: false,
  },
  {
    id: 'banner_soft_ice',
    label: 'Soft Ice',
    src: '/profile/banners/banner_shop_soft_ice.svg',
    category: 'rink',
    tags: ['neutral', 'ice'],
    starter: false,
  },
  {
    id: 'banner_shop_night_rink',
    label: 'Night Rink',
    src: '/profile/banners/banner_shop_night_rink.svg',
    category: 'rink',
    tags: ['rink', 'night'],
    starter: false,
  },
  {
    id: 'banner_neutral_zone_goblin_legend',
    label: 'Neutral Zone Goblin (Legendary)',
    src: '/profile/banners/banner_neutral_zone_goblin_legend.svg',
    category: 'rink',
    tags: ['neutral', 'goblin'],
    starter: false,
  },
  {
    id: 'banner_night_circuit',
    label: 'Neon District',
    src: '/profile/banners/banner_night_circuit.svg',
    category: 'abstract',
    tags: ['cyberpunk', 'night-circuit'],
    starter: false,
  },
]

export const DEFAULT_BANNER_ID = 'banner_neutral_01'

export function getBannerAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return bannerCatalog.find((item) => item.id === id)
}
