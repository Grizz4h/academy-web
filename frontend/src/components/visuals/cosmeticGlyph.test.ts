import assert from 'node:assert/strict'
import { resolveCosmeticGlyphKind } from './cosmeticGlyphKind.ts'

assert.equal(resolveCosmeticGlyphKind('title'), 'title')
assert.equal(resolveCosmeticGlyphKind('tagline'), 'tagline')
assert.equal(resolveCosmeticGlyphKind('sticker'), 'sticker')
assert.equal(resolveCosmeticGlyphKind('frame'), 'frame')
assert.equal(resolveCosmeticGlyphKind('masteryCoin'), 'masteryCoin')
assert.equal(resolveCosmeticGlyphKind('stickSkin'), 'stick')
assert.equal(resolveCosmeticGlyphKind('puckModel'), 'puck')
assert.equal(resolveCosmeticGlyphKind('nameplate'), 'title')
assert.equal(resolveCosmeticGlyphKind('unknown'), 'generic')
