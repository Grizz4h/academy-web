import type { PredictionEntry, PredictionSessionSummary, Session } from '../../api'

function mostFrequent(values: string[]): string | undefined {
  if (!values.length) return undefined
  const totals = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function createPredictionEntry(params: {
  session: Session
  templateId: string
  categoryId: string
  predictedValue: string
  confidence: 'low' | 'medium' | 'high'
  period: number
  note?: string
}): PredictionEntry {
  const now = new Date().toISOString()
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `prediction_${Date.now()}`,
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
    period: params.period,
    predictedValue: params.predictedValue,
    confidence: params.confidence,
    note: params.note?.trim() || undefined,
    createdAt: now,
  }
}

export function resolvePredictionEntry(params: {
  entry: PredictionEntry
  actualValue: string
  resolution: 'correct' | 'partial' | 'incorrect' | 'unjudgeable'
  missedCue?: string
  note?: string
}): PredictionEntry {
  return {
    ...params.entry,
    actualValue: params.actualValue,
    resolution: params.resolution,
    missedCue: params.missedCue,
    note: params.note?.trim() || params.entry.note,
    resolvedAt: new Date().toISOString(),
  }
}

export function calculatePredictionSessionSummary(entries: PredictionEntry[]): PredictionSessionSummary {
  const resolvedEntries = entries.filter((entry) => Boolean(entry.resolution))
  const correct = resolvedEntries.filter((entry) => entry.resolution === 'correct').length
  const partial = resolvedEntries.filter((entry) => entry.resolution === 'partial').length
  const incorrect = resolvedEntries.filter((entry) => entry.resolution === 'incorrect').length
  const unjudgeable = resolvedEntries.filter((entry) => entry.resolution === 'unjudgeable').length

  return {
    total: entries.length,
    resolved: resolvedEntries.length,
    correct,
    partial,
    incorrect,
    unjudgeable,
    mostPredictedValue: mostFrequent(entries.map((entry) => entry.predictedValue)),
    mostActualValue: mostFrequent(
      resolvedEntries
        .map((entry) => entry.actualValue)
        .filter((value): value is string => Boolean(value) && value !== 'nicht_beurteilbar')
    ),
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
