import assert from 'node:assert/strict'
import { formatMissingCountMessage } from './missingRequirementMessage.ts'

assert.equal(
  formatMissingCountMessage({ saved: 0, required: 2, noun: 'Situationen', ofWhat: 'für den Center' }),
  'Noch keine Situationen für den Center gespeichert. Speichere mindestens 2, dann kannst du weiter.',
)
assert.equal(
  formatMissingCountMessage({ saved: 1, required: 2, noun: 'Situationen', ofWhat: 'für den Center' }),
  '1 von 2 Situationen für den Center gespeichert. Speichere mindestens 2, dann kannst du weiter.',
)
assert.equal(
  formatMissingCountMessage({ saved: 0, required: 3, noun: 'Beobachtungen' }),
  'Noch keine Beobachtungen gespeichert. Speichere mindestens 3, dann kannst du weiter.',
)
assert.equal(
  formatMissingCountMessage({ saved: 2, required: 4, noun: 'Scans' }),
  '2 von 4 Scans gespeichert. Speichere mindestens 4, dann kannst du weiter.',
)

console.log('missingRequirementMessage tests OK')
