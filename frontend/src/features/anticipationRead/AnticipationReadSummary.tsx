import { OutcomeDistribution } from '../opportunityRate/OutcomeDistribution'
import type { OutcomeDistributionItem } from '../opportunityRate/types'
import {
  cueCategoryLabel,
  outcomeMatchLabel,
  readQualityLabel,
} from './readLogic'
import type { AnticipationReadResult } from './types'
import { CuePrioritySummary } from '../cuePriority/CuePrioritySummary'
import { ScenarioBranchSummary } from '../scenarioBranches/ScenarioBranchSummary'
import { PredictionUpdateSummary } from '../predictionUpdate/PredictionUpdateSummary'
import styles from './AnticipationReadSummary.module.css'

type Props = {
  result: AnticipationReadResult
  compact?: boolean
  categoryLabel?: (category: string) => string
}

function matchItems(result: AnticipationReadResult): OutcomeDistributionItem[] {
  return [
    { id: 'matched', label: 'Stimmt überein', count: result.outcomeMatchDistribution.matched, isTarget: false, isUnclear: false },
    { id: 'partly_matched', label: 'Teilweise (Legacy)', count: result.outcomeMatchDistribution.partlyMatched, isTarget: false, isUnclear: false },
    { id: 'different', label: 'Stimmt nicht überein', count: result.outcomeMatchDistribution.different, isTarget: false, isUnclear: false },
    { id: 'unclear', label: 'Nicht sicher', count: result.outcomeMatchDistribution.unclear || 0, isTarget: false, isUnclear: true },
  ]
}

function qualityItems(result: AnticipationReadResult): OutcomeDistributionItem[] {
  return [
    { id: 'well_supported', label: 'Durch Hinweise begründet', count: result.readQualityDistribution.wellSupported, isTarget: true, isUnclear: false },
    { id: 'partly_supported', label: 'Zu allgemein', count: result.readQualityDistribution.partlySupported, isTarget: false, isUnclear: false },
    { id: 'weakly_supported', label: 'Hinweis fehlte', count: result.readQualityDistribution.weaklySupported, isTarget: false, isUnclear: false },
    { id: 'unclear', label: 'Nicht sicher', count: result.readQualityDistribution.unclear, isTarget: false, isUnclear: true },
  ]
}

function cueItems(result: AnticipationReadResult): OutcomeDistributionItem[] {
  return Object.entries(result.cueCategoryCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({
      id,
      label: cueCategoryLabel(id),
      count,
      isTarget: false,
      isUnclear: id === 'other',
    }))
}

export function AnticipationReadSummary({ result, compact = false, categoryLabel = cueCategoryLabel }: Props) {
  const match = result.outcomeMatchDistribution
  const quality = result.readQualityDistribution
  const wellDots = '●'.repeat(quality.wellSupported) + '○'.repeat(Math.max(0, result.totalReads - quality.wellSupported))

  if (compact) {
    return (
      <div className={styles.preview} aria-label="Antizipations-Zusammenfassung">
        <div className={styles.previewTitle}>{result.totalReads} Erwartungen</div>
        <div className={styles.previewLine}>
          Übereinstimmung ✓ {match.matched} · Legacy ~ {match.partlyMatched} · × {match.different}
          {(match.unclear || 0) > 0 ? ` · ? ${match.unclear}` : ''}
        </div>
        <div className={styles.previewLine}>Begründung {wellDots || '—'}</div>
        {result.cuePriority && (
          <CuePrioritySummary result={result.cuePriority} compact categoryLabel={categoryLabel} />
        )}
        {result.scenarioBranches && (
          <ScenarioBranchSummary result={result.scenarioBranches} compact />
        )}
        {result.predictionUpdates && (
          <PredictionUpdateSummary result={result.predictionUpdates} compact />
        )}
      </div>
    )
  }

  const cues = cueItems(result)

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Deine dokumentierten Erwartungen</h3>
        <p className={styles.hero}>{result.totalReads}</p>
        <p className={styles.lead}>
          Übereinstimmung und Begründung der ursprünglichen Hinweise sind getrennt.
          Eine Übereinstimmung beweist keine hohe Qualität; eine Abweichung beweist keine schlechte Antizipation.
        </p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Übereinstimmung</h3>
        <OutcomeDistribution items={matchItems(result)} total={result.totalReads} />
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Merkmale der ursprünglichen Begründung</h3>
        <OutcomeDistribution items={qualityItems(result)} total={result.totalReads} />
      </section>

      {cues.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Hinweisarten</h3>
          <OutcomeDistribution items={cues} total={result.totalReads} />
        </section>
      )}

      {result.cuePriority && (
        <CuePrioritySummary result={result.cuePriority} categoryLabel={categoryLabel} />
      )}
      {result.scenarioBranches && (
        <ScenarioBranchSummary result={result.scenarioBranches} />
      )}
      {result.predictionUpdates && (
        <PredictionUpdateSummary result={result.predictionUpdates} />
      )}
    </div>
  )
}

export function anticipationReadPreviewLabel(result: AnticipationReadResult): string {
  return `${result.totalReads} Erwartungen · ${outcomeMatchLabel('matched')} ${result.outcomeMatchDistribution.matched} · ${readQualityLabel('well_supported')} ${result.readQualityDistribution.wellSupported}`
}
