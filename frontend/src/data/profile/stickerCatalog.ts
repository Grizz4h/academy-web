import { withProfileAssetCacheBust } from './profileAssetUrl'
import type { ProfileAsset } from './types'

export const MAX_PROFILE_STICKERS = 3

export const stickerCatalog: ProfileAsset[] = [
  { id: 'sticker_high_slot', label: 'High Slot', src: '/profile/stickers/sticker_high_slot.svg', category: 'sticker', tags: ['slot'], starter: false },
  { id: 'sticker_entry', label: 'Entry Sticker', src: '/profile/stickers/sticker_entry.svg', category: 'sticker', tags: ['entry'], starter: false },
  { id: 'sticker_exit', label: 'Exit Sticker', src: '/profile/stickers/sticker_exit.svg', category: 'sticker', tags: ['exit'], starter: false },
  { id: 'sticker_tape', label: 'Tape Sticker', src: '/profile/stickers/sticker_tape.svg', category: 'sticker', tags: ['tape'], starter: false },
  { id: 'sticker_watch_the_center', label: 'Watch The Center', src: '/profile/stickers/sticker_watch_the_center.svg', category: 'sticker', tags: ['neutral'], starter: false },
  { id: 'sticker_matchday_first_read', label: 'First Read', src: '/profile/stickers/sticker_matchday_first_read.svg', category: 'sticker', tags: ['matchday'], starter: false },
  { id: 'sticker_league_hopper', label: 'League Hopper', src: '/profile/stickers/sticker_league_hopper.svg', category: 'sticker', tags: ['league'], starter: false },
  { id: 'sticker_getting_warm', label: 'Getting Warm', src: '/profile/stickers/sticker_getting_warm.svg', category: 'sticker', tags: ['activity'], starter: false },
  { id: 'sticker_five_star', label: 'Five Star', src: '/profile/stickers/sticker_five_star.svg', category: 'sticker', tags: ['rating'], starter: false },
  { id: 'sticker_paint_it_black', label: 'Paint It Black', src: '/profile/stickers/sticker_paint_it_black.svg', category: 'sticker', tags: ['paint'], starter: false },
  { id: 'sticker_opening_faceoff_2627', label: 'Opening Faceoff 26/27', src: '/profile/stickers/sticker_opening_faceoff_2627.svg', category: 'sticker', tags: ['season', 'opening-faceoff'], starter: false },
]

export function getStickerAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  const item = stickerCatalog.find((entry) => entry.id === id)
  if (!item) return undefined
  return { ...item, src: withProfileAssetCacheBust(item.src) }
}

export function toggleProfileSticker(current: string[] | null | undefined, stickerId: string): string[] {
  const list = Array.isArray(current) ? current.filter(Boolean) : []
  if (list.includes(stickerId)) return list.filter((id) => id !== stickerId)
  return [...list, stickerId].slice(-MAX_PROFILE_STICKERS)
}
