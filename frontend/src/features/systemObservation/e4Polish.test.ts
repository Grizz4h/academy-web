import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CUE_PRIORITY_LABELS } from '../cuePriority/cueLogic.ts'
import { UPDATE_DECISION_LABELS, UPDATE_QUALITY_LABELS } from '../predictionUpdate/updateLogic.ts'
import {
  outcomeMatchLabel,
  readQualityLabel,
  resolveAnticipationReadConfig,
} from '../anticipationRead/readLogic.ts'
import {
  computeAnticipationProfile,
  resolveAnticipationProfileConfig,
} from '../anticipationProfile/profileLogic.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const curriculum = JSON.parse(readFileSync(join(root, 'data/academy/curriculum.json'), 'utf8'))
const theory = JSON.parse(readFileSync(join(root, 'frontend/src/data/theoryData.json'), 'utf8'))
const glossary = readFileSync(join(root, 'docs/content/hockey-glossary.md'), 'utf8')
const hr = readFileSync(join(root, 'docs/qa/human-review/e4-human-review.md'), 'utf8')
const sources = readFileSync(join(root, 'docs/qa/sources/e4-sources.md'), 'utf8')

const trackE = curriculum.tracks.find((t: { id: string }) => t.id === 'E')
const e4 = trackE.modules.find((m: { id: string }) => m.id === 'E4')
assert.ok(e4)
assert.equal(e4.learningGoals.length, 5)
assert.ok(!e4.learningGoals.some((g: string) => /Kippmoment|Wahrscheinlichkeiten aus Spielstruktur|gute Spieler/i.test(g)))
assert.ok(e4.learningGoals.some((g: string) => /ohne Kompetenzbewertung/i.test(g)))
assert.ok(/keine Vorhersagegenauigkeit|keine Antizipationskompetenz/i.test(e4.description))

const d1 = e4.drills.find((d: { id: string }) => d.id === 'E4_D1')
const d2 = e4.drills.find((d: { id: string }) => d.id === 'E4_D2')
const d3 = e4.drills.find((d: { id: string }) => d.id === 'E4_D3')
const d4 = e4.drills.find((d: { id: string }) => d.id === 'E4_D4')
const d5 = e4.drills.find((d: { id: string }) => d.id === 'E4_D5')

assert.deepEqual(d1.config.expectedActionOptions, [
  'Pass', 'Puck führen', 'Puck tief spielen', 'Verzögern', 'Abschluss',
])
assert.ok(!/Gute Spieler/i.test(d1.config.intro_text))
assert.ok(/sichtbare Hinweise/i.test(d1.config.intro_text))
assert.ok(/Nicht:.*guter Read/i.test(d1.didactics.learning_hint))
assert.ok(!/\bguter Read\b/i.test(d1.didactics.explanation))
assert.ok(!/\bgute Antizipation\b/i.test(d1.didactics.explanation))

assert.ok(/Haupthinweis|Hinweisrollen|unterstützend/i.test(d2.description + d2.didactics.explanation + d2.config.core_hint))
assert.equal(CUE_PRIORITY_LABELS.primary, 'Haupthinweis')
assert.ok(/nicht für die Erwartung genutzt/i.test(CUE_PRIORITY_LABELS.secondary))

assert.ok(/Begrenzung auf eine Alternative dient der Übung/i.test(d3.description + d3.config.core_hint))
assert.ok(Array.isArray(d3.config.triggerSuggestions) && d3.config.triggerSuggestions.length >= 5)
assert.ok(d3.config.triggerSuggestions.some((t: string) => /Passweg|Gegnerdruck|Körperausrichtung/i.test(t)))

assert.ok(!/guter Read bleibt nicht stur/i.test(d4.didactics.explanation + d4.config.decision_rule))
assert.ok(/beibehalten oder verändert/i.test(d4.didactics.explanation + d4.config.decision_rule))
assert.equal(UPDATE_DECISION_LABELS.no_new_info.includes('Keine relevante'), true)
assert.ok(/Bei Auftreten der neuen Information/i.test(UPDATE_QUALITY_LABELS.appropriate))

assert.equal(d5.title, 'Meine bisherigen Antizipations-Beobachtungen')
assert.ok(!/aussagekräftiger/i.test(d5.config.insufficient_hint || ''))
assert.ok(/vier Beobachtungsschritte|vier Quell/i.test(d5.config.insufficient_hint || d5.didactics.explanation))
assert.equal(d5.config.minReadsForProfile, 20)

const cfg = resolveAnticipationProfileConfig(d5.config)
const incomplete = computeAnticipationProfile([], cfg, ['E4_D1'])
assert.equal(incomplete.hasEnoughData, false)
const complete = computeAnticipationProfile([], cfg, ['E4_D1', 'E4_D2', 'E4_D3', 'E4_D4'])
assert.equal(complete.hasEnoughData, true)
assert.equal(complete.enoughBecause, 'source_coverage')

assert.equal(outcomeMatchLabel('matched'), 'Stimmt überein')
assert.equal(readQualityLabel('well_supported'), 'Durch sichtbare Hinweise begründet')

const d1Resolved = resolveAnticipationReadConfig(d1.config)
assert.ok(!/Gute Spieler/i.test(d1Resolved.introText))
assert.ok(!/guter Read/i.test(d1Resolved.decisionRule + d1Resolved.coreHint))

assert.match(theory.E4.overview + theory.E4.subtitle, /bisherige Beobachtungen|Erwartung|kein.*Hockey-IQ|keine Trefferquote/i)
assert.ok(!/entscheidend \/ unterstützend \/ nebensächlich/i.test(JSON.stringify(theory.E4)))

assert.match(glossary, /Bisherige Antizipations-Beobachtungen/)
assert.match(glossary, /Haupthinweis/)
assert.match(glossary, /Sicherheit der ursprünglichen Erwartung/)

for (const claim of ['E4-C1', 'E4-C2', 'E4-C3', 'E4-C4', 'E4-C5', 'E4-MIN-001', 'E4-MIN-002', 'E4-MIN-003']) {
  assert.match(hr, new RegExp(claim))
}
assert.ok(!/\|\s*\*\*human_status\*\*\s*\|\s*`CONFIRMED`/.test(hr))
assert.ok(!/\|\s*\*\*human_status\*\*\s*\|\s*`REJECTED`/.test(hr))
assert.ok(!/\|\s*\*\*human_status\*\*\s*\|\s*`CONFIRMED_AS_RINQ_MODEL`/.test(hr))
assert.match(hr, /NEEDS_CHANGE/)
assert.match(sources, /RINQ-DECISION-E4-NO-SKILL-PROFILE/)
assert.match(sources, /minReadsForProfile/)
assert.match(sources, /source_coverage/)

console.log('e4Polish tests OK')
