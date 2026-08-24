import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackC = curriculum.tracks.find((track: { id: string }) => track.id === 'C')
const trackD = curriculum.tracks.find((track: { id: string }) => track.id === 'D')
const c3 = trackC.modules.find((module: { id: string }) => module.id === 'C3')
const d1 = trackD.modules.find((module: { id: string }) => module.id === 'D1')
const d2 = trackD.modules.find((module: { id: string }) => module.id === 'D2')

assert.equal(d1.title, 'D1 – Powerplay-Strukturen')
assert.ok(/Räume, Funktionen, Bewegungen und Angriffssignale/i.test(d1.summary))
assert.ok(d1.learningGoals.some((g: string) => /Raum- und Funktionsstrukturen/i.test(g)))
assert.ok(!d1.learningGoals.some((g: string) => /Erkenne grundlegende Powerplay-Setups/i.test(g)))

assert.deepEqual(
  d1.drills.map((drill: { title: string }) => drill.title),
  [
    'Lokaler Überzahlvorteil',
    'Powerplay-Funktionen',
    'Powerplay-Bewegung und Unterzahlreaktion',
    'Angriffssignal, Aktion und unmittelbare Folge',
    'Heutige Powerplay-Beobachtung',
  ],
)

assert.equal(d1.drills[0].drill_type, 'rink_segmented_zone_observation')
assert.equal(d1.drills[1].config.mode, 'defensive_structure')
assert.equal(d1.drills[2].config.mode, 'directional_path_observation')
assert.equal(d1.drills[3].config.mode, 'decision_cause_diagnosis')
assert.equal(d1.drills[4].drill_type, 'period_checkin')

const collectLabels = (node: unknown, labels: string[] = []) => {
  if (!node || typeof node !== 'object') return labels
  if (Array.isArray(node)) {
    node.forEach((entry) => collectLabels(entry, labels))
    return labels
  }
  const obj = node as Record<string, unknown>
  if (obj.hidden === true || obj.legacy === true) return labels
  if (typeof obj.label === 'string') labels.push(obj.label)
  Object.values(obj).forEach((value) => collectLabels(value, labels))
  return labels
}

// D1_D1
const drill1 = d1.drills[0]
assert.equal(drill1.config.mirror_zones_with_attack_direction, true)
assert.equal(drill1.config.observation_fields_progressive, true)
const zones = Object.fromEntries(drill1.config.zones.map((z: { id: string; label: string }) => [z.id, z.label]))
assert.equal(zones.high, 'Point')
assert.equal(zones.bumper, 'Zentrale Kurzoption')
assert.equal(zones.net_front, 'Direkt vor dem Tor')
assert.equal(zones.left_halfwall, 'Linker Seitenraum')
const pkReaction = drill1.config.observation_fields.find((f: { key: string }) => f.key === 'pkReaction')
assert.ok(/sichtbare Anpassung der Unterzahl/i.test(pkReaction.label))
assert.ok(!/muss die Unterzahl/i.test(pkReaction.label))
assert.ok(pkReaction.options.some((o: { label: string }) => /Puckferne Seite wird weniger stark kontrolliert/i.test(o.label)))

// D1_D2
const drill2 = d1.drills[1]
assert.equal(drill2.config.structure_fields_progressive, true)
const visibleFunctions = drill2.config.observation_fields.find((f: { key: string }) => f.key === 'visibleFunctions')
assert.ok(visibleFunctions.options.some((o: { label: string }) => o.label === 'Zentrale Kurzoption'))
assert.ok(visibleFunctions.options.some((o: { label: string }) => o.label === 'Hohe Verbindung'))
assert.ok(!visibleFunctions.options.some((o: { label: string }) => /^(High|Bumper \/ Mitte|Net Front|Halfwall links)$/i.test(o.label)))
assert.ok(/deutlichste Anpassung der Unterzahl/i.test(drill2.config.structural_function.label))

// D1_D3
const drill3 = d1.drills[2]
assert.equal(drill3.config.observation_fields_progressive, true)
const move = drill3.config.observation_fields.find((f: { key: string }) => f.key === 'movementType')
assert.ok(/geht mit einer sichtbaren Anpassung/i.test(move.label))
assert.ok(!/zwingt die Unterzahl/i.test(move.label))
const react = drill3.config.observation_fields.find((f: { key: string }) => f.key === 'pkReaction')
const boxOpt = react.options.find((o: { value: string }) => o.value === 'box_compresses')
assert.ok(boxOpt)
assert.ok(/Unterzahlstruktur zieht sich zusammen/i.test(boxOpt.label))
assert.ok(!/^Box /i.test(boxOpt.label))
assert.ok(!collectLabels(drill3.config.observation_fields).some((label) => /^Box\b/i.test(label)))

// D1_D4 — three active classification fields
const drill4 = d1.drills[3]
assert.equal(drill4.config.sample_fields_progressive, true)
const activeFields = drill4.config.sample_fields.filter((f: { hidden?: boolean; legacy?: boolean }) => !f.hidden && !f.legacy)
assert.deepEqual(
  activeFields.map((f: { key: string }) => f.key),
  ['attackTrigger', 'attackAction', 'immediateOutcome'],
)
const timing = drill4.config.sample_fields.find((f: { key: string }) => f.key === 'timingReason')
assert.ok(timing)
assert.equal(timing.required, false)
assert.equal(timing.hidden, true)
assert.equal(timing.legacy, true)
assert.ok(/Angriffssignal/i.test(activeFields[0].label))
assert.ok(/Unmittelbare Folge/i.test(activeFields[2].label))
assert.ok(activeFields[1].options.some((o: { value: string; label: string }) => o.value === 'one_timer' && /Direktabschluss nach Pass/i.test(o.label)))
assert.ok(activeFields[1].options.some((o: { value: string; label: string }) => o.value === 'shot_from_high' && /Abschluss vom Point/i.test(o.label)))
assert.ok(!/gutes Powerplay/i.test(drill4.description + drill4.didactics.explanation))

// D1_D5
const drill5 = d1.drills[4]
assert.equal(drill5.config.summary_title, 'Heutige Powerplay-Beobachtung')
assert.ok(/beobachteten Abschnitt war im Powerplay erkennbar/i.test(drill5.config.sentence_helpers.starter))
const decision = drill5.config.questions.find((q: { key: string }) => q.key === 'decisionProfile')
assert.ok(decision)
assert.equal(decision.required, false)
assert.equal(decision.hidden, true)
assert.equal(decision.legacy, true)
assert.ok(/sichtbaren Unterzahlreaktion einher/i.test(
  drill5.config.questions.find((q: { key: string }) => q.key === 'pkMovementDriver').label,
))

for (const drill of d1.drills) {
  const labels = collectLabels({
    zones: drill.config.zones,
    observation_fields: drill.config.observation_fields,
    sample_fields: drill.config.sample_fields,
    questions: drill.config.questions,
    structure_rating: drill.config.structure_rating,
    structural_function: drill.config.structural_function,
    selection_groups: drill.config.selection_groups,
  })
  assert.ok(
    !labels.some((label) => /guter Angriff|schlechtes Powerplay|richtige Formation|Shot First|Pass First/i.test(label)),
    `${drill.id} grading/identity labels: ${labels.filter((l) => /Shot First|Pass First|gutes/i.test(l)).join(', ')}`,
  )
  assert.ok(
    !labels.some((label) => /^(High|Left Halfwall|Right Halfwall|Bumper \/ Mitte|Net Front|Goal Line \/ Below Net|Weak Side|One-Timer|Downhill Drive|Seam Pass)$/i.test(label)),
    `${drill.id} EN-first labels remain: ${labels.filter((l) => /Halfwall|Net Front|Weak Side|One-Timer|Bumper \//i.test(l)).join(', ')}`,
  )
}

// Boundaries
assert.ok(c3.title.toLowerCase().includes('offensive'))
assert.ok(d2.title.toLowerCase().includes('penalty') || /unterzahl|pk|killing/i.test(d2.title + d2.summary))
assert.ok(/D2/i.test(drill5.didactics.learning_hint))
assert.ok(!/Clearing|Entry als Hauptthema/i.test(d1.drills.map((d: { title: string }) => d.title).join(' ')))

console.log('d1Polish.test.ts: all assertions passed')
