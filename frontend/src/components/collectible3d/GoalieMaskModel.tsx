import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GOALIE_MASK_GLB_URL } from './assets'
import { inspectObject3D, logModelInspect, type ModelInspectSummary } from './inspectModel'
import {
  classifyMaskMeshes,
  collectMeshStats,
  DEBUG_MESH_COLORS,
  ROLE_LABELS,
  type MaskPartInfo,
} from './maskPartMapping'
import {
  createDebugMeshMaterial,
  createMysticRoleMaterials,
  mysticTierForPreset,
  pulseMysticMaterial,
} from './mysticMaterials'
import type { RarityPreset } from './rarityPresets'

export type MaskDisplayMode = 'base' | 'mystic' | 'debugColors'

type GoalieMaskModelProps = {
  preset: RarityPreset
  displayMode: MaskDisplayMode
  showPartNames?: boolean
  onInspect?: (summary: ModelInspectSummary) => void
}

export function GoalieMaskModel({
  preset,
  displayMode,
  showPartNames = false,
  onInspect,
}: GoalieMaskModelProps) {
  const gltf = useGLTF(GOALIE_MASK_GLB_URL)
  const holder = useRef<THREE.Group>(null)
  const cloneRef = useRef<THREE.Group | null>(null)
  const partsRef = useRef<MaskPartInfo[]>([])
  const logged = useRef(false)
  const inspectCb = useRef(onInspect)
  inspectCb.current = onInspect
  const [parts, setParts] = useState<MaskPartInfo[]>([])

  const mysticMats = useMemo(
    () => createMysticRoleMaterials(mysticTierForPreset(preset)),
    [preset],
  )
  const debugMats = useMemo(
    () => DEBUG_MESH_COLORS.map((_, index) => createDebugMeshMaterial(index)),
    [],
  )

  useLayoutEffect(() => () => {
    Object.values(mysticMats).forEach((material) => material.dispose())
    debugMats.forEach((material) => material.dispose())
  }, [mysticMats, debugMats])

  useLayoutEffect(() => {
    const root = holder.current
    if (!root) return
    while (root.children.length > 0) root.remove(root.children[0])
    const clone = gltf.scene.clone(true)
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.castShadow = false
      obj.receiveShadow = false
      if (!obj.geometry.getAttribute('normal')) {
        obj.geometry.computeVertexNormals()
      }
      obj.userData.baseMaterial = obj.material
    })
    root.add(clone)
    cloneRef.current = clone
    const stats = collectMeshStats(clone)
    const classified = classifyMaskMeshes(stats)
    partsRef.current = classified
    setParts(classified)
    const summary = inspectObject3D(root, classified)
    if (!logged.current) {
      logModelInspect('GoalieMask', summary)
      logged.current = true
    }
    inspectCb.current?.(summary)
  }, [gltf.scene])

  useLayoutEffect(() => {
    const clone = cloneRef.current
    if (!clone) return
    let index = 0
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const source = obj.name || `mesh_${index}`
      const part = partsRef.current.find((entry) => entry.sourceName === source)
      const parsed = source.match(/(\d+)$/)
      const colorIndex = parsed ? Number(parsed[1]) : index
      if (displayMode === 'debugColors') {
        obj.material = debugMats[colorIndex % debugMats.length]
      } else if (displayMode === 'base' || preset.shellMaterial === 'base') {
        obj.material = obj.userData.baseMaterial
      } else {
        obj.material = mysticMats[part?.role || 'otherParts']
      }
      index += 1
    })
  }, [displayMode, preset.shellMaterial, mysticMats, debugMats, parts])

  useFrame(({ clock }) => {
    if (displayMode === 'base' || displayMode === 'debugColors') return
    Object.values(mysticMats).forEach((material) => pulseMysticMaterial(material, clock.elapsedTime))
  })

  return (
    <group>
      <group ref={holder} />
      {showPartNames && parts.map((part) => (
        <Html
          key={part.sourceName}
          position={part.center}
          center
          distanceFactor={0.55}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(8,12,20,0.82)',
              color: '#e6f6ff',
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              border: '1px solid rgba(0,229,255,0.35)',
            }}
          >
            {part.sourceName}
            <br />
            {ROLE_LABELS[part.role]}
          </span>
        </Html>
      ))}
    </group>
  )
}

useGLTF.preload(GOALIE_MASK_GLB_URL)
