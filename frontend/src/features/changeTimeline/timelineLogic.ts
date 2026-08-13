import {
  ASSESSMENT_OPTIONS,
  CHANGE_POINT_NONE_OPTIONS,
  COMPARABILITY_OPTIONS,
  DEFAULT_CHANGE_MAGNITUDE_OPTIONS,
  DIMENSION_OPTIONS,
  RELATION_OPTIONS,
  STABILITY_OPTIONS,
  STABLE_DIMENSION_OPTIONS,
  isDeviationRelation,
  labelForOption,
} from './labels'
import type {
  ChangePointEvidence,
  ChangeTimelineConfig,
  ChangeTimelineDraft,
  ChangeTimelineObservation,
} from './types'

export function emptyTimelineDraft(): ChangeTimelineDraft {
  return {
    period: '',
    gameClock: '',
    relationToBaseline: '',
    changedDimension: '',
    description: '',
  }
}

export function resolveChangeTimelineConfig(raw: Record<string, unknown> = {}): ChangeTimelineConfig {
  const minObservations = Math.max(2, Number(raw.minObservations || raw.min_observations || 4))
  const maxObservations = Math.max(minObservations, Number(raw.maxObservations || raw.max_observations || 6))

  return {
    mechanic: 'change_timeline',
    minObservations,
    maxObservations,
    logsKey: String(raw.logs_key || raw.logsKey || 'change_timeline_observations'),
    draftKey: String(raw.draft_key || raw.draftKey || '__change_timeline_draft'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__change_timeline_edit_index'),
    addingMoreKey: String(raw.adding_more_key || raw.addingMoreKey || '__change_timeline_adding_more'),
    focusKey: String(raw.focus_key || raw.focusKey || 'observationFocus'),
    baselineKey: String(raw.baseline_key || raw.baselineKey || 'baselineDescription'),
    baselineAfterCount: Math.max(1, Number(raw.baseline_after_count || raw.baselineAfterCount || 2)),
    changePointKey: String(raw.change_point_key || raw.changePointKey || 'candidateChangePointId'),
    stabilityKey: String(raw.stability_key || raw.stabilityKey || 'postChangeStability'),
    comparabilityKey: String(raw.comparability_key || raw.comparabilityKey || 'comparability'),
    changeMagnitudeKey: String(raw.change_magnitude_key || raw.changeMagnitudeKey || 'changeMagnitude'),
    assessmentKey: String(raw.assessment_key || raw.assessmentKey || 'assessment'),
    summaryKey: String(raw.summary_key || raw.summaryKey || 'changeSummary'),
    stableDimensionsKey: String(raw.stable_dimensions_key || raw.stableDimensionsKey || 'stableDimensions'),
    supportsGameClock: raw.supports_game_clock !== false && raw.supportsGameClock !== false,
    requireChangePoint: raw.require_change_point !== false && raw.requireChangePoint !== false,
    requireComparability: raw.require_comparability !== false && raw.requireComparability !== false,
    requireMagnitude: raw.require_magnitude !== false && raw.requireMagnitude !== false,
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 20)),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Ein Change Point braucht ein Vorher und ein Danach. Eine Abweichung wird erst interessant, wenn sie sich wiederholt.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Eine neue Aktion ist noch kein neuer Zustand. Erst wenn das veränderte Verhalten erneut auftaucht oder bestehen bleibt, wird ein Adjustment-Hinweis stärker.',
    ),
  }
}

export function createObservationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function canSaveTimelineDraft(
  draft: ChangeTimelineDraft,
  supportsGameClock: boolean,
): boolean {
  const hasRelation = Boolean(draft.relationToBaseline)
  const hasDescription = String(draft.description || '').trim().length > 0
  const needsDimension = isDeviationRelation(draft.relationToBaseline)
  const hasDimension = !needsDimension || Boolean(draft.changedDimension)
  if (supportsGameClock && draft.gameClock && !/^\d{1,2}(:\d{1,2})?$/.test(draft.gameClock.trim())) {
    return false
  }
  return hasRelation && hasDescription && hasDimension
}

export function buildChangePointOptions(observations: ChangeTimelineObservation[]) {
  const observationOptions = observations.map((obs, index) => ({
    value: obs.id,
    label: `Ab Beobachtung ${index + 1}`,
    description: `${labelForOption(RELATION_OPTIONS, obs.relationToBaseline)}${obs.description ? ` · ${obs.description}` : ''}`,
  }))
  return [...observationOptions, ...CHANGE_POINT_NONE_OPTIONS]
}

export function computeChangePointEvidence(
  observations: ChangeTimelineObservation[],
  changePointId?: string,
): ChangePointEvidence | null {
  if (!changePointId || CHANGE_POINT_NONE_OPTIONS.some((opt) => opt.value === changePointId)) {
    return null
  }
  const index = observations.findIndex((obs) => obs.id === changePointId)
  if (index < 0) return null

  const before = observations.slice(0, index)
  const after = observations.slice(index)

  return {
    beforeCount: before.length,
    afterCount: after.length,
    beforeBaselineCount: before.filter((obs) => obs.relationToBaseline === 'matches_baseline').length,
    afterDeviationCount: after.filter((obs) => isDeviationRelation(obs.relationToBaseline)).length,
    afterBaselineCount: after.filter((obs) => obs.relationToBaseline === 'matches_baseline').length,
  }
}

export function validateChangeTimelineAnswers(
  cfg: ChangeTimelineConfig,
  answers: Record<string, unknown>,
): string | null {
  const focus = String(answers[cfg.focusKey] || '').trim()
  if (!focus) return 'Bitte lege zuerst fest, welches Verhalten du über Zeit beobachten möchtest.'

  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as ChangeTimelineObservation[])
    : []

  if (observations.length < cfg.minObservations) {
    return `Bitte erfasse mindestens ${cfg.minObservations} Beobachtungen.`
  }

  const baseline = String(answers[cfg.baselineKey] || '').trim()
  if (!baseline) return 'Bitte beschreibe das Ausgangsverhalten (Baseline).'

  if (cfg.requireChangePoint && !answers[cfg.changePointKey]) {
    return 'Bitte markiere einen möglichen Change Point – oder bestätige, dass keiner klar ist.'
  }

  const changePoint = String(answers[cfg.changePointKey] || '')
  const hasConcreteChangePoint = Boolean(changePoint)
    && !CHANGE_POINT_NONE_OPTIONS.some((opt) => opt.value === changePoint)

  if (hasConcreteChangePoint && !answers[cfg.stabilityKey]) {
    return 'Bitte bewerte, wie stabil das neue Verhalten nach dem Change Point bleibt.'
  }

  if (cfg.requireComparability && !answers[cfg.comparabilityKey]) {
    return 'Bitte bewerte, ob die Situationen vor und nach dem Change Point vergleichbar waren.'
  }

  if (cfg.requireMagnitude && !answers[cfg.changeMagnitudeKey]) {
    return 'Bitte bewerte, wie deutlich sich das Verhalten unterscheidet.'
  }

  if (!answers[cfg.assessmentKey]) {
    return 'Bitte ordne die zeitliche Veränderung ein.'
  }

  const summary = String(answers[cfg.summaryKey] || '').trim()
  if (!summary || summary.length < cfg.summaryMinChars) {
    return 'Bitte beschreibe die zeitliche Veränderung in 1–2 Sätzen.'
  }

  return null
}

export function getRelationOptions() {
  return RELATION_OPTIONS
}

export function getDimensionOptions() {
  return DIMENSION_OPTIONS
}

export function getStabilityOptions() {
  return STABILITY_OPTIONS
}

export function getComparabilityOptions() {
  return COMPARABILITY_OPTIONS
}

export function getAssessmentOptions() {
  return ASSESSMENT_OPTIONS
}

export function getStableDimensionOptions() {
  return STABLE_DIMENSION_OPTIONS
}

export function getMagnitudeOptions() {
  return DEFAULT_CHANGE_MAGNITUDE_OPTIONS
}
