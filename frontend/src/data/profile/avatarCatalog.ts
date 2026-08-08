import type { ProfileAsset } from './types'

/**
 * Data-driven avatar pool.
 * Workflow: add file under /public/profile/avatars/ → add entry here.
 */
export const avatarCatalog: ProfileAsset[] = [
  {
    id: 'avatar_ice_01',
    label: 'Ice Dot',
    src: '/profile/avatars/avatar_ice_01.svg',
    category: 'abstract',
    tags: ['ice', 'minimal'],
  },
  {
    id: 'avatar_puck_01',
    label: 'Puck',
    src: '/profile/avatars/avatar_puck_01.svg',
    category: 'equipment',
    tags: ['puck'],
  },
  {
    id: 'avatar_crest_01',
    label: 'Crest',
    src: '/profile/avatars/avatar_crest_01.svg',
    category: 'identity',
    tags: ['crest'],
  },
  {
    id: 'avatar_chalk_01',
    label: 'Chalk Figure',
    src: '/profile/avatars/avatar_chalk_01.svg',
    category: 'chalk',
    tags: ['chalk', 'player'],
  },
  {
    id: 'avatar_net_01',
    label: 'Net Grid',
    src: '/profile/avatars/avatar_net_01.svg',
    category: 'rink',
    tags: ['net', 'crease'],
  },
]

export const DEFAULT_AVATAR_ID = 'avatar_ice_01'

export function getAvatarAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return avatarCatalog.find((item) => item.id === id)
}
