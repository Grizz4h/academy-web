import assert from 'node:assert/strict'
import {
  clampPuckBias,
  clampPlayerScale,
  DEFAULT_GLOBAL_PLAYER_DISPLAY,
  GLOBAL_PLAYER_DISPLAY_KEY,
  normalizeGlobalPlayerDisplay,
  readGlobalPlayerDisplay,
  STYLE_LAB_STICK_COLOR,
  writeGlobalPlayerDisplay,
} from './globalPlayerDisplay.ts'

assert.equal(STYLE_LAB_STICK_COLOR, '#9CA3AF')
assert.equal(clampPlayerScale(0.1), 0.2)
assert.equal(clampPlayerScale(2), 1.5)
assert.equal(clampPuckBias(-1), 0)
assert.equal(clampPuckBias(2), 1)

{
  const mem: Record<string, string> = {}
  const storage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  }
  assert.deepEqual(readGlobalPlayerDisplay(storage), DEFAULT_GLOBAL_PLAYER_DISPLAY)
  writeGlobalPlayerDisplay({ version: 1, playerScale: 0.75, puckBias: 0.4 }, storage)
  const loaded = readGlobalPlayerDisplay(storage)
  assert.equal(loaded.playerScale, 0.75)
  assert.equal(loaded.puckBias, 0.4)
  assert.ok(mem[GLOBAL_PLAYER_DISPLAY_KEY])
}

assert.equal(normalizeGlobalPlayerDisplay({ playerScale: 99, puckBias: -3 }).playerScale, 1.5)
assert.equal(normalizeGlobalPlayerDisplay({ playerScale: 99, puckBias: -3 }).puckBias, 0)

console.log('globalPlayerDisplay.test.ts: all assertions passed')
