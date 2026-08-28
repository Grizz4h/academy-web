import type { CompetencyItem } from './types'
import { capabilityBandForScore } from './capabilityBands'

export const UNRATED_AXIS_MARKER = 8

export function formatRatioPercent(value: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return `${pct}%`
}

export function ratedCount(competencies: readonly CompetencyItem[]): number {
  return competencies.filter((item) => item.status === 'rated').length
}

export function isFullyUnrated(competencies: readonly CompetencyItem[]): boolean {
  return competencies.length > 0 && ratedCount(competencies) === 0
}

export function hasAnyRated(competencies: readonly CompetencyItem[]): boolean {
  return competencies.some((item) => item.status === 'rated')
}

export function radarPlotValue(item: CompetencyItem): number {
  if (item.status !== 'rated') return 0
  return item.score
}

export function nodePlotValue(item: CompetencyItem): number {
  if (item.status === 'rated') return item.score
  return UNRATED_AXIS_MARKER
}

export function nodeOpacity(item: CompetencyItem): number {
  if (item.status !== 'rated') return 0.45
  return 0.45 + 0.55 * Math.max(0, Math.min(1, item.confidence))
}

export function capabilityLabelForItem(item: CompetencyItem): string | null {
  if (item.status !== 'rated') return null
  return capabilityBandForScore(item.score)?.label ?? null
}

export function accessibilitySummary(item: CompetencyItem): string {
  if (item.status !== 'rated') {
    return `${item.label} — noch nicht bewertet`
  }
  const band = capabilityLabelForItem(item)
  const score = Math.round(item.score)
  return band ? `${item.label} — ${band} — ${score}` : `${item.label} — ${score}`
}
