import { useState } from 'react'
import type { SceneMarker } from '../../api'

export type SceneRatingValue = 1 | 2 | 3 | 4 | 5

export type StarAppearance = 'filled' | 'outline' | 'dimmed' | 'target' | 'empty'

type Props = {
  rating?: SceneMarker['rating']
  onChange: (rating: SceneRatingValue) => void
  /** Compact capture strip vs pool card */
  size?: 'sm' | 'md'
}

/**
 * Outline/dim preview while hovering, except while the pointer stays on the
 * star that was just clicked (confirmation → filled stars).
 * Moving to a different star ends confirmation and resumes preview.
 */
export function resolveEffectiveHoverRating(
  hoverRating: number | null,
  confirmedStar: number | null,
): number | null {
  if (hoverRating == null) return null
  if (confirmedStar != null && hoverRating === confirmedStar) return null
  return hoverRating
}

/**
 * Idle: filled up to saved.
 * Hover higher: saved stays filled; saved+1..hover are soft outlines.
 * Hover lower: 1..hover filled (target highlighted); hover+1..saved dimmed.
 */
export function resolveStarAppearance(
  starIndex: number,
  savedRating: number,
  hoverRating: number | null,
): StarAppearance {
  if (hoverRating == null) {
    return starIndex <= savedRating ? 'filled' : 'empty'
  }

  if (hoverRating > savedRating) {
    if (starIndex <= savedRating) return 'filled'
    if (starIndex <= hoverRating) return 'outline'
    return 'empty'
  }

  if (hoverRating < savedRating) {
    if (starIndex < hoverRating) return 'filled'
    if (starIndex === hoverRating) return 'target'
    if (starIndex <= savedRating) return 'dimmed'
    return 'empty'
  }

  // hover === saved: keep fills, lightly mark the hovered star
  if (starIndex < hoverRating) return 'filled'
  if (starIndex === hoverRating) return 'target'
  return 'empty'
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
    textShadow: '0 0 6px rgba(253, 224, 71, 0.45), 0 0 1px rgba(254, 243, 199, 0.85)',
  },
  dimmed: {
    glyph: '★',
    color: 'rgba(148, 163, 184, 0.42)',
  },
  target: {
    glyph: '★',
    color: '#fde68a',
    textShadow: '0 0 5px rgba(254, 243, 199, 0.55), 0 0 1px rgba(253, 224, 71, 0.9)',
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
  const [confirmedStar, setConfirmedStar] = useState<number | null>(null)
  const effectiveHover = resolveEffectiveHoverRating(hoverRating, confirmedStar)
  const dim = size === 'sm' ? '1.25rem' : '1.15rem'
  const fontSize = size === 'sm' ? '1.15rem' : '1rem'

  const endPointerStay = () => {
    setHoverRating(null)
    setConfirmedStar(null)
  }

  const beginHoverOnStar = (star: SceneRatingValue) => {
    if (!supportsFineHover()) return
    setHoverRating(star)
    if (confirmedStar != null && star !== confirmedStar) {
      setConfirmedStar(null)
    }
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
              setHoverRating(star)
              setConfirmedStar(star)
            }}
            onMouseEnter={() => beginHoverOnStar(star)}
            onFocus={() => beginHoverOnStar(star)}
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
