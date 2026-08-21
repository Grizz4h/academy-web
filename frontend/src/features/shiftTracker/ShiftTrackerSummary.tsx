import { optionLabel } from './shiftLogic'
import type { ShiftTrackerConfig, ShiftTrackerResult } from './types'
import styles from './ShiftTrackerSummary.module.css'

type Props = {
  result: ShiftTrackerResult
  cfg: ShiftTrackerConfig
  patternLabel?: string
}

export function ShiftTrackerSummary({ result, cfg, patternLabel }: Props) {
  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.resultTitle}</h3>
        <p className={styles.hero}>
          {result.observationCount} {result.observationCount === 1 ? cfg.countNounSingular : cfg.countNoun}
        </p>
        <p className={styles.lead}>POSITION</p>
        <ul className={styles.list}>
          {cfg.positionOptions.map((option) => (
            <li key={option.id} className={styles.item}>
              <span>{option.summaryLabel || option.label}</span>
              <strong>{result.positionCounts[option.id] || 0}</strong>
            </li>
          ))}
        </ul>
      </section>

      {cfg.showFunctionField && cfg.functionOptions.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>{cfg.functionsTitle}</h3>
          <ul className={styles.list}>
            {cfg.functionOptions.map((option) => (
              <li key={option.id} className={styles.item}>
                <span>{option.summaryLabel || option.label}</span>
                <strong>{result.functionCounts[option.id] || 0}</strong>
              </li>
            ))}
          </ul>
          {result.functionVariety && <p className={styles.lead}>{result.functionVariety}</p>}
        </section>
      )}

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
