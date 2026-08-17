import type { CosmeticType } from '../../features/progression/types'
import { resolveCosmeticGlyphKind, type CosmeticGlyphKind } from './cosmeticGlyphKind'
import styles from './CosmeticGlyph.module.css'

export type { CosmeticGlyphKind }
export { resolveCosmeticGlyphKind }

const KIND_LABELS: Record<CosmeticGlyphKind, string> = {
  emblem: 'Emblem',
  banner: 'Banner',
  avatar: 'Avatar',
  frame: 'Frame',
  title: 'Titel',
  tagline: 'Tagline',
  sticker: 'Sticker',
  masteryCoin: 'Mastery Coin',
  stick: 'Stick',
  puck: 'Puck',
  card: 'Karte',
  rink: 'Rink',
  generic: 'Cosmetic',
}

function GlyphArt({ kind }: { kind: CosmeticGlyphKind }) {
  switch (kind) {
    case 'emblem':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <path d="M12 3 L19 6.5 V12.5 C19 16.8 16.2 20.2 12 21.5 C7.8 20.2 5 16.8 5 12.5 V6.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        </svg>
      )
    case 'banner':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="3" y="6" width="18" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 16 L6 20 L9 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )
    case 'avatar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <circle cx="12" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 19 C6.4 15.6 8.8 13.8 12 13.8 C15.2 13.8 17.6 15.6 18.5 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'frame':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="7" width="10" height="10" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
        </svg>
      )
    case 'title':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="3.5" y="7.5" width="17" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 11.2 V16 M8 11.2 H12.2 M12.2 11.2 V16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'tagline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <path d="M6 8.2 C6 6.6 7.4 5.5 9.2 5.5 V8 C8.4 8 7.9 8.5 7.9 9.3 H10.4 V16.5 H6 Z" fill="currentColor" />
          <path d="M13.6 8.2 C13.6 6.6 15 5.5 16.8 5.5 V8 C16 8 15.5 8.5 15.5 9.3 H18 V16.5 H13.6 Z" fill="currentColor" opacity="0.72" />
        </svg>
      )
    case 'sticker':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <path d="M6.5 4.8 H14.8 L19.2 9.2 V19.2 H6.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M14.8 4.8 V9.2 H19.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="11.2" cy="13.2" r="1.15" fill="currentColor" />
        </svg>
      )
    case 'masteryCoin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
          <polygon points="12,8.2 13.1,11 16.2,11.1 13.7,13 14.6,16 12,14.4 9.4,16 10.3,13 7.8,11.1 10.9,11" fill="currentColor" />
        </svg>
      )
    case 'stick':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <path d="M6 19 L16 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M5 16.5 C7.5 20.5, 12 20.2, 14.5 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'puck':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <ellipse cx="12" cy="13.5" rx="7.5" ry="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 13.5 V11 C4.5 9.2 7.8 8 12 8 C16.2 8 19.5 9.2 19.5 11 V13.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'card':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="5" y="4" width="14" height="16" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'rink':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="3" y="7" width="18" height="10" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.art}>
          <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
  }
}

type CosmeticGlyphProps = {
  type: CosmeticType | string
  size?: 'meta' | 'sm' | 'tile' | 'lg'
  className?: string
}

/** Category mark for locker / cosmetic tiles — same visual language as MechanicGlyph. */
export function CosmeticGlyph({ type, size = 'tile', className }: CosmeticGlyphProps) {
  const kind = resolveCosmeticGlyphKind(type)
  const label = KIND_LABELS[kind]
  return (
    <span
      className={[styles.glyph, styles[size], className].filter(Boolean).join(' ')}
      data-kind={kind}
      title={label}
      aria-label={label}
    >
      <GlyphArt kind={kind} />
    </span>
  )
}

export { KIND_LABELS }
