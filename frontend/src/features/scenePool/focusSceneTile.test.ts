import assert from 'node:assert/strict'
import {
  buildScenePoolFocusHref,
  readSceneFocusId,
  sceneDomId,
} from './focusSceneTile.ts'

assert.equal(
  buildScenePoolFocusHref({ sceneId: 'scene_abc', sessionId: 'sess_1' }),
  '/ringabout?session_id=sess_1&scene=scene_abc',
)
assert.equal(
  buildScenePoolFocusHref({ sceneId: 'scene_abc' }),
  '/ringabout?scene=scene_abc',
)
assert.equal(buildScenePoolFocusHref({ sceneId: '' }), '/ringabout')

const params = new URLSearchParams('session_id=s1&scene=scene_xyz')
assert.equal(readSceneFocusId(params, ''), 'scene_xyz')
assert.equal(readSceneFocusId(new URLSearchParams(''), '#scene-scene_xyz'), 'scene_xyz')
assert.equal(readSceneFocusId(new URLSearchParams(''), '#other'), null)
assert.equal(readSceneFocusId(new URLSearchParams('scene=from_query'), '#scene-from_hash'), 'from_query')

assert.equal(sceneDomId('scene_1'), 'scene-scene_1')

console.log('focusSceneTile tests OK')
