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
    'Offensive Raumverteilung',
    'Spielbare Verbindungen',
    'Bewegung und sichtbare Öffnung',
    'Anschlussaktion nach einer Öffnung',
    'Heutige Offensivstruktur-Beobachtung',
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
assert.ok(/Ergebnis|nicht.*erfolgreich|≠|Qualitätsurteil/i.test(c3.drills[3].description + c3.drills[3].didactics.explanation))

const collectLabels = (node: unknown, labels: string[] = []) => {
  if (!node || typeof node !== 'object') return labels
  if (Array.isArray(node)) {
    node.forEach((entry) => collectLabels(entry, labels))
    return labels
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.label === 'string' && obj.hidden !== true && obj.legacy !== true) labels.push(obj.label)
  Object.values(obj).forEach((value) => collectLabels(value, labels))
  return labels
}

for (const drill of c3.drills) {
  const labels = collectLabels({
    questions: (drill.config.questions || []).filter((q: { hidden?: boolean; legacy?: boolean }) => q.hidden !== true && q.legacy !== true),
    sample_fields: drill.config.sample_fields,
    structure_rating: drill.config.structure_rating,
    structural_function: drill.config.structural_function,
    key_structure_element: drill.config.key_structure_element,
    observation_fields: (drill.config.observation_fields || []).filter(
      (f: { hidden?: boolean; legacy?: boolean }) => f.hidden !== true && f.legacy !== true,
    ),
    zones: drill.config.zones,
  })
  assert.ok(
    !labels.some((label) => /guter Angriff|schlechter Angriff|richtige Formation|falsches System/i.test(label)),
    `${drill.id} must not offer coaching grading labels`,
  )
  assert.ok(
    !labels.some((label) => /^(Net Front|Left Halfwall|Right Halfwall|High \/ Point|Behind the Net|Weak Side|Low Cycle|Reset High|Extra Pass|Zentraler Abschlussraum|Hoher Raum an der blauen Linie)$/i.test(label)),
    `${drill.id} must not use forced or EN-only UI labels: ${labels.filter((l) => /Net Front|Halfwall|Weak Side|Low Cycle|Reset High|Extra Pass|Zentraler Abschlussraum|Hoher Raum/i.test(l)).join(', ')}`,
  )
}

// D1 zones + width + mirror
const d1 = c3.drills[0]
assert.equal(d1.config.mirror_zones_with_attack_direction, true)
assert.equal(d1.config.observation_fields_progressive, true)
const zoneLabels = Object.fromEntries(d1.config.zones.map((z: { id: string; label: string }) => [z.id, z.label]))
assert.equal(zoneLabels.net_front, 'Direkt vor dem Tor')
assert.equal(zoneLabels.slot, 'Slot')
assert.equal(zoneLabels.left_halfwall, 'Linker Seitenraum')
assert.equal(zoneLabels.right_halfwall, 'Rechter Seitenraum')
assert.equal(zoneLabels.high_point, 'Point')
assert.equal(zoneLabels.behind_net, 'Hinter dem Tor')
const width = d1.config.observation_fields.find((f: { key: string }) => f.key === 'widthProfile')
assert.ok(width.options.some((o: { label: string }) => o.label === 'Mittlere Raumverteilung'))
assert.ok(!width.options.some((o: { label: string }) => /Sehr kompakt|Ausgewogen$/i.test(o.label)))
const missing = d1.config.observation_fields.find((f: { key: string }) => f.key === 'missingSpace')
assert.ok(missing.options.some((o: { label: string }) => /Kein einzelner Raum ist auffällig unbesetzt/i.test(o.label)))

// D2 connections
const d2 = c3.drills[1]
assert.equal(d2.config.structure_fields_progressive, true)
const conn = d2.config.structure_rating.options.map((o: { label: string }) => o.label)
assert.ok(conn.includes('Mehrere direkt spielbare Verbindungen'))
assert.ok(conn.includes('Wenige direkt spielbare Verbindungen'))
assert.ok(conn.includes('Sehr kurze Abstände begrenzen Passwinkel'))
assert.ok(!conn.some((label: string) => /Sehr gut verbunden|Stark getrennt|Zu komprimiert/i.test(label)))
assert.ok(d2.config.structural_function.options.some((o: { label: string }) => /Tief ↔ Point/i.test(o.label)))
assert.ok(d2.config.key_structure_element.options.some((o: { label: string }) => /Direkt spielbar eingebunden/i.test(o.label)))
assert.equal(d2.config.key_structure_element.summary_label, 'Puckferne Seite')
assert.ok(!/hätte mehr Raum gebraucht/i.test(JSON.stringify(d2.miniFeedback || {})))

// D3 movement / opening
const d3 = c3.drills[2]
assert.equal(d3.config.observation_fields_progressive, true)
assert.ok(/Ausgangsbewegung|sichtbare defensive Reaktion|Öffnung/i.test(d3.config.active_focus_text))
assert.ok(!/Ursache und Reaktion/i.test(d3.config.active_focus_text))
const d3Fields = Object.fromEntries(d3.config.observation_fields.map((f: { key: string }) => [f.key, f]))
assert.ok(/Ausgangsbewegung/i.test(d3Fields.movementTrigger.label))
assert.ok(/defensive Reaktion/i.test(d3Fields.defensiveReaction.label))
assert.ok(/sichtbare Öffnung/i.test(d3Fields.createdAdvantage.label))
assert.ok(d3Fields.movementTrigger.options.some((o: { label: string }) => o.label === 'Positionswechsel ohne Puck'))
assert.ok(d3Fields.movementTrigger.options.some((o: { label: string }) => o.label === 'Bewegung zum Tor'))
assert.ok(d3Fields.defensiveReaction.options.some((o: { label: string }) => o.label === 'Sichtbare Übergabe'))
assert.ok(d3Fields.createdAdvantage.options.some((o: { label: string }) => o.label === 'Keine klare Öffnung'))

// D4 next action
const d4 = c3.drills[3]
assert.equal(d4.config.sample_fields_progressive, true)
const d4Fields = Object.fromEntries(d4.config.sample_fields.map((f: { key: string }) => [f.key, f]))
assert.ok(/nächste offensive Aktion/i.test(d4Fields.decision.question || d4Fields.decision.label))
assert.ok(/sichtbare Öffnung/i.test(d4Fields.enablingFactor.label))
assert.ok(d4Fields.decision.options.some((o: { value: string; label: string }) => o.value === 'low_cycle' && /Tiefes Zusammenspiel fortsetzen/i.test(o.label)))
assert.ok(d4Fields.decision.options.some((o: { value: string; label: string }) => o.value === 'reset_high' && /Neuaufbau über den Point/i.test(o.label)))
assert.ok(d4Fields.decision.options.some((o: { value: string; label: string }) => o.value === 'protect_puck' && /Puckkontrolle halten/i.test(o.label)))
assert.ok(d4Fields.enablingFactor.options.some((o: { label: string }) => /Verteidiger orientiert sich zu einer anderen Gefahr/i.test(o.label)))
assert.ok(d4Fields.structuralOutcome.options.some((o: { label: string }) => /verliert ihre Verbundenheit/i.test(o.label)))
assert.ok(!/Kontrolle wiederherstellen sollte|zur Situation gepasst/i.test(JSON.stringify(d4.miniFeedback || {})))

// D5 observation framing + hidden riskProfile
const d5 = c3.drills[4]
assert.equal(d5.config.summary_title, 'Heutige Offensivstruktur-Beobachtung')
assert.ok(/beobachteten Abschnitt war in der Angriffszone erkennbar/i.test(d5.config.sentence_helpers.starter))
assert.ok(!/erzeugt dieses Team Offensive-Zone-Kontrolle/i.test(d5.config.sentence_helpers.starter))
const risk = d5.config.questions.find((q: { key: string }) => q.key === 'riskProfile')
assert.ok(risk)
assert.equal(risk.required, false)
assert.equal(risk.hidden, true)
assert.equal(risk.legacy, true)
assert.ok(/Defensivreaktion einher/i.test(
  d5.config.questions.find((q: { key: string }) => q.key === 'defensiveMovementDriver').label,
))

// Boundaries
assert.ok(c2.title.toLowerCase().includes('neutral'))
assert.ok(c3.title.toLowerCase().includes('offensive'))
assert.ok(c1.drills.every((d: { config?: { mechanic?: string } }) => d.config?.mechanic === 'system_observation'))
assert.ok(c2.drills.every((d: { config?: { mechanic?: string } }) => d.config?.mechanic === 'system_observation'))
assert.ok(/C3/i.test(c2.drills[4].didactics.learning_hint))
assert.ok(/Gameplan|Special Teams|Spätere Tracks/i.test(c3.drills[4].didactics.learning_hint))
assert.ok(!/Eintritt|Neutral Zone schützen/i.test(c3.drills.map((d: { title: string }) => d.title).join(' ')))

console.log('c3Polish.test.ts: all assertions passed')
