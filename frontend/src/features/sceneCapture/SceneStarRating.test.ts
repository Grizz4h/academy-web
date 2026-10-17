import assert from 'node:assert/strict'
import {
  resolveDisplayedStarRating,
  resolveEffectiveHoverRating,
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

// RT-S-013: after click, suppress preview for the rest of the pointer stay
{
  let hover: number | null = 4
  let suppressed = false

  // 1) Hover star 4 → outline preview
  assert.equal(resolveEffectiveHoverRating(hover, suppressed), 4)
  assert.equal(resolveStarAppearance(4, 1, resolveEffectiveHoverRating(hover, suppressed)), 'outline')

  // 2) Click star 4 → suppress + clear hover → filled saved rating
  hover = null
  suppressed = true
  const afterClick = resolveEffectiveHoverRating(hover, suppressed)
  assert.equal(afterClick, null)
  assert.equal(resolveStarAppearance(1, 4, afterClick), 'filled')
  assert.equal(resolveStarAppearance(4, 4, afterClick), 'filled')
  assert.equal(resolveStarAppearance(5, 4, afterClick), 'empty')

  // 3) Pointer still over star 4 with stale hover intent → still filled (suppressed)
  hover = 4
  assert.equal(resolveEffectiveHoverRating(hover, suppressed), null)
  assert.equal(resolveStarAppearance(4, 4, resolveEffectiveHoverRating(hover, suppressed)), 'filled')

  // 4) Leave → unsuppress; saved rating remains filled
  hover = null
  suppressed = false
  assert.equal(resolveStarAppearance(4, 4, null), 'filled')

  // 5) Re-enter hover → outline preview active again
  hover = 4
  assert.equal(resolveEffectiveHoverRating(hover, suppressed), 4)
  assert.equal(resolveStarAppearance(4, 4, resolveEffectiveHoverRating(hover, suppressed)), 'outline')
}

console.log('SceneStarRating.test.ts OK')
