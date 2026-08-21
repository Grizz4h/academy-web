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

assert.ok(a2d5.config.handoffText.includes('Puckbesitz'))
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
  a3.drills.map((drill: { drill_type: string }) => drill.drill_type),
  ['event_log', 'period_checkin', 'event_log', 'event_log', 'event_log'],
)
assert.ok(a3.learningGoals.some((goal: string) => goal.includes('Transitionsmoment')))
assert.ok(a3.drills[2].config.fields[0].options.includes('direkte Fortsetzung'))
assert.ok(a3.drills[4].title.includes('Abstand'))
assert.equal(curriculum.tracks[0].modules.some((module: { id: string }) => module.id === 'A4'), false)

console.log('a3Polish.test.ts: all assertions passed')
