import type { CatalogGame } from '../../api'
import { getCatalogTeamsForLeague } from '../../data/teamCatalog'
import type { ScheduleLeague } from '../../features/schedule/scheduleLeagues'
import { SCHEDULE_LEAGUES } from '../../features/schedule/scheduleLeagues'
import { inferSplitSeasonLabelForDate } from '../../stats/seasonNormalization'

export const DEV_FIXTURE_PROVIDER = 'dev_fixture'

function seasonFileKey(season: string): string {
  return String(season || '').replace(/[/-]/g, '_')
}

type FixtureTeam = { id: string; name: string }

const DEL_FIXTURE_TEAMS: FixtureTeam[] = [
  { id: 'erc_ingolstadt', name: 'ERC Ingolstadt' },
  { id: 'nurnberg_ice_tigers', name: 'Nürnberg Ice Tigers' },
  { id: 'straubing_tigers', name: 'Straubing Tigers' },
  { id: 'augsburger_panther', name: 'Augsburger Panther' },
]

function seasonStartYear(season: string): number {
  const match = String(season || '').match(/^(\d{4})/)
  return match ? Number(match[1]) : 2026
}

function teamsForFixtures(league: string, season: string): FixtureTeam[] {
  if (league === 'DEL') return DEL_FIXTURE_TEAMS
  const catalog = getCatalogTeamsForLeague(league, season)
  if (catalog.length >= 4) {
    return catalog.slice(0, 4).map((team) => ({ id: team.id, name: team.name }))
  }
  return DEL_FIXTURE_TEAMS
}

function dummyId(league: string, season: string, slug: string): string {
  const leagueKey = (league || 'del').trim().toLowerCase()
  return `dev:${seasonFileKey(season)}:${leagueKey}_${slug}`
}

function dummyGame(params: {
  league: string
  season: string
  slug: string
  matchday: number
  date: string
  time?: string
  home: FixtureTeam
  away: FixtureTeam
  status: CatalogGame['status']
  score?: CatalogGame['score']
  stats?: CatalogGame['stats']
  phaseId?: string
  phaseLabel?: string
}): CatalogGame {
  return {
    id: dummyId(params.league, params.season, params.slug),
    league_id: params.league,
    season_id: params.season,
    phase_id: params.phaseId || 'hauptrunde',
    phase_label: params.phaseLabel || 'Hauptrunde',
    matchday: params.matchday,
    date: params.date,
    time: params.time || '19:30',
    home_team_id: params.home.id,
    away_team_id: params.away.id,
    home_team_name: params.home.name,
    away_team_name: params.away.name,
    status: params.status,
    score: params.score || null,
    stats: params.stats || null,
    isDummy: true,
    source: {
      provider: DEV_FIXTURE_PROVIDER,
      imported_at: '2026-08-13T00:00:00.000Z',
    },
  }
}

function dummyBoxscore(homeName: string, awayName: string): NonNullable<CatalogGame['stats']> {
  return {
    provider: DEV_FIXTURE_PROVIDER,
    imported_at: '2026-08-13T00:00:00.000Z',
    team: {
      shots_on_goal: { label: 'Schüsse auf Tor', home: 32, away: 24 },
      penalty_minutes: { label: 'Strafminuten', home: 8, away: 12 },
      power_plays: { label: 'Powerplays', home: 4, away: 3 },
      power_play_goals: { label: 'PP-Tore', home: 1, away: 0 },
    },
    players: [
      {
        team_name: homeName,
        players: [
          { name: 'DEV Home C', position_group: 'forward', goals: 1, assists: 1, points: 2 },
          { name: 'DEV Home D', position_group: 'defense', goals: 0, assists: 1, points: 1 },
        ],
      },
      {
        team_name: awayName,
        players: [
          { name: 'DEV Away W', position_group: 'forward', goals: 1, assists: 0, points: 1 },
        ],
      },
    ],
  }
}

/** Deterministic in-memory games. Never persist into data/games/. */
export function buildDevFixtureGames(params: {
  league: string
  season: string
}): CatalogGame[] {
  const league = params.league || 'DEL'
  const season = params.season
  if (!league || !season) return []

  const year = seasonStartYear(season)
  const [homeA, awayA, homeB, awayB] = teamsForFixtures(league, season)

  return [
    dummyGame({
      league,
      season,
      slug: 'md1_scheduled',
      matchday: 1,
      date: `${year}-09-12`,
      home: homeA,
      away: awayA,
      status: 'scheduled',
    }),
    dummyGame({
      league,
      season,
      slug: 'md2_scheduled',
      matchday: 2,
      date: `${year}-09-14`,
      home: homeB,
      away: homeA,
      status: 'scheduled',
    }),
    dummyGame({
      league,
      season,
      slug: 'md3_home_win',
      matchday: 3,
      date: `${year}-09-18`,
      home: homeA,
      away: awayB,
      status: 'final',
      score: {
        home: 4,
        away: 1,
        periods: [
          { home: 1, away: 0 },
          { home: 2, away: 1 },
          { home: 1, away: 0 },
        ],
      },
      stats: dummyBoxscore(homeA.name, awayB.name),
    }),
    dummyGame({
      league,
      season,
      slug: 'md4_away_win',
      matchday: 4,
      date: `${year}-09-20`,
      home: awayA,
      away: homeA,
      status: 'final',
      score: {
        home: 2,
        away: 3,
        periods: [
          { home: 1, away: 1 },
          { home: 0, away: 1 },
          { home: 1, away: 1 },
        ],
      },
    }),
    dummyGame({
      league,
      season,
      slug: 'md5_ot',
      matchday: 5,
      date: `${year}-09-25`,
      home: homeA,
      away: homeB,
      status: 'final',
      score: {
        home: 3,
        away: 2,
        periods: [
          { home: 1, away: 1 },
          { home: 1, away: 0 },
          { home: 0, away: 1 },
          { home: 1, away: 0 },
        ],
      },
    }),
  ]
}

type ShowcaseSlot = {
  time: string
  status: CatalogGame['status']
  score?: CatalogGame['score']
}

/** Rich cross-league slate for Dev UI preview — never persisted. */
export function buildDevTodayShowcaseByLeague(date: string): Record<ScheduleLeague, CatalogGame[]> {
  const referenceDate = new Date(`${date}T12:00:00`)
  const season = inferSplitSeasonLabelForDate(referenceDate)
  const out = {} as Record<ScheduleLeague, CatalogGame[]>

  const leagueSlots: Record<ScheduleLeague, ShowcaseSlot[]> = {
    DEL: [
      { time: '17:00', status: 'final', score: { home: 3, away: 2 } },
      { time: '17:30', status: 'live' },
      { time: '19:00', status: 'scheduled' },
      { time: '19:30', status: 'scheduled' },
    ],
    DEL2: [
      { time: '18:00', status: 'scheduled' },
      { time: '19:00', status: 'live' },
      { time: '19:30', status: 'scheduled' },
    ],
    CHL: [
      { time: '18:30', status: 'scheduled' },
      { time: '20:00', status: 'scheduled' },
    ],
    U20_DNL: [
      { time: '16:00', status: 'final', score: { home: 4, away: 1 } },
      { time: '18:00', status: 'scheduled' },
      { time: '19:30', status: 'scheduled' },
    ],
    NHL: [
      { time: '01:00', status: 'final', score: { home: 2, away: 5 } },
      { time: '03:30', status: 'final', score: { home: 1, away: 1 } },
      { time: '22:00', status: 'scheduled' },
      { time: '22:30', status: 'scheduled' },
    ],
  }

  SCHEDULE_LEAGUES.forEach((league) => {
    const teams = teamsForFixtures(league, season)
    const [homeA, awayA, homeB, awayB] = teams
    const pairings = [
      [homeA, awayA],
      [homeB, awayB],
      [homeA, awayB],
      [awayA, homeB],
    ] as const

    out[league] = leagueSlots[league].map((slot, index) => {
      const [home, away] = pairings[index] || pairings[0]
      return dummyGame({
        league,
        season,
        slug: `showcase_${date.replace(/-/g, '')}_${index + 1}`,
        matchday: 12,
        date,
        time: slot.time,
        home,
        away,
        status: slot.status,
        score: slot.score,
        phaseId: league === 'U20_DNL' ? 'finding_a_g1' : 'hauptrunde',
        phaseLabel: league === 'U20_DNL' ? 'Findung A · Gruppe 1' : 'Hauptrunde',
      })
    })
  })

  return out
}
