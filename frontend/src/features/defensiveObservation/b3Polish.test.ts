import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackA = curriculum.tracks[0]
const trackB = curriculum.tracks.find((track: { id: string }) => track.id === 'B')
const trackC = curriculum.tracks.find((track: { id: string }) => track.id === 'C')
const a3 = trackA.modules.find((module: { id: string }) => module.id === 'A3')
const b1 = trackB.modules.find((module: { id: string }) => module.id === 'B1')
const b2 = trackB.modules.find((module: { id: string }) => module.id === 'B2')
const b3 = trackB.modules.find((module: { id: string }) => module.id === 'B3')
const c1 = trackC.modules.find((module: { id: string }) => module.id === 'C1')

const LAYER_BY_DRILL: Record<string, string> = {
  B3_D1: 'pressure_initiation',
  B3_D2: 'pressure_effect',
  B3_D3: 'support_structure',
  B3_D4: 'sequence_analysis',
  B3_D5: 'pattern_recognition',
}

const DRILL_TYPES = [
  'draggable_rink_observation',
  'impact_classification_observation',
  'support_classification_observation',
  'sequence_classification_observation',
  'pattern_reflection_observation',
]

assert.deepEqual(
  a3.drills.map((drill: { title: string }) => drill.title),
  [
    'Transitionsmoment erkennen',
    'Erste Reaktion erkennen',
    'Transition fortsetzen oder kontrollieren',
    'Defensive Rückreaktion lesen',
    'Abstand und Raumkontrolle erkennen',
  ],
)
assert.deepEqual(
  b2.drills.map((drill: { title: string }) => drill.title),
  [
    'Druck erkennen',
    'Lösung unter Druck erkennen',
    'Entscheidungsursache erkennen',
    'Erste Anschlussentscheidung erkennen',
    'Entscheidungsmuster erkennen',
  ],
)

assert.equal(b3.title, 'B3 – Defensive Stabilität & Zugriff')
assert.ok(/ohne Systeme/i.test(b3.summary))
assert.ok(/Track C|Systeme/i.test(b3.description))
assert.ok(!/1-2-2|Box\+1|Box \+1/i.test(JSON.stringify(b3.learningGoals)))

assert.deepEqual(
  b3.drills.map((drill: { title: string }) => drill.title),
  [
    'Ersten defensiven Druck erkennen',
    'Wirkung des Drucks erkennen',
    'Teamunterstützung beim Zugriff erkennen',
    'Defensive Sequenzen lesen',
    'Defensive Muster erkennen',
  ],
)

for (let i = 0; i < b3.drills.length; i += 1) {
  const drill = b3.drills[i]
  assert.equal(drill.drill_type, DRILL_TYPES[i])
  assert.equal(drill.config.mechanic, 'defensive_observation')
  assert.deepEqual(drill.config.observationLayers, [LAYER_BY_DRILL[drill.id]])
  assert.ok(Array.isArray(drill.config.reflectionGuidance))
  assert.ok(drill.config.reflectionGuidance.some((line: string) => /Track C|Systeme/i.test(line)))
}

// D3: how-support framing, not bare yes/no title
assert.ok(!/\?$/.test(b3.drills[2].title))
assert.equal(b3.drills[2].config.decision.label, 'Wie wird der Zugriff unterstützt?')
assert.ok(Array.isArray(b3.drills[2].config.secondary_decision.options))
assert.ok(b3.drills[2].config.secondary_decision.options.length >= 3)

// D5: pattern language, not identity branding; persistence key kept
assert.ok(!/Identität/i.test(b3.drills[4].title))
assert.ok(!/Identität/i.test(b3.drills[4].config.identity.label))
assert.equal(b3.drills[4].config.identity.key, 'patternIdentity')
assert.equal(b3.drills[4].config.analysis_phase.title, 'Defensive Muster')
assert.ok(!/Identität/i.test(b3.drills[4].config.active_focus_text))

// Distinct persistence keys (period borrow must not auto-complete siblings)
assert.equal(b3.drills[1].config.logs_key || 'impact', b3.drills[1].config.logs_key)
const logKeys = b3.drills.slice(1, 4).map((drill: { config: { logs_key?: string } }) => drill.config.logs_key)
assert.equal(new Set(logKeys).size, logKeys.length)

// Boundaries
assert.ok(b1.title.toLowerCase().includes('center'))
assert.ok(b2.title.toLowerCase().includes('entscheidung') || b2.summary.toLowerCase().includes('druck'))
assert.ok(c1.title.toLowerCase().includes('system') || c1.title.toLowerCase().includes('zone'))
assert.ok(/B3/i.test(b2.drills[4].didactics.learning_hint))
assert.ok(/C/i.test(b3.drills[4].didactics.learning_hint))

// No premature system teaching in B3 titles/goals
const b3Blob = JSON.stringify({
  title: b3.title,
  summary: b3.summary,
  goals: b3.learningGoals,
  titles: b3.drills.map((d: { title: string }) => d.title),
})
assert.ok(!/1-2-2|Box\+1|Forecheck-System erklären/i.test(b3Blob))

console.log('b3Polish.test.ts: all assertions passed')
