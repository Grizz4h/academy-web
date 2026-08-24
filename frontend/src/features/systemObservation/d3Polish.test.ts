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
const trackC = curriculum.tracks.find((track: { id: string }) => track.id === 'C')
const trackD = curriculum.tracks.find((track: { id: string }) => track.id === 'D')
const c2 = trackC.modules.find((module: { id: string }) => module.id === 'C2')
const c3 = trackC.modules.find((module: { id: string }) => module.id === 'C3')
const d2 = trackD.modules.find((module: { id: string }) => module.id === 'D2')
const d3 = trackD.modules.find((module: { id: string }) => module.id === 'D3')

assert.equal(d3.title, 'D3 – Zoneneintritte und Befreiungen')
assert.ok(/lesen und einordnen/i.test(d3.summary))
assert.ok(!/lesen und bewerten/i.test(d3.summary))
assert.ok(d3.learningGoals.some((g: string) => /sichtbaren Bedingungen eine einfachere Lösung/i.test(g)))
assert.ok(!d3.learningGoals.some((g: string) => /richtige Lösung|Entscheidungsqualität|bewerte/i.test(g)))
assert.ok(/C2|C3|D2/i.test(d3.description))

assert.deepEqual(
  d3.drills.map((drill: { title: string }) => drill.title),
  [
    'Verfügbare Zoneneintrittslösung',
    'Unterstützung des Zoneneintritts',
    'Unmittelbarer Zustand nach dem Zoneneintritt',
    'Zonenaustritt oder Befreiung unter Druck',
    'Heutige Beobachtung an den blauen Linien',
  ],
)

assert.equal(d3.drills[0].drill_type, 'rink_corridor_observation')
assert.equal(d3.drills[1].config.mode, 'defensive_structure')
assert.equal(d3.drills[2].config.mode, 'decision_cause_diagnosis')
assert.equal(d3.drills[3].config.mode, 'directional_path_observation')
assert.equal(d3.drills[4].drill_type, 'period_checkin')

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

for (const drill of d3.drills) {
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
  })
  assert.ok(
    !labels.some((label) =>
      /\b(Gap|Carry|Hard Dump|Kontrollierter Dump|Pass Entry|Weak Side|Trailer|Turnover|Blue Line|Support hinter|Forecheck-Support|Sauberer Zone Exit|Volle Kontrolle|Guter erster Pass|Sehr gut unterstützt)\b/i.test(
        label,
      ),
    ),
    `${drill.id} must not show EN-primary or normative UI labels`,
  )
}

// D3_D1
const drill1 = d3.drills[0]
assert.equal(drill1.config.observation_fields_progressive, true)
const gap = drill1.config.observation_fields.find((f: { key: string }) => f.key === 'defensiveGap')
assert.ok(gap.options.some((o: { label: string }) => /Kurzer Abstand zur blauen Linie/i.test(o.label)))
assert.ok(!gap.options.some((o: { label: string }) => /Enger Gap|Mittlerer Gap|Tiefer Gap/i.test(o.label)))
const entry = drill1.config.observation_fields.find((f: { key: string }) => f.key === 'entryOption')
assert.ok(entry.options.some((o: { value: string; label: string }) => o.value === 'carry_middle' && /Puck durch die Mitte führen/i.test(o.label)))
assert.ok(entry.options.some((o: { value: string; label: string }) => o.value === 'controlled_dump' && /vorbereiteter Puckjagd/i.test(o.label)))
assert.ok(entry.options.some((o: { value: string; label: string }) => o.value === 'hard_dump' && /ohne unmittelbare Anschlusskontrolle/i.test(o.label)))
assert.ok(!entry.options.some((o: { label: string }) => /Kontrollierter Dump|Hard Dump|Carry durch/i.test(o.label)))
const enabling = drill1.config.observation_fields.find((f: { key: string }) => f.key === 'enablingFactor')
assert.ok(/sichtbare Faktor/i.test(enabling.label))
assert.ok(enabling.options.some((o: { label: string }) => /Puckferne Seite verfügbar/i.test(o.label)))

// D3_D2 — isolationLevel hidden
const drill2 = d3.drills[1]
assert.equal(drill2.config.observation_fields_progressive, true)
assert.deepEqual(drill2.config.required_observation_fields, ['primarySupport', 'supportShape', 'createdOption'])
const active2 = drill2.config.observation_fields.filter((f: { hidden?: boolean; legacy?: boolean }) => !f.hidden && !f.legacy)
assert.deepEqual(
  active2.map((f: { key: string }) => f.key),
  ['primarySupport', 'supportShape', 'createdOption'],
)
const isolation = drill2.config.observation_fields.find((f: { key: string }) => f.key === 'isolationLevel')
assert.ok(isolation)
assert.equal(isolation.required, false)
assert.equal(isolation.hidden, true)
assert.equal(isolation.legacy, true)
assert.ok(active2[0].options.some((o: { label: string }) => o.label === 'Nachrückender Spieler'))
assert.ok(active2[0].options.some((o: { label: string }) => /Vorbereitete Puckjagd nach tiefem Spiel/i.test(o.label)))
assert.ok(/Forecheck|vorbereitete Puckjagd/i.test(drill2.didactics.explanation + drill2.description))

// D3_D3 — primaryReason hidden, immediateFollowup N/A, three active sample fields
const drill3 = d3.drills[2]
assert.equal(drill3.config.sample_fields_progressive, true)
const active3 = drill3.config.sample_fields.filter((f: { hidden?: boolean; legacy?: boolean }) => !f.hidden && !f.legacy)
assert.deepEqual(
  active3.map((f: { key: string }) => f.key),
  ['immediateState', 'firstOption', 'controlStability'],
)
const primary = drill3.config.sample_fields.find((f: { key: string }) => f.key === 'primaryReason')
assert.ok(primary)
assert.equal(primary.required, false)
assert.equal(primary.hidden, true)
assert.equal(primary.legacy, true)
assert.ok(/zwei bis vier Sekunden|2–4/i.test(drill3.description + drill3.didactics.explanation))
assert.ok(!/erfolgreicher Entry|Über die Blue Line zu kommen ist noch kein erfolgreicher/i.test(drill3.didactics.explanation))
assert.ok(active3[0].options.some((o: { label: string }) => o.label === 'Direkte Puckkontrolle'))
assert.ok(active3[2].options.some((o: { label: string }) => /Zustand bleibt über mehrere Aktionen kontrolliert/i.test(o.label)))
assert.ok(!active3[2].options.some((o: { label: string }) => /^(Stabile Kontrolle|Fragil)$/i.test(o.label)))

// D3_D4 — keep immediateFollowup, progressive
const drill4 = d3.drills[3]
assert.equal(drill4.config.observation_fields_progressive, true)
assert.deepEqual(drill4.config.required_observation_fields, [
  'solution',
  'pressureReason',
  'controlLevel',
  'immediateFollowup',
])
const followup = drill4.config.observation_fields.find((f: { key: string }) => f.key === 'immediateFollowup')
assert.ok(/Unmittelbare Folge/i.test(followup.label))
assert.ok(/ohne Qualitätswertung/i.test(followup.label))
assert.ok(followup.options.some((o: { label: string }) => o.label === 'Icing'))
assert.ok(followup.options.some((o: { label: string }) => /Offener Puckkampf in der neutralen Zone/i.test(o.label)))
const solution = drill4.config.observation_fields.find((f: { key: string }) => f.key === 'solution')
assert.ok(solution.options.some((o: { label: string }) => o.label === 'Kontrollierter Zonenaustritt'))
assert.ok(solution.options.some((o: { label: string }) => /Befreiung entlang der Bande/i.test(o.label)))
const pressure = drill4.config.observation_fields.find((f: { key: string }) => f.key === 'pressureReason')
assert.ok(/Bedingung war unmittelbar/i.test(pressure.label))
assert.ok(pressure.options.some((o: { label: string }) => /Erkennbarer Wechselbedarf/i.test(o.label)))
assert.ok(!pressure.options.some((o: { label: string }) => /Team erschöpft|Support kommt zu spät/i.test(o.label)))
assert.ok(/weiteren sichtbaren Lösungen/i.test(drill4.config.observation_note.label))
assert.ok(/D2_D4|Unterzahl/i.test(drill4.didactics.explanation + drill4.description))

// D3_D5
const drill5 = d3.drills[4]
assert.equal(drill5.config.summary_title, 'Heutige Beobachtung an den blauen Linien')
assert.ok(/keine dauerhafte Team-Identität/i.test(drill5.config.summary_disclaimer))
assert.ok(/an den blauen Linien erkennbar/i.test(drill5.config.sentence_helpers.starter))
const risk = drill5.config.questions.find((q: { key: string }) => q.key === 'riskProfile')
assert.ok(risk)
assert.equal(risk.required, false)
assert.equal(risk.hidden, true)
assert.equal(risk.legacy, true)
const visibleQs = drill5.config.questions.filter((q: { hidden?: boolean; legacy?: boolean }) => !q.hidden && !q.legacy)
assert.ok(visibleQs.every((q: { key: string }) => q.key !== 'riskProfile'))
const entryPref = visibleQs.find((q: { key: string }) => q.key === 'entryPreference')
assert.ok(entryPref.options.some((o: { label: string }) => /Zu wenige Zoneneintritte beobachtet/i.test(o.label)))
const exitBeh = visibleQs.find((q: { key: string }) => q.key === 'pressuredExitBehavior')
assert.ok(exitBeh.options.some((o: { label: string }) => /Zu wenige Zonenaustritte beobachtet/i.test(o.label)))

// Boundaries
assert.ok(c2)
assert.ok(c3)
assert.ok(d2)
assert.ok(/Unterzahl/i.test(d2.title))

// Theory
assert.equal(theory.D3.title, 'Zoneneintritte und Befreiungen')
assert.ok(/2–4 Sekunden|zwei bis vier/i.test(JSON.stringify(theory.D3)))
assert.ok(/primaryReason|isolationLevel|vorbereitete Puckjagd/i.test(JSON.stringify(theory.D3)))
assert.ok(!/Gute Teams müssen|erfolgreicher Entry|Entries-&-Clears-Profil/i.test(JSON.stringify(theory.D3)))

console.log('d3Polish.test.ts OK')
