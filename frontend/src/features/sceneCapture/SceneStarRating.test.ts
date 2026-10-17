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

// Hover higher (saved 2 → hover 5): keep fills, outline extras
assert.equal(resolveStarAppearance(1, 2, 5), 'filled')
assert.equal(resolveStarAppearance(2, 2, 5), 'filled')
assert.equal(resolveStarAppearance(3, 2, 5), 'outline')
assert.equal(resolveStarAppearance(5, 2, 5), 'outline')
assert.equal(resolveStarAppearance(1, 0, 3), 'outline')

// Hover lower (saved 5 → hover 2): fills to target, dim above, target highlight
assert.equal(resolveStarAppearance(1, 5, 2), 'filled')
assert.equal(resolveStarAppearance(2, 5, 2), 'target')
assert.equal(resolveStarAppearance(3, 5, 2), 'dimmed')
assert.equal(resolveStarAppearance(5, 5, 2), 'dimmed')

// Hover equals saved
assert.equal(resolveStarAppearance(3, 3, 3), 'target')
assert.equal(resolveStarAppearance(2, 3, 3), 'filled')
assert.equal(resolveStarAppearance(4, 3, 3), 'empty')

assert.equal(resolveDisplayedStarRating(1, null), 1)
assert.equal(resolveDisplayedStarRating(1, 5), 5)

// Interaction: hover higher → click confirm → stay → move lower → preview
{
  let hover: number | null = null
  let confirmed: number | null = null
  let saved = 2

  const effective = () => resolveEffectiveHoverRating(hover, confirmed)
  const look = (star: number) => resolveStarAppearance(star, saved, effective())

  // Hover 4 (higher): 1–2 filled, 3–4 outline
  hover = 4
  assert.deepEqual([1, 2, 3, 4, 5].map(look), ['filled', 'filled', 'outline', 'outline', 'empty'])

  // Click 4 → confirmation → all filled to 4
  confirmed = 4
  saved = 4
  assert.equal(effective(), null)
  assert.deepEqual([1, 2, 3, 4, 5].map(look), ['filled', 'filled', 'filled', 'filled', 'empty'])

  // Stay on 4
  hover = 4
  assert.equal(effective(), null)
  assert.equal(look(4), 'filled')

  // Move to 2 → preview resumes (lower than saved 4)
  hover = 2
  confirmed = null
  assert.equal(effective(), 2)
  assert.deepEqual([1, 2, 3, 4, 5].map(look), ['filled', 'target', 'dimmed', 'dimmed', 'empty'])

  // Leave → idle
  hover = null
  confirmed = null
  assert.deepEqual([1, 2, 3, 4, 5].map(look), ['filled', 'filled', 'filled', 'filled', 'empty'])
}

console.log('SceneStarRating.test.ts OK')
