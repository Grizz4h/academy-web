import assert from 'node:assert/strict'
import { buildPlayerVisual } from './playerPrimitives.ts'
import { resolvePlayerRenderAppearance } from './playerRenderAppearance.ts'
import { derivePlayerMarkerPaints } from './playerMarkerPaints.ts'
import { PLAYER_VISUAL_GEOMETRY } from './playerVisualGeometry.ts'

const appearance = resolvePlayerRenderAppearance({
  id: 'p1',
  visual: { fill: 'blue', label: '3', handedness: 'right' },
})
assert.equal(appearance.fill, '#1565c0')
assert.equal(appearance.label, '3')

const paints = derivePlayerMarkerPaints(appearance)
assert.equal(paints.jersey, '#1565c0')
assert.equal(paints.stick.toLowerCase(), '#9ca3af')

const visual = buildPlayerVisual({
  appearance,
  position: { x: 10, y: 20 },
  rotationDegrees: 45,
  selected: false,
  includeHitArea: false,
  paints,
})

assert.equal(visual.rotationDegrees, 45)
assert.ok(visual.bodyTransform.includes('translate(10 20)'))
assert.ok(visual.bodyTransform.includes('rotate(45)'))
assert.ok(visual.body.some((p) => p.role === 'torso'))
assert.ok(visual.body.some((p) => p.role === 'stick-shaft'))
assert.ok(visual.body.some((p) => p.role === 'helmet'))
assert.ok(visual.overlays.some((p) => p.role === 'label' && p.text === '3'))

const noStickBody = visual.body.filter(
  (p) => p.role !== 'stick-shaft' && p.role !== 'stick-blade',
)
assert.equal(
  noStickBody.some((p) => p.role === 'stick-shaft'),
  false,
)

assert.ok(PLAYER_VISUAL_GEOMETRY.torsoPathLocal.startsWith('M '))
assert.ok(PLAYER_VISUAL_GEOMETRY.stick.shaft.x2 > 0)

const left = buildPlayerVisual({
  appearance: resolvePlayerRenderAppearance({
    visual: { fill: 'red', label: '7', handedness: 'left' },
  }),
  position: { x: 0, y: 0 },
  rotationDegrees: 0,
})
const leftShaft = left.body.find((p) => p.role === 'stick-shaft')
assert.ok(leftShaft && leftShaft.role === 'stick-shaft')
assert.ok(leftShaft.points.includes('-'))

console.log('rinkStyleLab HockeyPlayer tests OK')
