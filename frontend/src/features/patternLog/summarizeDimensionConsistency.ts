import {
  DEFAULT_ACTOR_ROLE_OPTIONS,
  DEFAULT_SEQUENCE_SIMILARITY_OPTIONS,
  DEFAULT_SIDE_OPTIONS,
  DEFAULT_TARGET_EFFECT_OPTIONS,
  DEFAULT_TRIGGER_OPTIONS,
  DEFAULT_ZONE_OPTIONS,
  INVARIANT_DIMENSION_LABELS,
  labelForOption,
} from './labels'
import type {
  DimensionConsistencySummary,
  InvariantDimensionId,
  PatternConsistency,
  PatternInvariantSummary,
  PatternLogConfig,
  PatternLogObservation,
  PatternLogOption,
  StructuredConsistency,
} from './types'

const DOTS = 4
const DEFAULT_DIMENSIONS: InvariantDimensionId[] = [
  'zone',
  'trigger',
  'primaryAction',
  'targetEffect',
  'actorRole',
  'side',
  'sequenceSimilarity',
]

function clampRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function countValues(values: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const value of values) {
    if (!value) continue
    out[value] = (out[value] || 0) + 1
  }
  return out
}

function modeOf(counts: Record<string, number>): { value: string | null; count: number } {
  let best: string | null = null
  let bestCount = 0
  for (const [value, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return { value: best, count: bestCount }
}

function classifyStructured(n: number, modeCount: number, uniqueCount: number): StructuredConsistency {
  if (n < 2) return 'insufficient_data'
  if (uniqueCount <= 1 && modeCount === n) return 'constant'
  if (modeCount / n >= 2 / 3) return 'mostly_constant'
  return 'variable'
}

function consistencyLabel(value: StructuredConsistency): string {
  if (value === 'constant') return 'konstant'
  if (value === 'mostly_constant') return 'meist konstant'
  if (value === 'variable') return 'variabel'
  if (value === 'user_judged') return 'Nutzerentscheidung'
  return 'zu wenig Daten'
}

function optionsFor(
  dimensionId: InvariantDimensionId,
  config: PatternLogConfig,
): PatternLogOption<string>[] | null {
  if (dimensionId === 'zone') return config.zones || DEFAULT_ZONE_OPTIONS
  if (dimensionId === 'trigger') return config.triggers || DEFAULT_TRIGGER_OPTIONS
  if (dimensionId === 'targetEffect') return config.target_effects || DEFAULT_TARGET_EFFECT_OPTIONS
  if (dimensionId === 'actorRole') return config.actor_roles || DEFAULT_ACTOR_ROLE_OPTIONS
  if (dimensionId === 'side') return config.sides || DEFAULT_SIDE_OPTIONS
  if (dimensionId === 'sequenceSimilarity') {
    return config.sequence_similarities || DEFAULT_SEQUENCE_SIMILARITY_OPTIONS
  }
  return null
}

function readRaw(
  obs: PatternLogObservation,
  dimensionId: InvariantDimensionId,
): string | null {
  if (dimensionId === 'zone') return obs.zone || null
  if (dimensionId === 'trigger') return obs.trigger || null
  if (dimensionId === 'primaryAction') {
    const text = String(obs.primaryAction || '').trim()
    return text || null
  }
  if (dimensionId === 'targetEffect') {
    return obs.targetEffect && obs.targetEffect !== 'not_relevant' ? obs.targetEffect : null
  }
  if (dimensionId === 'actorRole') {
    return obs.actorRole && obs.actorRole !== 'not_relevant' ? obs.actorRole : null
  }
  if (dimensionId === 'side') {
    return obs.side && obs.side !== 'not_relevant' ? obs.side : null
  }
  return obs.sequenceSimilarity || null
}

/**
 * Deterministic consistency for structured dimensions.
 * Free-text dimensions are never NLP-classified.
 */
export function summarizeDimensionConsistency(
  observations: PatternLogObservation[],
  config: PatternLogConfig = {},
): PatternInvariantSummary {
  const dimensions = (config.invariant_dimensions || DEFAULT_DIMENSIONS).map((dimensionId) => {
    const isFreeText = dimensionId === 'primaryAction'
    const options = optionsFor(dimensionId, config)
    const rawValues = observations
      .map((obs) => readRaw(obs, dimensionId))
      .filter((value): value is string => Boolean(value))
    const counts = countValues(rawValues)
    const mode = modeOf(counts)
    const uniqueCount = Object.keys(counts).length
    const n = rawValues.length
    const consistency: StructuredConsistency = isFreeText
      ? 'user_judged'
      : classifyStructured(n, mode.count, uniqueCount)
    const displayValues = rawValues.map((value) => (
      options ? labelForOption(options, value) : value
    ))
    const modeLabel = mode.value
      ? (options ? labelForOption(options, mode.value) : mode.value)
      : null

    let detail = '–'
    if (isFreeText) {
      detail = n > 0
        ? `${n} Freitext-Einträge · Ähnlichkeit beurteilt der Nutzer`
        : 'noch keine Einträge'
    } else if (n > 0 && modeLabel) {
      detail = mode.count === n
        ? `${mode.count}/${n} gleich (${modeLabel})`
        : `meist ${modeLabel} (${mode.count}/${n}) · ${uniqueCount} Varianten`
    }

    const ratio = n > 0 ? mode.count / n : 0
    const fingerprint: PatternConsistency = {
      key: dimensionId,
      label: INVARIANT_DIMENSION_LABELS[dimensionId],
      ratio: isFreeText ? 0 : clampRatio(ratio),
      detail: `${detail} · ${consistencyLabel(consistency)}`,
      filledDots: isFreeText ? 0 : Math.round(clampRatio(ratio) * DOTS),
      totalDots: DOTS,
    }

    return {
      dimensionId,
      label: INVARIANT_DIMENSION_LABELS[dimensionId],
      values: rawValues,
      displayValues,
      counts,
      uniqueCount,
      modeValue: mode.value,
      modeCount: mode.count,
      detail,
      consistency,
      isFreeText,
      fingerprint,
    } satisfies DimensionConsistencySummary
  })

  const statements: string[] = [`${observations.length} Beobachtungen erfasst.`]
  for (const dim of dimensions) {
    if (dim.isFreeText) {
      statements.push(`${dim.label}: Freitext – keine automatische Semantik-Klassifikation.`)
      continue
    }
    if (dim.modeCount > 0) {
      statements.push(`${dim.label}: ${dim.detail} (${consistencyLabel(dim.consistency)}).`)
    }
  }

  return {
    observationCount: observations.length,
    dimensions,
    statements,
    fingerprint: dimensions.map((dim) => dim.fingerprint),
  }
}

export function resolvePatternInvariantConfig(config: PatternLogConfig = {}) {
  const minObservations = Math.max(1, Number(config.minObservations || 3))
  const maxObservations = Math.max(minObservations, Number(config.maxObservations || 5))
  return {
    logsKey: config.logs_key || 'pattern_invariant_observations',
    candidateKey: config.candidate_key || 'pattern_candidate',
    minObservations,
    maxObservations,
    dimensionAssessmentsKey: config.dimension_assessments_key || 'dimension_assessments',
    invariantSummaryKey: config.invariant_summary_key || 'invariant_summary',
    allowedVariationKey: config.allowed_variation_key || 'allowed_variation',
    flexibilityKey: config.flexibility_key || 'flexibility_assessment',
    primaryActionEqualityKey: config.primary_action_equality_key || 'primary_action_equality',
    draftKey: config.draft_key || '__pattern_invariant_draft',
    editIndexKey: config.edit_index_key || '__pattern_invariant_edit_index',
    enableSide: config.enable_side !== false,
    requireCandidateFirst: config.require_candidate_first !== false,
    submitLabel: config.submit_label || 'Beobachtung speichern',
    addMoreLabel: config.add_more_label || '+ Weitere Beobachtung',
    observeHint:
      config.observe_hint
      || 'Erfasse eine Situation und zerlege sie in stabile vs. variable Merkmale.',
    decisionRule:
      config.decision_rule
      || 'Suche nicht nach identischen Bildern. Suche nach einem stabilen funktionalen Kern.',
    summaryTitle: config.summary_title || 'Funktionaler Kern',
    fingerprintTitle: config.fingerprint_title || 'Invariant Fingerprint',
    dimensions: config.invariant_dimensions || DEFAULT_DIMENSIONS,
    zones: config.zones || DEFAULT_ZONE_OPTIONS,
    triggers: config.triggers || DEFAULT_TRIGGER_OPTIONS,
    sides: config.sides || DEFAULT_SIDE_OPTIONS,
    targetEffects: config.target_effects || DEFAULT_TARGET_EFFECT_OPTIONS,
    actorRoles: config.actor_roles || DEFAULT_ACTOR_ROLE_OPTIONS,
    sequenceSimilarities: config.sequence_similarities || DEFAULT_SEQUENCE_SIMILARITY_OPTIONS,
  }
}

export { labelForOption }
