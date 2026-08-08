import type { ProfileAsset } from './types'

/**
 * Data-driven banner pool.
 * Workflow: add file under /public/profile/banners/ → add entry here.
 */
export const bannerCatalog: ProfileAsset[] = [
  {
    id: 'banner_neutral_01',
    label: 'Neutral Zone',
    src: '/profile/banners/banner_neutral_01.svg',
    category: 'rink',
    tags: ['neutral', 'rink'],
  },
  {
    id: 'banner_blue_line_01',
    label: 'Blue Line',
    src: '/profile/banners/banner_blue_line_01.svg',
    category: 'rink',
    tags: ['blue-line'],
  },
  {
    id: 'banner_chalk_01',
    label: 'Chalk Board',
    src: '/profile/banners/banner_chalk_01.svg',
    category: 'chalk',
    tags: ['chalk', 'tactics'],
  },
  {
    id: 'banner_crease_01',
    label: 'Crease View',
    src: '/profile/banners/banner_crease_01.svg',
    category: 'rink',
    tags: ['crease', 'goal'],
  },
]

export const DEFAULT_BANNER_ID = 'banner_neutral_01'

export function getBannerAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return bannerCatalog.find((item) => item.id === id)
}
