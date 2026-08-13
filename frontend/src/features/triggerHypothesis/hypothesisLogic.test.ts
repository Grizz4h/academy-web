import assert from 'node:assert/strict'
import {
  resolveTriggerHypothesisConfig,
  validateTriggerHypothesisAnswers,
} from './hypothesisLogic'

const cfg = resolveTriggerHypothesisConfig({ mechanic: 'trigger_hypothesis' })

function baseAnswers(overrides: Record<string, unknown> = {}) {
  return {
    [cfg.observedChangeKey]: 'F1 startet später tiefer und lenkt stärker nach außen.',
    [cfg.priorProblemKey]: 'middle_opened_repeatedly',
    [cfg.triggerTypeKey]: 'opponent_driven',
    [cfg.evidenceKey]: ['problem_repeated_before', 'same_space', 'timing_fits', 'reduces_open_option'],
    [cfg.alternativeExplanationKey]: 'different_personnel',
    [cfg.problemFitKey]: 'direct',
    [cfg.linkStrengthKey]: 'plausible_link',
    [cfg.functionalLinkKey]: 'Der tiefere F1 könnte die Mitte früher schließen und Entries nach außen zwingen.',
    [cfg.hypothesisSummaryKey]:
      'Weil der Gegner den frühen Forecheck mehrfach durch die Mitte überspielt hat, könnte F1 tiefer starten, um den zentralen Entry stärker zu kontrollieren.',
    [cfg.confidenceKey]: 'medium',
    [cfg.stageKey]: 'complete',
    ...overrides,
  }
}

assert.equal(cfg.mechanic, 'trigger_hypothesis')
assert.equal(cfg.requireAlternativeExplanation, true)

// Strong / plausible link with multiple evidence — user decides link strength
assert.equal(validateTriggerHypothesisAnswers(cfg, baseAnswers()), null)

// Mostly timing / weak functional fit still valid if user filled all fields
assert.equal(
  validateTriggerHypothesisAnswers(
    cfg,
    baseAnswers({
      [cfg.evidenceKey]: ['timing_only'],
      [cfg.problemFitKey]: 'weak',
      [cfg.linkStrengthKey]: 'mostly_timing',
      [cfg.confidenceKey]: 'low',
      [cfg.functionalLinkKey]: 'Funktional kaum Zusammenhang sichtbar im Segment.',
      [cfg.hypothesisSummaryKey]:
        'Weil etwas vorher und etwas danach passierte, könnte nur ein zeitlicher Zusammenhang bestehen, ohne klare Ursache.',
    }),
  ),
  null,
)

// Alternative explanation required
assert.match(
  String(
    validateTriggerHypothesisAnswers(
      cfg,
      baseAnswers({ [cfg.alternativeExplanationKey]: undefined }),
    ),
  ),
  /alternative/i,
)

// Mixed trigger + no clear problem
assert.equal(
  validateTriggerHypothesisAnswers(
    cfg,
    baseAnswers({
      [cfg.priorProblemKey]: 'no_clear_problem',
      [cfg.triggerTypeKey]: 'mixed',
      [cfg.linkStrengthKey]: 'insufficient_evidence',
      [cfg.confidenceKey]: 'low',
      [cfg.evidenceKey]: ['little_direct_evidence', 'unclear'],
      [cfg.alternativeExplanationKey]: 'random_variation',
      [cfg.problemFitKey]: 'unclear',
    }),
  ),
  null,
)

// Confidence levels
for (const confidence of ['low', 'medium', 'high']) {
  assert.equal(validateTriggerHypothesisAnswers(cfg, baseAnswers({ [cfg.confidenceKey]: confidence })), null)
}

// No auto-derivation: many evidence items + weak_link is allowed
assert.equal(
  validateTriggerHypothesisAnswers(
    cfg,
    baseAnswers({
      [cfg.evidenceKey]: [
        'problem_repeated_before',
        'same_space',
        'same_role',
        'timing_fits',
        'reduces_open_option',
      ],
      [cfg.linkStrengthKey]: 'weak_link',
    }),
  ),
  null,
)

console.log('triggerHypothesis hypothesisLogic.test.ts ok')
