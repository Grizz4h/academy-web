export const SESSION_SIDEQUESTS_KEY = '__session_sidequests'

export type SpecialTeamsGameState = 'power_play' | 'penalty_kill'

export type NumericalSituationType =
  | '5v3'
  | '6v4'
  | '6v5'
  | '4v3'
  | 'delayed_penalty_extra_attacker'
  | 'empty_net_offense'
  | 'empty_net_defense'
  | 'other'

export type SidequestPerspective = 'advantaged' | 'disadvantaged'

export type SpecialTeamsSidequest = {
  id: string
  type: 'special_teams_sidequest'
  category: 'special_teams'
  gameState: SpecialTeamsGameState
  miniDrillId: string
  templateId?: string
  parentDrillId?: string
  phase: string
  gameTime?: string
  observedTeam?: string
  answers: Record<string, unknown>
  createdAt: string
  /** Groups multiple scene logs into one special-teams situation. */
  situationGroupId?: string
}

export type NumericalSituationSidequest = {
  id: string
  type: 'numerical_situation_sidequest'
  category: 'numerical_situation'
  situationType: NumericalSituationType
  perspective: SidequestPerspective
  miniDrillId: string
  templateId: string
  parentDrillId?: string
  phase: string
  gameTime?: string
  observedTeam?: string
  answers: Record<string, unknown>
  createdAt: string
  /** Groups multiple scene logs into one special-teams situation. */
  situationGroupId?: string
}

export type SessionSidequest = SpecialTeamsSidequest | NumericalSituationSidequest

export type NumericalSituationOption = {
  id: NumericalSituationType
  label: string
  hint?: string
  perspectives: SidequestPerspective[]
}

export type NumericalTemplate = {
  id: string
  title: string
  description?: string
  applicableSituations: NumericalSituationType[]
  perspectives: SidequestPerspective[]
  drill_type?: string
  didactics?: any
  config?: any
}

export function readSidequests(answers: any): SessionSidequest[] {
  const raw = answers?.[SESSION_SIDEQUESTS_KEY]
  return Array.isArray(raw) ? raw : []
}

export function appendSidequest(answers: any, entry: SessionSidequest): any {
  const safe = answers && typeof answers === 'object' ? answers : {}
  const existing = readSidequests(safe)
  return {
    ...safe,
    [SESSION_SIDEQUESTS_KEY]: [...existing, entry],
  }
}

export function createSidequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function resolveNumericalTemplate(
  templates: NumericalTemplate[],
  situationType: NumericalSituationType,
  perspective: SidequestPerspective,
): NumericalTemplate | null {
  const matches = templates.filter((template) => {
    const situations = Array.isArray(template.applicableSituations) ? template.applicableSituations : []
    const perspectives = Array.isArray(template.perspectives) ? template.perspectives : []
    return situations.includes(situationType) && perspectives.includes(perspective)
  })
  return matches[0] || null
}

/** Drop optional situation-scoped questions that do not apply. */
export function filterTemplateQuestions(template: NumericalTemplate, situationType: NumericalSituationType) {
  const questions = Array.isArray(template?.config?.questions) ? template.config.questions : []
  return questions.filter((question: any) => {
    const showFor = question?.show_for_situations
    if (!Array.isArray(showFor) || showFor.length === 0) return true
    return showFor.includes(situationType)
  })
}

export function formatSidequestLabel(entry: SessionSidequest): string {
  if (entry.type === 'numerical_situation_sidequest') {
    const situationLabels: Record<string, string> = {
      '5v3': '5v3',
      '6v4': '6v4',
      '6v5': '6v5',
      '4v3': '4v3',
      delayed_penalty_extra_attacker: 'Delayed Penalty',
      empty_net_offense: 'Empty Net Offense',
      empty_net_defense: 'Empty Net Defense',
      other: 'Andere',
    }
    return situationLabels[entry.situationType] || entry.situationType
  }
  return entry.gameState === 'power_play' ? 'Überzahl' : 'Unterzahl'
}

export function summarizeSidequestAnswers(entry: SessionSidequest, maxItems = 3): string[] {
  const answers = entry.answers || {}
  return Object.entries(answers)
    .filter(([key, value]) => key !== 'note' && value !== undefined && value !== null && String(value).trim() !== '')
    .slice(0, maxItems)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
}
