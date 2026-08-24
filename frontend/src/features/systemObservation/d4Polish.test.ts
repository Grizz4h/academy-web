import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const curriculum = JSON.parse(readFileSync(join(root, 'data/academy/curriculum.json'), 'utf8'))
const theory = JSON.parse(readFileSync(join(root, 'frontend/src/data/theoryData.json'), 'utf8'))
const sidequest = JSON.parse(
  readFileSync(join(root, 'frontend/src/data/sidequests/numerical_situation.json'), 'utf8'),
)

const trackD = curriculum.tracks.find((t: { id: string }) => t.id === 'D')
const d3 = trackD.modules.find((m: { id: string }) => m.id === 'D3')
const d4 = trackD.modules.find((m: { id: string }) => m.id === 'D4')

assert.ok(d3)
assert.equal(d4.active, false)
assert.equal(d4.deprecated, true)
assert.equal(d4.sidequest_category, 'numerical_situation')
assert.equal(d4.title, 'D4 – Zusätzlicher Feldspieler')
assert.ok(/Sidequest/i.test(d4.summary))
assert.ok(d4.learningGoals.every((g: string) => !/Bewerte|Panik|chaotische/i.test(g)))
assert.ok(d4.learningGoals.some((g: string) => /Raumaufteilung|Anschlussoptionen/i.test(g)))

const drill1 = d4.drills.find((d: { id: string }) => d.id === 'D4_D1')
const drill2 = d4.drills.find((d: { id: string }) => d.id === 'D4_D2')
const drill3 = d4.drills.find((d: { id: string }) => d.id === 'D4_D3')
const drill4 = d4.drills.find((d: { id: string }) => d.id === 'D4_D4')

// D4_D1 structure labels
const sq = drill1.config.questions.find((q: { key: string }) => q.key === 'structure_quality')
assert.ok(sq.options.some((o: { label: string }) => /Struktur durchgehend erkennbar/i.test(o.label)))
assert.ok(sq.options.some((o: { label: string }) => /Nicht sicher beurteilbar/i.test(o.label)))
assert.ok(!sq.options.some((o: { label: string }) => o.label === 'chaotisch' || o.label === 'klar'))
assert.ok(/Raumaufteilung erkennbar/i.test(drill1.config.questions.find((q: { key: string }) => q.key === 'note').label))

// D4_D2 action preparation
assert.equal(drill2.title, 'Vorbereitung der Aktion')
const dq = drill2.config.questions.find((q: { key: string }) => q.key === 'decision_quality')
assert.ok(/Anschlussoptionen/i.test(dq.label))
assert.ok(!/Entscheidungsqualität/i.test(dq.label + (dq.summary_label || '')))
const visibleDq = dq.options.filter((o: { hidden?: boolean; legacy?: boolean }) => !o.hidden && !o.legacy)
assert.deepEqual(
  visibleDq.map((o: { value: string }) => o.value),
  ['multiple_options_visible', 'one_option_visible', 'no_option_visible', 'unclear'],
)
assert.ok(dq.options.some((o: { value: string; legacy?: boolean }) => o.value === 'panisch' && o.legacy === true))
assert.ok(!/Gute Entscheidungen|panisch|Geduld vs/i.test(JSON.stringify(drill2.didactics)))

// D4_D3 absicherung
assert.equal(drill3.title, 'Absicherung hinter dem Puck')
const rc = drill3.config.questions.find((q: { key: string }) => q.key === 'risk_control')
assert.ok(rc.options.some((o: { label: string }) => o.label === 'Absicherung erkennbar'))
assert.ok(rc.options.some((o: { label: string }) => /Nicht sicher beurteilbar/i.test(o.label)))
assert.ok(!/\bkein Mut\b|Ballverlust/i.test(JSON.stringify(drill3.didactics) + drill3.description))
assert.ok(/nicht sicher beobachten|nicht sichtbar/i.test(JSON.stringify(drill3.didactics)))

// D4_D4 removed
assert.equal(drill4.active, false)
assert.equal(drill4.deprecated, true)
assert.equal(drill4.sidequest_usage, 'removed')
const tc = drill4.config.questions.find((q: { key: string }) => q.key === 'team_composure')
assert.equal(tc.hidden, true)
assert.equal(tc.legacy, true)
assert.equal(tc.required, false)

// Active surface must not advertise psychology / old display labels
const collectVisibleLabels = (drills: any[]) => {
  const labels: string[] = []
  for (const d of drills) {
    labels.push(d.title, d.description || '')
    labels.push(JSON.stringify(d.didactics || {}))
    for (const q of d.config.questions || []) {
      if (q.hidden || q.legacy) continue
      labels.push(q.label || '', q.summary_label || '')
      for (const o of q.options || []) {
        if (typeof o === 'string') labels.push(o)
        else if (o && !o.hidden && !o.legacy) labels.push(o.label || '')
      }
    }
  }
  return labels.join('\n')
}
const activeLabels = collectVisibleLabels([drill1, drill2, drill3])
assert.ok(!/Teamruhe|\bpanisch\b|\bangespannt\b|Mentale Ruhe/i.test(activeLabels))
assert.ok(!/\bchaotisch\b|\bklar\b|\binstabil\b|\bgeduldig\b|\bforciert\b/i.test(activeLabels))
assert.ok(/Keine stabile Struktur erkennbar/i.test(activeLabels))

// Theory sidequest framing
assert.ok(/SIDEQUEST/i.test(theory.D4.badge))
assert.equal(theory.D4.title, 'Zusätzlicher Feldspieler')
assert.ok(/kein DEB|kein offizieller|RinQ/i.test(theory.D4.overview))
assert.ok(/Teamruhe|entfernt|Vorbereitung der Aktion/i.test(JSON.stringify(theory.D4)))
assert.ok(!/Raster: <strong>geduldig<\/strong>|Raster: <strong>ruhig<\/strong>/i.test(JSON.stringify(theory.D4)))

// Sidequest
assert.equal(sidequest.title, 'Numerische Sondersituation')
const extra = sidequest.templates.find((t: { id: string }) => t.id === 'extra_attacker_offense')
assert.ok(extra)
const keys = extra.config.questions.map((q: { key: string }) => q.key)
assert.ok(keys.includes('structure_quality'))
assert.ok(keys.includes('decision_quality'))
assert.ok(keys.includes('risk_control'))
assert.ok(!/panisch|Teamruhe|chaotisch als Label/i.test(JSON.stringify(extra.config.questions)))

console.log('d4Polish.test.ts OK')
