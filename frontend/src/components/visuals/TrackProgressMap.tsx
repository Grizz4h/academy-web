import styles from './TrackProgressMap.module.css'

export type TrackProgressNode = {
  id: string
  label?: string
  /** completed | current | available | locked */
  status: 'completed' | 'current' | 'available' | 'locked'
  title?: string
}

type TrackProgressMapProps = {
  nodes: TrackProgressNode[]
  className?: string
  compact?: boolean
}

/** Compact D1 ●── D2 progression map. Status only — no invented gamification. */
export function TrackProgressMap({ nodes, className, compact = false }: TrackProgressMapProps) {
  if (!nodes.length) return null

  return (
    <ol
      className={[styles.map, compact ? styles.compact : '', className].filter(Boolean).join(' ')}
      aria-label="Drill-Progression"
    >
      {nodes.map((node, index) => (
        <li key={node.id} className={styles.item} data-status={node.status}>
          {index > 0 && <span className={styles.connector} aria-hidden="true" />}
          <span
            className={styles.node}
            title={node.title || node.label || node.id}
            aria-label={`${node.label || node.id}: ${node.status}`}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{node.label || node.id}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function buildDrillProgressNodes(
  drills: Array<{ id: string; title?: string }>,
  options?: {
    completedIds?: Iterable<string>
    currentId?: string | null
    /** When true, unfinished drills after the first incomplete become locked. */
    sequential?: boolean
  },
): TrackProgressNode[] {
  const completed = new Set(options?.completedIds || [])
  const currentId = options?.currentId || null
  const sequential = options?.sequential === true
  let sawIncomplete = false

  return drills.map((drill) => {
    const short = drill.id.includes('_') ? drill.id.split('_').slice(-1)[0] : drill.id
    if (completed.has(drill.id)) {
      return { id: drill.id, label: short, status: 'completed' as const, title: drill.title }
    }
    if (currentId && drill.id === currentId) {
      sawIncomplete = true
      return { id: drill.id, label: short, status: 'current' as const, title: drill.title }
    }
    if (sequential && sawIncomplete) {
      return { id: drill.id, label: short, status: 'locked' as const, title: drill.title }
    }
    sawIncomplete = true
    return { id: drill.id, label: short, status: 'available' as const, title: drill.title }
  })
}
