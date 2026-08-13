import assert from 'node:assert/strict'
import { resolveInteractionChainConfig, validateInteractionChainAnswers } from './chainLogic'

const cfg = resolveInteractionChainConfig({ mechanic: 'interaction_chain' })

function baseAnswers(overrides: Record<string, unknown> = {}) {
  return {
    [cfg.problemDescriptionKey]: 'Gegnerische Entries gelangen wiederholt zentral durch die Neutral Zone.',
    [cfg.problemCategoryKey]: 'entry',
    [cfg.problemEvidenceKey]: ['same_zone', 'same_opponent_solution', 'repeated_short_span'],
    [cfg.problemExampleCountKey]: '3',
    [cfg.adjustmentDescriptionKey]: 'Die erste Linie bleibt tiefer und schließt die Mitte früher.',
    [cfg.adjustmentDimensionKey]: 'space_priority',
    [cfg.changeMagnitudeKey]: 'clear',
    [cfg.responseTypeKey]: 'redirected',
    [cfg.responseDescriptionKey]: 'Der Gegner trägt den Puck nicht mehr zentral, sondern nutzt häufiger die Außenbahn.',
    [cfg.responseRepetitionKey]: 'three_or_more',
    [cfg.problemEffectKey]: 'shifted_elsewhere',
    [cfg.tradeoffKey]: 'more_outside_space',
    [cfg.comparabilityKey]: 'mostly',
    [cfg.interactionAssessmentKey]: 'likely_effect',
    [cfg.chainSummaryKey]:
      'Vorher kam der Gegner mehrfach kontrolliert durch die Mitte. Danach stand die erste Linie tiefer und priorisierte den zentralen Raum. In den folgenden Situationen wich der Gegner häufiger auf Entries über außen aus.',
    [cfg.stageKey]: 'complete',
    ...overrides,
  }
}

assert.equal(cfg.mechanic, 'interaction_chain')
assert.equal(cfg.supportsTradeoff, true)
assert.equal(cfg.requireSummary, true)

// A – clear / likely effect with repeated different response
assert.equal(validateInteractionChainAnswers(cfg, baseAnswers()), null)

// B – no effect: same solution afterwards
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.responseTypeKey]: 'same_solution',
      [cfg.responseDescriptionKey]: 'Der Gegner kommt weiterhin zentral durch.',
      [cfg.problemEffectKey]: 'unchanged',
      [cfg.tradeoffKey]: 'none_clear',
      [cfg.interactionAssessmentKey]: 'no_clear_effect',
    }),
  ),
  null,
)

// C – trade-off / problem shifted
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.problemEffectKey]: 'shifted_elsewhere',
      [cfg.tradeoffKey]: 'more_outside_space',
      [cfg.interactionAssessmentKey]: 'problem_shifted',
    }),
  ),
  null,
)

// D – single outlier response
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.responseRepetitionKey]: 'once',
      [cfg.interactionAssessmentKey]: 'possible_effect',
      [cfg.problemEffectKey]: 'insufficient_evidence',
    }),
  ),
  null,
)

// E – new problem created
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.responseTypeKey]: 'creates_different_problem',
      [cfg.problemEffectKey]: 'new_problem_created',
      [cfg.tradeoffKey]: 'weak_side_open',
      [cfg.interactionAssessmentKey]: 'problem_shifted',
    }),
  ),
  null,
)

// Missing response description
assert.match(
  String(validateInteractionChainAnswers(cfg, baseAnswers({ [cfg.responseDescriptionKey]: '' }))),
  /konkret anders/i,
)

// Unclear + insufficient sample still valid if filled
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.responseTypeKey]: 'unclear',
      [cfg.problemEffectKey]: 'unclear',
      [cfg.interactionAssessmentKey]: 'insufficient_sample',
      [cfg.comparabilityKey]: 'unclear',
    }),
  ),
  null,
)

// Comparability = no is allowed; user still judges
assert.equal(
  validateInteractionChainAnswers(cfg, baseAnswers({ [cfg.comparabilityKey]: 'no' })),
  null,
)

// No auto-derivation: many problem examples + weak assessment is allowed
assert.equal(
  validateInteractionChainAnswers(
    cfg,
    baseAnswers({
      [cfg.problemExampleCountKey]: '4plus',
      [cfg.responseRepetitionKey]: 'once',
      [cfg.interactionAssessmentKey]: 'insufficient_sample',
    }),
  ),
  null,
)

// Tradeoff required when supported
assert.match(
  String(validateInteractionChainAnswers(cfg, baseAnswers({ [cfg.tradeoffKey]: undefined }))),
  /neue Möglichkeit/i,
)

console.log('interactionChain chainLogic.test.ts ok')
