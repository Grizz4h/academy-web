import assert from 'node:assert/strict'
import { formatUnlockHow, selectLockerItems } from './lockerSelectors.ts'
import type { ProgressionViewState } from './selectors.ts'

assert.equal(formatUnlockHow({ type: 'level', level: 10 }), 'Erreiche Level 10')
assert.equal(formatUnlockHow({ type: 'pux_shop' }), 'Im Pux Shop kaufen')

const emptyState = {
  unlockedCosmetics: {},
  favoriteCosmeticIds: [],
} as unknown as ProgressionViewState & { favoriteCosmeticIds?: string[] }

const normal = selectLockerItems(emptyState)
const revealed = selectLockerItems(emptyState, { revealAll: true })

const secretNormal = normal.find((item) => item.definition.visibility === 'secret' && !item.owned)
if (secretNormal) {
  assert.equal(secretNormal.mystery, true)
  assert.equal(secretNormal.displayName, 'Geheimnis')
}

const secretRevealed = revealed.find((item) => item.definition.visibility === 'secret')
if (secretRevealed) {
  assert.equal(secretRevealed.mystery, false)
  assert.notEqual(secretRevealed.displayName, 'Geheimnis')
  assert.notEqual(secretRevealed.displayName, '???')
}
