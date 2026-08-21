import assert from 'node:assert/strict'
import { resolveStableOptionOrder, shuffleRandom } from './optionOrder.ts'

const options = [
  { id: 'a', label: 'richtig' },
  { id: 'b', label: 'falsch 1' },
  { id: 'c', label: 'falsch 2' },
  { id: 'd', label: 'falsch 3' },
]

const once = shuffleRandom(options)
assert.equal(once.length, 4)
assert.deepEqual([...once.map((o) => o.id)].sort(), ['a', 'b', 'c', 'd'])

// Stored order wins and stays stable
const stored = resolveStableOptionOrder(options, ['c', 'a', 'd', 'b'])
assert.deepEqual(stored.ordered.map((o) => o.id), ['c', 'a', 'd', 'b'])
assert.equal(stored.created, false)

const created = resolveStableOptionOrder(options, undefined)
assert.equal(created.created, true)
assert.equal(created.ids.length, 4)

const again = resolveStableOptionOrder(options, created.ids)
assert.deepEqual(again.ordered.map((o) => o.id), created.ids)
assert.equal(again.created, false)

// Over many shuffles, first slot should not always be "a"
let firstIsA = 0
for (let i = 0; i < 40; i += 1) {
  if (shuffleRandom(options)[0]?.id === 'a') firstIsA += 1
}
assert.ok(firstIsA < 40, 'random shuffle should move the correct answer sometimes')

console.log('optionOrder.test.ts: all assertions passed')
