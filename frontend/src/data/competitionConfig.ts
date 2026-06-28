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

export interface CompetitionConfig {
  league: string
  label: string
  phases: CompetitionPhaseConfig[]
}

export const COMPETITION_CONFIGS: Record<string, CompetitionConfig> = {
  DEL: {
    league: 'DEL',
    label: 'PENNY DEL',
    phases: [
      { id: 'regular_season', label: 'Hauptrunde', unit: { type: 'matchday', label: 'Spieltag', min: 1, max: 52 } },
      { id: 'playoff_round_1', label: 'Erste Playoff-Runde', unit: { type: 'series_game', label: 'Spiel', min: 1, max: 7 } },
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
}

export function getCompetitionConfig(league?: string): CompetitionConfig | undefined {
  return league ? COMPETITION_CONFIGS[league] : undefined
}

export function getCompetitionPhase(league?: string, phaseId?: string): CompetitionPhaseConfig | undefined {
  const config = getCompetitionConfig(league)
  if (!config) return undefined
  return config.phases.find((phase) => phase.id === phaseId) || config.phases[0]
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
  const phaseLabel = input.competition_phase_label || phase?.label
  const unitLabel = input.competition_unit_label || phase?.unit.label
  const unitValue = input.competition_unit_value || input.matchday
  const parts = [input.league, input.season, phaseLabel].filter(Boolean)
  const context = parts.join(' · ')
  const unit = unitLabel && unitValue ? `${unitLabel} ${unitValue}` : ''
  return [context, unit].filter(Boolean).join(' · ')
}
