import assert from 'node:assert/strict'
import { appendSidequest } from '../../utils/sessionSidequests.ts'
import {
  CLAIM_LEVELS,
  buildEvidenceProfile,
  emptyDraft,
  isDraftComplete,
  mapsEvidenceToClaim,
  neverAutoSupportsCausal,
  readProfiles,
  resolveClaimLadderConfig,
  validateClaimLadderAnswers,
} from './claimLogic.ts'
import type { ClaimLadderDraft, ClaimLevel } from './types.ts'

const cfg = resolveClaimLadderConfig({
  mechanic: 'claim_ladder',
  cases: ['support_exits', 'thin_overlap', 'clear_gap'],
})

assert.equal(cfg.cases.length, 3)
assert.equal(cfg.cases[0].id, 'support_exits')
assert.equal(cfg.cases[1].id, 'thin_overlap')
assert.equal(cfg.cases[2].id, 'clear_gap')
assert.deepEqual(CLAIM_LEVELS, ['description', 'comparison', 'tendency', 'generalization', 'causal'])

const support = cfg.cases[0]
assert.equal(support.evidenceInput.sampleSize, 17)
assert.deepEqual(support.evidenceInput.targetCounts, [6, 2])
assert.equal(support.evidenceInput.differencePercentagePoints, 42)
assert.ok(support.contextNotes?.some((note) => note.includes('Forecheckdruck')))

const thin = cfg.cases[1]
assert.deepEqual(thin.evidenceInput.targetCounts, [5, 4])
assert.equal(thin.evidenceInput.differencePercentagePoints, 6)

const solid = cfg.cases[2]
assert.deepEqual(solid.evidenceInput.targetCounts, [12, 4])
assert.equal(solid.evidenceInput.differencePercentagePoints, 40)

assert.equal(mapsEvidenceToClaim('suggestive', 'comparison'), false)
assert.equal(neverAutoSupportsCausal([
  ...cfg.cases.flatMap((item) => Object.values(item.ceilingFeedback || {})),
  cfg.decisionRule,
  cfg.coreHint,
]), true)
assert.equal(
  /causal claim supported/i.test(JSON.stringify(cfg.cases[0].ceilingFeedback)),
  false,
)

function completeDraft(caseId: string, claim: ClaimLevel = 'tendency'): ClaimLadderDraft {
  return {
    caseId,
    descriptiveChoice: 'fractions',
    evidenceStrength: 'suggestive',
    maxClaimLevel: claim,
    primaryLimitation: 'small_sample',
    counterEvidence: '2 kontrollierte Exits gelangen ohne Support',
    finalClaim: 'In dieser Stichprobe trat das Target mit Support häufiger auf, ohne eine Ursache zu behaupten.',
    nextObservationTest: 'Weitere Exit-Versuche mit und ohne Support bei vergleichbarem Forecheckdruck.',
    falsificationCondition: 'Der Unterschied verschwindet bei gleichem Druck.',
  }
}

const mixed: ClaimLadderDraft = {
  ...completeDraft('support_exits', 'comparison'),
  evidenceStrength: 'suggestive',
  maxClaimLevel: 'comparison',
}
assert.notEqual(mixed.evidenceStrength, mixed.maxClaimLevel)
assert.equal(isDraftComplete(mixed, cfg), true)

const otherDraft: ClaimLadderDraft = {
  ...completeDraft('support_exits'),
  primaryLimitation: 'other',
  primaryLimitationOther: 'Shift-Länge war ungleich',
}
const otherProfile = buildEvidenceProfile(support, otherDraft)
assert.equal(otherProfile.primaryLimitation, 'Shift-Länge war ungleich')
assert.equal(otherProfile.schemaVersion, 1)
assert.equal(otherProfile.evidenceStrength, 'suggestive')
assert.equal(otherProfile.maxClaimLevel, 'tendency')

const profile = buildEvidenceProfile(support, completeDraft('support_exits', 'tendency'))
assert.equal(profile.question, support.question)
assert.equal(profile.sampleSummary.total, 17)
assert.equal(profile.counterEvidence?.[0].includes('ohne Support'), true)
assert.notEqual(profile.finalClaim, profile.counterEvidence?.[0])
assert.ok(profile.nextObservationTest.length >= cfg.nextTestMinChars)
assert.equal(profile.falsificationCondition?.includes('Druck'), true)

assert.equal(isDraftComplete(emptyDraft('support_exits'), cfg), false)
assert.notEqual(validateClaimLadderAnswers(cfg, { [cfg.profilesKey]: {} }), null)

const completeAnswers = {
  [cfg.profilesKey]: {
    support_exits: completeDraft('support_exits', 'tendency'),
    thin_overlap: { ...completeDraft('thin_overlap', 'description'), counterEvidence: 'Der Abstand beträgt nur wenige Prozentpunkte' },
    clear_gap: { ...completeDraft('clear_gap', 'comparison'), counterEvidence: '4 Target-Fälle in Gruppe B' },
  },
  [cfg.microfeedbackKey]: 'sample',
  [cfg.profileKey]: profile,
}
assert.equal(validateClaimLadderAnswers(cfg, completeAnswers), null)

for (const level of CLAIM_LEVELS) {
  const stored = { maxClaimLevel: level }
  assert.equal(stored.maxClaimLevel, level)
}

const persisted = JSON.parse(JSON.stringify({
  [cfg.profilesKey]: { support_exits: completeDraft('support_exits') },
  [cfg.caseIndexKey]: 0,
  [cfg.stepKey]: 'claim',
  [cfg.stageKey]: 'assess',
  [cfg.profileKey]: profile,
}))
assert.equal(readProfiles(persisted, cfg.profilesKey).support_exits.maxClaimLevel, 'tendency')
assert.equal(persisted[cfg.profileKey].finalClaim, profile.finalClaim)
assert.equal(persisted[cfg.stepKey], 'claim')

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
assert.equal(afterSidequest[cfg.profilesKey].support_exits.nextObservationTest, completeDraft('support_exits').nextObservationTest)
assert.equal(afterSidequest[cfg.profileKey].evidenceStrength, 'suggestive')

console.log('claimLadder claimLogic tests OK')
