import { getCosmetic, isStarterCosmetic } from '../cosmetics/cosmeticCatalog'
import { getShopListing, shopPurchaseEventId } from './shopCatalog'
import type { CosmeticUnlock, PuxTransaction, UnlockHistoryEntry } from '../types'

export type ShopPurchaseInput = {
  listingId: string
  balancePux: number
  unlockedCosmetics: Record<string, CosmeticUnlock>
  processedEvents: Record<string, unknown>
  occurredAt?: string
}

export type ShopPurchaseResult =
  | {
      ok: true
      listingId: string
      cosmeticId: string
      pricePux: number
      balanceAfter: number
      unlock: CosmeticUnlock
      transaction: PuxTransaction
      history: UnlockHistoryEntry
      eventId: string
    }
  | {
      ok: false
      reason: 'not_found' | 'already_owned' | 'already_purchased' | 'insufficient_pux' | 'starter'
    }

export function evaluateShopPurchase(input: ShopPurchaseInput): ShopPurchaseResult {
  const listing = getShopListing(input.listingId)
  if (!listing) return { ok: false, reason: 'not_found' }

  const eventId = shopPurchaseEventId(listing.id)
  if (input.processedEvents[eventId]) return { ok: false, reason: 'already_purchased' }

  if (isStarterCosmetic(listing.cosmeticId) || input.unlockedCosmetics[listing.cosmeticId]) {
    return { ok: false, reason: 'already_owned' }
  }

  const def = getCosmetic(listing.cosmeticId)
  if (!def) return { ok: false, reason: 'not_found' }
  if (def.origin.type === 'starter') return { ok: false, reason: 'starter' }

  if (input.balancePux < listing.pricePux) return { ok: false, reason: 'insufficient_pux' }

  const occurredAt = input.occurredAt || new Date().toISOString()
  const balanceAfter = input.balancePux - listing.pricePux

  const unlock: CosmeticUnlock = {
    cosmeticId: listing.cosmeticId,
    unlockedAt: occurredAt,
    sourceType: 'pux_shop',
    sourceId: listing.id,
    earnKind: 'purchased',
    // seenAt intentionally unset → NEU
  }

  const transaction: PuxTransaction = {
    id: `tx:spend:${eventId}`,
    type: 'spend',
    amount: listing.pricePux,
    sourceType: 'pux_shop',
    sourceId: listing.id,
    occurredAt,
    balanceAfter,
  }

  const history: UnlockHistoryEntry = {
    id: `shop:${listing.id}:${occurredAt}`,
    kind: 'shop',
    title: def.name,
    description: `Gekauft für ${listing.pricePux} Pux`,
    occurredAt,
    sourceEventId: eventId,
    cosmeticId: listing.cosmeticId,
    amountPux: listing.pricePux,
  }

  return {
    ok: true,
    listingId: listing.id,
    cosmeticId: listing.cosmeticId,
    pricePux: listing.pricePux,
    balanceAfter,
    unlock,
    transaction,
    history,
    eventId,
  }
}
