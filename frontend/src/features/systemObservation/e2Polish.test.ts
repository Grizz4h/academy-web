import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveBeforeAfterCompareConfig } from '../beforeAfterCompare/compareLogic'
import { DEFAULT_COMPARABILITY_OPTIONS, DEFAULT_PRIMARY_CHANGE_OPTIONS } from '../beforeAfterCompare/labels'
import { resolveChangeTimelineConfig } from '../changeTimeline/timelineLogic'
import { ASSESSMENT_OPTIONS as TIMELINE_ASSESSMENTS, CHANGE_POINT_NONE_OPTIONS } from '../changeTimeline/labels'
import { resolveTriggerHypothesisConfig } from '../triggerHypothesis/hypothesisLogic'
import { PROBLEM_FIT_OPTIONS } from '../triggerHypothesis/labels'
import { INTERACTION_ASSESSMENT_OPTIONS } from '../interactionChain/labels'
import { resolveAdjustmentProfileConfig } from '../adjustmentProfile/profileLogic'
import { ASSESSMENT_OPTIONS as PROFILE_ASSESSMENTS } from '../adjustmentProfile/labels'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const curriculum = JSON.parse(readFileSync(join(root, 'data/academy/curriculum.json'), 'utf8'))
const theory = JSON.parse(readFileSync(join(root, 'frontend/src/data/theoryData.json'), 'utf8'))
const glossary = readFileSync(join(root, 'docs/content/hockey-glossary.md'), 'utf8')
const hr = readFileSync(join(root, 'docs/qa/human-review/e2-human-review.md'), 'utf8')
const sources = readFileSync(join(root, 'docs/qa/sources/e2-sources.md'), 'utf8')

const trackE = curriculum.tracks.find((t: { id: string }) => t.id === 'E')
const e2 = trackE.modules.find((m: { id: string }) => m.id === 'E2')
assert.ok(e2)
assert.equal(e2.title, 'E2 – Spielanpassungen erkennen')
assert.match(e2.summary, /Spielanpassungen/i)
assert.ok(!/Trenne Ursachen von Symptomen|coachbare|Bewerte Adjustments/i.test(e2.learningGoals.join('\n')))
assert.ok(e2.learningGoals.some((g: string) => /sichtbare Veränderungen/i.test(g)))
assert.ok(!/Anpassungen ableiten|Adjustments ableiten/.test(e2.title))

const d1 = e2.drills.find((d: { id: string }) => d.id === 'E2_D1')
const d2 = e2.drills.find((d: { id: string }) => d.id === 'E2_D2')
const d3 = e2.drills.find((d: { id: string }) => d.id === 'E2_D3')
const d4 = e2.drills.find((d: { id: string }) => d.id === 'E2_D4')
const d5 = e2.drills.find((d: { id: string }) => d.id === 'E2_D5')

// D1
assert.ok(/vergleichbar/i.test(d1.didactics.explanation))
assert.ok(!/Coach-Trigger oder Score State/.test(JSON.stringify(d1.didactics.observation_guide.ignore)))
assert.equal(d1.config.require_confidence, false)
assert.ok(DEFAULT_COMPARABILITY_OPTIONS.some((o) => /gut vergleichbar/i.test(o.label)))
assert.ok(DEFAULT_PRIMARY_CHANGE_OPTIONS.some((o) => /Keine klare Veränderung/i.test(o.label)))
assert.ok(DEFAULT_PRIMARY_CHANGE_OPTIONS.some((o) => /nicht ausreichend vergleichbar/i.test(o.label)))
const bac = resolveBeforeAfterCompareConfig(d1.config)
assert.equal(bac.requireConfidence, false)
assert.equal(bac.requireComparability, true)

// D2
assert.equal(d2.config.require_change_point, false)
assert.ok(/Mindestmenge dieser Übung/i.test(d2.didactics.explanation))
assert.ok(/kein statistisch berechneter Change Point|manuelle Beobachtungshilfe/i.test(d2.didactics.explanation))
assert.ok(TIMELINE_ASSESSMENTS.some((o) => /Nur einzelne Abweichung/i.test(o.label)))
assert.ok(TIMELINE_ASSESSMENTS.some((o) => /Nicht ausreichend beobachtet/i.test(o.label)))
assert.ok(CHANGE_POINT_NONE_OPTIONS.some((o) => /Veränderungszeitpunkt/i.test(o.label)))
const ctc = resolveChangeTimelineConfig(d2.config)
assert.equal(ctc.requireChangePoint, false)

// D3
assert.equal(d3.title, 'Worauf könnte die Veränderung reagiert haben?')
assert.ok(/prüfbare Anpassungshypothese/i.test(d3.didactics.explanation + d3.config.decision_rule))
assert.ok(!/gute Adjustment-Hypothese/i.test(JSON.stringify(d3)))
assert.ok(PROBLEM_FIT_OPTIONS.some((o) => /Keine ausreichende funktionale Verbindung/i.test(o.label)))
assert.ok(/Alternativ könnten anderes Personal/i.test(JSON.stringify(d3.config.hypothesis_examples)))
assert.ok(!/der Coach reagiert hat|Coach hat System geändert/.test(JSON.stringify(d3.config.hypothesis_examples.suitable)))
const thc = resolveTriggerHypothesisConfig(d3.config)
assert.equal(thc.requireAlternativeExplanation, true)

// D4
assert.equal(d4.title, 'Wie entwickelt sich die vergleichbare Interaktion danach?')
assert.ok(!/Hat das Adjustment das Problem verändert/i.test(d4.title))
assert.ok(/Tor, Save oder einzelner Puckverlust reicht nicht/i.test(d4.config.core_hint + d4.didactics.explanation))
assert.ok(!/Ein Adjustment kann funktionieren, obwohl danach ein Tor fällt/i.test(JSON.stringify(d4)))
assert.ok(/Problemverlagerung|vergleichbare Interaktion/i.test(JSON.stringify(d4.miniFeedback)))
assert.ok(INTERACTION_ASSESSMENT_OPTIONS.some((o) => /Nicht ausreichend beobachtet/i.test(o.label)))
assert.ok(INTERACTION_ASSESSMENT_OPTIONS.some((o) => /Nicht ausreichend vergleichbar/i.test(o.label)))
assert.ok(!INTERACTION_ASSESSMENT_OPTIONS.some((o) => /^erfolgreich$/i.test(o.label)))

// D5
assert.equal(d5.title, 'Mögliche Spielanpassungen im beobachteten Segment')
assert.equal(d5.config.minAdjustments, 0)
assert.equal(d5.config.maxAdjustments, 2)
assert.equal(d5.config.requireNextWatchFocus, false)
assert.ok(/Keine ausreichend gestützte Spielanpassung/i.test(d5.description))
assert.ok(!/Adjustment-Profil/i.test(d5.title + d5.config.summary_title))
assert.ok(PROFILE_ASSESSMENTS.some((o) => /Mehrfach und vergleichbar beobachtet/i.test(o.label)))
assert.ok(!PROFILE_ASSESSMENTS.some((o) => /Starkes Adjustment-Signal/i.test(o.label)))
const apc = resolveAdjustmentProfileConfig(d5.config)
assert.equal(apc.minAdjustments, 0)
assert.equal(apc.requireNextWatchFocus, false)

// Theory
assert.match(theory.E2.title, /Spielanpassungen erkennen/)
assert.match(theory.E2.overview, /keine behauptete Coachingabsicht/i)
assert.ok(/manuelle Beobachtungshilfe|kein statistischer Change Point/i.test(JSON.stringify(theory.E2)))
assert.ok(/0–2 Kandidaten|Null ausreichend/i.test(JSON.stringify(theory.E2)))
assert.ok(!/Ursachen von Symptomen|coachbare/i.test(JSON.stringify(theory.E2)))

// Glossary / sources / HR
assert.match(glossary, /### Spielanpassung/)
assert.match(glossary, /### Möglicher Veränderungszeitpunkt/)
assert.match(glossary, /### Ergebnisverzerrung/)
assert.match(glossary, /### Beobachtungssignal|Beobachtungssignal/)
assert.match(glossary, /### Problemverlagerung|Problemverlagerung/)
assert.match(sources, /SRC-CHANGEPOINT-TEAM-SPORT-2022/)
assert.match(sources, /nicht.*Validierung des E2-Veränderungszeitpunkts|nicht.*als Validierung/i)
assert.match(sources, /SRC-OUTCOME-BIAS-SPORT-2019/)
assert.match(sources, /RINQ-MODEL-E2-MANUAL-CHANGE-TIMELINE/)

for (const id of ['HR-E2-C1', 'HR-E2-C2', 'HR-E2-C3', 'HR-E2-C4', 'HR-E2-C5', 'HR-E2-MIN-001', 'HR-E2-MIN-002', 'HR-E2-MIN-003']) {
  assert.ok(hr.includes(id), `missing ${id}`)
}
const statusBlocks = [...hr.matchAll(/\*\*human_status\*\*\s*\|\s*`([^`]+)`/g)].map((m) => m[1])
assert.ok(statusBlocks.length >= 5)
assert.ok(statusBlocks.every((s) => s === 'NEEDS_CHANGE'))

console.log('e2Polish.test.ts OK')
