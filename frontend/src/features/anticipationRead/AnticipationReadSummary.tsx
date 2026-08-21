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
    { id: 'matched', label: 'Getroffen', count: result.outcomeMatchDistribution.matched, isTarget: false, isUnclear: false },
    { id: 'partly_matched', label: 'Teilweise', count: result.outcomeMatchDistribution.partlyMatched, isTarget: false, isUnclear: false },
    { id: 'different', label: 'Anders', count: result.outcomeMatchDistribution.different, isTarget: false, isUnclear: true },
  ]
}

function qualityItems(result: AnticipationReadResult): OutcomeDistributionItem[] {
  return [
    { id: 'well_supported', label: 'Gut gestützt', count: result.readQualityDistribution.wellSupported, isTarget: true, isUnclear: false },
    { id: 'partly_supported', label: 'Teilweise', count: result.readQualityDistribution.partlySupported, isTarget: false, isUnclear: false },
    { id: 'weakly_supported', label: 'Schwach', count: result.readQualityDistribution.weaklySupported, isTarget: false, isUnclear: false },
    { id: 'unclear', label: 'Unklar', count: result.readQualityDistribution.unclear, isTarget: false, isUnclear: true },
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
      <div className={styles.preview} aria-label="Anticipation Read Preview">
        <div className={styles.previewTitle}>{result.totalReads} READS</div>
        <div className={styles.previewLine}>
          Match ✓ {match.matched} · ~ {match.partlyMatched} · × {match.different}
        </div>
        <div className={styles.previewLine}>Read Quality {wellDots || '—'}</div>
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
        <h3 className={styles.heading}>Deine Reads</h3>
        <p className={styles.hero}>{result.totalReads} Situationen</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Tatsächlicher Match</h3>
        <OutcomeDistribution items={matchItems(result)} total={result.totalReads} />
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Qualität deiner Reads</h3>
        <OutcomeDistribution items={qualityItems(result)} total={result.totalReads} />
      </section>

      {result.cuePriority ? (
        <CuePrioritySummary result={result.cuePriority} categoryLabel={categoryLabel} />
      ) : cues.length > 0 ? (
        <section className={styles.block}>
          <h3 className={styles.heading}>Welche Cue-Arten hast du genutzt?</h3>
          <OutcomeDistribution items={cues} total={cues.reduce((sum, item) => sum + item.count, 0)} />
        </section>
      ) : null}

      {result.scenarioBranches ? (
        <ScenarioBranchSummary result={result.scenarioBranches} />
      ) : null}

      {result.predictionUpdates ? (
        <PredictionUpdateSummary result={result.predictionUpdates} />
      ) : null}

      {result.highConfidenceDifferentCount > 0 && (
        <p className={styles.insight}>
          Interessanter Read: Hohe Sicherheit, tatsächliche Aktion anders.
        </p>
      )}
    </div>
  )
}

export function formatReadPreviewLine(result: AnticipationReadResult): string {
  return `${result.totalReads} Reads · ${outcomeMatchLabel('matched')} ${result.outcomeMatchDistribution.matched} · ${readQualityLabel('well_supported')} ${result.readQualityDistribution.wellSupported}`
}
