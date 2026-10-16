import assert from 'node:assert/strict'
import {
  SESSION_SETUP_FIELD_IDS,
  getFirstMissingSessionSetupRequiredField,
} from './sessionSetupValidation.ts'

assert.equal(
  getFirstMissingSessionSetupRequiredField({ skipLiveMatchup: true, observedTeam: '', observationScope: '' }),
  null,
)

const missingTeam = getFirstMissingSessionSetupRequiredField({
  observedTeam: '',
  observationScope: '',
})
assert.equal(missingTeam?.field, 'observedTeam')
assert.equal(missingTeam?.fieldId, SESSION_SETUP_FIELD_IDS.observedTeam)
assert.match(missingTeam?.message || '', /beobachtete Team/i)

const missingScope = getFirstMissingSessionSetupRequiredField({
  observedTeam: 'Eisbären Berlin',
  observationScope: '',
})
assert.equal(missingScope?.field, 'observationScope')
assert.equal(missingScope?.fieldId, SESSION_SETUP_FIELD_IDS.observationScope)
assert.match(missingScope?.message || '', /Beobachtungsumfang|Drittel/i)

// Explicit valid scopes must not warn
for (const scope of ['P1', 'P2', 'P3', 'FULL_GAME', 'LESSON'] as const) {
  assert.equal(
    getFirstMissingSessionSetupRequiredField({
      observedTeam: 'Adler Mannheim',
      observationScope: scope,
    }),
    null,
    `expected no issue for scope ${scope}`,
  )
}

// Whitespace-only team still missing
assert.equal(
  getFirstMissingSessionSetupRequiredField({
    observedTeam: '   ',
    observationScope: 'P1',
  })?.field,
  'observedTeam',
)

console.log('sessionSetupValidation.test.ts OK')
