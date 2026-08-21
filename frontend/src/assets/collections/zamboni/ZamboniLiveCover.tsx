import { Component, type ErrorInfo, type ReactNode, Suspense, lazy } from 'react'
import { ZamboniPoster } from './ZamboniPoster'
import styles from '../collectionArtwork.module.css'

const Zamboni3DViewer = lazy(() =>
  import('../../../components/zamboni3d/Zamboni3DViewer').then((mod) => ({ default: mod.Zamboni3DViewer })),
)

type BoundaryState = { hasError: boolean }

class CoverErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[Zamboni3D] collection cover failed', error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function ZamboniLiveCover({
  variant,
  labeled = false,
  title = 'Zamboni RT-81',
}: {
  variant: 'detail' | 'poster'
  labeled?: boolean
  title?: string
}) {
  const fallback = <ZamboniPoster decorative={!labeled} title={title} className={styles.svg} />
  return (
    <div className={`${styles.cover} ${styles[`cover_${variant}`]} ${styles.theme_zamboni} ${styles.coverLive}`}>
      <CoverErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Zamboni3DViewer layout="poster" frameless idleRotate compact />
        </Suspense>
      </CoverErrorBoundary>
    </div>
  )
}
