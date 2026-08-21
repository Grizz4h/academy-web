import { optionLabel } from './relationLogic'
import type { PlayerRelationConfig, PlayerRelationResult } from './types'
import styles from './PlayerRelationSummary.module.css'

type Props = {
  result: PlayerRelationResult
  cfg: PlayerRelationConfig
  patternLabel?: string
}

export function PlayerRelationSummary({ result, cfg, patternLabel }: Props) {
  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.resultTitle}</h3>
        <p className={styles.hero}>
          {result.observationCount} {result.observationCount === 1 ? cfg.countNounSingular : cfg.countNoun}
        </p>
        <ul className={styles.list}>
          {cfg.relationOptions.map((option) => (
            <li key={option.id} className={styles.item}>
              <span>{option.summaryLabel || option.label}</span>
              <strong>{result.relationCounts[option.id] || 0}</strong>
            </li>
          ))}
        </ul>
        {result.relationVariety && <p className={styles.lead}>{result.relationVariety}</p>}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.positionsTitle}</h3>
        <ul className={styles.list}>
          {cfg.positionOptions.map((option) => (
            <li key={option.id} className={styles.item}>
              <span>{option.summaryLabel || option.label}</span>
              <strong>{result.positionCounts[option.id] || 0}</strong>
            </li>
          ))}
        </ul>
      </section>

      {patternLabel && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Auffällig</h3>
          <p className={styles.line}>{optionLabel(cfg.patternOptions, patternLabel) || patternLabel}</p>
        </section>
      )}

      {cfg.handoffText && <p className={styles.handoff}>{cfg.handoffText}</p>}
    </div>
  )
}
