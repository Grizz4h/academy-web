import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { applyFit, distanceToFitSphere, measureObject } from './autoFit'

type AutoFitCameraProps = {
  target: RefObject<THREE.Object3D | null>
  padding?: number
  /** Increment when attachments change so the framing can expand. */
  revision?: number
}

/**
 * Fits a perspective camera to the object's bounding sphere using FOV + aspect.
 * Resize keeps the current orbit angles and only updates distance.
 */
export function AutoFitCamera({
  target,
  padding = 1.3,
  revision = 0,
}: AutoFitCameraProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null
  const size = useThree((state) => state.size)
  const spherical = useRef(new THREE.Spherical(1, 1.12, 0.72))
  const ready = useRef(false)
  const lastSize = useRef({ w: size.width, h: size.height })

  const fit = (preserveAngles: boolean) => {
    const object = target.current
    if (!object) return
    const bounds = measureObject(object)
    if (bounds.radius < 1e-4) return

    if (preserveAngles && ready.current) {
      const offset = camera.position.clone().sub(bounds.center)
      if (offset.lengthSq() > 1e-8) spherical.current.setFromVector3(offset)
    }

    const distance = distanceToFitSphere(camera, bounds.radius, padding)
    applyFit(camera, bounds.center, distance, spherical.current)
    if (controls) {
      controls.target.copy(bounds.center)
      controls.minDistance = distance * 0.58
      controls.maxDistance = distance * 2.35
      controls.update()
    }
    ready.current = true
  }

  useLayoutEffect(() => {
    const preserve = ready.current
    fit(preserve)
    const id = requestAnimationFrame(() => fit(preserve))
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, target])

  useLayoutEffect(() => {
    const resized = lastSize.current.w !== size.width || lastSize.current.h !== size.height
    lastSize.current = { w: size.width, h: size.height }
    if (resized) fit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height])

  useFrame(() => {
    if (!ready.current && target.current) fit(false)
  })

  return null
}
