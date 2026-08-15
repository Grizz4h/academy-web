import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'
import { getRealSessions } from '../../utils/sessionEligibility'
import { TUTORIAL_ID } from './ids'
import { getTutorialFeatures, stepAllowed } from './features'
import { getTutorialDefinition } from './registry'
import { selectTutorialEntryRecommendation } from './resolveEntry'
import { isWildcardRoute, matchRoute } from './routeMatch'
import {
  emptyProgress,
  mergeTutorialPreferences,
  pickFresherProgress,
  progressFromPreferences,
  readLocalProgress,
  writeLocalProgress,
} from './storage'
import type {
  TutorialContextValue,
  TutorialProgress,
  TutorialStep,
  TutorialSurface,
} from './types'
import { getNavInset } from './positioning'
import { resolveLiveTutorialTarget, scrollTargetIntoView, shouldScrollToTarget, waitForTarget } from './waitForTarget'

const TutorialContext = createContext<TutorialContextValue | null>(null)

const MAIN_ID = TUTORIAL_ID.mainOnboarding

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const definition = getTutorialDefinition(MAIN_ID)
  const features = useMemo(() => getTutorialFeatures(), [])

  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user),
    staleTime: 15_000,
  })

  const completedDrillIds = useMemo(() => {
    const ids = new Set<string>()
    for (const session of getRealSessions(sessions || [])) {
      if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
      for (const drill of session.drills || []) {
        if (drill?.id) ids.add(drill.id)
      }
    }
    return ids
  }, [sessions])

  const completedSessionCount = useMemo(
    () => getRealSessions(sessions || []).filter((s) => String(s.state || '').toUpperCase() === 'COMPLETED').length,
    [sessions],
  )

  const entry = useMemo(
    () => selectTutorialEntryRecommendation({
      curriculum,
      completedDrillIds,
      hockeyExperience: account?.profile?.hockeyExperience,
    }),
    [curriculum, completedDrillIds, account?.profile?.hockeyExperience],
  )

  const steps = useMemo(
    () => definition.steps.filter((step) => stepAllowed(step.when, features)),
    [definition.steps, features],
  )

  const [progress, setProgress] = useState<TutorialProgress>(() => emptyProgress(MAIN_ID, definition.version))
  const [hydrated, setHydrated] = useState(false)
  const [active, setActive] = useState(false)
  const [snoozed, setSnoozed] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [surfaceOverride, setSurfaceOverride] = useState<Extract<TutorialSurface, 'end-confirm' | 'none'> | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const persistTimer = useRef<number | null>(null)
  const skippedTarget = useRef<string | null>(null)
  const hydratedUser = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      hydratedUser.current = null
      setProgress(emptyProgress(MAIN_ID, definition.version))
      setActive(false)
      setSnoozed(false)
      setShowComplete(false)
      setHydrated(false)
      setSurfaceOverride(null)
      return
    }
    const local = readLocalProgress(user, MAIN_ID, definition.version)
    const remote = progressFromPreferences(
      account?.profile?.dashboardPreferences as Record<string, unknown> | undefined,
      MAIN_ID,
      definition.version,
    )
    const merged = pickFresherProgress(local, remote)
    if (hydratedUser.current === user) {
      setProgress((prev) => pickFresherProgress(prev, remote))
      return
    }
    hydratedUser.current = user
    setProgress(merged)
    setActive(false)
    setSnoozed(false)
    setShowComplete(false)
    setSurfaceOverride(null)
    setHydrated(true)
  }, [user, account?.profile?.updatedAt, definition.version])

  const persist = useCallback((next: TutorialProgress) => {
    if (!user) return
    writeLocalProgress(user, next)
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      const preferences = mergeTutorialPreferences(
        account?.profile?.dashboardPreferences as Record<string, unknown> | undefined,
        next,
      )
      api.updateMyProfile({ dashboardPreferences: preferences }).catch(() => {
        console.warn('[tutorial] profile sync failed')
      })
    }, 400)
  }, [user, account?.profile?.dashboardPreferences])

  const updateProgress = useCallback((patch: Partial<TutorialProgress> | ((prev: TutorialProgress) => TutorialProgress)) => {
    setProgress((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      persist(next)
      return next
    })
  }, [persist])

  const currentIndex = useMemo(() => {
    if (!progress.currentStepId) return 0
    const index = steps.findIndex((step) => step.id === progress.currentStepId)
    if (index >= 0) return index
    const completed = new Set(progress.completedStepIds)
    const nextOpen = steps.findIndex((step) => !completed.has(step.id))
    return nextOpen >= 0 ? nextOpen : 0
  }, [progress.completedStepIds, progress.currentStepId, steps])

  const currentStep = active ? steps[currentIndex] || null : null

  const surface: TutorialSurface = useMemo(() => {
    if (!user || !hydrated) return 'none'
    if (surfaceOverride === 'end-confirm') return 'end-confirm'
    if (showComplete) return 'complete'
    if (active) return 'active'
    if (snoozed) return 'none'
    if (progress.status === 'in_progress') return 'resume'
    if (progress.status === 'not_started' && completedSessionCount === 0) return 'welcome'
    return 'none'
  }, [user, hydrated, surfaceOverride, showComplete, active, snoozed, progress.status, completedSessionCount])

  const resolveStepRoute = useCallback((step: TutorialStep): string | undefined => {
    if (!step.route) return undefined
    if (step.route === '/setup/*') {
      return entry?.moduleId ? `/setup/${entry.moduleId}` : '/curriculum'
    }
    if (isWildcardRoute(step.route)) return undefined
    return step.route
  }, [entry?.moduleId])

  const goToIndex = useCallback((index: number, startActive = true) => {
    if (index >= steps.length) {
      setActive(false)
      setShowComplete(true)
      updateProgress((prev) => ({
        ...prev,
        status: 'completed',
        currentStepId: undefined,
        completedAt: new Date().toISOString(),
        completedStepIds: steps.map((step) => step.id),
      }))
      return
    }
    const step = steps[Math.max(0, index)]
    if (!step) return
    if (startActive) setActive(true)
    setShowComplete(false)
    setTargetMissing(false)
    updateProgress((prev) => ({
      ...prev,
      status: 'in_progress',
      currentStepId: step.id,
      startedAt: prev.startedAt || new Date().toISOString(),
    }))
  }, [steps, updateProgress])

  const start = useCallback(() => {
    setSurfaceOverride(null)
    setSnoozed(false)
    goToIndex(0)
    navigate('/')
  }, [goToIndex, navigate])

  const resume = useCallback(() => {
    setSurfaceOverride(null)
    setSnoozed(false)
    goToIndex(currentIndex)
  }, [currentIndex, goToIndex])

  const later = useCallback(() => {
    setActive(false)
    setSnoozed(true)
    setSurfaceOverride(null)
    setShowComplete(false)
  }, [])

  const complete = useCallback(() => {
    setActive(false)
    setShowComplete(false)
    setSurfaceOverride(null)
    updateProgress((prev) => ({
      ...prev,
      status: 'completed',
      currentStepId: undefined,
      completedAt: prev.completedAt || new Date().toISOString(),
      completedStepIds: steps.map((step) => step.id),
    }))
  }, [steps, updateProgress])

  const dismiss = useCallback(() => {
    setActive(false)
    setSurfaceOverride(null)
    updateProgress((prev) => ({
      ...prev,
      status: 'dismissed',
      dismissedAt: new Date().toISOString(),
    }))
  }, [updateProgress])

  const restart = useCallback(() => {
    setSurfaceOverride(null)
    setSnoozed(false)
    setShowComplete(false)
    updateProgress({
      tutorialId: MAIN_ID,
      version: definition.version,
      status: 'in_progress',
      currentStepId: steps[0]?.id,
      completedStepIds: [],
      startedAt: new Date().toISOString(),
    })
    setActive(true)
    navigate('/')
  }, [definition.version, navigate, steps, updateProgress])

  const resetState = useCallback(() => {
    const empty = emptyProgress(MAIN_ID, definition.version)
    setActive(false)
    setSurfaceOverride(null)
    updateProgress(empty)
  }, [definition.version, updateProgress])

  const markStepDone = useCallback((stepId: string) => {
    updateProgress((prev) => ({
      ...prev,
      completedStepIds: prev.completedStepIds.includes(stepId)
        ? prev.completedStepIds
        : [...prev.completedStepIds, stepId],
    }))
  }, [updateProgress])

  const next = useCallback(() => {
    if (!currentStep) {
      if (surface === 'complete') complete()
      return
    }
    markStepDone(currentStep.id)
    goToIndex(currentIndex + 1)
  }, [complete, currentIndex, currentStep, goToIndex, markStepDone, surface])

  const back = useCallback(() => {
    if (currentIndex <= 0) return
    goToIndex(currentIndex - 1)
  }, [currentIndex, goToIndex])

  const goToStep = useCallback((stepId: string) => {
    const index = steps.findIndex((step) => step.id === stepId)
    if (index >= 0) goToIndex(index)
  }, [goToIndex, steps])

  const requestEnd = useCallback(() => setSurfaceOverride('end-confirm'), [])
  const cancelEnd = useCallback(() => setSurfaceOverride(null), [])
  const confirmEnd = useCallback(() => dismiss(), [dismiss])

  useEffect(() => {
    if (!active || !currentStep) return
    const desired = resolveStepRoute(currentStep)
    if (desired && !matchRoute(location.pathname, currentStep.route)) {
      if (currentStep.action?.type === 'click') return
      if (currentStep.action?.type === 'route') return
      navigate(desired)
    }
  }, [active, currentStep, location.pathname, navigate, resolveStepRoute])

  useEffect(() => {
    if (!active || !currentStep?.targetId) {
      setTargetMissing(false)
      return
    }
    if (!matchRoute(location.pathname, currentStep.route)) return
    const targetId = currentStep.targetId
    let cancelled = false
    setTargetMissing(false)
    waitForTarget(targetId).then((node) => {
      if (cancelled) return
      if (node) {
        setTargetMissing(false)
        const live = resolveLiveTutorialTarget(targetId)
        const mark = live || node
        document.querySelectorAll('[data-tutorial-current="true"]').forEach((marked) => {
          marked.removeAttribute('data-tutorial-current')
        })
        mark.setAttribute('data-tutorial-current', 'true')
        if (shouldScrollToTarget(mark)) {
          window.requestAnimationFrame(() => scrollTargetIntoView(mark))
        }
        return
      }
      if (currentStep.optional) {
        if (skippedTarget.current === currentStep.id) return
        skippedTarget.current = currentStep.id
        next()
        return
      }
      setTargetMissing(true)
      console.warn('[tutorial] target missing', currentStep.id, currentStep.targetId)
    })
    return () => {
      cancelled = true
    }
  }, [active, currentStep, location.pathname, next])

  useEffect(() => {
    if (!active || !currentStep) return
    const action = currentStep.action
    if (!action) return

    if (action.type === 'route' && matchRoute(location.pathname, action.match)) {
      next()
      return
    }

    if (action.type === 'event') {
      const onEvent = () => next()
      window.addEventListener(action.name, onEvent)
      return () => window.removeEventListener(action.name, onEvent)
    }

    if (action.type !== 'click') return
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const hit = target.closest(`[data-tutorial-id="${action.targetId}"]`)
      if (!hit) return
      const control = hit instanceof HTMLButtonElement || hit instanceof HTMLAnchorElement
        ? hit
        : hit.querySelector('button, a')
      if (control instanceof HTMLButtonElement && control.disabled) return
      if (control instanceof HTMLAnchorElement && control.getAttribute('aria-disabled') === 'true') return
      window.setTimeout(() => next(), 40)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [active, currentStep, location.pathname, next])

  useEffect(() => {
    const sync = () => {
      document.querySelectorAll('[data-tutorial-current="true"]').forEach((node) => {
        node.removeAttribute('data-tutorial-current')
      })
      if (!active || !currentStep?.targetId) return
      const node = resolveLiveTutorialTarget(currentStep.targetId)
      if (node) node.setAttribute('data-tutorial-current', 'true')
    }
    sync()
    const timer = window.setInterval(sync, 300)
    return () => window.clearInterval(timer)
  }, [active, currentStep?.targetId, location.pathname, targetMissing])

  useEffect(() => {
    if (!active) {
      document.documentElement.removeAttribute('data-tutorial-active')
      document.documentElement.style.removeProperty('--tutorial-nav-inset')
      document.querySelectorAll('[data-tutorial-current="true"]').forEach((node) => {
        node.removeAttribute('data-tutorial-current')
      })
      return
    }
    const syncInset = () => {
      document.documentElement.style.setProperty('--tutorial-nav-inset', `${getNavInset()}px`)
    }
    document.documentElement.setAttribute('data-tutorial-active', 'true')
    syncInset()
    window.addEventListener('resize', syncInset)
    return () => {
      document.documentElement.removeAttribute('data-tutorial-active')
      document.documentElement.style.removeProperty('--tutorial-nav-inset')
      window.removeEventListener('resize', syncInset)
    }
  }, [active])

  const value = useMemo<TutorialContextValue>(() => ({
    tutorialId: definition.id,
    version: definition.version,
    progress,
    definition,
    steps,
    currentStep,
    currentIndex,
    stepCount: steps.length,
    surface,
    active,
    isSurfaceOpen: surface !== 'none',
    entryModuleId: entry?.moduleId || null,
    targetMissing,
    start,
    resume,
    later,
    dismiss,
    complete,
    restart,
    resetState,
    next,
    back,
    goToStep,
    requestEnd,
    cancelEnd,
    confirmEnd,
  }), [
    active,
    back,
    complete,
    currentIndex,
    currentStep,
    definition,
    dismiss,
    entry?.moduleId,
    goToStep,
    later,
    next,
    progress,
    requestEnd,
    resetState,
    restart,
    resume,
    start,
    steps,
    surface,
    targetMissing,
    cancelEnd,
    confirmEnd,
  ])

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider')
  return ctx
}

export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext)
}

export function useTutorialTarget(id: string, enabled = true) {
  const tutorial = useTutorialOptional()
  const isCurrent = Boolean(enabled && tutorial?.active && tutorial.currentStep?.targetId === id)
  return {
    active: isCurrent,
    props: { 'data-tutorial-id': id },
    highlight: isCurrent,
  }
}
