import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  MASK_PART_OVERRIDES,
  classifyMaskMeshes,
  type MeshStat,
} from './maskPartMapping.ts'

function stat(
  name: string,
  triangles: number,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
): MeshStat {
  const size = new THREE.Vector3(sx, sy, sz)
  const center = new THREE.Vector3(cx, cy, cz)
  return {
    name,
    parentName: `model_part${name.replace('mesh_', '')}`,
    materialName: 'part',
    triangles,
    vertices: triangles,
    center,
    size,
    min: center.clone().sub(size.clone().multiplyScalar(0.5)),
    max: center.clone().add(size.clone().multiplyScalar(0.5)),
  }
}

/** World-space snapshot from Meshy_AI_export_1787176890_part-segmentation.glb */
const FIXTURES: MeshStat[] = [
  stat('mesh_0', 56574, -0.037, 0.086, -0.006, 0.009, 0.012, 0.022),
  stat('mesh_1', 782202, 0, 0.059, 0.024, 0.082, 0.057, 0.044),
  stat('mesh_2', 55578, -0.03, 0.033, 0.001, 0.009, 0.014, 0.032),
  stat('mesh_3', 7680, 0, 0.116, -0.022, 0.008, 0.006, 0.02),
  stat('mesh_4', 55614, 0.03, 0.034, 0.001, 0.009, 0.014, 0.032),
  stat('mesh_5', 56574, 0.037, 0.086, -0.006, 0.009, 0.013, 0.022),
  stat('mesh_6', 942, -0.014, 0.057, -0.04, 0.003, 0.009, 0.003),
  stat('mesh_7', 1386, 0.001, 0.115, -0.02, 0.008, 0.004, 0.022),
  stat('mesh_8', 2890, 0, 0.106, -0.036, 0.007, 0.005, 0.003),
  stat('mesh_9', 4182, 0.022, 0.041, -0.031, 0.003, 0.01, 0.008),
  stat('mesh_10', 21456, 0.029, 0.071, -0.038, 0.016, 0.011, 0.007),
  stat('mesh_11', 23572, 0, 0.118, -0.008, 0.01, 0.005, 0.014),
  stat('mesh_12', 22768, -0.029, 0.071, -0.038, 0.016, 0.011, 0.007),
  stat('mesh_13', 26258, 0.001, 0.091, -0.032, 0.058, 0.033, 0.007),
  stat('mesh_14', 26348, -0.03, 0.045, -0.034, 0.014, 0.014, 0.009),
  stat('mesh_15', 27040, 0.03, 0.045, -0.034, 0.014, 0.014, 0.009),
  stat('mesh_16', 30760, 0, 0.11, -0.026, 0.011, 0.018, 0.028),
  stat('mesh_17', 67048, 0, 0.068, -0.036, 0.062, 0.064, 0.019),
  stat('mesh_18', 74198, 0, 0.07, -0.038, 0.055, 0.063, 0.018),
  stat('mesh_19', 162460, 0, 0.072, -0.013, 0.08, 0.078, 0.056),
  stat('mesh_20', 565826, 0, 0.058, 0.003, 0.085, 0.117, 0.076),
]

const parts = classifyMaskMeshes(FIXTURES)
const role = (name: string) => parts.find((part) => part.sourceName === name)?.role

assert.equal(role('mesh_1'), 'cage', 'front large volume is cage')
assert.equal(role('mesh_20'), 'frontShell', 'largest envelope is front shell')
assert.equal(role('mesh_19'), 'backplate', 'rear large volume is backplate')
assert.equal(role('mesh_17'), 'padding')
assert.equal(role('mesh_18'), 'padding')
assert.equal(role('mesh_0'), 'straps')
assert.equal(role('mesh_5'), 'straps')
assert.equal(role('mesh_16'), 'hardware')
assert.equal(MASK_PART_OVERRIDES.mesh_17, 'padding')
assert.equal(parts.length, 21)
assert.ok(new Set(parts.map((part) => part.role)).size >= 5, 'several distinct roles')

console.log('maskPartMapping.test.ts: all assertions passed')
console.log(parts.map((part) => `${part.sourceName}→${part.role}`).join('  '))
