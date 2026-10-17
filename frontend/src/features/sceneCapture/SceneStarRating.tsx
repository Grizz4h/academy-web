import { useState } from 'react'
import type { SceneMarker } from '../../api'

export type SceneRatingValue = 1 | 2 | 3 | 4 | 5

export type StarAppearance = 'filled' | 'outline' | 'empty'

type Props = {
  rating?: SceneMarker['rating']
  onChange: (rating: SceneRatingValue) => void
  /** Compact capture strip vs pool card */
  size?: 'sm' | 'md'
}

/**
 * After a rating click, preview stays off for the rest of the pointer/focus stay.
 * It only resumes after leave/blur and a fresh enter/focus.
 */
export function resolveEffectiveHoverRating(
  hoverRating: number | null,
  previewSuppressed: boolean,
): number | null {
  return previewSuppressed ? null : hoverRating
}

/**
 * Saved rating uses filled stars. While hovering (preview), stars 1..N are
 * outline-only — saved fills are hidden for the duration of the preview.
 */
export function resolveStarAppearance(
  starIndex: number,
  savedRating: number,
  hoverRating: number | null,
): StarAppearance {
  if (hoverRating != null) {
    return starIndex <= hoverRating ? 'outline' : 'empty'
  }
  return starIndex <= savedRating ? 'filled' : 'empty'
}

/** @deprecated Prefer resolveStarAppearance — kept for callers that only need the count. */
export function resolveDisplayedStarRating(savedRating: number, hoverRating: number | null): number {
  return hoverRating == null ? savedRating : hoverRating
}

function supportsFineHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

const STAR_STYLES: Record<StarAppearance, { glyph: string; color: string; textShadow?: string }> = {
  filled: {
    glyph: '★',
    color: '#fbbf24',
  },
  outline: {
    glyph: '☆',
    color: '#fef3c7',
    textShadow: '0 0 6px rgba(253, 224, 71, 0.55), 0 0 1px rgba(254, 243, 199, 0.9)',
  },
  empty: {
    glyph: '☆',
    color: '#475569',
  },
}

/** Same 1–5 star semantics as RingAbout / ManualSceneForm (toggle off on re-tap). */
export function SceneStarRating({ rating, onChange, size = 'md' }: Props) {
  const currentRating = rating || 0
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [previewSuppressed, setPreviewSuppressed] = useState(false)
  const effectiveHover = resolveEffectiveHoverRating(hoverRating, previewSuppressed)
  const dim = size === 'sm' ? '1.25rem' : '1.15rem'
  const fontSize = size === 'sm' ? '1.15rem' : '1rem'

  const endPointerStay = () => {
    setHoverRating(null)
    setPreviewSuppressed(false)
  }

  return (
    <div
      aria-label={currentRating ? `${currentRating} von 5 Sterne` : 'Keine Bewertung'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '0.08rem' : '0.06rem' }}
      onMouseLeave={endPointerStay}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const star = value as SceneRatingValue
        const appearance = resolveStarAppearance(star, currentRating, effectiveHover)
        const look = STAR_STYLES[appearance]
        return (
          <button
            key={star}
            type="button"
            onClick={() => {
              onChange(star)
              // Show saved fills immediately; keep preview off until leave/re-enter.
              setHoverRating(null)
              setPreviewSuppressed(true)
            }}
            onMouseEnter={() => {
              if (supportsFineHover() && !previewSuppressed) setHoverRating(star)
            }}
            onFocus={() => {
              if (supportsFineHover() && !previewSuppressed) setHoverRating(star)
            }}
            onBlur={endPointerStay}
            title={currentRating === star ? 'Bewertung entfernen' : `${star} Sterne setzen`}
            aria-label={currentRating === star ? 'Bewertung entfernen' : `${star} Sterne setzen`}
            style={{
              width: dim,
              height: dim,
              border: 'none',
              background: 'transparent',
              color: look.color,
              textShadow: look.textShadow,
              cursor: 'pointer',
              fontSize,
              lineHeight: 1,
              padding: 0,
            }}
          >
            {look.glyph}
          </button>
        )
      })}
    </div>
  )
}
