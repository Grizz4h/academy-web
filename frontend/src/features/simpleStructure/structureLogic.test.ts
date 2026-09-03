import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import { resolvePlayerRelationConfig, validatePlayerRelationAnswers } from '../playerRelation/relationLogic.ts'
import { resolveShiftTrackerConfig } from '../shiftTracker/shiftLogic.ts'
import { resolveRoleIdentificationConfig } from '../roleIdentification/roleLogic.ts'
import {
  canAddObservation,
  canEvaluateObservations,
  computeSimpleStructureResult,
  draftToObservation,
  emptyStructureDraft,
  findCompletedStructureAnswers,
  guidanceForIndex,
  observationToDraft,
  resolveSimpleStructureConfig,
  resultHasNumericScore,
  validateSimpleStructureAnswers,
} from './structureLogic.ts'

const off = resolveSimpleStructureConfig({ mechanic: 'player_relation' })
assert.equal(off.required, false)

const cfg = resolveSimpleStructureConfig({
  mechanic: 'simple_structure',
  focalRole: 'center',
  minObservations: 3,
  recommendedObservations: 4,
  maxObservations: 5,
  supportsUnclear: true,
  guidanceTiers: [
    { maxIndex: 0, guidance: 'Suche zuerst den Center.' },
    { maxIndex: 1, guidance: 'Schau zusätzlich nach einer zweiten Verbindung.' },
    { maxIndex: 99, guidance: 'Welche kleine Struktur erkennst du?' },
  ],
})
assert.equal(cfg.required, true)
assert.equal(cfg.focalRole, 'center')
assert.equal(cfg.minObservations, 3)
assert.equal(cfg.recommendedObservations, 4)
assert.equal(cfg.maxObservations, 5)
assert.equal(cfg.supportsUnclear, true)
assert.equal(cfg.structureOptions.map((option) => option.id).join(','), 'single_option,multiple_options,triangle,coverage_structure,unclear')
assert.equal(guidanceForIndex(cfg, 0)?.guidance, 'Suche zuerst den Center.')
assert.equal(guidanceForIndex(cfg, 1)?.guidance, 'Schau zusätzlich nach einer zweiten Verbindung.')
assert.equal(guidanceForIndex(cfg, 2)?.guidance, 'Welche kleine Struktur erkennst du?')
assert.equal(canAddObservation(4, 5), true)
assert.equal(canAddObservation(5, 5), false)
assert.equal(canAddObservation(6, 5), false)
assert.equal(canEvaluateObservations(2, 3), false)
assert.equal(canEvaluateObservations(3, 3), true)
assert.equal(canEvaluateObservations(4, 3), true)
assert.equal(canEvaluateObservations(5, 3), true)

assert.equal(draftToObservation(emptyStructureDraft(), 0, 'center'), null)
const saved = draftToObservation({ structureType: 'triangle' }, 0, 'center')
assert.equal(saved?.structureType, 'triangle')
assert.equal(saved?.focalRole, 'center')
assert.deepEqual(observationToDraft(saved!), { structureType: 'triangle', note: '' })

const unclear = draftToObservation({ structureType: 'unclear' }, 1, 'center')
assert.equal(unclear?.structureType, 'unclear')

const allTypes = ['single_option', 'multiple_options', 'triangle', 'coverage_structure', 'unclear'] as const
const observations = allTypes.map((structureType, index) => ({
  id: String(index),
  order: index + 1,
  structureType,
  focalRole: 'center',
}))
const four = observations.slice(0, 4)
const result = computeSimpleStructureResult(four, cfg.structureOptions)
assert.equal(result.observationCount, 4)
assert.equal(result.structureCounts.single_option, 1)
assert.equal(result.structureCounts.triangle, 1)
assert.equal(result.unclearCount, 0)
assert.equal(result.structureVariety, 'Du hast unterschiedliche einfache Strukturen beobachtet.')
assert.equal(JSON.stringify(result).includes('häufig'), false)
assert.equal(JSON.stringify(result).includes('überwiegend'), false)
assert.equal(resultHasNumericScore(result), false)

const withUnclear = computeSimpleStructureResult(observations, cfg.structureOptions)
assert.equal(withUnclear.unclearCount, 1)
assert.equal(withUnclear.structureCounts.unclear, 1)

assert.equal(validateSimpleStructureAnswers(cfg, { [cfg.logsKey]: observations.slice(0, 2) }), 'Bitte mache mindestens 3 Situationen.')
assert.equal(
  validateSimpleStructureAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.stageKey]: 'complete',
  }),
  'Bitte beantworte, wann für dich erstmals eine Struktur erkennbar wurde.',
)
assert.equal(
  validateSimpleStructureAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.patternKey]: 'triangle',
    [cfg.stageKey]: 'complete',
  }),
  null,
)

const d4 = resolvePlayerRelationConfig({ mechanic: 'player_relation', minObservations: 3 })
const d4Answers = {
  [d4.logsKey]: [
    { id: 'a', order: 1, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'middle', relation: 'direct_option' },
    { id: 'b', order: 2, puckCarrierRole: 'wing', focalRole: 'center', focalPosition: 'low', relation: 'coverage' },
    { id: 'c', order: 3, puckCarrierRole: 'defense', focalRole: 'center', focalPosition: 'high', relation: 'next_option' },
  ],
  [d4.patternKey]: 'direct_option',
  [d4.stageKey]: 'complete',
}
assert.equal(validatePlayerRelationAnswers(d4, d4Answers), null)
assert.equal(findCompletedStructureAnswers(cfg, d4Answers, { drafts: { P1: d4Answers }, checkins: [] }), null)
assert.equal(
  validateSimpleStructureAnswers(cfg, {
    [cfg.logsKey]: d4Answers[d4.logsKey],
    [cfg.patternKey]: 'triangle',
    [cfg.stageKey]: 'complete',
  }),
  'Bitte wähle für jede Situation eine einfache Struktur.',
)

const completed = {
  [cfg.logsKey]: observations.slice(0, 3),
  [cfg.patternKey]: 'multiple_options',
  [cfg.stageKey]: 'complete',
}
assert.equal(
  findCompletedStructureAnswers(cfg, {}, { drafts: { P1: completed }, checkins: [] })?.[cfg.stageKey],
  'complete',
)

assert.equal(
  deriveMechanicIdsFromSession({
    id: 's1',
    user: 'tobi',
    created_at: '2026-08-20T00:00:00Z',
    state: 'COMPLETED',
    module_id: 'A1',
    drill_id: 'A1_D5',
    drills: [{ id: 'A1_D5', drill_type: 'simple_structure' }],
    checkins: [{ phase: 'P1', answers: { simple_structure_observations: four, simple_structure_result: result } }],
  } as any).includes('simple_structure'),
  true,
)

const noUnclear = resolveSimpleStructureConfig({ mechanic: 'simple_structure', supportsUnclear: false })
assert.equal(noUnclear.structureOptions.some((option) => option.id === 'unclear'), false)

const wingCfg = resolveSimpleStructureConfig({ mechanic: 'simple_structure', focalRole: 'wing' })
assert.equal(draftToObservation({ structureType: 'single_option' }, 0, wingCfg.focalRole)?.focalRole, 'wing')

const curriculum = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'))
const a1 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A1')
const a1d1 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D1')
const a1d2 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D2')
const a1d3 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D3')
const a1d4 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D4')
const a1d5 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D5')
assert.equal(resolveRoleIdentificationConfig(a1d1.config).required, true)
assert.equal(a1d2.config.showFunctionField, false)
assert.equal(resolveShiftTrackerConfig(a1d3.config).showFunctionField, true)
assert.equal(a1d4.drill_type, 'player_relation')
assert.equal(a1d4.config.mechanic, 'player_relation')
assert.equal(a1.drills.map((drill: { id: string }) => drill.id).join(','), 'A1_D1,A1_D2,A1_D3,A1_D4,A1_D5')
assert.equal(a1d5.drill_type, 'simple_structure')
assert.equal(a1d5.config.mechanic, 'simple_structure')
assert.equal(a1d5.config.minObservations, 3)
assert.equal(a1d5.config.recommendedObservations, 4)
assert.equal(a1d5.config.maxObservations, 5)
assert.equal(a1d5.config.focalRole, 'center')
assert.equal(
  a1d5.config.structureOptions.map((option: { id: string }) => option.id).join(','),
  'single_option,multiple_options,triangle,coverage_structure,unclear',
)
assert.equal(guidanceForIndex(resolveSimpleStructureConfig(a1d5.config), 0)?.guidance.includes('Center'), true)
assert.equal(guidanceForIndex(resolveSimpleStructureConfig(a1d5.config), 1)?.guidance.includes('zweiten'), true)
assert.ok(a1d5.didactics.observation_guide.ignore.some((item: string) => item.includes('Lenkung')))
assert.ok(a1d5.didactics.observation_guide.ignore.some((item: string) => item.includes('Breakout')))
assert.equal(JSON.stringify(a1d5).includes('Body Position'), true)
assert.equal(JSON.stringify(a1d5.config.structureOptions).includes('Lenkung'), false)
assert.equal(a1d5.config.reflectionGuidance.length, 6)
assert.ok(a1d5.config.trackRecapLead.includes('einzelnen Spieler'))

const mechanicDir = dirname(fileURLToPath(import.meta.url))
for (const file of ['structureLogic.ts', 'SimpleStructureDrill.tsx', 'SimpleStructureSummary.tsx', 'types.ts']) {
  const src = readFileSync(join(mechanicDir, file), 'utf8')
  assert.equal(src.includes('A1_D'), false, `${file} must not special-case A1 drills`)
}

const css = readFileSync(join(mechanicDir, 'SimpleStructureSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.equal(css.includes('chart'), false)
const drillCss = readFileSync(join(mechanicDir, 'SimpleStructureDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.match(drillCss, /hover: hover/)
assert.match(drillCss, /min-height: 44px/)

console.log('simpleStructure structureLogic tests OK')
