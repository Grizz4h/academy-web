/**
 * Run: npx --yes tsx src/dev/progressionPersonaSim.test.ts
 */

import {
  PHASE2_REFERENCE,
  simulatePersona,
  runPersonaSimSuite,
  xpForLevel,
} from './progressionPersonaSim'
import { getLevelFromXp } from '../features/progression/levelCurve'

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(label)
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}\n  expected: ${expected}\n  actual: ${actual}`)
  }
}

assertEqual(xpForLevel(5), 1200, 'level 5 cumulative xp')

{
  const result = simulatePersona('standard', 'isolated_base', 52)
  assertEqual(result.milestoneWeeks.level_5, 3, 'standard isolated L5 week')
  assertEqual(result.weeks[2]?.units, 12, '12 units after 3 weeks')
  assert(getLevelFromXp(result.weeks[2]?.xp || 0) >= 5, 'level 5 at 12 base units')
}

{
  const isolated = simulatePersona('standard', 'isolated_base', 12)
  const realistic = simulatePersona('standard', 'realistic_new_user', 12)
  const isoXp = isolated.weeks.at(-1)?.xp || 0
  const realXp = realistic.weeks.at(-1)?.xp || 0
  assert(realXp > isoXp, 'realistic earns more xp with bonuses')
}

{
  const suite = runPersonaSimSuite('isolated_base', 26)
  assertEqual(suite.results.length, 3, 'three personas')
  assert(
    suite.results.every((entry) => entry.weeks.length === 26),
    '26 week snapshots',
  )
}

{
  const result = simulatePersona('locker', 'isolated_base', 20)
  assertEqual(result.milestoneWeeks.unit_2, 1, 'slot 2 in week 1 for locker')
  assertEqual(result.milestoneWeeks.unit_4, 2, 'slot 4 in week 2 for locker')
}

assert(PHASE2_REFERENCE.level5Units === 12, 'phase2 reference documented')

console.log('progressionPersonaSim.test.ts: all assertions passed')
