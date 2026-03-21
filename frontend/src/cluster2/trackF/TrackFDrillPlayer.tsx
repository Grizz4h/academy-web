import { useEffect, useMemo, useState } from 'react'
import { RendererHost } from '../core/RendererHost'
import type { Cluster2Drill, Cluster2DrillModule, Cluster2ModuleResponse, Cluster2TrackDefinition } from '../core/types'
import { f1DangerSpaceDrill } from './drills/f1-danger-space'
import { f2TippingPointDrill } from './drills/f2-tipping-point'
import { f3FirstPassOptionDrill } from './drills/f3-first-pass-option'

const TRACK_F: Cluster2TrackDefinition = {
  trackId: 'F',
  title: 'Raeumliches Situationslesen',
  clusterId: 2,
  drills: [f1DangerSpaceDrill, f2TippingPointDrill, f3FirstPassOptionDrill],
}

const initialResponseForModule = (module: Cluster2DrillModule): Cluster2ModuleResponse => ({
  moduleId: module.moduleId,
  type: module.type,
  value: defaultValueForModule(module),
  isValid: !module.required,
  touchedAt: null,
})

function defaultValueForModule(module: Cluster2DrillModule) {
  if (module.type === 'clickable_rink') return { selectedZones: [] }
  if (module.type === 'single_choice') return { selectedOption: '' }
  if (module.type === 'text_note') return { note: '' }
  return null
}

function validateModuleValue(module: Cluster2DrillModule, value: any): boolean {
  if (!module.required) return true

  if (module.type === 'clickable_rink') {
    return Array.isArray(value?.selectedZones) && value.selectedZones.length > 0
  }

  if (module.type === 'single_choice') {
    return typeof value?.selectedOption === 'string' && value.selectedOption.trim().length > 0
  }

  if (module.type === 'text_note') {
    return typeof value?.note === 'string' && value.note.trim().length > 0
  }

  return false
}

function buildInitialResponses(drill: Cluster2Drill) {
  return drill.modules.reduce<Record<string, Cluster2ModuleResponse>>((acc, module) => {
    acc[module.moduleId] = initialResponseForModule(module)
    return acc
  }, {})
}

export function TrackFDrillPlayer() {
  const [selectedDrillId, setSelectedDrillId] = useState<string>(TRACK_F.drills[0].drillId)
  const [moduleIndex, setModuleIndex] = useState(0)
  const [validationMessage, setValidationMessage] = useState('')
  const [responses, setResponses] = useState<Record<string, Cluster2ModuleResponse>>(() => buildInitialResponses(TRACK_F.drills[0]))
  const [showResults, setShowResults] = useState(false)

  const selectedDrill = useMemo(
    () => TRACK_F.drills.find((drill) => drill.drillId === selectedDrillId) || TRACK_F.drills[0],
    [selectedDrillId],
  )

  useEffect(() => {
    setResponses(buildInitialResponses(selectedDrill))
    setModuleIndex(0)
    setValidationMessage('')
    setShowResults(false)
  }, [selectedDrill])

  const currentModule = selectedDrill.modules[moduleIndex]
  const currentResponse = responses[currentModule.moduleId]
  const isLastModule = moduleIndex === selectedDrill.modules.length - 1

  const handleModuleChange = (value: any) => {
    const isValid = validateModuleValue(currentModule, value)
    setResponses((prev) => ({
      ...prev,
      [currentModule.moduleId]: {
        moduleId: currentModule.moduleId,
        type: currentModule.type,
        value,
        isValid,
        touchedAt: new Date().toISOString(),
      },
    }))
    setValidationMessage('')
  }

  const handleNext = () => {
    if (!currentResponse?.isValid) {
      setValidationMessage('Bitte beantworte dieses Pflichtfeld, bevor du weitergehst.')
      return
    }

    if (isLastModule) {
      setShowResults(true)
      setValidationMessage('')
      return
    }

    setModuleIndex((prev) => prev + 1)
    setValidationMessage('')
  }

  const handleBack = () => {
    if (showResults) {
      setShowResults(false)
      return
    }
    setModuleIndex((prev) => Math.max(0, prev - 1))
    setValidationMessage('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'end' }}>
          <div>
            <h1 style={{ marginBottom: '0.35rem' }}>Track F MVP</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Track {TRACK_F.trackId} | Cluster {TRACK_F.clusterId} | {TRACK_F.title}
            </p>
          </div>
          <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Beispiel-Drill</label>
            <select
              className="appSelect"
              value={selectedDrillId}
              onChange={(event) => setSelectedDrillId(event.target.value)}
            >
              {TRACK_F.drills.map((drill) => (
                <option key={drill.drillId} value={drill.drillId}>
                  {drill.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: '0.35rem' }}>{selectedDrill.title}</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Modul {Math.min(moduleIndex + 1, selectedDrill.modules.length)} von {selectedDrill.modules.length}
            </p>
          </div>
          <div style={{ alignSelf: 'center', opacity: 0.7, fontSize: '0.9rem' }}>
            {currentModule.required ? 'Pflichtmodul' : 'Optional'}
          </div>
        </div>
      </div>

      {!showResults && (
        <RendererHost
          module={currentModule}
          value={currentResponse?.value}
          onChange={handleModuleChange}
        />
      )}

      {validationMessage && (
        <div className="card" style={{ borderColor: 'rgba(255,120,120,0.35)', background: 'rgba(80, 12, 18, 0.55)' }}>
          <p style={{ margin: 0, color: '#ffd8d8' }}>{validationMessage}</p>
        </div>
      )}

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn" type="button" onClick={handleBack} disabled={moduleIndex === 0 && !showResults}>
          Zurueck
        </button>

        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>
          {showResults ? 'Ergebnisansicht' : `Aktuelles Modul: ${currentModule.moduleId}`}
        </div>

        <button className="btn" type="button" onClick={handleNext}>
          {isLastModule ? 'Abschliessen' : 'Weiter'}
        </button>
      </div>

      {showResults && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Antworten (Debug JSON)</h2>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'rgba(0,0,0,0.2)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {JSON.stringify(
              {
                trackId: TRACK_F.trackId,
                clusterId: TRACK_F.clusterId,
                drillId: selectedDrill.drillId,
                responses: Object.values(responses),
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  )
}