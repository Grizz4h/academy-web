import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { ZamboniPoster } from '../../assets/collections/zamboni/ZamboniPoster'
import { ShowcaseLighting } from '../collectible3d/ShowcaseLighting'
import { ProceduralZamboni } from './ProceduralZamboni'
import styles from './Zamboni3DViewer.module.css'

type Zamboni3DViewerProps = {
  className?: string
  idleRotate?: boolean
  compact?: boolean
  layout?: 'stage' | 'poster'
  frameless?: boolean
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

function ZamboniScene({ idleRotate }: { idleRotate: boolean }) {
  return (
    <>
      <ShowcaseLighting />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#15202c" roughness={0.18} metalness={0.42} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -2.05]}>
        <planeGeometry args={[1.35, 3.1]} />
        <meshStandardMaterial
          color="#d7f7ff"
          roughness={0.06}
          metalness={0.55}
          transparent
          opacity={0.38}
        />
      </mesh>

      <group position={[0, 0, 0.08]}>
        <ProceduralZamboni />
      </group>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.38} scale={6} blur={2.6} far={3.2} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.58}
        target={[0, 0.55, 0]}
        autoRotate={idleRotate}
        autoRotateSpeed={0.42}
        rotateSpeed={0.8}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

export function Zamboni3DViewer({
  className,
  idleRotate = true,
  compact = false,
  layout = 'stage',
  frameless = false,
}: Zamboni3DViewerProps) {
  const [webglOk, setWebglOk] = useState(true)
  const [canvasError, setCanvasError] = useState(false)

  useEffect(() => {
    setWebglOk(supportsWebGL())
  }, [])

  const stageClass = [
    styles.stage,
    layout === 'poster' ? styles.stagePoster : '',
    frameless ? styles.stageFrameless : '',
  ].filter(Boolean).join(' ')

  if (!webglOk || canvasError) {
    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        <div className={[stageClass, styles.fallback].filter(Boolean).join(' ')} role="status">
          <ZamboniPoster decorative title="Zamboni RT-81" className={styles.fallbackSvg} />
        </div>
        {!compact && (
          <p className={styles.fallbackNote}>3D-Vorschau nicht verfügbar. SVG-Fallback bleibt sichtbar.</p>
        )}
      </div>
    )
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={stageClass}>
        <Canvas
          className={styles.canvas}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [2.35, 1.72, 2.55], fov: 32, near: 0.1, far: 40 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0B0F15')
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setCanvasError(true)
            })
          }}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <ZamboniScene idleRotate={idleRotate} />
          </Suspense>
        </Canvas>
      </div>
      {!compact && <p className={styles.hint}>Ziehen zum Drehen · Touch funktioniert · kein Zoom</p>}
    </div>
  )
}

export default Zamboni3DViewer
