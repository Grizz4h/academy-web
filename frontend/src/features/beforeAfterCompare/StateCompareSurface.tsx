import { compareStatusLabel, compareStatusSymbol } from './labels'
import type { FieldComparison } from './types'
import styles from './StateCompareSurface.module.css'

type Props = {
  title?: string
  comparisons: FieldComparison[]
  showFingerprint?: boolean
}

export function StateCompareSurface({
  title = 'Vorher → Nachher',
  comparisons,
  showFingerprint = true,
}: Props) {
  return (
    <section className={`${styles.compareSurface} ui-flat-mobile mobile-flatten-card`}>
      <div>
        <h4 className={styles.header}>{title}</h4>
        <p className={styles.hint}>
          Rein deskriptiv: Was ist gleich, was unterscheidet sich? Keine automatische Adjustment-Behauptung.
        </p>
      </div>

      {showFingerprint && (
        <div className={styles.fingerprint} aria-label="Change fingerprint">
          {comparisons.map((item) => (
            <span key={`fp-${item.fieldId}`} className={styles.fingerprintItem}>
              <span
                className={`${styles.dot} ${item.status === 'changed' ? styles.dotChanged : ''}`}
                aria-hidden
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {comparisons.map((item) => (
        <article
          key={item.fieldId}
          className={`${styles.row} ${item.status === 'changed' ? styles.rowChanged : ''}`}
        >
          <div className={styles.rowLabel}>{item.label}</div>
          <div className={styles.values}>
            <div className={styles.valueLine}>
              <span className={styles.phaseTag}>Vorher</span>
              <span>{item.beforeLabel}</span>
            </div>
            <div className={styles.valueLine}>
              <span className={styles.arrow} aria-hidden>
                {compareStatusSymbol(item.status)}
              </span>
            </div>
            <div className={styles.valueLine}>
              <span className={styles.phaseTag}>Nachher</span>
              <span>{item.afterLabel}</span>
            </div>
          </div>
          <div className={styles.status}>{compareStatusLabel(item.status)}</div>
        </article>
      ))}
    </section>
  )
}
