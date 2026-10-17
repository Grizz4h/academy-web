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
 * Outline preview while hovering a star, except while the pointer stays on the
 * star that was just clicked (confirmation → filled stars).
 * Moving to a different star ends confirmation and resumes outline preview.
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

/** Marker under the saved rating star during outline preview only. */
export function shouldShowSavedRatingMarker(
  starIndex: number,
  savedRating: number,
  effectiveHover: number | null,
): boolean {
  return effectiveHover != null && savedRating >= 1 && starIndex === savedRating
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
    // Moving to another star ends the post-click confirmation and resumes preview.
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
        const showSavedMarker = shouldShowSavedRatingMarker(star, currentRating, effectiveHover)
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
              position: 'relative',
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
            {showSavedMarker ? (
              <span
                aria-hidden="true"
                title={`Gespeichert: ${currentRating} Sterne`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '-0.18rem',
                  width: '0.28rem',
                  height: '0.28rem',
                  borderRadius: '999px',
                  background: 'rgba(125, 211, 252, 0.9)',
                  boxShadow: '0 0 4px rgba(125, 211, 252, 0.45)',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
