import { useState, useRef, useEffect } from 'react'
import { api, type Session, type Drill } from '../api'
import { formatGameTimeInput } from '../utils/sceneHelpers'

interface SceneMarkerExtension {
  type: 'select'
  key: string
  label: string
  options: string[]
}

interface SceneMarkerButtonProps {
  session: Session
  currentPhase: string
  activeDrill: Drill | null
}

export function SceneMarkerButton({ session, currentPhase, activeDrill }: SceneMarkerButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [gameTime, setGameTime] = useState('')
  const [note, setNote] = useState('')
  const [extensionValues, setExtensionValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sceneMarkerExtensions: SceneMarkerExtension[] = Array.isArray(activeDrill?.config?.sceneMarkerExtensions)
    ? activeDrill.config.sceneMarkerExtensions.filter((extension: any) =>
        extension?.type === 'select' &&
        typeof extension.key === 'string' &&
        typeof extension.label === 'string' &&
        Array.isArray(extension.options) &&
        extension.options.length > 0
      )
    : []

  // Focus game_time input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showModal])

  const handleOpen = () => {
    setGameTime('')
    setNote('')
    setExtensionValues({})
    setError(null)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setError(null)
  }

  const handleSave = async () => {
    const trimmed = gameTime.trim()
    if (!trimmed) {
      setError('Bitte Spielzeit eingeben (z. B. 13:42)')
      return
    }
    if (!/^\d{1,2}(:\d{1,2})?$/.test(trimmed)) {
      setError('Bitte eine Spielzeit eingeben – maximal 4 Ziffern, z. B. 13:42')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const scene = await api.createScene({
        session_id: session.id,
        module_id: session.module_id,
        track_id: session.module_id,
        drill_id: activeDrill?.id,
        drill_title: activeDrill?.title,
        source: {
          type: 'drill',
          session_id: session.id,
          drill_id: activeDrill?.id || null,
        },
        metadata_status: 'complete',
        league: session.game_info?.league,
        season: session.game_info?.season,
        competition_phase: session.game_info?.competition_phase,
        competition_phase_label: session.game_info?.competition_phase_label,
        competition_unit_type: session.game_info?.competition_unit_type,
        competition_unit_label: session.game_info?.competition_unit_label,
        competition_unit_value: session.game_info?.competition_unit_value,
        matchday: session.game_info?.matchday,
        team_home: session.game_info?.team_home,
        team_away: session.game_info?.team_away,
        observed_team: session.observed_team,
        observed_team_id: session.game_info?.observed_team_id || session.observed_team_id,
        observed_team_name: session.game_info?.observed_team_name || session.game_info?.observed_team || session.observed_team,
        period: currentPhase,
        game_time: trimmed,
        note: note.trim() || undefined,
        extensions: Object.fromEntries(
          Object.entries(extensionValues).filter(([, value]) => value.trim().length > 0)
        ),
        extension_labels: Object.fromEntries(
          sceneMarkerExtensions.map((extension) => [extension.key, extension.label])
        ),
      })
      setShowModal(false)
      setSavedMsg("🎬 " + (scene.scene_code || trimmed) + " gespeichert")
      setTimeout(() => setSavedMsg(null), 2500)
    } catch {
      setError('Fehler beim Speichern. Bitte nochmal versuchen.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const phaseLabel =
    currentPhase === 'P1' ? '1. Drittel'
    : currentPhase === 'P2' ? '2. Drittel'
    : currentPhase === 'P3' ? '3. Drittel'
    : currentPhase

  return (
    <>
      {/* The main button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={handleOpen}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #4fc3f7',
            borderRadius: '0.75rem',
            color: '#e0f7fa',
            fontSize: '1.1rem',
            fontWeight: 700,
            padding: '0.8rem 1.6rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 0 16px rgba(79, 195, 247, 0.25)',
            transition: 'box-shadow 0.15s, transform 0.1s',
            minWidth: 220,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(79, 195, 247, 0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(79, 195, 247, 0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          🎬 Szene merken
        </button>
        {savedMsg && (
          <div style={{ color: '#4fc3f7', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            {savedMsg}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '92%', margin: '0 auto', padding: '1.5rem' }}
            onKeyDown={handleKeyDown}
          >
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>🎬 Szene merken</h3>

            {/* Context info */}
            <div style={{
              fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem',
              padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)',
              borderRadius: '0.4rem', lineHeight: 1.6,
            }}>
              {session.game_info?.team_home && session.game_info?.team_away && (
                <div><strong style={{ color: '#cbd5e1' }}>{session.game_info.team_home}</strong> vs <strong style={{ color: '#cbd5e1' }}>{session.game_info.team_away}</strong></div>
              )}
              <div>{phaseLabel} · {activeDrill?.title || session.module_id}</div>
              {session.game_info?.league && <div>{session.game_info.league}{session.game_info.season ? ` · ${session.game_info.season}` : ''}</div>}
            </div>

            {/* Game time input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
              Minute <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={gameTime}
              onChange={e => {
                setGameTime(formatGameTimeInput(e.target.value))
              }}
              placeholder="13:42"
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem',
                border: error ? '1.5px solid #f87171' : '1.5px solid #334155',
                background: '#0f172a', color: '#f1f5f9',
                fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em',
                boxSizing: 'border-box', marginBottom: '0.3rem',
              }}
            />
            {error && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</div>
            )}

            {sceneMarkerExtensions.map((extension) => (
              <div key={extension.key} style={{ marginTop: '0.9rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                  {extension.label} <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span>
                </label>
                <select
                  className="appSelect"
                  value={extensionValues[extension.key] || ''}
                  onChange={e => setExtensionValues(prev => ({ ...prev, [extension.key]: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Auswählen...</option>
                  {extension.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Note input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', marginTop: '0.9rem', fontSize: '0.95rem' }}>
              Kurze Notiz <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="z. B. guter Outlet-Moment, Turnover, interessante Rotation…"
              rows={2}
              maxLength={300}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem',
                border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9',
                fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                style={{
                  padding: '0.55rem 1.2rem', borderRadius: '0.4rem',
                  border: '1px solid #334155', background: 'transparent',
                  color: '#94a3b8', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '0.55rem 1.4rem', borderRadius: '0.4rem',
                  border: 'none', background: '#4fc3f7',
                  color: '#0a0a1a', cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.95rem',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Speichere…' : '🎬 Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
