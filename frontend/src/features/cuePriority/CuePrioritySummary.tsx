import { OutcomeDistribution } from '../opportunityRate/OutcomeDistribution'
import type { OutcomeDistributionItem } from '../opportunityRate/types'
import { cueReviewToneLabel } from './cueLogic'
import type { CuePriorityResult } from './types'
import styles from './CuePrioritySummary.module.css'

type Props = {
  result: CuePriorityResult
  compact?: boolean
  categoryLabel?: (category: string) => string
}

function distributionItems(map: Record<string, number>, labelFor: (id: string) => string): OutcomeDistributionItem[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({
      id,
      label: labelFor(id),
      count,
      isTarget: false,
      isUnclear: id === 'other',
    }))
}

export function CuePrioritySummary({
  result,
  compact = false,
  categoryLabel = (category) => category,
}: Props) {
  const primaryItems = distributionItems(result.primaryCueDistribution, categoryLabel)
  const supportingItems = distributionItems(result.supportingCueDistribution, categoryLabel)
  const secondaryItems = distributionItems(result.secondaryCueDistribution, categoryLabel)
  const topPrimary = primaryItems[0]

  if (compact) {
    return (
      <div className={styles.preview} aria-label="Cue Priority Preview">
        <div className={styles.previewTitle}>CUE PROFILE</div>
        <div className={styles.previewLine}>
          Entscheidend {topPrimary ? `${topPrimary.label} ${topPrimary.count}` : '—'}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Cue Profile</h3>
        <p className={styles.lead}>Deine wichtigsten Hinweise — deskriptiv, ohne Score.</p>
      </section>

      {primaryItems.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Entscheidend</h3>
          <OutcomeDistribution items={primaryItems} total={primaryItems.reduce((sum, item) => sum + item.count, 0)} />
        </section>
      )}

      {supportingItems.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Unterstützend</h3>
          <OutcomeDistribution items={supportingItems} total={supportingItems.reduce((sum, item) => sum + item.count, 0)} />
        </section>
      )}

      {secondaryItems.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Nebensächlich</h3>
          <OutcomeDistribution items={secondaryItems} total={secondaryItems.reduce((sum, item) => sum + item.count, 0)} />
        </section>
      )}

      {result.reviewTones.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Nachträglicher Check</h3>
          <p className={styles.lead}>Welche Hinweise haben deine Reads tatsächlich getragen?</p>
          <ul className={styles.toneList}>
            {result.reviewTones.map((item) => (
              <li key={item.category} className={styles.toneRow}>
                <span>{categoryLabel(item.category)}</span>
                <strong>{cueReviewToneLabel(item.tone)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
