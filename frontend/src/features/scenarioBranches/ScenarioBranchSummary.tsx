import { mostFrequentValue } from './branchLogic'
import type { ScenarioBranchResult } from './types'
import styles from './ScenarioBranchSummary.module.css'

type Props = {
  result: ScenarioBranchResult
  compact?: boolean
}

export function ScenarioBranchSummary({ result, compact = false }: Props) {
  const primary = result.primaryActions[0] || '—'
  const alternative = result.alternativeActions[0] || '—'
  const trigger = mostFrequentValue(result.commonTriggerPatterns)

  if (compact) {
    return (
      <div className={styles.preview} aria-label="Scenario Branches Preview">
        <div className={styles.previewTitle}>SCENARIO BRANCHES</div>
        <div className={styles.previewLine}>Primary {primary} · Alternative {alternative}</div>
        {trigger ? <div className={styles.previewLine}>Wenn: {trigger}</div> : null}
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Scenario Branches</h3>
        <p className={styles.lead}>Deine häufigsten Reads – ohne Wahrscheinlichkeitszahlen.</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Primary</h3>
        <p className={styles.hero}>{primary}</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Alternative</h3>
        <p className={styles.hero}>{alternative}</p>
      </section>
      {trigger ? (
        <section className={styles.block}>
          <h3 className={styles.heading}>Wenn</h3>
          <p className={styles.pair}>{trigger}</p>
        </section>
      ) : null}
      <p className={styles.lead}>
        Alternative eingetreten: {result.branchTriggeredCount} · Trigger erkannt: {result.triggerRecognizedCount}
      </p>
    </div>
  )
}
