import {
  summarizePatternLog,
  resolvePatternLogConfig,
} from './summarizePatternLog'
import type { PatternLogObservation } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function obs(partial: Partial<PatternLogObservation> & Pick<PatternLogObservation, 'zone' | 'trigger' | 'teamReaction'>): PatternLogObservation {
  return {
    id: partial.id || `obs_${Math.random().toString(36).slice(2, 8)}`,
    zone: partial.zone,
    trigger: partial.trigger,
    teamReaction: partial.teamReaction,
    side: partial.side,
    similarities: partial.similarities,
    contextTags: partial.contextTags,
  }
}

const base: PatternLogObservation[] = [
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    teamReaction: 'Mitte schließen, nach außen lenken',
    side: 'both',
  }),
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    teamReaction: 'Mitte schließen, nach außen lenken',
    side: 'both',
    similarities: ['same_zone', 'same_trigger', 'same_team_reaction', 'similar_sequence'],
  }),
  obs({
    zone: 'neutral_zone',
    trigger: 'zone_entry',
    teamReaction: 'Inside Lane sichern',
    side: 'left',
    similarities: ['same_zone', 'same_trigger', 'similar_sequence'],
  }),
]

const summary = summarizePatternLog(base)
assert(summary.observationCount === 3, 'expected 3 observations')
assert(summary.zoneConsistency.detail.includes('3 / 3'), `zone detail: ${summary.zoneConsistency.detail}`)
assert(summary.triggerConsistency.detail.includes('3 / 3'), `trigger detail: ${summary.triggerConsistency.detail}`)
assert(summary.reactionSimilarity.detail.includes('1 / 2'), `reaction detail: ${summary.reactionSimilarity.detail}`)
assert(summary.sequenceSimilarity.detail.includes('2 / 2'), `sequence detail: ${summary.sequenceSimilarity.detail}`)
assert(!summary.statements.some((s) => s.toLowerCase().includes('1-2-2')), 'must not invent system names')

const mixed = summarizePatternLog([
  ...base,
  obs({
    zone: 'offensive_zone',
    trigger: 'puck_loss',
    teamReaction: 'Center fällt tief',
    similarities: ['only_outcome_similar'],
  }),
])
assert(mixed.observationCount === 4, 'expected 4')
assert(mixed.onlyOutcomeHeavy === false, 'one outcome mark should not be heavy')

const outcomeHeavy = summarizePatternLog([
  obs({ zone: 'neutral_zone', trigger: 'puck_loss', teamReaction: 'A' }),
  obs({ zone: 'offensive_zone', trigger: 'reset', teamReaction: 'B', similarities: ['only_outcome_similar'] }),
  obs({ zone: 'defensive_zone', trigger: 'transition', teamReaction: 'C', similarities: ['only_outcome_similar'] }),
])
assert(outcomeHeavy.onlyOutcomeHeavy === true, 'expected outcome-heavy flag')

const cfg = resolvePatternLogConfig({ minObservations: 3, maxObservations: 5 })
assert(cfg.minObservations === 3, 'min')
assert(cfg.maxObservations === 5, 'max')
assert(cfg.logsKey === 'pattern_observations', 'logs key')

const capped = resolvePatternLogConfig({ minObservations: 4, maxObservations: 2 })
assert(capped.maxObservations === 4, 'max must be >= min')

console.log('patternLog tests passed')
