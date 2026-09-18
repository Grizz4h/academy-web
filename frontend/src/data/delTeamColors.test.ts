import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDelTeamColors } from './delTeamColors.ts'

const here = dirname(fileURLToPath(import.meta.url))
const HEX = /^#[0-9A-F]{6}$/

type CatalogFile = {
  seasons?: Record<string, Array<{ id: string }>>
}

type ColorFile = Record<string, { primaryColor?: string; secondaryColor?: string } | string>

const frontendColors = JSON.parse(readFileSync(join(here, 'delTeamColors.json'), 'utf8')) as ColorFile
const academyColors = JSON.parse(
  readFileSync(join(here, '../../../data/academy/del_team_colors.json'), 'utf8'),
) as ColorFile
const catalog = JSON.parse(readFileSync(join(here, 'teams_del.json'), 'utf8')) as CatalogFile

const catalogIds = new Set<string>()
for (const teams of Object.values(catalog.seasons || {})) {
  for (const team of teams) catalogIds.add(team.id)
}

function paletteIds(raw: ColorFile): string[] {
  return Object.keys(raw).filter((key) => !key.startsWith('_'))
}

assert.deepEqual(paletteIds(frontendColors).sort(), paletteIds(academyColors).sort())
for (const id of paletteIds(frontendColors)) {
  assert.deepEqual(frontendColors[id], academyColors[id], id)
}

assert.deepEqual([...catalogIds].sort(), paletteIds(frontendColors).sort())

for (const id of catalogIds) {
  const colors = getDelTeamColors(id)
  assert.ok(colors, `missing colors for ${id}`)
  assert.match(colors.primaryColor, HEX)
  assert.match(colors.secondaryColor, HEX)
  assert.notEqual(colors.primaryColor, colors.secondaryColor, id)
}

assert.equal(getDelTeamColors('Eisbaren-Berlin')?.primaryColor, '#003087')
assert.equal(getDelTeamColors('unknown-team'), null)

console.log('delTeamColors.test.ts: all assertions passed')
