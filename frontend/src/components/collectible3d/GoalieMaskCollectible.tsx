import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { AutoFitCamera } from './AutoFitCamera'
import { GoalieMaskModel, type MaskDisplayMode } from './GoalieMaskModel'
import { GoalieMaskMysticEnhancements } from './GoalieMaskMysticEnhancements'
import type { ModelInspectSummary } from './inspectModel'
import { getRarityPreset, type CollectibleRarity } from './rarityPresets'
import { ShowcaseLighting } from './ShowcaseLighting'

export type GoalieMaskCollectibleProps = {
  rarity?: CollectibleRarity | 'mythic'
  displayMode?: MaskDisplayMode
  showPartNames?: boolean
  haloEnabled?: boolean
  particlesEnabled?: boolean
  idleEnabled?: boolean
  autoRotate?: boolean
  fittedBounds?: ModelInspectSummary['bounds'] | null
  onInspect?: (summary: ModelInspectSummary) => void
}

export function GoalieMaskCollectible({
  rarity = 'mystic',
  displayMode = 'mystic',
  showPartNames = false,
  haloEnabled,
  particlesEnabled,
  idleEnabled,
  autoRotate = true,
  fittedBounds = null,
  onInspect,
}: GoalieMaskCollectibleProps) {
  const preset = getRarityPreset(rarity)
  const root = useRef<THREE.Group>(null)
  const idle = useRef<THREE.Group>(null)
  const inspectRef = useRef<ModelInspectSummary | null>(null)
  const showHalo = displayMode === 'mystic' && (haloEnabled ?? preset.halo)
  const showParticles = displayMode === 'mystic' && (particlesEnabled ?? preset.particles)
  const showIdle = idleEnabled ?? (displayMode === 'mystic' && preset.idle)
  const bounds = fittedBounds
  const revision = useMemo(
    () => (showHalo ? 1 : 0) + (showParticles ? 2 : 0) + (showPartNames ? 4 : 0) + (bounds ? 8 : 0),
    [showHalo, showParticles, showPartNames, bounds],
  )

  const onInspectInner = (summary: ModelInspectSummary) => {
    inspectRef.current = summary
    onInspect?.(summary)
  }

  useFrame(({ clock }) => {
    const group = idle.current
    if (!group) return
    if (!showIdle) {
      group.position.y = 0
      group.rotation.z = 0
      group.rotation.x = 0
      return
    }
    const t = clock.elapsedTime
    const radius = bounds?.radius || inspectRef.current?.bounds.radius || 0.08
    group.position.y = Math.sin(t * 0.7) * radius * 0.04
    group.rotation.z = Math.sin(t * 0.45) * 0.03
    group.rotation.x = Math.sin(t * 0.32) * 0.015
  })

  const shadowY = bounds ? bounds.center[1] - bounds.size[1] * 0.5 : -0.02
  const shadowScale = bounds ? Math.max(bounds.radius * 8, 0.4) : 1.2

  return (
    <>
      <ShowcaseLighting />
      <group ref={root}>
        <group ref={idle}>
          <group name="GoalieMaskRoot">
            <group name="BaseGLB">
              <GoalieMaskModel
                preset={preset}
                displayMode={displayMode}
                showPartNames={showPartNames}
                onInspect={onInspectInner}
              />
            </group>
            <GoalieMaskMysticEnhancements
              bounds={bounds}
              halo={showHalo}
              shards={displayMode === 'mystic' && preset.shards}
              particles={showParticles}
            />
          </group>
        </group>
      </group>
      <ContactShadows position={[0, shadowY, 0]} opacity={0.42} scale={shadowScale} blur={2.8} far={0.4} />
      <AutoFitCamera target={root} revision={revision} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.78}
        autoRotate={autoRotate}
        autoRotateSpeed={0.45}
        rotateSpeed={0.82}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}
