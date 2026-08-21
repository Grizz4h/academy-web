import type { ProfileAsset } from './types'

export const MAX_PROFILE_STICKERS = 3

export const stickerCatalog: ProfileAsset[] = [
  { id: 'sticker_slot', label: 'Slot Sticker', src: '/profile/stickers/sticker_slot.svg', category: 'sticker', tags: ['slot'], starter: false },
  { id: 'sticker_entry', label: 'Entry Sticker', src: '/profile/stickers/sticker_entry.svg', category: 'sticker', tags: ['entry'], starter: false },
  { id: 'sticker_exit', label: 'Exit Sticker', src: '/profile/stickers/sticker_exit.svg', category: 'sticker', tags: ['exit'], starter: false },
  { id: 'sticker_tape', label: 'Tape Sticker', src: '/profile/stickers/sticker_tape.svg', category: 'sticker', tags: ['tape'], starter: false },
  { id: 'sticker_watch_the_center', label: 'Watch The Center', src: '/profile/stickers/sticker_watch_the_center.svg', category: 'sticker', tags: ['neutral'], starter: false },
  { id: 'sticker_matchday_first_read', label: 'First Read', src: '/profile/stickers/sticker_matchday_first_read.svg', category: 'sticker', tags: ['matchday'], starter: false },
  { id: 'sticker_fresh_sheet', label: 'Fresh Sheet', src: '/profile/stickers/sticker_fresh_sheet.svg', category: 'sticker', tags: ['zamboni', 'ice'], starter: false },
]

export function getStickerAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  return stickerCatalog.find((item) => item.id === id)
}

export function toggleProfileSticker(current: string[] | null | undefined, stickerId: string): string[] {
  const list = Array.isArray(current) ? current.filter(Boolean) : []
  if (list.includes(stickerId)) return list.filter((id) => id !== stickerId)
  return [...list, stickerId].slice(-MAX_PROFILE_STICKERS)
}
