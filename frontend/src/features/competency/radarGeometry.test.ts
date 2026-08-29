/**
 * Radar geometry tests.
 * Run: npx --yes tsx src/features/competency/radarGeometry.test.ts
 */
import { nodePoint, radarPolygon } from './radarGeometry'
import { buildFullyUnratedCompetencies, buildPartialCompetencies, buildRatedCompetencies } from './testFixtures'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const unrated = buildFullyUnratedCompetencies()
const rated = buildRatedCompetencies()
const partial = buildPartialCompetencies()

const ratedPolygon = radarPolygon(rated)
assert(ratedPolygon.split(' ').length === 8, 'rated polygon has 8 points')
assert(!ratedPolygon.includes('160,160,'), 'rated polygon extends beyond center')

assert(nodePoint(unrated, 0) === null, 'unrated axis has no node')
assert(nodePoint(partial, 3) === null, 'partial unrated axis has no node')
assert(nodePoint(partial, 0) != null, 'partial rated axis has a node')
assert(nodePoint(rated, 0) != null, 'rated axis has a node')

console.log('radarGeometry.test.ts OK')
