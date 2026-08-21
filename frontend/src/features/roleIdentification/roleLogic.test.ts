import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import {
  canAddObservation,
  canEvaluateObservations,
  computeRoleIdentificationResult,
  draftToObservation,
  emptyRoleDraft,
  findCompletedRoleAnswers,
  observationStepForIndex,
  resolveRoleIdentificationConfig,
  resultHasNumericScore,
  showsLineupHint,
  showsSearchAnchors,
  validateRoleIdentificationAnswers,
} from './roleLogic.ts'

const off = resolveRoleIdentificationConfig({ questions: [{ key: 'guessed_center' }] })
assert.equal(off.required, false)
assert.equal(off.guidanceMode, 'blind')

const cfg = resolveRoleIdentificationConfig({
  mechanic: 'role_identification',
  guidanceMode: 'guided',
  targetRole: 'center',
  targetRoleLabel: 'Center',
  minObservations: 2,
  recommendedObservations: 3,
  maxObservations: 4,
  observationSteps: [
    { id: 'help', title: 'Mit Hilfe', guidance: 'Nummer nutzen.' },
    { id: 'relocate', title: 'Wiederfinden', guidance: 'Denselben Spieler wiederfinden.' },
    { id: 'behavior', title: 'Verhalten', guidance: 'Zuerst über Verhalten suchen.' },
  ],
  searchAnchors: [
    { id: 'support', label: 'Support', hint: 'Wer unterstützt innen?' },
  ],
})
assert.equal(cfg.required, true)
assert.equal(cfg.guidanceMode, 'guided')
assert.equal(cfg.minObservations, 2)
assert.equal(cfg.recommendedObservations, 3)
assert.equal(cfg.maxObservations, 4)
assert.equal(showsLineupHint(cfg.guidanceMode), true)
assert.equal(showsSearchAnchors(cfg.guidanceMode), true)
assert.equal(showsLineupHint('blind'), false)
assert.equal(showsSearchAnchors('blind'), false)
assert.equal(showsSearchAnchors('assisted'), true)
assert.equal(observationStepForIndex(cfg, 0)?.id, 'help')
assert.equal(observationStepForIndex(cfg, 1)?.id, 'relocate')
assert.equal(observationStepForIndex(cfg, 2)?.id, 'behavior')
assert.equal(observationStepForIndex(cfg, 3)?.id, 'behavior')

assert.equal(canAddObservation(3, 4), true)
assert.equal(canAddObservation(4, 4), false)
assert.equal(canEvaluateObservations(1, 2), false)
assert.equal(canEvaluateObservations(2, 2), true)

const incomplete = draftToObservation(emptyRoleDraft(), 0)
assert.equal(incomplete, null)
const saved = draftToObservation({ found: 'with_help', helpfulHint: 'support', note: '' }, 0, undefined, 'help')
assert.equal(saved?.found, 'with_help')
assert.equal(saved?.stepId, 'help')

const result = computeRoleIdentificationResult([
  { id: 'a', order: 1, found: 'yes', helpfulHint: 'support' },
  { id: 'b', order: 2, found: 'with_help', helpfulHint: 'support' },
  { id: 'c', order: 3, found: 'unsure', helpfulHint: 'lineup' },
])
assert.equal(result.observationCount, 3)
assert.equal(result.foundCounts.yes, 1)
assert.equal(result.foundCounts.with_help, 1)
assert.equal(result.foundCounts.unsure, 1)
assert.equal(result.hintCounts.support, 2)
assert.equal(resultHasNumericScore(result), false)
assert.equal(JSON.stringify(result).includes('%'), false)
assert.equal('score' in result, false)
assert.equal('accuracy' in result, false)

assert.equal(
  validateRoleIdentificationAnswers(cfg, { [cfg.logsKey]: [saved] }),
  'Bitte beobachte den Center in mindestens 2 Situationen.',
)
assert.equal(
  validateRoleIdentificationAnswers(cfg, {
    [cfg.logsKey]: [
      { id: 'a', order: 1, found: 'yes', helpfulHint: 'support' },
      { id: 'b', order: 2, found: 'with_help', helpfulHint: 'lineup' },
    ],
    [cfg.stageKey]: 'reflect',
  }),
  'Bitte schließe die Rollenidentifikation vollständig ab.',
)
assert.equal(
  validateRoleIdentificationAnswers(cfg, {
    [cfg.logsKey]: [
      { id: 'a', order: 1, found: 'yes', helpfulHint: 'support' },
      { id: 'b', order: 2, found: 'with_help', helpfulHint: 'lineup' },
    ],
    [cfg.stageKey]: 'complete',
  }),
  null,
)

const completedAnswers = {
  [cfg.logsKey]: [
    { id: 'a', order: 1, found: 'yes', helpfulHint: 'support' },
    { id: 'b', order: 2, found: 'with_help', helpfulHint: 'lineup' },
  ],
  [cfg.stageKey]: 'complete',
}
assert.equal(
  findCompletedRoleAnswers(cfg, {}, { drafts: { P1: completedAnswers }, checkins: [] })?.[cfg.stageKey],
  'complete',
)

assert.equal(
  deriveMechanicIdsFromSession({
    id: 's1',
    user: 'tobi',
    created_at: '2026-08-20T00:00:00Z',
    state: 'COMPLETED',
    module_id: 'A1',
    drill_id: 'A1_D1',
    drills: [{ id: 'A1_D1', drill_type: 'role_identification' }],
    checkins: [{ phase: 'P1', answers: { role_identification_observations: [saved], role_identification_result: result } }],
  } as any).includes('role_identification'),
  true,
)

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'RoleIdentificationSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.equal(css.includes('chart'), false)
const drillCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'RoleIdentificationDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.match(drillCss, /hover: hover/)
assert.equal(drillCss.includes('overflow-x: auto'), false)

console.log('roleIdentification roleLogic tests OK')
