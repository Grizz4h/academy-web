import type { PatternLogOption } from '../patternLog/types'
import type {
  AlternativeOccurred,
  BranchTrigger,
  LinearThinkingAssessment,
  ScenarioBranch,
  ScenarioBranchConfig,
  ScenarioBranchRead,
  ScenarioBranchResult,
  TriggerRelevant,
} from './types'

const TRIGGER_RELEVANT_SET = new Set<TriggerRelevant>(['yes', 'partly', 'no', 'unclear'])
const ALTERNATIVE_OCCURRED_SET = new Set<AlternativeOccurred>(['yes', 'no'])
const LINEAR_SET = new Set<LinearThinkingAssessment>(['rarely', 'sometimes', 'often', 'unclear'])

export const TRIGGER_RELEVANT_LABELS: Record<TriggerRelevant, string> = {
  yes: 'Ja',
  partly: 'Teilweise',
  no: 'Nein',
  unclear: 'Unklar',
}

export const LINEAR_THINKING_LABELS: Record<LinearThinkingAssessment, string> = {
  rarely: 'selten',
  sometimes: 'manchmal',
  often: 'häufig',
  unclear: 'unklar',
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

export function createTriggerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `trg_${crypto.randomUUID()}`
  }
  return `trg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function emptyTrigger(cueCategory?: string): BranchTrigger {
  return {
    id: createTriggerId(),
    description: '',
    cueCategory: cueCategory || undefined,
  }
}

export function resolveScenarioBranchConfig(raw: Record<string, unknown> = {}): ScenarioBranchConfig {
  const mechanic = String(raw.mechanic || '')
  const enabled = mechanic === 'scenario_branches'
    || mechanic === 'scenario_branch'
    || raw.supportsScenarioBranches === true
    || raw.supports_scenario_branches === true
  const minTriggers = enabled
    ? Math.max(1, Number(raw.minTriggers || raw.min_triggers || 1))
    : 0
  const maxTriggers = Math.max(
    minTriggers || 1,
    Number(raw.maxTriggers || raw.max_triggers || 3),
  )
  const allowAlternative = enabled && raw.allowAlternative !== false && raw.allow_alternative !== false
  const actionOptions = asStringArray(raw.actionOptions || raw.action_options || raw.expectedActionOptions || raw.expected_action_options)
  const triggerSuggestions = asStringArray(raw.triggerSuggestions || raw.trigger_suggestions)
  return {
    mechanic: 'scenario_branches',
    enabled,
    allowAlternative,
    minTriggers: enabled ? minTriggers : 0,
    maxTriggers: enabled ? maxTriggers : 0,
    actionOptions,
    triggerSuggestions,
  }
}

export function normalizeTriggers(triggers: BranchTrigger[] | undefined, maxTriggers: number): BranchTrigger[] {
  const next = (triggers || [])
    .map((item) => ({
      id: String(item?.id || createTriggerId()),
      description: String(item?.description || '').trim(),
      cueCategory: String(item?.cueCategory || '').trim() || undefined,
    }))
    .filter((item) => item.description)
  const cap = Math.max(0, maxTriggers)
  return cap ? next.slice(0, cap) : next
}

export function canAddTrigger(count: number, maxTriggers: number): boolean {
  return count < maxTriggers
}

export function canSaveTriggers(
  triggers: BranchTrigger[] | undefined,
  minTriggers: number,
  maxTriggers: number,
): boolean {
  const labeled = (triggers || [])
    .map((item) => String(item?.description || '').trim())
    .filter(Boolean)
  return labeled.length >= minTriggers && labeled.length <= maxTriggers
}

export function resolvedBranchAction(optionId: string, freeText: string, options: string[]): string {
  const text = String(freeText || '').trim()
  const id = String(optionId || '').trim()
  if (options.length === 0) return text
  if (options.includes(id)) return id
  return text
}

export function alternativeDiffersFromPrimary(primary: string, alternative: string): boolean {
  const left = String(primary || '').trim().toLowerCase()
  const right = String(alternative || '').trim().toLowerCase()
  if (!left || !right) return false
  return left !== right
}

export function canSaveAlternative(
  primary: string,
  alternative: string,
  enabled: boolean,
): boolean {
  if (!enabled) return true
  return alternativeDiffersFromPrimary(primary, alternative)
}

export function isTriggerRelevant(value: unknown): value is TriggerRelevant {
  return TRIGGER_RELEVANT_SET.has(value as TriggerRelevant)
}

export function isAlternativeOccurred(value: unknown): value is AlternativeOccurred {
  return ALTERNATIVE_OCCURRED_SET.has(value as AlternativeOccurred)
}

export function isLinearThinkingAssessment(value: unknown): value is LinearThinkingAssessment {
  return LINEAR_SET.has(value as LinearThinkingAssessment)
}

export function canSaveBranchReview(
  alternativeOccurred: string,
  triggerRelevant: string,
  enabled: boolean,
): boolean {
  if (!enabled) return true
  return isAlternativeOccurred(alternativeOccurred) && isTriggerRelevant(triggerRelevant)
}

export function triggerRelevantOptions(): Array<PatternLogOption<TriggerRelevant>> {
  return [
    { value: 'yes', label: TRIGGER_RELEVANT_LABELS.yes },
    { value: 'partly', label: TRIGGER_RELEVANT_LABELS.partly },
    { value: 'no', label: TRIGGER_RELEVANT_LABELS.no },
    { value: 'unclear', label: TRIGGER_RELEVANT_LABELS.unclear },
  ]
}

export function alternativeOccurredOptions(): Array<PatternLogOption<AlternativeOccurred>> {
  return [
    { value: 'yes', label: 'Ja' },
    { value: 'no', label: 'Nein' },
  ]
}

export function linearThinkingOptions(): Array<PatternLogOption<LinearThinkingAssessment>> {
  return [
    { value: 'rarely', label: LINEAR_THINKING_LABELS.rarely },
    { value: 'sometimes', label: LINEAR_THINKING_LABELS.sometimes },
    { value: 'often', label: LINEAR_THINKING_LABELS.often },
    { value: 'unclear', label: LINEAR_THINKING_LABELS.unclear },
  ]
}

export function triggerRelevantLabel(value?: string | null): string {
  if (isTriggerRelevant(value)) return TRIGGER_RELEVANT_LABELS[value]
  return ''
}

export function alternativeOccurredLabel(value?: string | null): string {
  if (value === 'yes') return 'Ja'
  if (value === 'no') return 'Nein'
  return ''
}

export function formatTriggerLine(trigger: BranchTrigger, categoryLabel?: (category: string) => string): string {
  const description = String(trigger.description || '').trim()
  const category = String(trigger.cueCategory || '').trim()
  if (!category) return description
  const label = categoryLabel ? categoryLabel(category) : category
  return `${label}: ${description}`
}

export function buildScenarioBranches(read: {
  id?: string
  expectedAction?: string
  alternativeAction?: string
  supportingCues?: Array<{ label?: string; category?: string }>
  branchTriggers?: BranchTrigger[]
  note?: string
}): ScenarioBranch[] {
  const primary = String(read.expectedAction || '').trim()
  const alternative = String(read.alternativeAction || '').trim()
  const prefix = String(read.id || 'read')
  const supportingCues = (read.supportingCues || [])
    .map((cue) => String(cue.label || '').trim())
    .filter(Boolean)
  const triggers = normalizeTriggers(read.branchTriggers, 99)
  const branches: ScenarioBranch[] = []
  if (primary) {
    branches.push({
      id: `${prefix}_primary`,
      action: primary,
      role: 'primary',
      supportingCues: supportingCues.length ? supportingCues : undefined,
      note: read.note,
    })
  }
  if (alternative) {
    branches.push({
      id: `${prefix}_alternative`,
      action: alternative,
      role: 'alternative',
      triggerConditions: triggers.map((item) => item.description),
      supportingCues: triggers.map((item) => item.cueCategory).filter((item): item is string => Boolean(item)),
    })
  }
  return branches
}

export function isCompleteScenarioBranchRead(
  read: ScenarioBranchRead,
  cfg: Pick<ScenarioBranchConfig, 'enabled' | 'minTriggers' | 'maxTriggers'>,
): boolean {
  if (!cfg.enabled) return true
  const primary = String(read.expectedAction || '').trim()
  const alternative = String(read.alternativeAction || '').trim()
  if (!alternativeDiffersFromPrimary(primary, alternative)) return false
  if (!canSaveTriggers(read.branchTriggers, cfg.minTriggers, cfg.maxTriggers)) return false
  if (!isAlternativeOccurred(read.alternativeOccurred)) return false
  if (!isTriggerRelevant(read.triggerRelevant)) return false
  return true
}

function countMap(values: string[]): Record<string, number> {
  const next: Record<string, number> = {}
  for (const value of values) {
    const key = String(value || '').trim()
    if (!key) continue
    next[key] = (next[key] || 0) + 1
  }
  return next
}

function rankedKeys(map: Record<string, number>): string[] {
  return Object.keys(map).sort((a, b) => (map[b] - map[a]) || a.localeCompare(b))
}

export function computeScenarioBranchResult(observations: ScenarioBranchRead[]): ScenarioBranchResult {
  const primaryActions = observations.map((item) => String(item.expectedAction || '').trim()).filter(Boolean)
  const alternativeActions = observations.map((item) => String(item.alternativeAction || '').trim()).filter(Boolean)
  const triggerDescriptions = observations.flatMap((item) => normalizeTriggers(item.branchTriggers, 99).map((trigger) => trigger.description))
  const commonPrimaryPatterns = countMap(primaryActions)
  const commonAlternativePatterns = countMap(alternativeActions)
  const commonTriggerPatterns = countMap(triggerDescriptions)
  return {
    observations,
    primaryActions: rankedKeys(commonPrimaryPatterns),
    alternativeActions: rankedKeys(commonAlternativePatterns),
    branchTriggeredCount: observations.filter((item) => item.alternativeOccurred === 'yes').length,
    triggerRecognizedCount: observations.filter((item) => item.triggerRelevant === 'yes').length,
    commonPrimaryPatterns,
    commonAlternativePatterns,
    commonTriggerPatterns,
  }
}

export function usedTriggerDescriptions(observations: ScenarioBranchRead[]): string[] {
  return rankedKeys(countMap(observations.flatMap((item) => (
    normalizeTriggers(item.branchTriggers, 99).map((trigger) => trigger.description)
  ))))
}

export function mostFrequentValue(map?: Record<string, number>): string {
  if (!map) return ''
  return rankedKeys(map)[0] || ''
}

/** Explicitly no probability or accuracy fields in the result artifact. */
export function resultHasProbabilityScore(result: ScenarioBranchResult): boolean {
  const record = result as ScenarioBranchResult & Record<string, unknown>
  return 'accuracy' in record
    || 'branchAccuracy' in record
    || 'predictionRating' in record
    || 'probability' in record
    || JSON.stringify(result).includes('%')
}

export function formatTriggerSummary(result: ScenarioBranchResult): string {
  const trigger = mostFrequentValue(result.commonTriggerPatterns)
  return trigger ? `Wenn: ${trigger}` : ''
}
