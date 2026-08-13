import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, type PredictionEntry } from '../api'
import { SceneMarkerButton } from '../components/SceneMarkerButton'
import GameContextSummary from '../components/game/GameContextSummary'
import GameStatsDevPanel from '../components/game/GameStatsDevPanel'
import { isDevNavEnabled } from '../config/featureFlags'
import { useUser } from '../context/UserContext'
import type { PredictionTemplate } from '../features/lab/types'
import {
  CompactPredictionCard,
  emptyPredictionDraft,
  emptyRevealDraft,
  OpenPredictionCard,
  PredictionHistoryDetails,
  PredictionInputForm,
  PredictionObservationState,
  PredictionProgress,
  PredictionResolutionForm,
  PredictionSessionSummary,
  type PredictionDraft,
  type PredictionRevealDraft,
} from '../features/lab/PredictComponents'
import { canEditLockedPrediction } from '../features/lab/predictCompare'
import {
  calculatePredictionCalibration,
  calculatePredictionSessionSummary,
  createPredictionEntry,
  findOpenPredictionEntry,
  resolvePredictionEntryForTemplate,
} from '../features/lab/predictService'
import { SessionReflectionPanel } from '../features/reflection/SessionReflectionPanel'
import { getActivePeriodsForScope, type PeriodPhase } from '../utils/observationScope'
import { formatGameTimeInput } from '../utils/sceneHelpers'

const phaseLabel: Record<string, string> = {
  P1: '1. Drittel',
  P2: '2. Drittel',
  P3: '3. Drittel',
}

const phaseNumber: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
}

const PREDICT_DRAFT_KEY = 'predict'

export default function LabPredictSession() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useUser()

  const [isPredictionFormOpen, setIsPredictionFormOpen] = useState(false)
  const [isResolutionOpen, setIsResolutionOpen] = useState(false)
  const [draft, setDraft] = useState<PredictionDraft>(emptyPredictionDraft())
  const [revealDraft, setRevealDraft] = useState<PredictionRevealDraft>(emptyRevealDraft())
  const [statusMessage, setStatusMessage] = useState('')
  const [justLocked, setJustLocked] = useState(false)
  const restoredDraftRef = useRef(false)

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!),
    enabled: Boolean(id),
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
  })

  const { data: labContent } = useQuery({
    queryKey: ['lab-content'],
    queryFn: () => api.getLabContent(),
  })

  const gameId = session?.game_id || session?.game_info?.game_id
  const { data: catalogGame } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => api.getGame(String(gameId)),
    enabled: Boolean(gameId),
  })

  const updateSessionMutation = useMutation({
    mutationFn: (updates: any) => api.updateSession(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
    },
  })

  const updatePhaseMutation = useMutation({
    mutationFn: (phase: string) => api.updateSessionPhase(id!, { phase, state: 'IN_PROGRESS' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      const entries = session?.prediction_entries || []
      const summary = calculatePredictionSessionSummary(entries)
      await api.updateSession(id!, {
        prediction_summary: summary,
      })
      return api.completeSession(id!, {
        summary: 'Predict-Session abgeschlossen',
        unclear: '',
        next_module: '',
        helpfulness: 0,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
      setStatusMessage('Session abgeschlossen.')
    },
  })

  const abortMutation = useMutation({
    mutationFn: () => api.abortSession(id!, { reason: 'other', note: 'Lab Predict abgebrochen' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
      setStatusMessage('Session wurde abgebrochen.')
    },
  })

  const template = ((labContent?.prediction_templates || []) as PredictionTemplate[])
    .find((item) => item.id === session?.lab_template_id)
  const entries = session?.prediction_entries || []
  const openEntry = findOpenPredictionEntry(entries, session?.open_prediction_id)
  const summary = calculatePredictionSessionSummary(entries)
  const insight = calculatePredictionCalibration(entries)
  const activePeriods = useMemo<PeriodPhase[]>(
    () => getActivePeriodsForScope(session?.observation_scope),
    [session?.observation_scope]
  )
  const fallbackPhase = activePeriods[0] || 'P1'
  const currentPhase = (session?.current_phase && activePeriods.includes(session.current_phase as PeriodPhase)
    ? session.current_phase
    : fallbackPhase) as PeriodPhase
  const lastPhase = activePeriods[activePeriods.length - 1] || 'P1'
  const canFinish = summary.resolved >= (template?.minimumResolvedPredictions || 0) && !openEntry && currentPhase === lastPhase
  const resolvedEntries = entries.filter((entry) => Boolean(entry.resolution))

  useEffect(() => {
    if (!session || restoredDraftRef.current) return
    restoredDraftRef.current = true
    const stored = session.drafts?.[PREDICT_DRAFT_KEY] as PredictionDraft | undefined
    if (stored && !openEntry) {
      setDraft({
        ...emptyPredictionDraft(),
        ...stored,
        context: stored.context || {},
        cues: stored.cues || [],
      })
      setIsPredictionFormOpen(true)
    }
  }, [session, openEntry])

  useEffect(() => {
    if (!id || !session || openEntry || !isPredictionFormOpen || session.state === 'COMPLETED' || session.state === 'ABORTED') return
    const handle = window.setTimeout(() => {
      const nextDrafts = {
        ...(session.drafts || {}),
        [PREDICT_DRAFT_KEY]: draft,
      }
      api.saveDrafts(id, nextDrafts).catch(() => undefined)
    }, 400)
    return () => window.clearTimeout(handle)
  }, [draft, id, isPredictionFormOpen, openEntry, session])

  const academyDrillTitle = useMemo(() => {
    if (!template?.relatedAcademyDrills?.length || !curriculum?.tracks) return null
    const targetDrillId = template.relatedAcademyDrills[0]
    for (const track of curriculum.tracks) {
      for (const module of track.modules) {
        const drill = module.drills.find((item) => item.id === targetDrillId)
        if (drill) return `${drill.id} · ${drill.title}`
      }
    }
    return targetDrillId
  }, [curriculum, template])

  if (isLoading) return <div className="card">Lade Predict-Session...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>
  if (!session) return <div className="card">Session nicht gefunden.</div>

  if (session.learning_area !== 'lab' || session.lab_mode !== 'predict') {
    return <div className="card">Diese Session gehört nicht zum Lab-Predict-Modus.</div>
  }

  if (!template) {
    return <div className="card">Aktuell sind keine Predict-Übungen verfügbar.</div>
  }

  const patchDraft = (patch: Partial<PredictionDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      if (patch.gameTime !== undefined) {
        next.gameTime = formatGameTimeInput(patch.gameTime)
      }
      return next
    })
  }

  const goToNextPhase = () => {
    const idx = activePeriods.indexOf(currentPhase)
    if (idx === -1 || idx === activePeriods.length - 1) return
    updatePhaseMutation.mutate(activePeriods[idx + 1])
  }

  const goToPreviousPhase = () => {
    const idx = activePeriods.indexOf(currentPhase)
    if (idx <= 0) return
    updatePhaseMutation.mutate(activePeriods[idx - 1])
  }

  const handleSavePrediction = async () => {
    if (openEntry && !canEditLockedPrediction(openEntry)) {
      setStatusMessage('Es gibt bereits eine offene Prediction. Bitte zuerst auflösen.')
      return
    }
    if (!draft.predictedValue || (template.confidence.enabled && !draft.confidence)) {
      setStatusMessage('Bitte Vorhersage und Sicherheit auswählen.')
      return
    }

    const newEntry = createPredictionEntry({
      session,
      templateId: template.id,
      categoryId: template.categoryId,
      predictedValue: draft.predictedValue,
      confidence: draft.confidence || 'medium',
      period: phaseNumber[currentPhase],
      order: openEntry?.order || entries.length + 1,
      gameTime: draft.gameTime,
      note: draft.note,
      context: draft.context,
      predictionCues: draft.cues,
      existingId: openEntry?.id,
      createdAt: openEntry?.createdAt,
    })

    const nextEntries = openEntry
      ? entries.map((entry) => entry.id === openEntry.id ? newEntry : entry)
      : [...entries, newEntry]
    const nextSummary = calculatePredictionSessionSummary(nextEntries)
    await updateSessionMutation.mutateAsync({
      prediction_entries: nextEntries,
      open_prediction_id: newEntry.id,
      prediction_summary: nextSummary,
    })
    await api.saveDrafts(id!, { ...(session.drafts || {}), [PREDICT_DRAFT_KEY]: undefined }).catch(() => undefined)

    setDraft(emptyPredictionDraft())
    setIsPredictionFormOpen(false)
    setJustLocked(true)
    window.setTimeout(() => setJustLocked(false), 900)
    setStatusMessage(`Prediction ${nextEntries.length} gespeichert`)
  }

  const handleResolvePrediction = async () => {
    if (!openEntry) {
      setStatusMessage('Keine offene Prediction gefunden.')
      return
    }
    if (!revealDraft.actualValue) {
      setStatusMessage('Bitte tatsächliche Aktion wählen.')
      return
    }

    const resolvedEntry: PredictionEntry = resolvePredictionEntryForTemplate({
      template,
      entry: openEntry,
      actualValue: revealDraft.actualValue,
      resolution: revealDraft.resolution,
      missedCue: revealDraft.missedCue,
      note: revealDraft.note,
      outcome: revealDraft.outcome,
      reflectionReads: revealDraft.reflectionReads,
      alternativeSolution: revealDraft.alternativeSolution,
    })

    const nextEntries = entries.map((entry) => entry.id === openEntry.id ? resolvedEntry : entry)
    const nextSummary = calculatePredictionSessionSummary(nextEntries)

    await updateSessionMutation.mutateAsync({
      prediction_entries: nextEntries,
      open_prediction_id: undefined,
      prediction_summary: nextSummary,
    })

    setRevealDraft(emptyRevealDraft())
    setIsResolutionOpen(false)
    setStatusMessage(`Prediction ${nextSummary.resolved} gespeichert`)
  }

  const handleActualChange = (patch: Partial<PredictionRevealDraft>) => {
    setRevealDraft((prev) => {
      const next = { ...prev, ...patch }
      if (patch.actualValue && openEntry) {
        if (patch.actualValue === 'nicht_beurteilbar') {
          next.resolution = 'unjudgeable'
        } else if (template.resolution.autoEvaluateExactMatches && patch.actualValue === openEntry.predictedValue) {
          next.resolution = 'correct'
        }
      }
      return next
    })
  }

  const startEditLockedPrediction = () => {
    if (!openEntry || !canEditLockedPrediction(openEntry)) return
    setDraft({
      context: openEntry.context || {},
      predictedValue: openEntry.predictedValue,
      cues: openEntry.predictionCues || [],
      confidence: openEntry.confidence,
      note: openEntry.note || '',
      gameTime: openEntry.gameTime || '',
    })
    setIsPredictionFormOpen(true)
    setIsResolutionOpen(false)
  }

  const handleCompleteSession = () => {
    if (openEntry) {
      setStatusMessage('Du hast noch eine offene Prediction. Löse sie auf oder markiere sie als nicht beurteilbar.')
      return
    }
    if (summary.resolved < template.minimumResolvedPredictions) {
      setStatusMessage('Das Mindestziel ist noch nicht erreicht.')
      return
    }
    if (currentPhase !== lastPhase) {
      setStatusMessage('Bitte wechsle zuerst in das letzte aktive Drittel dieser Session.')
      return
    }
    completeMutation.mutate()
  }

  const latestResolved = resolvedEntries[resolvedEntries.length - 1]

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '820px', margin: '0 auto' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Lab · Predict</h1>
        <p className="ui-section-title-content" style={{ margin: 0 }}>{template.title}</p>
      </header>

      <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
        <p>{template.description}</p>
        {template.learningGoal && <p>{template.learningGoal}</p>}
        <p style={{ marginBottom: '0.4rem' }}>
          Beobachtetes Team: <strong>{session.game_info?.observed_team || session.observed_team || 'Unbekannt'}</strong>
        </p>
        <p style={{ marginBottom: '0.4rem' }}>
          Aktives Drittel: <strong>{phaseLabel[currentPhase]}</strong>
        </p>
        {academyDrillTitle && <p style={{ marginBottom: 0 }}>Passende Akademie-Grundlage: {academyDrillTitle}</p>}
      </div>

      {catalogGame && (
        <div className="card" style={{ marginBottom: 0 }}>
          <GameContextSummary
            game={catalogGame}
            compact
            embedded
            perspectiveTeam={session.game_info?.observed_team || session.observed_team || undefined}
            showImportChrome
          />
          {isDevNavEnabled() && (
            <GameStatsDevPanel
              game={catalogGame}
              compact
              embedded
              perspectiveTeam={session.game_info?.observed_team || session.observed_team || undefined}
            />
          )}
        </div>
      )}

      {activePeriods.length > 1 && (
        <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Drittelsteuerung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              onClick={goToPreviousPhase}
              disabled={activePeriods.indexOf(currentPhase) <= 0 || updatePhaseMutation.isPending}
              style={{ minHeight: '44px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
            >
              Vorheriges Drittel
            </button>
            <button
              onClick={goToNextPhase}
              disabled={activePeriods.indexOf(currentPhase) >= activePeriods.length - 1 || updatePhaseMutation.isPending}
              style={{ minHeight: '44px', borderRadius: '8px', border: '1px solid rgba(129,196,214,0.5)', background: 'rgba(81,145,162,0.2)', color: '#f7f7ff', cursor: 'pointer' }}
            >
              Nächstes Drittel
            </button>
          </div>
        </div>
      )}

      <PredictionProgress
        summary={summary}
        minimumResolvedPredictions={template.minimumResolvedPredictions}
        recommendedPredictions={template.recommendedPredictions}
      />

      {latestResolved && !openEntry && !isPredictionFormOpen && session.state !== 'COMPLETED' && (
        <CompactPredictionCard
          template={template}
          entry={latestResolved}
          index={latestResolved.order || resolvedEntries.length}
        />
      )}

      {openEntry && !isResolutionOpen && !isPredictionFormOpen && (
        <OpenPredictionCard
          template={template}
          entry={openEntry}
          justLocked={justLocked}
          onResolve={() => {
            setIsResolutionOpen(true)
            setIsPredictionFormOpen(false)
          }}
          onEdit={canEditLockedPrediction(openEntry) ? startEditLockedPrediction : undefined}
        />
      )}

      {!openEntry && !isPredictionFormOpen && !isResolutionOpen && session.state !== 'COMPLETED' && session.state !== 'ABORTED' && (
        <PredictionObservationState
          template={template}
          hasOpenPrediction={Boolean(openEntry)}
          resolvedCount={resolvedEntries.length}
          onStartPrediction={() => {
            setIsPredictionFormOpen(true)
            setStatusMessage('')
          }}
        />
      )}

      {isPredictionFormOpen && (!openEntry || canEditLockedPrediction(openEntry)) && (
        <PredictionInputForm
          template={template}
          draft={draft}
          periodLabel={phaseLabel[currentPhase]}
          onChange={patchDraft}
          onCancelUnclear={() => {
            setIsPredictionFormOpen(false)
            setDraft(emptyPredictionDraft())
            api.saveDrafts(id!, { ...(session.drafts || {}), [PREDICT_DRAFT_KEY]: undefined }).catch(() => undefined)
            setStatusMessage('Situation wurde als nicht klar genug markiert.')
          }}
          onSave={handleSavePrediction}
          saving={updateSessionMutation.isPending}
        />
      )}

      {isResolutionOpen && openEntry && (
        <PredictionResolutionForm
          template={template}
          openEntry={openEntry}
          draft={revealDraft}
          onChange={handleActualChange}
          onResolve={handleResolvePrediction}
          onBack={() => {
            setIsResolutionOpen(false)
            setRevealDraft(emptyRevealDraft())
          }}
          saving={updateSessionMutation.isPending}
        />
      )}

      <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
        <h3 style={{ marginTop: 0 }}>Szenenmarkierung</h3>
        <p>Optional: interessante Szenen für später speichern – besonders wenn Prediction und Reality auseinanderlaufen.</p>
        <SceneMarkerButton session={session} currentPhase={currentPhase} activeDrill={null} />
      </div>

      {statusMessage && (
        <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
          <p style={{ margin: 0 }}>{statusMessage}</p>
        </div>
      )}

      {session.state === 'COMPLETED' && (
        <>
          <PredictionSessionSummary template={template} summary={summary} insight={insight} />
          <SessionReflectionPanel
            session={session}
            reflection={session.ai_reflection}
            onReflectionSaved={(reflection) => {
              queryClient.setQueryData(['session', id], (prev: typeof session | undefined) =>
                prev ? { ...prev, ai_reflection: reflection } : prev,
              )
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
            }}
          />
        </>
      )}

      <PredictionHistoryDetails
        template={template}
        entries={
          latestResolved && !openEntry && !isPredictionFormOpen && session.state !== 'COMPLETED'
            ? resolvedEntries.slice(0, -1)
            : entries
        }
      />

      {template.activeFocus && session.state !== 'COMPLETED' && (
        <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>{template.activeFocus.title}</h3>
          <p style={{ marginBottom: 0 }}>{template.activeFocus.text}</p>
        </div>
      )}

      {session.state !== 'COMPLETED' && session.state !== 'ABORTED' && (
        <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
          {openEntry && (
            <p style={{ color: '#ffd8a6' }}>
              Du hast noch eine offene Prediction. Löse sie auf oder markiere sie als nicht beurteilbar.
            </p>
          )}
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <button className="btn" disabled={!canFinish || completeMutation.isPending} onClick={handleCompleteSession} style={{ width: '100%', minHeight: '48px' }}>
              Session abschließen
            </button>
            <button
              onClick={() => {
                const shouldAbort = confirm('Session wirklich abbrechen?')
                if (shouldAbort) abortMutation.mutate()
              }}
              style={{ width: '100%', minHeight: '44px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
            >
              Session abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
