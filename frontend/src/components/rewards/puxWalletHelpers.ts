import { getCosmetic } from '../../features/progression/cosmetics/cosmeticCatalog'
import { isCosmeticOwned, selectPux, type ProgressionViewState } from '../../features/progression/selectors'
import { SHOP_LISTINGS } from '../../features/progression/shop/shopCatalog'
import type { PuxTransaction, UnlockHistoryEntry } from '../../features/progression/types'
import type { RewardState } from '../../features/rewards/types'

export type PuxActivityLine = {
  id: string
  label: string
  amount: number
  direction: 'in' | 'out'
  occurredAt: string
}

export function selectRecentPuxActivity(state: RewardState, limit = 5): PuxActivityLine[] {
  const lines: PuxActivityLine[] = []

  for (const entry of state.unlockHistory || []) {
    const line = historyEntryToActivity(entry)
    if (line) lines.push(line)
  }

  for (const tx of state.puxTransactions || []) {
    lines.push(transactionToActivity(tx))
  }

  return lines
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
    .slice(0, limit)
}

function historyEntryToActivity(entry: UnlockHistoryEntry): PuxActivityLine | null {
  if (entry.kind === 'shop') {
    const amount = Math.abs(entry.amountPux || 0)
    if (amount <= 0) return null
    return {
      id: `history:${entry.id}`,
      label: entry.title,
      amount,
      direction: 'out',
      occurredAt: entry.occurredAt,
    }
  }

  if (entry.kind !== 'pux' && !(entry.amountPux && entry.amountPux > 0)) return null

  const amount = Math.abs(entry.amountPux || 0)
  if (amount <= 0) return null

  return {
    id: `history:${entry.id}`,
    label: entry.title,
    amount,
    direction: 'in',
    occurredAt: entry.occurredAt,
  }
}

function transactionToActivity(tx: PuxTransaction): PuxActivityLine {
  return {
    id: `tx:${tx.id}`,
    label: tx.sourceType === 'pux_shop' ? 'Shop-Kauf' : tx.sourceType,
    amount: Math.abs(tx.amount),
    direction: tx.type === 'spend' ? 'out' : 'in',
    occurredAt: tx.occurredAt,
  }
}

export type NextShopTarget = {
  listingId: string
  name: string
  pricePux: number
  affordable: boolean
  missingPux: number
}

export function selectNextShopTarget(state: ProgressionViewState): NextShopTarget | null {
  const balance = selectPux(state)
  const unowned = SHOP_LISTINGS.filter((listing) => !isCosmeticOwned(state, listing.cosmeticId))
    .sort((a, b) => a.pricePux - b.pricePux)

  if (unowned.length === 0) return null

  const affordable = unowned.find((listing) => listing.pricePux <= balance)
  const target = affordable || unowned[0]
  const cosmetic = getCosmetic(target.cosmeticId)

  return {
    listingId: target.id,
    name: cosmetic?.name || target.cosmeticId,
    pricePux: target.pricePux,
    affordable: Boolean(affordable),
    missingPux: Math.max(0, target.pricePux - balance),
  }
}
