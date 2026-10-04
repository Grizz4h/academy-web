import type { SceneMarker } from '../../api'

export type SceneRatingValue = 1 | 2 | 3 | 4 | 5

type Props = {
  rating?: SceneMarker['rating']
  onChange: (rating: SceneRatingValue) => void
  /** Compact capture strip vs pool card */
  size?: 'sm' | 'md'
}

/** Same 1–5 star semantics as RingAbout / ManualSceneForm (toggle off on re-tap). */
export function SceneStarRating({ rating, onChange, size = 'md' }: Props) {
  const currentRating = rating || 0
  const dim = size === 'sm' ? '1.25rem' : '1.15rem'
  const fontSize = size === 'sm' ? '1.15rem' : '1rem'

  return (
    <div
      aria-label={currentRating ? `${currentRating} von 5 Sterne` : 'Keine Bewertung'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.08rem' }}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const star = value as SceneRatingValue
        const active = star <= currentRating
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
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
