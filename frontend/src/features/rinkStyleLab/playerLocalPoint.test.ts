import assert from 'node:assert/strict'
import {
  BODY_PUCK_LOCAL,
  resolveScenePuckPoint,
  stickBladeLocal,
  transformPlayerLocalPoint,
} from './playerLocalPoint.ts'

{
  const p = transformPlayerLocalPoint({
    anchorX: 100,
    anchorY: 200,
    localX: 10,
    localY: 0,
    rotationDegrees: 0,
    outerScale: 1,
    bodyScale: 1,
  })
  assert.equal(p.x, 110)
  assert.equal(p.y, 200)
}

{
  // 90° clockwise: +X local → +Y world (SVG y-down)
  const p = transformPlayerLocalPoint({
    anchorX: 0,
    anchorY: 0,
    localX: 10,
    localY: 0,
    rotationDegrees: 90,
    outerScale: 1,
    bodyScale: 1,
  })
  assert.ok(Math.abs(p.x) < 1e-9)
  assert.ok(Math.abs(p.y - 10) < 1e-9)
}

{
  const p = transformPlayerLocalPoint({
    anchorX: 50,
    anchorY: 50,
    localX: 10,
    localY: 0,
    rotationDegrees: 0,
    outerScale: 2,
    bodyScale: 1,
  })
  assert.equal(p.x, 70)
  assert.equal(p.y, 50)
}

{
  const right = stickBladeLocal('right')
  const left = stickBladeLocal('left')
  assert.equal(left.x, -right.x)
  assert.equal(left.y, right.y)
}

{
  const body = resolveScenePuckPoint({
    anchorX: 0,
    anchorY: 0,
    rotationDegrees: 0,
    outerScale: 1,
    placement: 'body',
  })
  assert.ok(Math.abs(body.x - BODY_PUCK_LOCAL.x * 1.08) < 1e-6)
  assert.ok(Math.abs(body.y - BODY_PUCK_LOCAL.y * 1.08) < 1e-6)

  const blade = resolveScenePuckPoint({
    anchorX: 0,
    anchorY: 0,
    rotationDegrees: 0,
    outerScale: 1,
    handedness: 'right',
    placement: 'blade',
  })
  const tip = stickBladeLocal('right')
  assert.ok(Math.abs(blade.x - tip.x * 1.08) < 1e-6)
  assert.ok(Math.abs(blade.y - tip.y * 1.08) < 1e-6)
  assert.notEqual(blade.x, body.x)
}

console.log('playerLocalPoint.test.ts: all assertions passed')
