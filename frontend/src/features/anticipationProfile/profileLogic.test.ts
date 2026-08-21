import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Session } from '../../api.ts'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import type { AnticipationObservation } from '../anticipationRead/types.ts'
import {
  collectAnticipationObservations,
  computeAnticipationProfile,
  describeDecisionFlexibility,
  payloadHasPii,
  profileHasScore,
  resolveAnticipationProfileConfig,
  toReflectionPayload,
  validateAnticipationProfileAnswers,
} from './profileLogic.ts'

const cfg = resolveAnticipationProfileConfig({
  mechanic: 'anticipation_profile',
  minReadsForProfile: 20,
  sourceDrillIds: ['E4_D1', 'E4_D2', 'E4_D3', 'E4_D4'],
})
assert.equal(cfg.mechanic, 'anticipation_profile')
assert.equal(cfg.minReadsForProfile, 20)
assert.equal(cfg.sourceDrillIds.length, 4)

function cue(category: string, label: string, priority?: 'primary' | 'supporting' | 'secondary'): AnticipationObservation['supportingCues'][number] {
  return { id: `${category}-${label}`, category, label, priority }
}

function read(patch: Partial<AnticipationObservation> & { id: string }): AnticipationObservation {
  return {
    order: 1,
    expectedAction: 'Pass',
    confidence: 'medium',
    supportingCues: [cue('support', 'Center frei', 'primary')],
    ...patch,
  }
}

const supportHeavy: AnticipationObservation[] = [
  read({ id: 'r1', supportingCues: [cue('support', 'A', 'primary'), cue('pressure', 'B', 'supporting')] }),
  read({ id: 'r2', supportingCues: [cue('support', 'C', 'primary')] }),
  read({ id: 'r3', supportingCues: [cue('pressure', 'D', 'primary')] }),
  read({ id: 'r4', supportingCues: [cue('support', 'E', 'primary'), cue('positioning', 'F', 'secondary')] }),
]

const profile = computeAnticipationProfile(supportHeavy, cfg, ['E4_D2'])
assert.equal(profile.cuePatterns.frequentlyUsed[0], 'support')
assert.equal(profile.cuePatterns.frequentlyUsed.includes('support'), true)
assert.equal(profile.cuePatterns.rarelyUsed.includes('timing'), true)
assert.equal(profile.cuePatterns.rarelyUsed.includes('support'), false)
assert.equal(profile.hasEnoughData, false)
assert.equal(profileHasScore(profile), false)
assert.equal(JSON.stringify(profile).includes('%'), false)
assert.equal('skill' in profile, false)
assert.equal('hockeyIQ' in profile, false)
assert.equal(JSON.stringify(profile).toLowerCase().includes('hockey iq'), false)
assert.equal(JSON.stringify(profile).includes('Anticipation Level'), false)

const withUpdates: AnticipationObservation[] = [
  read({ id: 'u1', updateDecision: 'change', updateTriggers: [{ id: 't1', description: 'Passlinie geschlossen' }], alternativeAction: 'Carry' }),
  read({ id: 'u2', updateDecision: 'change', updateTriggers: [{ id: 't2', description: 'Passlinie geschlossen' }], alternativeAction: 'Carry' }),
  read({ id: 'u3', updateDecision: 'keep', updateTriggers: [{ id: 't3', description: 'leichter Druck' }], alternativeAction: 'Dump' }),
]
const updateProfile = computeAnticipationProfile(withUpdates, cfg, [])
assert.equal(updateProfile.decisionPatterns.changeCount, 2)
assert.equal(updateProfile.decisionPatterns.keepCount, 1)
assert.equal(updateProfile.updatePatterns.commonTriggers[0], 'Passlinie geschlossen')
assert.equal(updateProfile.branchPatterns.commonBranches[0], 'Pass → Carry')
assert.match(describeDecisionFlexibility(1, 2), /passt/)
assert.match(describeDecisionFlexibility(3, 1), /ersten? Erwartung/)
assert.equal(describeDecisionFlexibility(3, 1).includes('%'), false)
assert.equal(describeDecisionFlexibility(3, 1).toLowerCase().includes('schlecht'), false)

const enough = computeAnticipationProfile(
  Array.from({ length: 20 }, (_, index) => read({ id: `n${index}` })),
  cfg,
  ['E4_D1'],
)
assert.equal(enough.hasEnoughData, true)
assert.equal(enough.enoughBecause, 'read_count')

const covered = computeAnticipationProfile(supportHeavy, cfg, ['E4_D1', 'E4_D2', 'E4_D3', 'E4_D4'])
assert.equal(covered.hasEnoughData, true)
assert.equal(covered.enoughBecause, 'source_coverage')

const payload = toReflectionPayload(updateProfile, {
  mostHelpfulCueCategory: 'support',
  futureCueCategory: 'timing',
  hardToUpdateWhen: 'rising_pressure',
})
assert.equal(payload.reads, 3)
assert.deepEqual(Object.keys(payload).sort(), ['branchPatterns', 'cuePatterns', 'reads', 'reflectionAnswers', 'updatePatterns'])
assert.equal(payloadHasPii(payload), false)
assert.equal('userId' in payload, false)
assert.equal('email' in payload, false)
assert.equal('username' in payload, false)
assert.equal(JSON.stringify(payload).includes('@'), false)
assert.equal(JSON.stringify(payload).includes('Christoph'), false)

const session: Session = {
  id: 's1',
  user: 'Christoph',
  module_id: 'E4',
  goal: '',
  confidence: 3,
  state: 'COMPLETED',
  created_at: '2026-08-18T00:00:00.000Z',
  drills: [],
  progress: { current_drill_index: 0, completed_drills: [] },
  checkins: [{
    phase: 'P1',
    answers: {
      anticipation_read_observations: supportHeavy,
    },
  }],
  drill_id: 'E4_D2',
}
const dummy: Session = {
  ...session,
  id: 'dummy',
  is_dummy: true,
  drill_id: 'E4_D1',
}
const collected = collectAnticipationObservations([session, dummy], cfg)
assert.equal(collected.length, 4)
assert.equal(collectAnticipationObservations([{ ...session, drill_id: 'E3_D1' }], cfg).length, 0)
assert.equal(
  deriveMechanicIdsFromSession({
    ...session,
    drill_id: 'E4_D5',
    checkins: [{ phase: 'P1', answers: { anticipation_profile: profile, anticipation_profile_payload: payload } }],
  }).includes('anticipation_profile'),
  true,
)

assert.equal(validateAnticipationProfileAnswers(cfg, {}), 'Bitte wähle, welche Hinweise dir aktuell am meisten helfen.')
assert.equal(validateAnticipationProfileAnswers(cfg, {
  [cfg.helpfulCueKey]: 'support',
  [cfg.futureCueKey]: 'timing',
  [cfg.hardToUpdateKey]: 'rising_pressure',
}), null)

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'AnticipationProfileSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.equal(css.includes('chart'), false)
assert.equal(css.includes('radar'), false)
const drillCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'AnticipationProfileDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.equal(drillCss.includes('chart'), false)
assert.equal(drillCss.includes('overflow-x: auto'), false)

console.log('anticipationProfile profileLogic tests OK')
