export type CompetitionUnitType = 'matchday' | 'game_number' | 'series_game'

export interface CompetitionPhaseConfig {
  id: string
  label: string
  unit: {
    type: CompetitionUnitType
    label: string
    min: number
    max: number
  }
}

/** Optional first chip-row (like Locker Cosmetics). Filters which phases appear next. */
export interface CompetitionStageGroup {
  id: string
  label: string
  /** Short hint under the stage chips when this group is active */
  hint?: string
  phaseIds: string[]
}

export interface CompetitionConfig {
  league: string
  label: string
  phases: CompetitionPhaseConfig[]
  stageGroups?: CompetitionStageGroup[]
}

export const COMPETITION_CONFIGS: Record<string, CompetitionConfig> = {
  Testspiele: {
    league: 'Testspiele',
    label: 'Testspiele',
    phases: [
      { id: 'friendly', label: 'Testspiel', unit: { type: 'game_number', label: 'Spiel', min: 1, max: 20 } },
    ],
  },
  DEL: {
    league: 'DEL',
    label: 'PENNY DEL',
    phases: [
      { id: 'regular_season', label: 'Hauptrunde', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 52 } },
      { id: 'playoff_round_1', label: 'Erste Playoff-Runde', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 3 } },
      { id: 'quarterfinal', label: 'Viertelfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'semifinal', label: 'Halbfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'final', label: 'Finale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
    ],
  },
  DEL2: {
    league: 'DEL2',
    label: 'DEL2',
    phases: [
      { id: 'regular_season', label: 'Hauptrunde', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 52 } },
      { id: 'pre_playoffs', label: 'Pre-Playoffs', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'quarterfinal', label: 'Viertelfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'semifinal', label: 'Halbfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'final', label: 'Finale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'playdowns', label: 'Playdowns', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
    ],
  },
  CHL: {
    league: 'CHL',
    label: 'Champions Hockey League',
    phases: [
      { id: 'regular_season', label: 'Regular Season', unit: { type: 'matchday', label: 'Game Day', min: 1, max: 6 } },
      { id: 'round_of_16', label: 'Round of 16', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 2 } },
      { id: 'quarterfinal', label: 'Viertelfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 2 } },
      { id: 'semifinal', label: 'Halbfinale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 2 } },
      { id: 'final', label: 'Finale', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 1 } },
    ],
  },
  NHL: {
    league: 'NHL',
    label: 'NHL',
    phases: [
      { id: 'regular_season', label: 'Regular Season', unit: { type: 'game_number', label: 'Game Number', min: 1, max: 82 } },
      { id: 'round_1', label: 'Round 1', unit: { type: 'series_game', label: 'Game', min: 1, max: 7 } },
      { id: 'round_2', label: 'Round 2', unit: { type: 'series_game', label: 'Game', min: 1, max: 7 } },
      { id: 'conference_final', label: 'Conference Final', unit: { type: 'series_game', label: 'Game', min: 1, max: 7 } },
      { id: 'stanley_cup_final', label: 'Stanley Cup Final', unit: { type: 'series_game', label: 'Game', min: 1, max: 7 } },
    ],
  },
  U20_DNL: {
    league: 'U20_DNL',
    label: 'U20 DNL',
    // Real flow: Findung A sorts Div 1 → Top / Quali 1; Div 2 + Div 3 run in parallel; then playoffs/playdowns.
    stageGroups: [
      {
        id: 'finding_a',
        label: 'Findung A',
        hint: 'Saisonstart Division 1: zwei Gruppen. Plätze 1–4 → Top Division, Plätze 5–8 → Quali 1.',
        phaseIds: ['finding_a_g1', 'finding_a_g2'],
      },
      {
        id: 'division_1',
        label: 'Division 1',
        hint: 'Nach der Findung: Top Division (Meisterschaftspfad) und Qualifikationsrunde 1 parallel.',
        phaseIds: ['top_division', 'qualification_1'],
      },
      {
        id: 'division_2',
        label: 'Division 2',
        hint: 'Eigene Staffel unterhalb Division 1 (25/26 als Findung B geführt).',
        phaseIds: ['division_2'],
      },
      {
        id: 'division_3',
        label: 'Division 3',
        hint: 'Unterste Ebene, regional Nord / Süd.',
        phaseIds: ['division_3_nord', 'division_3_sued'],
      },
      {
        id: 'postseason',
        label: 'Playoffs',
        hint: 'Pre-Playoffs & Playoffs um den Meister; Playdowns um Auf-/Abstieg zwischen den Divisionen.',
        phaseIds: ['pre_playoffs', 'playoffs', 'playdowns'],
      },
    ],
    phases: [
      { id: 'finding_a_g1', label: 'Gruppe 1', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 16 } },
      { id: 'finding_a_g2', label: 'Gruppe 2', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 16 } },
      { id: 'top_division', label: 'Top Division', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 32 } },
      { id: 'qualification_1', label: 'Quali 1', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 32 } },
      { id: 'division_2', label: 'Hauptrunde', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 40 } },
      { id: 'division_3_nord', label: 'Nord', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 40 } },
      { id: 'division_3_sued', label: 'Süd', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 40 } },
      { id: 'pre_playoffs', label: 'Pre-Playoffs', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'playoffs', label: 'Playoffs', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
      { id: 'playdowns', label: 'Playdowns', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
    ],
  },
}

export function getCompetitionConfig(league?: string): CompetitionConfig | undefined {
  return league ? COMPETITION_CONFIGS[league] : undefined
}

export function getCompetitionPhase(league?: string, phaseId?: string): CompetitionPhaseConfig | undefined {
  const config = getCompetitionConfig(league)
  if (!config) return undefined
  return config.phases.find((phase) => phase.id === phaseId) || config.phases[0]
}

export function getCompetitionStageGroup(
  league?: string,
  phaseId?: string,
): CompetitionStageGroup | undefined {
  const config = getCompetitionConfig(league)
  const groups = config?.stageGroups
  if (!groups?.length) return undefined
  if (phaseId) {
    const match = groups.find((group) => group.phaseIds.includes(phaseId))
    if (match) return match
  }
  return groups[0]
}

export function phasesForStageGroup(
  config: CompetitionConfig | undefined,
  stageId?: string,
): CompetitionPhaseConfig[] {
  if (!config) return []
  const groups = config.stageGroups
  if (!groups?.length) return config.phases
  const group = groups.find((item) => item.id === stageId) || groups[0]
  const allowed = new Set(group.phaseIds)
  return config.phases.filter((phase) => allowed.has(phase.id))
}

export function formatCompetitionContext(input: {
  league?: string
  season?: string
  competition_phase?: string
  competition_phase_label?: string
  competition_unit_label?: string
  competition_unit_value?: string | number
  matchday?: string
}): string {
  const phase = getCompetitionPhase(input.league, input.competition_phase)
  const stage = getCompetitionStageGroup(input.league, input.competition_phase)
  const phaseLabel = input.competition_phase_label || phase?.label
  const unitLabel = input.competition_unit_label || phase?.unit.label
  const unitValue = input.competition_unit_value || input.matchday
  const parts = [
    input.league,
    input.season,
    stage && stage.label !== phaseLabel ? stage.label : null,
    phaseLabel,
  ].filter(Boolean)
  const context = parts.join(' · ')
  const unit = unitLabel && unitValue ? `${unitLabel} ${unitValue}` : ''
  return [context, unit].filter(Boolean).join(' · ')
}
