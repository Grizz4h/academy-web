import assert from 'node:assert/strict'
import {
  buildBaselineMarkerEdits,
  mergeMarkerEdits,
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
  assert.equal(baseline.puck_carrier?.puckPlacement, 'blade')

  saveSceneDraft('d4_weak_side', {
    ...baseline,
    puck_carrier: {
      ...baseline.puck_carrier!,
      rotation: 90,
      scale: 0.8,
      puckPlacement: 'body',
    },
  }, storage)

  const loaded = loadSceneDraft('d4_weak_side', storage)
  assert.ok(loaded)
  assert.equal(loaded?.markers.puck_carrier?.rotation, 90)

  const merged = mergeMarkerEdits(baseline, loaded?.markers)
  assert.equal(merged.puck_carrier?.rotation, 90)
  assert.equal(merged.puck_carrier?.scale, 0.8)
  assert.equal(merged.puck_carrier?.label, 'Blau')

  clearSceneDraft('d4_weak_side', storage)
  assert.equal(loadSceneDraft('d4_weak_side', storage), null)
  assert.ok(mem[SCENE_DRAFT_STORAGE_KEY])
}

assert.deepEqual(parseSceneDraftStore('not-json'), { version: 1, scenes: {} })

console.log('sceneDraftStore.test.ts: all assertions passed')
