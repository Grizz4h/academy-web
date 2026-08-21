import type { PatternLogOption } from '../patternLog/types'
import {
  canSaveTriggers,
  createTriggerId,
  emptyTrigger,
  normalizeTriggers,
} from '../scenarioBranches/branchLogic'
import type { BranchTrigger } from '../scenarioBranches/types'
import type {
  PredictionUpdate,
  PredictionUpdateConfig,
  PredictionUpdateRead,
  PredictionUpdateResult,
  UpdateCue,
  UpdateDecision,
  UpdateQuality,
} from './types'

const DECISION_SET = new Set<UpdateDecision>(['keep', 'change'])
const QUALITY_SET = new Set<UpdateQuality>(['appropriate', 'too_late', 'too_early', 'unclear'])

export const UPDATE_DECISION_LABELS: Record<UpdateDecision, string> = {
  keep: 'Erwartung bleibt',
  change: 'Erwartung ändern',
}

export const UPDATE_QUALITY_LABELS: Record<UpdateQuality, string> = {
  appropriate: 'Passend',
  too_late: 'Zu spät',
  too_early: 'Zu früh',
  unclear: 'Unklar',
}

export function isUpdateDecision(value: unknown): value is UpdateDecision {
  return DECISION_SET.has(value as UpdateDecision)
}

export function isUpdateQuality(value: unknown): value is UpdateQuality {
  return QUALITY_SET.has(value as UpdateQuality)
}

export function resolvePredictionUpdateConfig(raw: Record<string, unknown> = {}): PredictionUpdateConfig {
  const mechanic = String(raw.mechanic || '')
  const enabled = mechanic === 'prediction_update'
    || mechanic === 'belief_update'
    || raw.supportsPredictionUpdate === true
    || raw.supports_prediction_update === true
  const minUpdateTriggers = enabled
    ? Math.max(1, Number(raw.minUpdateTriggers || raw.min_update_triggers || raw.minTriggers || 1))
    : 0
  const maxUpdateTriggers = enabled
    ? Math.max(minUpdateTriggers, Number(raw.maxUpdateTriggers || raw.max_update_triggers || 1))
    : 0
  return {
    mechanic: 'prediction_update',
    enabled,
    minUpdateTriggers,
    maxUpdateTriggers,
    requireReasonOnKeep: raw.requireReasonOnKeep !== false && raw.require_reason_on_keep !== false,
    requireUpdatedPredictionOnChange: raw.requireUpdatedPredictionOnChange !== false && raw.require_updated_prediction_on_change !== false,
  }
}

export function updateDecisionOptions(): Array<PatternLogOption<UpdateDecision>> {
  return [
    { value: 'keep', label: UPDATE_DECISION_LABELS.keep },
    { value: 'change', label: UPDATE_DECISION_LABELS.change },
  ]
}

export function updateQualityOptions(): Array<PatternLogOption<UpdateQuality>> {
  return [
    { value: 'appropriate', label: UPDATE_QUALITY_LABELS.appropriate },
    { value: 'too_late', label: UPDATE_QUALITY_LABELS.too_late },
    { value: 'too_early', label: UPDATE_QUALITY_LABELS.too_early },
    { value: 'unclear', label: UPDATE_QUALITY_LABELS.unclear },
  ]
}

export function updateDecisionLabel(value?: string | null): string {
  if (isUpdateDecision(value)) return UPDATE_DECISION_LABELS[value]
  return ''
}

export function updateQualityLabel(value?: string | null): string {
  if (isUpdateQuality(value)) return UPDATE_QUALITY_LABELS[value]
  return ''
}

export function canSaveUpdateTriggers(
  triggers: BranchTrigger[] | undefined,
  minTriggers: number,
  maxTriggers: number,
): boolean {
  return canSaveTriggers(triggers, minTriggers, maxTriggers)
}

export function canSaveUpdateDecision(
  decision: string,
  initialPrediction: string,
  updatedPrediction: string,
  reason: string,
  cfg: Pick<PredictionUpdateConfig, 'enabled' | 'requireReasonOnKeep' | 'requireUpdatedPredictionOnChange'>,
): boolean {
  if (!cfg.enabled) return true
  if (!isUpdateDecision(decision)) return false
  if (decision === 'keep') {
    return !cfg.requireReasonOnKeep || Boolean(String(reason || '').trim())
  }
  const next = String(updatedPrediction || '').trim()
  if (!cfg.requireUpdatedPredictionOnChange) return Boolean(next)
  const initial = String(initialPrediction || '').trim()
  return Boolean(next) && next.toLowerCase() !== initial.toLowerCase()
}

export function canSaveUpdateQuality(value: string, enabled: boolean): boolean {
  if (!enabled) return true
  return isUpdateQuality(value)
}

export function isCompletePredictionUpdate(
  read: PredictionUpdateRead,
  cfg: Pick<PredictionUpdateConfig, 'enabled' | 'minUpdateTriggers' | 'maxUpdateTriggers' | 'requireReasonOnKeep' | 'requireUpdatedPredictionOnChange'>,
): boolean {
  if (!cfg.enabled) return true
  const initial = String(read.expectedAction || read.predictionUpdate?.initialPrediction || '').trim()
  const decision = String(read.updateDecision || read.predictionUpdate?.updateDecision || '')
  const updated = String(read.updatedPrediction || read.predictionUpdate?.updatedPrediction || '')
  const reason = String(read.updateReason || read.predictionUpdate?.reason || '')
  const triggers = read.updateTriggers || read.predictionUpdate?.updateTriggers || (
    read.predictionUpdate?.updateTrigger ? [read.predictionUpdate.updateTrigger] : []
  )
  if (!canSaveUpdateTriggers(triggers, cfg.minUpdateTriggers, cfg.maxUpdateTriggers)) return false
  if (!canSaveUpdateDecision(decision, initial, updated, reason, cfg)) return false
  if (!isUpdateQuality(read.updateQuality || read.predictionUpdate?.updateQuality)) return false
  return true
}

export function buildPredictionUpdate(read: {
  id?: string
  expectedAction?: string
  supportingCues?: UpdateCue[]
  updateTriggers?: BranchTrigger[]
  updateDecision?: UpdateDecision | string
  updatedPrediction?: string
  updateReason?: string
  updateQuality?: UpdateQuality | string
}): PredictionUpdate | null {
  const initial = String(read.expectedAction || '').trim()
  const decision = read.updateDecision
  if (!initial || !isUpdateDecision(decision)) return null
  const triggers = normalizeTriggers(read.updateTriggers, 99)
  if (!triggers.length) return null
  const updated = decision === 'keep'
    ? initial
    : (String(read.updatedPrediction || '').trim() || initial)
  return {
    id: `${String(read.id || createTriggerId())}_update`,
    initialPrediction: initial,
    initialCues: read.supportingCues || [],
    updateTrigger: triggers[0] || emptyTrigger(),
    updateTriggers: triggers,
    updatedPrediction: updated,
    updateDecision: decision,
    reason: String(read.updateReason || '').trim() || undefined,
    updateQuality: isUpdateQuality(read.updateQuality) ? read.updateQuality : undefined,
  }
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

export function computePredictionUpdateResult(observations: PredictionUpdateRead[]): PredictionUpdateResult {
  const keepCount = observations.filter((item) => (item.updateDecision || item.predictionUpdate?.updateDecision) === 'keep').length
  const changeCount = observations.filter((item) => (item.updateDecision || item.predictionUpdate?.updateDecision) === 'change').length
  const updateQualityDistribution = { appropriate: 0, tooLate: 0, tooEarly: 0, unclear: 0 }
  const triggerDescriptions: string[] = []

  for (const item of observations) {
    const quality = item.updateQuality || item.predictionUpdate?.updateQuality
    if (quality === 'appropriate') updateQualityDistribution.appropriate += 1
    if (quality === 'too_late') updateQualityDistribution.tooLate += 1
    if (quality === 'too_early') updateQualityDistribution.tooEarly += 1
    if (quality === 'unclear') updateQualityDistribution.unclear += 1
    const triggers = item.updateTriggers
      || item.predictionUpdate?.updateTriggers
      || (item.predictionUpdate?.updateTrigger ? [item.predictionUpdate.updateTrigger] : [])
    for (const trigger of normalizeTriggers(triggers, 99)) {
      triggerDescriptions.push(trigger.description)
    }
  }

  return {
    observations,
    totalUpdates: observations.length,
    keepCount,
    changeCount,
    updateQualityDistribution,
    commonUpdateTriggers: countMap(triggerDescriptions),
  }
}

export function usedUpdateTriggerDescriptions(observations: PredictionUpdateRead[]): string[] {
  const map = computePredictionUpdateResult(observations).commonUpdateTriggers || {}
  return Object.keys(map).sort((a, b) => (map[b] - map[a]) || a.localeCompare(b))
}

export function resultHasUpdateScore(result: PredictionUpdateResult): boolean {
  const record = result as PredictionUpdateResult & Record<string, unknown>
  return 'accuracy' in record
    || 'updateAccuracy' in record
    || 'reactivityScore' in record
    || JSON.stringify(result).includes('%')
}
