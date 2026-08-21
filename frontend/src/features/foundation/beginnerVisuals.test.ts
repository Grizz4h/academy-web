import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rinkSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'FoundationRink.tsx'),
  'utf8',
)

assert.ok(!/\bLD\b|\bRD\b|\bLW\b|\bRW\b/.test(rinkSource), 'no position abbreviations in Track 0 rink markers')
assert.ok(!/label: 'P'|label: "P"|label: 'S'|label: "S"|label: 'G'|label: "G"/.test(rinkSource))
assert.ok(rinkSource.includes("label: 'Verteidiger'"))
assert.ok(rinkSource.includes('hasPuck'))
assert.ok(rinkSource.includes('gelber Punkt = Puck') || rinkSource.includes('legendPuck'))
assert.ok(!rinkSource.includes("label: 'Puckführer'"), 'do not spoil puck carrier with role label on the marker')
assert.ok(rinkSource.includes('playerBlue') || rinkSource.includes('playerRed'))
assert.ok(rinkSource.includes('weakSideBand'))
assert.ok(rinkSource.includes('Defensivzone'))
assert.ok(rinkSource.includes('Neutralzone'))
assert.ok(rinkSource.includes('Offensivzone'))

const docs = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../../docs/ai-rules/curriculum-rework.md'),
  'utf8',
)
assert.ok(docs.includes('Beginner Visualization Rule'))

const lesson = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'FoundationLessonDrill.tsx'),
  'utf8',
)
assert.ok(lesson.includes('Session abschließen'))
assert.ok(lesson.includes('foundationComplete: true'))
assert.ok(lesson.includes('Lektion abschließen') || lesson.includes('Bereit zum Speichern'))

console.log('beginnerVisuals.test.ts: all assertions passed')
