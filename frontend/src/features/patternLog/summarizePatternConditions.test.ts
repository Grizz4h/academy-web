import {
  resolvePatternConditionConfig,
  summarizePatternConditions,
} from './summarizePatternConditions'
import type { PatternLogObservation } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function cse(partial: Partial<PatternLogObservation> & Pick<PatternLogObservation, 'zone' | 'trigger' | 'teamReaction'>): PatternLogObservation {
  return {
    id: partial.id || `c_${Math.random().toString(36).slice(2, 7)}`,
    caseType: partial.caseType || 'pattern_case',
    zone: partial.zone,
    trigger: partial.trigger,
    teamReaction: partial.teamReaction,
    pressureLevel: partial.pressureLevel,
    possessionState: partial.possessionState,
    supportState: partial.supportState,
    side: partial.side,
  }
}

const patternOnly = [
  cse({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    pressureLevel: 'high',
    possessionState: 'controlled',
    supportState: 'isolated',
    teamReaction: 'nach außen lenken',
  }),
  cse({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    pressureLevel: 'high',
    possessionState: 'controlled',
    supportState: 'isolated',
    teamReaction: 'nach außen lenken',
  }),
  cse({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    pressureLevel: 'moderate',
    possessionState: 'controlled',
    supportState: 'isolated',
    teamReaction: 'nach außen lenken',
  }),
]

const s1 = summarizePatternConditions(patternOnly)
assert(s1.patternCaseCount === 3, '3 pattern')
assert(s1.counterCaseCount === 0, '0 counter')
assert(s1.dimensions.find((d) => d.dimensionId === 'zone')?.patternDetail.includes('3/3'), 'zone stable')
assert(s1.statements.some((line) => line.includes('Kein geeigneter Gegenfall')), 'no counter statement')
assert(!s1.statements.some((line) => /verursacht|immer/i.test(line)), 'no causal language')

const withCounter = [
  ...patternOnly,
  cse({
    caseType: 'counter_case',
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    pressureLevel: 'low',
    possessionState: 'controlled',
    supportState: 'strong_support',
    teamReaction: 'zentraler Pass Entry',
  }),
]

const s2 = summarizePatternConditions(withCounter)
assert(s2.counterCaseCount === 1, '1 counter')
const pressure = s2.dimensions.find((d) => d.dimensionId === 'pressureLevel')
const support = s2.dimensions.find((d) => d.dimensionId === 'supportState')
assert(pressure?.differsInCounter === true, 'pressure differs')
assert(support?.differsInCounter === true, 'support differs')
assert(s2.dimensions.find((d) => d.dimensionId === 'zone')?.differsInCounter === false, 'zone same')

const cfg = resolvePatternConditionConfig({ minPatternCases: 3, maxObservations: 5, maxCounterCases: 2 })
assert(cfg.minPatternCases === 3, 'min pattern')
assert(cfg.maxObservations === 5, 'max total')
assert(cfg.maxCounterCases === 2, 'max counter')
assert(cfg.logsKey === 'pattern_condition_cases', 'logs key')

console.log('patternConditions tests passed')
