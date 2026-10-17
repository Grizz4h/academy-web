import assert from 'node:assert/strict'
import {
  BODY_PUCK_LOCAL,
  inverseTransformPlayerLocalPoint,
  resolveScenePuckPoint,
  stickBladeLocal,
  transformPlayerLocalPoint,
  worldPuckToCanonicalLocal,
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
    puckBias: 0,
  })
  assert.ok(Math.abs(body.x - BODY_PUCK_LOCAL.x * 1.08) < 1e-6)
  assert.ok(Math.abs(body.y - BODY_PUCK_LOCAL.y * 1.08) < 1e-6)

  const blade = resolveScenePuckPoint({
    anchorX: 0,
    anchorY: 0,
    rotationDegrees: 0,
    outerScale: 1,
    handedness: 'right',
    puckBias: 1,
  })
  const tip = stickBladeLocal('right')
  assert.ok(Math.abs(blade.x - tip.x * 1.08) < 1e-6)
  assert.ok(Math.abs(blade.y - tip.y * 1.08) < 1e-6)
  assert.notEqual(blade.x, body.x)

  const mid = resolveScenePuckPoint({
    anchorX: 0,
    anchorY: 0,
    rotationDegrees: 0,
    outerScale: 1,
    puckBias: 0.5,
  })
  assert.ok(Math.abs(mid.x - (body.x + blade.x) / 2) < 1e-6)
  assert.ok(Math.abs(mid.y - (body.y + blade.y) / 2) < 1e-6)
}

{
  const world = transformPlayerLocalPoint({
    anchorX: 100,
    anchorY: 200,
    localX: 12,
    localY: -4,
    rotationDegrees: 35,
    outerScale: 1.2,
    bodyScale: 1.08,
  })
  const back = inverseTransformPlayerLocalPoint({
    anchorX: 100,
    anchorY: 200,
    worldX: world.x,
    worldY: world.y,
    rotationDegrees: 35,
    outerScale: 1.2,
    bodyScale: 1.08,
  })
  assert.ok(Math.abs(back.x - 12) < 1e-6)
  assert.ok(Math.abs(back.y - -4) < 1e-6)
}

{
  const tip = stickBladeLocal('right')
  const world = resolveScenePuckPoint({
    anchorX: 50,
    anchorY: 60,
    rotationDegrees: 20,
    outerScale: 0.9,
    handedness: 'left',
    puckLocal: tip,
  })
  const canonical = worldPuckToCanonicalLocal({
    anchorX: 50,
    anchorY: 60,
    worldX: world.x,
    worldY: world.y,
    rotationDegrees: 20,
    outerScale: 0.9,
    handedness: 'left',
  })
  assert.ok(Math.abs(canonical.x - tip.x) < 1e-6)
  assert.ok(Math.abs(canonical.y - tip.y) < 1e-6)
}

console.log('playerLocalPoint.test.ts: all assertions passed')
