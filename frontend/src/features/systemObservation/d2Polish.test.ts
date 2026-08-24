import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const theory = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../data/theoryData.json'), 'utf8'),
)
const trackD = curriculum.tracks.find((track: { id: string }) => track.id === 'D')
const d1 = trackD.modules.find((module: { id: string }) => module.id === 'D1')
const d2 = trackD.modules.find((module: { id: string }) => module.id === 'D2')
const d3 = trackD.modules.find((module: { id: string }) => module.id === 'D3')

assert.equal(d2.title, 'D2 – Unterzahlspiel lesen')
assert.ok(/Raumprioritäten, Organisation, Zugriffssignale und Sequenzlösungen/i.test(d2.summary))
assert.ok(d2.learningGoals.some((g: string) => /Raum- und Organisationsprinzipien im Unterzahlspiel/i.test(g)))
assert.ok(d2.learningGoals.some((g: string) => /sichtbarem Halten der Grundordnung/i.test(g)))
assert.ok(!d2.learningGoals.some((g: string) => /PK-Formationen|passivem Blocken/i.test(g)))
assert.ok(/D1|Powerplay/i.test(d2.description))
assert.ok(/D3|Entry|Befreiung/i.test(d2.description))

assert.deepEqual(
  d2.drills.map((drill: { title: string }) => drill.title),
  [
    'Räumliche Priorität',
    'Staffelung und Abstände',
    'Zugriffssignal, Zugriff und Strukturveränderung',
    'Lösung einer Unterzahlsequenz',
    'Heutige Unterzahlbeobachtung',
  ],
)

assert.equal(d2.drills[0].drill_type, 'rink_segmented_zone_observation')
assert.equal(d2.drills[1].config.mode, 'defensive_structure')
assert.equal(d2.drills[2].config.mode, 'single_marker_observation')
assert.equal(d2.drills[3].config.mode, 'decision_cause_diagnosis')
assert.equal(d2.drills[4].drill_type, 'period_checkin')

const collectLabels = (node: unknown, labels: string[] = []) => {
  if (!node || typeof node !== 'object') return labels
  if (Array.isArray(node)) {
    node.forEach((entry) => collectLabels(entry, labels))
    return labels
  }
  const obj = node as Record<string, unknown>
  if (obj.hidden === true || obj.legacy === true) return labels
  if (typeof obj.label === 'string') labels.push(obj.label)
  if (typeof obj.question === 'string') labels.push(obj.question)
  Object.values(obj).forEach((value) => collectLabels(value, labels))
  return labels
}

for (const drill of d2.drills) {
  const labels = collectLabels({
    questions: (drill.config.questions || []).filter(
      (q: { hidden?: boolean; legacy?: boolean }) => q.hidden !== true && q.legacy !== true,
    ),
    observation_fields: (drill.config.observation_fields || []).filter(
      (f: { hidden?: boolean; legacy?: boolean }) => f.hidden !== true && f.legacy !== true,
    ),
    sample_fields: (drill.config.sample_fields || []).filter(
      (f: { hidden?: boolean; legacy?: boolean }) => f.hidden !== true && f.legacy !== true,
    ),
    selection_groups: drill.config.selection_groups,
    zones: drill.config.zones,
  })
  assert.ok(
    !labels.some((label) =>
      /gutes PK|gute Sequenz|bewusst zugelassen|Weak Side|Net Front|Goal Line|Bumper|Seam|Shot Block|Goalie Freeze|Riskanter Clear|Gutes Drucktiming|Ermöglicht durch|passivem Blocken|Penalty-Kill-Profil|Risikoprofil/i.test(
        label,
      ),
    ),
    `${drill.id} must not show normative/EN-primary UI labels: ${labels.filter((l) => /Weak Side|gutes PK|Clear|Bumper/i.test(l)).join(' | ')}`,
  )
}

// D2_D1 — Raumpriorität
const drill1 = d2.drills[0]
assert.equal(drill1.config.mirror_zones_with_attack_direction, true)
assert.equal(drill1.config.observation_fields_progressive, true)
const zones = Object.fromEntries(drill1.config.zones.map((z: { id: string; label: string }) => [z.id, z.label]))
assert.equal(zones.shot_lane, 'Schussbahn vom Point')
assert.equal(zones.bumper_space, 'Zentrale Kurzoption')
assert.equal(zones.middle_slot, 'Slot')
assert.equal(zones.net_front, 'Direkt vor dem Tor')
assert.ok(/Passlinie durch die Unterzahlstruktur/i.test(zones.left_seam))
assert.ok(/weniger stark kontrolliert/i.test(drill1.config.observation_fields.find((f: { key: string }) => f.key === 'concededArea').label))
assert.ok(/stärker und dem weniger stark/i.test(drill1.config.observation_note.label))
assert.ok(!/bewusst/i.test(drill1.config.observation_note.label))
assert.ok(/Schläger schließt/i.test(JSON.stringify(drill1.config.observation_fields)))

// D2_D2 — Staffelung
const drill2 = d2.drills[1]
assert.equal(drill2.config.observation_fields_progressive, true)
assert.equal(drill2.config.position_bubbles.length, 4)
const compactness = drill2.config.observation_fields.find((f: { key: string }) => f.key === 'compactness')
assert.ok(compactness.options.some((o: { label: string }) => o.label === 'Sehr kurze Abstände'))
assert.ok(compactness.options.some((o: { label: string }) => o.label === 'Mittlere Abstände'))
assert.ok(compactness.options.some((o: { label: string }) => o.label === 'Sehr große Abstände'))
assert.ok(!compactness.options.some((o: { label: string }) => /^(Sehr kompakt|Kompakt|Ausgewogen|Weit)$/i.test(o.label)))
const puckShift = drill2.config.observation_fields.find((f: { key: string }) => f.key === 'puckSideShift')
assert.ok(puckShift.options.some((o: { label: string }) => /Sehr deutliche puckseitige Verdichtung/i.test(o.label)))
assert.ok(!puckShift.options.some((o: { label: string }) => /Überladen/i.test(o.label)))
const hl = drill2.config.observation_fields.find((f: { key: string }) => f.key === 'highLowConnection')
assert.equal(hl.summary_label, 'Hohe ↔ tiefe Ebene')
assert.ok(hl.options.some((o: { label: string }) => o.label === 'Direkt verbunden'))
assert.ok(!hl.options.some((o: { label: string }) => /Sehr gut verbunden/i.test(o.label)))
assert.ok(/Abstände oder Verbindungen/i.test(drill2.config.note_label))
assert.ok(!/Lücke/i.test(drill2.config.note_label))
for (const field of drill2.config.observation_fields) {
  assert.ok(field.options.some((o: { label: string }) => /Nicht sicher beurteilbar/i.test(o.label)))
}

// D2_D3 — kein immediateEffect als Pflicht
const drill3 = d2.drills[2]
assert.equal(drill3.config.observation_fields_progressive, true)
assert.deepEqual(drill3.config.required_observation_fields, [
  'triggerLocation',
  'pressureTrigger',
  'pressureExecution',
  'structuralEffect',
])
const activeObs = drill3.config.observation_fields.filter((f: { hidden?: boolean; legacy?: boolean }) => !f.hidden && !f.legacy)
assert.deepEqual(
  activeObs.map((f: { key: string }) => f.key),
  ['pressureTrigger', 'pressureExecution', 'structuralEffect'],
)
const immediate = drill3.config.observation_fields.find((f: { key: string }) => f.key === 'immediateEffect')
assert.ok(immediate)
assert.equal(immediate.required, false)
assert.equal(immediate.hidden, true)
assert.equal(immediate.legacy, true)
const trigger = activeObs.find((f: { key: string }) => f.key === 'pressureTrigger')
assert.ok(/Zugriffssignal|sichtbare Veränderung/i.test(trigger.label + (trigger.summary_label || '')))
assert.ok(trigger.options.some((o: { label: string }) => o.label === 'Unsichere Puckkontrolle'))
assert.ok(!trigger.options.some((o: { label: string }) => /Schlechte Puckkontrolle|Isolierter Puckführer|loser Puck/i.test(o.label)))
assert.ok(/Strukturveränderung|Struktur/i.test(drill3.config.active_focus_text))
assert.ok(!/gutes PK/i.test(drill3.didactics.explanation))

// D2_D4 — Sequenzlösung + D3-Grenze
const drill4 = d2.drills[3]
assert.equal(drill4.config.sample_fields_progressive, true)
const resolution = drill4.config.sample_fields.find((f: { key: string }) => f.key === 'resolution')
assert.ok(resolution.options.some((o: { label: string }) => o.label === 'Kontrollierte Befreiung'))
assert.ok(resolution.options.some((o: { label: string }) => o.label === 'Befreiung unter starkem Druck'))
assert.ok(!resolution.options.some((o: { label: string }) => /Kontrollierter Clear|Riskanter Clear/i.test(o.label)))
const enabling = drill4.config.sample_fields.find((f: { key: string }) => f.key === 'enablingFactor')
assert.ok(/Begleitfaktor/i.test(enabling.label))
assert.ok(/sichtbare Faktor begleitete/i.test(enabling.question))
assert.ok(enabling.options.some((o: { label: string }) => /Zugriff beginnt gleichzeitig mit dem sichtbaren Signal/i.test(o.label)))
assert.ok(!enabling.options.some((o: { label: string }) => /Gutes Drucktiming|Shot Block|Net Front kontrolliert/i.test(o.label)))
const control = drill4.config.sample_fields.find((f: { key: string }) => f.key === 'controlLevel')
assert.ok(control.options.some((o: { label: string }) => /Unterzahl kontrolliert die nächste Aktion/i.test(o.label)))
assert.ok(!control.options.some((o: { label: string }) => /Volle Kontrolle|Notlösung/i.test(o.label)))
const second = drill4.config.sample_fields.find((f: { key: string }) => f.key === 'secondPuck')
assert.ok(second.options.some((o: { label: string }) => o.label === 'Offener Puckkampf'))
assert.ok(/D3/i.test(drill4.didactics.explanation))
assert.ok(/Befreiungsentscheidung/i.test(drill4.didactics.explanation))
assert.ok(/unmittelbare Gefahr beendet, unterbrochen oder fortgesetzt/i.test(drill4.config.sample_note_label))

// D2_D5 — Unterzahlbeobachtung, riskProfile hidden
const drill5 = d2.drills[4]
assert.equal(drill5.config.summary_title, 'Heutige Unterzahlbeobachtung')
assert.ok(/kein Coaching-Urteil|keine dauerhafte Team/i.test(drill5.config.summary_disclaimer))
const risk = drill5.config.questions.find((q: { key: string }) => q.key === 'riskProfile')
assert.ok(risk)
assert.equal(risk.required, false)
assert.equal(risk.hidden, true)
assert.equal(risk.legacy, true)
const visibleQs = drill5.config.questions.filter((q: { hidden?: boolean; legacy?: boolean }) => !q.hidden && !q.legacy)
assert.ok(visibleQs.every((q: { key: string }) => q.key !== 'riskProfile'))
assert.ok(visibleQs.some((q: { key: string }) => q.key === 'protectedPriority'))
assert.ok(visibleQs.some((q: { key: string }) => q.key === 'profileSummary'))
assert.ok(/Unterzahlprinzipien/i.test(visibleQs.find((q: { key: string }) => q.key === 'profileSummary').label))

// Boundary: D1 / D3 titles exist and D2 does not steal Entry detail
assert.ok(d1)
assert.ok(d3)
assert.ok(/Entries|Clears|Befreiung/i.test(d3.title + d3.summary + (d3.description || '')))

// Theory alignment
assert.equal(theory.D2.title, 'Unterzahlspiel lesen')
assert.ok(/Zugriffssignal/i.test(JSON.stringify(theory.D2)))
assert.ok(/Grenze zu D3|D3 analysiert/i.test(JSON.stringify(theory.D2)))
assert.ok(!/gutes PK|Penalty-Kill-Profil|riskanter Clear/i.test(JSON.stringify(theory.D2)))
assert.ok(/immediateEffect|Sequenzlösung in D2_D4|D2_D4/i.test(JSON.stringify(theory.D2)))

console.log('d2Polish.test.ts OK')
