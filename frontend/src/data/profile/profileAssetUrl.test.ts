import assert from 'node:assert/strict'
import { withProfileAssetCacheBust, PROFILE_ASSET_CACHE_BUST } from './profileAssetUrl.ts'

assert.equal(
  withProfileAssetCacheBust('/profile/avatars/avatar_chalk_01.svg'),
  `/profile/avatars/avatar_chalk_01.svg?v=${PROFILE_ASSET_CACHE_BUST}`,
)
assert.equal(
  withProfileAssetCacheBust('/profile/emblems/emblem_numerical.svg?v=2'),
  '/profile/emblems/emblem_numerical.svg?v=2',
)
assert.equal(withProfileAssetCacheBust('data:image/svg+xml,x'), 'data:image/svg+xml,x')
console.log('profileAssetUrl ok')
