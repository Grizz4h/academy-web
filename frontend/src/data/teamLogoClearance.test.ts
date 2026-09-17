import assert from 'node:assert/strict'
import { catalogIdFromLogoPath, isClubLogoPublic, normalizeClubLogoId } from './teamLogoClearance.ts'

assert.equal(normalizeClubLogoId('Eisbaren-Berlin'), 'eisbaren_berlin')

const cleared = new Set(['eisbaren_berlin', 'augsburger_panther'])

assert.equal(isClubLogoPublic(cleared, { teamId: 'eisbaren_berlin' }), true)
assert.equal(isClubLogoPublic(cleared, { teamId: 'straubing_tigers' }), false)
assert.equal(
  isClubLogoPublic(cleared, { logicalSrc: '/teams/del/eisbaren_berlin.png' }),
  true,
)
assert.equal(
  catalogIdFromLogoPath('/teams/del/augsburger_panther.svg'),
  'augsburger_panther',
)
assert.equal(
  isClubLogoPublic(cleared, {
    teamId: 'eisbaren_juniors_berlin',
    logicalSrc: '/teams/del/eisbaren_berlin.png',
  }),
  true,
)
assert.equal(
  isClubLogoPublic(cleared, {
    teamId: 'augsburger_ev',
    logicalSrc: '/teams/del/augsburger_panther.svg',
  }),
  true,
)
assert.equal(
  isClubLogoPublic(cleared, {
    teamId: 'eisbaren_regensburg',
    logicalSrc: '/teams/del2/eisbaren_regensburg.png',
  }),
  false,
)

console.log('teamLogoClearance.test.ts: all assertions passed')
