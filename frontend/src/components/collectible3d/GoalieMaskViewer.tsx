import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { UiChip } from '../ui'
import { GOALIE_MASK_GLB_BYTES } from './assets'
import { GoalieMaskCollectible } from './GoalieMaskCollectible'
import type { MaskDisplayMode } from './GoalieMaskModel'
import type { ModelInspectSummary } from './inspectModel'
import { DEBUG_MESH_COLORS, ROLE_LABELS, type MaskPartRole } from './maskPartMapping'
import styles from './GoalieMaskViewer.module.css'

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

function LoadOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  const mb = (GOALIE_MASK_GLB_BYTES / 1024 / 1024).toFixed(1)
  return (
    <div className={styles.overlay} role="status">
      <div className={styles.overlayInner}>
        <strong>Lade Goalie-Maske</strong>
        <p>{Math.round(progress)}% · {mb} MB GLB</p>
      </div>
    </div>
  )
}

function PerfProbe({ onSample }: { onSample: (calls: number, triangles: number) => void }) {
  const gl = useThree((state) => state.gl)
  const last = useRef(0)
  useFrame(() => {
    const now = performance.now()
    if (now - last.current < 900) return
    last.current = now
    onSample(gl.info.render.calls, gl.info.render.triangles)
  })
  return null
}

export function GoalieMaskViewer({ className }: { className?: string }) {
  const [webglOk, setWebglOk] = useState(true)
  const [canvasError, setCanvasError] = useState(false)
  const [mystic, setMystic] = useState(true)
  const [debugColors, setDebugColors] = useState(false)
  const [debugNames, setDebugNames] = useState(false)
  const [halo, setHalo] = useState(true)
  const [particles, setParticles] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [inspect, setInspect] = useState<ModelInspectSummary | null>(null)
  const [perf, setPerf] = useState({ calls: 0, triangles: 0 })

  useEffect(() => {
    setWebglOk(supportsWebGL())
  }, [])

  const displayMode: MaskDisplayMode = debugColors ? 'debugColors' : mystic ? 'mystic' : 'base'
  const mb = (GOALIE_MASK_GLB_BYTES / 1024 / 1024).toFixed(1)

  const roleCounts = useMemo(() => {
    const counts = new Map<MaskPartRole, number>()
    inspect?.parts.forEach((part) => {
      counts.set(part.role, (counts.get(part.role) || 0) + 1)
    })
    return counts
  }, [inspect])

  if (!webglOk || canvasError) {
    return (
      <div className={[styles.root, className].filter(Boolean).join(' ')}>
        <div className={styles.fallback} role="status">
          <strong>3D-Vorschau nicht verfügbar</strong>
          <p>WebGL fehlt oder der Canvas ist fehlgeschlagen. Die restliche App bleibt nutzbar.</p>
        </div>
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
          camera={{ position: [0.18, 0.12, 0.22], fov: 32, near: 0.01, far: 20 }}
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
            <GoalieMaskCollectible
              rarity={mystic ? 'mystic' : 'common'}
              displayMode={displayMode}
              showPartNames={debugNames}
              haloEnabled={halo}
              particlesEnabled={particles}
              idleEnabled={mystic && !debugColors}
              autoRotate={autoRotate}
              fittedBounds={inspect?.bounds || null}
              onInspect={setInspect}
            />
            <PerfProbe onSample={(calls, triangles) => setPerf({ calls, triangles })} />
          </Suspense>
        </Canvas>
        <LoadOverlay />
      </div>

      <div className={styles.debug} role="group" aria-label="Goalie mask debug">
        <UiChip active={!mystic && !debugColors} onClick={() => { setMystic(false); setDebugColors(false) }}>
          Base only
        </UiChip>
        <UiChip active={mystic && !debugColors} onClick={() => { setMystic(true); setDebugColors(false) }}>
          Mystic
        </UiChip>
        <UiChip active={debugColors} onClick={() => setDebugColors((value) => !value)}>
          Show Part Colors
        </UiChip>
        <UiChip active={debugNames} onClick={() => setDebugNames((value) => !value)}>
          Show Part Names
        </UiChip>
        <UiChip active={mystic && halo && !debugColors} disabled={!mystic || debugColors} onClick={() => setHalo((value) => !value)}>
          Halo
        </UiChip>
        <UiChip active={mystic && particles && !debugColors} disabled={!mystic || debugColors} onClick={() => setParticles((value) => !value)}>
          Particles
        </UiChip>
        <UiChip active={autoRotate} onClick={() => setAutoRotate((value) => !value)}>Auto Rotate</UiChip>
      </div>

      {inspect && inspect.parts.length > 0 && (
        <ul className={styles.legend} aria-label="Mask parts">
          {inspect.parts.map((part) => {
            const n = Number(part.sourceName.match(/(\d+)$/)?.[1] ?? 0)
            return (
              <li key={part.sourceName}>
                <span
                  className={styles.swatch}
                  style={{ background: DEBUG_MESH_COLORS[n % DEBUG_MESH_COLORS.length] }}
                />
                <code>{part.sourceName}</code>
                <span>{ROLE_LABELS[part.role]}</span>
              </li>
            )
          })}
        </ul>
      )}

      <p className={styles.stats}>
        {inspect
          ? `meshes ${inspect.meshCount} · split ${inspect.splitConfirmed ? 'yes' : 'no'} · cage/shell ${inspect.separateCage && inspect.separateShell ? 'yes' : 'no'} · tris ${inspect.triangles.toLocaleString('de-DE')} · file ${mb} MB · draws ~${perf.calls}`
          : `GLB ${mb} MB · lädt…`}
        {inspect ? (
          <span>
            {' '}
            · roles {MASK_ROLE_ORDER.filter((role) => roleCounts.get(role)).map((role) => `${ROLE_LABELS[role]} ${roleCounts.get(role)}`).join(', ')}
          </span>
        ) : null}
        {inspect && inspect.triangles > 250_000 ? (
          <span className={styles.warn}>
            {' '}
            · überdimensioniert — Original unangetastet
          </span>
        ) : null}
      </p>
      <p className={styles.hint}>
        Show Part Colors: jedes Mesh eigene Farbe. Mapping sitzt in maskPartMapping.ts (Geometrie, nicht Namen).
      </p>
    </div>
  )
}

const MASK_ROLE_ORDER: MaskPartRole[] = [
  'frontShell',
  'cage',
  'backplate',
  'straps',
  'padding',
  'hardware',
  'otherParts',
]

export default GoalieMaskViewer
