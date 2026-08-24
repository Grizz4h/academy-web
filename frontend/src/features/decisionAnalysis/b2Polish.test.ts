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

const LAYER_BY_DRILL: Record<string, string> = {
  B2_D1: 'pressure_source',
  B2_D2: 'solution_type',
  B2_D3: 'decision_cause',
  B2_D4: 'followup_decision',
  B2_D5: 'pattern_synthesis',
}

const SAMPLE_KEYS = [
  'pressure_samples',
  'solution_samples',
  'decision_cause_samples',
  'followup_samples',
]

// Regression: A1–A3 + B1 titles unchanged by B2 polish
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

assert.equal(b2.title, 'B2 – Entscheidungen unter Druck verstehen')
assert.ok(b2.summary.toLowerCase().includes('druck'))
// No positive grading options / labels — only pedagogical "do not judge" copy is allowed
for (const drill of b2.drills) {
  const optionLabels: string[] = []
  for (const field of [
    ...(drill.config.sample_fields || []),
    ...(drill.config.diagnosis_fields || []),
    ...(drill.config.checkin?.options || []),
    ...(drill.config.questions || []).flatMap((q: { options?: unknown[] }) => q.options || []),
  ]) {
    if (typeof field === 'string') optionLabels.push(field)
    else if (field?.label) optionLabels.push(String(field.label))
    else if (field?.value) optionLabels.push(String(field.value))
  }
  assert.ok(
    !optionLabels.some((label) => /gute|schlechte|richtige|falsche/i.test(label)),
    `${drill.id} must not offer grading options`,
  )
}

assert.deepEqual(
  b2.drills.map((drill: { title: string }) => drill.title),
  [
    'Druck erkennen',
    'Lösung unter Druck erkennen',
    'Einflussfaktor und Lösung verbinden',
    'Erste Lösung des Puckführers nach Gewinn',
    'Beobachtungstendenzen unter Druck',
  ],
)

for (const drill of b2.drills) {
  assert.equal(drill.config.mechanic, 'decision_analysis')
  assert.deepEqual(drill.config.observationLayers, [LAYER_BY_DRILL[drill.id]])
  assert.ok(Array.isArray(drill.config.reflectionGuidance))
  assert.ok(drill.config.reflectionGuidance.some((line: string) => /Trenne Entscheidung und Ergebnis/i.test(line)))
  assert.ok(!/CenterRenderer|if \(drill\.id/.test(JSON.stringify(drill)))
}

// Distinct persistence keys for D1–D4 (period borrow must not auto-complete siblings)
const sampleKeys = b2.drills.slice(0, 4).map((drill: { config: { sample_key: string } }) => drill.config.sample_key)
assert.deepEqual(sampleKeys, SAMPLE_KEYS)
assert.equal(new Set(sampleKeys).size, SAMPLE_KEYS.length)

// D5 uses questions, not sibling sample keys
assert.ok(Array.isArray(b2.drills[4].config.questions))
assert.equal(b2.drills[4].config.validate_answers, true)
assert.equal(
  b2.drills[4].config.questions.find((q: { key: string }) => q.key === 'decision_pattern')?.required,
  true,
)
assert.ok(!b2.drills[4].config.sample_key)
assert.ok(!b2.drills[4].config.mode)

// D2 solution options: internal IDs stable; DE labels
assert.deepEqual(
  b2.drills[1].config.sample_fields[0].options.map((opt: { value: string }) => opt.value),
  ['pass', 'carry', 'sichern', 'befreiung', 'unklar'],
)
assert.deepEqual(
  b2.drills[1].config.sample_fields[0].options.map((opt: { label: string }) => opt.label),
  ['Pass', 'Puck führen', 'Kontrolle halten', 'Befreiung', 'Unklar'],
)

// D3: factor↔solution, not causal "Ursache"
assert.deepEqual(
  b2.drills[2].config.sample_fields[0].options.map((opt: { value: string }) => opt.value),
  ['zeitmangel', 'raumbegrenzung', 'gegnerdruck', 'fehlende_optionen', 'unklar'],
)
assert.ok(!b2.drills[2].config.missions.some((m: { prompt: string }) => /gescheitert/i.test(m.prompt)))
assert.ok(!/muss der Spieler handeln/i.test(JSON.stringify(b2.drills[0])))
assert.ok(!/Entscheidungsprofil des Teams/i.test(JSON.stringify(b2.drills[4])))

// D4: B2 solution types, not A3 collective labels
assert.ok(/Puckführer/i.test(b2.drills[3].description) || /erste sichtbare Lösung/i.test(b2.drills[3].description))
assert.ok(/A3/i.test(b2.drills[3].description) || /A3/i.test(b2.drills[3].didactics.explanation))
assert.deepEqual(
  b2.drills[3].config.sample_fields[0].options.map((opt: { value: string }) => opt.value),
  ['pass', 'carry', 'sichern', 'befreiung', 'unklar'],
)
assert.ok(!/tempo_nutzen|Sofort fortsetzen/i.test(JSON.stringify(b2.drills[3].config.sample_fields[0])))

// Boundaries
assert.ok(a3.title.toLowerCase().includes('umschalten') || a3.summary.toLowerCase().includes('umschalt'))
assert.ok(b1.title.toLowerCase().includes('center'))
assert.ok(!/center/i.test(b2.title))
assert.ok(b1.drills[4].didactics.learning_hint.includes('B2'))
assert.ok(/Entscheidung/i.test(b1.drills[4].didactics.learning_hint))

// Module copy: analysis, not premature grading
assert.ok(/ohne Ergebnisurteil|ohne richtig|getrennt vom Ergebnis/i.test(b2.summary + b2.description))

console.log('b2Polish.test.ts: all assertions passed')
