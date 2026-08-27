import type { ShopListing } from '../types'

/**
 * Evergreen Pux Shop — intentionally empty for now.
 * Progression/achievements grant cosmetics first; shop filled separately later.
 */
export const SHOP_LISTINGS: ShopListing[] = []

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
