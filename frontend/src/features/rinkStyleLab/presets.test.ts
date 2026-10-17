import assert from 'node:assert/strict'
import { applyMarkerStyleVariant } from './presets.ts'

{
  // Team without explicit override must keep red defaults for defenders
  const team = applyMarkerStyleVariant({}, ['defense_left', 'puck_carrier'], 'team')
  assert.equal(team.defense_left?.team, 'red')
  assert.equal(team.defense_left?.label, 'Rot')
  assert.equal(team.puck_carrier?.team, 'blue')
  assert.equal(team.puck_carrier?.label, 'Blau')
}

{
  const neutral = applyMarkerStyleVariant(
    { puck_carrier: { team: 'blue', label: 'Blau', hasPuck: true } },
    ['puck_carrier'],
    'neutral',
  )
  assert.equal(neutral.puck_carrier?.team, 'neutral')
  assert.equal(neutral.puck_carrier?.label, 'Spieler')
}

{
  const role = applyMarkerStyleVariant(
    { defense_left: { team: 'red', label: 'Rot' } },
    ['defense_left'],
    'role',
  )
  assert.equal(role.defense_left?.team, 'red')
  assert.equal(role.defense_left?.label, 'Verteidiger')
}

console.log('presets.test.ts: all assertions passed')
