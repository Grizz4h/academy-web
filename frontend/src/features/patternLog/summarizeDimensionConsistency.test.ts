import {
  resolvePatternInvariantConfig,
  summarizeDimensionConsistency,
} from './summarizeDimensionConsistency'
import type { PatternLogObservation } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function obs(partial: Partial<PatternLogObservation> & Pick<PatternLogObservation, 'zone' | 'trigger' | 'primaryAction' | 'targetEffect' | 'actorRole'>): PatternLogObservation {
  return {
    id: partial.id || `i_${Math.random().toString(36).slice(2, 7)}`,
    zone: partial.zone,
    trigger: partial.trigger,
    primaryAction: partial.primaryAction,
    teamReaction: partial.primaryAction || '',
    targetEffect: partial.targetEffect,
    actorRole: partial.actorRole,
    side: partial.side,
    sequenceSimilarity: partial.sequenceSimilarity,
  }
}

const list = [
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    primaryAction: 'Mitte schließen',
    targetEffect: 'outside',
    actorRole: 'center',
    side: 'left',
    sequenceSimilarity: 'very_similar',
  }),
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    primaryAction: 'Zentrum dicht machen',
    targetEffect: 'outside',
    actorRole: 'wing',
    side: 'right',
    sequenceSimilarity: 'same_function_different_execution',
  }),
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    primaryAction: 'Mitte schließen',
    targetEffect: 'outside',
    actorRole: 'defense',
    side: 'left',
    sequenceSimilarity: 'similar',
  }),
]

const summary = summarizeDimensionConsistency(list)
assert(summary.observationCount === 3, 'count')
const zone = summary.dimensions.find((d) => d.dimensionId === 'zone')
const side = summary.dimensions.find((d) => d.dimensionId === 'side')
const action = summary.dimensions.find((d) => d.dimensionId === 'primaryAction')
const actor = summary.dimensions.find((d) => d.dimensionId === 'actorRole')
assert(zone?.consistency === 'constant', 'zone constant')
assert(side?.consistency === 'mostly_constant' || side?.consistency === 'variable', 'side varies')
assert(action?.consistency === 'user_judged', 'no NLP on free text')
assert(action?.isFreeText === true, 'free text flag')
assert(actor?.uniqueCount === 3, 'actor roles vary')
assert(!summary.statements.some((s) => /verursacht|immer/i.test(s)), 'no causal language')

const cfg = resolvePatternInvariantConfig({ minObservations: 3, maxObservations: 5 })
assert(cfg.minObservations === 3 && cfg.maxObservations === 5, 'bounds')
assert(cfg.logsKey === 'pattern_invariant_observations', 'key')

console.log('patternInvariant tests passed')
