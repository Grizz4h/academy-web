import type { PredictionTemplate } from './types'

function optionLabel(
  options: Array<{ value: string; label: string; shortLabel?: string }> | undefined,
  value?: string,
  short = false,
): string {
  if (!value) return '-'
  const option = options?.find((item) => item.value === value)
  if (!option) return value
  if (short) return option.shortLabel || option.label
  return option.label
}

export function getPredictionOptionLabel(template: PredictionTemplate, value?: string, short = false): string {
  return optionLabel(template.predictionOptions, value, short)
}

export function getActualOutcomeLabel(template: PredictionTemplate, value?: string, short = false): string {
  return optionLabel(template.resolution.actualOutcomeOptions, value, short)
}

export function getResolutionLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.resolution.evaluationOptions.find((option) => option.value === value)?.label || value
}

export function getConfidenceLabel(template: PredictionTemplate, value?: string): string {
  if (!value) return '-'
  return template.confidence.options.find((option) => option.value === value)?.label || value
}

export function getContextFieldLabel(template: PredictionTemplate, fieldId: string, value?: string): string {
  const field = template.contextFields?.find((item) => item.id === fieldId)
  return optionLabel(field?.options, value)
}

export function getCueLabel(template: PredictionTemplate, value?: string): string {
  return optionLabel(template.cueField?.options, value)
}

export function getOutcomeFieldLabel(template: PredictionTemplate, value?: string): string {
  return optionLabel(template.resolution.outcomeField?.options, value)
}

export function getReflectionReadLabel(template: PredictionTemplate, value?: string): string {
  return optionLabel(template.resolution.reflectionField?.options, value)
}

export function getFieldOptionLabel(
  options: Array<{ value: string; label: string; shortLabel?: string }> | undefined,
  value?: string,
): string {
  return optionLabel(options, value)
}
