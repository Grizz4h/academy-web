import {
  frequencyToSampleDots,
  isTendencyComplete,
  resolveTendencyProfileConfig,
  summarizeTendencyProfile,
} from './summarizeTendencyProfile'
import type { TendencyEntry } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function tend(partial: Partial<TendencyEntry> & Pick<TendencyEntry, 'summary'>): TendencyEntry {
  return {
    id: partial.id || `t_${Math.random().toString(36).slice(2, 8)}`,
    summary: partial.summary,
    frequency: partial.frequency ?? 'three',
    primaryCondition: partial.primaryCondition ?? 'pressure',
    conditionDetail: partial.conditionDetail,
    stableCore: partial.stableCore ?? ['team_function', 'zone'],
    allowedVariation: partial.allowedVariation ?? ['side', 'player'],
    attribution: partial.attribution ?? 'mostly_structural',
    confidence: partial.confidence ?? 'medium',
    strongestEvidence: partial.strongestEvidence ?? 'Mehrfach beobachtet unter ähnlichem Druck.',
    counterEvidence: partial.counterEvidence,
  }
}

{
  const one = [tend({ summary: 'Entries nach außen', frequency: 'four', confidence: 'high' })]
  assert(isTendencyComplete(one[0]), 'one complete')
  const s = summarizeTendencyProfile(one)
  assert(s.tendencyCount === 1, 'count 1')
  assert(s.rows[0].sampleDots === 4, 'four dots')
  assert(s.rows[0].confidenceLabel === 'hoch', 'high label')
  console.log('ok 1 tendency')
}

{
  const two = [
    tend({ id: 'a', summary: 'Entries nach außen', frequency: 'four', confidence: 'high', attribution: 'mostly_structural' }),
    tend({
      id: 'b',
      summary: 'Frühe Clears unter Druck',
      frequency: 'three',
      confidence: 'medium',
      attribution: 'mostly_situational',
      primaryCondition: 'pressure',
    }),
  ]
  const s = summarizeTendencyProfile(two)
  assert(s.tendencyCount === 2, 'count 2')
  assert(s.rows.length === 2, 'rows 2')
  console.log('ok 2 tendencies')
}

{
  const three = [
    tend({ id: '1', summary: 'A', frequency: 'two' }),
    tend({ id: '2', summary: 'B', frequency: 'five_plus', confidence: 'high' }),
    tend({
      id: '3',
      summary: 'C',
      frequency: 'hard_to_count',
      attribution: 'mixed',
      confidence: 'low',
      primaryCondition: 'multiple',
    }),
  ]
  const s = summarizeTendencyProfile(three)
  assert(s.tendencyCount === 3, 'count 3')
  assert(frequencyToSampleDots('five_plus') === 5, 'five plus')
  assert(frequencyToSampleDots('hard_to_count') === 0, 'hard to count dots')
  assert(s.statements.some((line) => line.includes('hoher Confidence')), 'high conf statement')
  assert(s.statements.some((line) => line.includes('vorsichtig')), 'thin statement')
  console.log('ok 3 tendencies + statements')
}

{
  const cfg = resolveTendencyProfileConfig({ minTendencies: 1, maxTendencies: 3 })
  assert(cfg.tendenciesKey === 'tendency_entries', 'key')
  assert(cfg.maxTendencies === 3, 'max 3')
  assert(cfg.requireSegmentSummary === true, 'summary required')
  assert(cfg.requireNextWatch === true, 'next watch required')
  // fourth not allowed by config bound
  assert(cfg.maxTendencies < 4, 'no fourth')
  console.log('ok config max 3')
}

{
  const incomplete = tend({ summary: 'X' })
  incomplete.strongestEvidence = ''
  assert(!isTendencyComplete(incomplete), 'incomplete without evidence')

  const thin = tend({
    summary: 'Dünn',
    attribution: 'insufficient_evidence',
    confidence: 'low',
    primaryCondition: 'no_clear_condition',
    frequency: 'unclear',
  })
  assert(isTendencyComplete(thin), 'insufficient still complete structurally')
  const s = summarizeTendencyProfile([thin])
  assert(s.statements.some((line) => line.includes('vorsichtig')), 'insufficient flagged')
  console.log('ok incomplete + insufficient')
}

{
  const mixed = tend({
    summary: 'Gemischt',
    attribution: 'mixed',
    primaryCondition: 'multiple',
    confidence: 'medium',
  })
  assert(isTendencyComplete(mixed), 'mixed complete')
  console.log('ok mixed attribution')
}

console.log('summarizeTendencyProfile.test.ts passed')
