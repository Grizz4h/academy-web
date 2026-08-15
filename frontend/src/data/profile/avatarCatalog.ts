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
  {
    id: 'avatar_tape_01',
    label: 'Tape Roll',
    src: '/profile/avatars/avatar_tape_01.svg',
    category: 'equipment',
    tags: ['tape'],
    starter: false,
  },
  {
    id: 'avatar_blueline_01',
    label: 'Blue Line Mark',
    src: '/profile/avatars/avatar_blueline_01.svg',
    category: 'rink',
    tags: ['blue-line'],
    starter: false,
  },
  {
    id: 'avatar_slot_01',
    label: 'The Slot',
    src: '/profile/avatars/avatar_slot_01.svg',
    category: 'rink',
    tags: ['slot'],
    starter: false,
  },
  {
    id: 'avatar_goldpuck_01',
    label: 'Gold Puck',
    src: '/profile/avatars/avatar_goldpuck_01.svg',
    category: 'equipment',
    tags: ['puck', 'gold'],
    starter: false,
  },
  {
    id: 'avatar_aurora_01',
    label: 'Aurora Ice',
    src: '/profile/avatars/avatar_aurora_01.svg',
    category: 'abstract',
    tags: ['aurora'],
    starter: false,
  },
  {
    id: 'avatar_night_circuit',
    label: 'Circuit Face',
    src: '/profile/avatars/avatar_night_circuit.svg',
    category: 'abstract',
    tags: ['cyberpunk', 'night-circuit'],
    starter: false,
  },
]

export const DEFAULT_AVATAR_ID = 'avatar_ice_01'

export function getAvatarAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return avatarCatalog.find((item) => item.id === id)
}
