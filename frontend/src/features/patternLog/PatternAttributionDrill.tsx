import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { EvidenceBoard } from './EvidenceBoard'
import {
  DEFAULT_ATTRIBUTION_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  labelForOption,
} from './labels'
import { OptionChips } from './OptionChips'
import {
  resolvePatternAttributionConfig,
  summarizeAttributionEvidence,
} from './summarizeAttributionEvidence'
import type {
  AttributionConfidence,
  GameStateContext,
  OpponentContext,
  PatternAttribution,
  PatternLogDraft,
  PatternLogObservation,
  PatternPresence,
  PersonnelContext,
  StartingCondition,
} from './types'

type PatternAttributionDrillProps = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `attr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraft(): PatternLogDraft {
  return {
    patternPresence: '',
    opponentContext: '',
    personnelContext: '',
    gameStateContext: '',
    startingCondition: '',
    note: '',
  }
}

export function PatternAttributionDrill({ drill, answers, setAnswers }: PatternAttributionDrillProps) {
  const safeAnswers = answers || {}
  const cfg = resolvePatternAttributionConfig(drill?.config || {})
  const observations: PatternLogObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: PatternLogDraft = { ...emptyDraft(), ...(safeAnswers[cfg.draftKey] || {}) }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const candidate = String(safeAnswers[cfg.candidateKey] || '')
  const attribution = safeAnswers[cfg.attributionKey] || ''
  const confidence = safeAnswers[cfg.confidenceKey] || ''
  const strongestEvidence = String(safeAnswers[cfg.strongestEvidenceKey] || '')
  const counterEvidence = String(safeAnswers[cfg.counterEvidenceKey] || '')
  const addingMore = safeAnswers.__pattern_attribution_adding_more === true

  const count = observations.length
  const atMax = count >= cfg.maxObservations
  const atMin = count >= cfg.minObservations
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || count < cfg.minObservations || (addingMore && !atMax)

  const summary = useMemo(
    () => summarizeAttributionEvidence(observations, drill?.config || {}),
    [observations, drill?.config],
  )

  const updateDraft = (patch: Partial<PatternLogDraft>) => {
    setAnswers({
      ...safeAnswers,
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    setAnswers({
      ...safeAnswers,
      ...extra,
      [cfg.draftKey]: emptyDraft(),
      [cfg.editIndexKey]: null,
      __pattern_attribution_adding_more: false,
    })
  }

  const canSave = Boolean(
    candidate.trim()
    && draft.patternPresence
    && draft.opponentContext
    && draft.personnelContext
    && (!cfg.enableGameState || draft.gameStateContext)
    && draft.startingCondition,
  )

  const saveObservation = () => {
    if (!canSave || (!isEditing && atMax)) return
    const presence = draft.patternPresence as PatternPresence
    const nextObs: PatternLogObservation = {
      id: isEditing ? observations[editIndex!].id : createId(),
      zone: 'unclear',
      trigger: 'unclear',
      teamReaction: labelForOption(cfg.presenceOptions, presence),
      patternPresence: presence,
      opponentContext: draft.opponentContext as OpponentContext,
      personnelContext: draft.personnelContext as PersonnelContext,
      gameStateContext: cfg.enableGameState
        ? (draft.gameStateContext as GameStateContext)
        : undefined,
      startingCondition: draft.startingCondition as StartingCondition,
      note: String(draft.note || '').trim() || undefined,
      createdAt: isEditing
        ? observations[editIndex!].createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }
    const nextLogs = isEditing
      ? observations.map((item, idx) => (idx === editIndex ? nextObs : item))
      : [...observations, nextObs]
    clearDraft({ [cfg.logsKey]: nextLogs })
  }

  const startEdit = (index: number) => {
    const item = observations[index]
    if (!item) return
    setAnswers({
      ...safeAnswers,
      [cfg.editIndexKey]: index,
      __pattern_attribution_adding_more: true,
      [cfg.draftKey]: {
        patternPresence: item.patternPresence || '',
        opponentContext: item.opponentContext || '',
        personnelContext: item.personnelContext || '',
        gameStateContext: item.gameStateContext || '',
        startingCondition: item.startingCondition || '',
        note: item.note || '',
      },
    })
  }

  const removeObservation = (index: number) => {
    const nextLogs = observations.filter((_, idx) => idx !== index)
    const clearingEdit = editIndex === index
    setAnswers({
      ...safeAnswers,
      [cfg.logsKey]: nextLogs,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyDraft(), [cfg.editIndexKey]: null, __pattern_attribution_adding_more: false }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const guide = drill?.didactics?.observation_guide
  const progressPercent = Math.min(100, Math.round((count / cfg.maxObservations) * 100))

  return (
    <div className="card" style={{ display: 'grid', gap: '0.85rem' }}>
      <div>
        <h3 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{drill.title}</h3>
        {drill.description && (
          <p style={{ margin: 0, fontSize: '0.94rem', color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
            {drill.description}
          </p>
        )}
      </div>

      {drill?.didactics?.explanation && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(226,232,240,0.78)', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
          {drill.didactics.explanation}
        </p>
      )}

      {guide && <DrillGuideCard guide={guide} />}

      <div
        style={{
          padding: '0.7rem 0.8rem',
          borderRadius: '8px',
          border: '1px solid rgba(251,191,36,0.35)',
          background: 'rgba(245,158,11,0.1)',
        }}
      >
        <strong style={{ color: '#fde68a', fontSize: '0.88rem' }}>Entscheidungsregel</strong>
        <p style={{ margin: '0.3rem 0 0', color: '#fef3c7', fontSize: '0.86rem', lineHeight: 1.4 }}>
          {cfg.decisionRule}
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'rgba(254,243,199,0.88)', lineHeight: 1.4 }}>
          Formuliere vorsichtig: „im beobachteten Segment sichtbar unter …“, „bisher nur unter ähnlichen Kontexten“ — keine gesicherte Ursache.
        </p>
      </div>

      <section
        style={{
          padding: '0.75rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid rgba(125,211,252,0.35)',
          background: 'rgba(14,165,233,0.1)',
        }}
      >
        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem', color: '#bae6fd' }}>
          Welches Verhalten möchtest du auf Kontextstabilität prüfen?
        </label>
        <textarea
          value={candidate}
          onChange={(e) => setAnswers({ ...safeAnswers, [cfg.candidateKey]: e.target.value })}
          maxLength={220}
          placeholder='z. B. „Bei kontrollierten Entries wird die Mitte früh geschlossen.“'
          style={{
            width: '100%',
            minHeight: '58px',
            padding: '0.65rem',
            borderRadius: '8px',
            border: '1px solid rgba(125,211,252,0.4)',
            background: '#050712',
            color: '#f7f7ff',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </section>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.25rem' }}>
          <span>Fortschritt</span>
          <span>{count}/{cfg.maxObservations}{atMin ? ' · Abschluss möglich' : ''}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #2dd4bf, #14b8a6)' }} />
        </div>
      </div>

      {observations.length > 0 && (
        <section style={{ display: 'grid', gap: '0.45rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Beobachtungen</h4>
          {observations.map((item, idx) => (
            <div
              key={item.id}
              style={{
                padding: '0.55rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: '0.84rem', color: '#e2e8f0' }}>
                    {idx + 1} · Muster: {labelForOption(cfg.presenceOptions, item.patternPresence)}
                  </div>
                  <div style={{ marginTop: '0.15rem', fontSize: '0.76rem', color: 'rgba(148,163,184,0.95)' }}>
                    {[
                      item.opponentContext ? `Gegner: ${labelForOption(cfg.opponentOptions, item.opponentContext)}` : null,
                      item.personnelContext ? `Personal: ${labelForOption(cfg.personnelOptions, item.personnelContext)}` : null,
                      item.startingCondition ? `Start: ${labelForOption(cfg.startingOptions, item.startingCondition)}` : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  <button type="button" className="btn" onClick={() => startEdit(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
                    Bearbeiten
                  </button>
                  <button type="button" className="btn" onClick={() => removeObservation(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {collecting && (
        <section
          style={{
            padding: '0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(81,145,162,0.4)',
            background: 'rgba(81,145,162,0.08)',
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#99f6e4', fontWeight: 700 }}>
              {isEditing ? `Beobachtung ${editIndex! + 1} bearbeiten` : `Beobachtung ${count + 1}`}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
              {cfg.observeHint}
            </p>
          </div>

          {!candidate.trim() && cfg.requireCandidateFirst && (
            <p style={{ margin: 0, color: '#fde68a', fontSize: '0.84rem' }}>
              Bitte zuerst oben das Muster formulieren.
            </p>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Tritt das erwartete Muster hier auf?</label>
            <OptionChips name="attr_presence" options={cfg.presenceOptions} value={draft.patternPresence || ''} onChange={(next) => updateDraft({ patternPresence: next as PatternPresence })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wie ähnlich ist das Verhalten des Gegners?</label>
            <OptionChips name="attr_opponent" options={cfg.opponentOptions} value={draft.opponentContext || ''} onChange={(next) => updateDraft({ opponentContext: next as OpponentContext })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Sind dieselben Rollen oder Spieler beteiligt?</label>
            <OptionChips name="attr_personnel" options={cfg.personnelOptions} value={draft.personnelContext || ''} onChange={(next) => updateDraft({ personnelContext: next as PersonnelContext })} />
          </div>
          {cfg.enableGameState && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Ist der Spielzustand ähnlich?</label>
              <OptionChips name="attr_gamestate" options={cfg.gameStateOptions} value={draft.gameStateContext || ''} onChange={(next) => updateDraft({ gameStateContext: next as GameStateContext })} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wie ähnlich ist die Ausgangssituation?</label>
            <OptionChips name="attr_starting" options={cfg.startingOptions} value={draft.startingCondition || ''} onChange={(next) => updateDraft({ startingCondition: next as StartingCondition })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Kurze Notiz <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <textarea
              value={draft.note || ''}
              onChange={(e) => updateDraft({ note: e.target.value })}
              maxLength={180}
              placeholder="Was war hier besonders auffällig?"
              style={{
                width: '100%', minHeight: '52px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.45)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <button type="button" className="btn" onClick={saveObservation} disabled={!canSave} style={{ minHeight: '48px', opacity: canSave ? 1 : 0.55 }}>
            {isEditing ? 'Änderung speichern' : cfg.submitLabel}
          </button>
          {isEditing && (
            <button type="button" className="btn" onClick={() => clearDraft()} style={{ minHeight: '42px' }}>
              Bearbeiten abbrechen
            </button>
          )}
        </section>
      )}

      {atMin && (
        <section
          style={{
            padding: '0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(45,212,191,0.35)',
            background: 'rgba(20,184,166,0.08)',
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <h4 style={{ margin: 0 }}>{cfg.summaryTitle}</h4>
          {candidate.trim() && (
            <p style={{ margin: 0, fontStyle: 'italic', color: '#ecfdf5' }}>„{candidate.trim()}“</p>
          )}

          {!atMax && !isEditing && !addingMore && (
            <button
              type="button"
              className="btn"
              onClick={() => setAnswers({
                ...safeAnswers,
                [cfg.draftKey]: emptyDraft(),
                [cfg.editIndexKey]: null,
                __pattern_attribution_adding_more: true,
              })}
              style={{ minHeight: '46px' }}
            >
              {cfg.addMoreLabel}
            </button>
          )}

          <EvidenceBoard
            hints={summary.hints}
            contextVariation={summary.contextVariation}
          />

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              In welchen beobachteten Kontexten bleibt das Verhalten sichtbar?
            </label>
            <OptionChips
              name="attribution"
              options={DEFAULT_ATTRIBUTION_OPTIONS}
              value={attribution}
              onChange={(next) => setAnswers({ ...safeAnswers, [cfg.attributionKey]: next as PatternAttribution })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Sicherheit der vorläufigen Einordnung
            </label>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
              Selbsteinschätzung — kein objektiver Evidenzwert und keine Wahrscheinlichkeit.
            </p>
            <OptionChips
              name="confidence"
              options={DEFAULT_CONFIDENCE_OPTIONS}
              value={confidence}
              onChange={(next) => setAnswers({ ...safeAnswers, [cfg.confidenceKey]: next as AttributionConfidence })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Welche Beobachtung spricht am deutlichsten für deine vorläufige Einordnung?
            </label>
            <textarea
              value={strongestEvidence}
              onChange={(e) => setAnswers({ ...safeAnswers, [cfg.strongestEvidenceKey]: e.target.value })}
              maxLength={280}
              placeholder='z. B. „Das Verhalten blieb auch bei wechselnden Spielern und unterschiedlichen Entry-Seiten sichtbar.“'
              style={{
                width: '100%', minHeight: '68px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Gegenfälle oder widersprechende Beobachtungen{' '}
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <textarea
              value={counterEvidence}
              onChange={(e) => setAnswers({ ...safeAnswers, [cfg.counterEvidenceKey]: e.target.value })}
              maxLength={240}
              placeholder='z. B. „In einer vergleichbaren Lage trat das Verhalten nicht auf.“'
              style={{
                width: '100%', minHeight: '58px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.45)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Mögliche Erklärung, die weitere Beobachtung benötigt{' '}
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
              Eine Hypothese beschreibt eine offene Prüfidee. Sie ist keine aus den Beobachtungen bestätigte Ursache.
            </p>
            <textarea
              value={String(safeAnswers.context_hypothesis || '')}
              onChange={(e) => setAnswers({ ...safeAnswers, context_hypothesis: e.target.value })}
              maxLength={240}
              placeholder='z. B. „Könnte eng an hohen Gegnerdruck gebunden sein — weiter prüfen.“'
              style={{
                width: '100%', minHeight: '58px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.45)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {attribution && confidence && strongestEvidence.trim() && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(153,246,228,0.35)',
                background: 'rgba(6,78,59,0.25)',
                display: 'grid',
                gap: '0.35rem',
              }}
            >
              <h4 style={{ margin: 0, color: '#99f6e4' }}>Ergebnis</h4>
              <div style={{ fontSize: '0.84rem', color: 'rgba(236,253,245,0.9)' }}>
                <strong>Einordnung:</strong> {labelForOption(DEFAULT_ATTRIBUTION_OPTIONS, attribution)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                <strong>Sicherheit der vorläufigen Einordnung:</strong> {labelForOption(DEFAULT_CONFIDENCE_OPTIONS, confidence)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                <strong>Deutlichstes Indiz:</strong> „{strongestEvidence.trim()}“
              </div>
              {counterEvidence.trim() && (
                <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                  <strong>Gegenfälle / Widerspruch:</strong> „{counterEvidence.trim()}“
                </div>
              )}
              {String(safeAnswers.context_hypothesis || '').trim() && (
                <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                  <strong>Offene Hypothese:</strong> „{String(safeAnswers.context_hypothesis).trim()}“
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {drill?.didactics?.learning_hint && (
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-line' }}>
          {drill.didactics.learning_hint}
        </p>
      )}
    </div>
  )
}

export default PatternAttributionDrill
