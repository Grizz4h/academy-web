import type { PredictionMatch } from './predictCompare'
import styles from './PredictComponents.module.css'

type Props = {
  predictedLabel: string
  actualLabel?: string
  match?: PredictionMatch | null
  predictedEyebrow?: string
  actualEyebrow?: string
}

const MATCH_COPY: Record<PredictionMatch, { className: string; text: string }> = {
  exact: { className: styles.matchExact, text: '✓ getroffen' },
  different: { className: styles.matchDifferent, text: '≠ anders gelöst' },
  unjudgeable: { className: styles.matchUnjudgeable, text: 'Nicht auswertbar' },
}

export function PredictionComparison({
  predictedLabel,
  actualLabel,
  match,
  predictedEyebrow = 'Deine Prediction',
  actualEyebrow = 'Reality',
}: Props) {
  const matchCopy = match ? MATCH_COPY[match] : null

  return (
    <div className={styles.comparison}>
      <div className={styles.comparisonGrid}>
        <div className={styles.comparisonCol}>
          <p className={styles.eyebrow}>{predictedEyebrow}</p>
          <strong>{predictedLabel}</strong>
        </div>
        <div className={styles.comparisonArrow} aria-hidden>→</div>
        <div className={styles.comparisonCol}>
          <p className={styles.eyebrow}>{actualEyebrow}</p>
          <strong>{actualLabel || '—'}</strong>
        </div>
      </div>
      {matchCopy && <p className={matchCopy.className}>{matchCopy.text}</p>}
    </div>
  )
}
