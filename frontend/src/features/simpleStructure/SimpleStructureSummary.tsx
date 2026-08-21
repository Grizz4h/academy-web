import { optionLabel } from './structureLogic'
import type { SimpleStructureConfig, SimpleStructureResult } from './types'
import styles from './SimpleStructureSummary.module.css'

type Props = {
  result: SimpleStructureResult
  cfg: SimpleStructureConfig
  patternLabel?: string
}

export function SimpleStructureSummary({ result, cfg, patternLabel }: Props) {
  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.resultTitle}</h3>
        <p className={styles.hero}>
          {result.observationCount} {result.observationCount === 1 ? cfg.countNounSingular : cfg.countNoun}
        </p>
        <ul className={styles.list}>
          {cfg.structureOptions.map((option) => (
            <li key={option.id} className={styles.item}>
              <span>{option.summaryLabel || option.label}</span>
              <strong>{result.structureCounts[option.id] || 0}</strong>
            </li>
          ))}
        </ul>
        {result.structureVariety && <p className={styles.lead}>{result.structureVariety}</p>}
      </section>

      {cfg.trackRecap.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>{cfg.trackRecapTitle || 'Lernweg'}</h3>
          {cfg.trackRecapLead && <p className={styles.lead}>{cfg.trackRecapLead}</p>}
          {!cfg.trackRecapLead && (
            <p className={styles.lead}>
              Du hast deinen Blick von einem einzelnen Spieler auf mehrere miteinander verbundene Spieler erweitert.
            </p>
          )}
          <ul className={styles.recap}>
            {cfg.trackRecap.map((step) => (
              <li key={step.id} className={styles.recapItem}>✓ {step.label}</li>
            ))}
          </ul>
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
