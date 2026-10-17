import assert from 'node:assert/strict'
import {
  BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS,
  clampPuckBias,
  clampPlayerScale,
  DEFAULT_GLOBAL_PLAYER_DISPLAY,
  formatStoredGlobalDisplayCopyPayload,
  formatStoredNumber,
  GLOBAL_PLAYER_DISPLAY_KEY,
  globalDisplayWithPuckBias,
  normalizeGlobalPlayerDisplay,
  readGlobalPlayerDisplay,
  readStoredGlobalDisplayFields,
  STYLE_LAB_STICK_COLOR,
  writeGlobalPlayerDisplay,
} from './globalPlayerDisplay.ts'
import { puckLocalByBias } from './playerLocalPoint.ts'

assert.equal(STYLE_LAB_STICK_COLOR, '#9CA3AF')
assert.equal(GLOBAL_PLAYER_DISPLAY_KEY, 'rink-style-lab:player-display:v2')
assert.equal(clampPlayerScale(0.1), 0.2)
assert.equal(clampPlayerScale(2), 1.5)
assert.equal(clampPuckBias(-1), 0)
assert.equal(clampPuckBias(2), 1)

// Freigegebene Code-Standards (exact)
assert.equal(BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.playerScale, 0.6)
assert.equal(BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.puckLocalX, 16.130289239097504)
assert.equal(BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.puckLocalY, -8.270109294088925)
assert.deepEqual(DEFAULT_GLOBAL_PLAYER_DISPLAY, BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS)

{
  const mem: Record<string, string> = {}
  const storage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  }
  // Empty storage → standards (not blade default, not old v1)
  assert.deepEqual(readGlobalPlayerDisplay(storage), DEFAULT_GLOBAL_PLAYER_DISPLAY)

  // Legacy v1 key must not affect v2 reader
  mem['rink-style-lab:player-display:v1'] = JSON.stringify({
    version: 1,
    playerScale: 1.2,
    puckLocalX: 99,
    puckLocalY: 99,
  })
  assert.equal(readGlobalPlayerDisplay(storage).playerScale, 0.6)
  assert.equal(readGlobalPlayerDisplay(storage).puckLocalX, 16.130289239097504)

  writeGlobalPlayerDisplay({
    version: 2,
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

  // bias-only lab payload migrates to local tip
  mem[GLOBAL_PLAYER_DISPLAY_KEY] = JSON.stringify({ version: 2, playerScale: 1, puckBias: 0 })
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

{
  const mem: Record<string, string> = {}
  const storage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  }
  assert.deepEqual(readStoredGlobalDisplayFields(storage), {
    playerScale: null,
    puckLocalX: null,
    puckLocalY: null,
    hasKey: false,
  })

  mem[GLOBAL_PLAYER_DISPLAY_KEY] = JSON.stringify({ version: 2, playerScale: 0.65 })
  const partial = readStoredGlobalDisplayFields(storage)
  assert.equal(partial.hasKey, true)
  assert.equal(partial.playerScale, 0.65)
  assert.equal(partial.puckLocalX, null)
  assert.equal(partial.puckLocalY, null)

  mem[GLOBAL_PLAYER_DISPLAY_KEY] = JSON.stringify({
    version: 2,
    playerScale: 0.85,
    puckLocalX: 12.345678901234,
    puckLocalY: -4.25,
  })
  const full = readStoredGlobalDisplayFields(storage)
  assert.equal(full.playerScale, 0.85)
  assert.equal(full.puckLocalX, 12.345678901234)
  assert.equal(full.puckLocalY, -4.25)
  assert.equal(formatStoredNumber(12.345678901234), '12.345678901234')
  const copy = formatStoredGlobalDisplayCopyPayload(full)
  assert.ok(copy.includes('"playerScale": 0.85'))
  assert.ok(copy.includes('12.345678901234'))
}

console.log('globalPlayerDisplay.test.ts: all assertions passed')
