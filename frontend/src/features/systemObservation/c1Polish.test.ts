import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackB = curriculum.tracks.find((track: { id: string }) => track.id === 'B')
const trackC = curriculum.tracks.find((track: { id: string }) => track.id === 'C')
const b3 = trackB.modules.find((module: { id: string }) => module.id === 'B3')
const c1 = trackC.modules.find((module: { id: string }) => module.id === 'C1')
const c2 = trackC.modules.find((module: { id: string }) => module.id === 'C2')

const LAYER_BY_DRILL: Record<string, string[]> = {
  C1_D1: ['space_priority'],
  C1_D2: ['structure_alignment', 'spacing'],
  C1_D3: ['pressure_vs_control'],
  C1_D4: ['responsibility_shift'],
  C1_D5: ['system_stability'],
}

assert.deepEqual(
  b3.drills.map((drill: { title: string }) => drill.title),
  [
    'Ersten defensiven Druck erkennen',
    'Wirkung des Drucks erkennen',
    'Teamunterstützung beim Zugriff erkennen',
    'Defensive Sequenzen lesen',
    'Defensive Tendenzen zusammenführen',
  ],
)

assert.equal(c1.title, 'C1 – Defensive Zone Systeme verstehen')
assert.ok(/Zweck vor Systemnamen|Raumpriorität/i.test(c1.summary + c1.description))
assert.ok(/C2|Neutral/i.test(c1.description))
assert.ok(/B3/i.test(c1.description))

assert.deepEqual(
  c1.drills.map((drill: { title: string }) => drill.title),
  [
    'Raumprioritäten erkennen',
    'Abstände und Staffelung rekonstruieren',
    'Wechsel von Raumkontrolle zu aktivem Zugriff',
    'Verantwortlichkeits- und Strukturveränderungen vergleichen',
    'Heutige Stabilitätsbeobachtung',
  ],
)

assert.equal(c1.drills[0].drill_type, 'paintable_rink_observation')
assert.equal(c1.drills[1].drill_type, 'clickable_rink_observation')
assert.equal(c1.drills[2].config.mode, 'single_marker_observation')
assert.equal(c1.drills[3].config.mode, 'formation_shift')
assert.equal(c1.drills[4].drill_type, 'period_checkin')

for (const drill of c1.drills) {
  assert.equal(drill.config.mechanic, 'system_observation')
  assert.deepEqual(drill.config.observationLayers, LAYER_BY_DRILL[drill.id])
  assert.ok(Array.isArray(drill.config.reflectionGuidance))
  assert.ok(drill.config.reflectionGuidance.some((line: string) => /Zweck vor Systemnamen/i.test(line)))
}

const paintLabels = c1.drills[0].config.paintLayers.map((l: { label: string }) => l.label)
assert.deepEqual(paintLabels, [
  'Geschützter Raum',
  'Raum mit hoher Torgefahr',
  'Weniger priorisierter Raum',
])
assert.deepEqual(
  c1.drills[0].config.paintLayers.map((l: { id: string }) => l.id),
  ['protected_space', 'danger_space', 'accepted_space'],
)

const spacingLabels = c1.drills[1].config.structure_rating.options.map((o: { label: string }) => o.label)
assert.deepEqual(spacingLabels, ['Enge Abstände', 'Mittlere Abstände', 'Große Abstände', 'Unklar'])
assert.ok(!/hätte die Raumkontrolle verbessert/i.test(JSON.stringify(c1.drills[1].miniFeedback)))

const d3 = c1.drills[2]
assert.equal(d3.config.marker.label, 'Auslöser')
assert.ok(d3.config.observation_fields_progressive === true)
const triggerValues = d3.config.observation_fields[0].options.map((o: { value: string }) => o.value)
assert.ok(!triggerValues.includes('supported_pressure'))
assert.ok(triggerValues.includes('necessary_pressure'))
assert.ok(d3.config.observation_fields[0].options.some((o: { label: string }) => o.label === 'Unmittelbare Gefahr vor dem Tor'))
assert.ok(d3.config.observation_fields[1].options.some((o: { label: string }) => /begrenzen gemeinsam den Raum/i.test(o.label)))
assert.ok(d3.config.observation_fields[1].options.some((o: { label: string }) => /Keine gemeinsame Unterstützung erkennbar/i.test(o.label)))
assert.ok(!/Früh und kontrolliert|Überhastet|Passend zum Trigger/i.test(JSON.stringify(d3.config.observation_fields[3])))
assert.ok(!/Qualität des Zugriffs/i.test(JSON.stringify(d3.config)))

const d4 = c1.drills[3]
assert.ok(d4.config.reaction_type.options.some((o: { label: string }) => o.label === 'Sichtbare Übergabe'))
assert.ok(d4.config.reaction_type.options.some((o: { label: string }) => o.label === 'Keine gemeinsame Anpassung erkennbar'))
assert.ok(d4.config.structural_outcome.options.some((o: { label: string }) => /angepasst und blieb verbunden/i.test(o.label)))
assert.ok(d4.config.structural_outcome.options.some((o: { label: string }) => /Passweg zum Tor wurde offen/i.test(o.label)))
assert.ok(!/gefährliche Lücke|Gezielte Übergabe|Unkoordinierte Reaktion|brach auseinander/i.test(JSON.stringify(d4.config)))

const d5 = c1.drills[4]
assert.equal(d5.config.summary_title, 'Heutige Stabilitätsbeobachtung')
assert.ok(/Im beobachteten Abschnitt war erkennbar/i.test(d5.config.sentence_helpers.starter))
assert.ok(!/Dieses Team verteidigt/i.test(JSON.stringify(d5.config)))
const risk = d5.config.questions.find((q: { key: string }) => q.key === 'riskProfile')
assert.ok(risk)
assert.equal(risk.required, false)
assert.equal(risk.hidden, true)
assert.ok(!/Früh und aggressiv|Häufig aggressiv herausrückend|Defensivprofil/i.test(
  JSON.stringify(d5.config.questions.filter((q: { hidden?: boolean }) => !q.hidden)),
))

// Distinct persistence
const obsKeys = c1.drills.slice(0, 4).map((drill: { config: { observations_key?: string } }) => drill.config.observations_key)
assert.equal(new Set(obsKeys).size, obsKeys.length)
assert.ok(Array.isArray(c1.drills[4].config.questions))
assert.ok(!c1.drills[4].config.observations_key)

for (const drill of c1.drills) {
  const labels: string[] = []
  const collect = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(collect)
      return
    }
    const obj = node as Record<string, unknown>
    if (typeof obj.label === 'string' && obj.hidden !== true && obj.legacy !== true) labels.push(obj.label)
    Object.values(obj).forEach(collect)
  }
  collect(drill)
  assert.ok(
    !labels.some((label) => /gute Verteidigung|schlechte Verteidigung/i.test(label)),
    `${drill.id} must not offer grading labels`,
  )
}

assert.ok(c2)
assert.ok(/Neutral|NZ|Eintritt/i.test(c2.title + c2.summary + c2.description))
assert.ok(/C2/i.test(c1.drills[4].didactics.learning_hint))

console.log('c1Polish.test.ts: all assertions passed')
