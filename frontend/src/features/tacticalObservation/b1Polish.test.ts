import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackA = curriculum.tracks[0]
const trackB = curriculum.tracks.find((track: { id: string }) => track.id === 'B')
const a1 = trackA.modules.find((module: { id: string }) => module.id === 'A1')
const a2 = trackA.modules.find((module: { id: string }) => module.id === 'A2')
const a3 = trackA.modules.find((module: { id: string }) => module.id === 'A3')
const b1 = trackB.modules.find((module: { id: string }) => module.id === 'B1')
const b2 = trackB.modules.find((module: { id: string }) => module.id === 'B2')
const a3d5 = a3.drills.find((drill: { id: string }) => drill.id === 'A3_D5')

assert.deepEqual(
  a1.drills.map((drill: { title: string }) => drill.title),
  [
    'Finde den Center',
    'Wo taucht der Center auf?',
    'Was macht der Center dort?',
    'Wer hilft wem?',
    'Vom Center zur ersten Struktur',
  ],
)
assert.deepEqual(
  a2.drills.map((drill: { title: string }) => drill.title),
  [
    'Struktur erkennen',
    'Optionen erkennen',
    'Entscheidung erkennen',
    'Raum & Zeit erkennen',
    'Strukturentwicklung erkennen',
  ],
)
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

assert.ok(a3d5.didactics.learning_hint.includes('einzelne Rolle'))
assert.ok(a3d5.didactics.learning_hint.includes('Einfluss'))

assert.equal(b1.title, 'B1 – Centerrolle verstehen und lesen')
assert.deepEqual(
  b1.drills.map((drill: { title: string }) => drill.title),
  [
    'Unterstützung unter dem Puck',
    'Verbindungen erhalten',
    'Center-Aufgaben erkennen',
    'Center als Anspielstation und Anschlussoption',
    'Timing & sichtbare Vorbereitung',
  ],
)
assert.ok(b1.drills.every((drill: { drill_type: string }) => drill.drill_type === 'sample_log'))
assert.ok(b1.drills.every((drill: { config?: { mechanic?: string } }) => !drill.config?.mechanic))
assert.deepEqual(
  b1.drills[2].config.state_options,
  ['Anspielstation anbieten', 'Absichern', 'Verbinden', 'Angriff unterstützen', 'unklar'],
)
assert.deepEqual(
  b1.drills[1].config.state_options,
  [
    'Neue Verbindung entsteht',
    'Verbindungen bleiben erhalten',
    'Verbindung wird eingeschränkt',
    'Keine klare Verbindung erkennbar',
  ],
)
assert.deepEqual(
  b1.drills[4].config.state_options,
  [
    'Vor dem Druck vorbereitet',
    'Im nutzbaren Zeitfenster verfügbar',
    'Erst unter Druck verfügbar',
    'Nach Schließen des Zeitfensters',
    'Unklar',
  ],
)
assert.ok(/erreichbare und nutzbare Passmöglichkeit/i.test(b1.drills[0].didactics.explanation))
assert.ok(!/sofort sinnvoll anspielen/i.test(JSON.stringify(b1.drills[0].didactics.glossary)))
assert.ok(b1.drills[4].didactics.learning_hint.includes('B2'))
assert.ok(b1.description.includes('keine Systeme') || b1.description.includes('Keine') && b1.description.includes('Systeme'))
assert.ok(b2, 'B2 outbound neighbor exists')
assert.ok(b2.title.includes('Druck') || b2.summary.toLowerCase().includes('druck'))

console.log('b1Polish.test.ts: all assertions passed')
