import { MiniRinkPreview, type MiniRinkPaintLayer, type MiniRinkPath, type MiniRinkPoint } from './MiniRinkPreview'
import styles from './ObservationVisualPreview.module.css'

export type SpatialSnapshotKind = 'paint' | 'path' | 'placement' | 'marker' | 'zone'

export type SpatialSnapshot = {
  kind: SpatialSnapshotKind
  label: string
  paint?: MiniRinkPaintLayer[]
  path?: MiniRinkPath | null
  markers?: MiniRinkPoint[]
  players?: Array<MiniRinkPoint & { label?: string }>
}

function isPoint(v: unknown): v is MiniRinkPoint {
  if (!v || typeof v !== 'object') return false
  const p = v as { x?: unknown; y?: unknown }
  return Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
}

function readPoint(v: unknown): MiniRinkPoint | null {
  if (!isPoint(v)) return null
  return { x: Number(v.x), y: Number(v.y) }
}

function extractPath(raw: unknown): MiniRinkPath | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const start = readPoint(obj.start) || readPoint(obj.from) || readPoint(obj.a)
  const end = readPoint(obj.end) || readPoint(obj.to) || readPoint(obj.b)
  if (start && end) return { start, end }

  const points = Object.values(obj)
    .map(readPoint)
    .filter((p): p is MiniRinkPoint => !!p)
  if (points.length >= 2) return { start: points[0], end: points[1] }
  return null
}

function extractPaint(raw: unknown): MiniRinkPaintLayer[] {
  if (!Array.isArray(raw)) return []
  const layers: MiniRinkPaintLayer[] = []
  raw.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return
    const layer = item as { layerId?: string; color?: string; strokes?: unknown }
    const strokesRaw = Array.isArray(layer.strokes) ? layer.strokes : []
    const strokes: MiniRinkPoint[][] = []
    for (const stroke of strokesRaw) {
      if (!Array.isArray(stroke)) continue
      const pts = stroke.map(readPoint).filter((p): p is MiniRinkPoint => !!p)
      if (pts.length) strokes.push(pts)
    }
    if (!strokes.length) return
    layers.push({
      layerId: layer.layerId || `layer-${idx}`,
      color: typeof layer.color === 'string' ? layer.color : undefined,
      strokes,
    })
  })
  return layers
}

function snapshotFromObservation(entry: Record<string, unknown>, index: number): SpatialSnapshot | null {
  const paintKeys = ['rinkAnnotations', 'annotations', 'paintAnnotations']
  for (const key of paintKeys) {
    const paint = extractPaint(entry[key])
    if (paint.length) {
      return {
        kind: 'paint',
        label: `Beobachtung ${index + 1} · Paint`,
        paint,
      }
    }
  }

  const pathKeys = ['directionPath', 'transitionPath', 'path']
  for (const key of pathKeys) {
    const path = extractPath(entry[key])
    if (path) {
      return {
        kind: 'path',
        label: `Beobachtung ${index + 1} · Pfad`,
        path,
      }
    }
  }

  if (Array.isArray(entry.playerPositions) && entry.playerPositions.length) {
    const players: Array<MiniRinkPoint & { label?: string }> = []
    for (const p of entry.playerPositions) {
      const pt = readPoint(p)
      if (!pt) continue
      const label = typeof (p as { position?: string }).position === 'string'
        ? String((p as { position?: string }).position)
        : undefined
      players.push({ ...pt, label })
    }
    if (players.length) {
      return {
        kind: 'placement',
        label: `Beobachtung ${index + 1} · Placement`,
        players,
      }
    }
  }

  const marker =
    readPoint(entry.accessLocation)
    || readPoint(entry.location)
    || readPoint(entry.marker)
  if (marker) {
    return {
      kind: 'marker',
      label: `Beobachtung ${index + 1} · Marker`,
      markers: [marker],
    }
  }

  const selectedZone = entry.selectedZone
  if (typeof selectedZone === 'string' && selectedZone.trim()) {
    // Zone ids have no shared geometry here — skip inventing a false location.
    return null
  }

  if (Array.isArray(entry.selectedZones) && entry.selectedZones.length) {
    return null
  }

  return null
}

/** Pull spatial observation snapshots from checkin answers (no semantic invention). */
export function extractSpatialSnapshots(answers: unknown, limit = 6): SpatialSnapshot[] {
  if (!answers || typeof answers !== 'object') return []
  const root = answers as Record<string, unknown>
  const out: SpatialSnapshot[] = []

  const observationBuckets = [
    root.observations,
    root.savedObservations,
    root.rinkObservations,
  ]

  for (const bucket of observationBuckets) {
    if (!Array.isArray(bucket)) continue
    bucket.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return
      const snap = snapshotFromObservation(entry as Record<string, unknown>, idx)
      if (snap) out.push(snap)
    })
  }

  // Single-observation answers without an observations[] array
  if (out.length === 0) {
    const snap = snapshotFromObservation(root, 0)
    if (snap) out.push(snap)
  }

  return out.slice(0, limit)
}

type ObservationVisualPreviewProps = {
  answers?: unknown
  snapshots?: SpatialSnapshot[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
  emptyLabel?: string
  showLabels?: boolean
}

export function ObservationVisualPreview({
  answers,
  snapshots: snapshotsProp,
  max = 4,
  size = 'sm',
  className,
  emptyLabel,
  showLabels = false,
}: ObservationVisualPreviewProps) {
  const snapshots = (snapshotsProp || extractSpatialSnapshots(answers, max)).slice(0, max)
  if (snapshots.length === 0) {
    if (!emptyLabel) return null
    return <div className={styles.empty}>{emptyLabel}</div>
  }

  const dims = size === 'md' ? { width: 148, height: 88 } : { width: 108, height: 64 }

  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')}>
      {snapshots.map((snap, i) => (
        <div key={`${snap.kind}-${i}`} className={styles.item}>
          <MiniRinkPreview
            width={dims.width}
            height={dims.height}
            paint={snap.paint}
            path={snap.path}
            markers={snap.markers}
            players={snap.players}
            title={snap.label}
          />
          {showLabels && <span className={styles.label}>{snap.label}</span>}
        </div>
      ))}
    </div>
  )
}
