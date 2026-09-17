import assert from 'node:assert/strict'
import { layoutRink, roundedRectPath, SVG_METER } from './rinkGeometry.ts'
import { DEMO_RINK_SPEC } from './rinkSpec.ts'

const layout = layoutRink(DEMO_RINK_SPEC)

assert.equal(layout.rink.w, DEMO_RINK_SPEC.lengthM * SVG_METER)
assert.equal(layout.rink.h, DEMO_RINK_SPEC.widthM * SVG_METER)
assert.equal(layout.rink.r, DEMO_RINK_SPEC.cornerRadiusM * SVG_METER)

const expectedGoalLeft =
  layout.rink.x + DEMO_RINK_SPEC.goalLineOffsetM * SVG_METER
assert.equal(layout.goalLineLeftX, expectedGoalLeft)
assert.equal(
  layout.blueLeftX,
  layout.center.x - DEMO_RINK_SPEC.blueLineOffsetFromCenterM * SVG_METER,
)
assert.equal(layout.endZoneFaceoffs.length, 4)
assert.ok(layout.outlinePath.startsWith('M '))
assert.ok(layout.outlinePath.endsWith('Z'))

const path = roundedRectPath(0, 0, 100, 50, 10)
assert.ok(path.includes('A 10 10'))
assert.equal(DEMO_RINK_SPEC.lengthM, 58)
assert.equal(DEMO_RINK_SPEC.widthM, 28)
