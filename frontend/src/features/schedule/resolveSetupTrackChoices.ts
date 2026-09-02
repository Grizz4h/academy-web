import type { Curriculum, Session } from '../../api'
import type { DrillWithCount } from '../../components/dashboard/DrillPriorityCards'
import type { HockeyExperienceLevel } from '../../data/profile/types'
import {
  getAcademyEntryModule,
  getFoundationModule,
  hasCompletedAnyFoundationDrill,
  isAcademyLocked,
  selectNextStepRecommendation,
  type NextStepRecommendation,
} from '../foundation/recommendations'
import { selectTutorialEntryRecommendation } from '../tutorial/resolveEntry'
import { getRealSessions } from '../../utils/sessionEligibility'
import { selectRecommendedNextDrills } from '../../utils/recommendedDrills'

export type SetupTrackChoice = {
  id: string
  moduleId: string
  drillId?: string
  trackId: string
  trackLabel: string
  title: string
  hint: string
  recommended?: boolean
}

export type SetupTrackChoicesResult = {
  recommendedChoiceId: string | null
  choices: SetupTrackChoice[]
  nextStepLead: string
}

function completedDrillIds(sessions: Session[] | null | undefined): Set<string> {
  const completed = new Set<string>()
  for (const session of getRealSessions(sessions || [])) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      if (drill?.id) completed.add(drill.id)
    }
    if (session.drill_id) completed.add(session.drill_id)
  }
  return completed
}

function buildDrillCounts(
  curriculum: Curriculum | null | undefined,
  sessions: Session[] | null | undefined,
): DrillWithCount[] {
  if (!curriculum?.tracks?.length) return []

  const drillById = new Map<string, { title: string; drill_type?: string }>()
  const drillToModuleMap = new Map<string, string>()
  const drillNumberMap = new Map<string, number>()

  for (const track of curriculum.tracks) {
    for (const module of track.modules) {
      if (module.active === false) continue
      module.drills.forEach((drill, index) => {
        drillById.set(drill.id, { title: drill.title, drill_type: drill.drill_type })
        drillToModuleMap.set(drill.id, module.id)
        drillNumberMap.set(drill.id, index + 1)
      })
    }
  }

  const drillCounts = new Map<string, number>()
  for (const drillId of drillById.keys()) {
    drillCounts.set(drillId, 0)
  }

  for (const session of getRealSessions(sessions || [])) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      if (!drill?.id) continue
      drillCounts.set(drill.id, (drillCounts.get(drill.id) ?? 0) + 1)
    }
  }

  return Array.from(drillCounts.entries()).map(([id, count]) => ({
    id,
    title: drillById.get(id)?.title ?? id,
    drill_type: drillById.get(id)?.drill_type,
    count,
    moduleId: drillToModuleMap.get(id),
    drillNumber: drillNumberMap.get(id),
  }))
}

function choiceId(moduleId: string, drillId?: string): string {
  return drillId ? `${moduleId}:${drillId}` : moduleId
}

function moduleMeta(
  curriculum: Curriculum | null | undefined,
  moduleId: string,
): { trackId: string; trackLabel: string; title: string; hint: string } | null {
  if (!curriculum?.tracks?.length) return null
  for (const track of curriculum.tracks) {
    const module = track.modules.find((item) => item.id === moduleId && item.active !== false)
    if (!module) continue
    return {
      trackId: track.id,
      trackLabel: track.title,
      title: `${module.id} · ${module.title}`,
      hint: module.summary || track.goal || track.title || '',
    }
  }
  return null
}

function recommendationLead(
  recommendation: NextStepRecommendation | null | undefined,
  nextDrill: DrillWithCount | undefined,
  continueSubtitle?: string | null,
): string {
  if (nextDrill?.moduleId) {
    return continueSubtitle || `${nextDrill.moduleId} · ${nextDrill.title}`
  }
  if (recommendation?.kind === 'foundation_entry') {
    return recommendation.subtitle
  }
  if (recommendation?.kind === 'academy_entry') {
    return recommendation.subtitle
  }
  return 'Weiter in der Akademie beobachten und trainieren.'
}

export function resolveSetupTrackChoices(args: {
  curriculum: Curriculum | null | undefined
  sessions: Session[] | null | undefined
  hockeyExperience?: HockeyExperienceLevel | null
  devMode?: boolean
  tutorialActive?: boolean
}): SetupTrackChoicesResult {
  const { curriculum, sessions, hockeyExperience, devMode = false, tutorialActive = false } = args
  const completedIds = completedDrillIds(sessions)
  const countsArray = buildDrillCounts(curriculum, sessions)
  const recommendedNext = selectRecommendedNextDrills(countsArray, curriculum, 5, {
    allDrills: countsArray,
  })
  const nextDrill = recommendedNext[0]

  const foundationRecommendation = tutorialActive
    ? selectTutorialEntryRecommendation({
        curriculum,
        completedDrillIds: completedIds,
        hockeyExperience,
      })
    : selectNextStepRecommendation({
        curriculum,
        completedDrillIds: completedIds,
        hockeyExperience,
      })

  const foundationModule = getFoundationModule(curriculum)
  const academyEntry = getAcademyEntryModule(curriculum)
  const completedModuleIds = getRealSessions(sessions || [])
    .filter((session) => String(session.state || '').toUpperCase() === 'COMPLETED')
    .map((session) => String(session.module_id || ''))
    .filter(Boolean)
  const track0Done = hasCompletedAnyFoundationDrill(curriculum, completedIds)
    || completedModuleIds.some((id) => id === 'T0' || id.startsWith('T0'))
  const hasUsedAcademy = getRealSessions(sessions || []).some((session) => {
    const moduleId = String(session.module_id || '')
    return moduleId && moduleId !== 'T0' && !moduleId.startsWith('T0')
  })
  const academyLocked = isAcademyLocked(curriculum, completedIds, {
    devMode,
    hasUsedAcademy,
    completedModuleIds,
    hockeyExperience,
  })

  const showFoundationEntry = foundationRecommendation?.kind === 'foundation_entry'
  const showBasicsStep = Boolean(
    !track0Done
    && foundationModule
    && (showFoundationEntry || academyLocked),
  )
  const showAcademyEntryCta = Boolean(
    !showBasicsStep
    && !hasUsedAcademy
    && academyEntry
    && !academyLocked,
  )
  const showContinueCta = Boolean(
    !showBasicsStep
    && !showAcademyEntryCta
    && nextDrill?.moduleId
    && !academyLocked,
  )

  let recommended: SetupTrackChoice | null = null

  if (showContinueCta && nextDrill?.moduleId) {
    const meta = moduleMeta(curriculum, nextDrill.moduleId)
    recommended = {
      id: choiceId(nextDrill.moduleId, nextDrill.id),
      moduleId: nextDrill.moduleId,
      drillId: nextDrill.id,
      trackId: meta?.trackId || nextDrill.moduleId.charAt(0),
      trackLabel: meta?.trackLabel || nextDrill.moduleId.charAt(0),
      title: meta?.title || `${nextDrill.moduleId} · ${nextDrill.title}`,
      hint: meta?.hint || nextDrill.title,
      recommended: true,
    }
  } else if (showAcademyEntryCta && academyEntry) {
    recommended = {
      id: choiceId(academyEntry.moduleId),
      moduleId: academyEntry.moduleId,
      trackId: academyEntry.trackId,
      trackLabel: academyEntry.trackId === 'T0' ? 'Hockey Basics' : academyEntry.trackId,
      title: `${academyEntry.moduleId} · ${academyEntry.title}`,
      hint: academyEntry.subtitle,
      recommended: true,
    }
  } else if (showBasicsStep && foundationRecommendation?.kind === 'foundation_entry') {
    recommended = {
      id: choiceId(foundationRecommendation.moduleId, foundationRecommendation.drillId),
      moduleId: foundationRecommendation.moduleId,
      drillId: foundationRecommendation.drillId,
      trackId: foundationRecommendation.trackId,
      trackLabel: 'Hockey Basics',
      title: `${foundationRecommendation.moduleId} · ${foundationRecommendation.title}`,
      hint: foundationRecommendation.subtitle,
      recommended: true,
    }
  } else if (nextDrill?.moduleId && !academyLocked) {
    const meta = moduleMeta(curriculum, nextDrill.moduleId)
    recommended = {
      id: choiceId(nextDrill.moduleId, nextDrill.id),
      moduleId: nextDrill.moduleId,
      drillId: nextDrill.id,
      trackId: meta?.trackId || nextDrill.moduleId.charAt(0),
      trackLabel: meta?.trackLabel || nextDrill.moduleId.charAt(0),
      title: meta?.title || `${nextDrill.moduleId} · ${nextDrill.title}`,
      hint: meta?.hint || nextDrill.title,
      recommended: true,
    }
  } else if (academyEntry && !academyLocked) {
    recommended = {
      id: choiceId(academyEntry.moduleId),
      moduleId: academyEntry.moduleId,
      trackId: academyEntry.trackId,
      trackLabel: academyEntry.trackId === 'T0' ? 'Hockey Basics' : academyEntry.trackId,
      title: `${academyEntry.moduleId} · ${academyEntry.title}`,
      hint: academyEntry.subtitle,
      recommended: true,
    }
  }

  const choices: SetupTrackChoice[] = []
  const seen = new Set<string>()

  const pushChoice = (choice: SetupTrackChoice) => {
    if (seen.has(choice.id)) return
    seen.add(choice.id)
    choices.push(choice)
  }

  if (recommended) pushChoice(recommended)

  if (curriculum?.tracks?.length) {
    for (const track of curriculum.tracks) {
      const isFoundation = track.trackType === 'foundation' || track.id === 'T0'
      if (isFoundation) {
        if (showBasicsStep && foundationModule) {
          const drillId = foundationRecommendation?.kind === 'foundation_entry'
            ? foundationRecommendation.drillId
            : foundationModule.drills[0]?.id
          pushChoice({
            id: choiceId(foundationModule.id, drillId),
            moduleId: foundationModule.id,
            drillId,
            trackId: track.id,
            trackLabel: track.title,
            title: `${foundationModule.id} · ${foundationModule.title}`,
            hint: track.goal || 'Hockey Basics',
          })
        }
        continue
      }

      if (academyLocked) continue

      for (const module of track.modules) {
        if (module.active === false) continue
        const moduleDrills = countsArray.filter((drill) => drill.moduleId === module.id)
        const incomplete = moduleDrills.filter((drill) => drill.count === 0).sort((a, b) => {
          const aNum = a.drillNumber ?? Number.POSITIVE_INFINITY
          const bNum = b.drillNumber ?? Number.POSITIVE_INFINITY
          return aNum - bNum
        })
        const drillId = incomplete[0]?.id || module.drills[0]?.id
        pushChoice({
          id: choiceId(module.id, drillId),
          moduleId: module.id,
          drillId,
          trackId: track.id,
          trackLabel: track.title,
          title: `${module.id} · ${module.title}`,
          hint: module.summary || track.goal || track.title || '',
        })
      }
    }
  }

  if (choices.length === 0) {
    pushChoice({
      id: choiceId('A1'),
      moduleId: 'A1',
      trackId: 'A',
      trackLabel: 'Akademie',
      title: 'A1 · Beobachten',
      hint: 'Standard-Einstieg in die Akademie',
      recommended: true,
    })
  }

  const recommendedChoiceId = recommended?.id || choices[0]?.id || null
  const marked = choices.map((choice) => ({
    ...choice,
    recommended: choice.id === recommendedChoiceId,
  }))

  marked.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1
    if (!a.recommended && b.recommended) return 1
    return a.title.localeCompare(b.title, 'de')
  })

  const continueSubtitle = recommended?.moduleId
    ? moduleMeta(curriculum, recommended.moduleId)?.hint
    : null

  return {
    recommendedChoiceId,
    choices: marked,
    nextStepLead: recommendationLead(foundationRecommendation, nextDrill, continueSubtitle),
  }
}
