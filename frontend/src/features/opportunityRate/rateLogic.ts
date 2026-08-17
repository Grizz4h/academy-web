import { RATE_TEMPLATE_BY_ID, RATE_TEMPLATES } from './templates'
import type {
  CountOnlyReflection,
  OpportunityClarity,
  OpportunityDraft,
  OpportunityObservation,
  OpportunityRateConfig,
  OpportunityRateResult,
  OpportunityRateStage,
  OutcomeDistributionItem,
  RateDefinition,
  RateExamplesHelp,
  RateOutcomeDefinition,
  RateTemplate,
  SuitableRateExample,
} from './types'

export const UNCLEAR_OUTCOME_ID = 'unclear'

export function emptyOpportunityDraft(): OpportunityDraft {
  return {
    outcomeId: '',
    period: '',
    gameClock: '',
    description: '',
    sceneId: '',
  }
}

export function emptyCustomDefinition(): RateDefinition {
  return {
    opportunityLabel: '',
    targetEventLabel: '',
    question: '',
    outcomes: [
      { id: 'outcome_a', label: '' },
      { id: 'outcome_b', label: '' },
      { id: UNCLEAR_OUTCOME_ID, label: 'Unklar' },
    ],
    targetOutcomeId: 'outcome_a',
  }
}

export function resolveOpportunityRateConfig(raw: Record<string, unknown> = {}): OpportunityRateConfig {
  const minObservations = Math.max(1, Number(raw.minObservations || raw.min_observations || 6))
  const recommendedObservations = Math.max(
    minObservations,
    Number(raw.recommendedObservations || raw.recommended_observations || 8),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    Number(raw.maxObservations || raw.max_observations || 10),
  )
  const templateIds = Array.isArray(raw.templates)
    ? (raw.templates as string[]).filter(Boolean)
    : Array.isArray(raw.templateIds)
      ? (raw.templateIds as string[]).filter(Boolean)
      : RATE_TEMPLATES.map((item) => item.id)

  const definitionBlock = (raw.definition && typeof raw.definition === 'object'
    ? (raw.definition as Record<string, unknown>)
    : {})
  const trackerBlock = (raw.tracker && typeof raw.tracker === 'object'
    ? (raw.tracker as Record<string, unknown>)
    : {})

  return {
    mechanic: 'opportunity_rate',
    allowTemplates: definitionBlock.allowTemplates !== false && raw.allowTemplates !== false,
    allowCustomDefinition: definitionBlock.allowCustomDefinition !== false && raw.allowCustomDefinition !== false,
    minObservations: Number(trackerBlock.minObservations || minObservations),
    recommendedObservations: Number(trackerBlock.recommendedObservations || recommendedObservations),
    maxObservations: Number(trackerBlock.maxObservations || maxObservations),
    supportsGameClock: trackerBlock.supportsGameClock !== false && raw.supports_game_clock !== false && raw.supportsGameClock !== false,
    supportsSceneCapture: trackerBlock.supportsSceneCapture !== false && raw.supportsSceneCapture !== false,
    supportsUnclear: trackerBlock.supportsUnclear !== false && raw.supportsUnclear !== false,
    unclearOutcomeId: String(raw.unclearOutcomeId || raw.unclear_outcome_id || UNCLEAR_OUTCOME_ID),
    definitionKey: String(raw.definition_key || raw.definitionKey || 'opportunity_rate_definition'),
    logsKey: String(raw.logs_key || raw.logsKey || 'opportunity_rate_observations'),
    draftKey: String(raw.draft_key || raw.draftKey || '__opportunity_rate_draft'),
    stageKey: String(raw.stage_key || raw.stageKey || '__opportunity_rate_stage'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__opportunity_rate_edit_index'),
    addingMoreKey: String(raw.adding_more_key || raw.addingMoreKey || '__opportunity_rate_adding_more'),
    clarityKey: String(raw.clarity_key || raw.clarityKey || 'opportunityDefinitionClarity'),
    countOnlyKey: String(raw.count_only_key || raw.countOnlyKey || 'countOnlyReflection'),
    conclusionKey: String(raw.conclusion_key || raw.conclusionKey || 'userConclusion'),
    templateIds,
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Eine Anzahl wird erst analytisch interessant, wenn du weißt, aus wie vielen Möglichkeiten sie entstanden ist.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Der Nenner muss genauso sauber definiert sein wie das Target Event.',
    ),
    sampleLimitNote: String(
      raw.sample_limit_note
        || raw.sampleLimitNote
        || 'Diese Rate beschreibt deine beobachtete Stichprobe – nicht automatisch das generelle Verhalten des Teams.',
    ),
    conclusionHint: String(
      raw.conclusion_hint
        || raw.conclusionHint
        || 'Beginne möglichst mit „In meinen beobachteten Situationen …“. Vermeide „Das Team macht immer …“.',
    ),
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 20)),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

function resolveExamplesHelp(raw: Record<string, unknown>): RateExamplesHelp | null {
  const source = (raw.rate_examples || raw.rateExamples || raw.examples || null) as Record<string, unknown> | null
  if (!source || typeof source !== 'object') return null

  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable: SuitableRateExample[] = suitableRaw
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
    title: String(source.title || 'Welche Fragen eignen sich für eine Rate?'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Weniger geeignet'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function composeQuestion(opportunityLabel: string, targetEventLabel: string): string {
  const opportunity = String(opportunityLabel || '').trim() || 'Opportunities'
  const target = String(targetEventLabel || '').trim() || 'das Target Event'
  return `Von allen ${opportunity}: Wie viele enden als ${target}?`
}

export function ensureUnclearOutcome(
  outcomes: RateOutcomeDefinition[],
  unclearId = UNCLEAR_OUTCOME_ID,
): RateOutcomeDefinition[] {
  const next = outcomes.map((item) => ({ ...item }))
  const existing = next.find((item) => item.id === unclearId || item.label.trim().toLowerCase() === 'unklar')
  if (existing) {
    existing.id = unclearId
    if (!existing.label.trim()) existing.label = 'Unklar'
    return next
  }
  next.push({ id: unclearId, label: 'Unklar' })
  return next
}

export function cloneDefinition(definition: RateDefinition, unclearId = UNCLEAR_OUTCOME_ID): RateDefinition {
  const outcomes = ensureUnclearOutcome(definition.outcomes || [], unclearId)
  const opportunityLabel = String(definition.opportunityLabel || '').trim()
  const targetEventLabel = String(definition.targetEventLabel || '').trim()
  return {
    ...definition,
    opportunityLabel,
    targetEventLabel,
    outcomes,
    targetOutcomeId: definition.targetOutcomeId || outcomes[0]?.id || '',
    question: String(definition.question || '').trim() || composeQuestion(opportunityLabel, targetEventLabel),
  }
}

export function definitionFromTemplate(template: RateTemplate, unclearId = UNCLEAR_OUTCOME_ID): RateDefinition {
  return cloneDefinition({
    ...template.definition,
    templateId: template.id,
    questionManual: false,
    question: template.definition.question || composeQuestion(template.definition.opportunityLabel, template.definition.targetEventLabel),
  }, unclearId)
}

export function applyTemplateById(templateId: string, unclearId = UNCLEAR_OUTCOME_ID): RateDefinition | null {
  const template = RATE_TEMPLATE_BY_ID[templateId]
  if (!template) return null
  return definitionFromTemplate(template, unclearId)
}

export function createOutcomeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `outcome_${crypto.randomUUID()}`
  }
  return `outcome_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function addBlankOutcome(definition: RateDefinition, unclearId = UNCLEAR_OUTCOME_ID): RateDefinition {
  const outcomes = ensureUnclearOutcome(definition.outcomes || [], unclearId)
  const nextOutcome: RateOutcomeDefinition = { id: createOutcomeId(), label: '' }
  const unclearIdx = outcomes.findIndex((item) => item.id === unclearId)
  if (unclearIdx >= 0) outcomes.splice(unclearIdx, 0, nextOutcome)
  else outcomes.push(nextOutcome)
  return { ...definition, outcomes }
}

export function removeOutcome(
  definition: RateDefinition,
  outcomeId: string,
  unclearId = UNCLEAR_OUTCOME_ID,
): RateDefinition {
  if (outcomeId === unclearId || outcomeId === definition.targetOutcomeId) return definition
  const outcomes = definition.outcomes.filter((item) => item.id !== outcomeId)
  return { ...definition, outcomes: ensureUnclearOutcome(outcomes, unclearId) }
}

export function updateDefinitionLabels(
  definition: RateDefinition,
  patch: Partial<Pick<RateDefinition, 'opportunityLabel' | 'targetEventLabel' | 'question' | 'questionManual' | 'targetOutcomeId' | 'outcomes' | 'templateId'>>,
): RateDefinition {
  const next = { ...definition, ...patch }
  if (patch.question !== undefined) {
    next.questionManual = patch.questionManual ?? true
  } else if (!next.questionManual) {
    next.question = composeQuestion(next.opportunityLabel, next.targetEventLabel)
  }
  return next
}

export function formatRateFraction(targetCount: number, totalOpportunities: number): string {
  return `${targetCount} / ${totalOpportunities}`
}

export function formatObservationMeta(observation: OpportunityObservation): string {
  const clockParts = [observation.period, observation.gameClock].filter(Boolean)
  const suffix = clockParts.length ? ` · ${clockParts.join(' ')}` : ''
  return `#${observation.order}${suffix}`
}

export function removeObservationAt(
  observations: OpportunityObservation[],
  index: number,
): OpportunityObservation[] {
  return observations
    .filter((_, idx) => idx !== index)
    .map((item, idx) => ({ ...item, order: idx + 1 }))
}

export function invalidateObservationAt(
  observations: OpportunityObservation[],
  index: number,
): OpportunityObservation[] {
  return observations.map((item, idx) => (
    idx === index ? { ...item, validOpportunity: false } : item
  ))
}

export function templatesForConfig(cfg: Pick<OpportunityRateConfig, 'allowTemplates' | 'templateIds'>): RateTemplate[] {
  if (!cfg.allowTemplates) return []
  if (!cfg.templateIds.length) return RATE_TEMPLATES
  return cfg.templateIds.map((id) => RATE_TEMPLATE_BY_ID[id]).filter(Boolean)
}

export function isDefinitionReady(definition: RateDefinition | null | undefined, unclearId = UNCLEAR_OUTCOME_ID): boolean {
  if (!definition) return false
  if (!definition.opportunityLabel.trim()) return false
  if (!definition.targetEventLabel.trim()) return false
  const labeled = definition.outcomes.filter((item) => item.label.trim())
  if (labeled.length < 2) return false
  const target = labeled.find((item) => item.id === definition.targetOutcomeId)
  if (!target || target.id === unclearId) return false
  return Boolean(definition.question.trim())
}

export function validObservations(observations: OpportunityObservation[]): OpportunityObservation[] {
  return observations.filter((item) => item.validOpportunity !== false)
}

export function formatRatePercent(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) return 0
  return Math.round(rate * 100)
}

export function calculatePercentagePointDifference(rateA: number, rateB: number): number {
  if (!Number.isFinite(rateA) || !Number.isFinite(rateB)) return 0
  return Math.round((rateA - rateB) * 100)
}

export function computeOpportunityRate(
  definition: RateDefinition,
  observations: OpportunityObservation[],
  unclearId = UNCLEAR_OUTCOME_ID,
): OpportunityRateResult {
  const usable = validObservations(observations)
  const totalOpportunities = usable.length
  const targetCount = usable.filter((item) => item.outcomeId === definition.targetOutcomeId).length
  const unclearCount = usable.filter((item) => item.outcomeId === unclearId).length
  const rate = totalOpportunities > 0 ? targetCount / totalOpportunities : 0
  const outcomeDistribution: Record<string, number> = {}
  for (const outcome of definition.outcomes) {
    outcomeDistribution[outcome.id] = 0
  }
  for (const item of usable) {
    outcomeDistribution[item.outcomeId] = (outcomeDistribution[item.outcomeId] || 0) + 1
  }
  const distributionItems: OutcomeDistributionItem[] = definition.outcomes.map((outcome) => ({
    id: outcome.id,
    label: outcome.label,
    count: outcomeDistribution[outcome.id] || 0,
    isTarget: outcome.id === definition.targetOutcomeId,
    isUnclear: outcome.id === unclearId,
  }))

  return {
    definition,
    observations: usable,
    totalOpportunities,
    targetCount,
    rate,
    ratePercent: formatRatePercent(rate),
    outcomeDistribution,
    distributionItems,
    unclearCount,
  }
}

/** Shared name for D1/D2 — same implementation as computeOpportunityRate. */
export const calculateOpportunityRate = computeOpportunityRate

export function calculateOutcomeDistribution(
  definition: RateDefinition,
  observations: OpportunityObservation[],
  unclearId = UNCLEAR_OUTCOME_ID,
): OutcomeDistributionItem[] {
  return computeOpportunityRate(definition, observations, unclearId).distributionItems
}

export function canEvaluate(count: number, minObservations: number): boolean {
  return count >= minObservations
}

export function canAddOpportunity(count: number, maxObservations: number): boolean {
  return count < maxObservations
}

export function canSaveOpportunityDraft(
  draft: OpportunityDraft,
  definition: RateDefinition,
  supportsGameClock: boolean,
): boolean {
  if (!draft.outcomeId) return false
  if (!definition.outcomes.some((item) => item.id === draft.outcomeId)) return false
  if (supportsGameClock && draft.gameClock && !/^\d{1,2}(:\d{1,2})?$/.test(draft.gameClock.trim())) {
    return false
  }
  return true
}

export function createObservationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `opp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function readStage(answers: Record<string, unknown>, stageKey: string): OpportunityRateStage {
  const raw = String(answers[stageKey] || 'define')
  if (raw === 'observe' || raw === 'review' || raw === 'complete' || raw === 'define') return raw
  return 'define'
}

export function validateOpportunityRateAnswers(
  cfg: OpportunityRateConfig,
  answers: Record<string, unknown>,
): string | null {
  const definition = answers[cfg.definitionKey] as RateDefinition | undefined
  if (!isDefinitionReady(definition, cfg.unclearOutcomeId)) {
    return 'Bitte definiere Opportunity, Target Event und Outcomes.'
  }
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as OpportunityObservation[])
    : []
  const usable = validObservations(observations)
  if (usable.length < cfg.minObservations) {
    return `Bitte erfasse mindestens ${cfg.minObservations} Opportunities.`
  }
  if (usable.length > cfg.maxObservations) {
    return `Maximal ${cfg.maxObservations} Opportunities.`
  }
  if (!answers[cfg.countOnlyKey]) {
    return 'Bitte beantworte die kurze Reflexionsfrage zum reinen Zählen.'
  }
  const clarity = String(answers[cfg.clarityKey] || '') as OpportunityClarity | ''
  if (!clarity) {
    return 'Bitte bewerte, ob deine Opportunity-Definition eindeutig war.'
  }
  const conclusion = String(answers[cfg.conclusionKey] || '').trim()
  if (conclusion.length < cfg.summaryMinChars) {
    return 'Bitte formuliere dein Ergebnis in einem Satz.'
  }
  return null
}

export function countOnlyOptions(): Array<{ value: CountOnlyReflection; label: string }> {
  return [
    {
      value: 'missing_relative_frequency',
      label: 'Ich hätte nicht gewusst, wie häufig es relativ zu allen Möglichkeiten war.',
    },
    {
      value: 'would_overestimate',
      label: 'Ich hätte die Häufigkeit leicht überschätzt.',
    },
    {
      value: 'difference_small',
      label: 'Der Unterschied wäre gering gewesen.',
    },
    {
      value: 'unclear',
      label: 'Unklar.',
    },
  ]
}

export function clarityOptions(): Array<{ value: OpportunityClarity; label: string }> {
  return [
    { value: 'yes', label: 'Ja' },
    { value: 'mostly', label: 'Meistens' },
    { value: 'partly', label: 'Teilweise' },
    { value: 'no', label: 'Nein' },
  ]
}
