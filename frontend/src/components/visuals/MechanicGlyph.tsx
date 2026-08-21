import type { Ref } from 'react'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { useExclusivePopover } from '../ui/useExclusivePopover'
import {
  LABELS,
  MECHANIC_INFO,
  resolveMechanicKind,
  type MechanicKind,
} from './mechanicGlyphKind'
import styles from './MechanicGlyph.module.css'

export type { MechanicKind }
export { LABELS, MECHANIC_INFO, resolveMechanicKind }

type MechanicGlyphProps = {
  kind?: MechanicKind
  drillType?: string | null
  mode?: string | null
  mechanic?: string | null
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
  /** When false, glyph is decorative only (default: true). */
  explainable?: boolean
}

function GlyphArt({ kind }: { kind: MechanicKind }) {
  switch (kind) {
    case 'paint':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <path d="M2 12 C6 4, 10 14, 14 7 S20 12, 22 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'path':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <circle cx="4" cy="12" r="2" fill="currentColor" />
          <line x1="6.5" y1="11" x2="16" y2="5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <polygon points="18,4 14.5,3.2 16.2,7" fill="currentColor" />
        </svg>
      )
    case 'placement':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <circle cx="6" cy="8" r="2.2" fill="currentColor" />
          <circle cx="12" cy="5.5" r="2.2" fill="currentColor" />
          <circle cx="18" cy="9" r="2.2" fill="currentColor" />
        </svg>
      )
    case 'marker':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="8" r="1.3" fill="currentColor" />
        </svg>
      )
    case 'zone':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <rect x="3" y="3" width="8" height="10" rx="1.5" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="1.2" />
          <rect x="13" y="5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        </svg>
      )
    case 'choice':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <rect x="2" y="3" width="9" height="4.5" rx="1.2" fill="currentColor" opacity="0.85" />
          <rect x="13" y="3" width="9" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="2" y="9.5" width="9" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="13" y="9.5" width="9" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <rect x="3" y="2.5" width="18" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="12" y1="7" x2="12" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'log':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <line x1="4" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'sidequest':
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <path d="M5 12 L12 3 L19 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="1.4" fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true" className={styles.art}>
          <rect x="4" y="3" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )
  }
}

/** Compact tactical glyph showing what a drill asks the user to do. */
export function MechanicGlyph({
  kind,
  drillType,
  mode,
  mechanic,
  size = 'sm',
  showLabel = false,
  className,
  explainable = true,
}: MechanicGlyphProps) {
  const resolved = kind || resolveMechanicKind(drillType, mode, mechanic)
  const info = MECHANIC_INFO[resolved]
  const { open, toggle, close, triggerRef, popoverRef, panelId } = useExclusivePopover()

  if (!explainable) {
    return (
      <span
        className={[styles.glyph, styles[size], className].filter(Boolean).join(' ')}
        data-kind={resolved}
        title={info.label}
        aria-label={info.label}
      >
        <GlyphArt kind={resolved} />
        {showLabel && <span className={styles.label}>{info.label}</span>}
      </span>
    )
  }

  return (
    <span className={styles.wrap}>
      <button
        ref={triggerRef as Ref<HTMLButtonElement>}
        type="button"
        className={[styles.glyph, styles.clickable, styles[size], className].filter(Boolean).join(' ')}
        data-kind={resolved}
        aria-label={`${info.label}: Erklärung anzeigen`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggle()
        }}
      >
        <GlyphArt kind={resolved} />
        {showLabel && <span className={styles.label}>{info.label}</span>}
      </button>

      {open && (
        <AnchoredPopover
          ref={popoverRef as Ref<HTMLDivElement>}
          open={open}
          anchorRef={triggerRef}
          id={panelId}
          ariaLabel={info.label}
          className={styles.popup}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.popupHeader}>
            <span className={styles.popupGlyph} data-kind={resolved} aria-hidden="true">
              <GlyphArt kind={resolved} />
            </span>
            <strong className={styles.popupTitle}>{info.label}</strong>
            <button
              type="button"
              className={styles.popupClose}
              aria-label="Schließen"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                close()
              }}
            >
              ×
            </button>
          </div>
          <p className={styles.popupSummary}>{info.summary}</p>
          <p className={styles.popupDetail}>{info.detail}</p>
        </AnchoredPopover>
      )}
    </span>
  )
}
