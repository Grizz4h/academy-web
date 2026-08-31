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

/** Highest-score rated axis (ties → first in taxonomy order). */
export function strongestRatedCompetency(
  competencies: readonly CompetencyItem[],
): CompetencyItem | null {
  let best: CompetencyItem | null = null
  for (const item of competencies) {
    if (item.status !== 'rated') continue
    if (!best || item.score > best.score) best = item
  }
  return best
}

/** Mean score across rated axes only — used for center glyph when profile is complete. */
export function meanRatedScore(competencies: readonly CompetencyItem[]): number | null {
  const rated = competencies.filter((item) => item.status === 'rated')
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, item) => acc + item.score, 0)
  return sum / rated.length
}

export function profileProgressLabel(
  competencies: readonly CompetencyItem[],
): { short: string; complete: boolean } {
  const total = competencies.length
  const rated = ratedCount(competencies)
  if (total > 0 && rated === total) {
    return { short: 'Profil vollständig', complete: true }
  }
  return { short: `${rated}/${total} bewertet`, complete: false }
}

export function profileStoryLine(competencies: readonly CompetencyItem[]): string | null {
  const strongest = strongestRatedCompetency(competencies)
  if (!strongest) return null
  const band = capabilityLabelForItem(strongest)
  if (band) return `Schwerpunkt: ${strongest.label} · ${band}`
  return `Schwerpunkt: ${strongest.label}`
}
