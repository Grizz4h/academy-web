import { useState } from 'react'
import type { SceneMarker } from '../../api'

export type SceneRatingValue = 1 | 2 | 3 | 4 | 5

type Props = {
  rating?: SceneMarker['rating']
  onChange: (rating: SceneRatingValue) => void
  /** Compact capture strip vs pool card */
  size?: 'sm' | 'md'
}

/** Displayed fill while hovering — never mutates the saved rating. */
export function resolveDisplayedStarRating(savedRating: number, hoverRating: number | null): number {
  return hoverRating == null ? savedRating : hoverRating
}

function supportsFineHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/** Same 1–5 star semantics as RingAbout / ManualSceneForm (toggle off on re-tap). */
export function SceneStarRating({ rating, onChange, size = 'md' }: Props) {
  const currentRating = rating || 0
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const displayRating = resolveDisplayedStarRating(currentRating, hoverRating)
  const dim = size === 'sm' ? '1.25rem' : '1.15rem'
  const fontSize = size === 'sm' ? '1.15rem' : '1rem'

  return (
    <div
      aria-label={currentRating ? `${currentRating} von 5 Sterne` : 'Keine Bewertung'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '0.08rem' : '0.06rem' }}
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const star = value as SceneRatingValue
        const active = star <= displayRating
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => {
              if (supportsFineHover()) setHoverRating(star)
            }}
            onFocus={() => {
              // Keyboard focus shows the same temporary preview as mouse hover.
              if (supportsFineHover()) setHoverRating(star)
            }}
            onBlur={() => setHoverRating(null)}
            title={currentRating === star ? 'Bewertung entfernen' : `${star} Sterne setzen`}
            aria-label={currentRating === star ? 'Bewertung entfernen' : `${star} Sterne setzen`}
            style={{
              width: dim,
              height: dim,
              border: 'none',
              background: 'transparent',
              color: active ? '#fbbf24' : '#475569',
              cursor: 'pointer',
              fontSize,
              lineHeight: 1,
              padding: 0,
            }}
          >
            {active ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
