import assert from 'node:assert/strict'
import {
  draftToEntry,
  emptyAdjustmentDraft,
  isAdjustmentEntryComplete,
  resolveAdjustmentProfileConfig,
  validateAdjustmentProfileAnswers,
} from './profileLogic'

const cfg = resolveAdjustmentProfileConfig({
  mechanic: 'adjustment_profile',
  minAdjustments: 1,
  maxAdjustments: 2,
  allowNoClearAdjustment: true,
})

function completeEntry(overrides: Record<string, unknown> = {}) {
  return draftToEntry({
    ...emptyAdjustmentDraft(),
    beforeBehavior: 'Die erste Linie griff Entries früh an der Blue Line an.',
    changedBehavior: 'Die erste Linie fiel tiefer zurück und priorisierte die Mitte.',
    primaryChange: 'space_priority',
    stability: 'mostly_stable',
    possibleTrigger: 'opponent_repeated_success',
    triggerEvidence: 'Der tiefere Rückzug begann erst nach mehreren zentralen Entries.',
    stableElements: ['space_priority', 'base_structure'],
    interactionResponse: 'opponent_found_new_solution',
    assessment: 'likely_adjustment',
    confidence: 'medium',
    ...overrides,
  })
}

function wrapup(overrides: Record<string, unknown> = {}) {
  return {
    [cfg.stageKey]: 'complete',
    [cfg.segmentSummaryKey]:
      'Im zweiten Drittel zog sich die Neutral-Zone-Defense nach mehreren zentralen Entries sichtbar tiefer zurück. Das Muster hielt über mehrere Situationen an und wirkt wie ein wahrscheinliches Adjustment.',
    [cfg.nextWatchKey]: 'holds_adjustment_1',
    ...overrides,
  }
}

assert.equal(cfg.mechanic, 'adjustment_profile')
assert.equal(cfg.maxAdjustments, 2)
assert.equal(isAdjustmentEntryComplete(emptyAdjustmentDraft()), false)
assert.equal(isAdjustmentEntryComplete(completeEntry()), true)

// One adjustment — various assessments / confidence
for (const assessment of [
  'strong_adjustment_signal',
  'likely_adjustment',
  'possible_adjustment',
  'probably_context_variation',
  'insufficient_evidence',
]) {
  assert.equal(
    validateAdjustmentProfileAnswers(
      cfg,
      wrapup({
        [cfg.entriesKey]: [completeEntry({ assessment })],
      }),
    ),
    null,
  )
}

assert.equal(
  validateAdjustmentProfileAnswers(
    cfg,
    wrapup({
      [cfg.entriesKey]: [completeEntry({ assessment: 'possible_adjustment', confidence: 'high' })],
    }),
  ),
  null,
)

assert.equal(
  validateAdjustmentProfileAnswers(
    cfg,
    wrapup({
      [cfg.entriesKey]: [completeEntry({ assessment: 'likely_adjustment', confidence: 'low' })],
    }),
  ),
  null,
)

// Two adjustments — primary pick required
const two = [completeEntry({ confidence: 'high' }), completeEntry({
  beforeBehavior: 'Exit wurde sofort über die Bande vereinfacht.',
  changedBehavior: 'Häufiger kurzer Support-Pass statt sofortigem Clear.',
  primaryChange: 'support',
  possibleTrigger: 'own_repeated_problem',
  interactionResponse: 'problem_shifted',
  assessment: 'possible_adjustment',
  confidence: 'low',
})]

assert.match(
  String(validateAdjustmentProfileAnswers(cfg, wrapup({ [cfg.entriesKey]: two }))),
  /deutlichsten gestützt|stärker geprägt|primary/i,
)

assert.equal(
  validateAdjustmentProfileAnswers(
    cfg,
    wrapup({ [cfg.entriesKey]: two, [cfg.primaryAdjustmentKey]: two[0].id }),
  ),
  null,
)

assert.equal(
  validateAdjustmentProfileAnswers(
    cfg,
    wrapup({ [cfg.entriesKey]: two, [cfg.primaryAdjustmentKey]: '__both_similar' }),
  ),
  null,
)

// No clear adjustment
assert.equal(
  validateAdjustmentProfileAnswers(
    cfg,
    wrapup({
      [cfg.noClearKey]: true,
      [cfg.entriesKey]: [],
      [cfg.noClearReasonKey]: 'mostly_stable',
      [cfg.nextWatchKey]: 'old_behavior_returns',
    }),
  ),
  null,
)

assert.match(
  String(
    validateAdjustmentProfileAnswers(
      cfg,
      wrapup({ [cfg.noClearKey]: true, [cfg.entriesKey]: [], [cfg.nextWatchKey]: 'old_behavior_returns' }),
    ),
  ),
  /begründe/i,
)

// Interaction responses
for (const interactionResponse of ['problem_shifted', 'opponent_found_new_solution', 'little_visible_change']) {
  assert.equal(
    validateAdjustmentProfileAnswers(
      cfg,
      wrapup({ [cfg.entriesKey]: [completeEntry({ interactionResponse })] }),
    ),
    null,
  )
}

// Incomplete entry
assert.match(
  String(
    validateAdjustmentProfileAnswers(
      cfg,
      wrapup({ [cfg.entriesKey]: [completeEntry({ triggerEvidence: '' })] }),
    ),
  ),
  /vervollständige/i,
)

console.log('adjustmentProfile profileLogic.test.ts ok')
