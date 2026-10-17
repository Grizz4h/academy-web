import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildIdentifyInteractiveRegions,
  isWeakSideAnswerCorrect,
  regionForIceHalf,
  shouldRenderWeakSideHitboxes,
  shouldShowWeakSideOverlay,
} from './weakSideInteraction.ts'

const LEARNING_TAP = [
  'defensive_zone',
  'neutral_zone',
  'offensive_zone',
  'slot',
] as const

// 1 + 2: hitboxes exist without overlay spoiler
assert.equal(
  shouldRenderWeakSideHitboxes(['weak_side', 'puck_side'], { hasHandler: true }),
  true,
)
assert.equal(
  shouldShowWeakSideOverlay(null, []),
  false,
  'no solution highlight before answer',
)
assert.equal(
  shouldRenderWeakSideHitboxes(['weak_side'], { disabled: true, hasHandler: true }),
  false,
)

// 3: puck below → weak band top → top half correct
assert.equal(regionForIceHalf('top', 'top'), 'weak_side')
assert.equal(isWeakSideAnswerCorrect(regionForIceHalf('top', 'top')), true)

// 4: bottom half wrong when weak band is top
assert.equal(regionForIceHalf('bottom', 'top'), 'puck_side')
assert.equal(isWeakSideAnswerCorrect(regionForIceHalf('bottom', 'top')), false)

// 5: overlay after correct selection / highlight
assert.equal(shouldShowWeakSideOverlay('weak_side', []), true)
assert.equal(shouldShowWeakSideOverlay(null, ['weak_side']), true)
assert.equal(shouldShowWeakSideOverlay('puck_side', []), false)

// 7: weakSideBand bottom (mirrored case)
assert.equal(regionForIceHalf('bottom', 'bottom'), 'weak_side')
assert.equal(regionForIceHalf('top', 'bottom'), 'puck_side')
assert.equal(isWeakSideAnswerCorrect(regionForIceHalf('bottom', 'bottom')), true)
assert.equal(isWeakSideAnswerCorrect(regionForIceHalf('top', 'bottom')), false)

// 6: zone identify steps still get learning tap regions; weak-side steps do not
{
  const zoneStep = buildIdentifyInteractiveRegions(
    ['neutral_zone'],
    [],
    [...LEARNING_TAP],
  )
  assert.ok(zoneStep.includes('neutral_zone'))
  assert.ok(zoneStep.includes('defensive_zone'))
  assert.ok(zoneStep.includes('offensive_zone'))
  assert.ok(!zoneStep.includes('weak_side'))
  assert.ok(!zoneStep.includes('puck_side'))
}

{
  const weakStep = buildIdentifyInteractiveRegions(
    ['weak_side'],
    ['puck_carrier'],
    [...LEARNING_TAP],
  )
  assert.deepEqual(
    new Set(weakStep),
    new Set(['weak_side', 'puck_side', 'puck_carrier']),
  )
  assert.ok(!weakStep.includes('neutral_zone'), 'zones must not compete with half hitboxes')
}

// Source contract: hitboxes vs overlay decoupled in FoundationRink
{
  const rink = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'FoundationRink.tsx'),
    'utf8',
  )
  assert.ok(rink.includes('shouldRenderWeakSideHitboxes'))
  assert.ok(rink.includes('shouldShowWeakSideOverlay'))
  assert.ok(rink.includes('data-testid="weak-side-hitbox-top"'))
  assert.ok(rink.includes('data-testid="weak-side-hitbox-bottom"'))
  assert.ok(rink.includes('data-testid="weak-side-overlay"'))
  assert.ok(rink.includes('halfHitbox'))
  // Hitboxes must not be gated on overlay visibility
  assert.ok(!/weakSideHitboxes\s*=\s*weakSideOverlay/.test(rink))
}

{
  const css = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'FoundationRink.module.css'),
    'utf8',
  )
  assert.ok(css.includes('.halfHitbox'))
  assert.ok(/fill:\s*rgba\(0,\s*0,\s*0,\s*0\)/.test(css), 'transparent fill for pointer events')
  assert.ok(css.includes('pointer-events: all'))
  // Overlay must not steal hits after paint
  assert.ok(/\.weakSide\s*\{[^}]*pointer-events:\s*none/s.test(css))
}

console.log('weakSideInteraction.test.ts: all assertions passed')
