import assert from 'node:assert/strict'
import {
  defendingSideFromAttackDirection,
  flipAttackDirection,
  homeAttackDirectionForPeriod,
  inferAutoAttackDirection,
  inferPeriodNumber,
  resolveLiveAttackDirection,
} from './attackDirection.ts'

assert.equal(flipAttackDirection('right'), 'left')
assert.equal(flipAttackDirection('left'), 'right')

assert.equal(inferPeriodNumber('P2'), 2)
assert.equal(inferPeriodNumber(undefined, 'P3'), 3)
assert.equal(inferPeriodNumber('POST'), 1)

assert.equal(homeAttackDirectionForPeriod('right', 1), 'right')
assert.equal(homeAttackDirectionForPeriod('right', 2), 'left')
assert.equal(homeAttackDirectionForPeriod('right', 3), 'right')
assert.equal(homeAttackDirectionForPeriod('left', 2), 'right')

const baseSession = {
  game_info: {
    team_home: 'Nürnberg Ice Tigers',
    team_away: 'Augsburger Panther',
    home_team_id: 'nurnberg_ice_tigers',
    away_team_id: 'augsburger_panther',
  },
}

// Home observed, P2 → attack left
assert.equal(
  inferAutoAttackDirection({
    phase: 'P2',
    homeAttackDirectionP1: 'right',
    session: {
      ...baseSession,
      observed_team_id: 'nurnberg_ice_tigers',
      game_info: {
        ...baseSession.game_info,
        observed_team: 'Nürnberg Ice Tigers',
        observed_team_id: 'nurnberg_ice_tigers',
      },
    },
  }),
  'left',
)

// Away observed, P2 → home attacks left → away attacks right
assert.equal(
  inferAutoAttackDirection({
    phase: 'P2',
    homeAttackDirectionP1: 'right',
    session: {
      ...baseSession,
      observed_team_id: 'augsburger_panther',
      game_info: {
        ...baseSession.game_info,
        observed_team: 'Augsburger Panther',
        observed_team_id: 'augsburger_panther',
      },
    },
  }),
  'right',
)

// Away observed, P1 → attack left
assert.equal(
  inferAutoAttackDirection({
    phase: 'P1',
    homeAttackDirectionP1: 'right',
    session: {
      ...baseSession,
      game_info: {
        ...baseSession.game_info,
        observed_team: 'Augsburger Panther',
        observed_team_id: 'augsburger_panther',
      },
    },
  }),
  'left',
)

// Name-only match (no ids)
assert.equal(
  inferAutoAttackDirection({
    phase: 'P2',
    homeAttackDirectionP1: 'right',
    session: {
      game_info: {
        team_home: 'Eisbären Berlin',
        team_away: 'Straubing Tigers',
        observed_team: 'Eisbären Berlin',
      },
    },
  }),
  'left',
)

// Unknown observed team: still period-flip (do NOT stick on fixed default right)
assert.equal(
  inferAutoAttackDirection({
    phase: 'P2',
    homeAttackDirectionP1: 'right',
    session: {
      game_info: {
        team_home: 'Home',
        team_away: 'Away',
      },
    },
  }),
  'left',
)

// ID match wins over mismatched name
assert.equal(
  inferAutoAttackDirection({
    phase: 'P1',
    homeAttackDirectionP1: 'right',
    session: {
      observed_team: 'Wrong Name',
      observed_team_id: 'augsburger_panther',
      game_info: {
        ...baseSession.game_info,
        observed_team: 'Wrong Name',
        observed_team_id: 'augsburger_panther',
      },
    },
  }),
  'left',
)

assert.equal(defendingSideFromAttackDirection('right'), 'left')
assert.equal(defendingSideFromAttackDirection('left'), 'right')

// Away Ingolstadt vs Iserlohn home, P1: away attacks left → own end right
const iserlohnIngolstadt = {
  game_info: {
    team_home: 'Iserlohn Roosters',
    team_away: 'ERC Ingolstadt',
    home_team_id: 'iserlohn_roosters',
    away_team_id: 'erc_ingolstadt',
    observed_team: 'ERC Ingolstadt',
    observed_team_id: 'erc_ingolstadt',
  },
  observed_team_id: 'erc_ingolstadt',
}
assert.equal(
  inferAutoAttackDirection({
    phase: 'P1',
    homeAttackDirectionP1: 'right',
    session: iserlohnIngolstadt,
  }),
  'left',
)
assert.equal(
  defendingSideFromAttackDirection(
    inferAutoAttackDirection({
      phase: 'P1',
      homeAttackDirectionP1: 'right',
      session: iserlohnIngolstadt,
    }),
  ),
  'right',
)
assert.equal(
  inferAutoAttackDirection({
    phase: 'P2',
    homeAttackDirectionP1: 'right',
    session: iserlohnIngolstadt,
  }),
  'right',
)

const liveP1Away = resolveLiveAttackDirection({
  phase: 'P1',
  homeAttackDirectionP1: 'right',
  session: iserlohnIngolstadt,
})
assert.equal(liveP1Away.attackDirection, 'left')
assert.equal(liveP1Away.isOverride, false)

const liveManual = resolveLiveAttackDirection({
  phase: 'P1',
  homeAttackDirectionP1: 'right',
  session: iserlohnIngolstadt,
  manualOverride: 'right',
})
assert.equal(liveManual.attackDirection, 'right')
assert.equal(liveManual.isOverride, true)

console.log('attackDirection.test.ts: all assertions passed')
