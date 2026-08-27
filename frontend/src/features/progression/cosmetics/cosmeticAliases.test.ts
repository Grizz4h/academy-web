/**
 * Smoke: canonical alias map for Grundprogression rewire.
 * Run: npx --yes tsx src/features/progression/cosmetics/cosmeticAliases.test.ts
 */
import assert from 'node:assert/strict'
import {
  aliasIdsFor,
  canonicalCosmeticId,
  ownsCosmeticUnlock,
} from './cosmeticAliases.ts'
import { getCosmetic } from './cosmeticCatalog.ts'
import { isCosmeticOwned } from '../selectors.ts'

assert.equal(canonicalCosmeticId('frame_shop_basic'), 'frame_basic')
assert.equal(canonicalCosmeticId('banner_shop_soft_ice'), 'banner_soft_ice')
assert.equal(canonicalCosmeticId('frame_shop_rare_trim'), 'frame_rare_trim')
assert.equal(canonicalCosmeticId('frame_basic'), 'frame_basic')

assert.ok(aliasIdsFor('frame_basic').includes('frame_shop_basic'))
assert.ok(getCosmetic('frame_shop_basic')?.id === 'frame_basic')
assert.ok(getCosmetic('banner_shop_soft_ice')?.id === 'banner_soft_ice')
assert.ok(getCosmetic('frame_rare_trim')?.type === 'frame')

const unlocked = {
  frame_basic: { cosmeticId: 'frame_basic', unlockedAt: 't0' },
}
assert.equal(ownsCosmeticUnlock(unlocked, 'frame_shop_basic'), true)
assert.equal(ownsCosmeticUnlock(unlocked, 'frame_basic'), true)
assert.equal(
  isCosmeticOwned(
    {
      xp: 0,
      unlockedAchievements: {},
      unlockedCosmetics: unlocked as any,
      activityLog: [],
      unlockHistory: [],
    },
    'frame_shop_basic',
  ),
  true,
)

console.log('cosmeticAliases.test.ts: ok')
