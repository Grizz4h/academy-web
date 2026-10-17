import assert from 'node:assert/strict'
import {
  clampPuckBias,
  clampPlayerScale,
  DEFAULT_GLOBAL_PLAYER_DISPLAY,
  GLOBAL_PLAYER_DISPLAY_KEY,
  globalDisplayWithPuckBias,
  normalizeGlobalPlayerDisplay,
  readGlobalPlayerDisplay,
  STYLE_LAB_STICK_COLOR,
  writeGlobalPlayerDisplay,
} from './globalPlayerDisplay.ts'
import { puckLocalByBias } from './playerLocalPoint.ts'

assert.equal(STYLE_LAB_STICK_COLOR, '#9CA3AF')
assert.equal(clampPlayerScale(0.1), 0.2)
assert.equal(clampPlayerScale(2), 1.5)
assert.equal(clampPuckBias(-1), 0)
assert.equal(clampPuckBias(2), 1)

{
  const blade = puckLocalByBias(1, 'right')
  assert.ok(Math.abs(DEFAULT_GLOBAL_PLAYER_DISPLAY.puckLocalX - blade.x) < 1e-6)
  assert.ok(Math.abs(DEFAULT_GLOBAL_PLAYER_DISPLAY.puckLocalY - blade.y) < 1e-6)
}

{
  const mem: Record<string, string> = {}
  const storage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  }
  assert.deepEqual(readGlobalPlayerDisplay(storage), DEFAULT_GLOBAL_PLAYER_DISPLAY)
  writeGlobalPlayerDisplay({
    version: 1,
    playerScale: 0.75,
    puckBias: 0.4,
    puckLocalX: 10,
    puckLocalY: -5,
  }, storage)
  const loaded = readGlobalPlayerDisplay(storage)
  assert.equal(loaded.playerScale, 0.75)
  assert.equal(loaded.puckLocalX, 10)
  assert.equal(loaded.puckLocalY, -5)
  assert.ok(mem[GLOBAL_PLAYER_DISPLAY_KEY])

  // bias-only legacy payload migrates to local tip
  mem[GLOBAL_PLAYER_DISPLAY_KEY] = JSON.stringify({ version: 1, playerScale: 1, puckBias: 0 })
  const migrated = readGlobalPlayerDisplay(storage)
  const body = puckLocalByBias(0, 'right')
  assert.ok(Math.abs(migrated.puckLocalX - body.x) < 1e-6)
}

{
  const withBias = globalDisplayWithPuckBias(DEFAULT_GLOBAL_PLAYER_DISPLAY, 0)
  const body = puckLocalByBias(0, 'right')
  assert.equal(withBias.puckBias, 0)
  assert.ok(Math.abs(withBias.puckLocalX - body.x) < 1e-6)
}

assert.equal(normalizeGlobalPlayerDisplay({ playerScale: 99, puckBias: -3 }).playerScale, 1.5)
assert.equal(normalizeGlobalPlayerDisplay({ playerScale: 99, puckBias: -3 }).puckBias, 0)

console.log('globalPlayerDisplay.test.ts: all assertions passed')
