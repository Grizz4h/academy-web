import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const a2 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A2')
const a3 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A3')
const a2d5 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D5')
const a3d2 = a3.drills.find((drill: { id: string }) => drill.id === 'A3_D2')
const a3d3 = a3.drills.find((drill: { id: string }) => drill.id === 'A3_D3')

assert.deepEqual(
  a3.drills.map((drill: { title: string }) => drill.title),
  [
    'Umschaltmoment erkennen',
    'Erste Reaktion erkennen',
    'Umschalten fortsetzen oder kontrollieren',
    'Defensive Rückreaktion lesen',
    'Abstand und Raumkontrolle erkennen',
  ],
)
assert.deepEqual(
  a3.drills.map((drill: { drill_type: string }) => drill.drill_type),
  ['event_log', 'period_checkin', 'event_log', 'event_log', 'event_log'],
)
assert.ok(a3.learningGoals.some((goal: string) => goal.includes('Umschaltmoment')))
assert.ok(a3.title.includes('Umschalten'))
assert.ok(a2d5.config.handoffText.includes('zentraler Auslöser'))
assert.ok(/häufig ein zentraler Auslöser/i.test(a3.drills[0].didactics.explanation))
assert.ok(/Nicht jede Strukturveränderung/i.test(a3.drills[0].didactics.explanation))
assert.ok(!/War der Puckbesitzwechsel klar der Trigger/i.test(JSON.stringify(a3.drills[0].miniFeedback)))

assert.deepEqual(
  a3d2.didactics.role_context.content.map((r: { label: string }) => r.label),
  ['Puckführer', 'Erste Passoption', 'Tiefenläufer', 'Absicherung'],
)
assert.ok(/situative Funktionen/i.test(a3d2.didactics.role_context.hint))
assert.ok(!/Beschleuniger|Tiefengeber|Unterstützer/i.test(JSON.stringify(a3d2.didactics.role_context)))
assert.ok(!/geplanter Schritt oder ein Zeichen von Unsicherheit/i.test(JSON.stringify(a3d2.miniFeedback)))
assert.ok(!/hätte Stabilität erzeugt/i.test(JSON.stringify(a3d2.miniFeedback)))

assert.deepEqual(a3d3.config.fields[0].options, ['Sofort fortsetzen', 'Kontrolliert neu aufbauen', 'unklar'])
assert.equal(a3d3.config.fields[1].key, 'absicherung_sichtbar')
assert.deepEqual(a3d3.config.fields[1].options, ['Ja', 'Nein', 'Unklar'])
assert.deepEqual(a3d3.config.fields[2].options, ['Verteidigungszone', 'neutrale Zone', 'Angriffszone'])
assert.ok(!/\bRush vs\. Stop\b/i.test(a3d3.description + a3d3.didactics.explanation + a3d3.didactics.goal))
assert.ok(a3.drills[4].title.includes('Abstand'))
assert.equal(curriculum.tracks[0].modules.some((module: { id: string }) => module.id === 'A4'), false)

console.log('a3Polish.test.ts: all assertions passed')
