import styles from './AdjustmentChain.module.css'

type Props = {
  title?: string
  before: string
  possibleTrigger: string
  change: string
  response: string
}

export function AdjustmentChain({
  title,
  before,
  possibleTrigger,
  change,
  response,
}: Props) {
  const steps = [
    { label: 'Vorher', value: before },
    { label: 'Möglicher Trigger', value: possibleTrigger },
    { label: 'Beobachtete Veränderung', value: change },
    { label: 'Anschließende Reaktion', value: response },
  ]

  return (
    <section className={`${styles.surface} ui-flat-mobile mobile-flatten-card`}>
      {title && <h4 className={styles.header}>{title}</h4>}
      <p className={styles.hint}>
        Keine bewiesene Kausalkette — nur die beobachtete Reihenfolge im Segment.
      </p>
      <div className={styles.chain}>
        {steps.map((step, index) => (
          <div key={step.label} className={styles.step}>
            <div className={styles.rail} aria-hidden>
              <span className={styles.dot} />
              {index < steps.length - 1 && <span className={styles.line} />}
            </div>
            <div className={styles.card}>
              <p className={styles.label}>{step.label}</p>
              <p className={styles.value}>{step.value || '—'}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={styles.arrow} aria-hidden>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
