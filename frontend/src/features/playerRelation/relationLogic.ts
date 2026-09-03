import type {
  LabeledOption,
  PlayerRelationConfig,
  PlayerRelationDraft,
  PlayerRelationObservation,
  PlayerRelationPayload,
  PlayerRelationResult,
  PlayerRelationStage,
} from './types'

const DEFAULT_PUCK_CARRIERS: LabeledOption[] = [
  { id: 'defense', label: 'Defense' },
  { id: 'center', label: 'Center' },
  { id: 'wing', label: 'Wing' },
  { id: 'other', label: 'anderer Mitspieler' },
  { id: 'unclear', label: 'Unklar' },
]

const DEFAULT_POSITIONS: LabeledOption[] = [
  { id: 'low', label: 'Low', hint: 'eher unter / hinter dem aktuellen Spiel' },
  { id: 'middle', label: 'Middle', hint: 'eher auf Verbindungshöhe zwischen tiefem und hohem Spiel' },
  { id: 'high', label: 'High', hint: 'eher vor / oberhalb des aktuellen Spiels' },
  { id: 'unclear', label: 'Unklar', hint: 'kein klares Bild — das ist eine gültige Beobachtung' },
]

const DEFAULT_RELATIONS: LabeledOption[] = [
  {
    id: 'direct_option',
    label: 'Direkte Passoption',
    hint: 'Der Center ist unmittelbar anspielbar und kann die aktuelle Aktion direkt fortsetzen.',
    detail: 'Direkte Passoption: Schau darauf, ob der Puckführer ihn sofort sinnvoll anspielen kann.',
  },
  {
    id: 'next_option',
    label: 'Anschlussoption',
    hint: 'Der Center ist nicht unbedingt der erste Pass, schafft aber die nächste spielbare Verbindung.',
    detail: 'Anschlussoption: Schau darauf, ob er Teil der Fortsetzung ist — zum Beispiel Defense → Wing → Center.',
  },
  {
    id: 'coverage',
    label: 'Absicherung',
    hint: 'Der Center positioniert sich so, dass hinter oder neben der aktuellen Aktion Sicherheit entsteht.',
    detail: 'Absicherung: Schau darauf, welche Option bestehen bleibt, falls die aktuelle Aktion scheitert.',
  },
  {
    id: 'unclear',
    label: 'Unklar / keine klare Verbindung',
    hint: 'Lieber unklar als künstlich entscheiden.',
    detail: 'Unklar ist erlaubt. Manchmal siehst du den Center, aber noch nicht, wem er hilft.',
  },
]

const DEFAULT_PATTERNS: LabeledOption[] = [
  { id: 'direct_option', label: 'direkte Passoption' },
  { id: 'next_option', label: 'Anschlussoption' },
  { id: 'coverage', label: 'Absicherung' },
  { id: 'unclear', label: 'keine / unklar' },
]

const DEFAULT_HARDEST: LabeledOption[] = [
  { id: 'quick_switch', label: 'schnelles Umschalten' },
  { id: 'clustered', label: 'mehrere Spieler eng zusammen' },
  { id: 'not_near_puck', label: 'Center nicht direkt am Puck' },
  { id: 'position_unclear', label: 'Position unklar' },
  { id: 'other', label: 'anderes' },
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

function isUnclear(id: string): boolean {
  return id === 'unclear' || id === 'unsure'
}

export function emptyRelationDraft(): PlayerRelationDraft {
  return { puckCarrierRole: '', focalPosition: '', relation: '', note: '' }
}

export function resolvePlayerRelationConfig(raw: Record<string, unknown> = {}): PlayerRelationConfig {
  const mechanic = asString(raw.mechanic)
  const enabled = mechanic === 'player_relation'
  const minObservations = asPositiveInt(raw.minObservations ?? raw.min_observations, 3)
  const recommendedObservations = Math.max(
    minObservations,
    asPositiveInt(raw.recommendedObservations ?? raw.recommended_observations, Math.max(minObservations, 4)),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    asPositiveInt(raw.maxObservations ?? raw.max_observations, Math.max(recommendedObservations, 5)),
  )
  const focalRoleLabel = asString(raw.focalRoleLabel || raw.focal_role_label, 'Center')
  const countNoun = asString(raw.countNoun || raw.count_noun, 'Situationen')
  const countNounSingular = asString(
    raw.countNounSingular || raw.count_noun_singular,
    countNoun === 'Situationen' ? 'Situation' : countNoun.replace(/en$/, ''),
  )

  return {
    mechanic: 'player_relation',
    required: enabled,
    focalRole: asString(raw.focalRole || raw.focal_role, 'center'),
    focalRoleLabel,
    minObservations,
    recommendedObservations,
    maxObservations,
    puckCarrierOptions: asOptions(raw.puckCarrierOptions || raw.puck_carrier_options, DEFAULT_PUCK_CARRIERS),
    positionOptions: asOptions(raw.positionOptions || raw.position_options, DEFAULT_POSITIONS),
    relationOptions: asOptions(raw.relationOptions || raw.relation_options, DEFAULT_RELATIONS),
    whyThisDrill: asString(raw.whyThisDrill || raw.why_this_drill),
    lineupHint: asString(raw.lineupHint || raw.lineup_hint),
    scanButtonLabel: asString(raw.scanButtonLabel || raw.scan_button_label, '+ Situation'),
    saveButtonLabel: asString(raw.saveButtonLabel || raw.save_button_label, 'Situation speichern'),
    countNoun,
    countNounSingular,
    puckCarrierPrompt: asString(raw.puckCarrierPrompt || raw.puck_carrier_prompt, 'Wer hat gerade den Puck?'),
    positionPrompt: asString(
      raw.positionPrompt || raw.position_prompt,
      `Wo ist der ${focalRoleLabel} relativ dazu?`,
    ),
    relationPrompt: asString(
      raw.relationPrompt || raw.relation_prompt,
      'Welche Verbindung entsteht?',
    ),
    relationHint: asString(
      raw.relationHint || raw.relation_hint,
      'Support bedeutet nicht nur, irgendwo frei zu stehen — sondern eine konkrete Anschlussmöglichkeit für einen Mitspieler zu erzeugen.',
    ),
    relationGuideTitle: asString(raw.relationGuideTitle || raw.relation_guide_title, 'Welche Verbindung?'),
    relationsTitle: asString(raw.relationsTitle || raw.relations_title, 'Deine Verbindungen'),
    positionsTitle: asString(raw.positionsTitle || raw.positions_title, `${focalRoleLabel}-Position`),
    patternPrompt: asString(
      raw.patternPrompt || raw.pattern_prompt,
      'Welche Verbindung ist dir am leichtesten aufgefallen?',
    ),
    patternOptions: asOptions(raw.patternOptions || raw.pattern_options, DEFAULT_PATTERNS),
    patternRequiredMessage: asString(
      raw.patternRequiredMessage || raw.pattern_required_message,
      'Bitte beantworte, welche Verbindung dir am leichtesten aufgefallen ist.',
    ),
    hardestPrompt: asString(
      raw.hardestPrompt || raw.hardest_prompt,
      `Wann war es schwierig zu erkennen, wem der ${focalRoleLabel} eigentlich hilft?`,
    ),
    hardestOptions: asOptions(raw.hardestOptions || raw.hardest_options, DEFAULT_HARDEST),
    closingNoteLabel: asString(raw.closingNoteLabel || raw.closing_note_label, 'Warum? (optional)'),
    closingNotePlaceholder: asString(
      raw.closingNotePlaceholder || raw.closing_note_placeholder,
      'Optional. Ohne zu bewerten, ob die Verbindung gut oder schlecht war.',
    ),
    handoffText: asString(raw.handoffText || raw.handoff_text),
    decisionRule: asString(
      raw.decisionRule || raw.decision_rule,
      `Schau nicht nur darauf, wo der ${focalRoleLabel} steht – sondern welche Option dadurch für andere entsteht.`,
    ),
    coreHint: asString(raw.coreHint || raw.core_hint),
    collectEyebrow: asString(raw.collectEyebrow || raw.collect_eyebrow, 'Wer hilft wem?'),
    reflectEyebrow: asString(raw.reflectEyebrow || raw.reflect_eyebrow, 'Beziehung erkennen'),
    resultTitle: asString(raw.resultTitle || raw.result_title, 'Deine Verbindungen'),
    showSketch: asBool(raw.showSketch ?? raw.show_sketch, true),
    logsKey: asString(raw.observations_key || raw.logsKey || raw.logs_key, 'player_relation_observations'),
    resultKey: asString(raw.resultKey || raw.result_key, 'player_relation_result'),
    payloadKey: asString(raw.payloadKey || raw.payload_key, 'player_relation_payload'),
    stageKey: asString(raw.stageKey || raw.stage_key, '__player_relation_stage'),
    draftKey: asString(raw.draftKey || raw.draft_key, '__player_relation_draft'),
    addingMoreKey: asString(raw.addingMoreKey || raw.adding_more_key, '__player_relation_adding_more'),
    editIndexKey: asString(raw.editIndexKey || raw.edit_index_key, '__player_relation_edit_index'),
    patternKey: asString(raw.patternKey || raw.pattern_key, 'easiestRelation'),
    hardestKey: asString(raw.hardestKey || raw.hardest_key, 'hardestRelationMoment'),
    closingNoteKey: asString(raw.closingNoteKey || raw.closing_note_key, 'playerRelationNote'),
  }
}

export function readRelationStage(answers: Record<string, unknown>, stageKey: string): PlayerRelationStage {
  const raw = asString(answers[stageKey], 'collect')
  if (raw === 'reflect' || raw === 'complete') return raw
  return 'collect'
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

export function describeRelationVariety(relationCounts: Record<string, number>): string {
  const named = Object.entries(relationCounts).filter(([id, count]) => count > 0 && !isUnclear(id))
  if (named.length >= 2) return 'Du hast unterschiedliche Arten von Verbindung beobachtet.'
  return 'Dieselbe Rolle kann von Situation zu Situation unterschiedliche Verbindungen erzeugen.'
}

export function computePlayerRelationResult(
  observations: PlayerRelationObservation[],
  cfg: Pick<PlayerRelationConfig, 'puckCarrierOptions' | 'positionOptions' | 'relationOptions'>,
): PlayerRelationResult {
  const puckCarrierCounts: Record<string, number> = {}
  const positionCounts: Record<string, number> = {}
  const relationCounts: Record<string, number> = {}
  for (const option of cfg.puckCarrierOptions) puckCarrierCounts[option.id] = 0
  for (const option of cfg.positionOptions) positionCounts[option.id] = 0
  for (const option of cfg.relationOptions) relationCounts[option.id] = 0
  let unclearCount = 0
  for (const observation of observations) {
    const puckKey = asString(observation.puckCarrierRole)
    const positionKey = asString(observation.focalPosition)
    const relationKey = asString(observation.relation)
    if (puckKey) puckCarrierCounts[puckKey] = (puckCarrierCounts[puckKey] || 0) + 1
    if (positionKey) positionCounts[positionKey] = (positionCounts[positionKey] || 0) + 1
    if (relationKey) relationCounts[relationKey] = (relationCounts[relationKey] || 0) + 1
    if (isUnclear(relationKey)) unclearCount += 1
  }
  return {
    observationCount: observations.length,
    puckCarrierCounts,
    positionCounts,
    relationCounts,
    unclearCount,
    relationVariety: describeRelationVariety(relationCounts),
  }
}

export function resultHasNumericScore(result: PlayerRelationResult): boolean {
  const record = result as PlayerRelationResult & Record<string, unknown>
  return 'accuracy' in record || 'accuracyPercent' in record || 'score' in record || 'hockeyIQ' in record
}

export function toReflectionPayload(
  cfg: Pick<PlayerRelationConfig, 'focalRole'>,
  result: PlayerRelationResult,
  extras: { patternNoticed?: string; hardestSituation?: string; closingNote?: string },
): PlayerRelationPayload {
  return {
    focalRole: cfg.focalRole,
    observationCount: result.observationCount,
    relationCounts: result.relationCounts,
    positionCounts: result.positionCounts,
    puckCarrierCounts: result.puckCarrierCounts,
    unclearCount: result.unclearCount,
    patternNoticed: asString(extras.patternNoticed),
    hardestSituation: asString(extras.hardestSituation),
    closingNote: asString(extras.closingNote),
  }
}

export function draftToObservation(
  draft: PlayerRelationDraft,
  index: number,
  focalRole: string,
  existing?: PlayerRelationObservation,
): PlayerRelationObservation | null {
  if (!asString(draft.puckCarrierRole) || !asString(draft.focalPosition) || !asString(draft.relation)) {
    return null
  }
  return {
    id: existing?.id || `player_rel_${Date.now()}_${index}`,
    order: index + 1,
    puckCarrierRole: asString(draft.puckCarrierRole),
    focalRole: existing?.focalRole || focalRole,
    focalPosition: asString(draft.focalPosition),
    relation: asString(draft.relation),
    period: existing?.period,
    gameClock: existing?.gameClock,
    note: asString(draft.note) || undefined,
    sceneId: existing?.sceneId,
  }
}

export function observationToDraft(observation: PlayerRelationObservation): PlayerRelationDraft {
  return {
    puckCarrierRole: observation.puckCarrierRole,
    focalPosition: observation.focalPosition,
    relation: observation.relation,
    note: observation.note || '',
  }
}

export function validatePlayerRelationAnswers(
  cfg: PlayerRelationConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as PlayerRelationObservation[])
    : []
  if (!canEvaluateObservations(observations.length, cfg.minObservations)) {
    return `Bitte mache mindestens ${cfg.minObservations} ${cfg.countNoun}.`
  }
  const incomplete = observations.some((observation) => (
    !asString(observation.puckCarrierRole)
    || !asString(observation.focalPosition)
    || !asString(observation.relation)
  ))
  if (incomplete) return 'Bitte wähle für jede Situation Puckführer, Position und Verbindung.'
  if (cfg.patternOptions.length && !asString(answers[cfg.patternKey])) {
    return cfg.patternRequiredMessage
  }
  if (readRelationStage(answers, cfg.stageKey) !== 'complete') {
    return 'Bitte schließe die Beobachtungen vollständig ab.'
  }
  return null
}

export function isPlayerRelationComplete(
  cfg: PlayerRelationConfig,
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return validatePlayerRelationAnswers(cfg, answers) === null
}

export function findCompletedRelationAnswers(
  cfg: PlayerRelationConfig,
  currentAnswers: Record<string, unknown> | null | undefined,
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> } | null,
): Record<string, unknown> | null {
  if (isPlayerRelationComplete(cfg, currentAnswers)) return currentAnswers || null
  const drafts = session?.drafts && typeof session.drafts === 'object'
    ? Object.values(session.drafts)
    : []
  for (const draft of drafts) {
    if (draft && typeof draft === 'object' && isPlayerRelationComplete(cfg, draft as Record<string, unknown>)) {
      return draft as Record<string, unknown>
    }
  }
  for (const checkin of session?.checkins || []) {
    if (isPlayerRelationComplete(cfg, checkin?.answers)) {
      return checkin.answers || null
    }
  }
  return null
}
