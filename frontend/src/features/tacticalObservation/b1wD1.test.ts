import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const trackB = curriculum.tracks.find((track: { id: string }) => track.id === 'B')
assert.ok(trackB, 'track B exists')

const moduleIds = trackB.modules.map((module: { id: string }) => module.id)
assert.deepEqual(moduleIds.slice(0, 4), ['B1', 'B1W', 'B2', 'B3'])

const b1 = trackB.modules.find((module: { id: string }) => module.id === 'B1')
const b1w = trackB.modules.find((module: { id: string }) => module.id === 'B1W')
assert.ok(b1w, 'B1W module exists')
assert.equal(b1w.title, 'B1W – Winger im Spiel lesen')
assert.equal(b1.drills.length, 5, 'existing B1 drills untouched')
assert.equal(b1w.drills.length, 5)
assert.deepEqual(
  b1w.drills.map((drill: { id: string }) => drill.id),
  ['B1W_D1', 'B1W_D2', 'B1W_D3', 'B1W_D4', 'B1W_D5'],
)

const d1 = b1w.drills.find((drill: { id: string }) => drill.id === 'B1W_D1')
assert.ok(d1, 'B1W_D1 exists')
assert.equal(d1.drill_type, 'sample_log')
assert.equal(d1.title, 'Winger im Spiel lesen')
assert.equal(d1.config.sample_label, 'Winger-Moment')
assert.equal(d1.config.note_min_chars, 25)
assert.equal(d1.config.note_required, true)
assert.equal(d1.config.max_samples_per_phase, 3)
assert.ok(!d1.config.observation_sections, 'D1 stays classic sample_log')
assert.equal(d1.config.state_label, 'Wo ist der Winger relativ zum Puck?')
assert.equal(d1.config.factor_label, 'Was ist am deutlichsten sichtbar?')
assert.deepEqual(d1.config.state_options, [
  'pucknah',
  'puckfern',
  'wechselt den Bezug',
  'unklar',
])
assert.deepEqual(d1.config.factors_by_state.pucknah, [
  'bietet Unterstützung',
  'hält oder öffnet Raum',
  'attackiert freien Raum',
  'bewegt sich in die Puckaktion',
  'unklar',
])
assert.ok(d1.didactics.inline_explanations['bietet Unterstützung']?.meaning)
assert.ok(d1.didactics.learning_hint.includes('Breite, Tiefe'))
assert.equal(d1.miniFeedback.oncePerSection, true)
assert.equal(d1.miniFeedback.groups[0].questions.length, 1)

const d2 = b1w.drills.find((drill: { id: string }) => drill.id === 'B1W_D2')
assert.ok(d2, 'B1W_D2 exists')
assert.equal(d2.drill_type, 'draggable_rink_observation')
assert.equal(d2.title, 'Breite und Tiefe erkennen')
assert.equal(d2.config.mode, 'single_marker_observation')
assert.equal(d2.config.observation_count, 3)
assert.equal(d2.config.location_key, 'wingerLocation')
assert.equal(d2.config.show_attack_direction_control, true)
assert.ok(d2.config.mirror_bubbles_with_attack_direction)
const spatial = d2.config.observation_fields.find((field: { key: string }) => field.key === 'spatialFunction')
assert.ok(spatial)
assert.deepEqual(
  spatial.options.map((opt: { value: string }) => opt.value),
  ['width', 'depth', 'second_layer', 'unclear'],
)
assert.ok(spatial.options.every((opt: { description?: string }) => Boolean(opt.description)))
assert.equal(d2.config.observation_note?.label, 'Woran hast du die räumliche Funktion erkannt?')
assert.ok(!d2.config.observation_note?.required)
assert.ok(d2.didactics.explanation.toLowerCase().includes('eigener puckbesitz') || d2.didactics.explanation.includes('eigenem Puckbesitz'))
assert.ok(d2.didactics.learning_hint.includes('pucknahe'))
assert.equal(d2.miniFeedback.oncePerSection, true)
assert.equal(d2.miniFeedback.groups[0].questions.length, 1)

const d3 = b1w.drills.find((drill: { id: string }) => drill.id === 'B1W_D3')
assert.ok(d3, 'B1W_D3 exists')
assert.equal(d3.drill_type, 'sample_log')
assert.equal(d3.title, 'Pucknah und puckfern lesen')
assert.equal(d3.config.sample_label, 'Winger-Moment')
assert.equal(d3.config.required_samples, 2)
assert.equal(d3.config.max_samples_per_phase, 3)
assert.equal(d3.config.observation_sections_progressive, true)
assert.equal(d3.config.note_required, false)
assert.ok(!d3.config.state_options, 'D3 uses sections, not classic state/factor')
const sections = d3.config.observation_sections
assert.equal(sections.length, 2)
assert.deepEqual(
  sections.map((section: { key: string }) => section.key),
  ['near_side', 'far_side'],
)
assert.ok(sections[0].lead)
assert.ok(sections[1].lead.toLowerCase().includes('weg vom puck'))
assert.deepEqual(
  sections[0].options.map((opt: { value: string }) => opt.value),
  ['supports_puck_action', 'offers_outlet', 'moves_into_space', 'holds_distance', 'unclear'],
)
assert.deepEqual(
  sections[1].options.map((opt: { value: string }) => opt.value),
  ['holds_width', 'attacks_depth', 'cuts_middle', 'remote_outlet', 'moves_toward_puck_side', 'unclear'],
)
assert.ok(sections.every((section: { options: Array<{ description?: string }> }) =>
  section.options.every((opt) => Boolean(opt.description)),
))
assert.ok(d3.didactics.explanation.includes('beide Seiten'))
assert.ok(d3.didactics.learning_hint.includes('Bande'))
assert.ok(d3.miniFeedback.groups[0].questions[0].includes('puckfernen'))
assert.equal(d3.sceneSlug, 'Winger-Sides')
assert.ok(
  !sections.some((section: { selection_mode?: string }) => section.selection_mode === 'multi'),
  'D3 stays single-choice sections',
)

const d4 = b1w.drills.find((drill: { id: string }) => drill.id === 'B1W_D4')
assert.ok(d4, 'B1W_D4 exists')
assert.equal(d4.drill_type, 'sample_log')
assert.equal(d4.title, 'Winger am Bandenmoment lesen')
assert.equal(d4.config.sample_label, 'Bandenmoment')
assert.equal(d4.config.required_samples, 3)
assert.equal(d4.config.observation_sections_progressive, true)
assert.equal(d4.config.note_required, true)
assert.equal(d4.config.note_min_chars, 25)
assert.equal(d4.config.note_label, 'Was hast du konkret gesehen?')
const d4Sections = d4.config.observation_sections
assert.equal(d4Sections.length, 2)
assert.deepEqual(
  d4Sections.map((section: { key: string }) => section.key),
  ['winger_behavior', 'outside_available'],
)
assert.equal(d4Sections[0].selection_mode || 'single', 'single')
assert.equal(d4Sections[1].selection_mode, 'multi')
assert.deepEqual(d4Sections[1].exclusive_values, ['nothing_clear', 'unclear'])
assert.deepEqual(
  d4Sections[0].options.map((opt: { value: string }) => opt.value),
  ['works_on_puck', 'supports_immediately', 'stays_outside_outlet', 'exits_puck_space', 'unclear'],
)
assert.deepEqual(
  d4Sections[1].options.map((opt: { value: string }) => opt.value),
  ['pass_option', 'open_space', 'offensive_layering', 'nothing_clear', 'unclear'],
)
assert.ok(!d4Sections[1].options.some((opt: { value: string; label?: string }) =>
  String(opt.value).includes('absicher') || String(opt.label || '').toLowerCase().includes('absicherung'),
))
assert.ok(d4.didactics.observation_guide.what_to_watch.some((item: string) => item.toLowerCase().includes('gegnerdruck')))
assert.ok(d4.didactics.learning_hint.includes('Möglichkeiten'))
assert.ok(d4.miniFeedback.groups[0].questions[0].includes('Puckraums'))
assert.equal(d4.sceneSlug, 'Winger-Board')

const d5 = b1w.drills.find((drill: { id: string }) => drill.id === 'B1W_D5')
assert.ok(d5, 'B1W_D5 exists')
assert.equal(d5.drill_type, 'sample_log')
assert.equal(d5.title, 'Wirkung der Winger-Bewegung erkennen')
assert.equal(d5.config.sample_label, 'Bewegungs-Moment')
assert.equal(d5.config.required_samples, 3)
assert.equal(d5.config.observation_sections_progressive, true)
assert.equal(d5.config.note_required, true)
assert.equal(d5.config.note_min_chars, 25)
assert.equal(d5.config.note_label, 'Woran hast du die Veränderung erkannt?')
const d5Sections = d5.config.observation_sections
assert.equal(d5Sections.length, 2)
assert.deepEqual(
  d5Sections.map((section: { key: string }) => section.key),
  ['movement', 'visible_change'],
)
assert.equal(d5Sections[0].selection_mode || 'single', 'single')
assert.equal(d5Sections[1].selection_mode, 'multi')
assert.deepEqual(d5Sections[1].exclusive_values, ['no_clear_change', 'unclear'])
assert.deepEqual(
  d5Sections[0].options.map((opt: { value: string }) => opt.value),
  [
    'opens_outward',
    'attacks_depth',
    'cuts_inside',
    'separates_from_pressure',
    'changes_attack_layer',
    'other_clear_movement',
    'unclear',
  ],
)
assert.deepEqual(
  d5Sections[1].options.map((opt: { value: string }) => opt.value),
  [
    'new_passing_lane',
    'more_space_for_puck_carrier',
    'other_attack_space_occupied',
    'defense_adjusted',
    'extra_outlet',
    'no_clear_change',
    'unclear',
  ],
)
assert.ok(!d5Sections[1].options.some((opt: { value: string; label?: string }) =>
  String(opt.value).toLowerCase().includes('weakside')
  || String(opt.label || '').toLowerCase().includes('weakside'),
))
assert.ok(d5Sections[1].options.find((opt: { value: string; description?: string }) => opt.value === 'defense_adjusted')?.description?.includes('sichtbar'))
assert.ok(d5.didactics.explanation.includes('Absicht nicht erraten') || d5.didactics.explanation.includes('warum'))
assert.ok(d5.didactics.learning_hint.includes('zusammenhängt'))
assert.ok(d5.miniFeedback.groups[0].questions[0].includes('sichtbare Veränderung'))
assert.equal(d5.sceneSlug, 'Winger-Effect')

// D1–D4 unchanged identity
assert.equal(d1.id, 'B1W_D1')
assert.equal(d1.drill_type, 'sample_log')
assert.equal(d2.drill_type, 'draggable_rink_observation')
assert.equal(d3.drill_type, 'sample_log')
assert.equal(d4.drill_type, 'sample_log')

// No renumbering of existing B tracks
assert.ok(!trackB.modules.some((module: { id: string }) => module.id === 'B1_5'))
assert.equal(trackB.modules.find((module: { id: string }) => module.id === 'B2')?.id, 'B2')

console.log('b1wD1.test.ts: all assertions passed')
