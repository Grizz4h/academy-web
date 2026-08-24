import type { PatternLogOption } from '../patternLog/types'
import type {
  CuePriority,
  CuePriorityConfig,
  CuePriorityRead,
  CuePriorityResult,
  CueReviewJudgement,
  CueReviewTone,
  PrioritizableCue,
} from './types'

const PRIORITY_SET = new Set<CuePriority>(['primary', 'supporting', 'secondary'])

export const CUE_PRIORITY_LABELS: Record<CuePriority, string> = {
  primary: 'Haupthinweis',
  supporting: 'Unterstützender Hinweis',
  secondary: 'Wahrgenommen, aber nicht für die Erwartung genutzt',
}

export const CUE_REVIEW_LABELS: Record<CueReviewJudgement, string> = {
  yes: 'Ja – klar sichtbar und für die Erwartung relevant',
  partly: 'Teilweise – Sichtbarkeit oder Relevanz eingeschränkt',
  no: 'Nein – nicht klar sichtbar oder nicht relevant',
  unclear: 'Nicht sicher beurteilbar',
}

/** Legacy absolute labels remain readable. */
export const LEGACY_CUE_PRIORITY_LABELS: Record<string, string> = {
  Entscheidend: 'Haupthinweis',
  Unterstützend: 'Unterstützender Hinweis',
  Nebensächlich: 'Wahrgenommen, aber nicht für die Erwartung genutzt',
}

export function isCuePriority(value: unknown): value is CuePriority {
  return PRIORITY_SET.has(value as CuePriority)
}

export function cuePriorityLabel(value?: string | null): string {
  if (value === 'primary' || value === 'supporting' || value === 'secondary') {
    return CUE_PRIORITY_LABELS[value]
  }
  return ''
}

export function cueReviewLabel(value?: string | null): string {
  if (value === 'yes' || value === 'partly' || value === 'no' || value === 'unclear') {
    return CUE_REVIEW_LABELS[value]
  }
  return ''
}

export function resolveCuePriorityConfig(raw: Record<string, unknown> = {}): CuePriorityConfig {
  const mechanic = String(raw.mechanic || '')
  const enabled = mechanic === 'cue_priority'
    || mechanic === 'cue_ranking'
    || raw.supportsCuePriority === true
    || raw.supports_cue_priority === true
  return {
    mechanic: 'cue_priority',
    required: enabled,
    requirePrimary: raw.requirePrimary !== false && raw.require_primary !== false,
  }
}

export function cuePriorityOptions(): Array<PatternLogOption<CuePriority>> {
  return [
    { value: 'primary', label: CUE_PRIORITY_LABELS.primary },
    { value: 'supporting', label: CUE_PRIORITY_LABELS.supporting },
    { value: 'secondary', label: CUE_PRIORITY_LABELS.secondary },
  ]
}

export function cueReviewOptions(): Array<PatternLogOption<CueReviewJudgement>> {
  return [
    { value: 'yes', label: CUE_REVIEW_LABELS.yes },
    { value: 'partly', label: CUE_REVIEW_LABELS.partly },
    { value: 'no', label: CUE_REVIEW_LABELS.no },
    { value: 'unclear', label: CUE_REVIEW_LABELS.unclear },
  ]
}

export function assignCuePriority(
  cues: PrioritizableCue[],
  cueId: string,
  priority: CuePriority,
): PrioritizableCue[] {
  return cues.map((cue) => (cue.id === cueId ? { ...cue, priority } : cue))
}

export function labeledCues(cues: PrioritizableCue[] | null | undefined): PrioritizableCue[] {
  return (cues || []).filter((cue) => String(cue.label || '').trim())
}

export function cuesHavePriorities(cues: PrioritizableCue[] | null | undefined): boolean {
  const labeled = labeledCues(cues)
  if (!labeled.length) return false
  return labeled.every((cue) => isCuePriority(cue.priority))
}

export function hasPrimaryCue(cues: PrioritizableCue[] | null | undefined): boolean {
  return labeledCues(cues).some((cue) => cue.priority === 'primary')
}

export function canSaveCuePriorities(
  cues: PrioritizableCue[] | null | undefined,
  cfg: Pick<CuePriorityConfig, 'requirePrimary'> = { requirePrimary: true },
): boolean {
  if (!cuesHavePriorities(cues)) return false
  if (cfg.requirePrimary && !hasPrimaryCue(cues)) return false
  return true
}

export function primaryCueCategories(cues: PrioritizableCue[] | null | undefined): string[] {
  return labeledCues(cues)
    .filter((cue) => cue.priority === 'primary')
    .map((cue) => String(cue.category || 'other').trim() || 'other')
}

export function formatCuePriorityLine(cue: PrioritizableCue): string {
  const priority = cuePriorityLabel(cue.priority)
  const category = String(cue.category || '').trim()
  const label = String(cue.label || '').trim()
  const body = [category, label].filter(Boolean).join(' · ')
  return priority ? `${priority}: ${body}` : body
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1
}

function toneForCategory(helpful: number, overestimated: number, total: number): CueReviewTone {
  if (total <= 0) return 'unclear'
  if (overestimated > helpful && overestimated >= Math.ceil(total / 2)) return 'often_overestimated'
  if (helpful > 0 && overestimated === 0) return 'often_helpful'
  if (helpful >= overestimated) return 'often_helpful'
  if (helpful > 0 && overestimated > 0) return 'mixed'
  return 'unclear'
}

export function cueReviewToneLabel(tone: CueReviewTone): string {
  if (tone === 'often_helpful') return 'häufig hilfreich'
  if (tone === 'often_overestimated') return 'oft überschätzt'
  if (tone === 'mixed') return 'gemischt'
  return 'unklar'
}

export function computeCuePriorityResult(reads: CuePriorityRead[]): CuePriorityResult {
  const primaryCueDistribution: Record<string, number> = {}
  const supportingCueDistribution: Record<string, number> = {}
  const secondaryCueDistribution: Record<string, number> = {}
  const cueReviewAgreement = { matched: 0, partlyMatched: 0, different: 0, unclear: 0 }
  const helpfulByCategory: Record<string, number> = {}
  const overestimatedByCategory: Record<string, number> = {}
  const primaryCountByCategory: Record<string, number> = {}

  for (const read of reads) {
    for (const cue of labeledCues(read.supportingCues)) {
      const key = String(cue.category || 'other').trim() || 'other'
      if (cue.priority === 'primary') {
        bump(primaryCueDistribution, key)
        bump(primaryCountByCategory, key)
      } else if (cue.priority === 'supporting') {
        bump(supportingCueDistribution, key)
      } else if (cue.priority === 'secondary') {
        bump(secondaryCueDistribution, key)
      }
    }

    if (read.cueReview === 'yes') cueReviewAgreement.matched += 1
    else if (read.cueReview === 'partly') cueReviewAgreement.partlyMatched += 1
    else if (read.cueReview === 'no') cueReviewAgreement.different += 1
    else if (read.cueReview === 'unclear') cueReviewAgreement.unclear += 1

    const primaries = primaryCueCategories(read.supportingCues)
    for (const category of primaries) {
      if (read.cueReview === 'yes' || read.cueReview === 'partly') bump(helpfulByCategory, category)
      if (read.cueReview === 'no') bump(overestimatedByCategory, category)
    }
  }

  const reviewTones = Object.keys(primaryCountByCategory)
    .sort((a, b) => (primaryCountByCategory[b] - primaryCountByCategory[a]) || a.localeCompare(b))
    .map((category) => {
      const primaryCount = primaryCountByCategory[category] || 0
      return {
        category,
        primaryCount,
        tone: toneForCategory(helpfulByCategory[category] || 0, overestimatedByCategory[category] || 0, primaryCount),
      }
    })

  const overlookedCues = Object.keys(supportingCueDistribution)
    .concat(Object.keys(secondaryCueDistribution))
    .filter((key, index, all) => all.indexOf(key) === index && !primaryCueDistribution[key])

  return {
    primaryCueDistribution,
    supportingCueDistribution,
    secondaryCueDistribution,
    cueReviewAgreement,
    overlookedCues: overlookedCues.length ? overlookedCues : undefined,
    reviewTones,
  }
}

export function resultHasNumericCueScore(result: CuePriorityResult): boolean {
  const record = result as CuePriorityResult & Record<string, unknown>
  return 'accuracy' in record
    || 'accuracyPercent' in record
    || 'cueAccuracy' in record
    || 'score' in record
}

export function mostFrequentPrimaryCategory(result: CuePriorityResult): string | null {
  const entries = Object.entries(result.primaryCueDistribution)
  if (!entries.length) return null
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return entries[0][0]
}
