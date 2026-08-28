export type CompetencyStatus = 'rated' | 'unrated'

export type CompetencyItem = {
  competencyId: string
  label: string
  score: number
  confidence: number
  breadth: number
  evidenceCount: number
  highestEvidenceLevel: number
  lastEvidenceAt: string | null
  status: CompetencyStatus
}

export type MyCompetenciesPayload = {
  engineVersion: string
  mapHash: string
  stale: boolean
  competencies: CompetencyItem[]
}

/** @deprecated Use API `CompetencyItem` — kept for dev/preview fixtures only */
export const COMPETENCY_PREVIEW_FIXTURE: readonly Pick<CompetencyItem, 'competencyId' | 'label' | 'score' | 'status'>[] = [
  { competencyId: 'scanning_identification', label: 'Scanning', score: 82, status: 'rated' },
  { competencyId: 'roles_support', label: 'Roles', score: 76, status: 'rated' },
  { competencyId: 'space_structure', label: 'Space', score: 88, status: 'rated' },
  { competencyId: 'options_decisions', label: 'Decisions', score: 64, status: 'rated' },
  { competencyId: 'transition_tempo', label: 'Transition', score: 71, status: 'rated' },
  { competencyId: 'pressure_control', label: 'Control', score: 79, status: 'rated' },
  { competencyId: 'systems_patterns', label: 'Systems', score: 68, status: 'rated' },
  { competencyId: 'evidence_analysis', label: 'Analysis', score: 52, status: 'rated' },
]

export type CompetencyId = CompetencyItem['competencyId']
