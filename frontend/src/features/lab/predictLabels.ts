import type { PredictionTemplate } from './types'

export function getPredictionOptionLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.predictionOptions.find((option) => option.value === value)?.label || value
}

export function getActualOutcomeLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.resolution.actualOutcomeOptions.find((option) => option.value === value)?.label || value
}

export function getResolutionLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.resolution.evaluationOptions.find((option) => option.value === value)?.label || value
}

export function getConfidenceLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.confidence.options.find((option) => option.value === value)?.label || value
}
