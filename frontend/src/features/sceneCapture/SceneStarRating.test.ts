import assert from 'node:assert/strict'
import {
  resolveDisplayedStarRating,
  resolveStarAppearance,
} from './SceneStarRating.tsx'

// Idle: saved fills only
assert.equal(resolveStarAppearance(1, 1, null), 'filled')
assert.equal(resolveStarAppearance(2, 1, null), 'empty')
assert.equal(resolveStarAppearance(5, 5, null), 'filled')
assert.equal(resolveStarAppearance(1, 0, null), 'empty')

// Preview: outline for 1..N, hide saved fills
assert.equal(resolveStarAppearance(1, 1, 5), 'outline')
assert.equal(resolveStarAppearance(5, 1, 5), 'outline')
assert.equal(resolveStarAppearance(1, 5, 2), 'outline')
assert.equal(resolveStarAppearance(2, 5, 2), 'outline')
assert.equal(resolveStarAppearance(3, 5, 2), 'empty')
assert.equal(resolveStarAppearance(5, 5, 2), 'empty')
assert.equal(resolveStarAppearance(4, 2, 5), 'outline')

// Count helper still reflects preview target
assert.equal(resolveDisplayedStarRating(1, null), 1)
assert.equal(resolveDisplayedStarRating(5, null), 5)
assert.equal(resolveDisplayedStarRating(1, 5), 5)
assert.equal(resolveDisplayedStarRating(5, 2), 2)

console.log('SceneStarRating.test.ts OK')
