import assert from 'node:assert/strict'
import * as THREE from 'three'
import { distanceToFitSphere } from './autoFit'

const camera = new THREE.PerspectiveCamera(32, 16 / 11, 0.1, 40)
const landscape = distanceToFitSphere(camera, 1, 1.28)
camera.aspect = 9 / 16
const portrait = distanceToFitSphere(camera, 1, 1.28)

assert.ok(landscape > 1, 'landscape fit distance is positive')
assert.ok(portrait > landscape, 'portrait viewport needs more distance, not a hardcoded scale')
assert.ok(Math.abs(distanceToFitSphere(camera, 2, 1.28) / portrait - 2) < 1e-6, 'distance scales with radius')

console.log('autoFit.test.ts: all assertions passed')
