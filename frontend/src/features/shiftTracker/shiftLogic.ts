import type {
  LabeledOption,
  ReminderLevel,
  ShiftGuidanceTier,
  ShiftObservation,
  ShiftObservationDraft,
  ShiftTrackerConfig,
  ShiftTrackerPayload,
  ShiftTrackerResult,
  ShiftTrackerStage,
} from './types'

const DEFAULT_POSITIONS: LabeledOption[] = [
  { id: 'low', label: 'Low', hint: 'eher unter / hinter dem aktuellen Spiel' },
  { id: 'middle', label: 'Middle', hint: 'eher auf Verbindungshöhe zwischen tiefem und hohem Spiel' },
  { id: 'high', label: 'High', hint: 'eher vor / oberhalb des aktuellen Spiels' },
  { id: 'unsure', label: 'Unsicher', hint: 'kein klares Bild — das ist eine gültige Beobachtung' },
]

const DEFAULT_FUNCTIONS: LabeledOption[] = [
  {
    id: 'securing',
    label: 'Sichern',
    summaryLabel: 'Absichern',
    hint: 'Der Center positioniert sich so, dass hinter oder neben der Aktion Sicherheit entsteht.',
    detail: 'Absichern: Schau darauf, welche Option bestehen bleibt, falls die aktuelle Aktion scheitert.',
  },
  {
    id: 'connecting',
    label: 'Verbinden',
    summaryLabel: 'Verbinden',
    hint: 'Der Center schafft eine Verbindung zwischen Puckführer und weiteren Mitspielern oder Räumen.',
    detail: 'Verbinden: Schau darauf, ob der Center zwischen Puckführer und einer nächsten Option eine spielbare Verbindung herstellt.',
  },
  {
    id: 'advancing',
    label: 'Mit nach vorne',
    summaryLabel: 'Angriff unterstützen',
    hint: 'Der Center bewegt sich so, dass eine nächste offensive Aktion möglich wird.',
    detail: 'Vorwärts unterstützen: Schau darauf, ob seine Bewegung neuen Raum oder eine nächste offensive Option öffnet.',
  },
  {
    id: 'unclear',
    label: 'Unklar',
    summaryLabel: 'Unklar',
    hint: 'Die Position kann klar sein, die Funktion nicht. Das ist eine gültige Beobachtung.',
    detail: 'Unklar ist erlaubt. Manchmal siehst du, wo er steht, aber noch nicht, was das Spiel dadurch gewinnt.',
  },
]

const DEFAULT_TRIGGERS: LabeledOption[] = [
  { id: 'puck_loss', label: 'nach Puckverlust' },
  { id: 'zone_change', label: 'bei schnellem Zonenwechsel' },
  { id: 'possession', label: 'bei längerem Puckbesitz' },
  { id: 'board_battle', label: 'im Chaos an der Bande' },
  { id: 'other', label: 'anderes / unklar' },
]

const DEFAULT_PATTERNS: LabeledOption[] = [
  { id: 'changes_often', label: 'Er verändert seine Höhe häufig.' },
  { id: 'stays_similar', label: 'Er bleibt oft auf ähnlicher Höhe.' },
  { id: 'lose_on_change', label: 'Ich verliere ihn bei schnellen Wechseln noch.' },
  { id: 'faster', label: 'Ich konnte ihn zunehmend schneller wiederfinden.' },
  { id: 'unclear', label: 'unklar' },
]

const DEFAULT_EXAMPLES = [
  'Puckverlust',
  'Pass / Richtungswechsel',
  'Zonenwechsel',
  'Zweikampf löst sich auf',
  'neues Puckteam',
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

function asNonNegInt(value: unknown, fallback: number): number {
  const next = Number(value)
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : fallback
}

function asPositiveInt(value: unknown, fallback: number): number {
  const next = Number(value)
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (value === true || value === false) return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asOptions(value: unknown, fallback: LabeledOption[]): LabeledOption[] {
  if (value === undefined || value === null) return fallback
  if (!Array.isArray(value)) return fallback
  if (value.length === 0) return []
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
      hint: asString(row.hint) || undefined,
      detail: asString(row.detail || row.didactic) || undefined,
    })
  }
  return next.length ? next : fallback
}

function asStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  return value.map((item) => asString(item)).filter(Boolean)
}

function asTiers(value: unknown): ShiftGuidanceTier[] {
  if (!Array.isArray(value)) return []
  const next: ShiftGuidanceTier[] = []
  for (const item of value) {
    const row = asRecord(item)
    const guidance = asString(row.guidance || row.text)
    if (!guidance) continue
    const level = asString(row.reminderLevel || row.reminder_level, 'full')
    next.push({
      maxIndex: asNonNegInt(row.maxIndex ?? row.max_index, 99),
      guidance,
      reminderLevel: level === 'compact' || level === 'minimal' ? level : 'full',
    })
  }
  return next
}

export function emptyShiftDraft(): ShiftObservationDraft {
  return { position: '', trigger: '', roleFunction: '', note: '' }
}

export function resolveShiftTrackerConfig(raw: Record<string, unknown> = {}): ShiftTrackerConfig {
  const mechanic = asString(raw.mechanic)
  const enabled = mechanic === 'shift_tracker'
  const minFromLegacy = asPositiveInt(raw.shift_count, 0)
  const minObservations = asPositiveInt(
    raw.minObservations ?? raw.min_observations,
    minFromLegacy || 4,
  )
  const recommendedObservations = Math.max(
    minObservations,
    asPositiveInt(raw.recommendedObservations ?? raw.recommended_observations, Math.max(minObservations, 5)),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    asPositiveInt(raw.maxObservations ?? raw.max_observations, Math.max(recommendedObservations, 6)),
  )
  const targetRoleLabel = asString(raw.targetRoleLabel || raw.target_role_label, 'Center')
  const markerLogging = raw.markerLogging ?? raw.marker_logging
  const showTriggerField = asBool(
    raw.showTriggerField ?? raw.show_trigger_field ?? markerLogging,
    true,
  )
  const showFunctionField = asBool(
    raw.showFunctionField ?? raw.show_function_field,
    false,
  )
  const countNoun = asString(raw.countNoun || raw.count_noun, 'Scans')
  const countNounSingular = asString(
    raw.countNounSingular || raw.count_noun_singular,
    countNoun === 'Scans' ? 'Scan' : countNoun.replace(/en$/, ''),
  )

  return {
    mechanic: 'shift_tracker',
    required: enabled,
    targetRole: asString(raw.targetRole || raw.target_role, 'center'),
    targetRoleLabel,
    showTriggerField,
    showFunctionField,
    minObservations,
    recommendedObservations,
    maxObservations,
    positionOptions: asOptions(raw.positionOptions || raw.position_options, DEFAULT_POSITIONS),
    functionOptions: asOptions(
      raw.functionOptions || raw.function_options,
      showFunctionField ? DEFAULT_FUNCTIONS : [],
    ),
    triggerOptions: asOptions(raw.triggerOptions || raw.trigger_options, DEFAULT_TRIGGERS),
    markerExamples: asStringList(raw.markerExamples || raw.marker_examples, DEFAULT_EXAMPLES),
    guidanceTiers: asTiers(raw.guidanceTiers || raw.guidance_tiers),
    relativeHeightHint: asString(
      raw.relativeHeightHint || raw.relative_height_hint,
      'Low / Middle / High beschreibt, wo der Spieler relativ zum aktuellen Spiel steht — nicht drei starre Streifen auf dem Eis.',
    ),
    whyThisDrill: asString(raw.whyThisDrill || raw.why_this_drill),
    lineupHint: asString(raw.lineupHint || raw.lineup_hint),
    scanButtonLabel: asString(raw.scanButtonLabel || raw.scan_button_label, `+ ${targetRoleLabel} Scan`),
    saveButtonLabel: asString(raw.saveButtonLabel || raw.save_button_label, 'Scan speichern'),
    countNoun,
    countNounSingular,
    positionPrompt: asString(
      raw.positionPrompt || raw.position_prompt,
      `Wo befindet sich der ${targetRoleLabel} ungefähr?`,
    ),
    functionPrompt: asString(
      raw.functionPrompt || raw.function_prompt,
      `Welche Hauptfunktion erkennst du?`,
    ),
    functionHint: asString(
      raw.functionHint || raw.function_hint,
      'Eine Situation kann mehrere Funktionen enthalten. Wähle die Funktion, die dir in diesem Moment am stärksten auffällt.',
    ),
    triggerPrompt: asString(raw.triggerPrompt || raw.trigger_prompt, 'Was hat den Blickwechsel ausgelöst?'),
    patternPrompt: asString(
      raw.patternPrompt || raw.pattern_prompt,
      `Was ist dir beim Wiederfinden des ${targetRoleLabel}s aufgefallen?`,
    ),
    patternOptions: asOptions(raw.patternOptions || raw.pattern_options, DEFAULT_PATTERNS),
    patternRequiredMessage: asString(
      raw.patternRequiredMessage || raw.pattern_required_message,
      'Bitte wähle, was dir beim Wiederfinden aufgefallen ist.',
    ),
    hardestPrompt: asString(
      raw.hardestPrompt || raw.hardest_prompt,
      `In welcher Situation war es für dich am schwersten, den ${targetRoleLabel} wiederzufinden?`,
    ),
    hardestOptions: asOptions(raw.hardestOptions || raw.hardest_options, DEFAULT_TRIGGERS),
    closingNoteLabel: asString(raw.closingNoteLabel || raw.closing_note_label, 'Notiz (optional)'),
    closingNotePlaceholder: asString(
      raw.closingNotePlaceholder || raw.closing_note_placeholder,
      'Optional: ein Satz, ohne zu bewerten, ob die Position gut war.',
    ),
    handoffText: asString(raw.handoffText || raw.handoff_text),
    decisionRule: asString(
      raw.decisionRule || raw.decision_rule,
      `Erst sehen, wo der ${targetRoleLabel} ist. Noch nicht bewerten, warum.`,
    ),
    coreHint: asString(raw.coreHint || raw.core_hint),
    collectEyebrow: asString(raw.collectEyebrow || raw.collect_eyebrow, 'Wo taucht er auf?'),
    reflectEyebrow: asString(raw.reflectEyebrow || raw.reflect_eyebrow, 'Wiederfinden'),
    resultTitle: asString(raw.resultTitle || raw.result_title, 'Deine Scans'),
    functionsTitle: asString(raw.functionsTitle || raw.functions_title, 'Erkannte Funktionen'),
    functionGuideTitle: asString(
      raw.functionGuideTitle || raw.function_guide_title,
      'Was ermöglicht er dort?',
    ),
    logsKey: asString(raw.observations_key || raw.logsKey || raw.logs_key, 'shift_tracker_observations'),
    resultKey: asString(raw.resultKey || raw.result_key, 'shift_tracker_result'),
    payloadKey: asString(raw.payloadKey || raw.payload_key, 'shift_tracker_payload'),
    stageKey: asString(raw.stageKey || raw.stage_key, '__shift_tracker_stage'),
    draftKey: asString(raw.draftKey || raw.draft_key, '__shift_tracker_draft'),
    addingMoreKey: asString(raw.addingMoreKey || raw.adding_more_key, '__shift_tracker_adding_more'),
    editIndexKey: asString(raw.editIndexKey || raw.edit_index_key, '__shift_tracker_edit_index'),
    patternKey: asString(raw.patternKey || raw.pattern_key, 'patternNoticed'),
    hardestKey: asString(raw.hardestKey || raw.hardest_key, 'hardestSituation'),
    closingNoteKey: asString(raw.closingNoteKey || raw.closing_note_key, 'shiftTrackerNote'),
  }
}

export function readShiftStage(answers: Record<string, unknown>, stageKey: string): ShiftTrackerStage {
  const raw = asString(answers[stageKey], 'collect')
  if (raw === 'reflect' || raw === 'complete') return raw
  return 'collect'
}

export function guidanceForIndex(
  cfg: Pick<ShiftTrackerConfig, 'guidanceTiers'>,
  index: number,
): ShiftGuidanceTier | null {
  if (!cfg.guidanceTiers.length) return null
  const safeIndex = Math.max(0, index)
  const match = cfg.guidanceTiers.find((tier) => safeIndex <= tier.maxIndex)
  return match || cfg.guidanceTiers[cfg.guidanceTiers.length - 1]
}

export function canAddObservation(count: number, maxObservations: number): boolean {
  return count < maxObservations
}

export function canEvaluateObservations(count: number, minObservations: number): boolean {
  return count >= minObservations
}

export function optionLabel(options: LabeledOption[], id: string): string {
  return options.find((option) => option.id === id)?.label || id
}

export function describeFunctionVariety(functionCounts: Record<string, number>): string {
  const named = Object.entries(functionCounts).filter(([id, count]) => (
    count > 0 && id !== 'unclear' && id !== 'unsure'
  ))
  if (named.length >= 2) {
    return 'Du hast dieselbe Rolle in unterschiedlichen Funktionen beobachtet.'
  }
  return 'Position und Funktion können sich von Situation zu Situation verändern.'
}

export function computeShiftTrackerResult(
  observations: ShiftObservation[],
  positionOptions: LabeledOption[],
  functionOptions: LabeledOption[] = [],
): ShiftTrackerResult {
  const positionCounts: Record<string, number> = {}
  for (const option of positionOptions) positionCounts[option.id] = 0
  const functionCounts: Record<string, number> = {}
  for (const option of functionOptions) functionCounts[option.id] = 0
  for (const observation of observations) {
    const positionKey = asString(observation.position)
    if (positionKey) positionCounts[positionKey] = (positionCounts[positionKey] || 0) + 1
    const functionKey = asString(observation.roleFunction)
    if (functionKey) functionCounts[functionKey] = (functionCounts[functionKey] || 0) + 1
  }
  return {
    observationCount: observations.length,
    positionCounts,
    functionCounts,
    functionVariety: functionOptions.length ? describeFunctionVariety(functionCounts) : '',
  }
}

export function resultHasNumericScore(result: ShiftTrackerResult): boolean {
  const record = result as ShiftTrackerResult & Record<string, unknown>
  return 'accuracy' in record || 'accuracyPercent' in record || 'score' in record || 'hockeyIQ' in record
}

export function toReflectionPayload(
  cfg: Pick<ShiftTrackerConfig, 'targetRole'>,
  result: ShiftTrackerResult,
  extras: { patternNoticed?: string; hardestSituation?: string; closingNote?: string },
): ShiftTrackerPayload {
  return {
    targetRole: cfg.targetRole,
    observationCount: result.observationCount,
    positionCounts: result.positionCounts,
    functionCounts: result.functionCounts,
    patternNoticed: asString(extras.patternNoticed),
    hardestSituation: asString(extras.hardestSituation),
    closingNote: asString(extras.closingNote),
  }
}

type DraftRequirements = {
  requireTrigger?: boolean
  requireFunction?: boolean
}

export function draftToObservation(
  draft: ShiftObservationDraft,
  index: number,
  existing?: ShiftObservation,
  requireTriggerOrOpts: boolean | DraftRequirements = false,
): ShiftObservation | null {
  const requireTrigger = typeof requireTriggerOrOpts === 'boolean'
    ? requireTriggerOrOpts
    : Boolean(requireTriggerOrOpts.requireTrigger)
  const requireFunction = typeof requireTriggerOrOpts === 'boolean'
    ? false
    : Boolean(requireTriggerOrOpts.requireFunction)
  if (!asString(draft.position)) return null
  if (requireTrigger && !asString(draft.trigger)) return null
  if (requireFunction && !asString(draft.roleFunction)) return null
  return {
    id: existing?.id || `shift_obs_${Date.now()}_${index}`,
    order: index + 1,
    position: asString(draft.position),
    trigger: asString(draft.trigger) || undefined,
    roleFunction: asString(draft.roleFunction) || undefined,
    note: asString(draft.note) || undefined,
  }
}

export function observationToDraft(observation: ShiftObservation): ShiftObservationDraft {
  return {
    position: observation.position,
    trigger: observation.trigger || '',
    roleFunction: observation.roleFunction || '',
    note: observation.note || '',
  }
}

export function validateShiftTrackerAnswers(
  cfg: ShiftTrackerConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as ShiftObservation[])
    : []
  if (!canEvaluateObservations(observations.length, cfg.minObservations)) {
    return `Bitte mache mindestens ${cfg.minObservations} ${cfg.countNoun}.`
  }
  if (cfg.showFunctionField) {
    const missingFunction = observations.some((observation) => !asString(observation.roleFunction))
    if (missingFunction) return 'Bitte wähle für jede Situation eine Funktion.'
  }
  if (cfg.patternOptions.length && !asString(answers[cfg.patternKey])) {
    return cfg.patternRequiredMessage
  }
  if (readShiftStage(answers, cfg.stageKey) !== 'complete') {
    return 'Bitte schließe die Scans vollständig ab.'
  }
  return null
}

export function isShiftTrackerComplete(
  cfg: ShiftTrackerConfig,
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return validateShiftTrackerAnswers(cfg, answers) === null
}

export function findCompletedShiftAnswers(
  cfg: ShiftTrackerConfig,
  currentAnswers: Record<string, unknown> | null | undefined,
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> } | null,
): Record<string, unknown> | null {
  if (isShiftTrackerComplete(cfg, currentAnswers)) return currentAnswers || null
  const drafts = session?.drafts && typeof session.drafts === 'object'
    ? Object.values(session.drafts)
    : []
  for (const draft of drafts) {
    if (draft && typeof draft === 'object' && isShiftTrackerComplete(cfg, draft as Record<string, unknown>)) {
      return draft as Record<string, unknown>
    }
  }
  for (const checkin of session?.checkins || []) {
    if (isShiftTrackerComplete(cfg, checkin?.answers)) {
      return checkin.answers || null
    }
  }
  return null
}

export function reminderLevelForIndex(
  cfg: Pick<ShiftTrackerConfig, 'guidanceTiers'>,
  index: number,
): ReminderLevel {
  return guidanceForIndex(cfg, index)?.reminderLevel || 'full'
}
