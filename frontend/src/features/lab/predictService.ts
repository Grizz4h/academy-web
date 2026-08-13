import type { PredictionEntry, PredictionSessionSummary, Session } from '../../api'
import { comparePredictionForTemplate, countValues, matchToResolution, usesExactCompare } from './predictCompare'
import type { PredictionTemplate } from './types'

function mostFrequent(values: string[]): string | undefined {
  if (!values.length) return undefined
  const totals = countValues(values)
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function createPredictionEntry(params: {
  session: Session
  templateId: string
  categoryId: string
  predictedValue: string
  confidence: 'low' | 'medium' | 'high'
  period: number
  order?: number
  gameTime?: string
  note?: string
  context?: Record<string, string>
  predictionCues?: string[]
  existingId?: string
  createdAt?: string
}): PredictionEntry {
  const now = new Date().toISOString()
  return {
    id: params.existingId
      || ((typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `prediction_${Date.now()}`),
    sessionId: params.session.id,
    templateId: params.templateId,
    categoryId: params.categoryId,
    observedTeamId:
      params.session.game_info?.observed_team_id
      || params.session.observed_team_id
      || params.session.game_info?.observed_team
      || params.session.observed_team
      || 'unknown_team',
    observedTeamName:
      params.session.game_info?.observed_team_name
      || params.session.observed_team_name
      || params.session.game_info?.observed_team
      || params.session.observed_team
      || 'Unbekanntes Team',
    order: params.order,
    period: params.period,
    gameTime: params.gameTime?.trim() || undefined,
    predictedValue: params.predictedValue,
    confidence: params.confidence,
    predictionCues: params.predictionCues?.length ? params.predictionCues : undefined,
    context: params.context && Object.keys(params.context).length ? params.context : undefined,
    note: params.note?.trim() || undefined,
    createdAt: params.createdAt || now,
    lockedAt: now,
  }
}

export function resolvePredictionEntry(params: {
  entry: PredictionEntry
  actualValue: string
  resolution: 'correct' | 'partial' | 'incorrect' | 'unjudgeable'
  missedCue?: string
  note?: string
  outcome?: Record<string, string>
  reflectionReads?: string[]
  alternativeSolution?: string
}): PredictionEntry {
  return {
    ...params.entry,
    predictedValue: params.entry.predictedValue,
    confidence: params.entry.confidence,
    predictionCues: params.entry.predictionCues,
    context: params.entry.context,
    lockedAt: params.entry.lockedAt,
    actualValue: params.actualValue,
    resolution: params.resolution,
    missedCue: params.missedCue,
    outcome: params.outcome && Object.keys(params.outcome).length ? params.outcome : params.entry.outcome,
    reflectionReads: params.reflectionReads?.length ? params.reflectionReads : params.entry.reflectionReads,
    alternativeSolution: params.alternativeSolution || params.entry.alternativeSolution,
    note: params.note?.trim() || params.entry.note,
    resolvedAt: new Date().toISOString(),
  }
}

export function resolvePredictionEntryForTemplate(params: {
  template: PredictionTemplate
  entry: PredictionEntry
  actualValue: string
  resolution?: 'correct' | 'partial' | 'incorrect' | 'unjudgeable'
  missedCue?: string
  note?: string
  outcome?: Record<string, string>
  reflectionReads?: string[]
  alternativeSolution?: string
}): PredictionEntry {
  const resolution = usesExactCompare(params.template)
    ? matchToResolution(comparePredictionForTemplate(params.template, params.entry.predictedValue, params.actualValue))
    : params.resolution

  if (!resolution) {
    throw new Error('Resolution is required for this prediction template')
  }

  return resolvePredictionEntry({
    ...params,
    resolution,
  })
}

export function calculatePredictionSessionSummary(entries: PredictionEntry[]): PredictionSessionSummary {
  const resolvedEntries = entries.filter((entry) => Boolean(entry.resolution))
  const correct = resolvedEntries.filter((entry) => entry.resolution === 'correct').length
  const partial = resolvedEntries.filter((entry) => entry.resolution === 'partial').length
  const incorrect = resolvedEntries.filter((entry) => entry.resolution === 'incorrect').length
  const unjudgeable = resolvedEntries.filter((entry) => entry.resolution === 'unjudgeable').length
  const evaluable = correct + partial + incorrect
  const cueValues = entries.flatMap((entry) => entry.predictionCues || [])
  const actualValues = resolvedEntries
    .map((entry) => entry.actualValue)
    .filter((value): value is string => Boolean(value) && value !== 'nicht_beurteilbar' && value !== 'unclear')
  const reflectionReads = resolvedEntries.flatMap((entry) => entry.reflectionReads || [])

  return {
    total: entries.length,
    resolved: resolvedEntries.length,
    correct,
    partial,
    incorrect,
    unjudgeable,
    evaluable,
    mostPredictedValue: mostFrequent(entries.map((entry) => entry.predictedValue)),
    mostActualValue: mostFrequent(actualValues),
    cueCounts: cueValues.length ? countValues(cueValues) : undefined,
    actualValueCounts: actualValues.length ? countValues(actualValues) : undefined,
    reflectionReadCounts: reflectionReads.length ? countValues(reflectionReads) : undefined,
    confidenceTotals: {
      low: entries.filter((entry) => entry.confidence === 'low').length,
      medium: entries.filter((entry) => entry.confidence === 'medium').length,
      high: entries.filter((entry) => entry.confidence === 'high').length,
    },
  }
}

export function calculatePredictionCalibration(entries: PredictionEntry[]): string | null {
  if (!entries.length) return null
  const summary = calculatePredictionSessionSummary(entries)
  if (!summary.mostPredictedValue || !summary.mostActualValue) return null
  if (summary.mostPredictedValue === summary.mostActualValue) {
    return null
  }

  return `Du hast häufiger "${summary.mostPredictedValue}" erwartet, tatsächlich war jedoch häufiger "${summary.mostActualValue}" sichtbar.`
}

export function findOpenPredictionEntry(entries: PredictionEntry[], openPredictionId?: string): PredictionEntry | undefined {
  if (openPredictionId) {
    const openById = entries.find((entry) => entry.id === openPredictionId && !entry.resolution)
    if (openById) return openById
  }

  return entries.find((entry) => !entry.resolution)
}

export function evaluableAccuracyText(summary: PredictionSessionSummary): string | null {
  const evaluable = summary.evaluable ?? (summary.correct + summary.partial + summary.incorrect)
  if (!evaluable) return null
  return `${summary.correct} von ${evaluable} auswertbaren Predictions entsprachen der tatsächlichen Lösung.`
}
