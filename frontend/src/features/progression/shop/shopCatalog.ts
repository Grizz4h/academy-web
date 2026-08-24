import type { ShopListing } from '../types'

/**
 * Evergreen Pux Shop — no FOMO timers.
 * Achievement / mastery / secret exclusives stay out of this list.
 */
export const SHOP_LISTINGS: ShopListing[] = [
  { id: 'shop_title_film_room', cosmeticId: 'title_shop_film_room', pricePux: 150, availability: 'evergreen', category: 'Titles' },
  { id: 'shop_title_bench_boss', cosmeticId: 'title_shop_bench_boss', pricePux: 200, availability: 'evergreen', category: 'Titles' },
  { id: 'shop_title_glass_leaner', cosmeticId: 'title_shop_glass_leaner', pricePux: 180, availability: 'evergreen', category: 'Titles' },
  { id: 'shop_tagline_pause_culture', cosmeticId: 'tagline_shop_pause_culture', pricePux: 120, availability: 'evergreen', category: 'Taglines' },
  { id: 'shop_tagline_read_the_ice', cosmeticId: 'tagline_shop_read_the_ice', pricePux: 140, availability: 'evergreen', category: 'Taglines' },
  { id: 'shop_tagline_watch_center', cosmeticId: 'sticker_watch_the_center', pricePux: 200, availability: 'evergreen', category: 'Stickers' },
  { id: 'shop_emblem_simple_puck', cosmeticId: 'emblem_shop_simple_crest', pricePux: 250, availability: 'evergreen', category: 'Emblems' },
  { id: 'shop_emblem_chalk', cosmeticId: 'emblem_shop_chalk', pricePux: 280, availability: 'evergreen', category: 'Emblems' },
  { id: 'shop_banner_soft_ice', cosmeticId: 'banner_shop_soft_ice', pricePux: 350, availability: 'evergreen', category: 'Banners' },
  { id: 'shop_banner_night_rink', cosmeticId: 'banner_shop_night_rink', pricePux: 400, availability: 'evergreen', category: 'Banners' },
  { id: 'shop_avatar_tape', cosmeticId: 'avatar_tape_01', pricePux: 320, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_avatar_blueline', cosmeticId: 'avatar_blueline_01', pricePux: 640, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_avatar_slot', cosmeticId: 'avatar_slot_01', pricePux: 980, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_avatar_goldpuck', cosmeticId: 'avatar_goldpuck_01', pricePux: 1600, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_avatar_aurora', cosmeticId: 'avatar_aurora_01', pricePux: 2400, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_title_night_circuit', cosmeticId: 'title_night_circuit', pricePux: 1800, availability: 'evergreen', category: 'Titles' },
  { id: 'shop_avatar_night_circuit', cosmeticId: 'avatar_night_circuit', pricePux: 2500, availability: 'evergreen', category: 'Avatare' },
  { id: 'shop_banner_night_circuit', cosmeticId: 'banner_night_circuit', pricePux: 2200, availability: 'evergreen', category: 'Banners' },
  { id: 'shop_emblem_night_circuit', cosmeticId: 'emblem_night_circuit', pricePux: 1900, availability: 'evergreen', category: 'Emblems' },
  { id: 'shop_frame_basic', cosmeticId: 'frame_shop_basic', pricePux: 220, availability: 'evergreen', category: 'Frames' },
  { id: 'shop_frame_rare_trim', cosmeticId: 'frame_shop_rare_trim', pricePux: 550, availability: 'evergreen', category: 'Frames' },
  { id: 'shop_frame_ice_legend', cosmeticId: 'frame_ice_legend', pricePux: 1400, availability: 'evergreen', category: 'Frames' },
  { id: 'shop_frame_night_circuit', cosmeticId: 'frame_night_circuit', pricePux: 2600, availability: 'evergreen', category: 'Frames' },
  { id: 'shop_sticker_slot', cosmeticId: 'sticker_slot', pricePux: 150, availability: 'evergreen', category: 'Stickers' },
  { id: 'shop_sticker_tape', cosmeticId: 'sticker_tape', pricePux: 100, availability: 'evergreen', category: 'Stickers' },
  { id: 'shop_sticker_entry', cosmeticId: 'sticker_entry', pricePux: 160, availability: 'evergreen', category: 'Stickers' },
  { id: 'shop_sticker_exit', cosmeticId: 'sticker_exit', pricePux: 160, availability: 'evergreen', category: 'Stickers' },
  { id: 'shop_banner_nz_goblin', cosmeticId: 'banner_neutral_zone_goblin_shop', pricePux: 300, availability: 'evergreen', category: 'Banners' },
  { id: 'shop_tagline_structure', cosmeticId: 'tagline_shop_structure_lite', pricePux: 110, availability: 'evergreen', category: 'Taglines' },
  { id: 'shop_title_observer', cosmeticId: 'title_shop_quiet_observer', pricePux: 170, availability: 'evergreen', category: 'Titles' },
]

export const SHOP_BY_ID: Record<string, ShopListing> = Object.fromEntries(
  SHOP_LISTINGS.map((item) => [item.id, item]),
)

export const SHOP_BY_COSMETIC_ID: Record<string, ShopListing> = Object.fromEntries(
  SHOP_LISTINGS.map((item) => [item.cosmeticId, item]),
)

export function getShopListing(id: string): ShopListing | undefined {
  return SHOP_BY_ID[id]
}

export function shopPurchaseEventId(listingId: string): string {
  return `pux_shop_purchase:${listingId}`
}
