/**
 * Run: npx --yes tsx src/features/progression/cosmetics/textLooks.test.ts
 */
import assert from 'node:assert/strict'
import { resolveEquippedTagline, resolveEquippedTitle } from './textLooks.ts'

const commonRinkRat = resolveEquippedTitle('title_catalog_rink_rat')
assert.equal(commonRinkRat?.label, 'Rink Rat')
assert.equal(commonRinkRat?.rarity, 'common')

const rareRinkRat = resolveEquippedTitle('title_rink_rat')
assert.equal(rareRinkRat?.label, 'Rink Rat')
assert.equal(rareRinkRat?.rarity, 'rare')

const legacyAlias = resolveEquippedTitle('rink_rat')
assert.equal(legacyAlias?.label, 'Rink Rat')
assert.equal(legacyAlias?.rarity, 'common')

const uniqueTitle = resolveEquippedTitle('title_clip_goblin')
assert.equal(uniqueTitle?.label, 'Clip Goblin')
assert.equal(uniqueTitle?.rarity, 'rare')

const taglineById = resolveEquippedTagline('tagline_watch_the_center')
assert.equal(taglineById?.label, 'Watch the center.')
assert.equal(taglineById?.rarity, 'uncommon')

const taglineByText = resolveEquippedTagline('Watch the center.')
assert.equal(taglineByText?.rarity, 'uncommon')

console.log('textLooks.test.ts: all assertions passed')
