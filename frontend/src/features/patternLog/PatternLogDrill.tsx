import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { PatternFingerprint } from './PatternFingerprint'
import { labelForOption, resolvePatternLogConfig, summarizePatternLog } from './summarizePatternLog'
import type {
  PatternContextTag,
  PatternLogDraft,
  PatternLogObservation,
  PatternSimilarity,
} from './types'

type PatternLogDrillProps = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function createObservationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraft(): PatternLogDraft {
  return {
    zone: '',
    trigger: '',
    teamReaction: '',
    side: '',
    contextTags: [],
    similarities: [],
    note: '',
  }
}

function OptionChips<T extends string>({
  name,
  options,
  value,
  onChange,
  multi = false,
  selectedValues,
}: {
  name: string
  options: Array<{ value: T; label: string; description?: string }>
  value?: string
  selectedValues?: string[]
  onChange: (next: T | T[]) => void
  multi?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {options.map((opt) => {
        const checked = multi
          ? (selectedValues || []).includes(opt.value)
          : value === opt.value
        return (
          <label
            key={`${name}-${opt.value}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              minHeight: '44px',
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              border: checked ? '1px solid rgba(45,212,191,0.55)' : '1px solid rgba(148,163,184,0.22)',
              background: checked ? 'rgba(20,184,166,0.14)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
            }}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => {
                if (!multi) {
                  onChange(opt.value)
                  return
                }
                const current = selectedValues || []
                const next = current.includes(opt.value)
                  ? current.filter((item) => item !== opt.value)
                  : [...current, opt.value]
                onChange(next as T[])
              }}
              style={{ marginTop: '0.2rem', width: '1.05rem', height: '1.05rem', flexShrink: 0 }}
            />
            <span style={{ display: 'grid', gap: '0.15rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 650, color: '#f1f5f9', lineHeight: 1.25 }}>
                {opt.label}
              </span>
              {opt.description && (
                <span style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.65)', lineHeight: 1.35 }}>
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function PatternLogDrill({ drill, answers, setAnswers }: PatternLogDrillProps) {
  const safeAnswers = answers || {}
  const cfg = resolvePatternLogConfig(drill?.config || {})
  const observations: PatternLogObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: PatternLogDraft = {
    ...emptyDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const assessment = safeAnswers[cfg.assessmentKey] || ''
  const patternSummary = String(safeAnswers[cfg.summaryKey] || '')
  const patternLabel = String(safeAnswers[cfg.labelKey] || '')
  const addingMore = safeAnswers.__pattern_log_adding_more === true

  const count = observations.length
  const atMax = count >= cfg.maxObservations
  const atMin = count >= cfg.minObservations
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || count < cfg.minObservations || (addingMore && !atMax)
  const showComparison = (isEditing ? editIndex! > 0 : count >= 1) && collecting
  const candidate = observations[0] || null
  const summary = useMemo(() => summarizePatternLog(observations, drill?.config || {}), [observations, drill?.config])

  const fingerprintDims = cfg.summaryDimensions
    .map((key) => {
      if (key === 'zone') return summary.zoneConsistency
      if (key === 'trigger') return summary.triggerConsistency
      if (key === 'reaction') return summary.reactionSimilarity
      if (key === 'side') return summary.sideConsistency
      return summary.sequenceSimilarity
    })
    .filter(Boolean)

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
      __pattern_log_adding_more: false,
    })
  }

  const canSaveObservation = Boolean(
    draft.zone
    && draft.trigger
    && String(draft.teamReaction || '').trim()
    && (!showComparison || (draft.similarities && draft.similarities.length > 0)),
  )

  const saveObservation = () => {
    if (!canSaveObservation) return
    const nextObs: PatternLogObservation = {
      id: isEditing ? observations[editIndex!].id : createObservationId(),
      zone: draft.zone as PatternLogObservation['zone'],
      trigger: draft.trigger as PatternLogObservation['trigger'],
      teamReaction: String(draft.teamReaction || '').trim(),
      side: cfg.enableSide && draft.side ? (draft.side as PatternLogObservation['side']) : undefined,
      contextTags: cfg.enableContextTags && draft.contextTags?.length
        ? (draft.contextTags as PatternContextTag[])
        : undefined,
      similarities: showComparison
        ? ((draft.similarities || []) as PatternSimilarity[])
        : undefined,
      note: String(draft.note || '').trim() || undefined,
      createdAt: isEditing
        ? observations[editIndex!].createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }

    let nextLogs: PatternLogObservation[]
    if (isEditing) {
      nextLogs = observations.map((obs, idx) => (idx === editIndex ? nextObs : obs))
    } else {
      if (atMax) return
      nextLogs = [...observations, nextObs]
    }

    clearDraft({ [cfg.logsKey]: nextLogs })
  }

  const startEdit = (index: number) => {
    const obs = observations[index]
    if (!obs) return
    setAnswers({
      ...safeAnswers,
      [cfg.editIndexKey]: index,
      [cfg.draftKey]: {
        zone: obs.zone,
        trigger: obs.trigger,
        teamReaction: obs.teamReaction || '',
        side: obs.side || '',
        contextTags: obs.contextTags || [],
        similarities: obs.similarities || [],
        note: obs.note || '',
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
        ? { [cfg.draftKey]: emptyDraft(), [cfg.editIndexKey]: null }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const guide = drill?.didactics?.observation_guide
  const progressLabel = `${count} / ${cfg.maxObservations} Beobachtungen`
  const progressPercent = Math.min(100, Math.round((count / cfg.maxObservations) * 100))

  return (
    <div className="card" style={{ display: 'grid', gap: '0.85rem' }}>
      <div>
        <h3 style={{ marginTop: 0, marginBottom: '0.35rem', wordBreak: 'break-word' }}>{drill.title}</h3>
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
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.25rem' }}>
          <span>Fortschritt</span>
          <span>{progressLabel}{atMin ? ' · Abschluss möglich' : ''}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #2dd4bf, #14b8a6)' }} />
        </div>
      </div>

      {candidate && (
        <section
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(125,211,252,0.35)',
            background: 'rgba(14,165,233,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 0.45rem', color: '#bae6fd', fontSize: '0.9rem' }}>Dein Pattern-Kandidat</h4>
          <div style={{ display: 'grid', gap: '0.2rem', fontSize: '0.86rem', color: 'rgba(240,249,255,0.9)', lineHeight: 1.35 }}>
            <div><strong>Zone:</strong> {labelForOption(cfg.zones, candidate.zone)}</div>
            <div><strong>Trigger:</strong> {labelForOption(cfg.triggers, candidate.trigger)}</div>
            <div><strong>Reaktion:</strong> „{candidate.teamReaction}“</div>
          </div>
          {count >= 1 && collecting && !isEditing && (
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.82rem', color: 'rgba(186,230,253,0.85)' }}>
              {cfg.searchNextHint}
            </p>
          )}
        </section>
      )}

      {count > 0 && (
        <section style={{ display: 'grid', gap: '0.45rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Bisherige Beobachtungen</h4>
          {observations.map((obs, idx) => {
            const simText = (obs.similarities || [])
              .map((value) => labelForOption(cfg.similarities, value))
              .join(' · ')
            return (
              <div
                key={obs.id}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#e2e8f0' }}>
                      {idx + 1} · {labelForOption(cfg.zones, obs.zone)} · {labelForOption(cfg.triggers, obs.trigger)}
                    </div>
                    <div style={{ marginTop: '0.18rem', fontSize: '0.82rem', color: 'rgba(226,232,240,0.78)', lineHeight: 1.35 }}>
                      {obs.teamReaction}
                    </div>
                    {simText && (
                      <div style={{ marginTop: '0.2rem', fontSize: '0.74rem', color: 'rgba(148,163,184,0.9)' }}>
                        Ähnlich: {simText}
                      </div>
                    )}
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
            )
          })}
        </section>
      )}

      {count >= 2 && (
        <PatternFingerprint title={cfg.fingerprintTitle} dimensions={fingerprintDims} />
      )}

      {count >= 2 && summary.statements.length > 0 && (
        <section
          style={{
            padding: '0.7rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.88rem' }}>Deskriptive Zusammenfassung</h4>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.25rem' }}>
            {summary.statements.map((statement) => (
              <li key={statement} style={{ fontSize: '0.82rem', color: 'rgba(226,232,240,0.78)', lineHeight: 1.4 }}>
                {statement}
              </li>
            ))}
          </ul>
          {summary.onlyOutcomeHeavy && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#fde68a' }}>
              Hinweis: Du hast häufig „nur Ergebnis ähnlich“ markiert — das spricht eher gegen ein belastbares Muster.
            </p>
          )}
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
              {isEditing
                ? `Beobachtung ${editIndex! + 1} bearbeiten`
                : count === 0
                  ? 'Beobachtung 1 – Pattern-Kandidat'
                  : `Beobachtung ${count + 1}`}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
              {count === 0 && !isEditing ? cfg.observeHint : cfg.searchNextHint}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Wo tritt das Verhalten auf?
            </label>
            <OptionChips
              name="pattern_zone"
              options={cfg.zones}
              value={draft.zone || ''}
              onChange={(next) => updateDraft({ zone: next as PatternLogDraft['zone'] })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Was geht dem Verhalten unmittelbar voraus?
            </label>
            <OptionChips
              name="pattern_trigger"
              options={cfg.triggers}
              value={draft.trigger || ''}
              onChange={(next) => updateDraft({ trigger: next as PatternLogDraft['trigger'] })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Was macht das Team wiedererkennbar?
            </label>
            <textarea
              value={draft.teamReaction || ''}
              onChange={(e) => updateDraft({ teamReaction: e.target.value })}
              maxLength={280}
              placeholder='z. B. „Mitte wird geschlossen und der Puck nach außen gelenkt.“'
              style={{
                width: '100%',
                minHeight: '64px',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)',
                background: '#050712',
                color: '#f7f7ff',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {cfg.enableSide && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Ist eine Seite besonders relevant? <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
              </label>
              <OptionChips
                name="pattern_side"
                options={cfg.sides}
                value={draft.side || ''}
                onChange={(next) => updateDraft({ side: next as PatternLogDraft['side'] })}
              />
            </div>
          )}

          {cfg.enableContextTags && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Was ist zusätzlich auffällig? <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
              </label>
              <OptionChips
                name="pattern_context"
                options={cfg.contextTags}
                multi
                selectedValues={draft.contextTags || []}
                onChange={(next) => updateDraft({ contextTags: next as PatternContextTag[] })}
              />
            </div>
          )}

          {showComparison && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Was ist im Vergleich zu den bisherigen Beobachtungen ähnlich?
              </label>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.8rem', color: 'rgba(253,230,138,0.9)', lineHeight: 1.35 }}>
                {cfg.outcomeSimilarityHint}
              </p>
              <OptionChips
                name="pattern_similarity"
                options={cfg.similarities}
                multi
                selectedValues={draft.similarities || []}
                onChange={(next) => updateDraft({ similarities: next as PatternSimilarity[] })}
              />
            </div>
          )}

          <button
            type="button"
            className="btn"
            onClick={saveObservation}
            disabled={!canSaveObservation}
            style={{
              minHeight: '48px',
              width: '100%',
              opacity: canSaveObservation ? 1 : 0.55,
              cursor: canSaveObservation ? 'pointer' : 'not-allowed',
            }}
          >
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

          {cfg.enableMidLabel && count >= 2 && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Kurze Zwischenbeschreibung (optional)
              </label>
              <input
                type="text"
                value={patternLabel}
                onChange={(e) => setAnswers({ ...safeAnswers, [cfg.labelKey]: e.target.value })}
                maxLength={160}
                placeholder="Wie würdest du das mögliche Muster momentan kurz beschreiben?"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(81,145,162,0.45)',
                  background: '#050712',
                  color: '#f7f7ff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Wie stark ist dein Hinweis auf ein wiederkehrendes Muster?
            </label>
            <OptionChips
              name="pattern_assessment"
              options={cfg.assessments}
              value={assessment}
              onChange={(next) => setAnswers({ ...safeAnswers, [cfg.assessmentKey]: next })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Beschreibe das mögliche Muster in einem Satz.
            </label>
            <textarea
              value={patternSummary}
              onChange={(e) => setAnswers({ ...safeAnswers, [cfg.summaryKey]: e.target.value })}
              maxLength={320}
              placeholder='z. B. „Bei kontrollierten Entries schließt das Team wiederholt die Mitte und lenkt den Puck nach außen.“'
              style={{
                width: '100%',
                minHeight: '72px',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)',
                background: '#050712',
                color: '#f7f7ff',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {!atMax && !isEditing && !addingMore && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAnswers({
                  ...safeAnswers,
                  [cfg.draftKey]: emptyDraft(),
                  [cfg.editIndexKey]: null,
                  __pattern_log_adding_more: true,
                })
              }}
              style={{ minHeight: '46px' }}
            >
              {cfg.addMoreLabel}
            </button>
          )}

          {assessment && patternSummary.trim() && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(153,246,228,0.35)',
                background: 'rgba(6,78,59,0.25)',
              }}
            >
              <h4 style={{ margin: '0 0 0.4rem', color: '#99f6e4' }}>Ergebnis</h4>
              <p style={{ margin: '0 0 0.55rem', fontStyle: 'italic', color: '#ecfdf5', lineHeight: 1.4 }}>
                „{patternSummary.trim()}“
              </p>
              <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.84rem', color: 'rgba(236,253,245,0.88)' }}>
                <div><strong>Beobachtungen:</strong> {count}</div>
                <div><strong>Zone:</strong> {summary.zoneConsistency.detail}</div>
                <div><strong>Trigger:</strong> {summary.triggerConsistency.detail}</div>
                <div><strong>Teamreaktion ähnlich:</strong> {summary.reactionSimilarity.detail}</div>
                <div><strong>Seite:</strong> {summary.sideConsistency.detail}</div>
                <div>
                  <strong>Deine Einschätzung:</strong>{' '}
                  {labelForOption(cfg.assessments, assessment)}
                </div>
              </div>
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

export default PatternLogDrill
