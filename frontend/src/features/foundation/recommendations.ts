/** Academy recommendation helpers — foundation-aware, no UI hardcodes */

import type { Curriculum, Module, Track } from '../../api'
import type { HockeyExperienceLevel } from './types'

export type FoundationRecommendation = {
  kind: 'foundation_entry'
  trackId: string
  moduleId: string
  drillId: string
  title: string
  subtitle: string
}

export type AcademyEntryRecommendation = {
  kind: 'academy_entry'
  trackId: string
  moduleId: string
  title: string
  subtitle: string
}

export type NextStepRecommendation = FoundationRecommendation | AcademyEntryRecommendation | null

export function isFoundationTrack(track: Track | undefined | null): boolean {
  if (!track) return false
  return track.trackType === 'foundation'
}

export function getFoundationTrack(curriculum: Curriculum | undefined | null): Track | undefined {
  if (!curriculum?.tracks?.length) return undefined
  return curriculum.tracks.find((t) => t.trackType === 'foundation')
    || curriculum.tracks.find((t) => t.id === 'T0')
}

export function getFoundationModule(curriculum: Curriculum | undefined | null): Module | undefined {
  const track = getFoundationTrack(curriculum)
  return track?.modules?.find((m) => m.active !== false)
}

export function isFoundationTrackComplete(
  curriculum: Curriculum | undefined | null,
  completedDrillIds: Set<string>,
): boolean {
  const module = getFoundationModule(curriculum)
  if (!module?.drills?.length) return false
  return module.drills.every((d) => completedDrillIds.has(d.id))
}

/** First unfinished foundation drill, or first drill if none started. */
export function getNextFoundationDrillId(
  curriculum: Curriculum | undefined | null,
  completedDrillIds: Set<string>,
): string | undefined {
  const module = getFoundationModule(curriculum)
  if (!module?.drills?.length) return undefined
  const next = module.drills.find((d) => !completedDrillIds.has(d.id))
  return (next || module.drills[0])?.id
}

/**
 * Prefer foundation for beginners who have not finished Track 0.
 * Familiar/advanced and legacy profiles (no experience) get academy entry (Track A).
 */
export function selectNextStepRecommendation(args: {
  curriculum: Curriculum | undefined | null
  completedDrillIds: Set<string>
  hockeyExperience: HockeyExperienceLevel | null | undefined
}): NextStepRecommendation {
  const { curriculum, completedDrillIds, hockeyExperience } = args
  const foundation = getFoundationTrack(curriculum)
  const foundationModule = getFoundationModule(curriculum)
  const foundationDone = isFoundationTrackComplete(curriculum, completedDrillIds)

  if (
    hockeyExperience === 'beginner'
    && foundation
    && foundationModule
    && !foundationDone
  ) {
    const drillId = getNextFoundationDrillId(curriculum, completedDrillIds) || foundationModule.drills[0]?.id
    return {
      kind: 'foundation_entry',
      trackId: foundation.id,
      moduleId: foundationModule.id,
      drillId: drillId || 'T0_D1',
      title: foundation.title || 'Hockey Basics',
      subtitle: foundation.goal || 'Spielfeld, Regeln, Rollen und Begriffe.',
    }
  }

  // Default academy entry: first active non-foundation module (typically A1)
  const academyTrack = curriculum?.tracks?.find(
    (t) => t.trackType !== 'foundation' && t.id !== 'T0' && (t.modules || []).some((m) => m.active !== false),
  )
  const academyModule = academyTrack?.modules?.find((m) => m.active !== false)
  if (!academyTrack || !academyModule) return null

  return {
    kind: 'academy_entry',
    trackId: academyTrack.id,
    moduleId: academyModule.id,
    title: academyModule.title,
    subtitle: academyModule.summary || academyTrack.goal || '',
  }
}

export function shouldPromptHockeyExperience(
  hockeyExperience: HockeyExperienceLevel | null | undefined,
  experiencePromptDismissed: boolean | undefined,
  options?: { completedSessionCount?: number },
): boolean {
  if (hockeyExperience === 'beginner' || hockeyExperience === 'familiar' || hockeyExperience === 'advanced') {
    return false
  }
  if (experiencePromptDismissed) return false
  // Soft prompt for brand-new accounts only — existing profiles stay unblocked
  const completed = options?.completedSessionCount ?? 0
  return completed === 0
}
