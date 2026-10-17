import assert from 'node:assert/strict'
import {
  DETAILED_CREASE_RADIUS_OF_HEIGHT,
  DETAILED_CREASE_RULE_FEET,
  DETAILED_END_ZONE_FACEOFF_OF_DEPTH,
  DETAILED_FACEOFF_LATERAL_OF_HEIGHT,
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
assert.equal(DETAILED_FACEOFF_LATERAL_OF_HEIGHT, 22 / 85)
assert.equal(DETAILED_END_ZONE_FACEOFF_OF_DEPTH, 20 / 64)

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

// Lateral: end-zone centres and NZ dots share 22 ft axis
const expectedLateral = m.rinkHeight * (22 / 85)
assert.ok(Math.abs(m.topFaceoffY - (m.rinkCenterY - expectedLateral)) < 1e-9)
assert.ok(Math.abs(m.bottomFaceoffY - (m.rinkCenterY + expectedLateral)) < 1e-9)
for (const dot of m.neutralDots) {
  assert.ok(dot.y === m.topFaceoffY || dot.y === m.bottomFaceoffY)
}

// End zones: 20/64 of goal→blue depth; mirror-symmetric; closer to goal than old 0.26
const leftDepth = m.leftBlueLineX - m.leftGoalLineX
const rightDepth = m.rightGoalLineX - m.rightBlueLineX
assert.ok(Math.abs(m.leftZoneFaceoffX - (m.leftGoalLineX + leftDepth * (20 / 64))) < 1e-9)
assert.ok(Math.abs(m.rightZoneFaceoffX - (m.rightGoalLineX - rightDepth * (20 / 64))) < 1e-9)
assert.ok(Math.abs((m.leftZoneFaceoffX - m.rinkX) - (m.rinkRight - m.rightZoneFaceoffX)) < 1e-9)
assert.ok(m.leftZoneFaceoffX < m.rinkX + m.rinkWidth * 0.26)
assert.ok(m.rightZoneFaceoffX > m.rinkRight - m.rinkWidth * 0.26)
// Still between goal line and blue line
assert.ok(m.leftZoneFaceoffX > m.leftGoalLineX && m.leftZoneFaceoffX < m.leftBlueLineX)
assert.ok(m.rightZoneFaceoffX < m.rightGoalLineX && m.rightZoneFaceoffX > m.rightBlueLineX)

// NZ length offset unchanged
const neutralOffsetX = m.rinkWidth * 0.08
assert.ok(m.neutralDots.some((d) => Math.abs(d.x - (m.rinkCenterX - neutralOffsetX)) < 1e-9))
assert.ok(m.neutralDots.some((d) => Math.abs(d.x - (m.rinkCenterX + neutralOffsetX)) < 1e-9))

console.log('detailedMetrics.test.ts: all assertions passed')
