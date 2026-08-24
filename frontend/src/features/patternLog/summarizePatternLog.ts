import {
  DEFAULT_ASSESSMENT_OPTIONS,
  DEFAULT_CONTEXT_TAG_OPTIONS,
  DEFAULT_SIDE_OPTIONS,
  DEFAULT_SIMILARITY_OPTIONS,
  DEFAULT_TRIGGER_OPTIONS,
  DEFAULT_ZONE_OPTIONS,
  labelForOption,
} from './labels'
import type {
  PatternConsistency,
  PatternLogConfig,
  PatternLogObservation,
  PatternLogSummary,
  PatternSimilarity,
  PatternTrigger,
  PatternZone,
} from './types'

const DOTS = 4

function clampRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function ratioToDots(ratio: number, total = DOTS): { filledDots: number; totalDots: number } {
  const filled = Math.round(clampRatio(ratio) * total)
  return { filledDots: filled, totalDots: total }
}

function modeCount<T extends string>(values: T[]): { value: T | null; count: number } {
  if (!values.length) return { value: null, count: 0 }
  const counts = new Map<T, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  let best: T | null = null
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return { value: best, count: bestCount }
}

function buildConsistency(
  key: string,
  label: string,
  ratio: number,
  detail: string,
): PatternConsistency {
  const dots = ratioToDots(ratio)
  return {
    key,
    label,
    ratio: clampRatio(ratio),
    detail,
    filledDots: dots.filledDots,
    totalDots: dots.totalDots,
  }
}

function similarityHitCount(
  observations: PatternLogObservation[],
  key: PatternSimilarity,
): number {
  let count = 0
  for (const obs of observations) {
    if (Array.isArray(obs.similarities) && obs.similarities.includes(key)) count += 1
  }
  return count
}

/**
 * Deterministic, descriptive summary only — no tactical interpretation.
 */
export function summarizePatternLog(
  observations: PatternLogObservation[],
  config: PatternLogConfig = {},
): PatternLogSummary {
  const zoneOptions = config.zones || DEFAULT_ZONE_OPTIONS
  const triggerOptions = config.triggers || DEFAULT_TRIGGER_OPTIONS
  const sideOptions = config.sides || DEFAULT_SIDE_OPTIONS
  const similarityOptions = config.similarities || DEFAULT_SIMILARITY_OPTIONS

  const n = observations.length
  const zones = observations.map((obs) => obs.zone).filter(Boolean) as PatternZone[]
  const triggers = observations.map((obs) => obs.trigger).filter(Boolean) as PatternTrigger[]
  const sides = observations
    .map((obs) => obs.side)
    .filter((side): side is NonNullable<typeof side> => Boolean(side) && side !== 'not_relevant')

  const zoneMode = modeCount(zones)
  const triggerMode = modeCount(triggers)
  const sideMode = modeCount(sides)

  const comparePool = Math.max(0, n - 1)
  const reactionHits = similarityHitCount(observations, 'same_team_reaction')
  const sequenceHits = similarityHitCount(observations, 'similar_sequence')
  const outcomeHits = similarityHitCount(observations, 'only_outcome_similar')

  const zoneRatio = n > 0 ? zoneMode.count / n : 0
  const triggerRatio = n > 0 ? triggerMode.count / n : 0
  const reactionRatio = comparePool > 0 ? reactionHits / comparePool : 0
  const sideRatio = sides.length > 0 ? sideMode.count / sides.length : 0
  const sequenceRatio = comparePool > 0 ? sequenceHits / comparePool : 0

  const zoneLabel = labelForOption(zoneOptions, zoneMode.value)
  const triggerLabel = labelForOption(triggerOptions, triggerMode.value)
  const sideLabel = labelForOption(sideOptions, sideMode.value)

  const similarityCounts: Record<string, number> = {}
  for (const opt of similarityOptions) {
    similarityCounts[opt.value] = similarityHitCount(observations, opt.value)
  }

  const statements: string[] = []
  if (n > 0) {
    statements.push(`${n} von ${n} Beobachtungen erfasst.`)
  }
  if (n > 0 && zoneMode.value) {
    statements.push(`${zoneMode.count} von ${n} Beobachtungen fanden in der ${zoneLabel} statt.`)
  }
  if (n > 0 && triggerMode.value) {
    if (triggerMode.count === n) {
      statements.push(`${triggerMode.count} von ${n} hatten denselben Trigger (${triggerLabel}).`)
    } else {
      statements.push(`Häufigster Trigger: ${triggerLabel} (${triggerMode.count} von ${n}).`)
    }
  }
  if (comparePool > 0) {
    statements.push(
      `Bei ${reactionHits} von ${comparePool} Folgebeobachtungen wurde die Teamreaktion als ähnlich markiert.`,
    )
    if (sequenceHits > 0) {
      statements.push(
        `Bei ${sequenceHits} von ${comparePool} Folgebeobachtungen wurde ein ähnlicher Ablauf markiert.`,
      )
    }
    if (outcomeHits > 0) {
      statements.push(
        `Bei ${outcomeHits} von ${comparePool} wurde „nur das Ergebnis ist ähnlich“ gewählt.`,
      )
    }
  }
  if (sides.length >= 2 && sideMode.value) {
    if (sideMode.count === sides.length) {
      statements.push(`Die Seite blieb konsistent (${sideLabel}).`)
    } else {
      statements.push(`Die Seite wechselte häufig (häufigste: ${sideLabel}).`)
    }
  }

  return {
    observationCount: n,
    zoneConsistency: buildConsistency(
      'zone',
      'Zone',
      zoneRatio,
      n > 0 && zoneMode.value ? `${zoneMode.count} / ${n} ${zoneLabel}` : '–',
    ),
    triggerConsistency: buildConsistency(
      'trigger',
      'Trigger',
      triggerRatio,
      n > 0 && triggerMode.value ? `${triggerMode.count} / ${n} ${triggerLabel}` : '–',
    ),
    reactionSimilarity: buildConsistency(
      'reaction',
      'Reaktion',
      reactionRatio,
      comparePool > 0 ? `${reactionHits} / ${comparePool} ähnlich markiert` : 'noch kein Vergleich',
    ),
    sideConsistency: buildConsistency(
      'side',
      'Seite',
      sideRatio,
      sides.length > 0 && sideMode.value
        ? `${sideMode.count} / ${sides.length} ${sideLabel}`
        : 'nicht bewertet',
    ),
    sequenceSimilarity: buildConsistency(
      'sequence',
      'Ablauf',
      sequenceRatio,
      comparePool > 0 ? `${sequenceHits} / ${comparePool} ähnlich markiert` : 'noch kein Vergleich',
    ),
    similarityCounts,
    statements,
    dominantZone: zoneMode.value,
    dominantTrigger: triggerMode.value,
    onlyOutcomeHeavy: comparePool > 0 && outcomeHits >= Math.ceil(comparePool / 2),
  }
}

export function resolvePatternLogConfig(config: PatternLogConfig = {}) {
  const minObservations = Math.max(1, Number(config.minObservations || 3))
  const maxObservations = Math.max(minObservations, Number(config.maxObservations || 5))
  return {
    logsKey: config.logs_key || 'pattern_observations',
    minObservations,
    maxObservations,
    assessmentKey: config.assessment_key || 'pattern_assessment',
    summaryKey: config.summary_key || 'pattern_summary',
    labelKey: config.label_key || 'pattern_label',
    draftKey: config.draft_key || '__pattern_log_draft',
    editIndexKey: config.edit_index_key || '__pattern_log_edit_index',
    enableSide: config.enable_side !== false,
    enableContextTags: config.enable_context_tags === true,
    enableMidLabel: config.enable_mid_label !== false,
    submitLabel: config.submit_label || 'Beobachtung speichern',
    addMoreLabel: config.add_more_label || '+ Weitere Beobachtung',
    finishLabel: config.finish_label || 'Muster einschätzen',
    observeHint:
      config.observe_hint
      || 'Sobald du eine mögliche Situation siehst, erfasse sie.',
    searchNextHint:
      config.search_next_hint
      || 'Suche jetzt nach einer weiteren Situation, die diesem Verhalten ähnelt.',
    outcomeSimilarityHint:
      config.outcome_similarity_hint
      || 'Ein ähnliches Ergebnis bedeutet noch nicht automatisch, dass dasselbe Muster dahintersteckt.',
    decisionRule:
      config.decision_rule
      || 'Wenn nur das Ergebnis ähnlich ist, aber der Weg dorthin unterschiedlich war, behandle es noch nicht als Muster.',
    summaryTitle: config.summary_title || 'Hinweis auf eine mögliche Tendenz',
    fingerprintTitle: config.fingerprint_title || 'Vergleichsmerkmale',
    zones: config.zones || DEFAULT_ZONE_OPTIONS,
    triggers: config.triggers || DEFAULT_TRIGGER_OPTIONS,
    sides: config.sides || DEFAULT_SIDE_OPTIONS,
    similarities: config.similarities || DEFAULT_SIMILARITY_OPTIONS,
    contextTags: config.context_tags || DEFAULT_CONTEXT_TAG_OPTIONS,
    assessments: config.assessments || DEFAULT_ASSESSMENT_OPTIONS,
    summaryDimensions: config.summary_dimensions || ['zone', 'trigger', 'reaction', 'side', 'sequence'],
  }
}

export { labelForOption }
