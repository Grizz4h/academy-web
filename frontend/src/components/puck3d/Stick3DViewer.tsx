import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import {
  STICK_SKINS,
  STICK_SKIN_BY_ID,
  type StickSkinDefinition,
} from '../../features/progression/cosmetics/stickSkins'
import { ProceduralStick } from './ProceduralStick'
import { UiChip } from '../ui'
import styles from './Puck3DViewer.module.css'

type Stick3DViewerProps = {
  skinId?: string
  onSkinChange?: (skinId: string) => void
  showSkinPicker?: boolean
  className?: string
  idleRotate?: boolean
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2')
      || canvas.getContext('webgl')
      || canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

function StickScene({
  skin,
  idleRotate,
}: {
  skin: StickSkinDefinition
  idleRotate: boolean
}) {
  return (
    <>
      <color attach="background" args={['#121a28']} />
      <hemisphereLight args={['#e8f2ff', '#2a3344', 0.9]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3.2, 4.8, 2.4]} intensity={1.6} color="#fff7ea" />
      <directionalLight position={[-3.5, 2.2, -2]} intensity={0.55} color="#9fd4ff" />
      <directionalLight position={[1, 2, 4]} intensity={0.35} color="#ffffff" />
      <spotLight position={[0, 5, 2]} angle={0.5} penumbra={0.75} intensity={0.45} />

      {/* Present stick diagonally — showcase pose */}
      <group position={[0.05, -1.15, 0]} rotation={[0.15, 0.55, -0.55]}>
        <ProceduralStick material={skin.material} />
      </group>

      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.35}
        scale={8}
        blur={2.6}
        far={4}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.72}
        target={[0, 0.05, 0]}
        autoRotate={idleRotate}
        autoRotateSpeed={0.4}
        rotateSpeed={0.8}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

export function Stick3DViewer({
  skinId = 'composite',
  onSkinChange,
  showSkinPicker = true,
  className,
  idleRotate = true,
}: Stick3DViewerProps) {
  const [activeSkinId, setActiveSkinId] = useState(skinId)
  const [webglOk, setWebglOk] = useState(true)
  const [canvasError, setCanvasError] = useState(false)

  useEffect(() => {
    setActiveSkinId(skinId)
  }, [skinId])

  useEffect(() => {
    setWebglOk(supportsWebGL())
  }, [])

  const skin = STICK_SKIN_BY_ID[activeSkinId] || STICK_SKINS[0]

  const selectSkin = (id: string) => {
    setActiveSkinId(id)
    onSkinChange?.(id)
  }

  if (!webglOk || canvasError) {
    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        <div className={styles.fallback} role="status">
          <strong>3D-Vorschau nicht verfügbar</strong>
          <p>WebGL fehlt oder der Canvas ist fehlgeschlagen.</p>
          <span className={styles.fallbackLabel}>{skin.name}</span>
        </div>
        {showSkinPicker && (
          <div className={styles.picker} role="group" aria-label="Stick Skin">
            {STICK_SKINS.map((entry) => (
              <UiChip key={entry.id} active={entry.id === skin.id} onClick={() => selectSkin(entry.id)}>
                {entry.name}
              </UiChip>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={`${styles.stage} ${styles.stageStick}`}>
        <Canvas
          className={styles.canvas}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [2.8, 1.4, 3.4], fov: 36, near: 0.1, far: 50 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#121a28')
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setCanvasError(true)
            })
          }}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <StickScene skin={skin} idleRotate={idleRotate} />
          </Suspense>
        </Canvas>
      </div>

      {showSkinPicker && (
        <div className={styles.picker} role="group" aria-label="Stick Skin">
          {STICK_SKINS.map((entry) => (
            <UiChip key={entry.id} active={entry.id === skin.id} onClick={() => selectSkin(entry.id)}>
              <span className={styles.swatch} data-stick={entry.id} aria-hidden="true" />
              {entry.name}
            </UiChip>
          ))}
        </div>
      )}

      <p className={styles.hint}>Ziehen zum Drehen · Touch funktioniert · kein Zoom</p>
    </div>
  )
}

export default Stick3DViewer
