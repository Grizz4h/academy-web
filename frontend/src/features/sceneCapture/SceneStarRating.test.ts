import assert from 'node:assert/strict'
import {
  resolveDisplayedStarRating,
  resolveEffectiveHoverRating,
  resolveStarAppearance,
  shouldShowSavedRatingMarker,
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

// Saved marker only during outline preview, under the saved star
assert.equal(shouldShowSavedRatingMarker(2, 2, 5), true)
assert.equal(shouldShowSavedRatingMarker(5, 2, 5), false)
assert.equal(shouldShowSavedRatingMarker(2, 2, null), false)
assert.equal(shouldShowSavedRatingMarker(1, 0, 3), false)

// Full interaction sequence: hover → click confirm → stay → move → preview again
{
  let hover: number | null = null
  let confirmed: number | null = null
  let saved = 1

  const effective = () => resolveEffectiveHoverRating(hover, confirmed)
  const look = (star: number) => resolveStarAppearance(star, saved, effective())

  // 1) Hover star 4 → outline preview; saved marker on star 1
  hover = 4
  assert.equal(effective(), 4)
  assert.equal(look(4), 'outline')
  assert.equal(shouldShowSavedRatingMarker(1, saved, effective()), true)

  // 2) Click star 4 → confirmation on same star → filled (no outline)
  confirmed = 4
  saved = 4
  assert.equal(effective(), null)
  assert.equal(look(1), 'filled')
  assert.equal(look(4), 'filled')
  assert.equal(look(5), 'empty')
  assert.equal(shouldShowSavedRatingMarker(4, saved, effective()), false)

  // 3) Pointer still on star 4 → filled remains
  hover = 4
  assert.equal(effective(), null)
  assert.equal(look(4), 'filled')

  // 4) Move to star 2 within component → confirmation ends, outline preview resumes
  hover = 2
  confirmed = null
  assert.equal(effective(), 2)
  assert.equal(look(1), 'outline')
  assert.equal(look(2), 'outline')
  assert.equal(look(3), 'empty')
  assert.equal(shouldShowSavedRatingMarker(4, saved, effective()), true)

  // 5) Leave component → idle filled saved rating
  hover = null
  confirmed = null
  assert.equal(look(4), 'filled')
  assert.equal(shouldShowSavedRatingMarker(4, saved, effective()), false)
}

console.log('SceneStarRating.test.ts OK')
