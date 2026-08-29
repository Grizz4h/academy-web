/**
 * Competency radar render tests.
 * Run: npx --yes vite-node src/features/competency/CompetencyRadar.test.tsx
 */
import { renderToStaticMarkup } from 'react-dom/server'
import CompetencyRadar from './CompetencyRadar'
import { canShowScorePolygon } from './competencyLogic'
import { radarPolygon } from './radarGeometry'
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

assert(!canShowScorePolygon(unrated), 'unrated: no score polygon')
assert(!canShowScorePolygon(partial), 'partial: no score polygon until all axes rated')
assert(canShowScorePolygon(rated), 'rated: score polygon allowed')

const unratedHtml = renderToStaticMarkup(<CompetencyRadar competencies={unrated} />)
assert((unratedHtml.match(/data-competency-axis=/g) || []).length === 8, 'unrated: expected 8 axes')
assert(
  unratedHtml.includes('Noch liegen nicht genug Beobachtungen'),
  'unrated: empty-state copy visible',
)
assert(!unratedHtml.includes('scoreGlow'), 'unrated: no score polygon glow')
assert(unratedHtml.includes('Scanning — noch nicht bewertet'), 'unrated: accessibility list present')

const ratedHtml = renderToStaticMarkup(<CompetencyRadar competencies={rated} />)
assert((ratedHtml.match(/data-competency-axis=/g) || []).length === 8, 'rated: expected 8 axes')
assert(ratedHtml.includes('8/8 Kompetenzen bewertet'), 'rated: progress note')
assert(ratedHtml.includes('Integration'), 'rated: capability band visible')
assert(ratedHtml.includes('Scanning — Integration — 72'), 'rated: accessibility summary')
assert(ratedHtml.includes('scoreGlow'), 'rated: polygon rendered')
assert(ratedHtml.includes('Confidence'), 'rated: confidence in list')
assert(
  ratedHtml.includes('Achse antippen für Score, Confidence und Evidenzbreite'),
  'rated: detail nudge mentions Evidenzbreite',
)

const partialHtml = renderToStaticMarkup(<CompetencyRadar competencies={partial} />)
assert(partialHtml.includes('3/8 Achsen bewertet'), 'partial: rated count note')
assert(partialHtml.includes('Noch nicht bewertet'), 'partial: unrated label in stats')
assert(partialHtml.includes('data-status="unrated"'), 'partial: unrated axis marked')
assert(!partialHtml.includes('scoreGlow'), 'partial: no filled polygon (Option A)')

const previewHtml = renderToStaticMarkup(
  <CompetencyRadar competencies={rated} preview />,
)
assert(previewHtml.includes('Dev · Mock preview'), 'dev preview kicker only with preview flag')

const polygon = radarPolygon(rated)
assert(polygon.split(' ').length === 8, 'radar polygon has 8 points for rated profile')

console.log('CompetencyRadar.test.tsx OK')
