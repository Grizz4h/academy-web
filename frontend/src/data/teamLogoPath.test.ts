import assert from 'node:assert/strict'
import { parseTeamLogoLogicalPath } from './teamLogoPath.ts'

assert.deepEqual(parseTeamLogoLogicalPath('/teams/del/eisbaren_berlin.png'), {
  league: 'del',
  filename: 'eisbaren_berlin.png',
})
assert.deepEqual(parseTeamLogoLogicalPath('/teams/u20_dnl/jungadler_mannheim.svg'), {
  league: 'u20_dnl',
  filename: 'jungadler_mannheim.svg',
})
assert.equal(parseTeamLogoLogicalPath('/teams/del/../secret.png'), null)
assert.equal(parseTeamLogoLogicalPath('/teams/other/foo.png'), null)
assert.equal(parseTeamLogoLogicalPath('https://cdn.example/logo.png'), null)

console.log('teamLogoPath.test.ts: all assertions passed')
