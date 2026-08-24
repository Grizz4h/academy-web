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
    'Geschlossene und verbleibende Eintrittswege',
    'Tiefenstaffelung, Abstände und Breite',
    'Lenkung beobachten',
    'Anpassung nach Überspielen der ersten Ebene',
    'Heutige Neutral-Zone-Beobachtung',
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
assert.ok(/Systemnamen|Zweck vor|Raumwirkung|keine bewusste/i.test(
  c2.drills[0].didactics.explanation + JSON.stringify(c2.drills[0].didactics.observation_guide.ignore),
))
assert.ok(/nicht.*versagt|Keine Schuldzuweisung|Hat der Verteidiger/i.test(
  c2.drills[3].description + c2.drills[3].didactics.explanation,
))
assert.ok(!/Welches System ist das/i.test(c2.drills.map((d: { title: string }) => d.title).join(' ')))

const collectLabels = (node: unknown, labels: string[] = []) => {
  if (!node || typeof node !== 'object') return labels
  if (Array.isArray(node)) {
    node.forEach((entry) => collectLabels(entry, labels))
    return labels
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.label === 'string') labels.push(obj.label)
  Object.values(obj).forEach((value) => collectLabels(value, labels))
  return labels
}

for (const drill of c2.drills) {
  const labels = collectLabels({
    questions: drill.config.questions,
    observation_fields: (drill.config.observation_fields || []).filter(
      (field: { hidden?: boolean; legacy?: boolean }) => field.hidden !== true && field.legacy !== true,
    ),
    selection_groups: drill.config.selection_groups,
    structural_function: drill.config.structural_function,
    key_structure_element: drill.config.key_structure_element,
  })
  assert.ok(
    !labels.some((label) => /gutes System|schlechtes System|richtige Position|falsche Position|Dump-in|schwache Seite/i.test(label)),
    `${drill.id} must not offer coaching grading labels or EN-first Dump/weak-side UI labels`,
  )
}

// D1 terminology
const d1 = c2.drills[0]
assert.ok(/am ehesten|Raumkontrolle/i.test(d1.config.selection_groups.find((g: { key: string }) => g.key === 'availableRoute').question))
assert.equal(d1.config.selection_groups.find((g: { key: string }) => g.key === 'availableRoute').label, 'Verbleibender Weg')
assert.equal(d1.config.mirror_zones_with_attack_direction, true)
assert.equal(d1.config.show_attack_direction_control, true)
assert.ok(/Puck tief spielen/i.test(JSON.stringify(d1.config.selection_groups)))
assert.ok(/bewusst anbieten wollte|keine bewusste Freigabe/i.test(d1.didactics.explanation + d1.description))
assert.ok(!/die Defensive will den Gegner|bewusst angebotener Raum/i.test(d1.didactics.explanation + d1.description + JSON.stringify(d1.config.missions || [])))
assert.ok(/zwei unterschiedliche Momente/i.test(d1.config.conflict_hint))

// D2 spacing / progressive / no coaching feedback
const d2 = c2.drills[1]
assert.equal(d2.config.structure_fields_progressive, true)
assert.equal(d2.config.active_focus_title, 'Aktiver Fokus')
const spacingLabels = d2.config.structural_function.options.map((o: { label: string }) => o.label)
assert.ok(spacingLabels.includes('Große Abstände zwischen den Ebenen'))
assert.ok(spacingLabels.includes('Sehr kurze Abstände ohne klare Tiefentrennung'))
assert.ok(spacingLabels.includes('Mittlere Abstände zwischen den Ebenen'))
assert.ok(!spacingLabels.some((label: string) => /Zu weit|Zu eng|Ausgewogen$/i.test(label)))
assert.ok(d2.config.key_structure_element.options.some((o: { label: string }) => o.label === 'Über die Breite verbunden'))
assert.ok(!/hätte mehr Tiefe|verbessert\?/i.test(JSON.stringify(d2.miniFeedback || {})))

// D3 steering
const d3 = c2.drills[2]
assert.equal(d3.config.observation_fields_progressive, true)
assert.equal(d3.config.active_focus_title, 'Aktiver Fokus')
const d3Fields = Object.fromEntries(d3.config.observation_fields.map((f: { key: string }) => [f.key, f]))
assert.ok(/Raumkontrolle am ehesten/i.test(d3Fields.steeringRoute.label))
assert.ok(/sichtbare Faktor|Einflussfaktor/i.test(d3Fields.steeringCause.label))
assert.ok(/unmittelbare Folge/i.test(d3Fields.steeringEffect.label))
assert.ok(d3Fields.steeringRoute.options.some((o: { label: string }) => /puckferne Seite/i.test(o.label)))
assert.ok(d3Fields.steeringRoute.options.some((o: { label: string }) => o.label === 'Puck tief spielen'))
assert.ok(d3Fields.steeringCause.options.some((o: { label: string }) => /Positionierung an der blauen Linie/i.test(o.label)))

// D4 recovery + legacy endpointMeaning
const d4 = c2.drills[3]
assert.equal(d4.config.observation_fields_progressive, true)
assert.ok(d4.config.points.some((p: { id: string; label: string }) => p.id === 'end' && /Ende der beobachteten Reaktion/i.test(p.label)))
const endpoint = d4.config.observation_fields.find((f: { key: string }) => f.key === 'endpointMeaning')
assert.ok(endpoint)
assert.equal(endpoint.required, false)
assert.equal(endpoint.hidden, true)
assert.equal(endpoint.legacy, true)
const reaction = d4.config.observation_fields.find((f: { key: string }) => f.key === 'nextLayerReaction')
assert.ok(reaction.options.some((o: { label: string }) => /übernimmt und bleibt verbunden/i.test(o.label)))
assert.ok(reaction.options.some((o: { label: string }) => /einzelner Verteidiger reagiert sichtbar/i.test(o.label)))
assert.ok(reaction.options.some((o: { label: string }) => /verliert ihre Verbundenheit/i.test(o.label)))
const outcome = d4.config.observation_fields.find((f: { key: string }) => f.key === 'sequenceOutcome')
assert.ok(outcome.options.some((o: { label: string }) => /zentraler Angriff oder Überzahl/i.test(o.label)))
assert.ok(outcome.options.some((o: { label: string }) => o.label === 'Puck wird tief gespielt'))

// D5 observation framing + hidden riskProfile
const d5 = c2.drills[4]
assert.equal(d5.config.summary_title, 'Heutige Neutral-Zone-Beobachtung')
assert.ok(/beobachteten Abschnitt war in der neutralen Zone erkennbar/i.test(d5.config.sentence_helpers.starter))
assert.ok(!/Dieses Team kontrolliert/i.test(d5.config.sentence_helpers.starter))
const risk = d5.config.questions.find((q: { key: string }) => q.key === 'riskProfile')
assert.ok(risk)
assert.equal(risk.required, false)
assert.equal(risk.hidden, true)
assert.equal(risk.legacy, true)
assert.ok(d5.config.questions.some((q: { key: string; label: string }) => q.key === 'profileSummary' && /Prinzipien|beobachteten Abschnitt/i.test(q.label)))
const visibleD5Labels = collectLabels({
  questions: d5.config.questions.filter((q: { hidden?: boolean; legacy?: boolean }) => q.hidden !== true && q.legacy !== true),
})
assert.ok(!visibleD5Labels.some((label) => /Dump-in|schwache Seite|improvisieren|bricht.*auseinander|Hochriskant/i.test(label)))

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
