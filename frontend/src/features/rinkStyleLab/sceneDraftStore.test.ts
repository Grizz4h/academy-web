import assert from 'node:assert/strict'
import {
  buildBaselineMarkerEdits,
  mergeMarkerEdits,
  sanitizeMarkerEditsForSave,
} from './sceneDraftBuild.ts'
import {
  clearSceneDraft,
  loadSceneDraft,
  parseSceneDraftStore,
  saveSceneDraft,
  SCENE_DRAFT_STORAGE_KEY,
} from './sceneDraftStore.ts'

{
  const mem: Record<string, string> = {}
  const storage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  }
  const baseline = buildBaselineMarkerEdits(
    ['puck_carrier'],
    { puck_carrier: { cx: 255, cy: 185, label: 'Blau', team: 'blue', hasPuck: true } },
  )
  assert.equal(baseline.puck_carrier?.hasPuck, true)
  assert.equal(baseline.puck_carrier?.scale, undefined)

  // Legacy draft with per-player scale must NOT leak into merged edits as authority
  const legacyDraft = {
    puck_carrier: {
      ...baseline.puck_carrier!,
      rotation: 90,
      scale: 0.4,
      puckPlacement: 'body' as const,
      puckOffsetX: 3,
      puckOffsetY: -2,
    },
  }
  const merged = mergeMarkerEdits(baseline, legacyDraft)
  assert.equal(merged.puck_carrier?.rotation, 90)
  assert.equal(merged.puck_carrier?.scale, undefined)
  assert.equal(merged.puck_carrier?.puckPlacement, undefined)
  assert.equal(merged.puck_carrier?.puckOffsetX, 3)
  assert.equal(merged.puck_carrier?.label, 'Blau')

  saveSceneDraft('d4_weak_side', merged, storage)
  const loaded = loadSceneDraft('d4_weak_side', storage)
  assert.ok(loaded)
  assert.equal(loaded?.markers.puck_carrier?.rotation, 90)
  assert.equal(loaded?.markers.puck_carrier?.scale, undefined)

  const sanitized = sanitizeMarkerEditsForSave({
    puck_carrier: {
      ...merged.puck_carrier!,
      scale: 0.2,
      puckPlacement: 'body',
    },
  })
  assert.equal(sanitized.puck_carrier?.scale, undefined)
  assert.equal(sanitized.puck_carrier?.puckPlacement, undefined)

  clearSceneDraft('d4_weak_side', storage)
  assert.equal(loadSceneDraft('d4_weak_side', storage), null)
  assert.ok(mem[SCENE_DRAFT_STORAGE_KEY])
}

assert.deepEqual(parseSceneDraftStore('not-json'), { version: 1, scenes: {} })

console.log('sceneDraftStore.test.ts: all assertions passed')
