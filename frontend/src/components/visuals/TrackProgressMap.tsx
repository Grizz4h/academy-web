import { useEffect, useId, useRef, useState } from 'react'
import { AnchoredPopover } from '../ui/AnchoredPopover'
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

const STATUS_LABEL: Record<TrackProgressNode['status'], string> = {
  completed: 'Abgeschlossen',
  current: 'Aktuell',
  available: 'Offen',
  locked: 'Gesperrt',
}

/** Compact D1 ●── D2 progression map. Status only — no invented gamification. */
export function TrackProgressMap({ nodes, className, compact = false }: TrackProgressMapProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!openId) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpenId(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openId])

  if (!nodes.length) return null

  return (
    <ol
      className={[styles.map, compact ? styles.compact : '', className].filter(Boolean).join(' ')}
      aria-label="Drill-Progression"
    >
      {nodes.map((node, index) => {
        const name = node.title || node.label || node.id
        const short = node.label || node.id
        const open = openId === node.id
        return (
          <li key={node.id} className={styles.item} data-status={node.status}>
            {index > 0 && <span className={styles.connector} aria-hidden="true" />}
            <span className={styles.wrap}>
              <button
                ref={(node) => {
                  if (open) triggerRef.current = node
                }}
                type="button"
                className={styles.node}
                title={name}
                aria-label={`${name}: Details anzeigen`}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpenId((current) => (current === node.id ? null : node.id))
                }}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{short}</span>
              </button>

              {open && (
                <AnchoredPopover
                  ref={popoverRef}
                  open={open}
                  anchorRef={triggerRef}
                  id={panelId}
                  ariaLabel={name}
                  className={styles.popup}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.popupHeader}>
                    <span className={styles.popupBadge} data-status={node.status} aria-hidden="true">
                      {short}
                    </span>
                    <strong className={styles.popupTitle}>{name}</strong>
                    <button
                      type="button"
                      className={styles.popupClose}
                      aria-label="Schließen"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setOpenId(null)
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <p className={styles.popupSummary}>{STATUS_LABEL[node.status]}</p>
                  {node.title && node.label && node.title !== node.label ? (
                    <p className={styles.popupDetail}>Kurz: {short}</p>
                  ) : null}
                </AnchoredPopover>
              )}
            </span>
          </li>
        )
      })}
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
