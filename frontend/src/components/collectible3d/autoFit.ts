import * as THREE from 'three'

export type FittedBounds = {
  center: THREE.Vector3
  size: THREE.Vector3
  radius: number
}

export function measureObject(object: THREE.Object3D): FittedBounds {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  return { center, size, radius: sphere.radius || size.length() * 0.5 }
}

/** Shift the object so its visual center sits at the local origin. */
export function centerObject(object: THREE.Object3D): FittedBounds {
  const bounds = measureObject(object)
  object.position.x -= bounds.center.x
  object.position.y -= bounds.center.y
  object.position.z -= bounds.center.z
  return measureObject(object)
}

/**
 * Distance that fits a bounding sphere into a perspective camera,
 * using current FOV + aspect. Padding > 1 leaves a safe margin.
 */
export function distanceToFitSphere(
  camera: THREE.PerspectiveCamera,
  radius: number,
  padding = 1.28,
): number {
  const safeRadius = Math.max(radius, 0.01)
  const vFov = (camera.fov * Math.PI) / 180
  const fitHeight = safeRadius / Math.sin(vFov / 2)
  const fitWidth = camera.aspect > 0 ? fitHeight / camera.aspect : fitHeight
  return padding * Math.max(fitHeight, fitWidth)
}

export function applyFit(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  distance: number,
  spherical: THREE.Spherical,
): void {
  spherical.radius = distance
  camera.position.setFromSpherical(spherical).add(target)
  camera.near = Math.max(distance / 80, 0.05)
  camera.far = distance * 80
  camera.updateProjectionMatrix()
}
