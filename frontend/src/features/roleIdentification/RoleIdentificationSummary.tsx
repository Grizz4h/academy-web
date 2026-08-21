import {
  optionLabel,
  rankedHintEntries,
} from './roleLogic'
import type { RoleIdentificationConfig, RoleIdentificationResult } from './types'
import styles from './RoleIdentificationSummary.module.css'

type Props = {
  result: RoleIdentificationResult
  cfg: RoleIdentificationConfig
}

export function RoleIdentificationSummary({ result, cfg }: Props) {
  const hintRows = rankedHintEntries(result.hintCounts)

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.resultTitle}</h3>
        <p className={styles.hero}>
          {result.observationCount} {result.observationCount === 1 ? 'Beobachtung' : 'Beobachtungen'}
        </p>
        <ul className={styles.list}>
          {cfg.foundOptions.map((option) => (
            <li key={option.id} className={styles.item}>
              <span>{option.summaryLabel || option.label}</span>
              <strong>{result.foundCounts[option.id as keyof typeof result.foundCounts] || 0}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Deine Suchanker</h3>
        {hintRows.length ? (
          <ul className={styles.list}>
            {hintRows.map(([id, count]) => (
              <li key={id} className={styles.item}>
                <span>{optionLabel(cfg.hintOptions, id)}</span>
                <strong>{count}×</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.lead}>Noch keine Suchanker ausgewählt.</p>
        )}
      </section>

      {cfg.handoffText && <p className={styles.handoff}>{cfg.handoffText}</p>}
    </div>
  )
}
