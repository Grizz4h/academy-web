import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  foundationPointToDetailed,
  foundationPointToNorm,
  foundationScaleToDetailed,
  isInBottomHalfDetailed,
  mapPointBetweenIce,
  resolveSceneMarkers,
} from './foundationCoordAdapter.ts'
import { extractFoundationScenes } from './foundationScenes.ts'
import { DETAILED_ICE, FOUNDATION_ICE } from './labGeometry.ts'
import {
  DETAILED_RINK_SURFACE,
} from '../rinkGeometry/detailedMetrics.ts'

// DETAILED_ICE must track product metrics (no 5th geometry)
assert.equal(DETAILED_ICE.x, DETAILED_RINK_SURFACE.x)
assert.equal(DETAILED_ICE.w, DETAILED_RINK_SURFACE.width)

{
  const tl = mapPointBetweenIce(
    FOUNDATION_ICE.x,
    FOUNDATION_ICE.y,
    FOUNDATION_ICE,
    DETAILED_ICE,
  )
  assert.equal(tl.x, DETAILED_ICE.x)
  assert.equal(tl.y, DETAILED_ICE.y)
  const br = foundationPointToDetailed(
    FOUNDATION_ICE.x + FOUNDATION_ICE.w,
    FOUNDATION_ICE.y + FOUNDATION_ICE.h,
  )
  assert.equal(br.x, DETAILED_ICE.x + DETAILED_ICE.w)
  assert.equal(br.y, DETAILED_ICE.y + DETAILED_ICE.h)
}

{
  const mid = foundationPointToNorm(
    FOUNDATION_ICE.x + FOUNDATION_ICE.w / 2,
    FOUNDATION_ICE.y + FOUNDATION_ICE.h / 2,
  )
  assert.ok(Math.abs(mid.x - 0.5) < 1e-9)
}

assert.ok(foundationScaleToDetailed() > 1)

// d4_weak_side puck (cy 185) → bottom half on Detailed
{
  const puck = foundationPointToDetailed(255, 185)
  assert.equal(isInBottomHalfDetailed(puck.y), true)
  assert.equal(isInBottomHalfDetailed(foundationPointToDetailed(200, 40).y), false)
}

{
  const markers = resolveSceneMarkers(
    ['puck_carrier'],
    { puck_carrier: { cx: 255, cy: 185, label: 'Blau · Puck', team: 'blue', hasPuck: true } },
    'detailed',
  )
  assert.equal(markers.length, 1)
  assert.equal(isInBottomHalfDetailed(markers[0].y), true)
}

{
  const raw = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/foundation/t0-track.json'),
      'utf8',
    ),
  )
  const scenes = extractFoundationScenes(raw)
  const weak = scenes.find((s) => s.id === 'd4_weak_side')
  assert.ok(weak, 'd4_weak_side must be extractable')
  assert.equal(weak?.weakSideBand, 'top')
  assert.equal(weak?.showAttackArrow, false)
  assert.ok(weak?.learning?.showWeakStrong)
  assert.ok((weak?.correctRegions || []).includes('weak_side'))
  assert.ok(scenes.length >= 10)
}

console.log('foundationCoordAdapter.test.ts: all assertions passed')
