import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { claimExclusivePopover, subscribeExclusivePopover } from '../ui/useExclusivePopover'
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
  /** Optional content centered under each D-pill (e.g. MechanicGlyph). */
  renderBeneath?: (node: TrackProgressNode, index: number) => ReactNode
  /**
   * When set, tapping a non-locked pill selects that drill in the parent loop
   * (Session Setup, Academy → Setup with ?drill=). Popover still explains status.
   */
  onSelectNode?: (node: TrackProgressNode) => void
}

const STATUS_LABEL: Record<TrackProgressNode['status'], string> = {
  completed: 'Abgeschlossen',
  current: 'Aktuell',
  available: 'Offen',
  locked: 'Gesperrt',
}

/** Compact D1 ●── D2 progression map. Status only — no invented gamification. */
export function TrackProgressMap({
  nodes,
  className,
  compact = false,
  renderBeneath,
  onSelectNode,
}: TrackProgressMapProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const exclusiveId = `${panelId}:track-map`

  useEffect(() => subscribeExclusivePopover(exclusiveId, () => setOpenId(null)), [exclusiveId])

  if (!nodes.length) return null

  return (
    <ol
      className={[
        styles.map,
        compact ? styles.compact : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-label="Drill-Progression"
    >
      {nodes.map((node, index) => {
        const name = node.title || node.label || node.id
        const short = node.label || node.id
        const open = openId === node.id
        const beneath = renderBeneath?.(node, index) ?? null
        const selectable = Boolean(onSelectNode) && node.status !== 'locked'
        return (
          <li
            key={node.id}
            className={[styles.item, index > 0 ? styles.itemWithConnector : ''].filter(Boolean).join(' ')}
            data-status={node.status}
          >
            {index > 0 && <span className={styles.connector} aria-hidden="true" />}
            <span className={styles.wrap}>
              <button
                ref={(el) => {
                  if (open) triggerRef.current = el
                }}
                type="button"
                className={styles.node}
                title={selectable ? `${name} auswählen` : name}
                aria-label={selectable ? `${name} auswählen` : `${name}: Details anzeigen`}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (selectable) onSelectNode?.(node)
                  setOpenId((current) => {
                    const next = current === node.id ? null : node.id
                    if (next) claimExclusivePopover(exclusiveId)
                    return next
                  })
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
                  preferredWidth={300}
                  onDismiss={() => setOpenId(null)}
                >
                  <div className={styles.popupHeader}>
                    <span className={styles.popupBadge} data-status={node.status} aria-hidden="true">
                      {short}
                    </span>
                    <strong className={styles.popupTitle}>{name}</strong>
                  </div>
                  <p className={styles.popupSummary}>{STATUS_LABEL[node.status]}</p>
                  {selectable ? (
                    <p className={styles.popupDetail}>
                      {node.status === 'current' ? 'Aktuell ausgewählt.' : 'Tippen wählt diesen Drill.'}
                    </p>
                  ) : node.title && node.label && node.title !== node.label ? (
                    <p className={styles.popupDetail}>Kurz: {short}</p>
                  ) : null}
                </AnchoredPopover>
              )}
            </span>
            {beneath != null ? (
              <span className={styles.beneath}>{beneath}</span>
            ) : null}
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
