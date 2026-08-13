import {
  ASSESSMENT_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  INTERACTION_RESPONSE_OPTIONS,
  NEXT_WATCH_OPTIONS,
  NO_ADJUSTMENT_REASON_OPTIONS,
  POSSIBLE_TRIGGER_OPTIONS,
  PRIMARY_CHANGE_OPTIONS,
  STABILITY_OPTIONS,
  STABLE_ELEMENT_OPTIONS,
} from './labels'
import type {
  AdjustmentProfileConfig,
  AdjustmentProfileDraft,
  AdjustmentProfileEntry,
  ProfileExamplesHelp,
} from './types'

function resolveExamplesHelp(raw: Record<string, unknown>): ProfileExamplesHelp | null {
  const source = (raw.profile_examples || raw.profileExamples || raw.chain_examples || null) as
    | Record<string, unknown>
    | null
  if (!source || typeof source !== 'object') return null

  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable = suitableRaw
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || item?.text || '').trim(),
    }))
    .filter((item) => item.title && item.description)

  const unsuitableRaw = Array.isArray(source.unsuitable) ? source.unsuitable : []
  const unsuitable = unsuitableRaw.map((item: any) => String(item || '').trim()).filter(Boolean)

  if (suitable.length === 0 && unsuitable.length === 0) return null

  return {
    title: String(source.title || 'Geeignete Adjustment-Profile'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Nicht sauber'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function emptyAdjustmentDraft(): AdjustmentProfileDraft {
  return {
    beforeBehavior: '',
    changedBehavior: '',
    primaryChange: '',
    stability: '',
    possibleTrigger: '',
    triggerEvidence: '',
    stableElements: [],
    interactionResponse: '',
    assessment: '',
    confidence: '',
    counterEvidence: '',
    beforeSceneNote: '',
    changeSceneNote: '',
    responseSceneNote: '',
  }
}

export function createAdjustmentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `adj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function resolveAdjustmentProfileConfig(raw: Record<string, unknown> = {}): AdjustmentProfileConfig {
  const minAdjustments = Math.max(0, Number(raw.minAdjustments ?? raw.min_adjustments ?? 1))
  const maxAdjustments = Math.max(minAdjustments || 1, Number(raw.maxAdjustments ?? raw.max_adjustments ?? 2))
  return {
    mechanic: 'adjustment_profile',
    stageKey: String(raw.stage_key || raw.stageKey || '__adjustment_profile_stage'),
    entriesKey: String(raw.entries_key || raw.entriesKey || 'adjustment_entries'),
    draftKey: String(raw.draft_key || raw.draftKey || '__adjustment_profile_draft'),
    draftStageKey: String(raw.draft_stage_key || raw.draftStageKey || '__adjustment_profile_draft_stage'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__adjustment_profile_edit_index'),
    addingKey: String(raw.adding_key || raw.addingKey || '__adjustment_profile_adding'),
    noClearKey: String(raw.no_clear_key || raw.noClearKey || 'noClearAdjustment'),
    noClearReasonKey: String(raw.no_clear_reason_key || raw.noClearReasonKey || 'noAdjustmentReason'),
    primaryAdjustmentKey: String(raw.primary_adjustment_key || raw.primaryAdjustmentKey || 'primaryAdjustmentId'),
    segmentSummaryKey: String(raw.segment_summary_key || raw.segmentSummaryKey || 'segmentSummary'),
    nextWatchKey: String(raw.next_watch_key || raw.nextWatchKey || 'nextWatchFocus'),
    falsificationNoteKey: String(raw.falsification_note_key || raw.falsificationNoteKey || 'falsificationNote'),
    minAdjustments,
    maxAdjustments,
    allowNoClearAdjustment: raw.allow_no_clear_adjustment !== false && raw.allowNoClearAdjustment !== false,
    requireSegmentSummary: raw.require_segment_summary !== false && raw.requireSegmentSummary !== false,
    requireNextWatchFocus: raw.require_next_watch_focus !== false && raw.requireNextWatchFocus !== false,
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 40)),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Priorisiere maximal zwei relevante Veränderungen. Nicht alles, was anders aussieht, ist ein Adjustment.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Die Veränderung könnte auf X reagiert haben — nicht: Das Adjustment kam wegen X. Die Coaching-Absicht ist unbekannt.',
    ),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function isAdjustmentEntryComplete(entry: AdjustmentProfileDraft | AdjustmentProfileEntry | null | undefined): boolean {
  if (!entry) return false
  const stable = Array.isArray(entry.stableElements) ? entry.stableElements : []
  return Boolean(
    String(entry.beforeBehavior || '').trim()
      && String(entry.changedBehavior || '').trim()
      && entry.primaryChange
      && entry.stability
      && entry.possibleTrigger
      && String(entry.triggerEvidence || '').trim()
      && stable.length > 0
      && entry.interactionResponse
      && entry.assessment
      && entry.confidence,
  )
}

export function draftToEntry(
  draft: AdjustmentProfileDraft,
  existing?: AdjustmentProfileEntry,
): AdjustmentProfileEntry {
  return {
    id: existing?.id || draft.id || createAdjustmentId(),
    beforeBehavior: String(draft.beforeBehavior || '').trim(),
    changedBehavior: String(draft.changedBehavior || '').trim(),
    primaryChange: String(draft.primaryChange || ''),
    stability: String(draft.stability || ''),
    possibleTrigger: String(draft.possibleTrigger || ''),
    triggerEvidence: String(draft.triggerEvidence || '').trim(),
    stableElements: Array.isArray(draft.stableElements) ? draft.stableElements : [],
    interactionResponse: String(draft.interactionResponse || ''),
    assessment: String(draft.assessment || ''),
    confidence: String(draft.confidence || ''),
    counterEvidence: String(draft.counterEvidence || '').trim() || undefined,
    beforeSceneNote: String(draft.beforeSceneNote || '').trim() || undefined,
    changeSceneNote: String(draft.changeSceneNote || '').trim() || undefined,
    responseSceneNote: String(draft.responseSceneNote || '').trim() || undefined,
  }
}

export function entryToDraft(entry: AdjustmentProfileEntry): AdjustmentProfileDraft {
  return {
    id: entry.id,
    beforeBehavior: entry.beforeBehavior || '',
    changedBehavior: entry.changedBehavior || '',
    primaryChange: entry.primaryChange || '',
    stability: entry.stability || '',
    possibleTrigger: entry.possibleTrigger || '',
    triggerEvidence: entry.triggerEvidence || '',
    stableElements: entry.stableElements || [],
    interactionResponse: entry.interactionResponse || '',
    assessment: entry.assessment || '',
    confidence: entry.confidence || '',
    counterEvidence: entry.counterEvidence || '',
    beforeSceneNote: entry.beforeSceneNote || '',
    changeSceneNote: entry.changeSceneNote || '',
    responseSceneNote: entry.responseSceneNote || '',
  }
}

export function describeProfile(entries: AdjustmentProfileEntry[]): string[] {
  const statements: string[] = []
  statements.push(`${entries.length} Adjustment-Kandidat${entries.length === 1 ? '' : 'en'} im beobachteten Segment.`)
  const stable = entries.filter((item) => item.stability === 'stable' || item.stability === 'mostly_stable').length
  const temporary = entries.filter(
    (item) => item.stability === 'temporary' || item.stability === 'single_deviation',
  ).length
  if (stable) statements.push(`${stable} eher stabil.`)
  if (temporary) statements.push(`${temporary} eher temporär / einzelne Abweichung.`)
  const high = entries.filter((item) => item.confidence === 'high').length
  const low = entries.filter((item) => item.confidence === 'low').length
  if (high) statements.push(`${high} mit hoher Confidence.`)
  if (low) statements.push(`${low} mit niedriger Confidence.`)
  return statements
}

export function validateAdjustmentProfileAnswers(
  cfg: AdjustmentProfileConfig,
  answers: Record<string, unknown>,
): string | null {
  const noClear = answers[cfg.noClearKey] === true
  const entries = Array.isArray(answers[cfg.entriesKey])
    ? (answers[cfg.entriesKey] as AdjustmentProfileEntry[])
    : []

  if (noClear) {
    if (!cfg.allowNoClearAdjustment) {
      return 'Ein Adjustment-Kandidat ist in diesem Drill erforderlich.'
    }
    if (entries.length > 0) {
      return 'Bitte entferne gespeicherte Kandidaten, wenn kein belastbares Adjustment erkannt wurde.'
    }
    if (!answers[cfg.noClearReasonKey]) {
      return 'Bitte begründe, warum kein belastbares Adjustment erkennbar ist.'
    }
  } else {
    if (entries.length < cfg.minAdjustments) {
      return cfg.minAdjustments === 1
        ? 'Bitte dokumentiere mindestens einen Adjustment-Kandidaten.'
        : `Bitte dokumentiere mindestens ${cfg.minAdjustments} Adjustment-Kandidaten.`
    }
    if (entries.length > cfg.maxAdjustments) {
      return `Maximal ${cfg.maxAdjustments} Adjustments — bitte priorisiere.`
    }
    if (entries.some((entry) => !isAdjustmentEntryComplete(entry))) {
      return 'Bitte vervollständige alle Adjustment-Kandidaten.'
    }
    if (entries.length >= 2 && !answers[cfg.primaryAdjustmentKey]) {
      return 'Bitte wähle, welches Adjustment das Segment stärker geprägt hat.'
    }
  }

  if (cfg.requireSegmentSummary) {
    const summary = String(answers[cfg.segmentSummaryKey] || '').trim()
    if (!summary || summary.length < cfg.summaryMinChars) {
      return 'Bitte fasse das Adjustment-Profil des beobachteten Segments zusammen.'
    }
  }

  if (cfg.requireNextWatchFocus && !answers[cfg.nextWatchKey]) {
    return 'Bitte wähle, was du im nächsten Segment gezielt weiter beobachten würdest.'
  }

  return null
}

export function getPrimaryChangeOptions() {
  return PRIMARY_CHANGE_OPTIONS
}

export function getStabilityOptions() {
  return STABILITY_OPTIONS
}

export function getPossibleTriggerOptions() {
  return POSSIBLE_TRIGGER_OPTIONS
}

export function getStableElementOptions() {
  return STABLE_ELEMENT_OPTIONS
}

export function getInteractionResponseOptions() {
  return INTERACTION_RESPONSE_OPTIONS
}

export function getAssessmentOptions() {
  return ASSESSMENT_OPTIONS
}

export function getConfidenceOptions() {
  return DEFAULT_CONFIDENCE_OPTIONS
}

export function getNoAdjustmentReasonOptions() {
  return NO_ADJUSTMENT_REASON_OPTIONS
}

export function getNextWatchOptions(entryCount: number) {
  if (entryCount < 2) {
    return NEXT_WATCH_OPTIONS.filter((opt) => opt.value !== 'holds_adjustment_2')
  }
  return NEXT_WATCH_OPTIONS
}
