import assert from 'node:assert/strict'
import { clearClubLogoCache, getOrLoadClubLogo, peekClubLogoObjectUrl } from './clubLogoCache.ts'

let blobSeq = 0
const originalCreate = URL.createObjectURL.bind(URL)
const originalRevoke = URL.revokeObjectURL.bind(URL)
URL.createObjectURL = () => `blob:mock:${++blobSeq}`
URL.revokeObjectURL = () => {}

await clearClubLogoCache()

let loads = 0
const loader = async () => {
  loads += 1
  return new Blob([`logo-${loads}`], { type: 'image/png' })
}

const first = await getOrLoadClubLogo('/teams/del/eisbaren_berlin.png', loader)
const second = await getOrLoadClubLogo('/teams/del/eisbaren_berlin.png', loader)
assert.equal(loads, 1, 'second call must reuse memory cache')
assert.equal(first, second)
assert.equal(peekClubLogoObjectUrl('/teams/del/eisbaren_berlin.png'), first)

const parallel = await Promise.all([
  getOrLoadClubLogo('/teams/del/augsburger_panther.svg', loader),
  getOrLoadClubLogo('/teams/del/augsburger_panther.svg', loader),
])
assert.equal(loads, 2, 'parallel loads for a new key share one inflight fetch')
assert.equal(parallel[0], parallel[1])

await clearClubLogoCache()
assert.equal(peekClubLogoObjectUrl('/teams/del/eisbaren_berlin.png'), null)

URL.createObjectURL = originalCreate
URL.revokeObjectURL = originalRevoke

console.log('clubLogoCache.test.ts: all assertions passed')
