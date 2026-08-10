import {
  DEFAULT_ATTRIBUTION_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  DEFAULT_FREQUENCY_OPTIONS,
  DEFAULT_PRIMARY_CONDITION_OPTIONS,
  DEFAULT_STABLE_CORE_OPTIONS,
  DEFAULT_TENDENCY_VARIATION_OPTIONS,
  labelForOption,
} from './labels'
import type {
  AttributionConfidence,
  PatternAttribution,
  PatternLogConfig,
  TendencyEntry,
  TendencyProfileSummary,
} from './types'

export function frequencyToSampleDots(frequency: string | undefined): number {
  switch (frequency) {
    case 'two':
      return 2
    case 'three':
      return 3
    case 'four':
      return 4
    case 'five_plus':
      return 5
    default:
      return 0
  }
}

export function isTendencyComplete(entry: TendencyEntry | null | undefined): boolean {
  if (!entry) return false
  return Boolean(
    String(entry.summary || '').trim()
    && entry.frequency
    && entry.primaryCondition
    && Array.isArray(entry.stableCore)
    && entry.stableCore.length > 0
    && Array.isArray(entry.allowedVariation)
    && entry.allowedVariation.length > 0
    && entry.attribution
    && entry.confidence
    && String(entry.strongestEvidence || '').trim(),
  )
}

/**
 * Descriptive synthesis only — never invents a team truth score.
 */
export function summarizeTendencyProfile(
  tendencies: TendencyEntry[],
  _config: PatternLogConfig = {},
): TendencyProfileSummary {
  const rows: TendencyProfileSummary['rows'] = tendencies.map((entry) => ({
    id: entry.id,
    summary: String(entry.summary || '').trim() || 'Unbenannte Tendenz',
    frequencyLabel: labelForOption(DEFAULT_FREQUENCY_OPTIONS, entry.frequency),
    sampleDots: frequencyToSampleDots(entry.frequency || undefined),
    sampleTotal: 5,
    confidence: (entry.confidence || '') as AttributionConfidence | '',
    attribution: (entry.attribution || '') as PatternAttribution | '',
    attributionLabel: labelForOption(DEFAULT_ATTRIBUTION_OPTIONS, entry.attribution),
    confidenceLabel: labelForOption(DEFAULT_CONFIDENCE_OPTIONS, entry.confidence),
  }))

  const statements = [
    `${tendencies.length} Tendenz${tendencies.length === 1 ? '' : 'en'} im beobachteten Segment dokumentiert.`,
  ]

  const highConf = tendencies.filter((t) => t.confidence === 'high').length
  if (highConf > 0) {
    statements.push(`${highConf} mit hoher Confidence.`)
  }

  const thin = tendencies.filter(
    (t) => t.attribution === 'insufficient_evidence' || t.confidence === 'low',
  ).length
  if (thin > 0) {
    statements.push(`${thin} eher vorsichtig / dünn belegt.`)
  }

  return {
    tendencyCount: tendencies.length,
    statements,
    rows,
  }
}

export function resolveTendencyProfileConfig(config: PatternLogConfig = {}) {
  const minTendencies = Math.max(1, Number(config.minTendencies || 1))
  const maxTendencies = Math.max(minTendencies, Number(config.maxTendencies || 3))
  return {
    tendenciesKey: config.tendencies_key || 'tendency_entries',
    segmentSummaryKey: config.segment_summary_key || 'segment_summary',
    strongestTendencyKey: config.strongest_tendency_key || 'strongest_tendency_id',
    nextWatchKey: config.next_watch_key || 'next_watch_tendency_id',
    falsificationNoteKey: config.falsification_note_key || 'falsification_note',
    draftKey: config.draft_key || '__tendency_profile_draft',
    editIndexKey: config.edit_index_key || '__tendency_profile_edit_index',
    minTendencies,
    maxTendencies,
    requireSegmentSummary: config.require_segment_summary !== false,
    requireStrongestTendency: config.require_strongest_tendency !== false,
    requireNextWatch: config.require_next_watch !== false,
    submitLabel: config.submit_label || 'Tendenz speichern',
    addMoreLabel: config.add_more_label || '+ Tendenz hinzufügen',
    observeHint:
      config.observe_hint
      || 'Priorisiere wenige belastbare Tendenzen — nicht alles, was mehrfach passiert.',
    decisionRule:
      config.decision_rule
      || 'Nicht alles, was mehrfach passiert, gehört automatisch ins Tendenzprofil.',
    summaryTitle: config.summary_title || 'Tendenzprofil · beobachtetes Segment',
    frequencyOptions: config.frequency_options || DEFAULT_FREQUENCY_OPTIONS,
    primaryConditionOptions: config.primary_condition_options || DEFAULT_PRIMARY_CONDITION_OPTIONS,
    stableCoreOptions: config.stable_core_options || DEFAULT_STABLE_CORE_OPTIONS,
    variationOptions: config.tendency_variation_options || DEFAULT_TENDENCY_VARIATION_OPTIONS,
    attributionOptions: config.attribution_options || DEFAULT_ATTRIBUTION_OPTIONS,
    confidenceOptions: config.confidence_options || DEFAULT_CONFIDENCE_OPTIONS,
  }
}

export { labelForOption }
