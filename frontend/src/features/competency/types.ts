export const COMPETENCY_AXES = [
  { id: 'scanning_identification', label: 'Scanning' },
  { id: 'roles_support', label: 'Roles' },
  { id: 'space_structure', label: 'Space' },
  { id: 'options_decisions', label: 'Decisions' },
  { id: 'transition_tempo', label: 'Transition' },
  { id: 'pressure_control', label: 'Control' },
  { id: 'systems_patterns', label: 'Systems' },
  { id: 'evidence_analysis', label: 'Analysis' },
] as const

export type CompetencyId = (typeof COMPETENCY_AXES)[number]['id']

export type CompetencyRadarValue = {
  competencyId: CompetencyId
  score: number
  confidence?: number
}
