import assert from 'node:assert/strict'
import { appendSidequest } from '../../utils/sessionSidequests.ts'
import { calculatePercentagePointDifference } from '../opportunityRate/rateLogic.ts'
import { DEFAULT_EVIDENCE_CASES } from './cases.ts'
import {
  containsForbiddenScoreLanguage,
  defaultCopyHasNoAutomaticScore,
  emptyAssessment,
  evidenceStrengthOptions,
  groupsFromSample,
  isCaseAssessmentComplete,
  normalizeEvidenceSample,
  overallFeedback,
  readAssessments,
  resolveEvidenceAssessmentConfig,
  validateEvidenceAssessmentAnswers,
} from './evidenceLogic.ts'
import type { EvidenceAssessment, EvidenceStrength } from './types.ts'

const cfg = resolveEvidenceAssessmentConfig({
  mechanic: 'evidence_assessment',
  cases: ['thin_sample', 'small_difference', 'poor_comparability', 'solid_picture'],
})

assert.equal(cfg.cases.length, 4)
assert.equal(cfg.cases[0].id, 'thin_sample')
assert.equal(cfg.cases[1].id, 'small_difference')
assert.equal(cfg.cases[2].id, 'poor_comparability')
assert.equal(cfg.cases[3].id, 'solid_picture')
assert.equal(defaultCopyHasNoAutomaticScore(cfg), true)

const thin = normalizeEvidenceSample(cfg.cases[0].sample)
assert.equal(thin.sampleSize, 5)
assert.deepEqual(thin.groupSizes, [3, 2])
assert.deepEqual(thin.targetCounts, [2, 0])
assert.equal(thin.rates?.[0], 2 / 3)
assert.equal(thin.rates?.[1], 0)
assert.equal(thin.differencePercentagePoints, calculatePercentagePointDifference(2 / 3, 0))
assert.equal(thin.differencePercentagePoints, 67)
const thinGroups = groupsFromSample(thin)
assert.ok(thinGroups)
assert.equal(thinGroups[0].ratePercent, 67)
assert.equal(thinGroups[1].ratePercent, 0)
assert.equal(emptyAssessment(thin.sourceType).overallStrength, undefined)

const small = normalizeEvidenceSample(cfg.cases[1].sample)
assert.equal(small.sampleSize, 40)
assert.deepEqual(small.targetCounts, [11, 10])
assert.equal(small.differencePercentagePoints, 5)
assert.equal(cfg.cases[1].statement.includes('höher'), true)
assert.equal(cfg.cases[1].contextNotes?.some((note) => /klar(er|en) effekt/i.test(note)), false)
assert.equal(containsForbiddenScoreLanguage(cfg.cases[1].title + cfg.cases[1].statement), false)

const poor = normalizeEvidenceSample(cfg.cases[2].sample)
assert.equal(poor.sourceType, 'conditional_compare')
assert.equal(poor.sampleSize, 19)
assert.deepEqual(poor.targetCounts, [7, 2])
assert.ok(poor.matrix)
assert.equal(poor.matrix?.presentTarget, 7)
assert.equal(poor.matrix?.absentTarget, 2)
assert.ok(cfg.cases[2].contextNotes?.some((note) => note.includes('Forecheckdruck')))

const solid = normalizeEvidenceSample(cfg.cases[3].sample)
assert.equal(solid.sampleSize, 40)
assert.deepEqual(solid.targetCounts, [12, 4])
assert.equal(solid.differencePercentagePoints, 40)
assert.equal(solid.counterexampleCount, 4)

const strengths = evidenceStrengthOptions().map((item) => item.value)
assert.deepEqual(strengths, [
  'strongly_supported',
  'reasonably_supported',
  'suggestive',
  'weak',
  'insufficient',
  'unclear',
])
for (const value of strengths as EvidenceStrength[]) {
  const stored: EvidenceAssessment = { ...emptyAssessment('thin_sample'), overallStrength: value, dimensions: {
    sampleStrength: 'very_thin',
    comparability: 'partly_comparable',
    counterexamples: 'some',
    differenceClarity: 'clear',
    definitionClarity: 'mostly_clear',
  } }
  assert.equal(stored.overallStrength, value)
  assert.ok(overallFeedback(DEFAULT_EVIDENCE_CASES[0], value))
}

function completeAssessment(caseId: string): EvidenceAssessment {
  return {
    caseId,
    dimensions: {
      sampleStrength: 'thin',
      comparability: 'mostly_comparable',
      counterexamples: 'some',
      differenceClarity: 'clear',
      definitionClarity: 'very_clear',
    },
    overallStrength: 'suggestive',
    strongestSupportedStatement: 'a',
    tooStrongStatement: 'c',
    userStatement: 'In dieser Stichprobe trat das Target häufiger auf, die Basis bleibt klein.',
    evidenceNeededNext: 'more_comparable',
    weakeningEvidence: 'difference_vanishes',
  }
}

assert.equal(isCaseAssessmentComplete(emptyAssessment('thin_sample')), false)
assert.equal(isCaseAssessmentComplete(completeAssessment('thin_sample')), true)
assert.equal(isCaseAssessmentComplete(completeAssessment('thin_sample'), 80), true)
assert.equal(
  isCaseAssessmentComplete({ ...completeAssessment('thin_sample'), userStatement: 'zu kurz' }, 80),
  false,
)

const cfgRequired = resolveEvidenceAssessmentConfig({
  mechanic: 'evidence_assessment',
  user_statement_min_chars: 80,
})
assert.equal(cfgRequired.userStatementMinChars, 80)
assert.notEqual(
  validateEvidenceAssessmentAnswers(cfgRequired, {
    [cfgRequired.assessmentsKey]: Object.fromEntries(
      cfgRequired.cases.map((item) => [item.id, { ...completeAssessment(item.id), userStatement: 'kurz' }]),
    ),
    [cfgRequired.microfeedbackKey]: 'sample',
    [cfgRequired.stageKey]: 'complete',
  }),
  null,
)

const incompleteAnswers = {
  [cfg.assessmentsKey]: { thin_sample: completeAssessment('thin_sample') },
}
assert.notEqual(validateEvidenceAssessmentAnswers(cfg, incompleteAnswers), null)

const completeAnswers = {
  [cfg.assessmentsKey]: Object.fromEntries(cfg.cases.map((item) => [item.id, completeAssessment(item.id)])),
  [cfg.microfeedbackKey]: 'sample',
  [cfg.stageKey]: 'complete',
}
assert.equal(validateEvidenceAssessmentAnswers(cfg, completeAnswers), null)

const persisted = JSON.parse(JSON.stringify({
  [cfg.assessmentsKey]: { thin_sample: completeAssessment('thin_sample') },
  [cfg.caseIndexKey]: 0,
  [cfg.stepKey]: 'overall',
  [cfg.stageKey]: 'assess',
}))
assert.equal(readAssessments(persisted, cfg.assessmentsKey).thin_sample.overallStrength, 'suggestive')
assert.equal(persisted[cfg.stepKey], 'overall')

const afterSidequest = appendSidequest(persisted, {
  id: 'sq1',
  type: 'special_teams_sidequest',
  category: 'special_teams',
  gameState: 'power_play',
  miniDrillId: 'mini',
  phase: 'P1',
  answers: { note: 'pp' },
  createdAt: '2026-08-18T00:00:00.000Z',
})
assert.equal(afterSidequest[cfg.assessmentsKey].thin_sample.strongestSupportedStatement, 'a')
assert.equal(afterSidequest[cfg.stepKey], 'overall')

console.log('evidenceAssessment evidenceLogic tests OK')
