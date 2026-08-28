import type { CompetencyItem, MyCompetenciesPayload } from './types'

const AXIS_DEFS = [
  { competencyId: 'scanning_identification', label: 'Scanning' },
  { competencyId: 'roles_support', label: 'Roles' },
  { competencyId: 'space_structure', label: 'Space' },
  { competencyId: 'options_decisions', label: 'Decisions' },
  { competencyId: 'transition_tempo', label: 'Transition' },
  { competencyId: 'pressure_control', label: 'Control' },
  { competencyId: 'systems_patterns', label: 'Systems' },
  { competencyId: 'evidence_analysis', label: 'Analysis' },
] as const

function unratedItem(def: (typeof AXIS_DEFS)[number]): CompetencyItem {
  return {
    competencyId: def.competencyId,
    label: def.label,
    score: 0,
    confidence: 0,
    breadth: 0,
    evidenceCount: 0,
    highestEvidenceLevel: 0,
    lastEvidenceAt: null,
    status: 'unrated',
  }
}

function ratedItem(
  def: (typeof AXIS_DEFS)[number],
  score: number,
  confidence: number,
  breadth: number,
  evidenceCount: number,
  highestEvidenceLevel: number,
): CompetencyItem {
  return {
    competencyId: def.competencyId,
    label: def.label,
    score,
    confidence,
    breadth,
    evidenceCount,
    highestEvidenceLevel,
    lastEvidenceAt: '2026-01-15T12:00:00+00:00',
    status: 'rated',
  }
}

export function buildFullyUnratedCompetencies(): CompetencyItem[] {
  return AXIS_DEFS.map(unratedItem)
}

export function buildRatedCompetencies(): CompetencyItem[] {
  return [
    ratedItem(AXIS_DEFS[0], 72, 0.42, 0.31, 12, 3),
    ratedItem(AXIS_DEFS[1], 56, 0.38, 0.25, 8, 2),
    ratedItem(AXIS_DEFS[2], 84, 0.55, 0.4, 15, 3),
    ratedItem(AXIS_DEFS[3], 64, 0.33, 0.22, 6, 2),
    ratedItem(AXIS_DEFS[4], 71, 0.47, 0.28, 9, 2),
    ratedItem(AXIS_DEFS[5], 79, 0.51, 0.35, 11, 3),
    ratedItem(AXIS_DEFS[6], 68, 0.44, 0.29, 7, 2),
    ratedItem(AXIS_DEFS[7], 52, 0.36, 0.21, 5, 2),
  ]
}

export function buildPartialCompetencies(): CompetencyItem[] {
  return [
    ratedItem(AXIS_DEFS[0], 72, 0.42, 0.31, 12, 3),
    ratedItem(AXIS_DEFS[1], 56, 0.38, 0.25, 8, 2),
    ratedItem(AXIS_DEFS[2], 84, 0.55, 0.4, 15, 3),
    ...AXIS_DEFS.slice(3).map(unratedItem),
  ]
}

export function buildProfile(
  competencies: CompetencyItem[],
  overrides?: Partial<MyCompetenciesPayload>,
): MyCompetenciesPayload {
  return {
    engineVersion: 'competency-engine-v1',
    mapHash: 'test-map-hash',
    stale: false,
    competencies,
    ...overrides,
  }
}
