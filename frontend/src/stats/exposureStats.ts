import type { Session } from '../api'
import { normalizeSeasonValue } from './seasonNormalization'

export type SessionLikeGameInfo = {
  game_info?: {
    league?: string
    season?: string
    team_home?: string
    team_away?: string
  }
  league?: string
  season?: string
  team_home?: string
  team_away?: string
}

export type MatchupExposure = {
  key: string
  league?: string
  season?: string
  matchday?: string | number
  homeTeam: string
  awayTeam: string
  sessionCount: number
  completedCount: number
  lastSeen?: string
  modules: Record<string, number>
  drills: Record<string, number>
  observedTeams: Record<string, number>
  sessions: Session[]
}

export type TeamExposure = {
  team: string
  sessionCount: number
  completedCount: number
  lastSeen?: string
  opponents: Record<string, number>
  modules: Record<string, number>
  drills: Record<string, number>
  matchups: MatchupExposure[]
  sessions: Session[]
}

export function normalizeTeamName(name?: string): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function makeMatchupKey(sessionOrGameInfo: SessionLikeGameInfo): string | null {
  const g = sessionOrGameInfo?.game_info ?? sessionOrGameInfo
  const normalizedSeason = normalizeSeasonValue(g?.season, g?.league)
  if (!g?.league || !normalizedSeason || !g?.team_home || !g?.team_away) {
    return null
  }
  const home = normalizeTeamName(g.team_home)
  const away = normalizeTeamName(g.team_away)
  return `${g.league}_${normalizedSeason}_${home}_vs_${away}`
}

export function resolveDrillId(session: Session): string | undefined {
  return session.drill_id ?? session.drills?.[0]?.id
}

export function makeGameDrillKey(session: Session): string | null {
  const matchupKey = makeMatchupKey(session)
  const drillId = resolveDrillId(session)
  if (!matchupKey || !drillId) return null
  return `${matchupKey}__${drillId}`
}

function bump(counter: Record<string, number>, key?: string): void {
  if (!key) return
  counter[key] = (counter[key] || 0) + 1
}

function asTime(value?: string): number {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : 0
}

function updateLastSeen(current: string | undefined, next: string | undefined): string | undefined {
  if (!next) return current
  if (!current) return next
  return asTime(next) > asTime(current) ? next : current
}

export function computeMatchupExposure(sessions: Session[]): MatchupExposure[] {
  const byKey = new Map<string, MatchupExposure>()

  for (const session of sessions || []) {
    const matchupKey = makeMatchupKey(session)
    const gameInfo = session.game_info
    if (!matchupKey || !gameInfo?.team_home || !gameInfo?.team_away) continue

    const existing = byKey.get(matchupKey)
    if (!existing) {
      const normalizedSeason = normalizeSeasonValue(gameInfo.season, gameInfo.league)
      byKey.set(matchupKey, {
        key: matchupKey,
        league: gameInfo.league,
        season: normalizedSeason || gameInfo.season,
        matchday: gameInfo.matchday,
        homeTeam: gameInfo.team_home,
        awayTeam: gameInfo.team_away,
        sessionCount: 0,
        completedCount: 0,
        lastSeen: undefined,
        modules: {},
        drills: {},
        observedTeams: {},
        sessions: []
      })
    }

    const row = byKey.get(matchupKey)!
    row.sessionCount += 1
    if (session.state === 'COMPLETED') row.completedCount += 1
    row.lastSeen = updateLastSeen(row.lastSeen, session.created_at)
    row.sessions.push(session)

    bump(row.modules, session.module_id)
    bump(row.drills, resolveDrillId(session))
    bump(row.observedTeams, session.game_info?.observed_team || session.observed_team)
  }

  return Array.from(byKey.values())
    .map((entry) => ({
      ...entry,
      sessions: [...entry.sessions].sort((a, b) => asTime(b.created_at) - asTime(a.created_at))
    }))
    .sort((a, b) => asTime(b.lastSeen) - asTime(a.lastSeen))
}

export function computeTeamExposure(sessions: Session[]): TeamExposure[] {
  const matchups = computeMatchupExposure(sessions)
  const byTeam = new Map<string, TeamExposure>()

  const ensureTeam = (team: string): TeamExposure => {
    const existing = byTeam.get(team)
    if (existing) return existing
    const created: TeamExposure = {
      team,
      sessionCount: 0,
      completedCount: 0,
      lastSeen: undefined,
      opponents: {},
      modules: {},
      drills: {},
      matchups: [],
      sessions: []
    }
    byTeam.set(team, created)
    return created
  }

  for (const session of sessions || []) {
    const gameInfo = session.game_info
    const observedTeam = gameInfo?.observed_team || session.observed_team
    const teamsInGame = [gameInfo?.team_home, gameInfo?.team_away].filter((name): name is string => Boolean(name))

    const targets = new Set<string>()
    if (observedTeam) {
      targets.add(observedTeam)
    } else {
      teamsInGame.forEach((team) => targets.add(team))
    }
    if (!targets.size && observedTeam) targets.add(observedTeam)

    for (const team of targets) {
      const row = ensureTeam(team)
      row.sessionCount += 1
      if (session.state === 'COMPLETED') row.completedCount += 1
      row.lastSeen = updateLastSeen(row.lastSeen, session.created_at)
      row.sessions.push(session)

      bump(row.modules, session.module_id)
      bump(row.drills, resolveDrillId(session))

      for (const opponent of teamsInGame) {
        if (opponent !== team) bump(row.opponents, opponent)
      }
    }
  }

  for (const matchup of matchups) {
    const teamsInMatchup = [matchup.homeTeam, matchup.awayTeam]
    const observedName = Object.keys(matchup.observedTeams || {}).sort(
      (a, b) => (matchup.observedTeams[b] || 0) - (matchup.observedTeams[a] || 0)
    )[0]
    const targetTeams = observedName ? [observedName] : teamsInMatchup
    for (const team of targetTeams) {
      const row = ensureTeam(team)
      row.matchups.push(matchup)
    }
  }

  return Array.from(byTeam.values())
    .map((entry) => ({
      ...entry,
      sessions: [...entry.sessions].sort((a, b) => asTime(b.created_at) - asTime(a.created_at)),
      matchups: [...entry.matchups].sort((a, b) => asTime(b.lastSeen) - asTime(a.lastSeen))
    }))
    .sort((a, b) => a.team.localeCompare(b.team))
}