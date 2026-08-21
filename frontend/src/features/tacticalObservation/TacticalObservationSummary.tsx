import { optionLabel } from './tacticalLogic'
import type { LabeledOption, TacticalObservationConfig, TacticalObservationResult } from './types'
import styles from './TacticalObservationSummary.module.css'

type Props = {
  result: TacticalObservationResult
  cfg: TacticalObservationConfig
  patternLabel?: string
}

function CountList({
  title,
  options,
  counts,
}: {
  title: string
  options: LabeledOption[]
  counts: Record<string, number>
}) {
  return (
    <section className={styles.block}>
      <h3 className={styles.heading}>{title}</h3>
      <ul className={styles.list}>
        {options.map((option) => (
          <li key={option.id} className={styles.item}>
            <span>{option.summaryLabel || option.label}</span>
            <strong>{counts[option.id] || 0}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TacticalObservationSummary({ result, cfg, patternLabel }: Props) {
  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>{cfg.resultTitle}</h3>
        <p className={styles.hero}>
          {result.observationCount} {result.observationCount === 1 ? cfg.countNounSingular : cfg.countNoun}
        </p>
        {result.varietyMessage && <p className={styles.lead}>{result.varietyMessage}</p>}
      </section>

      {cfg.layers.map((layer) => (
        <CountList
          key={layer.id}
          title={layer.resultTitle}
          options={layer.options}
          counts={result.layerCounts[layer.fieldKey] || {}}
        />
      ))}

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
