import { withProfileAssetCacheBust } from './profileAssetUrl'
import type { ProfileAsset } from './types'

export const coinCatalog: ProfileAsset[] = [
  { id: 'coin_defensive_zone', label: 'Defensive Zone Coin', src: '/profile/coins/coin_defensive_zone.svg', category: 'coin', tags: ['defense'], starter: false },
  { id: 'coin_neutral_zone', label: 'Neutral Zone Coin', src: '/profile/coins/coin_neutral_zone.svg', category: 'coin', tags: ['neutral'], starter: false },
  { id: 'coin_offensive_zone', label: 'Offensive Zone Coin', src: '/profile/coins/coin_offensive_zone.svg', category: 'coin', tags: ['offense'], starter: false },
  { id: 'coin_powerplay', label: 'Powerplay Coin', src: '/profile/coins/coin_powerplay.svg', category: 'coin', tags: ['special-teams'], starter: false },
  { id: 'coin_penalty_kill', label: 'Penalty Kill Coin', src: '/profile/coins/coin_penalty_kill.svg', category: 'coin', tags: ['special-teams'], starter: false },
  { id: 'coin_entries_clears', label: 'Entries & Clears Coin', src: '/profile/coins/coin_entries_clears.svg', category: 'coin', tags: ['blue-line'], starter: false },
]

export function getCoinAsset(id: string | null | undefined): ProfileAsset | undefined {
  if (!id) return undefined
  const item = coinCatalog.find((entry) => entry.id === id)
  if (!item) return undefined
  return { ...item, src: withProfileAssetCacheBust(item.src) }
}
