import type {
  LabeledOption,
  SimpleStructureConfig,
  SimpleStructureDraft,
  SimpleStructureObservation,
  SimpleStructurePayload,
  SimpleStructureResult,
  SimpleStructureStage,
  StructureGuidanceTier,
  TrackRecapStep,
} from './types'

const DEFAULT_STRUCTURES: LabeledOption[] = [
  {
    id: 'single_option',
    label: 'Eine klare Option',
    hint: 'Der Center erzeugt eine erkennbare Verbindung zu einem Mitspieler, aber es ist noch keine größere Struktur sichtbar.',
    detail: 'Das ist die einfachste Stufe: eine Beziehung, noch keine Gruppe.',
  },
  {
    id: 'multiple_options',
    label: 'Mehrere Anschlussoptionen',
    hint: 'Vom Center oder über den Center sind mehrere nächste Verbindungen gleichzeitig erkennbar.',
    detail: 'Mehrere Optionen können bereits Struktur erzeugen, auch wenn kein klares Dreieck sichtbar ist.',
  },
  {
    id: 'triangle',
    label: 'Dreieck',
    hint: 'Drei Spieler erzeugen mehrere miteinander verbundene Optionen.',
    detail: 'Ein Dreieck muss nicht perfekt auf das Eis gezeichnet sein. Entscheidend ist, dass mehrere Spieler miteinander spielbare Verbindungen erzeugen.',
  },
  {
    id: 'coverage_structure',
    label: 'Absicherungsstruktur',
    hint: 'Die Spieler stehen so zueinander, dass hinter oder neben der aktuellen Aktion eine weitere sichere Verbindung bestehen bleibt.',
    detail: 'Keine Bewertung, ob die Absicherung gut war — nur, ob sie als kleine Struktur sichtbar ist.',
  },
  {
    id: 'unclear',
    label: 'Unklar',
    hint: 'Keine erkennbare Struktur in diesem Moment. Das ist eine gültige Beobachtung.',
    detail: 'Lieber unklar als eine Struktur zu erraten, die du nicht siehst.',
  },
]

const DEFAULT_PATTERNS: LabeledOption[] = [
  { id: 'multiple_options', label: 'als mehrere Passoptionen gleichzeitig sichtbar wurden' },
  { id: 'triangle', label: 'als ich ein Dreieck erkannt habe' },
  { id: 'coverage_structure', label: 'als ich die Absicherung hinter der Aktion gesehen habe' },
  { id: 'not_yet', label: 'noch nicht klar' },
  { id: 'other', label: 'anderes' },
]

const DEFAULT_NEXT_FOCUS: LabeledOption[] = [
  { id: 'center', label: 'Center' },
  { id: 'winger', label: 'Winger' },
  { id: 'pass_options', label: 'Passoptionen' },
  { id: 'spacing', label: 'Abstände' },
  { id: 'multiple_options', label: 'mehrere Optionen gleichzeitig' },
  { id: 'unclear', label: 'unklar' },
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
    if (typeof item === 'string') {
      const id = asString(item)
      if (id) next.push({ id, label: id })
      continue
    }
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

function asTiers(value: unknown): StructureGuidanceTier[] {
  if (!Array.isArray(value)) return []
  const next: StructureGuidanceTier[] = []
  for (const item of value) {
    const row = asRecord(item)
    const guidance = asString(row.guidance || row.text)
    if (!guidance) continue
    next.push({
      maxIndex: asNonNegInt(row.maxIndex ?? row.max_index, 99),
      guidance,
    })
  }
  return next
}

function asRecap(value: unknown): TrackRecapStep[] {
  if (!Array.isArray(value)) return []
  const next: TrackRecapStep[] = []
  for (const item of value) {
    const row = asRecord(item)
    const id = asString(row.id)
    const label = asString(row.label)
    if (!id || !label) continue
    next.push({ id, label })
  }
  return next
}

function isUnclear(id: string): boolean {
  return id === 'unclear' || id === 'unsure'
}

export function emptyStructureDraft(): SimpleStructureDraft {
  return { structureType: '', note: '' }
}

export function resolveSimpleStructureConfig(raw: Record<string, unknown> = {}): SimpleStructureConfig {
  const mechanic = asString(raw.mechanic)
  const enabled = mechanic === 'simple_structure'
  const minObservations = asNonNegInt(raw.minObservations ?? raw.min_observations, 3) || 3
  const recommendedObservations = Math.max(
    minObservations,
    asNonNegInt(raw.recommendedObservations ?? raw.recommended_observations, Math.max(minObservations, 4)),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    asNonNegInt(raw.maxObservations ?? raw.max_observations, Math.max(recommendedObservations, 5)),
  )
  const focalRoleLabel = asString(raw.focalRoleLabel || raw.focal_role_label, 'Center')
  const supportsUnclear = asBool(raw.supportsUnclear ?? raw.supports_unclear, true)
  const countNoun = asString(raw.countNoun || raw.count_noun, 'Situationen')
  const structureOptions = asOptions(raw.structureOptions || raw.structure_options, DEFAULT_STRUCTURES)
    .filter((option) => supportsUnclear || !isUnclear(option.id))

  return {
    mechanic: 'simple_structure',
    required: enabled,
    focalRole: asString(raw.focalRole || raw.focal_role, 'center'),
    focalRoleLabel,
    minObservations,
    recommendedObservations,
    maxObservations,
    supportsUnclear,
    supportsSceneCapture: asBool(raw.supportsSceneCapture ?? raw.supports_scene_capture, false),
    structureOptions,
    guidanceTiers: asTiers(raw.guidanceTiers || raw.guidance_tiers),
    trackRecapTitle: asString(raw.trackRecapTitle || raw.track_recap_title),
    trackRecapLead: asString(raw.trackRecapLead || raw.track_recap_lead),
    trackRecap: asRecap(raw.trackRecap || raw.track_recap),
    whyThisDrill: asString(raw.whyThisDrill || raw.why_this_drill),
    lineupHint: asString(raw.lineupHint || raw.lineup_hint),
    scanButtonLabel: asString(raw.scanButtonLabel || raw.scan_button_label, '+ Situation'),
    saveButtonLabel: asString(raw.saveButtonLabel || raw.save_button_label, 'Situation speichern'),
    countNoun,
    countNounSingular: asString(
      raw.countNounSingular || raw.count_noun_singular,
      countNoun === 'Situationen' ? 'Situation' : countNoun.replace(/en$/, ''),
    ),
    structurePrompt: asString(
      raw.structurePrompt || raw.structure_prompt,
      `Welche einfache Struktur erkennst du rund um den ${focalRoleLabel}?`,
    ),
    structureHint: asString(
      raw.structureHint || raw.structure_hint,
      'Aus einzelnen Verbindungen entsteht Struktur. Du musst noch nicht das ganze Team lesen.',
    ),
    structureGuideTitle: asString(raw.structureGuideTitle || raw.structure_guide_title, 'Einfache Strukturen'),
    patternPrompt: asString(
      raw.patternPrompt || raw.pattern_prompt,
      'Wann wurde aus einzelnen Spielern für dich erstmals eine erkennbare Struktur?',
    ),
    patternOptions: asOptions(raw.patternOptions || raw.pattern_options, DEFAULT_PATTERNS),
    patternRequiredMessage: asString(
      raw.patternRequiredMessage || raw.pattern_required_message,
      'Bitte beantworte, wann für dich erstmals eine Struktur erkennbar wurde.',
    ),
    nextFocusPrompt: asString(
      raw.nextFocusPrompt || raw.next_focus_prompt,
      'Was möchtest du im nächsten Track bewusster beobachten?',
    ),
    nextFocusOptions: asOptions(raw.nextFocusOptions || raw.next_focus_options, DEFAULT_NEXT_FOCUS),
    closingNoteLabel: asString(raw.closingNoteLabel || raw.closing_note_label, 'Notiz (optional)'),
    closingNotePlaceholder: asString(
      raw.closingNotePlaceholder || raw.closing_note_placeholder,
      'Optional. Ohne zu bewerten, ob die Struktur gut oder schlecht war.',
    ),
    handoffText: asString(raw.handoffText || raw.handoff_text),
    decisionRule: asString(
      raw.decisionRule || raw.decision_rule,
      'Aus einzelnen Verbindungen entsteht Struktur.',
    ),
    coreHint: asString(
      raw.coreHint || raw.core_hint,
      'Du musst noch nicht das ganze Team lesen – erkenne zuerst eine kleine Gruppe verbundener Optionen.',
    ),
    collectEyebrow: asString(raw.collectEyebrow || raw.collect_eyebrow, 'Erste Struktur'),
    reflectEyebrow: asString(raw.reflectEyebrow || raw.reflect_eyebrow, 'Blick erweitert'),
    resultTitle: asString(raw.resultTitle || raw.result_title, 'Deine ersten Strukturen'),
    showSketch: asBool(raw.showSketch ?? raw.show_sketch, true),
    logsKey: asString(raw.observations_key || raw.logsKey || raw.logs_key, 'simple_structure_observations'),
    resultKey: asString(raw.resultKey || raw.result_key, 'simple_structure_result'),
    payloadKey: asString(raw.payloadKey || raw.payload_key, 'simple_structure_payload'),
    stageKey: asString(raw.stageKey || raw.stage_key, '__simple_structure_stage'),
    draftKey: asString(raw.draftKey || raw.draft_key, '__simple_structure_draft'),
    addingMoreKey: asString(raw.addingMoreKey || raw.adding_more_key, '__simple_structure_adding_more'),
    editIndexKey: asString(raw.editIndexKey || raw.edit_index_key, '__simple_structure_edit_index'),
    patternKey: asString(raw.patternKey || raw.pattern_key, 'structureMoment'),
    nextFocusKey: asString(raw.nextFocusKey || raw.next_focus_key, 'nextFocus'),
    closingNoteKey: asString(raw.closingNoteKey || raw.closing_note_key, 'simpleStructureNote'),
  }
}

export function readStructureStage(answers: Record<string, unknown>, stageKey: string): SimpleStructureStage {
  const raw = asString(answers[stageKey], 'collect')
  if (raw === 'reflect' || raw === 'complete') return raw
  return 'collect'
}

export function guidanceForIndex(
  cfg: Pick<SimpleStructureConfig, 'guidanceTiers'>,
  index: number,
): StructureGuidanceTier | null {
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

export function describeStructureVariety(structureCounts: Record<string, number>): string {
  const named = Object.entries(structureCounts).filter(([id, count]) => count > 0 && !isUnclear(id))
  if (named.length >= 2) return 'Du hast unterschiedliche einfache Strukturen beobachtet.'
  return 'Aus einzelnen Verbindungen kann von Situation zu Situation eine andere kleine Struktur entstehen.'
}

export function computeSimpleStructureResult(
  observations: SimpleStructureObservation[],
  structureOptions: LabeledOption[],
): SimpleStructureResult {
  const structureCounts: Record<string, number> = {}
  for (const option of structureOptions) structureCounts[option.id] = 0
  let unclearCount = 0
  for (const observation of observations) {
    const key = asString(observation.structureType)
    if (!key) continue
    structureCounts[key] = (structureCounts[key] || 0) + 1
    if (isUnclear(key)) unclearCount += 1
  }
  return {
    observationCount: observations.length,
    structureCounts,
    unclearCount,
    structureVariety: describeStructureVariety(structureCounts),
  }
}

export function resultHasNumericScore(result: SimpleStructureResult): boolean {
  const record = result as SimpleStructureResult & Record<string, unknown>
  return 'accuracy' in record || 'accuracyPercent' in record || 'score' in record || 'hockeyIQ' in record
}

export function toReflectionPayload(
  cfg: Pick<SimpleStructureConfig, 'focalRole'>,
  result: SimpleStructureResult,
  extras: { patternNoticed?: string; nextFocus?: string; closingNote?: string },
): SimpleStructurePayload {
  return {
    focalRole: cfg.focalRole,
    observationCount: result.observationCount,
    structureCounts: result.structureCounts,
    unclearCount: result.unclearCount,
    patternNoticed: asString(extras.patternNoticed),
    nextFocus: asString(extras.nextFocus),
    closingNote: asString(extras.closingNote),
  }
}

export function draftToObservation(
  draft: SimpleStructureDraft,
  index: number,
  focalRole: string,
  existing?: SimpleStructureObservation,
): SimpleStructureObservation | null {
  if (!asString(draft.structureType)) return null
  return {
    id: existing?.id || `simple_struct_${Date.now()}_${index}`,
    order: index + 1,
    structureType: asString(draft.structureType),
    focalRole: existing?.focalRole || focalRole,
    period: existing?.period,
    gameClock: existing?.gameClock,
    note: asString(draft.note) || undefined,
    sceneId: existing?.sceneId,
  }
}

export function observationToDraft(observation: SimpleStructureObservation): SimpleStructureDraft {
  return { structureType: observation.structureType, note: observation.note || '' }
}

export function validateSimpleStructureAnswers(
  cfg: SimpleStructureConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as SimpleStructureObservation[])
    : []
  if (!canEvaluateObservations(observations.length, cfg.minObservations)) {
    return `Bitte mache mindestens ${cfg.minObservations} ${cfg.countNoun}.`
  }
  const incomplete = observations.some((observation) => !asString(observation.structureType))
  if (incomplete) return 'Bitte wähle für jede Situation eine einfache Struktur.'
  if (cfg.patternOptions.length && !asString(answers[cfg.patternKey])) {
    return cfg.patternRequiredMessage
  }
  if (readStructureStage(answers, cfg.stageKey) !== 'complete') {
    return 'Bitte schließe die Beobachtungen vollständig ab.'
  }
  return null
}

export function isSimpleStructureComplete(
  cfg: SimpleStructureConfig,
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return validateSimpleStructureAnswers(cfg, answers) === null
}

export function findCompletedStructureAnswers(
  cfg: SimpleStructureConfig,
  currentAnswers: Record<string, unknown> | null | undefined,
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> } | null,
): Record<string, unknown> | null {
  if (isSimpleStructureComplete(cfg, currentAnswers)) return currentAnswers || null
  const drafts = session?.drafts && typeof session.drafts === 'object'
    ? Object.values(session.drafts)
    : []
  for (const draft of drafts) {
    if (draft && typeof draft === 'object' && isSimpleStructureComplete(cfg, draft as Record<string, unknown>)) {
      return draft as Record<string, unknown>
    }
  }
  for (const checkin of session?.checkins || []) {
    if (isSimpleStructureComplete(cfg, checkin?.answers)) {
      return checkin.answers || null
    }
  }
  return null
}
