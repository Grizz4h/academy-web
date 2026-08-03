import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, type PredictionEntry } from '../api'
import { SceneMarkerButton } from '../components/SceneMarkerButton'
import { useUser } from '../context/UserContext'
import type { PredictionTemplate } from '../features/lab/types'
import {
  OpenPredictionCard,
  PredictionHistoryDetails,
  PredictionInputForm,
  PredictionObservationState,
  PredictionProgress,
  PredictionResolutionForm,
  PredictionSessionSummary,
} from '../features/lab/PredictComponents'
import { calculatePredictionCalibration, calculatePredictionSessionSummary, createPredictionEntry, findOpenPredictionEntry, resolvePredictionEntry } from '../features/lab/predictService'
import { getActivePeriodsForScope, type PeriodPhase } from '../utils/observationScope'

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

export default function LabPredictSession() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useUser()

  const [isPredictionFormOpen, setIsPredictionFormOpen] = useState(false)
  const [isResolutionOpen, setIsResolutionOpen] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<string | undefined>(undefined)
  const [selectedConfidence, setSelectedConfidence] = useState<'low' | 'medium' | 'high' | undefined>(undefined)
  const [predictionNote, setPredictionNote] = useState('')
  const [selectedActual, setSelectedActual] = useState<string | undefined>(undefined)
  const [selectedResolution, setSelectedResolution] = useState<'correct' | 'partial' | 'incorrect' | 'unjudgeable' | undefined>(undefined)
  const [selectedMissedCue, setSelectedMissedCue] = useState<string | undefined>(undefined)
  const [statusMessage, setStatusMessage] = useState<string>('')

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

  const goToNextPhase = () => {
    const idx = activePeriods.indexOf(currentPhase)
    if (idx === -1 || idx === activePeriods.length - 1) return
    const next = activePeriods[idx + 1]
    updatePhaseMutation.mutate(next)
  }

  const goToPreviousPhase = () => {
    const idx = activePeriods.indexOf(currentPhase)
    if (idx <= 0) return
    const previous = activePeriods[idx - 1]
    updatePhaseMutation.mutate(previous)
  }

  const handleSavePrediction = async () => {
    if (openEntry) {
      setStatusMessage('Es gibt bereits eine offene Prediction. Bitte zuerst auflösen.')
      return
    }
    if (!selectedPrediction || !selectedConfidence) {
      setStatusMessage('Bitte Vorhersage und Sicherheit auswählen.')
      return
    }

    const newEntry = createPredictionEntry({
      session,
      templateId: template.id,
      categoryId: template.categoryId,
      predictedValue: selectedPrediction,
      confidence: selectedConfidence,
      period: phaseNumber[currentPhase],
      note: predictionNote,
    })

    const nextEntries = [...entries, newEntry]
    const nextSummary = calculatePredictionSessionSummary(nextEntries)
    await updateSessionMutation.mutateAsync({
      prediction_entries: nextEntries,
      open_prediction_id: newEntry.id,
      prediction_summary: nextSummary,
    })

    setSelectedPrediction(undefined)
    setSelectedConfidence(undefined)
    setPredictionNote('')
    setIsPredictionFormOpen(false)
    setStatusMessage(`Prediction ${nextEntries.length} gespeichert`)
  }

  const handleResolvePrediction = async () => {
    if (!openEntry) {
      setStatusMessage('Keine offene Prediction gefunden.')
      return
    }
    if (!selectedActual || !selectedResolution) {
      setStatusMessage('Bitte tatsächliche Aktion und Auflösung wählen.')
      return
    }

    const resolvedEntry: PredictionEntry = resolvePredictionEntry({
      entry: openEntry,
      actualValue: selectedActual,
      resolution: selectedResolution,
      missedCue: selectedMissedCue,
    })

    const nextEntries = entries.map((entry) => entry.id === openEntry.id ? resolvedEntry : entry)
    const nextSummary = calculatePredictionSessionSummary(nextEntries)

    await updateSessionMutation.mutateAsync({
      prediction_entries: nextEntries,
      open_prediction_id: undefined,
      prediction_summary: nextSummary,
    })

    setSelectedActual(undefined)
    setSelectedResolution(undefined)
    setSelectedMissedCue(undefined)
    setIsResolutionOpen(false)
    setStatusMessage(`Prediction ${nextSummary.resolved} gespeichert`)
  }

  const handleActualChange = (actualValue: string) => {
    setSelectedActual(actualValue)
    if (!openEntry) return

    if (actualValue === 'nicht_beurteilbar') {
      setSelectedResolution('unjudgeable')
      return
    }

    if (template.resolution.autoEvaluateExactMatches && actualValue === openEntry.predictedValue) {
      setSelectedResolution('correct')
    }
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

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '820px', margin: '0 auto' }}>
      <h1>Lab · Predict</h1>

      <div className="card" style={{ marginBottom: 0 }}>
        <h2 style={{ marginTop: 0 }}>{template.title}</h2>
        <p>{template.description}</p>
        <p style={{ marginBottom: '0.4rem' }}>
          Beobachtetes Team: <strong>{session.game_info?.observed_team || session.observed_team || 'Unbekannt'}</strong>
        </p>
        <p style={{ marginBottom: '0.4rem' }}>
          Aktives Drittel: <strong>{phaseLabel[currentPhase]}</strong>
        </p>
        {academyDrillTitle && <p style={{ marginBottom: 0 }}>Passende Academy-Grundlage: {academyDrillTitle}</p>}
      </div>

      {activePeriods.length > 1 && (
        <div className="card" style={{ marginBottom: 0 }}>
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

      <PredictionProgress summary={summary} minimumResolvedPredictions={template.minimumResolvedPredictions} />

      {openEntry && !isResolutionOpen && (
        <OpenPredictionCard template={template} entry={openEntry} onResolve={() => {
          setIsResolutionOpen(true)
          setIsPredictionFormOpen(false)
        }} />
      )}

      {!openEntry && !isPredictionFormOpen && !isResolutionOpen && (
        <PredictionObservationState
          hasOpenPrediction={Boolean(openEntry)}
          onStartPrediction={() => {
            setIsPredictionFormOpen(true)
            setStatusMessage('')
          }}
        />
      )}

      {isPredictionFormOpen && !openEntry && (
        <PredictionInputForm
          template={template}
          selectedPrediction={selectedPrediction}
          selectedConfidence={selectedConfidence}
          note={predictionNote}
          onChangePrediction={setSelectedPrediction}
          onChangeConfidence={setSelectedConfidence}
          onChangeNote={setPredictionNote}
          onCancelUnclear={() => {
            setIsPredictionFormOpen(false)
            setSelectedPrediction(undefined)
            setSelectedConfidence(undefined)
            setPredictionNote('')
            setStatusMessage('Situation wurde als nicht klar genug markiert.')
          }}
          onSave={handleSavePrediction}
        />
      )}

      {isResolutionOpen && openEntry && (
        <PredictionResolutionForm
          template={template}
          openEntry={openEntry}
          selectedActual={selectedActual}
          selectedResolution={selectedResolution}
          selectedMissedCue={selectedMissedCue}
          onChangeActual={handleActualChange}
          onChangeResolution={setSelectedResolution}
          onChangeMissedCue={setSelectedMissedCue}
          onResolve={handleResolvePrediction}
        />
      )}

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginTop: 0 }}>Szenenmarkierung</h3>
        <p>Du kannst weiterhin interessante Szenen für Rink About It markieren.</p>
        <SceneMarkerButton session={session} currentPhase={currentPhase} activeDrill={null} />
      </div>

      {statusMessage && (
        <div className="card" style={{ marginBottom: 0 }}>
          <p style={{ margin: 0 }}>{statusMessage}</p>
        </div>
      )}

      {session.state === 'COMPLETED' && (
        <PredictionSessionSummary template={template} summary={summary} insight={insight} />
      )}

      <PredictionHistoryDetails template={template} entries={entries} />

      {template.activeFocus && (
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>{template.activeFocus.title}</h3>
          <p style={{ marginBottom: 0 }}>{template.activeFocus.text}</p>
        </div>
      )}

      {session.state !== 'COMPLETED' && session.state !== 'ABORTED' && (
        <div className="card" style={{ marginBottom: 0 }}>
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
