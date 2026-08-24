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
      <div className={styles.preview} aria-label="Alternativszenarien Preview">
        <div className={styles.previewTitle}>SCENARIO BRANCHES</div>
        <div className={styles.previewLine}>Primäre Erwartung {primary} · Alternativszenario {alternative}</div>
        {trigger ? <div className={styles.previewLine}>Wenn: {trigger}</div> : null}
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Alternativszenarien</h3>
        <p className={styles.lead}>Häufig dokumentierte Verläufe – ohne Wahrscheinlichkeitszahlen oder Scores.</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Primary</h3>
        <p className={styles.hero}>{primary}</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Alternativszenario</h3>
        <p className={styles.hero}>{alternative}</p>
      </section>
      {trigger ? (
        <section className={styles.block}>
          <h3 className={styles.heading}>Wenn</h3>
          <p className={styles.pair}>{trigger}</p>
        </section>
      ) : null}
      <p className={styles.lead}>
        Alternativszenario eingetreten: {result.branchTriggeredCount} · Auslöser erkannt: {result.triggerRecognizedCount}
      </p>
    </div>
  )
}
