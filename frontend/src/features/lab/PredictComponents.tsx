import type { PredictionEntry, PredictionSessionSummary } from '../../api'
import type { ReactNode } from 'react'
import type { PredictionTemplate } from './types'
import { getActualOutcomeLabel, getConfidenceLabel, getPredictionOptionLabel, getResolutionLabel } from './predictLabels'

export function LabModuleNavigation(props: {
  modules: Array<{ id: string; label: string; description: string; enabled: boolean }>
  activeId: string
  onSelect: (moduleId: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
      {props.modules.map((module) => (
        <button
          key={module.id}
          className="btn"
          onClick={() => props.onSelect(module.id)}
          style={{
            background: props.activeId === module.id ? '#80e0fa' : 'rgba(81,145,162,0.2)',
            color: props.activeId === module.id ? '#031019' : '#d8e1ff',
            border: '1px solid rgba(129, 196, 214, 0.5)',
            minHeight: '42px',
          }}
        >
          {module.label}
        </button>
      ))}
    </div>
  )
}

export function PredictModule(props: {
  templateCount: number
  onStart: () => void
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Predict</h2>
      <p>Spielsituationen lesen und die nächste Aktion vorhersagen.</p>
      <p style={{ color: 'rgba(216,225,255,0.8)' }}>
        Verfügbare Übungen: {props.templateCount}
      </p>
      <button className="btn" onClick={props.onStart} style={{ minHeight: '46px', marginTop: '0.4rem' }}>
        Predict-Session starten
      </button>
    </div>
  )
}

export function PredictionTemplatePicker(props: {
  templates: PredictionTemplate[]
  selectedTemplateId: string
  onSelectTemplate: (templateId: string) => void
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Template-Auswahl</h2>
      {!props.templates.length && <p>Aktuell sind keine Predict-Übungen verfügbar.</p>}
      {props.templates.map((template) => {
        const selected = props.selectedTemplateId === template.id
        return (
          <button
            key={template.id}
            onClick={() => props.onSelectTemplate(template.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              marginBottom: '0.75rem',
              padding: '0.9rem',
              borderRadius: '10px',
              border: selected ? '1px solid #80e0fa' : '1px solid rgba(255,255,255,0.16)',
              background: selected ? 'rgba(128,224,250,0.12)' : 'rgba(5,7,18,0.55)',
              color: '#f7f7ff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{template.title}</div>
            <div style={{ color: 'rgba(216,225,255,0.9)', fontSize: '0.92rem' }}>{template.description}</div>
          </button>
        )
      })}
    </div>
  )
}

export function PredictionSessionSetup(props: {
  children: ReactNode
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Session-Setup</h2>
      {props.children}
    </div>
  )
}

export function PredictionObservationState(props: {
  hasOpenPrediction: boolean
  onStartPrediction: () => void
}) {
  return (
    <div className="card primary-card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Beobachten</h2>
      <p>Warte auf einen kontrollierten Puckgewinn des ausgewählten Teams.</p>
      <button
        className="btn"
        onClick={props.onStartPrediction}
        disabled={props.hasOpenPrediction}
        style={{ minHeight: '50px', width: '100%' }}
      >
        Prediction abgeben
      </button>
    </div>
  )
}

export function ConfidenceSelector(props: {
  template: PredictionTemplate
  selectedValue?: string
  onChange: (value: 'low' | 'medium' | 'high') => void
}) {
  if (!props.template.confidence.enabled) return null
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{props.template.confidence.question}</div>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {props.template.confidence.options.map((option) => (
          <label key={option.value} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', fontSize: '0.95rem' }}>
            <input
              type="radio"
              name="predict-confidence"
              checked={props.selectedValue === option.value}
              onChange={() => props.onChange(option.value as 'low' | 'medium' | 'high')}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function PredictionInputForm(props: {
  template: PredictionTemplate
  selectedPrediction?: string
  selectedConfidence?: 'low' | 'medium' | 'high'
  note: string
  onChangePrediction: (value: string) => void
  onChangeConfidence: (value: 'low' | 'medium' | 'high') => void
  onChangeNote: (value: string) => void
  onCancelUnclear: () => void
  onSave: () => void
}) {
  const isValid = Boolean(props.selectedPrediction && (!props.template.confidence.enabled || props.selectedConfidence))
  return (
    <div className="card primary-card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Prediction erfassen</h2>
      <p style={{ marginTop: 0 }}>{props.template.predictionPrompt}</p>
      <div style={{ display: 'grid', gap: '0.55rem', marginBottom: '1rem' }}>
        {props.template.predictionOptions.map((option) => (
          <label key={option.value} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', fontSize: '0.95rem' }}>
            <input
              type="radio"
              name="predict-choice"
              checked={props.selectedPrediction === option.value}
              onChange={() => props.onChangePrediction(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description && <span style={{ display: 'block', color: 'rgba(216,225,255,0.75)' }}>{option.description}</span>}
            </span>
          </label>
        ))}
      </div>

      <ConfidenceSelector
        template={props.template}
        selectedValue={props.selectedConfidence}
        onChange={props.onChangeConfidence}
      />

      {props.template.note?.enabled && (
        <div style={{ marginTop: '0.9rem' }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>{props.template.note.label}</label>
          <textarea
            value={props.note}
            onChange={(event) => props.onChangeNote(event.target.value)}
            placeholder={props.template.note.placeholder}
            maxLength={props.template.note.maxChars || 300}
            style={{ width: '100%', minHeight: '74px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#050712', color: '#f7f7ff', padding: '0.6rem' }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.55rem', marginTop: '1rem' }}>
        <button className="btn" onClick={props.onSave} disabled={!isValid} style={{ minHeight: '48px', width: '100%' }}>
          Prediction speichern
        </button>
        <button
          onClick={props.onCancelUnclear}
          style={{ minHeight: '44px', width: '100%', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
        >
          Situation nicht klar genug
        </button>
      </div>
    </div>
  )
}

export function OpenPredictionCard(props: {
  template: PredictionTemplate
  entry: PredictionEntry
  onResolve: () => void
}) {
  return (
    <div className="card primary-card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Offene Prediction</h2>
      <p style={{ marginBottom: '0.5rem' }}>Deine Prediction</p>
      <p style={{ marginTop: 0 }}>
        <strong>{getPredictionOptionLabel(props.template, props.entry.predictedValue)}</strong>
      </p>
      <p style={{ marginTop: 0 }}>
        Sicherheit: <strong>{getConfidenceLabel(props.template, props.entry.confidence)}</strong>
      </p>
      <button className="btn" onClick={props.onResolve} style={{ width: '100%', minHeight: '48px' }}>
        Prediction auflösen
      </button>
    </div>
  )
}

export function PredictionResolutionForm(props: {
  template: PredictionTemplate
  openEntry: PredictionEntry
  selectedActual?: string
  selectedResolution?: 'correct' | 'partial' | 'incorrect' | 'unjudgeable'
  selectedMissedCue?: string
  onChangeActual: (value: string) => void
  onChangeResolution: (value: 'correct' | 'partial' | 'incorrect' | 'unjudgeable') => void
  onChangeMissedCue: (value: string) => void
  onResolve: () => void
}) {
  const canResolve = Boolean(props.selectedActual && props.selectedResolution)
  return (
    <div className="card primary-card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Prediction auflösen</h2>
      <p style={{ marginBottom: '0.25rem' }}>Gespeicherte Vorhersage: <strong>{getPredictionOptionLabel(props.template, props.openEntry.predictedValue)}</strong></p>

      <div style={{ fontWeight: 700, marginTop: '0.8rem', marginBottom: '0.4rem' }}>{props.template.resolution.actualOutcomePrompt}</div>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {props.template.resolution.actualOutcomeOptions.map((option) => (
          <label key={option.value} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
            <input
              type="radio"
              name="actual-outcome"
              checked={props.selectedActual === option.value}
              onChange={() => props.onChangeActual(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div style={{ fontWeight: 700, marginTop: '0.95rem', marginBottom: '0.4rem' }}>{props.template.resolution.evaluationPrompt}</div>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {props.template.resolution.evaluationOptions.map((option) => (
          <label key={option.value} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
            <input
              type="radio"
              name="prediction-resolution"
              checked={props.selectedResolution === option.value}
              onChange={() => props.onChangeResolution(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {props.template.missedCue?.enabled && (
        <div style={{ marginTop: '0.95rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>{props.template.missedCue.prompt}</label>
          <select
            className="appSelect"
            value={props.selectedMissedCue || ''}
            onChange={(event) => props.onChangeMissedCue(event.target.value)}
          >
            <option value="">Optional auswählen</option>
            {props.template.missedCue.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      <button className="btn" onClick={props.onResolve} disabled={!canResolve} style={{ width: '100%', minHeight: '48px', marginTop: '1rem' }}>
        Auflösung speichern
      </button>
    </div>
  )
}

export function PredictionProgress(props: {
  summary: PredictionSessionSummary
  minimumResolvedPredictions: number
}) {
  const reached = props.summary.resolved >= props.minimumResolvedPredictions
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ marginTop: 0 }}>Fortschritt</h3>
      <p style={{ margin: 0 }}>
        {props.summary.resolved} von {props.minimumResolvedPredictions} Mindest-Predictions abgeschlossen
      </p>
      {reached && <p style={{ marginBottom: 0, color: '#9ee5b4' }}>Mindestziel erreicht</p>}
    </div>
  )
}

export function PredictionSessionSummary(props: {
  template: PredictionTemplate
  summary: PredictionSessionSummary
  insight: string | null
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ marginTop: 0 }}>Deine Predict-Session</h3>
      <p style={{ marginTop: 0 }}>{props.summary.total} Predictions</p>
      <p style={{ margin: '0.2rem 0' }}>{props.summary.correct} eingetroffen</p>
      <p style={{ margin: '0.2rem 0' }}>{props.summary.partial} teilweise eingetroffen</p>
      <p style={{ margin: '0.2rem 0' }}>{props.summary.incorrect} nicht eingetroffen</p>
      <p style={{ margin: '0.2rem 0' }}>{props.summary.unjudgeable} nicht beurteilbar</p>
      <p style={{ margin: '0.8rem 0 0.2rem' }}>
        Am häufigsten erwartet: <strong>{getPredictionOptionLabel(props.template, props.summary.mostPredictedValue)}</strong>
      </p>
      <p style={{ margin: '0.2rem 0 0.8rem' }}>
        Tatsächlich am häufigsten: <strong>{getActualOutcomeLabel(props.template, props.summary.mostActualValue)}</strong>
      </p>
      {props.insight && <p style={{ marginBottom: 0, color: 'rgba(216,225,255,0.88)' }}>{props.insight}</p>}
    </div>
  )
}

export function PredictionHistoryDetails(props: {
  template: PredictionTemplate
  entries: PredictionEntry[]
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ marginTop: 0 }}>Einzelne Predictions</h3>
      {!props.entries.length && <p style={{ marginBottom: 0 }}>Noch keine Predictions gespeichert.</p>}
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {props.entries.map((entry, index) => (
          <div key={entry.id} style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '0.7rem' }}>
            <strong>Prediction {index + 1}</strong>
            <div style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>Vorhersage: {getPredictionOptionLabel(props.template, entry.predictedValue)}</div>
            <div style={{ fontSize: '0.9rem' }}>Tatsächlich: {getActualOutcomeLabel(props.template, entry.actualValue)}</div>
            <div style={{ fontSize: '0.9rem' }}>Auflösung: {getResolutionLabel(props.template, entry.resolution)}</div>
            <div style={{ fontSize: '0.9rem' }}>Sicherheit: {getConfidenceLabel(props.template, entry.confidence)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
