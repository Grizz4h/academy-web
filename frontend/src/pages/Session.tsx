import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { detectDeviceType, evaluateSessionRewards, useRewards } from '../features/rewards'
import { buildEventsFromCompletedSession, buildReflectionCreatedEvent, buildTrackCompletionEvents } from '../features/progression'
import { isDummySession, isProgressionEligibleSession, getRealSessions } from '../utils/sessionEligibility'
import { isDevNavEnabled } from '../config/featureFlags'
import { UiButton } from '../components/ui'
import { RinQIcon } from '../components/icons'

import { DrillRendererRouter } from '../components/DrillRendererRouter';
import { SceneMarkerButton } from '../components/SceneMarkerButton';
import { SpecialTeamsSidequestButton } from '../components/SpecialTeamsSidequestButton';
import SyncStatusChip, { type SyncStatus } from '../components/SyncStatusChip';
import { formatCompetitionContext } from '../data/competitionConfig';
import { shareOrCopy } from '../utils/share';
import { useState, useEffect, useRef, useMemo } from 'react'
import { getActivePeriodsForScope, getObservationScopeLabel, isLessonScope, getNextPhaseForScope, getPreviousPhaseForScope } from '../utils/observationScope'
import { sessionExpectsPeriodMicrofeedback } from '../utils/sessionMicrofeedback'
import { SessionReflectionPanel } from '../features/reflection/SessionReflectionPanel'
import type { StoredAiReflection } from '../features/reflection/types'
import { TUTORIAL_TARGET, useTutorialOptional } from '../features/tutorial'
import stickyStyles from './SessionSticky.module.css'
import {
  resolveBeforeAfterCompareConfig,
  validateBeforeAfterCompareAnswers,
} from '../features/beforeAfterCompare/compareLogic'
import {
  resolveChangeTimelineConfig,
  validateChangeTimelineAnswers,
} from '../features/changeTimeline/timelineLogic'
import {
  resolveTriggerHypothesisConfig,
  validateTriggerHypothesisAnswers,
} from '../features/triggerHypothesis/hypothesisLogic'
import {
  resolveInteractionChainConfig,
  validateInteractionChainAnswers,
} from '../features/interactionChain/chainLogic'
import {
  resolveAdjustmentProfileConfig,
  validateAdjustmentProfileAnswers,
} from '../features/adjustmentProfile/profileLogic'
import {
  resolveOpportunityRateConfig,
  validateOpportunityRateAnswers,
} from '../features/opportunityRate/rateLogic'
import {
  resolveCohortRateCompareConfig,
  validateCohortRateCompareAnswers,
} from '../features/cohortRateCompare/compareLogic'
import {
  resolveConditionalOutcomeConfig,
  validateConditionalOutcomeAnswers,
} from '../features/conditionalOutcome/conditionLogic'
import {
  resolveEvidenceAssessmentConfig,
  validateEvidenceAssessmentAnswers,
} from '../features/evidenceAssessment/evidenceLogic'
import {
  resolveClaimLadderConfig,
  validateClaimLadderAnswers,
} from '../features/claimLadder/claimLogic'
import {
  resolveAnticipationReadConfig,
  validateAnticipationReadAnswers,
} from '../features/anticipationRead/readLogic'
import {
  resolveAnticipationProfileConfig,
  validateAnticipationProfileAnswers,
} from '../features/anticipationProfile/profileLogic'
import {
  isRoleIdentificationComplete,
  resolveRoleIdentificationConfig,
  validateRoleIdentificationAnswers,
} from '../features/roleIdentification/roleLogic'
import {
  isShiftTrackerComplete,
  resolveShiftTrackerConfig,
  validateShiftTrackerAnswers,
} from '../features/shiftTracker/shiftLogic'
import {
  isPlayerRelationComplete,
  resolvePlayerRelationConfig,
  validatePlayerRelationAnswers,
} from '../features/playerRelation/relationLogic'
import {
  isSimpleStructureComplete,
  resolveSimpleStructureConfig,
  validateSimpleStructureAnswers,
} from '../features/simpleStructure/structureLogic'
import {
  isTacticalObservationComplete,
  resolveTacticalObservationConfig,
  validateTacticalObservationAnswers,
} from '../features/tacticalObservation/tacticalLogic'

// Patch: Checkin type ohne microfeedback_done
type CheckinWithMicro = {
  phase: string;
  answers: any;
  feedback?: string;
  next_task?: string;
  [key: string]: any;
};

export default function SessionPage() {
  // Notizfeld für Session-Info
  const [sessionNote, setSessionNote] = useState<string>('')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const tutorial = useTutorialOptional()
  const { grantRewardResult, rewardState, ingestActivityEvents, evaluateLockerMetaProgress } = useRewards()

  type Phase = 'PRE' | 'P1' | 'P2' | 'P3' | 'POST';
  type PeriodPhase = 'P1' | 'P2' | 'P3'

  const [currentPhase, setCurrentPhase] = useState<Phase>('P1')
  const [drillCompleted, setDrillCompleted] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  /** Prevents sticky chrome from covering the post-complete CTA during refetch races */
  const [sessionFinished, setSessionFinished] = useState(false)

  const [answersByPhase, setAnswersByPhase] = useState<Record<Phase, any>>({
    PRE: {},
    P1: {},
    P2: {},
    P3: {},
    POST: {}
  })

  const [showMicroModal, setShowMicroModal] = useState(false)
  const [microText, setMicroText] = useState('')
  const [microFeedbackError, setMicroFeedbackError] = useState<string>('')
  const [advanceError, setAdvanceError] = useState<string>('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [shareNote, setShareNote] = useState<string>('')
  const [localReflection, setLocalReflection] = useState<StoredAiReflection | null>(null)

  // FIX: getrennte States für "Feedback gehört zu welcher Phase" und "wohin danach wechseln"
  const [microPhase, setMicroPhase] = useState<Phase | null>(null)
  const [pendingNextPhase, setPendingNextPhase] = useState<Phase | null>(null)

  // Double-submit hard guard
  const advanceLockRef = useRef(false)
  const draftSaveTimeoutRef = useRef<number | null>(null)
  const remoteDraftsRef = useRef<Record<string, any>>({})

  // Draft key pro Session+Phase (localStorage fallback)
  const draftKey = id ? `academy.session.${id}.phase.${currentPhase}` : null

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
    staleTime: 5 * 60 * 1000,
  })

  const activeDrill = useMemo(() => {
    const sessionDrill = session?.drills?.[0]
    if (!sessionDrill) return null

    const tracks = curriculum?.tracks
    if (!Array.isArray(tracks)) return sessionDrill

    const module = tracks
      .flatMap((track: any) => track.modules || [])
      .find((m: any) => m.id === session?.module_id)

    const latest = module?.drills?.find((d: any) => d.id === sessionDrill.id)
    return latest || sessionDrill
  }, [session, curriculum])

  const isFoundationSession = useMemo(() => {
    if (isLessonScope(session?.observation_scope)) return true
    if (activeDrill?.drill_type === 'foundation_lesson') return true
    const track = curriculum?.tracks?.find((t: any) =>
      (t.modules || []).some((m: any) => m.id === session?.module_id),
    )
    return track?.trackType === 'foundation'
  }, [session?.observation_scope, session?.module_id, activeDrill?.drill_type, curriculum])

  const activePeriods = useMemo<PeriodPhase[]>(
    () => getActivePeriodsForScope(session?.observation_scope),
    [session?.observation_scope]
  )

  const firstActivePeriod: PeriodPhase = activePeriods[0] || 'P1'

  const normalizePhaseForScope = (phaseRaw: string | undefined | null): Phase => {
    const phase = (phaseRaw || '').toUpperCase()
    if (phase === 'PRE' || phase === '') return firstActivePeriod
    if (phase === 'P1' || phase === 'P2' || phase === 'P3') {
      return (activePeriods.includes(phase as PeriodPhase) ? phase : firstActivePeriod) as Phase
    }
    if (phase === 'POST') return 'POST'
    return firstActivePeriod
  }

  const getNextPhaseForFlow = (phase: Phase): Phase | null => {
    return getNextPhaseForScope(phase, session?.observation_scope)
  }

  const getPreviousPhaseForFlow = (phase: Phase): Phase | null => {
    return getPreviousPhaseForScope(phase, session?.observation_scope)
  }

  useEffect(() => {
    remoteDraftsRef.current = session?.drafts || {}
  }, [session?.drafts])

  // Session Continuation: nur initial Phase aus Session übernehmen
  const firstLoadRef = useRef(true)
  /** Pro Session+Phase nur einmal vom Server/localStorage hydratisieren — Sync darf lokalen Input nicht überschreiben. */
  const hydratedPhaseKeysRef = useRef<Set<string>>(new Set())

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    hydratedPhaseKeysRef.current = new Set()
    firstLoadRef.current = true

    const noteKey = id ? `academy.session.${id}.note` : null
    if (noteKey) {
      const savedNote = localStorage.getItem(noteKey)
      setSessionNote(savedNote ?? '')
    } else {
      setSessionNote('')
    }
  }, [id])

  useEffect(() => {
    if (!session) return

    const initialPhase = normalizePhaseForScope(session.current_phase)
    if (firstLoadRef.current) {
      if (initialPhase && initialPhase !== currentPhase) {
        setCurrentPhase(initialPhase)
      }
      firstLoadRef.current = false
    }
  }, [session, id]) // absichtlich nicht currentPhase

  // Draft einmalig pro Phase laden (nicht bei jedem Sync-Refetch)
  useEffect(() => {
    if (!session || !id) return

    const hydrationKey = `${id}:${currentPhase}`
    if (hydratedPhaseKeysRef.current.has(hydrationKey)) return

    hydratedPhaseKeysRef.current.add(hydrationKey)

    if (session.drafts?.[currentPhase]) {
      setAnswersByPhase(prev => ({ ...prev, [currentPhase]: session.drafts?.[currentPhase] || {} }))
      return
    }

    if (draftKey) {
      try {
        const saved = localStorage.getItem(draftKey)
        if (saved) {
          setAnswersByPhase(prev => ({ ...prev, [currentPhase]: JSON.parse(saved) }))
        }
      } catch {
        // ignore corrupt local draft
      }
    }
  }, [session, id, currentPhase, draftKey])

  // Draft speichern bei Änderungen
  useEffect(() => {
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answersByPhase[currentPhase]))
    }
  }, [answersByPhase, currentPhase, draftKey])

  // Drafts auch serverseitig sichern, damit Gerätewechsel innerhalb des Drittels funktioniert.
  useEffect(() => {
    if (!id || !session) return

    const phaseAnswers = answersByPhase[currentPhase]
    const remotePhaseAnswers = remoteDraftsRef.current?.[currentPhase]
    const nextPhaseJson = JSON.stringify(phaseAnswers || {})
    const remotePhaseJson = JSON.stringify(remotePhaseAnswers || {})

    if (nextPhaseJson === remotePhaseJson) return

    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current)
    }

    setSyncStatus('saving')
    draftSaveTimeoutRef.current = window.setTimeout(async () => {
      const hasAnswers = phaseAnswers && Object.keys(phaseAnswers).length > 0
      const nextDrafts = { ...remoteDraftsRef.current }

      if (hasAnswers) {
        nextDrafts[currentPhase] = phaseAnswers
      } else {
        delete nextDrafts[currentPhase]
      }

      try {
        await api.saveDrafts(id, nextDrafts)
        remoteDraftsRef.current = nextDrafts
        queryClient.setQueryData(['session', id], (prev: any) => prev ? { ...prev, drafts: nextDrafts } : prev)
        setSyncStatus(navigator.onLine ? 'saved' : 'offline')
      } catch (err) {
        console.error('Failed to save remote drafts', err)
        setSyncStatus(navigator.onLine ? 'error' : 'offline')
      }
    }, 500)

    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current)
      }
    }
  }, [answersByPhase, currentPhase, id, queryClient, session])

  useEffect(() => {
    const onOnline = () => setSyncStatus((prev) => (prev === 'offline' ? 'saved' : prev))
    const onOffline = () => setSyncStatus('offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    if (!navigator.onLine) setSyncStatus('offline')
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const clearDraft = async () => {
    setAnswersByPhase(prev => ({ ...prev, [currentPhase]: {} }))
    if (draftKey) localStorage.removeItem(draftKey)

    if (!id) return

    const nextDrafts = { ...remoteDraftsRef.current }
    delete nextDrafts[currentPhase]

    try {
      await api.saveDrafts(id, nextDrafts)
      remoteDraftsRef.current = nextDrafts
      queryClient.setQueryData(['session', id], (prev: any) => prev ? { ...prev, drafts: nextDrafts } : prev)
    } catch (err) {
      console.error('Failed to clear remote draft', err)
    }
  }

  const checkinMutation = useMutation({
    mutationFn: (data: { phase: string; answers: any; feedback?: string; next_task?: string }) => api.saveCheckin(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      await clearDraft()
      setDrillCompleted(true)
    },
    onError: () => {}
  })

  const abortMutation = useMutation({
    mutationFn: (data: { reason: string; note?: string }) => api.abortSession(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })

  const updatePhaseMutation = useMutation({
    mutationFn: (phaseData: { phase?: string, state?: string }) => api.updateSessionPhase(id!, phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    }
  })

  // Microfeedback-Guard: Nur für P1/P2/P3, wenn session.microfeedback[phase].done !== true
  // und eine sichtbare Frage aus der Drill-Konfiguration auflösbar ist.
  function resolveMicrofeedbackContent(drill: any, answers: any): { question: string; hint: string | null; contextSummary: string | null } | null {
    if (!drill || !(drill as any).miniFeedback) return null
    const groups = (drill as any).miniFeedback.groups
    if (!Array.isArray(groups) || groups.length === 0) return null

    const sampleKey = (drill as any)?.config?.sample_key
    const samples = sampleKey && Array.isArray(answers?.[sampleKey])
      ? answers[sampleKey]
      : (Array.isArray(answers?.support_samples) ? answers.support_samples : [])
    const selectedIdx = Number.isInteger(answers?.selected_sample_index)
      ? answers.selected_sample_index
      : (samples.length > 0 ? samples.length - 1 : -1)
    const selectedSample = selectedIdx >= 0 && selectedIdx < samples.length ? samples[selectedIdx] : null

    const observationsKey = (drill as any)?.config?.observations_key
    const observations = observationsKey && Array.isArray(answers?.[observationsKey])
      ? answers[observationsKey]
      : []
    const lastObservation = observations.length > 0 ? observations[observations.length - 1] : null

    const resolveWhenValue = (key: string): any => {
      if (key.startsWith('sample.') && selectedSample) {
        return selectedSample[key.slice('sample.'.length)]
      }
      if (key.startsWith('observation.') && lastObservation) {
        return lastObservation[key.slice('observation.'.length)]
      }
      if (answers?.[key] !== undefined) {
        return answers[key]
      }
      if (selectedSample && (selectedSample as any)[key] !== undefined) {
        return (selectedSample as any)[key]
      }
      if (lastObservation && (lastObservation as any)[key] !== undefined) {
        return (lastObservation as any)[key]
      }
      return undefined
    }

    const pickFromGroup = (group: any) => {
      const questions = Array.isArray(group?.questions)
        ? group.questions.map((q: any) => String(q || '').trim()).filter(Boolean)
        : []
      if (questions.length === 0) return null
      const hintRaw = group?.hint || group?.helper_text || group?.help
      const hint = typeof hintRaw === 'string' && hintRaw.trim() ? hintRaw.trim() : null
      const contextSummary = typeof group?.context_summary === 'string' && group.context_summary.trim()
        ? group.context_summary.trim()
        : null
      return { question: questions[0], hint, contextSummary }
    }

    for (const group of groups) {
      let match = true
      const when = group?.when && typeof group.when === 'object' ? group.when : {}
      for (const key in when) {
        if (resolveWhenValue(key) !== when[key]) {
          match = false
          break
        }
      }
      if (!match) continue
      const picked = pickFromGroup(group)
      if (picked) return picked
    }

    for (const group of groups) {
      const picked = pickFromGroup(group)
      if (picked) return picked
    }

    return null
  }

  function needsMicrofeedback(phase: string, sessionObj: any, drill: any, answers?: any): boolean {
    if (!sessionExpectsPeriodMicrofeedback(sessionObj, curriculum)) return false
    if (!['P1', 'P2', 'P3'].includes(phase)) return false
    if (!drill) return false
    if (sessionObj?.microfeedback?.[phase]?.done === true) return false
    return !!resolveMicrofeedbackContent(drill, answers || {})
  }

  useEffect(() => {
    setSessionFinished(false)
  }, [id])

  useEffect(() => {
    if (session?.state === 'COMPLETED') setSessionFinished(true)
  }, [session?.state])

  useEffect(() => {
    if (drillCompleted) {
      setDrillCompleted(false)
    }
  }, [currentPhase])

  const finalizeSessionRewards = async (completedSession: any) => {
    await queryClient.invalidateQueries({ queryKey: ['session', id] })
    await queryClient.invalidateQueries({ queryKey: ['sessions'] })

    const freshSessions = await queryClient.fetchQuery({
      queryKey: ['sessions', user],
      queryFn: () => api.getSessions(user || undefined)
    })

    const rewardResult = evaluateSessionRewards({
      currentSession: completedSession,
      sessions: freshSessions,
      rewardState,
      context: {
        completedAt: completedSession.post?.completed_at || new Date().toISOString(),
        deviceType: detectDeviceType(),
        noteText: sessionNote,
        performance: null,
      }
    })

    if (isProgressionEligibleSession(completedSession)) {
      await grantRewardResult(rewardResult)

      const priorDrillIds = new Set(
        getRealSessions(freshSessions)
          .filter((s) => s.id !== completedSession.id && s.state === 'COMPLETED')
          .map((s) => String(s.drill_id || s.module_id || '').trim())
          .filter(Boolean),
      )
      const progressionEvents = buildEventsFromCompletedSession(completedSession, {
        priorCompletedDrillIds: priorDrillIds,
      })

      let trackDrills: Record<string, string[]> = {}
      try {
        const curriculumData = await queryClient.fetchQuery({
          queryKey: ['curriculum'],
          queryFn: () => api.getCurriculum(),
        })
        for (const track of curriculumData.tracks || []) {
          const ids: string[] = []
          for (const module of track.modules || []) {
            if (module.active === false) continue
            for (const drill of module.drills || []) {
              if (drill.id) ids.push(drill.id)
            }
            if (module.id) ids.push(module.id)
          }
          trackDrills[track.id] = Array.from(new Set(ids))
        }
        progressionEvents.push(
          ...buildTrackCompletionEvents(
            getRealSessions(freshSessions).filter((s) => s.state === 'COMPLETED'),
            trackDrills,
          ),
        )
      } catch {
        // Track completion optional
      }

      await ingestActivityEvents(progressionEvents)

      try {
        await evaluateLockerMetaProgress({
          sessions: getRealSessions(freshSessions).filter((s) => s.state === 'COMPLETED'),
          trackDrills,
        })
      } catch (metaError) {
        console.error('Locker mastery/collection evaluation failed', metaError)
      }
    }
  }

  const handleDrillComplete = (answers: any) => {
    checkinMutation.mutate({
      phase: currentPhase,
      answers
    }, {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ['session', id] })
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        await clearDraft()
        setDrillCompleted(true)
        if (currentPhase === 'POST') {
          try {
            const completedSession = await api.completeSession(id!, {
              summary: '',
              unclear: '',
              next_module: '',
              helpfulness: 0
            })
            if (completedSession) {
              setSessionFinished(true)
              queryClient.setQueryData(['session', id], completedSession)
            }
            window.dispatchEvent(new CustomEvent('academy-tutorial-session-completed', {
              detail: { sessionId: id, moduleId: completedSession?.module_id },
            }))
            void finalizeSessionRewards(completedSession).catch((rewardError) => {
              console.error('Reward evaluation failed', rewardError)
            })
          } catch (e) {}
        }
      }
    })
  }

  function validateDrillBeforeAdvance(phase: Phase, drill: any, answers: any): string | null {
    if (!['P1', 'P2', 'P3'].includes(phase)) return null
    if (!drill) return null

    const readPathValue = (obj: any, path: string) => {
      if (!obj || !path) return undefined
      return path.split('.').reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj)
    }

    if (drill.drill_type === 'foundation_lesson') {
      if (!answers?.foundationComplete) {
        return 'Bitte durchlaufe alle Lernschritte, bevor du weitergehst.'
      }
      return null
    }

    if (
      drill.drill_type === 'clickable_rink_observation'
      || drill.drill_type === 'draggable_rink_observation'
      || drill.drill_type === 'rink_zone_priority_observation'
      || drill.drill_type === 'rink_corridor_observation'
      || drill.drill_type === 'rink_segmented_zone_observation'
      || drill.drill_type === 'paintable_rink_observation'
    ) {
      const observationsKey = drill?.config?.observations_key || 'observations'
      const requiredObservations = Number(drill?.config?.observation_count || 3)
      const reflectionConfig = drill?.config?.reflection || drill?.config?.completion_reflection || null
      const reflectionKey = reflectionConfig?.key || null
      // Only require a classic reflection when one is actually configured in the drill.
      // Defaulting to "final_reflection" blocked drills that use completion_question instead (e.g. C1_D1).
      const reflectionEnabled = !!reflectionConfig && drill?.config?.reflection_enabled !== false
      const completionQuestionKey = drill?.config?.completion_question?.key || null
      const observations = Array.isArray(answers?.[observationsKey]) ? answers[observationsKey] : []

      if (observations.length < requiredObservations) {
        return 'Bitte erfasse alle ' + requiredObservations + ' Beobachtungen, bevor du weitergehst.'
      }

      const requiredObservationFields = Array.isArray(drill?.config?.required_observation_fields)
        ? drill.config.required_observation_fields
        : []

      if (requiredObservationFields.length > 0) {
        const hasAllRequiredObservationFields = observations.every((entry: any) => (
          requiredObservationFields.every((fieldPath: any) => {
            const value = readPathValue(entry, String(fieldPath || ''))
            if (Array.isArray(value)) return value.length > 0
            return value !== undefined && value !== null && value !== ''
          })
        ))

        if (!hasAllRequiredObservationFields) {
          return 'Bitte vervollständige alle erforderlichen Angaben in jeder Beobachtung, bevor du weitergehst.'
        }
      }

      const requiredPositionGroups = Array.isArray(drill?.config?.required_position_groups)
        ? drill.config.required_position_groups
        : []

      if (requiredPositionGroups.length > 0) {
        const hasAllRequiredPositionGroups = observations.every((entry: any) => (
          requiredPositionGroups.every((group: any) => {
            const path = String(group?.key || '')
            const minCount = Number(group?.count || 0)
            const value = readPathValue(entry, path)
            return Array.isArray(value) && value.length >= minCount
          })
        ))

        if (!hasAllRequiredPositionGroups) {
          return 'Bitte positioniere alle erforderlichen Spieler in jeder Beobachtung, bevor du weitergehst.'
        }
      }

      if (completionQuestionKey && !answers?.[completionQuestionKey]) {
        return 'Bitte beantworte die Abschlussfrage, bevor du weitergehst.'
      }

      if (reflectionEnabled && reflectionKey && !answers?.[reflectionKey]) {
        return 'Bitte beantworte kurz die Abschluss-Reflexion, bevor du weitergehst.'
      }
    }

    if (drill.drill_type === 'pattern_log' || drill.drill_type === 'multi_observation_pattern') {
      const logsKey = drill?.config?.logs_key || 'pattern_observations'
      const minObservations = Math.max(1, Number(drill?.config?.minObservations || 3))
      const assessmentKey = drill?.config?.assessment_key || 'pattern_assessment'
      const summaryKey = drill?.config?.summary_key || 'pattern_summary'
      const logs = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []

      if (logs.length < minObservations) {
        return 'Bitte erfasse mindestens ' + minObservations + ' Beobachtungen, bevor du weitergehst.'
      }

      if (!answers?.[assessmentKey]) {
        return 'Bitte bewerte, wie stark der Hinweis auf ein wiederkehrendes Muster ist.'
      }

      if (!String(answers?.[summaryKey] || '').trim()) {
        return 'Bitte beschreibe das mögliche Muster in einem Satz, bevor du weitergehst.'
      }
    }

    if (drill.drill_type === 'pattern_condition' || drill.drill_type === 'pattern_condition_matrix') {
      const logsKey = drill?.config?.logs_key || 'pattern_condition_cases'
      const candidateKey = drill?.config?.candidate_key || 'pattern_candidate'
      const minPatternCases = Math.max(1, Number(drill?.config?.minPatternCases || drill?.config?.minObservations || 3))
      const assessmentKey = drill?.config?.condition_assessment_key || 'condition_assessment'
      const ifThenKey = drill?.config?.if_then_key || 'if_then_summary'
      const relevantKey = drill?.config?.relevant_conditions_key || 'relevant_conditions'
      const cases = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []
      const patternCases = cases.filter((item: any) => (item?.caseType || 'pattern_case') === 'pattern_case')
      const counterCases = cases.filter((item: any) => item?.caseType === 'counter_case')
      const relevant = Array.isArray(answers?.[relevantKey]) ? answers[relevantKey] : []

      if (!String(answers?.[candidateKey] || '').trim()) {
        return 'Bitte formuliere zuerst, welches Verhalten du auf Bedingungen prüfen möchtest.'
      }

      if (patternCases.length < minPatternCases) {
        return 'Bitte erfasse mindestens ' + minPatternCases + ' Musterfälle, bevor du weitergehst.'
      }

      if (counterCases.length === 0 && answers?.__pattern_condition_no_counter !== true) {
        return 'Bitte bestätige, dass kein Gegenfall beobachtet wurde – oder erfasse einen Gegenfall.'
      }

      if (relevant.length === 0) {
        return 'Bitte markiere, welche Bedingungen Teil des Musters zu sein scheinen.'
      }

      const needsRole = relevant.some((entry: any) => (
        entry?.dimensionId
        && entry.dimensionId !== 'none_clear'
        && entry.dimensionId !== 'unclear'
        && !entry?.role
      ))
      if (needsRole) {
        return 'Bitte ordne die ausgewählten Bedingungen als Kern / unterstützend / beiläufig ein.'
      }

      if (counterCases.length > 0) {
        const diffsKey = drill?.config?.counter_differences_key || 'counter_case_differences'
        const diffs = Array.isArray(answers?.[diffsKey]) ? answers[diffsKey] : []
        if (diffs.length === 0) {
          return 'Bitte markiere, was im Gegenfall anders war.'
        }
      }

      if (!answers?.[assessmentKey]) {
        return 'Bitte bewerte, wie klar die Bedingungen des Musters sind.'
      }

      if (!String(answers?.[ifThenKey] || '').trim()) {
        return 'Bitte formuliere das Muster als Wenn–Dann-Satz.'
      }
    }

    if (drill.drill_type === 'pattern_invariant' || drill.drill_type === 'pattern_invariant_map') {
      const logsKey = drill?.config?.logs_key || 'pattern_invariant_observations'
      const candidateKey = drill?.config?.candidate_key || 'pattern_candidate'
      const minObservations = Math.max(1, Number(drill?.config?.minObservations || 3))
      const assessmentsKey = drill?.config?.dimension_assessments_key || 'dimension_assessments'
      const invariantSummaryKey = drill?.config?.invariant_summary_key || 'invariant_summary'
      const allowedVariationKey = drill?.config?.allowed_variation_key || 'allowed_variation'
      const flexibilityKey = drill?.config?.flexibility_key || 'flexibility_assessment'
      const primaryActionEqualityKey = drill?.config?.primary_action_equality_key || 'primary_action_equality'
      const defaultDims = ['zone', 'trigger', 'primaryAction', 'targetEffect', 'actorRole', 'side', 'sequenceSimilarity']
      const dims: string[] = Array.isArray(drill?.config?.invariant_dimensions) && drill.config.invariant_dimensions.length
        ? drill.config.invariant_dimensions
        : defaultDims
      const logs = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []
      const assessments = Array.isArray(answers?.[assessmentsKey]) ? answers[assessmentsKey] : []
      const allowed = Array.isArray(answers?.[allowedVariationKey]) ? answers[allowedVariationKey] : []

      if (!String(answers?.[candidateKey] || '').trim()) {
        return 'Bitte formuliere zuerst, welches Verhalten du zerlegen möchtest.'
      }

      if (logs.length < minObservations) {
        return 'Bitte erfasse mindestens ' + minObservations + ' Beobachtungen, bevor du weitergehst.'
      }

      const assessed = new Set(assessments.map((entry: any) => entry?.dimensionId).filter(Boolean))
      if (dims.some((dim) => !assessed.has(dim))) {
        return 'Bitte ordne jede Dimension als Kern / häufig / variabel ein.'
      }

      if (!answers?.[primaryActionEqualityKey]) {
        return 'Bitte bewerte, ob die zentrale Aktion funktional gleich war.'
      }

      if (!String(answers?.[invariantSummaryKey] || '').trim()) {
        return 'Bitte formuliere den kleinsten gemeinsamen funktionalen Kern.'
      }

      if (allowed.length === 0) {
        return 'Bitte markiere, welche Merkmale variieren dürfen.'
      }

      if (!answers?.[flexibilityKey]) {
        return 'Bitte schätze die Flexibilität des Musters ein.'
      }
    }

    if (drill.drill_type === 'pattern_attribution' || drill.drill_type === 'pattern_attribution_board') {
      const logsKey = drill?.config?.logs_key || 'pattern_attribution_observations'
      const candidateKey = drill?.config?.candidate_key || 'pattern_candidate'
      const minObservations = Math.max(1, Number(drill?.config?.minObservations || 3))
      const attributionKey = drill?.config?.attribution_key || 'pattern_attribution'
      const confidenceKey = drill?.config?.confidence_key || 'attribution_confidence'
      const strongestEvidenceKey = drill?.config?.strongest_evidence_key || 'strongest_evidence'
      const logs = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []

      if (!String(answers?.[candidateKey] || '').trim()) {
        return 'Bitte formuliere zuerst, welches Verhalten du auf Kontextstabilität prüfen möchtest.'
      }

      if (logs.length < minObservations) {
        return 'Bitte erfasse mindestens ' + minObservations + ' Beobachtungen, bevor du weitergehst.'
      }

      if (!answers?.[attributionKey]) {
        return 'Bitte ordne ein, in welchen beobachteten Kontexten das Verhalten sichtbar bleibt.'
      }

      if (!answers?.[confidenceKey]) {
        return 'Bitte schätze die Sicherheit der vorläufigen Einordnung ein.'
      }

      if (!String(answers?.[strongestEvidenceKey] || '').trim()) {
        return 'Bitte nenne die Beobachtung, die am deutlichsten für deine vorläufige Einordnung spricht.'
      }
    }

    if (drill.drill_type === 'tendency_profile' || drill.drill_type === 'pattern_tendency_profile') {
      const tendenciesKey = drill?.config?.tendencies_key || 'tendency_entries'
      const segmentSummaryKey = drill?.config?.segment_summary_key || 'segment_summary'
      const strongestKey = drill?.config?.strongest_tendency_key || 'strongest_tendency_id'
      const nextWatchKey = drill?.config?.next_watch_key || 'next_watch_tendency_id'
      const rawMin = drill?.config?.minTendencies
      const minTendencies = rawMin === undefined || rawMin === null ? 1 : Math.max(0, Number(rawMin))
      const maxTendencies = Math.max(minTendencies, Number(drill?.config?.maxTendencies || 3))
      const requireSegmentSummary = drill?.config?.require_segment_summary !== false
      const requireStrongest = drill?.config?.require_strongest_tendency !== false
      const requireNextWatch = drill?.config?.require_next_watch !== false
      const tendencies = Array.isArray(answers?.[tendenciesKey]) ? answers[tendenciesKey] : []

      if (tendencies.length < minTendencies) {
        return 'Bitte dokumentiere mindestens ' + minTendencies + ' Tendenz' + (minTendencies === 1 ? '' : 'en') + '.'
      }

      if (tendencies.length > maxTendencies) {
        return 'Maximal ' + maxTendencies + ' Tendenzen — bitte priorisiere.'
      }

      const incomplete = tendencies.some((entry: any) => (
        !String(entry?.summary || '').trim()
        || !entry?.frequency
        || !entry?.primaryCondition
        || !Array.isArray(entry?.stableCore)
        || entry.stableCore.length === 0
        || !Array.isArray(entry?.allowedVariation)
        || entry.allowedVariation.length === 0
        || !entry?.attribution
        || !entry?.confidence
        || !String(entry?.strongestEvidence || '').trim()
      ))
      if (incomplete) {
        return 'Bitte vervollständige alle Tendenzen (Beschreibung, Häufigkeit, Bedingung, Kernmerkmale, Variation, Kontext-Einordnung, Sicherheit, Indiz).'
      }

      if (requireStrongest && tendencies.length >= 2 && !answers?.[strongestKey]) {
        return 'Bitte markiere, welche vorläufige Tendenz am deutlichsten gestützt ist.'
      }

      if (requireSegmentSummary && !String(answers?.[segmentSummaryKey] || '').trim()) {
        return 'Bitte fasse die Tendenzen im beobachteten Segment zusammen (auch: keine ausreichend gestützte Tendenz).'
      }

      if (requireNextWatch && tendencies.length > 0 && !answers?.[nextWatchKey]) {
        return 'Bitte markiere, welche Tendenz du als Nächstes weiter beobachten würdest.'
      }
    }

    const defensiveLayer = String((drill?.config?.observationLayers || [])[0] || '')
    const isDefensiveObservationLog =
      drill.drill_type === 'observation_log_drill'
      || drill.drill_type === 'impact_classification_observation'
      || drill.drill_type === 'support_classification_observation'
      || drill.drill_type === 'sequence_classification_observation'
      || (
        drill?.config?.mechanic === 'defensive_observation'
        && ['pressure_effect', 'support_structure', 'sequence_analysis'].includes(defensiveLayer)
      )

    if (isDefensiveObservationLog) {
      const logsKey = drill?.config?.logs_key || 'logs'
      const requiredLogs = Number(drill?.config?.log_count || 3)
      const completionReflectionKey = drill?.config?.completion_reflection?.key
      const logs = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []

      if (logs.length < requiredLogs) {
        return 'Bitte erfasse alle ' + requiredLogs + ' Beobachtungen, bevor du weitergehst.'
      }

      if (completionReflectionKey && !answers?.[completionReflectionKey]) {
        return 'Bitte beantworte kurz die Abschluss-Reflexion, bevor du weitergehst.'
      }
    }

    const isDefensivePatternReflection =
      drill.drill_type === 'pattern_reflection_observation'
      || (
        drill?.config?.mechanic === 'defensive_observation'
        && defensiveLayer === 'pattern_recognition'
      )

    if (isDefensivePatternReflection) {
      const tendenciesKey = drill?.config?.tendencies?.key || 'observedDefensiveTendencies'
      const dimensions = Array.isArray(drill?.config?.tendencies?.dimensions)
        ? drill.config.tendencies.dimensions
        : []
      const changedKey = drill?.config?.changed_during_observation?.key || 'changedDuringObservation'
      const ratings = answers?.[tendenciesKey]
      const ratingsObj = ratings && typeof ratings === 'object' && !Array.isArray(ratings) ? ratings : null

      // Legacy single-identity answers alone are not enough to continue after the rebuild.
      if (!ratingsObj || dimensions.length === 0) {
        return 'Bitte schätze alle defensiven Beobachtungstendenzen ein, bevor du weitergehst.'
      }

      const missing = dimensions.some((dim: { id?: string }) => {
        const id = dim?.id
        return !id || !ratingsObj[id]
      })
      if (missing) {
        return 'Bitte schätze alle fünf Dimensionen ein (häufig / teilweise / selten / nicht sicher beurteilbar).'
      }

      if (!answers?.[changedKey]) {
        return 'Bitte beantworte die kurze Reflexionsfrage, bevor du weitergehst.'
      }
    }

    if (drill.drill_type === 'before_after_compare' || drill.drill_type === 'state_compare') {
      const cfg = resolveBeforeAfterCompareConfig(drill?.config || {})
      const stage = answers?.[cfg.stageKey]
      if (stage !== 'complete') {
        return 'Bitte schließe den Vorher/Nachher-Vergleich vollständig ab.'
      }
      return validateBeforeAfterCompareAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'change_timeline' || drill.drill_type === 'change_point_observation') {
      const cfg = resolveChangeTimelineConfig(drill?.config || {})
      if (answers?.__change_timeline_stage !== 'complete') {
        return 'Bitte schließe die Change-Timeline-Auswertung vollständig ab.'
      }
      return validateChangeTimelineAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'trigger_hypothesis' || drill.drill_type === 'adjustment_attribution') {
      const cfg = resolveTriggerHypothesisConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Adjustment-Hypothese vollständig ab.'
      }
      return validateTriggerHypothesisAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'interaction_chain' || drill.drill_type === 'problem_adjustment_response') {
      const cfg = resolveInteractionChainConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Adjustment-Kette vollständig ab.'
      }
      return validateInteractionChainAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'adjustment_profile' || drill.drill_type === 'multi_change_synthesis') {
      const cfg = resolveAdjustmentProfileConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe das Adjustment-Profil vollständig ab.'
      }
      return validateAdjustmentProfileAnswers(cfg, answers || {})
    }

    if (
      drill.drill_type === 'opportunity_rate'
      || drill.drill_type === 'rate_definition'
      || drill.drill_type === 'opportunity_tracker'
    ) {
      const cfg = resolveOpportunityRateConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Opportunity-Rate-Auswertung vollständig ab.'
      }
      return validateOpportunityRateAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'cohort_rate_compare' || drill.drill_type === 'sample_compare') {
      const cfg = resolveCohortRateCompareConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe den Gruppenvergleich vollständig ab.'
      }
      return validateCohortRateCompareAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'conditional_outcome_compare' || drill.drill_type === 'condition_outcome_matrix') {
      const cfg = resolveConditionalOutcomeConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Bedingungs-Auswertung vollständig ab.'
      }
      return validateConditionalOutcomeAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'evidence_assessment') {
      const cfg = resolveEvidenceAssessmentConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe das Evidence Assessment vollständig ab.'
      }
      return validateEvidenceAssessmentAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'claim_ladder' || drill.drill_type === 'evidence_profile') {
      const cfg = resolveClaimLadderConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Aussage-Synthese vollständig ab.'
      }
      return validateClaimLadderAnswers(cfg, answers || {})
    }

    if (
      drill.drill_type === 'anticipation_read'
      || drill.drill_type === 'next_action_prediction'
      || drill.drill_type === 'cue_priority'
      || drill.drill_type === 'cue_ranking'
      || drill.drill_type === 'scenario_branches'
      || drill.drill_type === 'prediction_update'
      || drill.drill_type === 'belief_update'
    ) {
      const cfg = resolveAnticipationReadConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Anticipation-Reads vollständig ab.'
      }
      return validateAnticipationReadAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'anticipation_profile') {
      const cfg = resolveAnticipationProfileConfig(drill?.config || {})
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe dein Anticipation Profile vollständig ab.'
      }
      return validateAnticipationProfileAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'role_identification') {
      const cfg = resolveRoleIdentificationConfig(drill?.config || {})
      if (!cfg.required) return null
      if (isRoleIdentificationComplete(cfg, answers || {})) return null
      const completedEarlier = (['P1', 'P2', 'P3'] as const).some((priorPhase) => (
        priorPhase !== phase && isRoleIdentificationComplete(cfg, answersByPhase[priorPhase] || {})
      ))
      if (completedEarlier) return null
      if (answers?.[cfg.stageKey] !== 'complete') {
        return 'Bitte schließe die Rollenidentifikation vollständig ab.'
      }
      return validateRoleIdentificationAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'shift_tracker') {
      const cfg = resolveShiftTrackerConfig(drill?.config || {})
      if (!cfg.required) return null
      if (isShiftTrackerComplete(cfg, answers || {})) return null
      const completedEarlier = (['P1', 'P2', 'P3'] as const).some((priorPhase) => (
        priorPhase !== phase && isShiftTrackerComplete(cfg, answersByPhase[priorPhase] || {})
      ))
      if (completedEarlier) return null
      return validateShiftTrackerAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'player_relation') {
      const cfg = resolvePlayerRelationConfig(drill?.config || {})
      if (!cfg.required) return null
      if (isPlayerRelationComplete(cfg, answers || {})) return null
      const completedEarlier = (['P1', 'P2', 'P3'] as const).some((priorPhase) => (
        priorPhase !== phase && isPlayerRelationComplete(cfg, answersByPhase[priorPhase] || {})
      ))
      if (completedEarlier) return null
      return validatePlayerRelationAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'simple_structure') {
      const cfg = resolveSimpleStructureConfig(drill?.config || {})
      if (!cfg.required) return null
      if (isSimpleStructureComplete(cfg, answers || {})) return null
      const completedEarlier = (['P1', 'P2', 'P3'] as const).some((priorPhase) => (
        priorPhase !== phase && isSimpleStructureComplete(cfg, answersByPhase[priorPhase] || {})
      ))
      if (completedEarlier) return null
      return validateSimpleStructureAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'tactical_observation') {
      const cfg = resolveTacticalObservationConfig(drill?.config || {})
      if (!cfg.required) return null
      if (isTacticalObservationComplete(cfg, answers || {})) return null
      const completedEarlier = (['P1', 'P2', 'P3'] as const).some((priorPhase) => (
        priorPhase !== phase && isTacticalObservationComplete(cfg, answersByPhase[priorPhase] || {})
      ))
      if (completedEarlier) return null
      return validateTacticalObservationAnswers(cfg, answers || {})
    }

    if (drill.drill_type === 'period_checkin' && drill?.config?.validate_answers === true) {
      const questions = Array.isArray(drill?.config?.questions) ? drill.config.questions : []
      for (const question of questions) {
        if (!question?.key) continue
        if (question.hidden === true || question.legacy === true) continue
        if (question.optional === true) continue
        if (question.required !== true && question.optional !== false) continue

        const value = answers?.[question.key]
        if (question.type === 'multi_select') {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Bitte beantworte alle erforderlichen Fragen, bevor du weitergehst.'
          }
          continue
        }

        if (question.type === 'text') {
          const trimmed = String(value || '').trim()
          const minChars = Number(question.min_chars || 0)
          if (!trimmed || (minChars > 0 && trimmed.length < minChars)) {
            return 'Bitte formuliere eine kurze Zusammenfassung, bevor du weitergehst.'
          }
          continue
        }

        if (value === undefined || value === null || String(value).trim() === '') {
          return 'Bitte beantworte alle erforderlichen Fragen, bevor du weitergehst.'
        }
      }
    }

    const isDecisionAnalysis =
      drill?.config?.mechanic === 'decision_analysis'
      || drill.drill_type === 'pressure_diagnosis'
      || drill.drill_type === 'decision_analysis'
      || drill?.config?.mode === 'pressure_diagnosis'
      || drill?.config?.mode === 'solution_type_diagnosis'
      || drill?.config?.mode === 'decision_cause_diagnosis'
      || drill?.config?.mode === 'transition_followup_assessment'

    if (isDecisionAnalysis) {
      const sampleKey = drill?.config?.sample_key || 'pressure_samples'
      const requiredSamples = Number(drill?.config?.required_samples || drill?.config?.max_samples_per_phase || 3)
      const checkinKey = drill?.config?.checkin?.key || 'dominant_source'
      const requiresCheckin = drill?.config?.enable_checkin !== false
        && drill?.config?.mode !== 'decision_cause_diagnosis'
        && drill?.config?.mode !== 'transition_followup_assessment'
        && !((drill?.config?.observationLayers || []).includes('pattern_synthesis'))
      const samples = Array.isArray(answers?.[sampleKey]) ? answers[sampleKey] : []
      const sampleFields = (Array.isArray(drill?.config?.sample_fields) && drill.config.sample_fields.length > 0
        ? drill.config.sample_fields
        : Array.isArray(drill?.config?.diagnosis_fields) && drill.config.diagnosis_fields.length > 0
          ? drill.config.diagnosis_fields
          : [
              { key: 'zeitdruck' },
              { key: 'raumdruck' },
              { key: 'gegnerdruck' },
              { key: 'optionsdruck' },
            ]
      ).filter((field: any) => field && field.hidden !== true && field.legacy !== true)
      const sampleLabel = drill?.config?.sample_label || 'Situation'

      // D5 pattern synthesis uses period questions, not sample logs.
      if ((drill?.config?.observationLayers || []).includes('pattern_synthesis') || (!drill?.config?.mode && Array.isArray(drill?.config?.questions))) {
        // fall through to question validation below when validate_answers is set
      } else {
        if (samples.length < requiredSamples) {
          return 'Bitte erfasse mindestens ' + requiredSamples + ' ' + sampleLabel + 'en, bevor du weitergehst.'
        }

        const hasAllFields = samples.every((sample: any) => sampleFields.every((field: any) => {
          const key = field.key
          const value = sample?.[key]
          return value !== undefined && value !== null && String(value).trim() !== ''
        }))
        if (!hasAllFields) {
          return 'Bitte vervollständige jede gespeicherte Situation.'
        }

        if (requiresCheckin && !answers?.[checkinKey]) {
          return 'Bitte wähle die häufigste Option aus, bevor du weitergehst.'
        }
      }
    }

    return null
  }

  // Save + Advance-Flow
  const handleAdvanceToNext = async (
    e?: React.SyntheticEvent,
    opts?: { skipGates?: boolean },
  ) => {
    e?.preventDefault?.()
    setAdvanceError('')

    const skipGates = Boolean(opts?.skipGates)
    const clickId = crypto.randomUUID().slice(0, 8)
    console.group(`[ADVANCE ${clickId}] CLICK`)
    console.log("phase_before:", currentPhase)
    console.log("isAdvancing_before:", isAdvancing)
    console.log("lock_before:", advanceLockRef.current)
    console.log("skipGates:", skipGates)

    if (advanceLockRef.current) {
      console.warn(`[ADVANCE ${clickId}] ABORT: lock active`)
      console.groupEnd()
      return
    }

    advanceLockRef.current = true
    setIsAdvancing(true)
    console.log(`[ADVANCE ${clickId}] LOCK SET`)

    try {
      const phase = currentPhase
      const next = getNextPhaseForFlow(phase)

      if (!skipGates) {
        const validationError = validateDrillBeforeAdvance(phase, activeDrill, answersByPhase[currentPhase])
        if (validationError) {
          setAdvanceError(validationError)
          return
        }
      }

      // 1) Checkin speichern
      await api.saveCheckin(id as string, {
        phase,
        answers: answersByPhase[currentPhase],
        _trace: clickId
      })

      // 2) Session frisch holen
      const sessionFresh = await queryClient.fetchQuery({ queryKey: ["session", id] })
      const sessionObj = sessionFresh as any
      const drill = activeDrill || sessionObj?.drills?.[0]

      // 3) Microfeedback-Guard
      if (!skipGates && needsMicrofeedback(phase, sessionObj, drill, answersByPhase[currentPhase])) {
        // FIX: microPhase ist die Phase, für die Feedback abgegeben wird
        setMicroPhase(phase)
        // nextPhase ist wohin wir danach wechseln
        setPendingNextPhase(next)
        setShowMicroModal(true)

        setIsAdvancing(false)
        advanceLockRef.current = false

        console.log(`[ADVANCE ${clickId}] MICROFEEDBACK MODAL for`, phase, "-> next:", next)
        console.groupEnd()
        return
      }

      // Foundation / lesson: skip period walking and POST form — complete in one step
      if (isFoundationSession) {
        await clearDraft()
        setDrillCompleted(true)
        const completedSession = await api.completeSession(id!, {
          summary: 'Foundation-Lektion abgeschlossen',
          unclear: '',
          next_module: '',
          helpfulness: 5,
        })
        setSessionFinished(true)
        if (completedSession) {
          queryClient.setQueryData(['session', id], completedSession)
        }
        await queryClient.invalidateQueries({ queryKey: ['session', id] })
        await queryClient.invalidateQueries({ queryKey: ['sessions'] })
        window.dispatchEvent(new CustomEvent('academy-tutorial-session-completed', {
          detail: { sessionId: id, moduleId: session?.module_id },
        }))
        // Rewards/progression must not block "Zurück zur Übersicht"
        void finalizeSessionRewards(completedSession).catch((rewardError) => {
          console.error('Reward evaluation failed', rewardError)
        })
        console.log(`[ADVANCE ${clickId}] FOUNDATION COMPLETE`)
        console.groupEnd()
        return
      }

      // 4) Phase updaten (ohne Modal)
      if (next) {
        await api.updateSessionPhase(id as string, { phase: next })
        setCurrentPhase(next)
        setDrillCompleted(false)

        if (sessionObj?.drafts && sessionObj.drafts[next]) {
          setAnswersByPhase(prev => ({ ...prev, [next]: sessionObj.drafts?.[next] || {} }))
        } else {
          const existingCheckin = sessionObj?.checkins?.find((c: any) => c.phase === next) as CheckinWithMicro | undefined
          setAnswersByPhase(prev => ({ ...prev, [next]: existingCheckin?.answers || {} }))
        }

        await queryClient.invalidateQueries({ queryKey: ["session", id] })
      }
    } catch (err) {
      console.error(`[ADVANCE ${clickId}] ERROR`, err)
    } finally {
      setIsAdvancing(false)
      advanceLockRef.current = false
      console.log(`[ADVANCE ${clickId}] DONE`)
      console.groupEnd()
    }
  }

  const handleGoBack = () => {
    // Auto-save current answers if any
    if (answersByPhase[currentPhase] && Object.keys(answersByPhase[currentPhase]).length > 0) {
      checkinMutation.mutate({
        phase: currentPhase,
        answers: answersByPhase[currentPhase]
      })
      console.log("SAVE CHECKIN PAYLOAD", {
        phase: currentPhase,
        answers: answersByPhase[currentPhase]
      })
    }

    const prevPhase = getPreviousPhaseForFlow(currentPhase)
    if (prevPhase) {
      setCurrentPhase(prevPhase)
      setDrillCompleted(false)
      updatePhaseMutation.mutate({ phase: prevPhase })

      // Antworten für vorherige Phase laden (Draft oder Checkin)
      if (session?.drafts && session.drafts[prevPhase]) {
        setAnswersByPhase(prev => ({ ...prev, [prevPhase]: session.drafts?.[prevPhase] || {} }))
      } else {
        const existingCheckin = session?.checkins?.find((c: any) => c.phase === prevPhase)
        setAnswersByPhase(prev => ({ ...prev, [prevPhase]: existingCheckin?.answers || {} }))
      }
    }
  }

  const handleSessionAbort = () => {
    const reason = prompt("Warum möchtest du die Session abbrechen?\n- time: Zeit knapp\n- wrong_game: Falsches Spiel\n- no_motivation: Keine Motivation\n- bad_session: Session war schlecht\n- other: Anderer Grund")
    if (reason) {
      const note = prompt("Optionale Notiz:")
      abortMutation.mutate({
        reason,
        note: note || undefined
      })
    }
  }

  const isCompleted = session?.state === 'COMPLETED' || sessionFinished
  const activeReflection = localReflection ?? session?.ai_reflection ?? null
  const tutorialWaitingForComplete = Boolean(
    tutorial?.active
    && tutorial.currentStep?.action?.type === 'event'
    && tutorial.currentStep.action.name === 'academy-tutorial-session-completed',
  )

  useEffect(() => {
    if (!isCompleted || !session?.id) return
    window.dispatchEvent(new CustomEvent('academy-tutorial-session-completed', {
      detail: { sessionId: session.id, moduleId: session.module_id },
    }))
  }, [isCompleted, session?.id, session?.module_id, tutorialWaitingForComplete])

  // Keep completion CTA reachable; sticky/reward overlays previously ate the first taps
  useEffect(() => {
    if (!isCompleted) return
    const timer = window.setTimeout(() => {
      const node =
        document.querySelector<HTMLElement>('[data-session-complete-cta="true"]')
        || document.querySelector<HTMLElement>('[data-tutorial-id="session-result"]')
      node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [isCompleted])

  const getPhaseTitle = (phase: string) => {
    if (isFoundationSession || isLessonScope(session?.observation_scope)) {
      if (phase === 'P1' || phase === 'P2' || phase === 'P3') return 'Lektion'
      if (phase === 'POST') return 'Abschluss'
    }
    if (phase === 'PRE') return 'Vor dem Spiel'
    if (phase === 'P1') return '1. Drittel'
    if (phase === 'P2') return '2. Drittel'
    if (phase === 'P3') return '3. Drittel'
    if (phase === 'POST') return 'Nach dem Spiel'
    return phase
  }

  const foundationReady = Boolean(answersByPhase[currentPhase]?.foundationComplete)
  const showDevSkip =
    Boolean(session) &&
    !isCompleted &&
    session?.state !== 'ABORTED' &&
    (isDummySession(session) || isDevNavEnabled()) &&
    Boolean(getNextPhaseForFlow(currentPhase) || isFoundationSession)
  const advanceCtaLabel = (() => {
    if (isAdvancing) return 'Speichere…'
    if (isFoundationSession) return 'Session abschließen'
    if (getNextPhaseForFlow(currentPhase) === 'POST') return 'Session abschließen'
    return 'Weiter →'
  })()
  const stickyCtaLabel = (() => {
    if (isAdvancing) return 'Speichere…'
    if (isFoundationSession) return 'Session abschließen'
    if (getNextPhaseForFlow(currentPhase) === 'POST') return 'Abschließen'
    return 'Weiter →'
  })()
  const devSkipLabel = (() => {
    if (isAdvancing) return 'Skip…'
    if (isFoundationSession || getNextPhaseForFlow(currentPhase) === 'POST') return 'DEV: Skip → Abschluss'
    return 'DEV: Weiter (Skip)'
  })()

  function handleDraftChange(answers: any): void {
    setAnswersByPhase(prev => ({ ...prev, [currentPhase]: answers }))
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answers))
    }
  }

  if (isLoading) return <div className="card">Lade Session...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>
  if (!session) return <div className="card">Session nicht gefunden.</div>

  return (
    <div className="ui-page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">{isFoundationSession ? 'Foundation-Lektion' : 'Live-Session'}</h1>
        <p className="ui-section-title-content" style={{ margin: 0 }}>{session.module_id}</p>
      </header>

      <div className="card ui-surface ui-surface--section ui-flat-mobile">
        <h2 className="ui-section-title">{isFoundationSession ? 'Lektion' : 'Spiel-Info'}</h2>
        {isFoundationSession ? (
          <>
            <p><strong>Modul:</strong> {session.module_id}</p>
            {session.drill_id && <p><strong>Drill:</strong> {session.drill_id}</p>}
            <p><strong>Umfang:</strong> {getObservationScopeLabel(session.observation_scope)}</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'rgba(167, 243, 208, 0.88)' }}>
              Foundation — keine Live-Paarung nötig.
            </p>
          </>
        ) : session.game_info ? (
          <>
            <p><strong>Teams:</strong> {session.game_info.team_home} vs {session.game_info.team_away}</p>
            <p><strong>Beobachtetes Team:</strong> {session.game_info.observed_team_name || session.game_info.observed_team || session.observed_team || 'Beobachtetes Team nicht hinterlegt'}</p>
            <p><strong>Datum:</strong> {session.game_info.date}</p>
            <p><strong>Liga:</strong> {session.game_info.league.replace(/_/g, ' ')}</p>
            {session.game_info.season && <p><strong>Saison:</strong> {session.game_info.season}</p>}
            {(session.game_info.competition_phase || session.game_info.matchday) && (
              <p><strong>Wettbewerb:</strong> {formatCompetitionContext(session.game_info) || session.game_info.matchday}</p>
            )}
            <p><strong>Beobachtungsumfang:</strong> {getObservationScopeLabel(session.observation_scope)}</p>
            {activeDrill && (
              <p><strong>Drill:</strong> {activeDrill.title || activeDrill.id}{activeDrill.id ? ` (${activeDrill.id})` : ''}</p>
            )}
          </>
        ) : (
          <>
            <p>Keine Spiel-Info verfügbar</p>
            <p><strong>Beobachtetes Team:</strong> {session.observed_team || 'Beobachtetes Team nicht hinterlegt'}</p>
            <p><strong>Ziel:</strong> {session.goal}</p>
            <p><strong>Status:</strong> {session.state}</p>
            <p><strong>Beobachtungsumfang:</strong> {getObservationScopeLabel(session.observation_scope)}</p>
          </>
        )}

        {/* Notizfeld */}
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="session-note" style={{ fontWeight: 500 }}>Notiz zur Session:</label>
          <textarea
            id="session-note"
            value={sessionNote}
            onChange={e => {
              setSessionNote(e.target.value)
              const noteKey = id ? `academy.session.${id}.note` : null
              if (noteKey) localStorage.setItem(noteKey, e.target.value)
            }}
            rows={2}
            style={{ width: '100%', minHeight: 48, maxHeight: 80, marginTop: 4, borderRadius: 4, padding: 6, resize: 'vertical', fontSize: '1rem', lineHeight: 1.4 }}
            placeholder="Hier kannst du eine Notiz für die gesamte Session festhalten..."
          />
        </div>
      </div>

      {!isCompleted && (
        <div className={`card ${(currentPhase === 'P1' || currentPhase === 'P2' || currentPhase === 'P3') ? 'period-analysis-wrapper' : ''}`}>
          {currentPhase === 'POST' && (
            <div>
              <button onClick={() => handleDrillComplete(answersByPhase[currentPhase])} className="btn btn-success" style={{ minWidth: 120 }}>
                Drill abschließen
              </button>
            </div>
          )}

          {(currentPhase === 'P1' || currentPhase === 'P2' || currentPhase === 'P3') && (
            <div>
              {isFoundationSession ? (
                <p className="period-analysis-title" data-tutorial-id={TUTORIAL_TARGET.sessionDrill}>
                  Arbeite die Schritte der Lektion durch. Danach unten „Session abschließen“.
                </p>
              ) : (
                <p className="period-analysis-title" data-tutorial-id={TUTORIAL_TARGET.sessionDrill}>
                  Analysiere das letzte Drittel und gib Feedback.
                </p>
              )}
              {advanceError && (
                <div style={{ marginBottom: '0.8rem', padding: '0.6rem 0.8rem', background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.4)', borderRadius: '0.45rem', color: '#ffb7bf', fontSize: '0.9rem' }}>
                  {advanceError}
                </div>
              )}
              {activeDrill ? (
                <DrillRendererRouter
                  drill={activeDrill}
                  answers={answersByPhase[currentPhase] || {}}
                  setAnswers={(newAnswers) => setAnswersByPhase(prev => ({ ...prev, [currentPhase]: newAnswers || {} }))}
                  session={session}
                  phase={currentPhase}
                />
              ) : (
                <p>Keine Drills für diese Session verfügbar.</p>
              )}

              {!isFoundationSession && (
              <div className={stickyStyles.sidequestRow}>
                <SceneMarkerButton
                  session={session}
                  currentPhase={currentPhase}
                  activeDrill={activeDrill}
                />
                <SpecialTeamsSidequestButton
                  session={session}
                  currentPhase={currentPhase}
                  activeDrill={activeDrill}
                  phaseAnswers={answersByPhase[currentPhase]}
                  onAppendSidequest={handleDraftChange}
                />
              </div>
              )}
              {!isCompleted && session.state !== 'ABORTED' && (['P1', 'P2', 'P3'] as Phase[]).includes(currentPhase) && (
                <div className={stickyStyles.stickyClearance} aria-hidden="true" />
              )}

              <div className={stickyStyles.inlineNav}>
                <div className={stickyStyles.inlinePhase}>{getPhaseTitle(currentPhase)}</div>
                <div className={stickyStyles.inlineActions}>
                  {!isFoundationSession && currentPhase !== firstActivePeriod && getPreviousPhaseForFlow(currentPhase) && (
                    <button onClick={handleGoBack} className="btn" style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', minWidth: 120 }}>
                      ← Zurück
                    </button>
                  )}
                  {(getNextPhaseForFlow(currentPhase) || isFoundationSession) && (
                    <button
                      onClick={handleAdvanceToNext}
                      className="btn"
                      style={{ minWidth: 140 }}
                      data-tutorial-id={TUTORIAL_TARGET.sessionAdvance}
                      disabled={isAdvancing || (isFoundationSession && !foundationReady)}
                    >
                      {advanceCtaLabel}
                    </button>
                  )}
                  {showDevSkip ? (
                    <UiButton
                      type="button"
                      variant="dev"
                      size="sm"
                      disabled={isAdvancing}
                      onClick={(e) => handleAdvanceToNext(e, { skipGates: true })}
                      title="Überspringt Drill-Pflicht und Microfeedback"
                    >
                      {devSkipLabel}
                    </UiButton>
                  ) : null}
                </div>
                <SyncStatusChip status={syncStatus} />
              </div>

              {!isCompleted && session.state !== 'ABORTED' && (['P1', 'P2', 'P3'] as Phase[]).includes(currentPhase) && (
                <div className={stickyStyles.stickyBar} data-session-sticky="true">
                  <div className={stickyStyles.stickyTop}>
                    <span className={stickyStyles.phaseLabel}>{getPhaseTitle(currentPhase)}</span>
                    <SyncStatusChip status={syncStatus} />
                  </div>
                  <div className={stickyStyles.stickyActions}>
                    {!isFoundationSession && currentPhase !== firstActivePeriod && getPreviousPhaseForFlow(currentPhase) && (
                      <button type="button" className={stickyStyles.stickyBtn} onClick={handleGoBack}>
                        ← Zurück
                      </button>
                    )}
                    {(getNextPhaseForFlow(currentPhase) || isFoundationSession) && (
                      <button
                        type="button"
                        className={`${stickyStyles.stickyBtn} ${stickyStyles.stickyBtnPrimary}`}
                        onClick={handleAdvanceToNext}
                        data-tutorial-id={TUTORIAL_TARGET.sessionAdvance}
                        disabled={isAdvancing || (isFoundationSession && !foundationReady)}
                      >
                        {stickyCtaLabel}
                      </button>
                    )}
                    {showDevSkip ? (
                      <button
                        type="button"
                        className={stickyStyles.stickyBtn}
                        disabled={isAdvancing}
                        onClick={(e) => handleAdvanceToNext(e, { skipGates: true })}
                        title="Überspringt Drill-Pflicht und Microfeedback"
                        style={{
                          borderColor: 'rgba(245, 158, 11, 0.55)',
                          color: 'rgba(253, 186, 116, 1)',
                          background: 'rgba(245, 158, 11, 0.12)',
                        }}
                      >
                        {devSkipLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isCompleted && session.state !== 'ABORTED' && (
        <div className="card">
          <button onClick={handleSessionAbort} className="btn" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }} disabled={abortMutation.isPending}>
            {abortMutation.isPending ? 'Breche ab...' : 'Session abbrechen'}
          </button>
        </div>
      )}

      {session.checkins && session.checkins.length > 0 && (
        <div className="card">
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Check-in-Verlauf (klicken zum Ausklappen)
            </summary>
            {session.checkins.map((checkin: any, i: number) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                <h4>{getPhaseTitle(checkin.phase)} - {new Date(checkin.timestamp).toLocaleString()}</h4>
                <pre style={{ fontSize: '0.8rem' }}>{JSON.stringify(checkin.answers, null, 2)}</pre>
                {checkin.feedback && <p><strong>Feedback:</strong> {checkin.feedback}</p>}
                {checkin.next_task && <p><strong>Nächste Aufgabe:</strong> {checkin.next_task}</p>}
              </div>
            ))}
          </details>
        </div>
      )}

      {isCompleted && (
        <div className="card" data-tutorial-id={TUTORIAL_TARGET.sessionResult} style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="flex items-center justify-center gap-2 flex-wrap">
            Session abgeschlossen!
            <RinQIcon name="celebrate" size="lg" tone="accent" badge />
          </h2>
          <p>Alle aktiven Phasen wurden erfolgreich absolviert.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/')}
            >
              Zurück zur Übersicht
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'transparent', border: '1px solid rgba(129,221,245,0.45)', color: '#bae6fd' }}
              onClick={async () => {
                try {
                  const matchup = session.game_info?.team_home && session.game_info?.team_away
                    ? `${session.game_info.team_home} vs ${session.game_info.team_away}`
                    : session.module_id
                  const result = await shareOrCopy({
                    title: 'Rink Tank Session',
                    text: `Session abgeschlossen: ${matchup} · ${session.module_id}`,
                  })
                  setShareNote(result === 'shared' ? 'Geteilt.' : 'In Zwischenablage kopiert.')
                } catch {
                  // user cancelled share
                }
              }}
            >
              Teilen
            </button>
          </div>
          {shareNote && <p style={{ marginTop: '0.55rem', color: '#99f6e4', fontSize: '0.85rem' }}>{shareNote}</p>}
          <div className={stickyStyles.completeClearance} aria-hidden="true" />
        </div>
      )}

      {isCompleted ? (
        <div className={stickyStyles.completeBar} data-session-complete-cta="true">
          <button
            type="button"
            className={`${stickyStyles.stickyBtn} ${stickyStyles.stickyBtnPrimary}`}
            onClick={() => navigate('/')}
          >
            Zurück zur Übersicht
          </button>
        </div>
      ) : null}

      {isCompleted && session && (
        <SessionReflectionPanel
          session={session}
          reflection={activeReflection}
          onReflectionSaved={(reflection) => {
            setLocalReflection(reflection)
            queryClient.setQueryData(['session', id], (prev: typeof session | undefined) =>
              prev ? { ...prev, ai_reflection: reflection } : prev,
            )
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            if (session && !isDummySession(session)) {
              void ingestActivityEvents([
                buildReflectionCreatedEvent({
                  sessionId: session.id,
                  drillId: session.drill_id,
                  trackId: session.module_id,
                  gameId: session.game_id || session.game_info?.game_id,
                  occurredAt: reflection.createdAt || new Date().toISOString(),
                  isDummy: false,
                }),
              ])
            }
          }}
        />
      )}

      {session?.state === 'ABORTED' && (
        <div className="card">
          <h2>Session abgebrochen</h2>
          <p><strong>Grund:</strong> {session.abort?.reason}</p>
          {session.abort?.note && <p><strong>Notiz:</strong> {session.abort.note}</p>}
          <p><strong>Abgebrochen am:</strong> {session.abort?.aborted_at ? new Date(session.abort.aborted_at).toLocaleString() : 'Unbekannt'}</p>
          <button type="button" className="btn" onClick={() => navigate('/')}>
            Zurück zur Übersicht
          </button>
        </div>
      )}

      {/* Microfeedback Modal */}
      {showMicroModal && (() => {
        const drill = activeDrill
        const resolved = resolveMicrofeedbackContent(drill, answersByPhase[currentPhase] || {})
        if (!resolved) return null

        const { question, hint, contextSummary } = resolved

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 500, width: '95%', margin: '0 auto' }}>
              <h3 className="flex items-center gap-2">
                <RinQIcon name="terms" size="md" badge />
                Microfeedback
              </h3>
              {contextSummary && (
                <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.3rem' }}>Ausgewählter Moment</span>
                  {contextSummary}
                </div>
              )}
              <div style={{ marginBottom: hint ? '0.45rem' : '1.2rem', fontWeight: 600, textAlign: 'center', color: '#b6e2f7', fontSize: '1.02rem', lineHeight: 1.4 }}>
                {question}
              </div>
              {hint && (
                <p style={{ marginTop: 0, marginBottom: '1.1rem', textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  {hint}
                </p>
              )}

              <textarea
                value={microText}
                onChange={e => setMicroText(e.target.value)}
                placeholder="Kurze Antwort …"
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', marginBottom: 8 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  className="btn"
                  style={{ background: '#6c757d' }}
                  onClick={() => {
                    setShowMicroModal(false)
                    setMicroPhase(null)
                    setPendingNextPhase(null)
                    setMicroText('')
                    setMicroFeedbackError('')
                  }}
                >
                  Abbrechen
                </button>

                <button
                  className="btn"
                  disabled={!microText.trim()}
                  onClick={async () => {
                    if (!microText.trim()) return
                    if (!microPhase) return

                    try {
                      // 1) Microfeedback für DIE Phase speichern, in der du gerade warst (P1/P2/P3)
                      await api.addMicrofeedback(id!, microPhase as 'P1' | 'P2' | 'P3', microText.trim())

                      // 2) UI schließen
                      setShowMicroModal(false)
                      setMicroText('')
                      setMicroFeedbackError('')

                      // 3) Jetzt Phase wechseln
                      const next = pendingNextPhase
                      setMicroPhase(null)
                      setPendingNextPhase(null)

                      if (next) {
                        await api.updateSessionPhase(id as string, { phase: next })
                        setCurrentPhase(next)
                        setDrillCompleted(false)

                        // answers für next laden (draft oder checkin), aber nix resetten
                        const sessionFresh = await queryClient.fetchQuery({ queryKey: ["session", id] })
                        const sessionObj = sessionFresh as any

                        if (sessionObj?.drafts && sessionObj.drafts[next]) {
                          setAnswersByPhase(prev => ({ ...prev, [next]: sessionObj.drafts[next] || {} }))
                        } else {
                          const existingCheckin = sessionObj?.checkins?.find((c: any) => c.phase === next)
                          setAnswersByPhase(prev => ({ ...prev, [next]: existingCheckin?.answers || {} }))
                        }
                      }

                      await queryClient.invalidateQueries({ queryKey: ['session', id] })
                    } catch (err: any) {
                      setMicroFeedbackError(err?.message || 'Speichern fehlgeschlagen')
                    }
                  }}
                >
                  {pendingNextPhase === 'POST' ? 'Speichern & Session abschließen' : 'Speichern & Weiter'}
                </button>
              </div>

              {microFeedbackError && <div style={{ color: 'red', marginTop: '1rem' }}>{microFeedbackError}</div>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}