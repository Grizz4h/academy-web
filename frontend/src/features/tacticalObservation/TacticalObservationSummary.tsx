import { optionLabel, traitFieldKey } from './tacticalLogic'
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
  const traits = cfg.dependentTraitLayer
  const parentLayer = traits
    ? cfg.layers.find((layer) => layer.id === traits.parentLayerId)
    : undefined

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

      {traits && parentLayer && (
        <section className={styles.block}>
          <h3 className={styles.heading}>{traits.resultTitle}</h3>
          <ul className={styles.list}>
            {traits.activeParentIds.map((parentId) => {
              const roleLabel = optionLabel(parentLayer.options, parentId)
              const key = traitFieldKey(traits.fieldKeyPrefix, parentId)
              const counts = result.layerCounts[key] || {}
              const parts = traits.options
                .filter((option) => (counts[option.id] || 0) > 0)
                .map((option) => `${option.summaryLabel || option.label} (${counts[option.id]})`)
              if (!parts.length) return null
              return (
                <li key={parentId} className={styles.item}>
                  <span>{roleLabel}</span>
                  <strong style={{ fontWeight: 550, textAlign: 'right' }}>{parts.join(', ')}</strong>
                </li>
              )
            })}
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
