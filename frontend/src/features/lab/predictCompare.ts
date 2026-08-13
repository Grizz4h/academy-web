import type { PredictionEntry, PredictionResolution } from '../../api'
import type { PredictionTemplate } from './types'

export type PredictionMatch = 'exact' | 'different' | 'unjudgeable'

export const DEFAULT_UNJUDGEABLE_ACTUAL_VALUES = ['unclear', 'nicht_beurteilbar']

export function usesExactCompare(template: PredictionTemplate): boolean {
  return template.resolution.compareMode === 'exact' || Boolean(template.resolution.hideManualEvaluation)
}

export function unjudgeableActualValues(template: PredictionTemplate): string[] {
  return template.resolution.unjudgeableActualValues?.length
    ? template.resolution.unjudgeableActualValues
    : DEFAULT_UNJUDGEABLE_ACTUAL_VALUES
}

export function comparePrediction(params: {
  predictedValue: string
  actualValue: string
  unjudgeableActualValues?: string[]
}): PredictionMatch {
  const unjudgeable = params.unjudgeableActualValues?.length
    ? params.unjudgeableActualValues
    : DEFAULT_UNJUDGEABLE_ACTUAL_VALUES

  if (unjudgeable.includes(params.actualValue)) return 'unjudgeable'
  if (params.predictedValue === params.actualValue) return 'exact'
  return 'different'
}

export function comparePredictionForTemplate(
  template: PredictionTemplate,
  predictedValue: string,
  actualValue: string,
): PredictionMatch {
  return comparePrediction({
    predictedValue,
    actualValue,
    unjudgeableActualValues: unjudgeableActualValues(template),
  })
}

export function matchToResolution(match: PredictionMatch): PredictionResolution {
  if (match === 'exact') return 'correct'
  if (match === 'unjudgeable') return 'unjudgeable'
  return 'incorrect'
}

export function resolveExactComparison(
  template: PredictionTemplate,
  predictedValue: string,
  actualValue: string,
): PredictionResolution {
  return matchToResolution(comparePredictionForTemplate(template, predictedValue, actualValue))
}

export function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

export function isPredictionLocked(entry: PredictionEntry): boolean {
  return Boolean(entry.lockedAt) && Boolean(entry.predictedValue)
}

export function canEditLockedPrediction(entry: PredictionEntry): boolean {
  return isPredictionLocked(entry) && !entry.actualValue && !entry.resolution
}
