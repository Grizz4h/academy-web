import assert from 'node:assert/strict'
import { resolveDisplayedStarRating } from './SceneStarRating.tsx'

assert.equal(resolveDisplayedStarRating(1, null), 1)
assert.equal(resolveDisplayedStarRating(5, null), 5)
assert.equal(resolveDisplayedStarRating(1, 5), 5)
assert.equal(resolveDisplayedStarRating(5, 2), 2)
assert.equal(resolveDisplayedStarRating(2, 5), 5)
assert.equal(resolveDisplayedStarRating(0, 4), 4)
assert.equal(resolveDisplayedStarRating(3, null), 3)

console.log('SceneStarRating.test.ts OK')
