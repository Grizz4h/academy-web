import { useEffect, useId, useRef, useState } from 'react'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import styles from './MechanicGlyph.module.css'

export type MechanicKind =
  | 'paint'
  | 'path'
  | 'placement'
  | 'marker'
  | 'zone'
  | 'choice'
  | 'profile'
  | 'log'
  | 'sidequest'
  | 'generic'

type MechanicInfo = {
  label: string
  summary: string
  detail: string
}

const MECHANIC_INFO: Record<MechanicKind, MechanicInfo> = {
  paint: {
    label: 'Paint',
    summary: 'Auf dem Rink zeichnen.',
    detail: 'Du markierst Räume oder Muster mit Strichen auf dem Eis — z. B. geschützte und gefährliche Flächen.',
  },
  path: {
    label: 'Pfad',
    summary: 'Richtung mit Start und Ziel setzen.',
    detail: 'Du setzt zuerst einen Ausgangspunkt und danach einen Endpunkt. Der Pfeil zeigt die beobachtete Richtung oder Lenkung.',
  },
  placement: {
    label: 'Placement',
    summary: 'Spieler oder Struktur positionieren.',
    detail: 'Du verschiebst Bubbles auf dem Rink, um Formationen, Rollen oder defensive Strukturen abzubilden.',
  },
  marker: {
    label: 'Marker',
    summary: 'Einen einzelnen Ort setzen.',
    detail: 'Du tippst einen Punkt auf dem Eis — z. B. wo Druck entsteht oder eine Situation kippt.',
  },
  zone: {
    label: 'Zone',
    summary: 'Bereich oder Korridor wählen.',
    detail: 'Du wählst eine Zone, einen Korridor oder einen semantischen Raum auf dem Rink aus.',
  },
  choice: {
    label: 'Auswahl',
    summary: 'Aus Optionen entscheiden.',
    detail: 'Klassifikation, Diagnose oder Period-Checkin: Du wählst die passende Antwort aus vorgegebenen Optionen.',
  },
  profile: {
    label: 'Profil',
    summary: 'Muster reflektieren.',
    detail: 'Du ordnest Beobachtungen in ein Profil oder eine Reflexion ein — weniger Zeichnen, mehr Einordnung.',
  },
  log: {
    label: 'Log',
    summary: 'Ereignisse erfassen.',
    detail: 'Du protokollierst Samples, Shifts oder Events in einer Liste statt auf dem Rink.',
  },
  sidequest: {
    label: 'Sidequest',
    summary: 'Nebenaufgabe neben dem Hauptdrill.',
    detail: 'Kurze Zusatzbeobachtung (z. B. Special Teams), parallel zur laufenden Session.',
  },
  generic: {
    label: 'Drill',
    summary: 'Allgemeine Drill-Mechanik.',
    detail: 'Für diesen Drill ist keine spezielle Rink-Mechanik hinterlegt.',
  },
}

const LABELS: Record<MechanicKind, string> = Object.fromEntries(
  Object.entries(MECHANIC_INFO).map(([key, value]) => [key, value.label]),
) as Record<MechanicKind, string>

/** Map drill_type + optional config.mode to a mechanic kind. */
export function resolveMechanicKind(drillType?: string | null, mode?: string | null): MechanicKind {
  const type = String(drillType || '').toLowerCase()
  const m = String(mode || '').toLowerCase()

  if (type.includes('paintable') || m.includes('paint')) return 'paint'
  if (m.includes('directional_path') || m.includes('path_observation') || type.includes('path')) return 'path'
  if (m.includes('defensive_structure') || m.includes('formation') || m.includes('placement')) return 'placement'
  if (m.includes('single_marker') || m.includes('marker')) return 'marker'
  if (
    type.includes('zone')
    || type.includes('corridor')
    || m.includes('zone')
    || m.includes('corridor')
    || m.includes('semantic_zone')
    || m.includes('blue_line')
  ) {
    return 'zone'
  }
  if (
    type.includes('classification')
    || type.includes('period_checkin')
    || type.includes('role_identification')
    || type.includes('triangle')
    || m.includes('diagnosis')
    || m.includes('assessment')
  ) {
    return 'choice'
  }
  if (type.includes('pattern_reflection') || type.includes('meta_scan')) return 'profile'
  if (type.includes('event_log') || type.includes('sample_log') || type.includes('shift_tracker')) return 'log'
  if (type.includes('sidequest')) return 'sidequest'
  if (type.includes('rink') || type.includes('clickable') || type.includes('draggable')) return 'marker'
  return 'generic'
}

type MechanicGlyphProps = {
  kind?: MechanicKind
  drillType?: string | null
  mode?: string | null
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
  size = 'sm',
  showLabel = false,
  className,
  explainable = true,
}: MechanicGlyphProps) {
  const resolved = kind || resolveMechanicKind(drillType, mode)
  const info = MECHANIC_INFO[resolved]
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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
        ref={triggerRef}
        type="button"
        className={[styles.glyph, styles.clickable, styles[size], className].filter(Boolean).join(' ')}
        data-kind={resolved}
        aria-label={`${info.label}: Erklärung anzeigen`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((value) => !value)
        }}
      >
        <GlyphArt kind={resolved} />
        {showLabel && <span className={styles.label}>{info.label}</span>}
      </button>

      {open && (
        <AnchoredPopover
          ref={popoverRef}
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
                setOpen(false)
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

export { LABELS, MECHANIC_INFO }
