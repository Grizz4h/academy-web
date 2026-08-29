import type { CompetencyItem } from './types'
import { capabilityBandForScore } from './capabilityBands'

export function formatRatioPercent(value: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return `${pct}%`
}

export function ratedCount(competencies: readonly CompetencyItem[]): number {
  return competencies.filter((item) => item.status === 'rated').length
}

/** Score polygon only when every axis is rated — never fake unrated as score 0. */
export function canShowScorePolygon(competencies: readonly CompetencyItem[]): boolean {
  return competencies.length > 0 && ratedCount(competencies) === competencies.length
}

export function isFullyUnrated(competencies: readonly CompetencyItem[]): boolean {
  return competencies.length > 0 && ratedCount(competencies) === 0
}

export function hasAnyRated(competencies: readonly CompetencyItem[]): boolean {
  return competencies.some((item) => item.status === 'rated')
}

/** Only for closed polygon when `canShowScorePolygon`; callers must gate first. */
export function radarPlotValue(item: CompetencyItem): number {
  if (item.status !== 'rated') return 0
  return item.score
}

/** Rated axes only — unrated must not plot near center (looks like skill 0). */
export function nodePlotValue(item: CompetencyItem): number | null {
  if (item.status === 'rated') return item.score
  return null
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
