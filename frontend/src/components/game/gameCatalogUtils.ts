import type { CatalogGame } from '../../api'

export type CatalogSeasonStats = {
  total: number
  withResult: number
  scheduled: number
  missingResult: number
}

export function pennyDelSpieldetailsUrl(game?: CatalogGame | null): string | null {
  const externalId = game?.source?.external_id?.trim()
  if (!externalId) return null
  return `https://www.penny-del.org/statistik/spieldetails/${externalId}`
}

export function gameMatchesTeamNames(game: CatalogGame, home: string, away: string): boolean {
  if (!home || !away) return false
  const direct =
    game.home_team_name === home && game.away_team_name === away
  const reverse =
    game.home_team_name === away && game.away_team_name === home
  return direct || reverse
}

export function findGamesForTeams(games: CatalogGame[], home: string, away: string): CatalogGame[] {
  if (!home || !away) return []
  return games.filter((game) => gameMatchesTeamNames(game, home, away))
}

export function uniqueMatchdays(games: CatalogGame[]): number[] {
  const days = new Set<number>()
  for (const game of games) {
    if (game.matchday != null) days.add(game.matchday)
  }
  return Array.from(days).sort((a, b) => a - b)
}

export function pairingMeetings(
  games: CatalogGame[],
  home: string,
  away: string,
): CatalogGame[] {
  return games
    .filter((game) => gameMatchesTeamNames(game, home, away))
    .sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.matchday || 0) - (b.matchday || 0)
    })
}

export function seasonDateBounds(season: string): { start?: string; end?: string } {
  const raw = season.replace('/', '_').replace('-', '_')
  const match = raw.match(/^(\d{4})[_-](\d{2,4})$/)
  if (!match) return {}
  const startYear = Number(match[1])
  let endYear = Number(match[2])
  if (match[2].length === 2) {
    endYear = Number(`${String(startYear).slice(0, 2)}${match[2]}`)
  }
  return {
    start: `${startYear}-07-01`,
    end: `${endYear}-08-31`,
  }
}

export function gameDateInSeason(date: string | undefined, season: string): boolean {
  if (!date) return true
  const { start, end } = seasonDateBounds(season)
  if (!start || !end) return true
  return date >= start && date <= end
}

export function filterCatalogGamesForSeason(games: CatalogGame[], season: string): CatalogGame[] {
  if (!season) return games
  return games.filter((game) => gameDateInSeason(game.date, season))
}

/** Bei mehreren Import-Treffern: Archiv/Finale bevorzugen, früheres Datum. */
export function pickCatalogGameMatch(matches: CatalogGame[]): CatalogGame | undefined {
  if (!matches.length) return undefined
  if (matches.length === 1) return matches[0]

  const ranked = [...matches].sort((a, b) => {
    const aFinal = isCatalogArchiveGame(a) ? 0 : 1
    const bFinal = isCatalogArchiveGame(b) ? 0 : 1
    if (aFinal !== bFinal) return aFinal - bFinal
    return (a.date || '').localeCompare(b.date || '')
  })
  return ranked[0]
}

export function findCatalogGameForPairing(
  games: CatalogGame[],
  home: string,
  away: string,
  matchday: number,
  season?: string,
): CatalogGame | undefined {
  const pool = season ? filterCatalogGamesForSeason(games, season) : games
  const matches = pool.filter((game) => {
    if (game.matchday !== matchday) return false
    return gameMatchesTeamNames(game, home, away)
  })
  return pickCatalogGameMatch(matches)
}

export function formatGameScoreShort(game: CatalogGame): string {
  if (game.score) return `${game.score.home}:${game.score.away}`
  if (game.status === 'final') return 'n/V'
  return '–'
}

export function isGamePastWithoutScore(game?: CatalogGame | null): boolean {
  if (!game?.date || game.score || game.status === 'final') return false
  const kickoff = new Date(`${game.date}T23:59:59`)
  return !Number.isNaN(kickoff.getTime()) && kickoff.getTime() < Date.now()
}

export function pairingHeadToHeadSummary(
  meetings: CatalogGame[],
  perspectiveHome?: string,
): string | null {
  if (!meetings.length || !perspectiveHome) return null
  let wins = 0
  let losses = 0
  let played = 0
  for (const game of meetings) {
    if (!game.score) continue
    played += 1
    const isHome = game.home_team_name === perspectiveHome
    const teamScore = isHome ? game.score.home : game.score.away
    const oppScore = isHome ? game.score.away : game.score.home
    if (teamScore > oppScore) wins += 1
    else if (teamScore < oppScore) losses += 1
  }
  if (!played) return null
  return `${wins}-${losses} (aus ${played} absolviert${played === 1 ? 'em' : 'en'} Spiel${played === 1 ? '' : 'en'})`
}

export function getCatalogSeasonStats(games: CatalogGame[]): CatalogSeasonStats {
  let withResult = 0
  let scheduled = 0
  let missingResult = 0
  for (const game of games) {
    const hasScore = Boolean(game.score)
    const isFinal = game.status === 'final' || hasScore
    if (isFinal) {
      withResult += 1
    } else if (game.status === 'scheduled') {
      scheduled += 1
      if (isGamePastWithoutScore(game)) {
        missingResult += 1
      }
    }
  }
  return {
    total: games.length,
    withResult,
    scheduled,
    missingResult,
  }
}

export function isCatalogArchiveGame(game?: CatalogGame | null): boolean {
  if (!game) return false
  return game.status === 'final' || Boolean(game.score)
}

export function isGameToday(game?: CatalogGame | null): boolean {
  if (!game?.date) return false
  const today = new Date()
  const value = new Date(`${game.date}T12:00:00`)
  return (
    value.getFullYear() === today.getFullYear()
    && value.getMonth() === today.getMonth()
    && value.getDate() === today.getDate()
  )
}

export function catalogGameContextHint(game?: CatalogGame | null): string {
  if (!game) return 'Spiel aus Import verknüpfen — optional, dient nur als Kontext.'
  if (isCatalogArchiveGame(game)) {
    return 'Abgeschlossenes Spiel — offizielles Ergebnis aus dem importierten Spielplan (nicht deine Session-Daten).'
  }
  if (isGameToday(game)) {
    return 'Heute angesetzt — Import liefert Termin; deine Beobachtung läuft live in der Session.'
  }
  if (isGamePastWithoutScore(game)) {
    return 'Termin liegt in der Vergangenheit, Ergebnis fehlt im Import — Dev → Spielplan sync.'
  }
  return 'Geplantes Spiel — Termin aus dem Import; Ergebnis kommt erst nach dem Spiel oder live aus deiner Session.'
}

export type TeamSeasonSlice = {
  team: string
  /** Spiele mit Ergebnis bis Anker */
  gp: number
  /** Geplante + gespte Spiele bis Anker (Spielplan) */
  scheduledThrough: number
  wins: number
  losses: number
  gf: number
  ga: number
  /** Rough DEL points: 3 per win (OT/SO nicht getrennt). */
  points: number
  form: Array<'W' | 'L'>
  gamesWithBoxscore: number
  sogFor: number
  sogAgainst: number
  pim: number
  ppGoals: number
  ppOpportunities: number
}

export type MatchdaySeasonContext = {
  matchday: number | null
  includeThroughMatchday: boolean
  /** True wenn noch kein Team Ergebnis bis ST hat (z.B. neue Saison). */
  seasonNotStarted: boolean
  home: TeamSeasonSlice
  away: TeamSeasonSlice
  h2h: CatalogGame[]
  h2hPlayed: number
  h2hScheduled: number
  h2hSummaryHome: string | null
}

function gameIsThroughAnchor(game: CatalogGame, anchor: CatalogGame): boolean {
  const anchorDay = anchor.matchday
  const gameDay = game.matchday
  if (anchorDay != null && gameDay != null) {
    if (gameDay < anchorDay) return true
    if (gameDay > anchorDay) return false
    // same matchday: include by date / id so same-day slate is covered
  }
  const anchorDate = anchor.date || ''
  const gameDate = game.date || ''
  if (gameDate && anchorDate) {
    if (gameDate < anchorDate) return true
    if (gameDate > anchorDate) return false
  }
  if (anchor.id && game.id) return game.id <= anchor.id
  return true
}

function teamPlayedInGame(game: CatalogGame, team: string): boolean {
  return game.home_team_name === team || game.away_team_name === team
}

function emptyTeamSlice(team: string): TeamSeasonSlice {
  return {
    team,
    gp: 0,
    scheduledThrough: 0,
    wins: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    points: 0,
    form: [],
    gamesWithBoxscore: 0,
    sogFor: 0,
    sogAgainst: 0,
    pim: 0,
    ppGoals: 0,
    ppOpportunities: 0,
  }
}

function accumulateTeamSlice(slice: TeamSeasonSlice, game: CatalogGame, team: string): void {
  if (!game.score) return
  const isHome = game.home_team_name === team
  const gf = isHome ? game.score.home : game.score.away
  const ga = isHome ? game.score.away : game.score.home
  const won = gf > ga
  slice.gp += 1
  slice.gf += gf
  slice.ga += ga
  if (won) {
    slice.wins += 1
    slice.points += 3
    slice.form.push('W')
  } else {
    slice.losses += 1
    slice.form.push('L')
  }

  const teamStats = game.stats?.team
  if (!teamStats) return
  slice.gamesWithBoxscore += 1
  const side = isHome ? 'home' : 'away'
  const opp = isHome ? 'away' : 'home'
  const num = (key: string, which: 'home' | 'away') => {
    const raw = teamStats[key]?.[which]
    return typeof raw === 'number' ? raw : Number(raw)
  }
  const sog = num('shots_on_goal', side)
  const sogOpp = num('shots_on_goal', opp)
  const pim = num('penalty_minutes', side)
  const ppg = num('power_play_goals', side)
  const pp = num('power_plays', side)
  if (Number.isFinite(sog)) slice.sogFor += sog
  if (Number.isFinite(sogOpp)) slice.sogAgainst += sogOpp
  if (Number.isFinite(pim)) slice.pim += pim
  if (Number.isFinite(ppg)) slice.ppGoals += ppg
  if (Number.isFinite(pp)) slice.ppOpportunities += pp
}

/** Saison-Slice beider Teams bis inkl. Anker-Spieltag (Spielplan + Ergebnisse). */
export function buildMatchdaySeasonContext(
  catalogGames: CatalogGame[],
  anchor: CatalogGame,
): MatchdaySeasonContext | null {
  const home = anchor.home_team_name
  const away = anchor.away_team_name
  if (!home || !away) return null

  const throughSchedule = catalogGames
    .filter((game) => gameIsThroughAnchor(game, anchor))
    .sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '')
      if (dateCmp !== 0) return dateCmp
      return (a.matchday || 0) - (b.matchday || 0)
    })

  const homeSlice = emptyTeamSlice(home)
  const awaySlice = emptyTeamSlice(away)
  for (const game of throughSchedule) {
    if (teamPlayedInGame(game, home)) {
      homeSlice.scheduledThrough += 1
      accumulateTeamSlice(homeSlice, game, home)
    }
    if (teamPlayedInGame(game, away)) {
      awaySlice.scheduledThrough += 1
      accumulateTeamSlice(awaySlice, game, away)
    }
  }
  homeSlice.form = homeSlice.form.slice(-5)
  awaySlice.form = awaySlice.form.slice(-5)

  const h2h = throughSchedule.filter((game) => gameMatchesTeamNames(game, home, away))
  const h2hPlayed = h2h.filter((game) => Boolean(game.score)).length
  return {
    matchday: anchor.matchday ?? null,
    includeThroughMatchday: true,
    seasonNotStarted: homeSlice.gp === 0 && awaySlice.gp === 0,
    home: homeSlice,
    away: awaySlice,
    h2h,
    h2hPlayed,
    h2hScheduled: h2h.length - h2hPlayed,
    h2hSummaryHome: pairingHeadToHeadSummary(h2h, home),
  }
}

export function formatSeasonForm(form: Array<'W' | 'L'>): string {
  if (!form.length) return '–'
  return form.join('')
}

export function formatGoalDiff(gf: number, ga: number): string {
  const diff = gf - ga
  if (diff > 0) return `+${diff}`
  return String(diff)
}

export function localTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function filterGamesForDate(games: CatalogGame[], date: string): CatalogGame[] {
  if (!date) return []
  return games
    .filter((game) => game.date === date)
    .sort((a, b) => {
      const timeA = a.time || ''
      const timeB = b.time || ''
      if (timeA !== timeB) return timeA.localeCompare(timeB)
      return (a.matchday || 0) - (b.matchday || 0)
    })
}

export function uniqueMatchdaysForDate(games: CatalogGame[], date: string): number[] {
  const days = new Set<number>()
  for (const game of filterGamesForDate(games, date)) {
    if (game.matchday != null) days.add(game.matchday)
  }
  return Array.from(days).sort((a, b) => a - b)
}

export function formatGameTimeLabel(time?: string): string {
  if (!time) return ''
  const trimmed = time.trim()
  if (!trimmed) return ''
  return trimmed.endsWith(' Uhr') ? trimmed : `${trimmed} Uhr`
}

export function formatGameStatusLabel(game: CatalogGame): string {
  const status = String(game.status || '').toLowerCase()
  if (status === 'final') {
    if (game.score) return `${game.score.home}:${game.score.away}`
    return 'Endstand'
  }
  if (status === 'live') return 'Live'
  if (status === 'scheduled') return 'Geplant'
  return game.status || 'Geplant'
}
