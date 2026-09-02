import type { CatalogGame } from '../../api'
import { fieldsFromCatalogGame } from './scheduleLayer'

export const GAME_SETUP_PREFILL_KEY = 'academy.setupGamePrefill'

export type GameSetupPrefill = {
  league: string
  season: string
  teamHome: string
  teamAway: string
  selectedGameId: string
  competitionPhase?: string
  competitionValue: string
  time?: string
  date?: string
  phaseLabel?: string
}

export function buildGameSetupPrefill(game: CatalogGame): GameSetupPrefill {
  const fields = fieldsFromCatalogGame(game)
  return {
    league: game.league_id,
    season: game.season_id,
    teamHome: fields.teamHome,
    teamAway: fields.teamAway,
    selectedGameId: fields.selectedGameId,
    competitionPhase: fields.competitionPhase,
    competitionValue: fields.competitionValue,
    time: game.time || undefined,
    date: game.date || undefined,
    phaseLabel: game.phase_label || undefined,
  }
}

export function stashGameSetupPrefill(game: CatalogGame): void {
  try {
    sessionStorage.setItem(GAME_SETUP_PREFILL_KEY, JSON.stringify(buildGameSetupPrefill(game)))
  } catch {
    // ignore storage errors
  }
}

export function peekGameSetupPrefill(): GameSetupPrefill | null {
  try {
    const raw = sessionStorage.getItem(GAME_SETUP_PREFILL_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameSetupPrefill
  } catch {
    return null
  }
}

export function clearGameSetupPrefill(): void {
  try {
    sessionStorage.removeItem(GAME_SETUP_PREFILL_KEY)
  } catch {
    // ignore storage errors
  }
}

export function consumeGameSetupPrefill(): GameSetupPrefill | null {
  const prefill = peekGameSetupPrefill()
  if (!prefill) return null
  clearGameSetupPrefill()
  return prefill
}

export function buildSessionSetupPathForGame(game: CatalogGame, moduleId: string): string {
  stashGameSetupPrefill(game)
  return `/setup/${encodeURIComponent(moduleId)}`
}
