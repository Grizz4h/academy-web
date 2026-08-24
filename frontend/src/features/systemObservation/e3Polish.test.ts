import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyTemplateById, computeOpportunityRate, formatRateSummary } from '../opportunityRate/rateLogic.ts'
import { evidenceStrengthOptions } from '../evidenceAssessment/evidenceLogic.ts'
import { SELECTABLE_CLAIM_LEVELS, claimLevelLabel } from '../claimLadder/claimLogic.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const curriculum = JSON.parse(readFileSync(join(root, 'data/academy/curriculum.json'), 'utf8'))
const theory = JSON.parse(readFileSync(join(root, 'frontend/src/data/theoryData.json'), 'utf8'))
const glossary = readFileSync(join(root, 'docs/content/hockey-glossary.md'), 'utf8')
const hr = readFileSync(join(root, 'docs/qa/human-review/e3-human-review.md'), 'utf8')
const sources = readFileSync(join(root, 'docs/qa/sources/e3-sources.md'), 'utf8')

const trackE = curriculum.tracks.find((t: { id: string }) => t.id === 'E')
const e3 = trackE.modules.find((m: { id: string }) => m.id === 'E3')
assert.ok(e3)
assert.match(e3.title, /Mikro-Analyse/)
assert.ok(!/Micro-Analytics/i.test(e3.title))
assert.equal(e3.learningGoals.length, 6)
assert.ok(e3.learningGoals.every((g: string) => !/entmenschlichen/i.test(g)))
assert.ok(/menschlichen Urteil|Spielbeobachtung/i.test(e3.description))
assert.ok(!/Gute Analyse/i.test(JSON.stringify(e3.drills)))
assert.ok(!/\bOpportunity\b/.test(JSON.stringify(e3.drills.map((d: { title: string; description: string; didactics: unknown }) => ({
  title: d.title,
  description: d.description,
  didactics: d.didactics,
})))))
assert.ok(!/\bTarget Outcome\b|\bClaim Ladder\b|\bClaim Ceiling\b|\bEvidence Strength\b/i.test(JSON.stringify(e3)))

const d1 = e3.drills.find((d: { id: string }) => d.id === 'E3_D1')
const d2 = e3.drills.find((d: { id: string }) => d.id === 'E3_D2')
const d3 = e3.drills.find((d: { id: string }) => d.id === 'E3_D3')
const d4 = e3.drills.find((d: { id: string }) => d.id === 'E3_D4')
const d5 = e3.drills.find((d: { id: string }) => d.id === 'E3_D5')

assert.ok(/Übung|nicht repräsentativ|Evidenzschwelle/i.test(d1.didactics.explanation))
assert.ok(/unklare Ergebnisse|nicht als Misserfolg|auswertbar/i.test(d1.didactics.explanation))
assert.ok(/Zoneneintritt|gültige Ausgangssituation/i.test(JSON.stringify(d1)))

assert.ok(/primäre Vergleichsdimension|weitere sichtbare/i.test(d2.description + d2.didactics.explanation))
assert.ok(/besser|schlechter|effektiver/i.test(d2.config.wording_help || d2.config.conclusion_hint))
assert.ok(/Vermeide|Nicht:/i.test(d2.config.wording_help || ''))

assert.ok(/Zusammenauftreten ist keine Ursache|keine Ursache/i.test(d3.description + (d3.config.decision_rule || '')))
assert.ok(/Gegenf[aä]ll/i.test(d3.didactics.explanation + JSON.stringify(d3.didactics.observation_guide) + d3.description))

assert.equal(d4.title, 'Tragfähigkeit der Beobachtungsgrundlage')
assert.ok(/kein.*p-Wert|kein automatischer|Gesamtscore/i.test(d4.description + d4.config.decision_rule))

assert.equal(d5.title, 'Aussagestufen')
assert.ok(/nachvollziehbare Analyse|Tragfähigkeit|Beobachtungsgrundlage/i.test(d5.description + d5.didactics.explanation))
assert.ok(!/Eine gute Analyse/i.test(d5.didactics.explanation + d5.description))

// C1 rate logic
const def = applyTemplateById('entries')!
assert.ok(def.inclusionRules && def.exclusionRules)
const obs = [
  { id: '1', order: 1, outcomeId: 'controlled', validOpportunity: true },
  { id: '2', order: 2, outcomeId: 'controlled', validOpportunity: true },
  { id: '3', order: 3, outcomeId: 'controlled', validOpportunity: true },
  { id: '4', order: 4, outcomeId: 'controlled', validOpportunity: true },
  { id: '5', order: 5, outcomeId: 'dump', validOpportunity: true },
  { id: '6', order: 6, outcomeId: 'dump', validOpportunity: true },
  { id: '7', order: 7, outcomeId: 'turnover', validOpportunity: true },
  { id: '8', order: 8, outcomeId: 'unclear', validOpportunity: true },
  { id: '9', order: 9, outcomeId: 'unclear', validOpportunity: true },
]
const rate = computeOpportunityRate(def, obs)
assert.equal(rate.totalOpportunities, 9)
assert.equal(rate.evaluableCount, 7)
assert.equal(rate.targetCount, 4)
assert.equal(rate.unclearCount, 2)
assert.equal(rate.ratePercent, 57)
assert.notEqual(rate.rate, 4 / 9)
assert.match(rate.rateSummary, /4 Zielereignisse aus 7/)
assert.match(formatRateSummary(rate), /2 weitere gültige Situationen waren unklar/)

const strengths = evidenceStrengthOptions().map((s) => s.label)
assert.ok(strengths.some((l) => /Konsistentes Bild innerhalb dieser Stichprobe/i.test(l)))
assert.ok(strengths.some((l) => /Nicht beurteilbar/i.test(l)))
assert.ok(!strengths.some((l) => l === 'Stark gestützt'))

assert.deepEqual(SELECTABLE_CLAIM_LEVELS, ['none', 'description', 'comparison', 'tendency', 'generalization'])
assert.equal(claimLevelLabel('none'), 'Keine inhaltliche Aussage')
assert.ok(claimLevelLabel('causal').includes('nicht erreichbar'))

const e3Theory = theory.E3
assert.match(e3Theory.title, /Mikro-Analyse/)
assert.match(e3Theory.subtitle + e3Theory.overview, /Tragfähigkeit|Aussagestufe|Ausgangssituation/)
assert.ok(!/Micro-Analytics/i.test(e3Theory.title + e3Theory.subtitle + e3Theory.overview))
assert.ok(!/Unklare Outcomes transparent im Nenner behalten/i.test(JSON.stringify(e3Theory)))

assert.match(glossary, /Gültige Ausgangssituation/)
assert.match(glossary, /Tragfähigkeit der Beobachtungsgrundlage/)
assert.match(glossary, /Aussagestufe/)
assert.match(glossary, /Vergleichsgruppe/)

for (const claim of ['E3-C1', 'E3-C2', 'E3-C3', 'E3-C4', 'E3-C5', 'E3-MIN-001', 'E3-MIN-002']) {
  assert.match(hr, new RegExp(claim))
}
assert.ok(!/human_status.`\s*CONFIRMED/i.test(hr))
assert.match(hr, /NEEDS_CHANGE/)
assert.match(sources, /RINQ-DECISION-E3-UNCLEAR-OUTCOMES/)
assert.match(sources, /SRC-STROBE-OBSERVATIONAL-REPORTING/)
assert.match(sources, /rateDenominatorBasis|evaluableCount|auswertbar/i)

console.log('e3Polish tests OK')
