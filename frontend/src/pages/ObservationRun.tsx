import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type ObservationDimensions } from '../api'

const defaultDimensions: ObservationDimensions = {
  support_behavior: 'active',
  support_position: 'mid',
  decision_speed: 'fast',
  pressure_response: 'stable',
  off_puck_movement: 'active'
}

const DIMENSION_OPTIONS: Record<keyof ObservationDimensions, Array<ObservationDimensions[keyof ObservationDimensions]>> = {
  support_behavior: ['active', 'passive', 'none'],
  support_position: ['low', 'mid', 'high'],
  decision_speed: ['fast', 'delayed', 'risky'],
  pressure_response: ['stable', 'turnover', 'panic'],
  off_puck_movement: ['active', 'static', 'drifting']
}

function formatOption(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ObservationRun() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [dimensions, setDimensions] = useState<ObservationDimensions>(defaultDimensions)
  const [note, setNote] = useState('')

  const { data: run, isLoading: runLoading, error: runError } = useQuery({
    queryKey: ['observation-run', runId],
    queryFn: () => api.getObservationRun(runId!),
    enabled: Boolean(runId)
  })

  const { data: entriesResp, isLoading: entriesLoading } = useQuery({
    queryKey: ['observation-entries', runId],
    queryFn: () => api.getObservations({ run_id: runId }),
    enabled: Boolean(runId)
  })

  const entries = entriesResp?.observations || []

  const createEntryMutation = useMutation({
    mutationFn: () => api.createObservation({
      run_id: runId!,
      dimensions,
      note
    }),
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['observation-entries', runId] })
      queryClient.invalidateQueries({ queryKey: ['observation-stats'] })
    }
  })

  const dimensionKeys = useMemo(() => Object.keys(defaultDimensions) as Array<keyof ObservationDimensions>, [])

  if (runLoading) return <div className="card">Lade Observation Run...</div>
  if (runError) return <div className="card">Fehler: {(runError as Error).message}</div>
  if (!run) return <div className="card">Run nicht gefunden.</div>

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Observation Run</h1>
        <p className="ui-page-lead">
          {run.player_name} #{run.player_number ?? '-'} · {run.team_name} ({run.player_position})
        </p>
      </header>

      <div className="card" style={{ marginBottom: 0 }}>
        <p style={{ marginBottom: 0 }}>
          Liga: {run.league} | Saison: {run.season}
        </p>
      </div>

      <div className="card" style={{ display: 'grid', gap: '1rem' }}>
        {dimensionKeys.map((key) => (
          <fieldset key={key} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem' }}>
            <legend>{formatOption(key)}</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {DIMENSION_OPTIONS[key].map((value) => (
                <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="radio"
                    name={key}
                    value={value}
                    checked={dimensions[key] === value}
                    onChange={() => setDimensions((prev) => ({ ...prev, [key]: value as any }))}
                  />
                  <span>{formatOption(value)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <label>
          Notiz (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{ width: '100%', marginTop: '0.25rem' }}
            placeholder="Kurznotiz zur Szene"
          />
        </label>

        {createEntryMutation.isError && (
          <p style={{ color: '#ff8080' }}>Speichern fehlgeschlagen: {(createEntryMutation.error as Error).message}</p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => createEntryMutation.mutate()} disabled={createEntryMutation.isPending}>
            {createEntryMutation.isPending ? 'Speichert...' : 'Observation speichern'}
          </button>
          <button className="btn" onClick={() => navigate('/observation/stats')}>
            Zu Observation Stats
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Letzte Entries</h2>
        {entriesLoading && <p>Lade Entries...</p>}
        {!entriesLoading && entries.length === 0 && <p>Noch keine Observation Entries gespeichert.</p>}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {entries.slice(0, 10).map((entry) => (
            <div key={entry.entry_id} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.75rem' }}>
              <strong>{new Date(entry.created_at).toLocaleString()}</strong>
              <p style={{ margin: '0.5rem 0' }}>
                Support Behavior: {entry.dimensions.support_behavior} | Support Position: {entry.dimensions.support_position}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                Decision Speed: {entry.dimensions.decision_speed} | Pressure Response: {entry.dimensions.pressure_response} | Off Puck Movement: {entry.dimensions.off_puck_movement}
              </p>
              {entry.note && <p style={{ margin: 0 }}>Notiz: {entry.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
