/**
 * Radar geometry tests.
 * Run: npx --yes tsx src/features/competency/radarGeometry.test.ts
 */
import { radarPolygon } from './radarGeometry'
import { buildFullyUnratedCompetencies, buildPartialCompetencies, buildRatedCompetencies } from './testFixtures'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const unrated = buildFullyUnratedCompetencies()
const rated = buildRatedCompetencies()
const partial = buildPartialCompetencies()

const unratedPolygon = radarPolygon(unrated)
assert(unratedPolygon.split(' ').length === 8, 'unrated polygon has 8 points')
assert(unratedPolygon.includes('160,160'), 'unrated polygon collapses to center')

const ratedPolygon = radarPolygon(rated)
assert(ratedPolygon.split(' ').length === 8, 'rated polygon has 8 points')
assert(!ratedPolygon.includes('160,160,'), 'rated polygon extends beyond center')

const partialPolygon = radarPolygon(partial)
assert(partialPolygon.split(' ').length === 8, 'partial polygon has 8 points')
assert(partialPolygon.includes('160,160'), 'partial unrated axes stay at center')

console.log('radarGeometry.test.ts OK')
