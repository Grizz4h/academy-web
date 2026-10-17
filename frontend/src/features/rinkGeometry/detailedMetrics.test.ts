import assert from 'node:assert/strict'
import {
  DETAILED_CREASE_RADIUS_OF_HEIGHT,
  DETAILED_CREASE_RULE_FEET,
  DETAILED_ICE_WIDTH_FEET,
  DETAILED_RINK_BLUE_LINE_FROM_END,
  DETAILED_RINK_SURFACE,
  DETAILED_RINK_VIEWBOX,
  DETAILED_RINK_ZONE_BOUNDARIES,
  getDetailedRinkMetrics,
} from './detailedMetrics.ts'

assert.equal(DETAILED_RINK_VIEWBOX.width, 900)
assert.equal(DETAILED_RINK_VIEWBOX.height, 620)
assert.equal(DETAILED_RINK_SURFACE.width, 840)
assert.equal(DETAILED_RINK_BLUE_LINE_FROM_END, 0.38)
assert.equal(DETAILED_CREASE_RULE_FEET, 6)
assert.equal(DETAILED_ICE_WIDTH_FEET, 85)
assert.equal(DETAILED_CREASE_RADIUS_OF_HEIGHT, 6 / 85)

const m = getDetailedRinkMetrics()
assert.equal(m.rinkWidth, 840)
assert.equal(m.leftBlueLineX, DETAILED_RINK_SURFACE.x + DETAILED_RINK_SURFACE.width * 0.38)
assert.equal(
  DETAILED_RINK_ZONE_BOUNDARIES.left_blue_line_x,
  m.leftBlueLineX / DETAILED_RINK_VIEWBOX.width,
)
assert.equal(m.neutralDots.length, 4)

// Crease: 6 ft on height↔85 ft scale; faceoff radius intentionally unchanged
const expectedCrease = DETAILED_RINK_SURFACE.height * (6 / 85)
assert.ok(Math.abs(m.creaseRadius - expectedCrease) < 1e-9)
assert.equal(m.faceoffRadius, DETAILED_RINK_SURFACE.height * 0.100)
assert.ok(m.creaseRadius < m.faceoffRadius)

console.log('detailedMetrics.test.ts: all assertions passed')
