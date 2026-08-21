import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackC = curriculum.tracks.find((track: { id: string }) => track.id === 'C')
const c1 = trackC.modules.find((module: { id: string }) => module.id === 'C1')
const c2 = trackC.modules.find((module: { id: string }) => module.id === 'C2')
const c3 = trackC.modules.find((module: { id: string }) => module.id === 'C3')

const LAYER_BY_DRILL: Record<string, string[]> = {
  C3_D1: ['space_distribution'],
  C3_D2: ['connection_structure', 'support_relationships'],
  C3_D3: ['defensive_movement', 'rotation_effect'],
  C3_D4: ['advantage_conversion'],
  C3_D5: ['offensive_profile'],
}

assert.equal(c3.title, 'C3 – Offensive Zone Systeme verstehen')
assert.ok(/Struktur vor Spielzügen|Raum/i.test(c3.summary + c3.description))
assert.ok(/C2|Neutral/i.test(c3.description))
assert.ok(/Gameplan|Special Teams|Coaching/i.test(c3.description))

assert.deepEqual(
  c3.drills.map((drill: { title: string }) => drill.title),
  [
    'Welche Räume hält die Offensive besetzt?',
    'Wie bleiben Spieler verbunden?',
    'Wie bewegt die Offensive die Defensive?',
    'Was macht die Offensive mit einem Vorteil?',
    'Welches offensive Muster entsteht?',
  ],
)

assert.equal(c3.drills[0].drill_type, 'rink_segmented_zone_observation')
assert.equal(c3.drills[1].config.mode, 'defensive_structure')
assert.equal(c3.drills[2].config.mode, 'directional_path_observation')
assert.equal(c3.drills[3].drill_type, 'period_checkin')
assert.equal(c3.drills[3].config.mode, 'decision_cause_diagnosis')
assert.equal(c3.drills[4].drill_type, 'period_checkin')
assert.ok(!c3.drills[4].config.mode)

for (const drill of c3.drills) {
  assert.equal(drill.config.mechanic, 'system_observation')
  assert.deepEqual(drill.config.observationLayers, LAYER_BY_DRILL[drill.id])
  assert.ok(Array.isArray(drill.config.reflectionGuidance))
  assert.ok(drill.config.reflectionGuidance.some((line: string) => /Struktur von Ergebnis/i.test(line)))
}

// Distinct persistence vs C1/C2
const c3Keys = [
  c3.drills[0].config.observations_key,
  c3.drills[1].config.observations_key,
  c3.drills[2].config.observations_key,
  c3.drills[3].config.sample_key,
]
assert.equal(new Set(c3Keys).size, c3Keys.length)
const foreignKeys = [
  ...c1.drills.slice(0, 4).map((d: { config: { observations_key?: string } }) => d.config.observations_key),
  ...c2.drills.slice(0, 4).map((d: { config: { observations_key?: string } }) => d.config.observations_key),
]
for (const key of c3Keys) {
  assert.ok(key)
  assert.ok(!foreignKeys.includes(key), `C3 key ${key} must not collide with C1/C2`)
}
assert.ok(Array.isArray(c3.drills[4].config.questions))

// Purpose / structure before plays
assert.ok(/Umbrella|Systemname|Spielzug/i.test(
  c3.drills[0].didactics.explanation + JSON.stringify(c3.drills[0].didactics.observation_guide.ignore),
))
assert.ok(/Ergebnis|nicht.*erfolgreich|≠/i.test(c3.drills[3].description + c3.drills[3].didactics.explanation))

for (const drill of c3.drills) {
  const labels: string[] = []
  const collect = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(collect)
      return
    }
    const obj = node as Record<string, unknown>
    if (typeof obj.label === 'string') labels.push(obj.label)
    Object.values(obj).forEach(collect)
  }
  collect({
    questions: drill.config.questions,
    sample_fields: drill.config.sample_fields,
    structure_rating: drill.config.structure_rating,
  })
  assert.ok(
    !labels.some((label) => /guter Angriff|schlechter Angriff|richtige Formation|falsches System/i.test(label)),
    `${drill.id} must not offer coaching grading labels`,
  )
}

// Boundaries
assert.ok(c2.title.toLowerCase().includes('neutral'))
assert.ok(c3.title.toLowerCase().includes('offensive'))
assert.ok(c1.drills.every((d: { config?: { mechanic?: string } }) => d.config?.mechanic === 'system_observation'))
assert.ok(c2.drills.every((d: { config?: { mechanic?: string } }) => d.config?.mechanic === 'system_observation'))
assert.ok(/C3/i.test(c2.drills[4].didactics.learning_hint))
assert.ok(/Gameplan|Special Teams|Spätere Tracks/i.test(c3.drills[4].didactics.learning_hint))
assert.ok(!/Eintritt|Neutral Zone schützen/i.test(c3.drills.map((d: { title: string }) => d.title).join(' ')))

console.log('c3Polish.test.ts: all assertions passed')
