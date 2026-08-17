import {
  canonicalTeamDisplayName,
  computeObservedTeamStats,
  makeMatchupKey,
} from './exposureStats'
import type { Session } from '../api'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function session(partial: Partial<Session> & { id: string }): Session {
  return {
    id: partial.id,
    created_at: partial.created_at || '2026-08-13T12:00:00.000Z',
    state: partial.state || 'COMPLETED',
    module_id: partial.module_id || 'E1',
    drill_id: partial.drill_id || 'E1_D1',
    game_info: partial.game_info,
    observed_team: partial.observed_team,
    ...partial,
  } as Session
}

{
  assert(
    canonicalTeamDisplayName('ERC Ingolstadt', 'DEL') === 'ERC Ingolstadt',
    'DEL keeps senior name',
  )
  assert(
    canonicalTeamDisplayName('ERC Ingolstadt', 'U20_DNL') === 'ERC Ingolstadt U20',
    'U20 qualifies bare name',
  )
  assert(
    canonicalTeamDisplayName('ERC Ingolstadt U20', 'U20_DNL') === 'ERC Ingolstadt U20',
    'no double U20',
  )
  assert(
    canonicalTeamDisplayName('Jungadler Mannheim', 'U20_DNL') === 'Jungadler Mannheim',
    'youth brand stays',
  )
  console.log('ok canonicalTeamDisplayName')
}

{
  const delKey = makeMatchupKey({
    game_info: {
      league: 'DEL',
      season: '2025/26',
      team_home: 'ERC Ingolstadt',
      team_away: 'Augsburger Panther',
    },
  })
  const u20Key = makeMatchupKey({
    game_info: {
      league: 'U20_DNL',
      season: '2025/26',
      team_home: 'ERC Ingolstadt',
      team_away: 'Ungarn U20 (HUN)',
    },
  })
  assert(Boolean(delKey && u20Key), 'keys exist')
  assert(delKey !== u20Key, 'DEL and U20 matchups differ')
  assert(String(u20Key).includes('erc_ingolstadt_u20'), `u20 key qualified: ${u20Key}`)
  console.log('ok makeMatchupKey separation')
}

{
  const stats = computeObservedTeamStats([
    session({
      id: 'del1',
      game_info: {
        league: 'DEL',
        season: '2025/26',
        team_home: 'ERC Ingolstadt',
        team_away: 'Löwen Frankfurt',
        observed_team: 'ERC Ingolstadt',
      },
    }),
    session({
      id: 'del2',
      game_info: {
        league: 'DEL',
        season: '2025/26',
        team_home: 'Eisbären Berlin',
        team_away: 'ERC Ingolstadt',
        observed_team: 'ERC Ingolstadt',
      },
    }),
    session({
      id: 'u20a',
      game_info: {
        league: 'U20_DNL',
        season: '2025/26',
        team_home: 'ERC Ingolstadt',
        team_away: 'ESC Dresden',
        observed_team: 'ERC Ingolstadt',
      },
    }),
    session({
      id: 'u20b',
      game_info: {
        league: 'U20_DNL',
        season: '2025/26',
        team_home: 'ERC Ingolstadt U20',
        team_away: 'Ungarn U20 (HUN)',
        observed_team: 'ERC Ingolstadt U20',
      },
    }),
  ])

  const byName = Object.fromEntries(stats.map((row) => [row.team, row.sessionCount]))
  assert(byName['ERC Ingolstadt'] === 2, `DEL count: ${JSON.stringify(byName)}`)
  assert(byName['ERC Ingolstadt U20'] === 2, `U20 count: ${JSON.stringify(byName)}`)
  assert(!Number.isNaN(byName['ERC Ingolstadt']), 'senior present')
  console.log('ok observed team stats split')
}

console.log('exposureStats.test.ts passed')
