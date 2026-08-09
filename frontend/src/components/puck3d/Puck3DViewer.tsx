import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import {
  PUCK_SKINS,
  PUCK_SKIN_BY_ID,
  type PuckSkinDefinition,
} from '../../features/progression/cosmetics/puckSkins'
import { ProceduralPuck } from './ProceduralPuck'
import styles from './Puck3DViewer.module.css'

type Puck3DViewerProps = {
  /** Skin id: classic | frozen | gold */
  skinId?: string
  /** Controlled skin change */
  onSkinChange?: (skinId: string) => void
  /** Show Classic / Frozen / Gold buttons */
  showSkinPicker?: boolean
  className?: string
  /** Enable subtle OrbitControls autoRotate until user grabs */
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

function PuckScene({
  skin,
  idleRotate,
}: {
  skin: PuckSkinDefinition
  idleRotate: boolean
}) {
  return (
    <>
      <color attach="background" args={['#121a28']} />
      <hemisphereLight args={['#e8f2ff', '#2a3344', 0.85]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.4, 5.2, 3.1]} intensity={1.55} color="#fff7ea" />
      <directionalLight position={[-3.2, 2.8, -1.6]} intensity={0.55} color="#9fd4ff" />
      <directionalLight position={[0.5, 1.2, 4]} intensity={0.4} color="#ffffff" />
      <spotLight
        position={[0, 4.5, 1.5]}
        angle={0.55}
        penumbra={0.8}
        intensity={0.55}
        color="#ffffff"
      />

      <group position={[0, 0.02, 0]}>
        <ProceduralPuck material={skin.material} />
      </group>

      <ContactShadows
        position={[0, -0.28, 0]}
        opacity={0.32}
        scale={5}
        blur={2.8}
        far={2.5}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.62}
        target={[0, 0.02, 0]}
        autoRotate={idleRotate}
        autoRotateSpeed={0.45}
        rotateSpeed={0.85}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

/** Reusable 3D puck showcase (PoC). Mount only when visible. */
export function Puck3DViewer({
  skinId = 'classic',
  onSkinChange,
  showSkinPicker = true,
  className,
  idleRotate = true,
}: Puck3DViewerProps) {
  const [activeSkinId, setActiveSkinId] = useState(skinId)
  const [webglOk, setWebglOk] = useState(true)
  const [canvasError, setCanvasError] = useState(false)

  useEffect(() => {
    setActiveSkinId(skinId)
  }, [skinId])

  useEffect(() => {
    setWebglOk(supportsWebGL())
  }, [])

  const skin = PUCK_SKIN_BY_ID[activeSkinId] || PUCK_SKINS[0]

  const selectSkin = (id: string) => {
    setActiveSkinId(id)
    onSkinChange?.(id)
  }

  if (!webglOk || canvasError) {
    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        <div className={styles.fallback} role="status">
          <strong>3D-Vorschau nicht verfügbar</strong>
          <p>WebGL fehlt oder der Canvas ist fehlgeschlagen. Der Rest der App bleibt nutzbar.</p>
          <div className={styles.fallbackPuck} data-skin={skin.id} aria-hidden="true" />
          <span className={styles.fallbackLabel}>{skin.name}</span>
        </div>
        {showSkinPicker && (
          <div className={styles.picker} role="group" aria-label="Puck Skin">
            {PUCK_SKINS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`${styles.skinBtn} ${entry.id === skin.id ? styles.skinBtnActive : ''}`}
                onClick={() => selectSkin(entry.id)}
              >
                {entry.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.stage}>
        <Canvas
          className={styles.canvas}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [1.65, 2.35, 1.95], fov: 34, near: 0.1, far: 40 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#121a28')
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setCanvasError(true)
            })
          }}
          onPointerMissed={undefined}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <PuckScene skin={skin} idleRotate={idleRotate} />
          </Suspense>
        </Canvas>
      </div>

      {showSkinPicker && (
        <div className={styles.picker} role="group" aria-label="Puck Skin">
          {PUCK_SKINS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`${styles.skinBtn} ${entry.id === skin.id ? styles.skinBtnActive : ''}`}
              onClick={() => selectSkin(entry.id)}
            >
              <span className={styles.swatch} data-skin={entry.id} aria-hidden="true" />
              {entry.name}
            </button>
          ))}
        </div>
      )}

      <p className={styles.hint}>Ziehen zum Drehen · Touch funktioniert · kein Zoom</p>
    </div>
  )
}

export default Puck3DViewer
