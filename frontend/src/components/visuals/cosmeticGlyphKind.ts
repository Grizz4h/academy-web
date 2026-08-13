import type { CosmeticType } from '../../features/progression/types'

export type CosmeticGlyphKind =
  | 'emblem'
  | 'banner'
  | 'avatar'
  | 'frame'
  | 'title'
  | 'tagline'
  | 'sticker'
  | 'masteryCoin'
  | 'stick'
  | 'puck'
  | 'card'
  | 'rink'
  | 'generic'

export function resolveCosmeticGlyphKind(type: CosmeticType | string): CosmeticGlyphKind {
  switch (type) {
    case 'emblem':
    case 'banner':
    case 'avatar':
    case 'frame':
    case 'title':
    case 'tagline':
    case 'sticker':
    case 'masteryCoin':
    case 'card':
      return type
    case 'stickModel':
    case 'stickSkin':
      return 'stick'
    case 'puckModel':
    case 'puckSkin':
      return 'puck'
    case 'rinkSkin':
    case 'markerSkin':
    case 'drawingSkin':
      return 'rink'
    case 'character':
      return 'avatar'
    case 'nameplate':
    case 'jerseyNumberStyle':
      return 'title'
    case 'profileEffect':
    case 'profileBackground':
      return 'banner'
    default:
      return 'generic'
  }
}
