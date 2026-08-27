/**
 * Run: npx --yes tsx src/dev/progressionHarness.test.ts
 */

import {
  HARNESS_SCENARIOS,
  buildStandardJourneyEvents,
  evaluateExpectation,
  type PreviewGrantResult,
} from './progressionHarness'

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(label)
}

assert(HARNESS_SCENARIOS.length === 8, 'eight scenarios')
assert(HARNESS_SCENARIOS.some((s) => s.id === 'duplicate_unit'), 'duplicate scenario')
assert(buildStandardJourneyEvents().length === 16, '4 weeks × 4 units')

const fakePreview: PreviewGrantResult = {
  granted_xp: 125,
  granted_pux: 10,
  cosmetics: [],
  logs: ['grant:base_unit:del:2025:999|P1|C1_D1'],
  state_after: {
    xp: 125,
    currency: { PUX: 10 },
    processedUnits: { 'del:2025:999|P1|C1_D1': {} },
    processedGrantKeys: {},
    unlockedCosmetics: {},
  },
}

const first = HARNESS_SCENARIOS.find((s) => s.id === 'first_p1_unit')!
const check = evaluateExpectation(fakePreview, first.expect)
assert(check.ok, 'expectation pass')

const dupPreview: PreviewGrantResult = {
  ...fakePreview,
  granted_xp: 0,
  granted_pux: 0,
  logs: ['skip:unit_duplicate:del:2025:999|P1|C1_D1'],
}
const dup = HARNESS_SCENARIOS.find((s) => s.id === 'duplicate_unit')!
assert(evaluateExpectation(dupPreview, dup.expect).ok, 'duplicate expect')

console.log('progressionHarness.test.ts: all assertions passed')
