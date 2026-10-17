import assert from 'node:assert/strict'
import {
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

const m = getDetailedRinkMetrics()
assert.equal(m.rinkWidth, 840)
assert.equal(m.leftBlueLineX, DETAILED_RINK_SURFACE.x + DETAILED_RINK_SURFACE.width * 0.38)
assert.equal(
  DETAILED_RINK_ZONE_BOUNDARIES.left_blue_line_x,
  m.leftBlueLineX / DETAILED_RINK_VIEWBOX.width,
)
assert.equal(m.neutralDots.length, 4)

console.log('detailedMetrics.test.ts: all assertions passed')
