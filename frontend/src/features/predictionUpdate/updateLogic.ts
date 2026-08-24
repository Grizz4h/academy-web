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

const DECISION_SET = new Set<UpdateDecision>(['keep', 'change', 'no_new_info', 'unclear'])
const QUALITY_SET = new Set<UpdateQuality>([
  'appropriate',
  'after_confirmation',
  'too_late',
  'too_early',
  'not_updated',
  'unclear',
])

export const UPDATE_DECISION_LABELS: Record<UpdateDecision, string> = {
  keep: 'Ursprüngliche Erwartung beibehalten',
  change: 'Erwartung geändert',
  no_new_info: 'Keine relevante neue Information sichtbar',
  unclear: 'Nicht sicher beurteilbar',
}

export const UPDATE_QUALITY_LABELS: Record<UpdateQuality, string> = {
  appropriate: 'Bei Auftreten der neuen Information aktualisiert',
  after_confirmation: 'Erst nach weiterer Bestätigung aktualisiert',
  too_late: 'Erst aktualisiert, als die tatsächliche Aktion bereits erkennbar war',
  /** Legacy; gleiche Aussage wie after_confirmation — kein Speed-/Kompetenzscore. */
  too_early: 'Erst nach weiterer Bestätigung aktualisiert (Legacy)',
  not_updated: 'Nicht aktualisiert',
  unclear: 'Nicht sicher beurteilbar',
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
  const minRaw = Number(raw.minUpdateTriggers ?? raw.min_update_triggers ?? raw.minTriggers ?? 0)
  const minUpdateTriggers = enabled ? Math.max(0, Number.isFinite(minRaw) ? minRaw : 0) : 0
  const maxRaw = Number(raw.maxUpdateTriggers ?? raw.max_update_triggers ?? 1)
  const maxUpdateTriggers = enabled
    ? Math.max(Math.max(minUpdateTriggers, 1), Number.isFinite(maxRaw) ? maxRaw : 1)
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
    { value: 'no_new_info', label: UPDATE_DECISION_LABELS.no_new_info },
    { value: 'unclear', label: UPDATE_DECISION_LABELS.unclear },
  ]
}

export function updateQualityOptions(): Array<PatternLogOption<UpdateQuality>> {
  return [
    { value: 'appropriate', label: UPDATE_QUALITY_LABELS.appropriate },
    { value: 'after_confirmation', label: UPDATE_QUALITY_LABELS.after_confirmation },
    { value: 'too_late', label: UPDATE_QUALITY_LABELS.too_late },
    { value: 'not_updated', label: UPDATE_QUALITY_LABELS.not_updated },
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
  if (decision === 'unclear' || decision === 'no_new_info') {
    return true
  }
  if (decision === 'keep') {
    return !cfg.requireReasonOnKeep || Boolean(String(reason || '').trim())
  }
  const next = String(updatedPrediction || '').trim()
  if (!cfg.requireUpdatedPredictionOnChange) return Boolean(next)
  const initial = String(initialPrediction || '').trim()
  return Boolean(next) && next.toLowerCase() !== initial.toLowerCase()
}

/** Änderung braucht dokumentierten Auslöser; Beibehalten/keine neue Info/unklar nicht. */
export function triggersRequiredForDecision(decision: string): boolean {
  return decision === 'change'
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
  const minForDecision = triggersRequiredForDecision(decision) ? Math.max(1, cfg.minUpdateTriggers) : 0
  if (!canSaveUpdateTriggers(triggers, minForDecision, Math.max(cfg.maxUpdateTriggers, minForDecision))) return false
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
  if (triggersRequiredForDecision(decision) && !triggers.length) return null
  const updated = decision === 'keep' || decision === 'no_new_info' || decision === 'unclear'
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
  const keepCount = observations.filter((item) => {
    const d = item.updateDecision || item.predictionUpdate?.updateDecision
    return d === 'keep' || d === 'no_new_info'
  }).length
  const changeCount = observations.filter((item) => (item.updateDecision || item.predictionUpdate?.updateDecision) === 'change').length
  const updateQualityDistribution = {
    appropriate: 0,
    afterConfirmation: 0,
    tooLate: 0,
    tooEarly: 0,
    notUpdated: 0,
    unclear: 0,
  }
  const triggerDescriptions: string[] = []

  for (const item of observations) {
    const quality = item.updateQuality || item.predictionUpdate?.updateQuality
    if (quality === 'appropriate') updateQualityDistribution.appropriate += 1
    if (quality === 'after_confirmation') updateQualityDistribution.afterConfirmation += 1
    if (quality === 'too_late') updateQualityDistribution.tooLate += 1
    if (quality === 'too_early') updateQualityDistribution.tooEarly += 1
    if (quality === 'not_updated') updateQualityDistribution.notUpdated += 1
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
