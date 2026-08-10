import {
  DEFAULT_POSSESSION_OPTIONS,
  DEFAULT_PRESSURE_OPTIONS,
  DEFAULT_SIDE_OPTIONS,
  DEFAULT_SUPPORT_OPTIONS,
  DEFAULT_TRIGGER_OPTIONS,
  DEFAULT_ZONE_OPTIONS,
  labelForOption,
} from './labels'
import type {
  ConditionDimensionId,
  ConditionDimensionSummary,
  PatternConditionSummary,
  PatternConsistency,
  PatternLogConfig,
  PatternLogObservation,
  PatternLogOption,
} from './types'

const DOTS = 4

function clampRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function ratioToDots(ratio: number): { filledDots: number; totalDots: number } {
  return {
    filledDots: Math.round(clampRatio(ratio) * DOTS),
    totalDots: DOTS,
  }
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

function readDimensionValue(
  obs: PatternLogObservation,
  dimensionId: ConditionDimensionId,
): string | null {
  if (dimensionId === 'zone') return obs.zone || null
  if (dimensionId === 'trigger') return obs.trigger || null
  if (dimensionId === 'pressureLevel') return obs.pressureLevel || null
  if (dimensionId === 'possessionState') return obs.possessionState || null
  if (dimensionId === 'supportState') {
    return obs.supportState && obs.supportState !== 'not_relevant' ? obs.supportState : null
  }
  if (dimensionId === 'side') {
    return obs.side && obs.side !== 'not_relevant' ? obs.side : null
  }
  return null
}

function optionsForDimension(
  dimensionId: ConditionDimensionId,
  config: PatternLogConfig,
): PatternLogOption<string>[] {
  if (dimensionId === 'zone') return config.zones || DEFAULT_ZONE_OPTIONS
  if (dimensionId === 'trigger') return config.triggers || DEFAULT_TRIGGER_OPTIONS
  if (dimensionId === 'pressureLevel') return config.pressure_levels || DEFAULT_PRESSURE_OPTIONS
  if (dimensionId === 'possessionState') return config.possession_states || DEFAULT_POSSESSION_OPTIONS
  if (dimensionId === 'supportState') return config.support_states || DEFAULT_SUPPORT_OPTIONS
  return config.sides || DEFAULT_SIDE_OPTIONS
}

function dimensionLabel(dimensionId: ConditionDimensionId): string {
  if (dimensionId === 'zone') return 'Zone'
  if (dimensionId === 'trigger') return 'Trigger'
  if (dimensionId === 'pressureLevel') return 'Druck'
  if (dimensionId === 'possessionState') return 'Puckkontrolle'
  if (dimensionId === 'supportState') return 'Support'
  return 'Seite'
}

function buildDimensionSummary(
  dimensionId: ConditionDimensionId,
  patternCases: PatternLogObservation[],
  counterCases: PatternLogObservation[],
  config: PatternLogConfig,
): ConditionDimensionSummary {
  const options = optionsForDimension(dimensionId, config)
  const patternValues = patternCases
    .map((obs) => readDimensionValue(obs, dimensionId))
    .filter((value): value is string => Boolean(value))
  const counterValues = counterCases
    .map((obs) => readDimensionValue(obs, dimensionId))
    .filter((value): value is string => Boolean(value))

  const patternCounts = countValues(patternValues)
  const counterCounts = countValues(counterValues)
  const patternMode = modeOf(patternCounts)
  const counterMode = modeOf(counterCounts)
  const n = patternValues.length
  const ratio = n > 0 ? patternMode.count / n : 0
  const dots = ratioToDots(ratio)
  const patternLabel = labelForOption(options, patternMode.value)
  const counterLabel = labelForOption(options, counterMode.value)

  let patternDetail = '–'
  if (n > 0 && patternMode.value) {
    patternDetail = patternMode.count === n
      ? `${patternMode.count}/${n} gleich (${patternLabel})`
      : `meist ${patternLabel} (${patternMode.count}/${n})`
  }

  let counterDetail = 'kein Gegenfall'
  if (counterValues.length > 0 && counterMode.value) {
    counterDetail = counterValues.length === 1
      ? counterLabel
      : `meist ${counterLabel} (${counterMode.count}/${counterValues.length})`
  }

  const consistency: PatternConsistency = {
    key: dimensionId,
    label: dimensionLabel(dimensionId),
    ratio: clampRatio(ratio),
    detail: patternDetail,
    filledDots: dots.filledDots,
    totalDots: dots.totalDots,
  }

  return {
    dimensionId,
    label: dimensionLabel(dimensionId),
    patternCases: patternCounts,
    counterCases: counterCounts,
    patternMode: patternMode.value,
    patternModeCount: patternMode.count,
    patternUniqueCount: Object.keys(patternCounts).length,
    patternDetail,
    counterDetail,
    differsInCounter: Boolean(
      patternMode.value
      && counterMode.value
      && patternMode.value !== counterMode.value,
    ),
    consistency,
  }
}

/**
 * Deterministic condition summary — frequency only, no causal claims.
 */
export function summarizePatternConditions(
  cases: PatternLogObservation[],
  config: PatternLogConfig = {},
): PatternConditionSummary {
  const patternCases = cases.filter((obs) => (obs.caseType || 'pattern_case') === 'pattern_case')
  const counterCases = cases.filter((obs) => obs.caseType === 'counter_case')

  const enabled: ConditionDimensionId[] = ['zone', 'trigger']
  if (config.enable_pressure !== false) enabled.push('pressureLevel')
  if (config.enable_possession !== false) enabled.push('possessionState')
  if (config.enable_support !== false) enabled.push('supportState')
  if (config.enable_side !== false) enabled.push('side')

  const dimensions = enabled.map((id) =>
    buildDimensionSummary(id, patternCases, counterCases, config),
  )

  const statements: string[] = []
  statements.push(
    `${patternCases.length} Musterfall${patternCases.length === 1 ? '' : 'e'}`
    + (counterCases.length
      ? `, ${counterCases.length} Gegenfall${counterCases.length === 1 ? '' : 'e'}`
      : ', kein Gegenfall im beobachteten Segment'),
  )

  for (const dim of dimensions) {
    if (dim.patternModeCount > 0) {
      statements.push(`${dim.label}: Musterfälle ${dim.patternDetail}.`)
    }
    if (counterCases.length > 0) {
      if (dim.differsInCounter) {
        statements.push(
          `${dim.label}: Gegenfall weicht ab (${dim.counterDetail}) — könnte relevant sein.`,
        )
      } else if (dim.counterDetail !== 'kein Gegenfall') {
        statements.push(`${dim.label}: Gegenfall ${dim.counterDetail}.`)
      }
    }
  }

  if (counterCases.length === 0) {
    statements.push(
      'Kein geeigneter Gegenfall beobachtet. Das stärkt das Muster nicht automatisch – es bedeutet nur, dass im beobachteten Segment keine passende Gegenprobe vorhanden war.',
    )
  }

  return {
    totalCount: cases.length,
    patternCaseCount: patternCases.length,
    counterCaseCount: counterCases.length,
    dimensions,
    statements,
    fingerprint: dimensions.map((dim) => dim.consistency),
  }
}

export function resolvePatternConditionConfig(config: PatternLogConfig = {}) {
  const minPatternCases = Math.max(1, Number(config.minPatternCases || config.minObservations || 3))
  const maxObservations = Math.max(minPatternCases, Number(config.maxObservations || 5))
  const maxCounterCases = Math.max(0, Number(config.maxCounterCases ?? 2))

  return {
    logsKey: config.logs_key || 'pattern_condition_cases',
    candidateKey: config.candidate_key || 'pattern_candidate',
    minPatternCases,
    maxObservations,
    maxCounterCases,
    relevantConditionsKey: config.relevant_conditions_key || 'relevant_conditions',
    counterDifferencesKey: config.counter_differences_key || 'counter_case_differences',
    counterDifferenceNoteKey: config.counter_difference_note_key || 'counter_difference_note',
    conditionAssessmentKey: config.condition_assessment_key || 'condition_assessment',
    ifThenKey: config.if_then_key || 'if_then_summary',
    draftKey: config.draft_key || '__pattern_condition_draft',
    editIndexKey: config.edit_index_key || '__pattern_condition_edit_index',
    enableSide: config.enable_side !== false,
    enablePressure: config.enable_pressure !== false,
    enablePossession: config.enable_possession !== false,
    enableSupport: config.enable_support !== false,
    enableCounterCases: config.enable_counter_cases !== false,
    requireCandidateFirst: config.require_candidate_first !== false,
    submitLabel: config.submit_label || 'Fall speichern',
    addMoreLabel: config.add_more_label || '+ Weiteren Fall',
    observeHint:
      config.observe_hint
      || 'Erfasse eine Situation, in der das Verhalten auftritt – oder einen Gegenfall.',
    decisionRule:
      config.decision_rule
      || 'Eine Bedingung ist interessanter, wenn sie bei mehreren Musterfällen gleich bleibt – und bei einem Gegenfall gerade nicht.',
    summaryTitle: config.summary_title || 'Geprüftes Muster',
    fingerprintTitle: config.fingerprint_title || 'Condition Fingerprint',
    zones: config.zones || DEFAULT_ZONE_OPTIONS,
    triggers: config.triggers || DEFAULT_TRIGGER_OPTIONS,
    sides: config.sides || DEFAULT_SIDE_OPTIONS,
    pressureLevels: config.pressure_levels || DEFAULT_PRESSURE_OPTIONS,
    possessionStates: config.possession_states || DEFAULT_POSSESSION_OPTIONS,
    supportStates: config.support_states || DEFAULT_SUPPORT_OPTIONS,
  }
}

export { labelForOption }
