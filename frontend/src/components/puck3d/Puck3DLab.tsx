import { Component, type ErrorInfo, type ReactNode, Suspense, lazy, useEffect, useState } from 'react'
import { isDevNavEnabled } from '../../config/featureFlags'
import styles from './Puck3DLab.module.css'

const Puck3DViewer = lazy(() =>
  import('./Puck3DViewer').then((mod) => ({ default: mod.Puck3DViewer })),
)
const Stick3DViewer = lazy(() =>
  import('./Stick3DViewer').then((mod) => ({ default: mod.Stick3DViewer })),
)

type BoundaryState = { hasError: boolean }
type GearTab = 'puck' | 'stick'

class GearErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[Gear3D] render failed', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="status">
          <strong>3D-Vorschau nicht verfügbar</strong>
          <p>Der Viewer konnte nicht geladen werden. Die restliche App bleibt nutzbar.</p>
        </div>
      )
    }
    return this.props.children
  }
}

/** Dev-only Locker section for 3D gear PoCs (puck + stick). */
export function Puck3DLab() {
  const [devMode, setDevMode] = useState(() => isDevNavEnabled())
  const [mounted, setMounted] = useState(false)
  const [gear, setGear] = useState<GearTab>('stick')

  useEffect(() => {
    const sync = () => setDevMode(isDevNavEnabled())
    window.addEventListener('academy-dev-nav', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('academy-dev-nav', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (devMode) setMounted(true)
  }, [devMode])

  if (!devMode) return null

  return (
    <section className={styles.lab}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>DEV · 3D LAB</p>
          <h2 className={styles.title}>Gear Prototype</h2>
          <p className={styles.lead}>
            Proof of Concept: drehbare 3D-Collectibles mit austauschbaren Skins. Noch kein GLB-Asset-System.
          </p>
        </div>
      </div>

      <div className="ui-tablist" role="tablist" aria-label="3D Gear">
        <button
          type="button"
          role="tab"
          aria-selected={gear === 'puck'}
          className={`ui-tab ${gear === 'puck' ? 'is-active' : ''}`}
          onClick={() => setGear('puck')}
        >
          Puck
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={gear === 'stick'}
          className={`ui-tab ${gear === 'stick' ? 'is-active' : ''}`}
          onClick={() => setGear('stick')}
        >
          Stick
        </button>
      </div>

      {mounted && (
        <GearErrorBoundary key={gear}>
          <Suspense fallback={<div className={styles.loading}>Lade 3D-Viewer…</div>}>
            {gear === 'puck' ? (
              <Puck3DViewer idleRotate showSkinPicker />
            ) : (
              <Stick3DViewer idleRotate showSkinPicker />
            )}
          </Suspense>
        </GearErrorBoundary>
      )}
    </section>
  )
}
