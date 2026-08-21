import { Component, type ErrorInfo, type ReactNode, Suspense, lazy, useEffect, useState } from 'react'
import { isDevNavEnabled } from '../../config/featureFlags'
import styles from './Puck3DLab.module.css'

const Puck3DViewer = lazy(() =>
  import('./Puck3DViewer').then((mod) => ({ default: mod.Puck3DViewer })),
)
const Stick3DViewer = lazy(() =>
  import('./Stick3DViewer').then((mod) => ({ default: mod.Stick3DViewer })),
)
const Zamboni3DViewer = lazy(() =>
  import('../zamboni3d/Zamboni3DViewer').then((mod) => ({ default: mod.Zamboni3DViewer })),
)
const GoalieMaskViewer = lazy(() =>
  import('../collectible3d/GoalieMaskViewer').then((mod) => ({ default: mod.GoalieMaskViewer })),
)

type BoundaryState = { hasError: boolean }
type GearTab = 'puck' | 'stick' | 'zamboni' | 'mask'

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

/** Dev-only Locker section for 3D gear PoCs (puck, stick, zamboni, goalie mask). */
export function Puck3DLab() {
  const [devMode, setDevMode] = useState(() => isDevNavEnabled())
  const [mounted, setMounted] = useState(false)
  const [gear, setGear] = useState<GearTab>('mask')

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
            Proof of Concept: Puck/Stick/Zamboni prozedural, Goalie-Maske als erstes externes GLB plus Mystic-Layer zur Laufzeit.
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
        <button
          type="button"
          role="tab"
          aria-selected={gear === 'zamboni'}
          className={`ui-tab ${gear === 'zamboni' ? 'is-active' : ''}`}
          onClick={() => setGear('zamboni')}
        >
          Zamboni
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={gear === 'mask'}
          className={`ui-tab ${gear === 'mask' ? 'is-active' : ''}`}
          onClick={() => setGear('mask')}
        >
          Goalie Mask
        </button>
      </div>

      {mounted && (
        <GearErrorBoundary key={gear}>
          <Suspense fallback={<div className={styles.loading}>Lade 3D-Viewer…</div>}>
            {gear === 'puck' ? (
              <Puck3DViewer idleRotate showSkinPicker />
            ) : gear === 'stick' ? (
              <Stick3DViewer idleRotate showSkinPicker />
            ) : gear === 'zamboni' ? (
              <Zamboni3DViewer idleRotate />
            ) : (
              <GoalieMaskViewer />
            )}
          </Suspense>
        </GearErrorBoundary>
      )}
    </section>
  )
}
