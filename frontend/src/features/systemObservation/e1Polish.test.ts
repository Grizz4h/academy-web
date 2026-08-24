import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_ASSESSMENT_OPTIONS,
  DEFAULT_ATTRIBUTION_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS,
  LEGACY_ATTRIBUTION_LABELS,
  labelForOption,
} from '../patternLog/labels'
import { resolveTendencyProfileConfig } from '../patternLog/summarizeTendencyProfile'
import { resolvePatternAttributionConfig } from '../patternLog/summarizeAttributionEvidence'
import { resolvePatternLogConfig } from '../patternLog/summarizePatternLog'
import { resolvePatternConditionConfig } from '../patternLog/summarizePatternConditions'
import { resolvePatternInvariantConfig } from '../patternLog/summarizeDimensionConsistency'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const curriculum = JSON.parse(readFileSync(join(root, 'data/academy/curriculum.json'), 'utf8'))
const theory = JSON.parse(readFileSync(join(root, 'frontend/src/data/theoryData.json'), 'utf8'))
const glossary = readFileSync(join(root, 'docs/content/hockey-glossary.md'), 'utf8')
const hr = readFileSync(join(root, 'docs/qa/human-review/e1-human-review.md'), 'utf8')
const sources = readFileSync(join(root, 'docs/qa/sources/e1-sources.md'), 'utf8')

const trackE = curriculum.tracks.find((t: { id: string }) => t.id === 'E')
const e1 = trackE.modules.find((m: { id: string }) => m.id === 'E1')
assert.ok(e1)
assert.equal(e1.title, 'E1 – Tendenzen erkennen')
assert.match(e1.summary, /vorläufige|mögliche Tendenz/i)
assert.ok(!/echte Tendenzen|Bewerte Spielverlauf|strukturelle Tendenzen|Adjustments/i.test(e1.learningGoals.join('\n')))
assert.ok(e1.learningGoals.some((g: string) => /vorläufigen Tendenzen/i.test(g)))
assert.ok(e1.learningGoals.some((g: string) => /Gegenfälle/i.test(g)))
assert.ok(e1.description.includes('beobachtete Segment'))
assert.ok(!/keine Erklärung von Ursachen/.test(e1.description) === false)

const d1 = e1.drills.find((d: { id: string }) => d.id === 'E1_D1')
const d2 = e1.drills.find((d: { id: string }) => d.id === 'E1_D2')
const d3 = e1.drills.find((d: { id: string }) => d.id === 'E1_D3')
const d4 = e1.drills.find((d: { id: string }) => d.id === 'E1_D4')
const d5 = e1.drills.find((d: { id: string }) => d.id === 'E1_D5')

// D1 — Vergleichsmerkmale, didactic minimum, no proof claim
assert.equal(d1.config.fingerprint_title, 'Vergleichsmerkmale')
assert.equal(d1.config.summary_title, 'Hinweis auf eine mögliche Tendenz')
assert.ok(/Mindestmenge dieser Übung/i.test(d1.didactics.explanation))
assert.ok(!/allgemeine Teamtendenz nachzuweisen/i.test(d1.didactics.explanation) === false)
assert.ok(!/Score State und Line Matchups/.test(JSON.stringify(d1.didactics.observation_guide.ignore)))
assert.ok(/Kontextmerkmale .* werden in D1 nur notiert/i.test(d1.didactics.learning_hint))
assert.ok(DEFAULT_ASSESSMENT_OPTIONS.some((o) => /Nicht ausreichend beobachtet/i.test(o.label)))
assert.ok(DEFAULT_ASSESSMENT_OPTIONS.some((o) => /Nur das Ergebnis ähnelt sich/i.test(o.label)))
assert.ok(!DEFAULT_ASSESSMENT_OPTIONS.some((o) => o.label === 'Starkes Muster'))

const logCfg = resolvePatternLogConfig(d1.config)
assert.equal(logCfg.fingerprintTitle, 'Vergleichsmerkmale')

// D2 — Gegenfall language
assert.ok(/ausreichend ähnliche Ausgangslage/i.test(d2.didactics.explanation))
assert.ok(/widerlegt .* nicht automatisch|nicht automatisch/i.test(d2.didactics.explanation))
assert.ok(/Welche Bedingung trat in deinen bisherigen Musterfällen/i.test(JSON.stringify(d2.miniFeedback)))
assert.ok(!/am stärksten mit dem Muster zusammenhängt/i.test(JSON.stringify(d2.miniFeedback)))
assert.equal(d2.config.fingerprint_title, 'Verglichene Bedingungen')
const condCfg = resolvePatternConditionConfig(d2.config)
assert.match(condCfg.fingerprintTitle, /Verglichene Bedingungen|Bedingungen/)

// D3 — stabile/variable, no absolute Invariante in titles
assert.equal(d3.title, 'Was bleibt ähnlich, was verändert sich?')
assert.equal(d3.config.fingerprint_title, 'Stabile und variable Merkmale')
assert.equal(d3.config.summary_title, 'Stabile und variable Merkmale')
assert.ok(/keine bewiesene Invariante/i.test(d3.didactics.explanation))
assert.ok(DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS.some((o) => /Bisher stabil beobachtet/i.test(o.label)))
assert.ok(DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS.some((o) => /Nicht ausreichend beurteilbar/i.test(o.label)))
assert.ok(!DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS.some((o) => /Kernbestandteil/i.test(o.label)))
const invCfg = resolvePatternInvariantConfig(d3.config)
assert.equal(invCfg.fingerprintTitle, 'Stabile und variable Merkmale')

// D4 — context stability, no causal attribution labels in active options
assert.equal(d4.title, 'In welchen Kontexten bleibt die Tendenz sichtbar?')
assert.ok(/nicht, warum/i.test(d4.didactics.explanation) || /beantwortet nicht/i.test(d4.didactics.explanation))
assert.ok(!/Je mehr unterschiedliche Kontexte das gleiche Verhalten überlebt, desto eher könnte es strukturell/i.test(d4.didactics.explanation))
assert.ok(/weniger eng an einen einzelnen Kontext/i.test(d4.didactics.explanation))
assert.match(d4.didactics.learning_hint, /D3 vergleicht die Merkmale|D4 prüft/)
assert.ok(!DEFAULT_ATTRIBUTION_OPTIONS.some((o) => /strukturell|gegnerbedingt|personell|spielstands/i.test(o.label)))
assert.ok(DEFAULT_ATTRIBUTION_OPTIONS.some((o) => /unterschiedlichen Kontexten beobachtet/i.test(o.label)))
assert.ok(DEFAULT_ATTRIBUTION_OPTIONS.some((o) => /Nicht ausreichend beobachtet/i.test(o.label)))
assert.ok(LEGACY_ATTRIBUTION_LABELS.opponent_driven.includes('Legacy'))
assert.equal(labelForOption(DEFAULT_ATTRIBUTION_OPTIONS, 'opponent_driven'), LEGACY_ATTRIBUTION_LABELS.opponent_driven)
assert.ok(DEFAULT_CONFIDENCE_OPTIONS.some((o) => o.value === 'not_assessable'))
assert.ok(!DEFAULT_CONFIDENCE_OPTIONS.some((o) => /%|Prozent|Wahrscheinlichkeit/i.test(o.label)))
const attrCfg = resolvePatternAttributionConfig(d4.config)
assert.match(attrCfg.summaryTitle, /Kontextstabilität/)
assert.ok(!/Strukturell heißt nicht/i.test(attrCfg.decisionRule))

// D5 — null tendencies valid
assert.equal(d5.title, 'Tendenzen im beobachteten Segment')
assert.equal(d5.config.minTendencies, 0)
assert.equal(d5.config.maxTendencies, 3)
assert.equal(d5.config.require_strongest_tendency, false)
assert.equal(d5.config.require_next_watch, false)
assert.equal(d5.config.allow_empty_tendencies, true)
assert.ok(/Keine ausreichend gestützte Tendenz|null belastbare/i.test(d5.description + d5.didactics.explanation))
assert.ok(!/Tendenzprofil/i.test(d5.config.summary_title))
const tendCfg = resolveTendencyProfileConfig(d5.config)
assert.equal(tendCfg.minTendencies, 0)
assert.equal(tendCfg.requireStrongestTendency, false)
assert.equal(tendCfg.requireNextWatch, false)
assert.equal(tendCfg.allowEmptyTendencies, true)
assert.match(tendCfg.summaryTitle, /Tendenzen im beobachteten Segment/)

// Theory
assert.match(theory.E1.overview, /keine wissenschaftliche Mustererkennung|keine objektive Teamdiagnose/)
assert.match(theory.E1.overview, /RinQ-Beobachtungsmodell/)
const attrSection = theory.E1.sections.find((s: { id: string }) => s.id === 'attribution')
assert.ok(/Kontextstabilität|sichtbaren Kontexten/i.test(JSON.stringify(attrSection)))
assert.ok(!/Tendenzprofil/i.test(JSON.stringify(attrSection)))
assert.ok(/keine Ursachen|fragt nicht nach Ursachen/i.test(JSON.stringify(attrSection)))
assert.ok(/Kontextstabilität/i.test(JSON.stringify(theory.E1)))
assert.ok(/null/i.test(JSON.stringify(theory.E1.sections.find((s: { id: string }) => s.id === 'profil'))))

// Glossary + sources + HR statuses
assert.match(glossary, /### Tendenz/)
assert.match(glossary, /### Vergleichsmerkmale/)
assert.match(glossary, /Pattern Fingerprint/)
assert.match(glossary, /### Gegenfall/)
assert.match(glossary, /Beobachtungsgrundlage/)
assert.ok(!/strukturell vs\. situativ · Tendenzprofil/.test(glossary))

assert.match(sources, /SRC-DEB-RRL-2020-S12/)
assert.match(sources, /SRC-IIHF-CEF-2025/)
assert.match(sources, /RINQ-DECISION-E1-REMOVE-CAUSAL-ATTRIBUTION/)
assert.match(sources, /Beleggrenze/)

for (const id of ['HR-E1-C1', 'HR-E1-C2', 'HR-E1-C3', 'HR-E1-C4', 'HR-E1-C5', 'HR-E1-MIN-001', 'HR-E1-MIN-002', 'HR-E1-MIN-003']) {
  assert.ok(hr.includes(id), `missing ${id}`)
}
// Status values in claim tables must stay NEEDS_CHANGE (never CONFIRMED*)
const statusBlocks = [...hr.matchAll(/\*\*human_status\*\*\s*\|\s*`([^`]+)`/g)].map((m) => m[1])
assert.ok(statusBlocks.length >= 5)
assert.ok(statusBlocks.every((s) => s === 'NEEDS_CHANGE'))
assert.ok(!statusBlocks.some((s) => /CONFIRMED|REJECTED/.test(s)))

// Surface: no causal labels as positive truth claims in D4 titles/decision_rule
const d4Surface = [d4.title, d4.description, JSON.stringify(d4.didactics), d4.config.summary_title, d4.config.decision_rule].join('\n')
assert.ok(!/eher strukturell|wirkt strukturell|ist strukturell/i.test(d4Surface))
assert.equal(d4.config.summary_title, 'Kontextstabilität im beobachteten Segment')
assert.ok(DEFAULT_ATTRIBUTION_OPTIONS.every((o) => !/strukturell|gegnerbedingt|personell|spielstands/i.test(o.label)))

console.log('e1Polish.test.ts OK')
