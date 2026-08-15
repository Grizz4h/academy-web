import assert from 'node:assert/strict'
import { matchRoute } from './routeMatch.ts'

assert.equal(matchRoute('/', '/'), true)
assert.equal(matchRoute('/curriculum', '/'), false)
assert.equal(matchRoute('/setup/T0', '/setup/*'), true)
assert.equal(matchRoute('/setup', '/setup/*'), true)
assert.equal(matchRoute('/session/abc', '/session/*'), true)
assert.equal(matchRoute('/history', '/session/*'), false)
assert.equal(matchRoute('/curriculum/', '/curriculum'), true)
