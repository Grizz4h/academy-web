import {
  DEFAULT_CHANGE_MAGNITUDE_OPTIONS,
  DEFAULT_COMPARABILITY_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  DEFAULT_DECISION_OPTIONS,
  DEFAULT_POSITIONING_OPTIONS,
  DEFAULT_PRESSURE_OPTIONS,
  DEFAULT_PRIMARY_CHANGE_OPTIONS,
  DEFAULT_SPACE_PRIORITY_OPTIONS,
  DEFAULT_STATE_FIELDS,
  labelForOption,
} from './labels'
import type {
  BeforeAfterCompareConfig,
  BeforeAfterCompareSummary,
  CompareExamplesHelp,
  CompareFieldOption,
  CompareState,
  CompareStatus,
  FieldComparison,
  StateFieldConfig,
  SuitableCompareExample,
} from './types'

const OPTION_PRESETS: Record<string, { value: string; label: string; description?: string }[]> = {
  space_priority: DEFAULT_SPACE_PRIORITY_OPTIONS,
  spacePriority: DEFAULT_SPACE_PRIORITY_OPTIONS,
  pressure: DEFAULT_PRESSURE_OPTIONS,
  pressureBehavior: DEFAULT_PRESSURE_OPTIONS,
  positioning: DEFAULT_POSITIONING_OPTIONS,
  decision: DEFAULT_DECISION_OPTIONS,
  decisionBehavior: DEFAULT_DECISION_OPTIONS,
  change_magnitude: DEFAULT_CHANGE_MAGNITUDE_OPTIONS,
  confidence: DEFAULT_CONFIDENCE_OPTIONS,
}

function mergeOptions(
  field: Partial<StateFieldConfig> & { optionsPreset?: string },
): StateFieldConfig['options'] {
  if (Array.isArray(field.options) && field.options.length > 0) {
    return field.options.map((opt) => ({
      value: String(opt.value),
      label: String(opt.label || opt.value),
      description: opt.description,
    }))
  }
  const preset = field.optionsPreset ? OPTION_PRESETS[field.optionsPreset] : OPTION_PRESETS[field.id || '']
  return preset
}

function resolveExamplesHelp(raw: Record<string, unknown>): CompareExamplesHelp | null {
  const source = (raw.comparison_examples || raw.comparisonExamples || null) as Record<string, unknown> | null
  if (!source || typeof source !== 'object') return null

  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable: SuitableCompareExample[] = suitableRaw
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || item?.text || '').trim(),
    }))
    .filter((item) => item.title && item.description)

  const unsuitableRaw = Array.isArray(source.unsuitable)
    ? source.unsuitable
    : Array.isArray(source.unsuitable_examples)
      ? source.unsuitable_examples
      : Array.isArray(source.unsuitableExamples)
        ? source.unsuitableExamples
        : []
  const unsuitable = unsuitableRaw.map((item: any) => String(item || '').trim()).filter(Boolean)

  if (suitable.length === 0 && unsuitable.length === 0) return null

  return {
    title: String(source.title || 'Beispiele für geeignete Vorher/Nachher-Situationen'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Nicht sinnvoll vergleichen'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveBeforeAfterCompareConfig(raw: Record<string, unknown> = {}): BeforeAfterCompareConfig {
  const stateFieldsRaw = Array.isArray(raw.state_fields)
    ? raw.state_fields
    : Array.isArray(raw.stateFields)
      ? raw.stateFields
      : DEFAULT_STATE_FIELDS

  const stateFields: StateFieldConfig[] = stateFieldsRaw.map((field: any) => ({
    id: String(field.id || field.key),
    label: String(field.label || field.id || field.key),
    type: field.type === 'text' ? 'text' : 'single_choice',
    options: field.type === 'text' ? undefined : mergeOptions(field),
    maxChars: field.type === 'text' ? Number(field.max_chars || field.maxChars || 500) : undefined,
    required: field.required !== false,
  }))

  return {
    mechanic: 'before_after_compare',
    beforeKey: String(raw.before_key || raw.beforeKey || 'before'),
    afterKey: String(raw.after_key || raw.afterKey || 'after'),
    stageKey: String(raw.stage_key || raw.stageKey || '__before_after_compare_stage'),
    primaryChangeKey: String(raw.primary_change_key || raw.primaryChangeKey || 'primaryChange'),
    stableDimensionsKey: String(raw.stable_dimensions_key || raw.stableDimensionsKey || 'stableDimensions'),
    changeMagnitudeKey: String(raw.change_magnitude_key || raw.changeMagnitudeKey || 'changeMagnitude'),
    changeSummaryKey: String(raw.change_summary_key || raw.changeSummaryKey || 'changeSummary'),
    confidenceKey: String(raw.confidence_key || raw.confidenceKey || 'confidence'),
    comparabilityKey: String(raw.comparability_key || raw.comparabilityKey || 'comparabilityRating'),
    comparabilityLimitKey: String(raw.comparability_limit_key || raw.comparabilityLimitKey || 'comparabilityLimit'),
    stateFields,
    requirePrimaryChange: raw.require_primary_change !== false && raw.requirePrimaryChange !== false,
    requireSummary: raw.require_summary !== false && raw.requireSummary !== false,
    requireConfidence: raw.require_confidence === true || raw.requireConfidence === true,
    requireComparability: raw.require_comparability !== false && raw.requireComparability !== false,
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 20)),
    beforeTitle: String(raw.before_title || raw.beforeTitle || 'Ausgangsbeobachtungen'),
    afterTitle: String(raw.after_title || raw.afterTitle || 'Spätere Beobachtungen'),
    compareTitle: String(raw.compare_title || raw.compareTitle || 'Vorher vs. Nachher'),
    similarSituationsHint: String(
      raw.similar_situations_hint
        || raw.similarSituationsHint
        || 'Dokumentiere Vergleichbarkeit über Spielphase, Zone, numerische Situation, Puckbesitz, Gegnerdruck, Rollen und Spielkontext.',
    ),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Beschreibe zuerst die Veränderung. Erkläre sie noch nicht. Keine klare Veränderung ist ein gültiges Ergebnis.',
    ),
    comparisonRule: String(
      raw.comparison_rule
        || raw.comparisonRule
        || 'Vergleiche dieselbe Art von Situation zu zwei verschiedenen Zeitpunkten und dokumentiere die Vergleichbarkeit.',
    ),
    examplesHelp: resolveExamplesHelp(raw),
    submitBeforeLabel: String(raw.submit_before_label || raw.submitBeforeLabel || 'Vorher erfasst → Nachher beobachten'),
    submitAfterLabel: String(raw.submit_after_label || raw.submitAfterLabel || 'Nachher erfasst → Vergleichen'),
    submitCompareLabel: String(raw.submit_compare_label || raw.submitCompareLabel || 'Vergleich abschließen'),
  }
}

export function compareFieldValues(beforeValue?: string, afterValue?: string): CompareStatus {
  const before = String(beforeValue || '').trim()
  const after = String(afterValue || '').trim()

  if (!before && !after) return 'unclear'
  if (before === 'not_relevant' && after === 'not_relevant') return 'not_relevant'
  if (before === 'not_relevant' || after === 'not_relevant') return 'unclear'
  if (before === 'unclear' || after === 'unclear' || !before || !after) return 'unclear'
  if (before === after) return 'same'
  return 'changed'
}

export function compareTextValues(beforeValue?: string, afterValue?: string): CompareStatus {
  const before = String(beforeValue || '').trim()
  const after = String(afterValue || '').trim()
  if (!before && !after) return 'unclear'
  if (!before || !after) return 'unclear'
  if (before.toLowerCase() === after.toLowerCase()) return 'same'
  return 'changed'
}

export function summarizeBeforeAfterCompare(
  cfg: BeforeAfterCompareConfig,
  before: CompareState = {},
  after: CompareState = {},
): BeforeAfterCompareSummary {
  const comparisons: FieldComparison[] = cfg.stateFields.map((field) => {
    const beforeValue = String(before[field.id] || '')
    const afterValue = String(after[field.id] || '')
    const status = field.type === 'text'
      ? compareTextValues(beforeValue, afterValue)
      : compareFieldValues(beforeValue, afterValue)

    const beforeLabel = field.type === 'text'
      ? (beforeValue.trim() || '—')
      : labelForOption(field.options || [], beforeValue)
    const afterLabel = field.type === 'text'
      ? (afterValue.trim() || '—')
      : labelForOption(field.options || [], afterValue)

    return {
      fieldId: field.id,
      label: field.label,
      beforeLabel,
      afterLabel,
      beforeValue,
      afterValue,
      status,
    }
  })

  const changedFieldIds = comparisons
    .filter((item) => item.status === 'changed')
    .map((item) => item.fieldId)
  const stableFieldIds = comparisons
    .filter((item) => item.status === 'same')
    .map((item) => item.fieldId)

  return {
    comparisons,
    changedFieldIds,
    stableFieldIds,
    hasClearChange: changedFieldIds.length > 0,
  }
}

export function isCompareStateComplete(
  state: CompareState,
  fields: StateFieldConfig[],
): boolean {
  return fields.every((field) => {
    if (field.required === false) return true
    const value = String(state[field.id] || '').trim()
    if (field.type === 'text') return value.length > 0
    return value.length > 0
  })
}

export function primaryChangeOptionsForSummary(summary: BeforeAfterCompareSummary): CompareFieldOption[] {
  const base = [
    { value: 'no_clear_change', label: 'Keine klare Veränderung erkennbar' },
    { value: 'situations_not_comparable', label: 'Situationen nicht ausreichend vergleichbar' },
    { value: 'unclear', label: 'Nicht sicher beurteilbar' },
  ]

  const changed = summary.comparisons
    .filter((item) => item.status === 'changed')
    .map((item) => ({ value: item.fieldId, label: item.label }))

  if (summary.comparisons.some((item) => item.fieldId === 'description' && item.status === 'changed')) {
    changed.push({ value: 'other', label: 'Freie Beschreibung / anderes' })
  } else if (changed.length === 0) {
    return base
  }

  return [...changed, { value: 'other', label: 'Freie Beschreibung / anderes' }, ...base]
}

export function getChangeMagnitudeOptions(): CompareFieldOption[] {
  return DEFAULT_CHANGE_MAGNITUDE_OPTIONS
}

export function getConfidenceOptions(): CompareFieldOption[] {
  return DEFAULT_CONFIDENCE_OPTIONS
}

export function getComparabilityOptions(): CompareFieldOption[] {
  return DEFAULT_COMPARABILITY_OPTIONS
}

export function getPrimaryChangeOptions(): CompareFieldOption[] {
  return DEFAULT_PRIMARY_CHANGE_OPTIONS
}

export function validateBeforeAfterCompareAnswers(
  cfg: BeforeAfterCompareConfig,
  answers: Record<string, unknown>,
): string | null {
  const before = (answers[cfg.beforeKey] || {}) as CompareState
  const after = (answers[cfg.afterKey] || {}) as CompareState

  if (!isCompareStateComplete(before, cfg.stateFields)) {
    return 'Bitte erfasse zuerst die Ausgangsbeobachtungen vollständig.'
  }
  if (!isCompareStateComplete(after, cfg.stateFields)) {
    return 'Bitte erfasse die späteren Beobachtungen vollständig.'
  }

  if (cfg.requireComparability && !answers[cfg.comparabilityKey]) {
    return 'Bitte bewerte, wie vergleichbar die Situationen waren.'
  }

  const comparability = String(answers[cfg.comparabilityKey] || '')
  if (comparability === 'partly_comparable') {
    const limit = String(answers[cfg.comparabilityLimitKey] || '').trim()
    if (!limit) {
      return 'Bei teilweise vergleichbar: bitte dokumentiere die Vergleichsgrenze.'
    }
  }

  if (cfg.requirePrimaryChange && !answers[cfg.primaryChangeKey]) {
    return 'Bitte wähle, welche Veränderung am relevantesten ist – oder dass keine klare Veränderung erkennbar ist.'
  }

  const primary = String(answers[cfg.primaryChangeKey] || '')
  const skipChangeDetail = primary === 'no_clear_change'
    || primary === 'situations_not_comparable'
    || primary === 'unclear'
    || comparability === 'not_comparable'
    || comparability === 'not_assessable'

  if (!skipChangeDetail && cfg.requireSummary) {
    const summary = String(answers[cfg.changeSummaryKey] || '').trim()
    if (!summary || summary.length < cfg.summaryMinChars) {
      return 'Bitte beschreibe die Veränderung in einem Vorher–Nachher-Satz.'
    }
  }

  if (!skipChangeDetail && !answers[cfg.changeMagnitudeKey]) {
    return 'Bitte bewerte, wie deutlich der Unterschied ist.'
  }

  if (cfg.requireConfidence && !answers[cfg.confidenceKey]) {
    return 'Bitte schätze die Sicherheit der vorläufigen Einordnung ein (subjektiv).'
  }

  return null
}
