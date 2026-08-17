import { formatRateFraction } from '../opportunityRate/rateLogic'
import { OutcomeDistribution } from '../opportunityRate/OutcomeDistribution'
import type { CohortGroupResult } from './types'
import styles from './CohortRateComparison.module.css'

type Props = {
  title?: string
  groupA: CohortGroupResult
  groupB: CohortGroupResult
  percentagePointDifference: number
  sampleImbalance?: boolean
  showPercents?: boolean
  showDistributions?: boolean
}

function CohortBar({ group, showPercents }: { group: CohortGroupResult; showPercents: boolean }) {
  return (
    <div className={styles.cohort}>
      <div className={styles.cohortLabel}>{group.label || `Gruppe ${group.id}`}</div>
      <div className={styles.figures}>
        <span className={styles.fraction}>
          {formatRateFraction(group.targetCount, group.totalOpportunities)}
        </span>
        {showPercents && <span className={styles.percent}>{group.ratePercent} %</span>}
      </div>
      <div className={styles.track} aria-hidden>
        <div className={styles.fill} style={{ width: `${Math.min(100, Math.max(0, group.ratePercent))}%` }} />
      </div>
      {group.unclearCount > 0 && (
        <p className={styles.unclear}>{group.unclearCount} Outcome unklar – bleibt im Nenner.</p>
      )}
    </div>
  )
}

export function CohortRateComparison({
  title,
  groupA,
  groupB,
  percentagePointDifference,
  sampleImbalance = false,
  showPercents = true,
  showDistributions = false,
}: Props) {
  const absDiff = Math.abs(percentagePointDifference)

  return (
    <div className={styles.root}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.grid}>
        <CohortBar group={groupA} showPercents={showPercents} />
        <CohortBar group={groupB} showPercents={showPercents} />
      </div>
      {showPercents && (
        <p className={styles.diff}>
          Unterschied: {absDiff} Prozentpunkt{absDiff === 1 ? '' : 'e'}
          {showPercents ? ` · ${groupA.ratePercent} % vs. ${groupB.ratePercent} %` : ''}
        </p>
      )}
      {sampleImbalance && (
        <p className={styles.imbalance}>Die Gruppen sind unterschiedlich groß.</p>
      )}
      {showDistributions && (
        <div className={styles.distributions}>
          <details className={styles.details}>
            <summary>Verteilung {groupA.label || 'Gruppe A'}</summary>
            <OutcomeDistribution items={groupA.distributionItems} total={groupA.totalOpportunities} compact />
          </details>
          <details className={styles.details}>
            <summary>Verteilung {groupB.label || 'Gruppe B'}</summary>
            <OutcomeDistribution items={groupB.distributionItems} total={groupB.totalOpportunities} compact />
          </details>
        </div>
      )}
    </div>
  )
}
