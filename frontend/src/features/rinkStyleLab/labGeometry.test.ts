import assert from 'node:assert/strict'
import {
  DETAILED_ICE,
  DETAILED_VIEWBOX,
  FOUNDATION_ICE,
  halfForBand,
} from './labGeometry.ts'
import {
  DETAILED_RINK_SURFACE,
  DETAILED_RINK_VIEWBOX,
} from '../rinkGeometry/detailedMetrics.ts'

assert.equal(FOUNDATION_ICE.w, 360)
assert.equal(DETAILED_ICE.x, DETAILED_RINK_SURFACE.x)
assert.equal(DETAILED_ICE.y, DETAILED_RINK_SURFACE.y)
assert.equal(DETAILED_ICE.w, DETAILED_RINK_SURFACE.width)
assert.equal(DETAILED_ICE.h, DETAILED_RINK_SURFACE.height)
assert.equal(DETAILED_VIEWBOX.width, DETAILED_RINK_VIEWBOX.width)
assert.equal(halfForBand('top', 'top'), 'weak')
assert.equal(halfForBand('bottom', 'top'), 'strong')
assert.equal(halfForBand('bottom', 'bottom'), 'weak')

console.log('labGeometry.test.ts: all assertions passed')
