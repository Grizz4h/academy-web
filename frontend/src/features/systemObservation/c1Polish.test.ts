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
    'Defensive Muster erkennen',
  ],
)

assert.equal(c1.title, 'C1 – Defensive Zone Systeme verstehen')
assert.ok(/Zweck vor Systemnamen|Raumpriorität/i.test(c1.summary + c1.description))
assert.ok(/C2|Neutral/i.test(c1.description))
assert.ok(/B3/i.test(c1.description))

assert.deepEqual(
  c1.drills.map((drill: { title: string }) => drill.title),
  [
    'Welche Räume schützt die Defensive?',
    'Wie organisiert die Struktur diese Räume?',
    'Wie erzeugt die Struktur Druck oder Kontrolle?',
    'Wie wechseln Verantwortlichkeiten?',
    'Wie stabil bleibt das System?',
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

// Distinct persistence (period borrow / sibling auto-complete)
const obsKeys = c1.drills.slice(0, 4).map((drill: { config: { observations_key?: string } }) => drill.config.observations_key)
assert.equal(new Set(obsKeys).size, obsKeys.length)
assert.ok(Array.isArray(c1.drills[4].config.questions))
assert.ok(!c1.drills[4].config.observations_key)

// No coaching grading options (gute/schlechte Verteidigung etc.)
for (const drill of c1.drills) {
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
    structure_rating: drill.config.structure_rating,
    observation_fields: drill.config.observation_fields,
    questions: drill.config.questions,
  })
  assert.ok(
    !labels.some((label) => /^(Gute|Schlechte|Richtige|Falsche)\b/i.test(label) || /gute Verteidigung|schlechte Verteidigung|gutes System|schlechtes System/i.test(label)),
    `${drill.id} must not offer coaching grading labels`,
  )
}

// Purpose before labels: D1 ignore / explanation blocks system-name-first
assert.ok(/Systemnamen/i.test(c1.drills[0].didactics.explanation + JSON.stringify(c1.drills[0].didactics.observation_guide.ignore)))

// Boundaries
assert.ok(b3.title.toLowerCase().includes('defensive') || b3.summary.toLowerCase().includes('zugriff'))
assert.ok(/C1/i.test(b3.drills[4].didactics.learning_hint))
assert.ok(c2.title.toLowerCase().includes('neutral'))
assert.ok(/C2/i.test(c1.drills[4].didactics.learning_hint))
assert.ok(!/Neutral Zone|Eintritt/i.test(c1.drills[0].title + c1.drills[1].title))

// B3 stays behavior mechanic family
assert.ok(b3.drills.every((drill: { config?: { mechanic?: string } }) => drill.config?.mechanic === 'defensive_observation'))

console.log('c1Polish.test.ts: all assertions passed')
