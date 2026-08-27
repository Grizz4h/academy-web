/**
 * Phase-2 shop / collection / mastery smoke tests.
 * Run: npx --yes tsx src/features/progression/phase2.test.ts
 */
import { evaluateShopPurchase } from './shop/shopEngine'
import { evaluateCollectionCompletions } from './collections/collectionEngine'
import { collectionCompletionEventId } from './collections/collectionCatalog'
import { isStarterCosmetic } from './cosmetics/cosmeticCatalog'
import { evaluateMasteryGrants } from './mastery/masteryEngine'
import type { Session } from '../../api'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

// Shop insufficient funds
{
  const result = evaluateShopPurchase({
    listingId: 'shop_title_film_room',
    balancePux: 10,
    unlockedCosmetics: {},
    processedEvents: {},
  })
  assert(result.ok === false && result.reason === 'insufficient_pux', 'insufficient pux')
}

// Shop success + idempotency
{
  const first = evaluateShopPurchase({
    listingId: 'shop_sticker_tape',
    balancePux: 500,
    unlockedCosmetics: {},
    processedEvents: {},
  })
  assert(first.ok === true, 'shop buy ok')
  if (first.ok) {
    assert(first.balanceAfter === 400, 'balance after')
    assert(first.unlock.earnKind === 'purchased', 'purchased earnKind')
    assert(!first.unlock.seenAt, 'new unseen')
    const second = evaluateShopPurchase({
      listingId: 'shop_sticker_tape',
      balancePux: first.balanceAfter,
      unlockedCosmetics: { [first.cosmeticId]: first.unlock },
      processedEvents: { [first.eventId]: true },
    })
    assert(second.ok === false, 'shop idempotent')
  }
}

// Collection completion once
{
  const owned = {
    title_slot_watcher: { cosmeticId: 'title_slot_watcher', unlockedAt: 't', sourceType: 'x' },
    emblem_high_slot: { cosmeticId: 'emblem_high_slot', unlockedAt: 't', sourceType: 'x' },
    tagline_no_slot: { cosmeticId: 'tagline_no_slot', unlockedAt: 't', sourceType: 'x' },
    frame_slot: { cosmeticId: 'frame_slot', unlockedAt: 't', sourceType: 'x' },
    sticker_high_slot: { cosmeticId: 'sticker_high_slot', unlockedAt: 't', sourceType: 'x' },
  }
  const first = evaluateCollectionCompletions({
    unlockedCosmetics: owned,
    processedEvents: {},
    starterOwned: isStarterCosmetic,
  })
  assert(first.completedCollections?.includes('the_slot') === true, 'slot collection complete')
  assert(first.unlockedCosmetics.some((c) => c.cosmeticId === 'banner_high_slot'), 'completion banner')
  const eventId = collectionCompletionEventId('the_slot')
  const second = evaluateCollectionCompletions({
    unlockedCosmetics: {
      ...owned,
      ...Object.fromEntries(first.unlockedCosmetics.map((c) => [c.cosmeticId, c])),
    },
    processedEvents: { [eventId]: true },
    starterOwned: isStarterCosmetic,
  })
  assert((second.completedCollections || []).length === 0, 'collection reward once')
}

// Dummy sessions do not count for mastery
{
  const sessions = [
    {
      id: 'd1',
      user: 't',
      module_id: 'C2_D1',
      drill_id: 'C2_D1',
      goal: '',
      confidence: 1,
      state: 'COMPLETED',
      created_at: '2026-01-01T00:00:00.000Z',
      drills: [],
      progress: { current_drill_index: 0, completed_drills: [] },
      checkins: [],
      is_dummy: true,
    },
  ] as Session[]
  const result = evaluateMasteryGrants({
    sessions,
    trackDrills: { C2: ['C2_D1', 'C2_D2'] },
    processedEvents: {},
    unlockedCosmetics: {},
  })
  assert(result.processedEventIds.length === 0, 'dummy mastery ignored')
}

console.log('phase2.test.ts: all assertions passed')
