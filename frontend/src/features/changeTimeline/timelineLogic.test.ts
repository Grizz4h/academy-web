import assert from 'node:assert/strict'
import {
  canSaveTimelineDraft,
  computeChangePointEvidence,
  emptyTimelineDraft,
  resolveChangeTimelineConfig,
  validateChangeTimelineAnswers,
} from './timelineLogic.ts'

const cfg = resolveChangeTimelineConfig({
  mechanic: 'change_timeline',
  minObservations: 4,
  maxObservations: 6,
})

assert.equal(cfg.minObservations, 4)
assert.equal(cfg.maxObservations, 6)

const draft = {
  ...emptyTimelineDraft(),
  relationToBaseline: 'new_behavior',
  changedDimension: 'pressure_timing',
  description: 'Tiefer Rückzug',
}
assert.equal(canSaveTimelineDraft(draft, true), true)

const draftMissingDim = {
  ...emptyTimelineDraft(),
  relationToBaseline: 'new_behavior',
  description: 'Tiefer Rückzug',
}
assert.equal(canSaveTimelineDraft(draftMissingDim, true), false)

const observations = [
  { id: '1', order: 1, relationToBaseline: 'matches_baseline' as const, description: 'früh' },
  { id: '2', order: 2, relationToBaseline: 'matches_baseline' as const, description: 'früh' },
  { id: '3', order: 3, relationToBaseline: 'new_behavior' as const, changedDimension: 'pressure_timing' as const, description: 'tief' },
  { id: '4', order: 4, relationToBaseline: 'new_behavior' as const, changedDimension: 'pressure_timing' as const, description: 'tief' },
  { id: '5', order: 5, relationToBaseline: 'new_behavior' as const, changedDimension: 'pressure_timing' as const, description: 'tief' },
]

const evidence = computeChangePointEvidence(observations, '3')
assert.equal(evidence?.beforeCount, 2)
assert.equal(evidence?.afterCount, 3)
assert.equal(evidence?.beforeBaselineCount, 2)
assert.equal(evidence?.afterDeviationCount, 3)

assert.equal(
  validateChangeTimelineAnswers(cfg, {
    observationFocus: 'Entry-Zugriff',
    baselineDescription: 'Früher Druck an der Blue Line',
    change_timeline_observations: observations,
    candidateChangePointId: '3',
    postChangeStability: 'mostly_persists',
    changeMagnitude: 'clear',
    comparability: 'mostly',
    assessment: 'likely_change',
    changeSummary: 'Ab der dritten Beobachtung zieht sich die erste Linie tiefer zurück und bleibt dort.',
  }),
  null,
)

assert.notEqual(
  validateChangeTimelineAnswers(cfg, {
    observationFocus: 'Entry-Zugriff',
    baselineDescription: 'Früher Druck',
    change_timeline_observations: observations.slice(0, 3),
  }),
  null,
)

console.log('changeTimeline timelineLogic tests OK')
