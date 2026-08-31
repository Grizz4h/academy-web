/**
 * Competency logic tests.
 * Run: npx --yes tsx src/features/competency/competencyLogic.test.ts
 */
import {
  accessibilitySummary,
  canShowScorePolygon,
  formatRatioPercent,
  hasAnyRated,
  isFullyUnrated,
  meanRatedScore,
  nodePlotValue,
  profileProgressLabel,
  profileStoryLine,
  ratedCount,
  radarPlotValue,
  strongestRatedCompetency,
} from './competencyLogic'
import { capabilityBandForScore } from './capabilityBands'
import {
  buildFullyUnratedCompetencies,
  buildPartialCompetencies,
  buildRatedCompetencies,
} from './testFixtures'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const unrated = buildFullyUnratedCompetencies()
const rated = buildRatedCompetencies()
const partial = buildPartialCompetencies()

assert(unrated.length === 8, 'expected 8 unrated axes')
assert(isFullyUnrated(unrated), 'full profile should be unrated')
assert(!hasAnyRated(unrated), 'unrated profile has no rated axes')
assert(ratedCount(unrated) === 0, 'rated count should be 0')
assert(!canShowScorePolygon(unrated), 'unrated: no polygon')

assert(!isFullyUnrated(rated), 'rated profile is not fully unrated')
assert(hasAnyRated(rated), 'rated profile has rated axes')
assert(ratedCount(rated) === 8, 'rated profile counts 8')
assert(canShowScorePolygon(rated), 'rated: polygon ok')

assert(ratedCount(partial) === 3, 'partial profile counts 3 rated')
assert(!isFullyUnrated(partial), 'partial is not fully unrated')
assert(hasAnyRated(partial), 'partial has rated axes')
assert(!canShowScorePolygon(partial), 'partial: no polygon')
assert(partial.every((item) => item.status === 'unrated' || item.score > 0), 'no fake zero-rated scores')

for (const item of unrated) {
  assert(nodePlotValue(item) === null, 'unrated axes have no chart node')
  assert(radarPlotValue(item) === 0, 'radarPlotValue falls back to 0 only for gated polygon helper')
}

assert(formatRatioPercent(0.31) === '31%', 'breadth/confidence percent formatting')
assert(formatRatioPercent(0.424) === '42%', 'confidence rounds to percent')
assert(formatRatioPercent(1.2) === '100%', 'ratio clamped to 100%')

const integration = capabilityBandForScore(72)
assert(integration?.label === 'Integration', 'score 72 maps to Integration band')
const connection = capabilityBandForScore(56)
assert(connection?.label === 'Connection', 'score 56 maps to Connection band')
const analytical = capabilityBandForScore(84)
assert(analytical?.label === 'Analytical Transfer', 'score 84 maps to Analytical Transfer')

assert(
  accessibilitySummary(rated[0]) === 'Scanning — Integration — 72',
  'accessibility summary includes band and score',
)
assert(
  accessibilitySummary(unrated[0]) === 'Scanning — noch nicht bewertet',
  'accessibility summary for unrated axis',
)

assert(strongestRatedCompetency(unrated) === null, 'unrated: no strongest axis')
assert(strongestRatedCompetency(rated)?.competencyId === 'space_structure', 'rated: Space is strongest')
assert(meanRatedScore(rated) !== null && Math.round(meanRatedScore(rated)!) === 68, 'rated: mean ~68')
assert(meanRatedScore(unrated) === null, 'unrated: no mean')
assert(profileProgressLabel(rated).complete === true, 'rated: progress complete')
assert(profileProgressLabel(partial).short === '3/8 bewertet', 'partial: progress short label')
assert(
  profileStoryLine(rated) === 'Schwerpunkt: Space · Analytical Transfer',
  'rated: story line uses strongest band',
)
assert(profileStoryLine(unrated) === null, 'unrated: no story line')

console.log('competencyLogic.test.ts OK')
