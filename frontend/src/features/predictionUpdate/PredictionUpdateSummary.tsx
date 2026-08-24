import { OutcomeDistribution } from '../opportunityRate/OutcomeDistribution'
import type { OutcomeDistributionItem } from '../opportunityRate/types'
import { UPDATE_QUALITY_LABELS } from './updateLogic'
import type { PredictionUpdateResult } from './types'
import styles from './PredictionUpdateSummary.module.css'

type Props = {
  result: PredictionUpdateResult
  compact?: boolean
}

function qualityItems(result: PredictionUpdateResult): OutcomeDistributionItem[] {
  const dist = result.updateQualityDistribution
  return [
    { id: 'appropriate', label: UPDATE_QUALITY_LABELS.appropriate, count: dist.appropriate, isTarget: true, isUnclear: false },
    { id: 'after_confirmation', label: UPDATE_QUALITY_LABELS.after_confirmation, count: dist.afterConfirmation || 0, isTarget: false, isUnclear: false },
    { id: 'too_late', label: UPDATE_QUALITY_LABELS.too_late, count: dist.tooLate, isTarget: false, isUnclear: false },
    { id: 'too_early', label: UPDATE_QUALITY_LABELS.too_early, count: dist.tooEarly, isTarget: false, isUnclear: false },
    { id: 'not_updated', label: UPDATE_QUALITY_LABELS.not_updated, count: dist.notUpdated || 0, isTarget: false, isUnclear: false },
    { id: 'unclear', label: UPDATE_QUALITY_LABELS.unclear, count: dist.unclear, isTarget: false, isUnclear: true },
  ]
}

export function PredictionUpdateSummary({ result, compact = false }: Props) {
  const triggers = Object.entries(result.commonUpdateTriggers || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  if (compact) {
    return (
      <div className={styles.preview} aria-label="Aktualisierungen Preview">
        <div className={styles.previewTitle}>AKTUALISIERUNGEN</div>
        <div className={styles.previewLine}>
          Beibehalten {result.keepCount} · Geändert {result.changeCount}
        </div>
        <div className={styles.previewLine}>
          Bei neuer Info {result.updateQualityDistribution.appropriate}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Erwartung aktualisieren</h3>
        <p className={styles.hero}>{result.totalUpdates} Situationen</p>
        <p className={styles.lead}>Kein Accuracy-Score – nur, ob du den Read behalten oder angepasst hast.</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Read behalten</h3>
        <p className={styles.pair}>{result.keepCount}</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Read geändert</h3>
        <p className={styles.pair}>{result.changeCount}</p>
      </section>
      <section className={styles.block}>
        <h3 className={styles.heading}>Timing der Aktualisierung</h3>
        <OutcomeDistribution items={qualityItems(result)} total={result.totalUpdates} />
      </section>
      {triggers.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Dokumentierte Aktualisierungsauslöser</h3>
          <ul className={styles.triggers}>
            {triggers.slice(0, 6).map(([label, count]) => (
              <li key={label} className={styles.triggerRow}>
                <span>{label}</span>
                <strong>{count}×</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
