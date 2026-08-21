import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import {
  canAddObservation,
  canEvaluateObservations,
  computeShiftTrackerResult,
  draftToObservation,
  emptyShiftDraft,
  findCompletedShiftAnswers,
  guidanceForIndex,
  observationToDraft,
  resolveShiftTrackerConfig,
  resultHasNumericScore,
  validateShiftTrackerAnswers,
} from './shiftLogic.ts'

const off = resolveShiftTrackerConfig({ shift_count: 10, questions: [{ key: 'shift_marker' }] })
assert.equal(off.required, false)
assert.equal(off.showTriggerField, true)
assert.equal(off.showFunctionField, false)
assert.equal(off.functionOptions.length, 0)
assert.equal(off.minObservations, 10)

const cfg = resolveShiftTrackerConfig({
  mechanic: 'shift_tracker',
  showTriggerField: false,
  markerLogging: false,
  minObservations: 4,
  recommendedObservations: 5,
  maxObservations: 6,
  guidanceTiers: [
    { maxIndex: 1, reminderLevel: 'full', guidance: 'Center gefunden? Jetzt nur Low / Middle / High.' },
    { maxIndex: 3, reminderLevel: 'compact', guidance: 'Nur noch die Höhe.' },
    { maxIndex: 99, reminderLevel: 'minimal', guidance: 'Wo ist er?' },
  ],
})
assert.equal(cfg.required, true)
assert.equal(cfg.showTriggerField, false)
assert.equal(cfg.showFunctionField, false)
assert.equal(cfg.functionOptions.length, 0)
assert.equal(cfg.minObservations, 4)
assert.equal(cfg.recommendedObservations, 5)
assert.equal(cfg.maxObservations, 6)
assert.equal(guidanceForIndex(cfg, 0)?.reminderLevel, 'full')
assert.equal(guidanceForIndex(cfg, 1)?.reminderLevel, 'full')
assert.equal(guidanceForIndex(cfg, 2)?.reminderLevel, 'compact')
assert.equal(guidanceForIndex(cfg, 3)?.reminderLevel, 'compact')
assert.equal(guidanceForIndex(cfg, 4)?.guidance, 'Wo ist er?')

assert.equal(canAddObservation(5, 6), true)
assert.equal(canAddObservation(6, 6), false)
assert.equal(canEvaluateObservations(3, 4), false)
assert.equal(canEvaluateObservations(4, 4), true)

assert.equal(draftToObservation(emptyShiftDraft(), 0), null)
assert.equal(draftToObservation({ position: 'low', trigger: '', roleFunction: '' }, 0, undefined, false)?.position, 'low')
assert.equal(draftToObservation({ position: 'low', trigger: '', roleFunction: '' }, 0, undefined, true), null)

const result = computeShiftTrackerResult(
  [
    { id: 'a', order: 1, position: 'low' },
    { id: 'b', order: 2, position: 'middle' },
    { id: 'c', order: 3, position: 'middle' },
    { id: 'd', order: 4, position: 'high' },
    { id: 'e', order: 5, position: 'unsure' },
  ],
  cfg.positionOptions,
)
assert.equal(result.observationCount, 5)
assert.equal(result.positionCounts.low, 1)
assert.equal(result.positionCounts.middle, 2)
assert.equal(result.positionCounts.high, 1)
assert.equal(result.positionCounts.unsure, 1)
assert.equal(result.functionVariety, '')
assert.equal(resultHasNumericScore(result), false)
assert.equal('score' in result, false)
assert.equal(JSON.stringify(result).includes('%'), false)

const fourScans = [
  { id: 'a', order: 1, position: 'low' },
  { id: 'b', order: 2, position: 'middle' },
  { id: 'c', order: 3, position: 'high' },
  { id: 'd', order: 4, position: 'unsure' },
]
assert.equal(
  validateShiftTrackerAnswers(cfg, { [cfg.logsKey]: fourScans }),
  'Bitte wähle, was dir beim Wiederfinden aufgefallen ist.',
)
assert.equal(
  validateShiftTrackerAnswers(cfg, {
    [cfg.logsKey]: fourScans,
    [cfg.patternKey]: 'faster',
    [cfg.stageKey]: 'reflect',
  }),
  'Bitte schließe die Scans vollständig ab.',
)
assert.equal(
  validateShiftTrackerAnswers(cfg, {
    [cfg.logsKey]: fourScans,
    [cfg.patternKey]: 'faster',
    [cfg.stageKey]: 'complete',
  }),
  null,
)

const completedAnswers = {
  [cfg.logsKey]: fourScans,
  [cfg.patternKey]: 'faster',
  [cfg.stageKey]: 'complete',
}
assert.equal(
  findCompletedShiftAnswers(cfg, {}, { drafts: { P1: completedAnswers }, checkins: [] })?.[cfg.stageKey],
  'complete',
)

assert.equal(
  deriveMechanicIdsFromSession({
    id: 's1',
    user: 'tobi',
    created_at: '2026-08-20T00:00:00Z',
    state: 'COMPLETED',
    module_id: 'A1',
    drill_id: 'A1_D2',
    drills: [{ id: 'A1_D2', drill_type: 'shift_tracker' }],
    checkins: [{ phase: 'P1', answers: { shift_tracker_observations: fourScans, shift_tracker_result: result } }],
  } as any).includes('shift_tracker'),
  true,
)

const d3 = resolveShiftTrackerConfig({
  mechanic: 'shift_tracker',
  showTriggerField: false,
  showFunctionField: true,
  minObservations: 3,
  recommendedObservations: 4,
  maxObservations: 5,
  hardestOptions: [],
  patternOptions: [
    { id: 'clearly', label: 'ja, deutlich' },
    { id: 'partly', label: 'teilweise' },
    { id: 'not_yet', label: 'noch nicht' },
    { id: 'unclear', label: 'unklar' },
  ],
  patternRequiredMessage: 'Bitte beantworte die Reflexionsfrage.',
})
assert.equal(d3.showFunctionField, true)
assert.equal(d3.showTriggerField, false)
assert.equal(d3.minObservations, 3)
assert.equal(d3.recommendedObservations, 4)
assert.equal(d3.maxObservations, 5)
assert.equal(d3.functionOptions.map((option) => option.id).join(','), 'securing,connecting,advancing,unclear')
assert.equal(d3.hardestOptions.length, 0)
assert.equal(
  draftToObservation({ position: 'middle', trigger: '', roleFunction: '' }, 0, undefined, { requireFunction: true }),
  null,
)
assert.equal(
  draftToObservation({ position: 'middle', trigger: '', roleFunction: 'unclear' }, 0, undefined, { requireFunction: true })?.roleFunction,
  'unclear',
)

const functionObservations = [
  { id: 'a', order: 1, position: 'low', roleFunction: 'securing' },
  { id: 'b', order: 2, position: 'middle', roleFunction: 'connecting' },
  { id: 'c', order: 3, position: 'middle', roleFunction: 'unclear' },
  { id: 'd', order: 4, position: 'high', roleFunction: 'connecting' },
]
const functionResult = computeShiftTrackerResult(functionObservations, d3.positionOptions, d3.functionOptions)
assert.equal(functionResult.observationCount, 4)
assert.equal(functionResult.positionCounts.middle, 2)
assert.equal(functionResult.functionCounts.connecting, 2)
assert.equal(functionResult.functionCounts.securing, 1)
assert.equal(functionResult.functionCounts.unclear, 1)
assert.equal(functionResult.functionVariety, 'Du hast dieselbe Rolle in unterschiedlichen Funktionen beobachtet.')
assert.equal(functionResult.functionVariety.includes('überwiegend'), false)
assert.equal(JSON.stringify(functionResult).includes('überwiegend'), false)
assert.equal(resultHasNumericScore(functionResult), false)

const sameFunction = computeShiftTrackerResult(
  [
    { id: 'a', order: 1, position: 'low', roleFunction: 'connecting' },
    { id: 'b', order: 2, position: 'high', roleFunction: 'connecting' },
    { id: 'c', order: 3, position: 'middle', roleFunction: 'connecting' },
  ],
  d3.positionOptions,
  d3.functionOptions,
)
assert.equal(sameFunction.functionVariety, 'Position und Funktion können sich von Situation zu Situation verändern.')

assert.equal(
  validateShiftTrackerAnswers(d3, {
    [d3.logsKey]: [
      { id: 'a', order: 1, position: 'middle' },
      { id: 'b', order: 2, position: 'low' },
      { id: 'c', order: 3, position: 'high' },
    ],
    [d3.patternKey]: 'clearly',
    [d3.stageKey]: 'complete',
  }),
  'Bitte wähle für jede Situation eine Funktion.',
)
assert.equal(
  validateShiftTrackerAnswers(d3, {
    [d3.logsKey]: functionObservations,
    [d3.stageKey]: 'complete',
  }),
  'Bitte beantworte die Reflexionsfrage.',
)
assert.equal(
  validateShiftTrackerAnswers(d3, {
    [d3.logsKey]: functionObservations,
    [d3.patternKey]: 'partly',
    [d3.stageKey]: 'complete',
  }),
  null,
)

assert.equal(
  validateShiftTrackerAnswers(d3, {
    [d3.logsKey]: fourScans,
    [d3.patternKey]: 'clearly',
    [d3.stageKey]: 'complete',
  }),
  'Bitte wähle für jede Situation eine Funktion.',
)
assert.equal(
  validateShiftTrackerAnswers(cfg, {
    [cfg.logsKey]: functionObservations.slice(0, 3),
    [cfg.patternKey]: 'faster',
    [cfg.stageKey]: 'complete',
  }),
  'Bitte mache mindestens 4 Scans.',
)

const reloaded = draftToObservation(
  { position: 'middle', trigger: '', roleFunction: 'connecting' },
  2,
  undefined,
  { requireFunction: true },
)
assert.equal(reloaded?.roleFunction, 'connecting')
assert.deepEqual(observationToDraft(reloaded!), {
  position: 'middle',
  trigger: '',
  roleFunction: 'connecting',
})

assert.equal(
  findCompletedShiftAnswers(d3, {}, { drafts: { P1: completedAnswers }, checkins: [] }),
  null,
)
assert.equal(
  findCompletedShiftAnswers(d3, {}, {
    drafts: {
      P1: {
        [d3.logsKey]: functionObservations,
        [d3.patternKey]: 'partly',
        [d3.stageKey]: 'complete',
      },
    },
    checkins: [],
  })?.[d3.stageKey],
  'complete',
)

const mechanicDir = dirname(fileURLToPath(import.meta.url))
for (const file of ['shiftLogic.ts', 'ShiftTrackerDrill.tsx', 'ShiftTrackerSummary.tsx', 'types.ts']) {
  const src = readFileSync(join(mechanicDir, file), 'utf8')
  assert.equal(src.includes('A1_D'), false, `${file} must not special-case A1 drills`)
}

const curriculum = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'))
const a1 = curriculum.tracks[0].modules.find((module) => module.id === 'A1')
const a1d2 = a1.drills.find((drill) => drill.id === 'A1_D2')
const a1d3 = a1.drills.find((drill) => drill.id === 'A1_D3')
const a1d4 = a1.drills.find((drill) => drill.id === 'A1_D4')
assert.equal(a1d2.config.showFunctionField, false)
assert.equal(a1d3.drill_type, 'shift_tracker')
assert.equal(a1d3.config.mechanic, 'shift_tracker')
assert.equal(a1d3.config.showFunctionField, true)
assert.equal(a1d3.config.minObservations, 3)
assert.equal(a1d3.config.maxObservations, 5)
assert.equal(guidanceForIndex(resolveShiftTrackerConfig(a1d3.config), 0)?.guidance.includes('Hauptfunktion'), true)
assert.notEqual(a1d4.drill_type, 'shift_tracker')
assert.notEqual(a1d4.config.mechanic, 'shift_tracker')

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ShiftTrackerSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.equal(css.includes('chart'), false)
const drillCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ShiftTrackerDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.match(drillCss, /hover: hover/)

console.log('shiftTracker shiftLogic tests OK')
