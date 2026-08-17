import {
  dimensionSegmentCount,
  dimensionValueLabel,
  evidenceDimensions,
} from './evidenceLogic'
import type { EvidenceAssessment } from './types'
import styles from './EvidenceAssessmentPanel.module.css'

type Props = {
  assessment: EvidenceAssessment
  compact?: boolean
}

export function EvidenceAssessmentPanel({ assessment, compact = false }: Props) {
  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Evidence Check</h3>
      {evidenceDimensions().map((dimension) => {
        const filled = dimensionSegmentCount(dimension.id, assessment.dimensions)
        const label = dimensionValueLabel(dimension.id, assessment.dimensions)
        return (
          <div key={dimension.id} className={styles.row}>
            <div className={styles.label}>{dimension.label}</div>
            <div className={styles.track} aria-hidden>
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`${styles.seg} ${index < filled ? styles.segOn : ''}`}
                />
              ))}
            </div>
            <div className={styles.value}>{label || '—'}</div>
          </div>
        )
      })}
      {!compact && (
        <p className={styles.note}>Keine Summe, kein Score – nur deine Einschätzung je Dimension.</p>
      )}
    </div>
  )
}
