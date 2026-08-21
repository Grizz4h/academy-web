import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import { resolveShiftTrackerConfig, validateShiftTrackerAnswers } from '../shiftTracker/shiftLogic.ts'
import { resolveRoleIdentificationConfig } from '../roleIdentification/roleLogic.ts'
import {
  canAddObservation,
  canEvaluateObservations,
  computePlayerRelationResult,
  draftToObservation,
  emptyRelationDraft,
  findCompletedRelationAnswers,
  observationToDraft,
  resolvePlayerRelationConfig,
  resultHasNumericScore,
  validatePlayerRelationAnswers,
} from './relationLogic.ts'

const off = resolvePlayerRelationConfig({ mechanic: 'shift_tracker' })
assert.equal(off.required, false)

const cfg = resolvePlayerRelationConfig({
  mechanic: 'player_relation',
  focalRole: 'center',
  focalRoleLabel: 'Center',
  minObservations: 3,
  recommendedObservations: 4,
  maxObservations: 5,
})
assert.equal(cfg.required, true)
assert.equal(cfg.focalRole, 'center')
assert.equal(cfg.minObservations, 3)
assert.equal(cfg.recommendedObservations, 4)
assert.equal(cfg.maxObservations, 5)
assert.equal(canAddObservation(5, 5), false)
assert.equal(canAddObservation(4, 5), true)
assert.equal(canEvaluateObservations(2, 3), false)
assert.equal(canEvaluateObservations(3, 3), true)
assert.equal(canEvaluateObservations(4, 3), true)
assert.equal(canEvaluateObservations(6, 3), true)

assert.equal(draftToObservation(emptyRelationDraft(), 0, 'center'), null)
assert.equal(
  draftToObservation({ puckCarrierRole: 'defense', focalPosition: 'middle', relation: '' }, 0, 'center'),
  null,
)

const saved = draftToObservation(
  { puckCarrierRole: 'defense', focalPosition: 'middle', relation: 'direct_option' },
  0,
  'center',
)
assert.equal(saved?.puckCarrierRole, 'defense')
assert.equal(saved?.focalRole, 'center')
assert.equal(saved?.focalPosition, 'middle')
assert.equal(saved?.relation, 'direct_option')
assert.deepEqual(observationToDraft(saved!), {
  puckCarrierRole: 'defense',
  focalPosition: 'middle',
  relation: 'direct_option',
})

const unclear = draftToObservation(
  { puckCarrierRole: 'defense', focalPosition: 'unclear', relation: 'unclear' },
  1,
  'center',
)
assert.equal(unclear?.focalPosition, 'unclear')
assert.equal(unclear?.relation, 'unclear')

const observations = [
  { id: 'a', order: 1, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'middle', relation: 'direct_option' },
  { id: 'b', order: 2, puckCarrierRole: 'wing', focalRole: 'center', focalPosition: 'low', relation: 'coverage' },
  { id: 'c', order: 3, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'middle', relation: 'next_option' },
  { id: 'd', order: 4, puckCarrierRole: 'center', focalRole: 'center', focalPosition: 'high', relation: 'direct_option' },
]
const result = computePlayerRelationResult(observations, cfg)
assert.equal(result.observationCount, 4)
assert.equal(result.relationCounts.direct_option, 2)
assert.equal(result.relationCounts.next_option, 1)
assert.equal(result.relationCounts.coverage, 1)
assert.equal(result.positionCounts.middle, 2)
assert.equal(result.puckCarrierCounts.defense, 2)
assert.equal(result.unclearCount, 0)
assert.equal(result.relationVariety, 'Du hast unterschiedliche Arten von Verbindung beobachtet.')
assert.equal(result.relationVariety.includes('überwiegend'), false)
assert.equal(resultHasNumericScore(result), false)
assert.equal('score' in result, false)
assert.equal(JSON.stringify(result).includes('%'), false)

const two = observations.slice(0, 2)
assert.equal(
  validatePlayerRelationAnswers(cfg, { [cfg.logsKey]: two }),
  'Bitte mache mindestens 3 Situationen.',
)
assert.equal(
  validatePlayerRelationAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.stageKey]: 'complete',
  }),
  'Bitte beantworte, welche Verbindung dir am leichtesten aufgefallen ist.',
)
assert.equal(
  validatePlayerRelationAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.patternKey]: 'direct_option',
    [cfg.stageKey]: 'complete',
  }),
  null,
)

const missingRelation = [
  { id: 'a', order: 1, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'middle', relation: '' },
  { id: 'b', order: 2, puckCarrierRole: 'wing', focalRole: 'center', focalPosition: 'low', relation: 'coverage' },
  { id: 'c', order: 3, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'high', relation: 'direct_option' },
]
assert.equal(
  validatePlayerRelationAnswers(cfg, {
    [cfg.logsKey]: missingRelation,
    [cfg.patternKey]: 'coverage',
    [cfg.stageKey]: 'complete',
  }),
  'Bitte wähle für jede Situation Puckführer, Position und Verbindung.',
)

const d3 = resolveShiftTrackerConfig({
  mechanic: 'shift_tracker',
  showFunctionField: true,
  minObservations: 3,
  recommendedObservations: 4,
  maxObservations: 5,
  hardestOptions: [],
  patternOptions: [{ id: 'partly', label: 'teilweise' }],
})
const d3Answers = {
  [d3.logsKey]: [
    { id: 'a', order: 1, position: 'middle', roleFunction: 'connecting' },
    { id: 'b', order: 2, position: 'low', roleFunction: 'securing' },
    { id: 'c', order: 3, position: 'high', roleFunction: 'advancing' },
  ],
  [d3.patternKey]: 'partly',
  [d3.stageKey]: 'complete',
}
assert.equal(validateShiftTrackerAnswers(d3, d3Answers), null)
assert.equal(findCompletedRelationAnswers(cfg, d3Answers, { drafts: { P1: d3Answers }, checkins: [] }), null)
assert.equal(
  validatePlayerRelationAnswers(cfg, {
    [cfg.logsKey]: d3Answers[d3.logsKey],
    [cfg.patternKey]: 'direct_option',
    [cfg.stageKey]: 'complete',
  }),
  'Bitte wähle für jede Situation Puckführer, Position und Verbindung.',
)

const completed = {
  [cfg.logsKey]: observations.slice(0, 3),
  [cfg.patternKey]: 'next_option',
  [cfg.stageKey]: 'complete',
}
assert.equal(
  findCompletedRelationAnswers(cfg, {}, { drafts: { P1: completed }, checkins: [] })?.[cfg.stageKey],
  'complete',
)

const wingCfg = resolvePlayerRelationConfig({
  mechanic: 'player_relation',
  focalRole: 'wing',
  focalRoleLabel: 'Wing',
})
assert.equal(wingCfg.focalRole, 'wing')
assert.equal(
  draftToObservation({ puckCarrierRole: 'center', focalPosition: 'high', relation: 'next_option' }, 0, wingCfg.focalRole)?.focalRole,
  'wing',
)

assert.equal(
  deriveMechanicIdsFromSession({
    id: 's1',
    user: 'tobi',
    created_at: '2026-08-20T00:00:00Z',
    state: 'COMPLETED',
    module_id: 'A1',
    drill_id: 'A1_D4',
    drills: [{ id: 'A1_D4', drill_type: 'player_relation' }],
    checkins: [{ phase: 'P1', answers: { player_relation_observations: observations, player_relation_result: result } }],
  } as any).includes('player_relation'),
  true,
)

const curriculum = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'))
const a1 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A1')
const a1d1 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D1')
const a1d2 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D2')
const a1d3 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D3')
const a1d4 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D4')
assert.equal(a1d1.config.mechanic, 'role_identification')
assert.equal(resolveRoleIdentificationConfig(a1d1.config).required, true)
assert.equal(a1d2.config.mechanic, 'shift_tracker')
assert.equal(a1d2.config.showFunctionField, false)
assert.equal(a1d3.config.showFunctionField, true)
assert.equal(a1d4.drill_type, 'player_relation')
assert.equal(a1d4.config.mechanic, 'player_relation')
assert.equal(a1d4.config.minObservations, 3)
assert.equal(a1d4.config.maxObservations, 5)
assert.equal(a1d4.config.focalRole, 'center')

const mechanicDir = dirname(fileURLToPath(import.meta.url))
for (const file of ['relationLogic.ts', 'PlayerRelationDrill.tsx', 'PlayerRelationSummary.tsx', 'types.ts']) {
  const src = readFileSync(join(mechanicDir, file), 'utf8')
  assert.equal(src.includes('A1_D'), false, `${file} must not special-case A1 drills`)
}

const css = readFileSync(join(mechanicDir, 'PlayerRelationSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.equal(css.includes('chart'), false)
const drillCss = readFileSync(join(mechanicDir, 'PlayerRelationDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.match(drillCss, /hover: hover/)
assert.match(drillCss, /min-height: 44px/)

console.log('playerRelation relationLogic tests OK')
