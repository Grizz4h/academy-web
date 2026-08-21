import type {
  LabeledOption,
  TacticalObservation,
  TacticalObservationConfig,
  TacticalObservationDraft,
  TacticalObservationLayer,
  TacticalObservationPayload,
  TacticalObservationResult,
  TacticalObservationStage,
} from './types'

const DEFAULT_INITIATORS: LabeledOption[] = [
  { id: 'defense', label: 'Defense' },
  { id: 'center', label: 'Center' },
  { id: 'wing', label: 'Wing' },
  { id: 'other', label: 'anderer Spieler' },
  { id: 'unclear', label: 'Unklar' },
]

const DEFAULT_SUPPORT: LabeledOption[] = [
  {
    id: 'single_support',
    label: 'eine klare Unterstützung',
    hint: 'Es gibt eine erkennbare Unterstützung für den Spieler, der die Aktion startet.',
  },
  {
    id: 'multiple_options',
    label: 'mehrere Möglichkeiten',
    hint: 'Mehrere Spieler können die nächste Aktion unterstützen.',
  },
  {
    id: 'little_support',
    label: 'wenig Unterstützung',
    hint: 'Es ist kaum eine klare Unterstützung für die Aktion sichtbar.',
  },
  {
    id: 'unclear',
    label: 'Unklar',
    hint: 'Lieber unklar als zu raten.',
  },
]

const DEFAULT_STRUCTURES: LabeledOption[] = [
  {
    id: 'organized',
    label: 'Geordnet',
    hint: 'Spieler bieten sich mit klaren Abständen und Rollen an — nicht „gut“.',
    detail: 'Geordnet heißt: Rollen und Abstände sind lesbar. Keine Qualitätsnote.',
  },
  {
    id: 'multiple_options',
    label: 'Mehrere Optionen',
    hint: 'Mehrere Spieler können die nächste Aktion unterstützen — nicht „besser“.',
    detail: 'Mehrere Optionen heißt: mehrere nächste Wege sind gleichzeitig sichtbar.',
  },
  {
    id: 'under_pressure',
    label: 'Unter Druck',
    hint: 'Gegnerdruck beeinflusst die vorhandene Struktur — nicht „schlecht“.',
    detail: 'Unter Druck heißt: die Struktur ist durch Gegnerdruck verändert oder eingeschränkt.',
  },
  {
    id: 'unclear',
    label: 'Unklar',
    hint: 'Keine klare Struktur in diesem Moment. Das ist eine gültige Beobachtung.',
    detail: 'Unklar ist erlaubt. Nicht zum Raten zwingen.',
  },
]

const DEFAULT_PATTERNS: LabeledOption[] = [
  { id: 'positions', label: 'Positionen der Spieler' },
  { id: 'spacing', label: 'Abstände' },
  { id: 'support', label: 'Unterstützung des Puckführers' },
  { id: 'options', label: 'verfügbare Optionen' },
  { id: 'unclear', label: 'noch unklar' },
]

const LEGACY_FIELD_KEYS = [
  'initiatorRole',
  'supportType',
  'structureType',
  'availableOption',
  'optionType',
  'optionCount',
  'executedAction',
  'optionVisibility',
  'spaceAvailable',
  'timeAvailable',
  'influencingFactor',
  'supportContinuity',
  'optionContinuity',
  'structureState',
] as const

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

function isUnclear(id: string): boolean {
  return id === 'unclear' || id === 'unsure'
}

function filterUnclear(options: LabeledOption[], supportsUnclear: boolean): LabeledOption[] {
  return supportsUnclear ? options : options.filter((option) => !isUnclear(option.id))
}

function parseLayer(raw: unknown, supportsUnclear: boolean): TacticalObservationLayer | null {
  const row = asRecord(raw)
  const id = asString(row.id)
  const fieldKey = asString(row.fieldKey || row.field_key)
  const prompt = asString(row.prompt)
  const resultTitle = asString(row.resultTitle || row.result_title)
  const options = filterUnclear(asOptions(row.options, []), supportsUnclear)
  if (!id || !fieldKey || !prompt || !resultTitle || !options.length) return null
  return {
    id,
    fieldKey,
    prompt,
    resultTitle,
    options,
    hint: asString(row.hint) || undefined,
    guideTitle: asString(row.guideTitle || row.guide_title) || undefined,
    showInGuide: row.showInGuide === true || row.show_in_guide === true,
  }
}

type LayerBlueprint = {
  id: string
  fieldKey: string
  optionsKey: string
  promptKey: string
  resultTitleKey: string
  hintKey?: string
  guideTitleKey?: string
  showInGuide?: boolean
  defaultOptions: LabeledOption[]
  defaultPrompt: string
  defaultResultTitle: string
  defaultHint?: string
  defaultGuideTitle?: string
}

const LAYER_BLUEPRINTS: LayerBlueprint[] = [
  {
    id: 'initiator_role',
    fieldKey: 'initiatorRole',
    optionsKey: 'initiatorOptions',
    promptKey: 'initiatorPrompt',
    resultTitleKey: 'initiatorTitle',
    defaultOptions: DEFAULT_INITIATORS,
    defaultPrompt: 'Wer startet die Aktion?',
    defaultResultTitle: 'Start der Aktion',
  },
  {
    id: 'support_structure',
    fieldKey: 'supportType',
    optionsKey: 'supportOptions',
    promptKey: 'supportPrompt',
    resultTitleKey: 'supportTitle',
    defaultOptions: DEFAULT_SUPPORT,
    defaultPrompt: 'Welche Unterstützung ist vorhanden?',
    defaultResultTitle: 'Unterstützung',
  },
  {
    id: 'structure_type',
    fieldKey: 'structureType',
    optionsKey: 'structureOptions',
    promptKey: 'structurePrompt',
    resultTitleKey: 'structureTitle',
    hintKey: 'structureHint',
    guideTitleKey: 'structureGuideTitle',
    showInGuide: true,
    defaultOptions: DEFAULT_STRUCTURES,
    defaultPrompt: 'Welche Grundstruktur erkennst du?',
    defaultResultTitle: 'Struktur',
    defaultHint: 'Du liest eine Situation als Zusammenspiel mehrerer Spieler — ohne Qualität zu bewerten.',
    defaultGuideTitle: 'Grundstruktur',
  },
  {
    id: 'available_option',
    fieldKey: 'availableOption',
    optionsKey: 'availableOptionOptions',
    promptKey: 'availableOptionPrompt',
    resultTitleKey: 'availableOptionTitle',
    defaultOptions: [
      { id: 'center', label: 'Center' },
      { id: 'wing', label: 'Wing' },
      { id: 'defense', label: 'Defense' },
      { id: 'multiple', label: 'mehrere Optionen' },
      { id: 'none', label: 'keine klare Option' },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Welche Option erkennst du?',
    defaultResultTitle: 'Erkannte Option',
  },
  {
    id: 'option_type',
    fieldKey: 'optionType',
    optionsKey: 'optionTypeOptions',
    promptKey: 'optionTypePrompt',
    resultTitleKey: 'optionTypeTitle',
    showInGuide: true,
    defaultOptions: [
      {
        id: 'direct_option',
        label: 'Direkte Option',
        summaryLabel: 'Direkte Optionen',
        hint: 'Der Spieler kann unmittelbar angespielt werden.',
      },
      {
        id: 'next_option',
        label: 'Weiterführende Option',
        summaryLabel: 'Weiterführende Optionen',
        hint: 'Die Option ermöglicht eine nächste Aktion.',
      },
      {
        id: 'safety_option',
        label: 'Sicherheitsoption',
        summaryLabel: 'Sicherheitsoptionen',
        hint: 'Die Option hält die Aktion stabil oder ermöglicht einen Rückpass.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Welche Art von Option ist es?',
    defaultResultTitle: 'Optionstyp',
    defaultGuideTitle: 'Optionstypen',
  },
  {
    id: 'option_count',
    fieldKey: 'optionCount',
    optionsKey: 'optionCountOptions',
    promptKey: 'optionCountPrompt',
    resultTitleKey: 'optionCountTitle',
    defaultOptions: [
      { id: 'one_clear', label: 'eine klare Option' },
      { id: 'multiple', label: 'mehrere Optionen' },
      { id: 'none', label: 'keine klare Option' },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Wie viele Möglichkeiten erkennst du?',
    defaultResultTitle: 'Entscheidungsraum',
  },
  {
    id: 'executed_action',
    fieldKey: 'executedAction',
    optionsKey: 'executedActionOptions',
    promptKey: 'executedActionPrompt',
    resultTitleKey: 'executedActionTitle',
    showInGuide: true,
    defaultOptions: [
      { id: 'pass', label: 'Pass', hint: 'Der Puck wird zu einem Mitspieler gespielt.' },
      { id: 'carry', label: 'Carry', hint: 'Der Spieler führt den Puck selbst weiter.' },
      { id: 'dump', label: 'Dump', hint: 'Der Puck wird tief oder in den Raum gespielt.' },
      { id: 'reset', label: 'Reset', hint: 'Die Aktion wird zurückgesetzt, z. B. Rückpass.' },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Welche Aktion wurde ausgeführt?',
    defaultResultTitle: 'Ausgeführte Aktion',
    defaultGuideTitle: 'Aktionen',
  },
  {
    id: 'option_visibility',
    fieldKey: 'optionVisibility',
    optionsKey: 'optionVisibilityOptions',
    promptKey: 'optionVisibilityPrompt',
    resultTitleKey: 'optionVisibilityTitle',
    defaultOptions: [
      {
        id: 'clearly_visible',
        label: 'Ja, klar sichtbar',
        summaryLabel: 'Klar sichtbar',
        hint: 'Die genutzte Möglichkeit war vor der Aktion erkennbar.',
      },
      {
        id: 'partially_visible',
        label: 'Teilweise sichtbar',
        summaryLabel: 'Teilweise sichtbar',
        hint: 'Die Möglichkeit war angedeutet, aber nicht eindeutig.',
      },
      {
        id: 'surprising',
        label: 'Überraschende Aktion',
        summaryLabel: 'Überraschend',
        hint: 'Die Aktion war aus der sichtbaren Struktur nicht klar vorbereitet.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'War diese Möglichkeit vorher sichtbar?',
    defaultResultTitle: 'Sichtbarkeit',
  },
  {
    id: 'space_available',
    fieldKey: 'spaceAvailable',
    optionsKey: 'spaceAvailableOptions',
    promptKey: 'spaceAvailablePrompt',
    resultTitleKey: 'spaceAvailableTitle',
    hintKey: 'spaceAvailableHint',
    guideTitleKey: 'spaceAvailableGuideTitle',
    showInGuide: true,
    defaultOptions: [
      {
        id: 'much_space',
        label: 'viel Raum',
        summaryLabel: 'Viel Raum',
        hint: 'Es gibt klar nutzbaren Raum für die Aktion.',
      },
      {
        id: 'limited_space',
        label: 'begrenzter Raum',
        summaryLabel: 'Begrenzter Raum',
        hint: 'Raum ist vorhanden, aber eingeschränkt.',
      },
      {
        id: 'little_space',
        label: 'wenig Raum',
        summaryLabel: 'Wenig Raum',
        hint: 'Der verfügbare Raum ist eng.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Wie viel Raum steht zur Verfügung?',
    defaultResultTitle: 'Raum',
    defaultGuideTitle: 'Raum',
    defaultHint: 'Du nimmst Raum wahr — ohne ihn als gut oder schlecht zu bewerten.',
  },
  {
    id: 'time_available',
    fieldKey: 'timeAvailable',
    optionsKey: 'timeAvailableOptions',
    promptKey: 'timeAvailablePrompt',
    resultTitleKey: 'timeAvailableTitle',
    defaultOptions: [
      {
        id: 'much_time',
        label: 'viel Zeit',
        summaryLabel: 'Viel Zeit',
        hint: 'Der Spieler hat genug Zeit für die Aktion.',
      },
      {
        id: 'short_window',
        label: 'kurzes Zeitfenster',
        summaryLabel: 'Kurzes Zeitfenster',
        hint: 'Es gibt nur ein kurzes Fenster für die Aktion.',
      },
      {
        id: 'under_pressure',
        label: 'unter Druck',
        summaryLabel: 'Unter Druck',
        hint: 'Zeitdruck beeinflusst die verfügbaren Möglichkeiten.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Wie viel Zeit hat der Spieler?',
    defaultResultTitle: 'Zeit',
  },
  {
    id: 'influencing_factor',
    fieldKey: 'influencingFactor',
    optionsKey: 'influencingFactorOptions',
    promptKey: 'influencingFactorPrompt',
    resultTitleKey: 'influencingFactorTitle',
    defaultOptions: [
      { id: 'space', label: 'Raum', hint: 'Raum beeinflusst die verfügbaren Möglichkeiten am stärksten.' },
      { id: 'time', label: 'Zeit', hint: 'Zeit beeinflusst die verfügbaren Möglichkeiten am stärksten.' },
      {
        id: 'opponent_pressure',
        label: 'Gegnerdruck',
        hint: 'Gegnerdruck verändert die verfügbaren Optionen am stärksten.',
      },
      {
        id: 'support',
        label: 'Unterstützung',
        hint: 'Unterstützung beeinflusst die verfügbaren Möglichkeiten am stärksten.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Was beeinflusst die Situation am stärksten?',
    defaultResultTitle: 'Hauptfaktor',
  },
  {
    id: 'support_continuity',
    fieldKey: 'supportContinuity',
    optionsKey: 'supportContinuityOptions',
    promptKey: 'supportContinuityPrompt',
    resultTitleKey: 'supportContinuityTitle',
    defaultOptions: [
      {
        id: 'maintained',
        label: 'bleibt erhalten',
        summaryLabel: 'Bleibt erhalten',
        hint: 'Beziehungen und Unterstützung bleiben nach der Aktion lesbar.',
      },
      {
        id: 'partial',
        label: 'teilweise erhalten',
        summaryLabel: 'Teilweise erhalten',
        hint: 'Ein Teil der Unterstützung bleibt, ein Teil verändert sich.',
      },
      {
        id: 'lost',
        label: 'verliert sich',
        summaryLabel: 'Verliert sich',
        hint: 'Die vorherige Unterstützung ist nach der Aktion nicht mehr klar lesbar.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Bleibt die Unterstützung erhalten?',
    defaultResultTitle: 'Unterstützung',
  },
  {
    id: 'option_continuity',
    fieldKey: 'optionContinuity',
    optionsKey: 'optionContinuityOptions',
    promptKey: 'optionContinuityPrompt',
    resultTitleKey: 'optionContinuityTitle',
    defaultOptions: [
      {
        id: 'multiple_remain',
        label: 'mehrere Optionen bleiben',
        summaryLabel: 'Mehrere bleiben',
        hint: 'Nach der Aktion bleiben mehrere Handlungsmöglichkeiten sichtbar.',
      },
      {
        id: 'one_remains',
        label: 'eine Option bleibt',
        summaryLabel: 'Eine bleibt',
        hint: 'Nach der Aktion bleibt eine klare Möglichkeit.',
      },
      {
        id: 'few_options',
        label: 'wenige Optionen',
        summaryLabel: 'Wenige Optionen',
        hint: 'Nach der Aktion sind kaum noch Möglichkeiten lesbar.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Bleiben Optionen vorhanden?',
    defaultResultTitle: 'Optionen',
  },
  {
    id: 'structure_state',
    fieldKey: 'structureState',
    optionsKey: 'structureStateOptions',
    promptKey: 'structureStatePrompt',
    resultTitleKey: 'structureStateTitle',
    hintKey: 'structureStateHint',
    guideTitleKey: 'structureStateGuideTitle',
    showInGuide: true,
    defaultOptions: [
      {
        id: 'stable',
        label: 'stabil',
        summaryLabel: 'Stabil',
        hint: 'Die Struktur bleibt über die Aktion hinweg lesbar erhalten.',
      },
      {
        id: 'changing',
        label: 'verändert sich',
        summaryLabel: 'Verändert sich',
        hint: 'Die Struktur verändert sich, bleibt aber als Struktur lesbar.',
      },
      {
        id: 'breaking_down',
        label: 'zerfällt',
        summaryLabel: 'Zerfällt',
        hint: 'Die vorherige Struktur löst sich auf — ohne Qualitätsurteil.',
      },
      { id: 'unclear', label: 'Unklar' },
    ],
    defaultPrompt: 'Wie entwickelt sich die Struktur?',
    defaultResultTitle: 'Entwicklung',
    defaultGuideTitle: 'Strukturentwicklung',
    defaultHint: 'Du verfolgst die Struktur über die Aktion hinweg — ohne sie als gut oder schlecht zu bewerten.',
  },
]

function blueprintLayer(
  blueprint: LayerBlueprint,
  raw: Record<string, unknown>,
  supportsUnclear: boolean,
): TacticalObservationLayer {
  const snake = blueprint.optionsKey.replace(/([A-Z])/g, '_$1').toLowerCase()
  const options = filterUnclear(
    asOptions(raw[blueprint.optionsKey] || raw[snake], blueprint.defaultOptions),
    supportsUnclear,
  )
  const promptSnake = blueprint.promptKey.replace(/([A-Z])/g, '_$1').toLowerCase()
  const titleSnake = blueprint.resultTitleKey.replace(/([A-Z])/g, '_$1').toLowerCase()
  return {
    id: blueprint.id,
    fieldKey: blueprint.fieldKey,
    prompt: asString(raw[blueprint.promptKey] || raw[promptSnake], blueprint.defaultPrompt),
    resultTitle: asString(raw[blueprint.resultTitleKey] || raw[titleSnake], blueprint.defaultResultTitle),
    options,
    hint: blueprint.hintKey
      ? asString(raw[blueprint.hintKey] || raw[blueprint.hintKey.replace(/([A-Z])/g, '_$1').toLowerCase()], blueprint.defaultHint)
      : undefined,
    guideTitle: blueprint.guideTitleKey
      ? asString(raw[blueprint.guideTitleKey] || raw[blueprint.guideTitleKey.replace(/([A-Z])/g, '_$1').toLowerCase()], blueprint.defaultGuideTitle)
      : undefined,
    showInGuide: blueprint.showInGuide,
  }
}

function resolveLayers(raw: Record<string, unknown>, supportsUnclear: boolean): TacticalObservationLayer[] {
  if (Array.isArray(raw.layers) && raw.layers.length) {
    const parsed = raw.layers
      .map((layer) => parseLayer(layer, supportsUnclear))
      .filter((layer): layer is TacticalObservationLayer => Boolean(layer))
    if (parsed.length) return parsed
  }

  const requestedIds = Array.isArray(raw.observationLayers || raw.observation_layers)
    ? (raw.observationLayers || raw.observation_layers) as unknown[]
    : null

  if (requestedIds?.length) {
    const parsed: TacticalObservationLayer[] = []
    for (const item of requestedIds) {
      const id = asString(item)
      const blueprint = LAYER_BLUEPRINTS.find((entry) => entry.id === id)
      if (blueprint) parsed.push(blueprintLayer(blueprint, raw, supportsUnclear))
    }
    if (parsed.length) return parsed
  }

  return [
    blueprintLayer(LAYER_BLUEPRINTS[0], raw, supportsUnclear),
    blueprintLayer(LAYER_BLUEPRINTS[1], raw, supportsUnclear),
    blueprintLayer(LAYER_BLUEPRINTS[2], raw, supportsUnclear),
  ]
}

export function emptyTacticalDraft(cfg: Pick<TacticalObservationConfig, 'layers'>): TacticalObservationDraft {
  const draft: TacticalObservationDraft = {}
  for (const layer of cfg.layers) draft[layer.fieldKey] = ''
  return draft
}

export function resolveTacticalObservationConfig(raw: Record<string, unknown> = {}): TacticalObservationConfig {
  const mechanic = asString(raw.mechanic)
  const enabled = mechanic === 'tactical_observation'
  const minObservations = asPositiveInt(raw.minObservations ?? raw.min_observations, 3)
  const recommendedObservations = Math.max(
    minObservations,
    asPositiveInt(raw.recommendedObservations ?? raw.recommended_observations, Math.max(minObservations, 5)),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    asPositiveInt(raw.maxObservations ?? raw.max_observations, Math.max(recommendedObservations, 6)),
  )
  const supportsUnclear = asBool(raw.supportsUnclear ?? raw.supports_unclear, true)
  const countNoun = asString(raw.countNoun || raw.count_noun, 'Situationen')
  const situationLabel = asString(raw.situationLabel || raw.situation_label, 'Situation')
  const layers = resolveLayers(raw, supportsUnclear)

  return {
    mechanic: 'tactical_observation',
    required: enabled,
    situationLabel,
    minObservations,
    recommendedObservations,
    maxObservations,
    supportsUnclear,
    layers,
    guideLayerId: asString(raw.guideLayerId || raw.guide_layer_id) || undefined,
    varietyLayerId: asString(raw.varietyLayerId || raw.variety_layer_id) || undefined,
    varietyFallback: asString(
      raw.varietyFallback || raw.variety_fallback,
      'Dieselbe Spielsituation kann von Moment zu Moment anders aussehen.',
    ),
    whyThisDrill: asString(raw.whyThisDrill || raw.why_this_drill),
    scanButtonLabel: asString(raw.scanButtonLabel || raw.scan_button_label, '+ Situation'),
    saveButtonLabel: asString(raw.saveButtonLabel || raw.save_button_label, 'Situation speichern'),
    countNoun,
    countNounSingular: asString(
      raw.countNounSingular || raw.count_noun_singular,
      countNoun === 'Situationen' ? 'Situation' : countNoun.replace(/en$/, ''),
    ),
    patternPrompt: asString(
      raw.patternPrompt || raw.pattern_prompt,
      'Was hat dir geholfen, die Struktur zu erkennen?',
    ),
    patternOptions: asOptions(raw.patternOptions || raw.pattern_options, DEFAULT_PATTERNS),
    patternRequiredMessage: asString(
      raw.patternRequiredMessage || raw.pattern_required_message,
      'Bitte beantworte, was dir geholfen hat, die Struktur zu erkennen.',
    ),
    closingNoteLabel: asString(raw.closingNoteLabel || raw.closing_note_label, 'Notiz (optional)'),
    closingNotePlaceholder: asString(
      raw.closingNotePlaceholder || raw.closing_note_placeholder,
      'Optional. Ohne zu bewerten, ob die Struktur gut oder schlecht war.',
    ),
    handoffText: asString(raw.handoffText || raw.handoff_text),
    decisionRule: asString(
      raw.decisionRule || raw.decision_rule,
      'Erkenne die Struktur, die vor einer Aktion entsteht — nicht die Qualität der Aktion.',
    ),
    coreHint: asString(
      raw.coreHint || raw.core_hint,
      'Einzelne Spieler ergeben zusammen eine Struktur. Du musst sie noch nicht bewerten.',
    ),
    collectEyebrow: asString(raw.collectEyebrow || raw.collect_eyebrow, 'Struktur erkennen'),
    reflectEyebrow: asString(raw.reflectEyebrow || raw.reflect_eyebrow, 'Situation lesen'),
    resultTitle: asString(raw.resultTitle || raw.result_title, 'Deine Beobachtungen'),
    incompleteObservationMessage: asString(
      raw.incompleteObservationMessage || raw.incomplete_observation_message,
      'Bitte wähle für jede Situation alle Beobachtungsebenen.',
    ),
    logsKey: asString(raw.observations_key || raw.logsKey || raw.logs_key, 'tactical_observation_observations'),
    resultKey: asString(raw.resultKey || raw.result_key, 'tactical_observation_result'),
    payloadKey: asString(raw.payloadKey || raw.payload_key, 'tactical_observation_payload'),
    stageKey: asString(raw.stageKey || raw.stage_key, '__tactical_observation_stage'),
    draftKey: asString(raw.draftKey || raw.draft_key, '__tactical_observation_draft'),
    addingMoreKey: asString(raw.addingMoreKey || raw.adding_more_key, '__tactical_observation_adding_more'),
    editIndexKey: asString(raw.editIndexKey || raw.edit_index_key, '__tactical_observation_edit_index'),
    patternKey: asString(raw.patternKey || raw.pattern_key, 'structureRecognitionHelp'),
    closingNoteKey: asString(raw.closingNoteKey || raw.closing_note_key, 'tacticalObservationNote'),
  }
}

export function readTacticalStage(answers: Record<string, unknown>, stageKey: string): TacticalObservationStage {
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

export function getObservationValue(
  observation: TacticalObservation,
  fieldKey: string,
): string {
  const values = observation.values || {}
  if (asString(values[fieldKey])) return asString(values[fieldKey])
  const legacy = observation as Record<string, unknown>
  if (asString(legacy[fieldKey])) return asString(legacy[fieldKey])
  return ''
}

export function normalizeObservation(observation: TacticalObservation): TacticalObservation {
  const values = { ...(observation.values || {}) }
  for (const fieldKey of LEGACY_FIELD_KEYS) {
    if (!asString(values[fieldKey])) {
      const legacyValue = getObservationValue(observation, fieldKey)
      if (legacyValue) values[fieldKey] = legacyValue
    }
  }
  return { ...observation, values }
}

export function describeLayerVariety(
  counts: Record<string, number>,
  varietyLead?: string,
  fallback = 'Dieselbe Spielsituation kann von Moment zu Moment anders aussehen.',
): string {
  const named = Object.entries(counts).filter(([id, count]) => count > 0 && !isUnclear(id))
  if (varietyLead) return varietyLead
  if (named.length >= 2) return 'Du hast unterschiedliche Situationsstrukturen beobachtet.'
  return fallback
}

/** @deprecated use describeLayerVariety */
export function describeStructureVariety(structureCounts: Record<string, number>): string {
  return describeLayerVariety(structureCounts)
}

export function computeTacticalObservationResult(
  observations: TacticalObservation[],
  cfg: Pick<TacticalObservationConfig, 'layers' | 'varietyLayerId' | 'varietyFallback'>,
): TacticalObservationResult {
  const layerCounts: Record<string, Record<string, number>> = {}
  for (const layer of cfg.layers) {
    layerCounts[layer.fieldKey] = {}
    for (const option of layer.options) layerCounts[layer.fieldKey][option.id] = 0
  }
  let unclearCount = 0
  for (const raw of observations) {
    const observation = normalizeObservation(raw)
    let observationUnclear = false
    for (const layer of cfg.layers) {
      const key = asString(getObservationValue(observation, layer.fieldKey))
      if (key) layerCounts[layer.fieldKey][key] = (layerCounts[layer.fieldKey][key] || 0) + 1
      if (isUnclear(key)) observationUnclear = true
    }
    if (observationUnclear) unclearCount += 1
  }
  const varietyLayer = cfg.layers.find((layer) => layer.id === cfg.varietyLayerId)
    || cfg.layers.find((layer) => layer.id === 'structure_type')
    || cfg.layers.find((layer) => layer.id === 'option_type')
    || cfg.layers[cfg.layers.length - 1]
  const varietyCounts = varietyLayer ? layerCounts[varietyLayer.fieldKey] || {} : {}
  return {
    observationCount: observations.length,
    layerCounts,
    unclearCount,
    varietyMessage: describeLayerVariety(varietyCounts, undefined, cfg.varietyFallback),
  }
}

export function resultHasNumericScore(result: TacticalObservationResult): boolean {
  const record = result as TacticalObservationResult & Record<string, unknown>
  return 'accuracy' in record || 'accuracyPercent' in record || 'score' in record || 'hockeyIQ' in record
}

export function toReflectionPayload(
  cfg: Pick<TacticalObservationConfig, 'situationLabel'>,
  result: TacticalObservationResult,
  extras: { patternNoticed?: string; closingNote?: string },
): TacticalObservationPayload {
  return {
    situationLabel: cfg.situationLabel,
    observationCount: result.observationCount,
    layerCounts: result.layerCounts,
    unclearCount: result.unclearCount,
    patternNoticed: asString(extras.patternNoticed),
    closingNote: asString(extras.closingNote),
  }
}

export function draftToObservation(
  draft: TacticalObservationDraft,
  cfg: Pick<TacticalObservationConfig, 'layers'>,
  index: number,
  existing?: TacticalObservation,
): TacticalObservation | null {
  const values: Record<string, string> = {}
  for (const layer of cfg.layers) {
    const value = asString(draft[layer.fieldKey])
    if (!value) return null
    values[layer.fieldKey] = value
  }
  return {
    id: existing?.id || `tactical_obs_${Date.now()}_${index}`,
    order: index + 1,
    values,
    period: existing?.period,
    gameClock: existing?.gameClock,
    note: existing?.note,
    sceneId: existing?.sceneId,
  }
}

export function observationToDraft(
  observation: TacticalObservation,
  cfg: Pick<TacticalObservationConfig, 'layers'>,
): TacticalObservationDraft {
  const normalized = normalizeObservation(observation)
  const draft: TacticalObservationDraft = {}
  for (const layer of cfg.layers) {
    draft[layer.fieldKey] = getObservationValue(normalized, layer.fieldKey)
  }
  return draft
}

export function validateTacticalObservationAnswers(
  cfg: TacticalObservationConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as TacticalObservation[])
    : []
  if (!canEvaluateObservations(observations.length, cfg.minObservations)) {
    return `Bitte mache mindestens ${cfg.minObservations} ${cfg.countNoun}.`
  }
  const incomplete = observations.some((raw) => {
    const observation = normalizeObservation(raw)
    return cfg.layers.some((layer) => !asString(getObservationValue(observation, layer.fieldKey)))
  })
  if (incomplete) return cfg.incompleteObservationMessage
  if (cfg.patternOptions.length && !asString(answers[cfg.patternKey])) {
    return cfg.patternRequiredMessage
  }
  if (readTacticalStage(answers, cfg.stageKey) !== 'complete') {
    return 'Bitte schließe die Beobachtungen vollständig ab.'
  }
  return null
}

export function isTacticalObservationComplete(
  cfg: TacticalObservationConfig,
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return validateTacticalObservationAnswers(cfg, answers) === null
}

export function findCompletedTacticalAnswers(
  cfg: TacticalObservationConfig,
  currentAnswers: Record<string, unknown> | null | undefined,
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> } | null,
): Record<string, unknown> | null {
  if (isTacticalObservationComplete(cfg, currentAnswers)) return currentAnswers || null
  const drafts = session?.drafts && typeof session.drafts === 'object'
    ? Object.values(session.drafts)
    : []
  for (const draft of drafts) {
    if (draft && typeof draft === 'object' && isTacticalObservationComplete(cfg, draft as Record<string, unknown>)) {
      return draft as Record<string, unknown>
    }
  }
  for (const checkin of session?.checkins || []) {
    if (isTacticalObservationComplete(cfg, checkin?.answers)) {
      return checkin.answers || null
    }
  }
  return null
}

export function findGuideLayer(cfg: TacticalObservationConfig): TacticalObservationLayer | undefined {
  if (cfg.guideLayerId) {
    return cfg.layers.find((layer) => layer.id === cfg.guideLayerId)
  }
  return cfg.layers.find((layer) => layer.showInGuide)
}
