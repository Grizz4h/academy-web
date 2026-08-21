import type {
  FoundStatus,
  GuidanceMode,
  LabeledOption,
  RoleIdentificationConfig,
  RoleIdentificationPayload,
  RoleIdentificationResult,
  RoleIdentificationStage,
  RoleObservation,
  RoleObservationDraft,
  RoleObservationStep,
  RoleSearchAnchor,
} from './types'

const FOUND_SET = new Set<FoundStatus>(['yes', 'with_help', 'unsure'])
const MODE_SET = new Set<GuidanceMode>(['guided', 'assisted', 'blind'])

const DEFAULT_FOUND_OPTIONS: LabeledOption[] = [
  { id: 'yes', label: 'Ja', summaryLabel: 'Ohne Hilfe' },
  { id: 'with_help', label: 'Mit Hilfe', summaryLabel: 'Mit Hilfe' },
  { id: 'unsure', label: 'Unsicher', summaryLabel: 'Unsicher' },
]

const DEFAULT_HINT_OPTIONS: LabeledOption[] = [
  { id: 'interior', label: 'Position / Innenraum' },
  { id: 'support', label: 'Support' },
  { id: 'coverage', label: 'Absicherung' },
  { id: 'connecting', label: 'Bewegung zwischen Mitspielern' },
  { id: 'lineup', label: 'Rückennummer / Lineup' },
  { id: 'other', label: 'Anderer Hinweis' },
]

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown, fallback = ''): string {
  const next = String(value ?? '').trim()
  return next || fallback
}

function asPositiveInt(value: unknown, fallback: number): number {
  const next = Number(value)
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback
}

function asOptions(value: unknown, fallback: LabeledOption[]): LabeledOption[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  const next: LabeledOption[] = []
  for (const item of value) {
    const row = asRecord(item)
    const id = asString(row.id || row.value)
    const label = asString(row.label || row.summaryLabel)
    if (!id || !label) continue
    next.push({
      id,
      label,
      summaryLabel: asString(row.summaryLabel) || undefined,
    })
  }
  return next.length ? next : fallback
}

function asAnchors(value: unknown): RoleSearchAnchor[] {
  if (!Array.isArray(value)) return []
  const next: RoleSearchAnchor[] = []
  for (const item of value) {
    const row = asRecord(item)
    const id = asString(row.id)
    const label = asString(row.label)
    if (!id || !label) continue
    next.push({
      id,
      label,
      hint: asString(row.hint) || undefined,
    })
  }
  return next
}

function asSteps(value: unknown): RoleObservationStep[] {
  if (!Array.isArray(value)) return []
  const next: RoleObservationStep[] = []
  for (const item of value) {
    const row = asRecord(item)
    const id = asString(row.id)
    const title = asString(row.title)
    const guidance = asString(row.guidance || row.text)
    if (!id || !title || !guidance) continue
    next.push({ id, title, guidance })
  }
  return next
}

function parseGuidanceMode(value: unknown): GuidanceMode {
  const mode = asString(value, 'blind') as GuidanceMode
  return MODE_SET.has(mode) ? mode : 'blind'
}

export function isFoundStatus(value: unknown): value is FoundStatus {
  return FOUND_SET.has(value as FoundStatus)
}

export function emptyRoleDraft(): RoleObservationDraft {
  return { found: '', helpfulHint: '', note: '' }
}

export function resolveRoleIdentificationConfig(raw: Record<string, unknown> = {}): RoleIdentificationConfig {
  const mechanic = asString(raw.mechanic)
  const enabled = mechanic === 'role_identification'
  const minObservations = asPositiveInt(raw.minObservations ?? raw.min_observations, 2)
  const recommendedObservations = Math.max(
    minObservations,
    asPositiveInt(raw.recommendedObservations ?? raw.recommended_observations, 3),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    asPositiveInt(raw.maxObservations ?? raw.max_observations, 4),
  )
  const targetRoleLabel = asString(raw.targetRoleLabel || raw.target_role_label, 'Center')

  return {
    mechanic: 'role_identification',
    required: enabled,
    targetRole: asString(raw.targetRole || raw.target_role, 'center'),
    targetRoleLabel,
    whyThisRole: asString(raw.whyThisRole || raw.why_this_role),
    guidanceMode: parseGuidanceMode(raw.guidanceMode || raw.guidance_mode),
    lineupHint: asString(raw.lineupHint || raw.lineup_hint),
    searchAnchors: asAnchors(raw.searchAnchors || raw.search_anchors),
    searchAnchorsDisclaimer: asString(
      raw.searchAnchorsDisclaimer || raw.search_anchors_disclaimer,
      'Diese Hinweise helfen dir beim Suchen. Je nach Situation kann die Rolle anders aussehen.',
    ),
    observationSteps: asSteps(raw.observationSteps || raw.observation_steps),
    minObservations,
    recommendedObservations,
    maxObservations,
    foundOptions: asOptions(raw.foundOptions || raw.found_options, DEFAULT_FOUND_OPTIONS),
    hintOptions: asOptions(raw.hintOptions || raw.hint_options, DEFAULT_HINT_OPTIONS),
    closingPrompt: asString(
      raw.closingPrompt || raw.closing_prompt,
      `Was hat dir am meisten geholfen, den ${targetRoleLabel} nicht aus den Augen zu verlieren?`,
    ),
    closingNotePlaceholder: asString(
      raw.closingNotePlaceholder || raw.closing_note_placeholder,
      'Optional: ein Satz zu deiner Suchstrategie.',
    ),
    handoffText: asString(raw.handoffText || raw.handoff_text),
    decisionRule: asString(
      raw.decisionRule || raw.decision_rule,
      'Erst die Rolle finden – später ihre Position und Funktion bewerten.',
    ),
    coreHint: asString(raw.coreHint || raw.core_hint),
    resultTitle: asString(raw.resultTitle || raw.result_title, `${targetRoleLabel} gefunden`),
    logsKey: asString(raw.observations_key || raw.logsKey || raw.logs_key, 'role_identification_observations'),
    resultKey: asString(raw.resultKey || raw.result_key, 'role_identification_result'),
    payloadKey: asString(raw.payloadKey || raw.payload_key, 'role_identification_payload'),
    stageKey: asString(raw.stageKey || raw.stage_key, '__role_identification_stage'),
    draftKey: asString(raw.draftKey || raw.draft_key, '__role_identification_draft'),
    addingMoreKey: asString(raw.addingMoreKey || raw.adding_more_key, '__role_identification_adding_more'),
    editIndexKey: asString(raw.editIndexKey || raw.edit_index_key, '__role_identification_edit_index'),
    closingNoteKey: asString(raw.closingNoteKey || raw.closing_note_key, 'searchStrategyNote'),
  }
}

export function readRoleStage(
  answers: Record<string, unknown>,
  stageKey: string,
): RoleIdentificationStage {
  const raw = asString(answers[stageKey], 'collect')
  if (raw === 'reflect' || raw === 'complete') return raw
  return 'collect'
}

export function observationStepForIndex(
  cfg: Pick<RoleIdentificationConfig, 'observationSteps'>,
  index: number,
): RoleObservationStep | null {
  const steps = cfg.observationSteps
  if (!steps.length) return null
  const safeIndex = Math.max(0, index)
  return steps[Math.min(safeIndex, steps.length - 1)]
}

export function showsLineupHint(mode: GuidanceMode): boolean {
  return mode === 'guided'
}

export function showsSearchAnchors(mode: GuidanceMode): boolean {
  return mode === 'guided' || mode === 'assisted'
}

export function canAddObservation(count: number, maxObservations: number): boolean {
  return count < maxObservations
}

export function canEvaluateObservations(count: number, minObservations: number): boolean {
  return count >= minObservations
}

export function optionLabel(options: LabeledOption[], id: string, useSummary = false): string {
  const match = options.find((option) => option.id === id)
  if (!match) return id
  if (useSummary && match.summaryLabel) return match.summaryLabel
  return match.label
}

export function computeRoleIdentificationResult(observations: RoleObservation[]): RoleIdentificationResult {
  const foundCounts: Record<FoundStatus, number> = { yes: 0, with_help: 0, unsure: 0 }
  const hintCounts: Record<string, number> = {}
  for (const observation of observations) {
    if (isFoundStatus(observation.found)) foundCounts[observation.found] += 1
    const hint = asString(observation.helpfulHint)
    if (hint) hintCounts[hint] = (hintCounts[hint] || 0) + 1
  }
  return {
    observationCount: observations.length,
    foundCounts,
    hintCounts,
  }
}

export function resultHasNumericScore(result: RoleIdentificationResult): boolean {
  const record = result as RoleIdentificationResult & Record<string, unknown>
  return 'accuracy' in record
    || 'accuracyPercent' in record
    || 'score' in record
    || 'hockeyIQ' in record
}

export function rankedHintEntries(hintCounts: Record<string, number>): Array<[string, number]> {
  return Object.entries(hintCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export function toReflectionPayload(
  cfg: Pick<RoleIdentificationConfig, 'targetRole' | 'guidanceMode'>,
  result: RoleIdentificationResult,
  closingNote: string,
): RoleIdentificationPayload {
  return {
    targetRole: cfg.targetRole,
    guidanceMode: cfg.guidanceMode,
    observationCount: result.observationCount,
    foundCounts: result.foundCounts,
    hintCounts: result.hintCounts,
    closingNote: asString(closingNote),
  }
}

export function draftToObservation(
  draft: RoleObservationDraft,
  index: number,
  existing?: RoleObservation,
  stepId?: string,
): RoleObservation | null {
  if (!isFoundStatus(draft.found) || !asString(draft.helpfulHint)) return null
  return {
    id: existing?.id || `role_obs_${Date.now()}_${index}`,
    order: index + 1,
    stepId: stepId || existing?.stepId,
    found: draft.found,
    helpfulHint: asString(draft.helpfulHint),
    note: asString(draft.note) || undefined,
  }
}

export function observationToDraft(observation: RoleObservation): RoleObservationDraft {
  return {
    found: observation.found,
    helpfulHint: observation.helpfulHint,
    note: observation.note || '',
  }
}

export function validateRoleIdentificationAnswers(
  cfg: RoleIdentificationConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as RoleObservation[])
    : []
  if (!canEvaluateObservations(observations.length, cfg.minObservations)) {
    return `Bitte beobachte den ${cfg.targetRoleLabel} in mindestens ${cfg.minObservations} Situationen.`
  }
  if (readRoleStage(answers, cfg.stageKey) !== 'complete') {
    return 'Bitte schließe die Rollenidentifikation vollständig ab.'
  }
  return null
}

export function isRoleIdentificationComplete(
  cfg: RoleIdentificationConfig,
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return validateRoleIdentificationAnswers(cfg, answers) === null
}

export function findCompletedRoleAnswers(
  cfg: RoleIdentificationConfig,
  currentAnswers: Record<string, unknown> | null | undefined,
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> } | null,
): Record<string, unknown> | null {
  if (isRoleIdentificationComplete(cfg, currentAnswers)) return currentAnswers || null
  const drafts = session?.drafts && typeof session.drafts === 'object'
    ? Object.values(session.drafts)
    : []
  for (const draft of drafts) {
    if (draft && typeof draft === 'object' && isRoleIdentificationComplete(cfg, draft as Record<string, unknown>)) {
      return draft as Record<string, unknown>
    }
  }
  for (const checkin of session?.checkins || []) {
    if (isRoleIdentificationComplete(cfg, checkin?.answers)) {
      return checkin.answers || null
    }
  }
  return null
}
