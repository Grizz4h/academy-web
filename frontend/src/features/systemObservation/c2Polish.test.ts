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
const c3 = trackC.modules.find((module: { id: string }) => module.id === 'C3')

const LAYER_BY_DRILL: Record<string, string[]> = {
  C2_D1: ['entry_route_control'],
  C2_D2: ['neutral_zone_spacing'],
  C2_D3: ['steering_pattern'],
  C2_D4: ['recovery_after_breakthrough'],
  C2_D5: ['system_profile'],
}

assert.equal(c2.title, 'C2 – Neutral Zone Systeme verstehen')
assert.ok(/Prinzip vor Systemnamen|Neutral/i.test(c2.summary + c2.description))
assert.ok(/C1|eigene Zone/i.test(c2.description))
assert.ok(/C3|Angriff/i.test(c2.description))

assert.deepEqual(
  c2.drills.map((drill: { title: string }) => drill.title),
  [
    'Neutral-Zone-Struktur erkennen',
    'Staffelung und Raumkontrolle erkennen',
    'Gegner lenken und Wege kontrollieren',
    'Erste Struktur überwunden – Reaktion lesen',
    'Neutral-Zone-Profil erkennen',
  ],
)

assert.equal(c2.drills[0].drill_type, 'rink_corridor_observation')
assert.equal(c2.drills[1].config.mode, 'defensive_structure')
assert.equal(c2.drills[2].config.mode, 'directional_path_observation')
assert.equal(c2.drills[3].config.mode, 'directional_path_observation')
assert.equal(c2.drills[4].drill_type, 'period_checkin')

for (const drill of c2.drills) {
  assert.equal(drill.config.mechanic, 'system_observation')
  assert.deepEqual(drill.config.observationLayers, LAYER_BY_DRILL[drill.id])
  assert.ok(Array.isArray(drill.config.reflectionGuidance))
  assert.ok(drill.config.reflectionGuidance.some((line: string) => /Systemprinzip von Systemnamen/i.test(line)))
}

// Distinct persistence keys (C1/B3 borrow must not auto-complete)
const c2Keys = c2.drills.slice(0, 4).map((drill: { config: { observations_key?: string } }) => drill.config.observations_key)
assert.equal(new Set(c2Keys).size, c2Keys.length)
const c1Keys = c1.drills.slice(0, 4).map((drill: { config: { observations_key?: string } }) => drill.config.observations_key)
for (const key of c2Keys) {
  assert.ok(!c1Keys.includes(key), `C2 key ${key} must not collide with C1`)
}
assert.ok(Array.isArray(c2.drills[4].config.questions))
assert.ok(!c2.drills[4].config.observations_key)

// Purpose before labels / no coaching grading titles
assert.ok(/Welches System ist das|Systemnamen|Zweck vor/i.test(
  c2.drills[0].didactics.explanation + JSON.stringify(c2.drills[0].didactics.observation_guide.ignore),
))
assert.ok(/nicht.*versagt|Keine Schuldzuweisung|Hat der Verteidiger/i.test(
  c2.drills[3].description + c2.drills[3].didactics.explanation,
))
assert.ok(!/Welches System ist das/i.test(c2.drills.map((d: { title: string }) => d.title).join(' ')))

for (const drill of c2.drills) {
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
  collect({ questions: drill.config.questions, observation_fields: drill.config.observation_fields })
  assert.ok(
    !labels.some((label) => /gutes System|schlechtes System|richtige Position|falsche Position/i.test(label)),
    `${drill.id} must not offer coaching grading labels`,
  )
}

// Boundaries
assert.ok(b3.drills.every((drill: { config?: { mechanic?: string } }) => drill.config?.mechanic === 'defensive_observation'))
assert.ok(c1.drills.every((drill: { config?: { mechanic?: string } }) => drill.config?.mechanic === 'system_observation'))
assert.ok(c1.title.toLowerCase().includes('defensive zone') || c1.title.toLowerCase().includes('zone'))
assert.ok(c2.title.toLowerCase().includes('neutral'))
assert.ok(c3.title.toLowerCase().includes('offensive') || c3.summary.toLowerCase().includes('angriff'))
assert.ok(/C2/i.test(c1.drills[4].didactics.learning_hint))
assert.ok(/C3/i.test(c2.drills[4].didactics.learning_hint))
assert.ok(!/Slot|eigene Zone schützen/i.test(c2.drills[0].title + c2.drills[2].title))

console.log('c2Polish.test.ts: all assertions passed')
