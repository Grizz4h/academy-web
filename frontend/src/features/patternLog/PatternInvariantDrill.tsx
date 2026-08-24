import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { InvariantMap } from './InvariantMap'
import {
  DEFAULT_ALLOWED_VARIATION_OPTIONS,
  DEFAULT_FLEXIBILITY_OPTIONS,
  labelForOption,
} from './labels'
import { OptionChips } from './OptionChips'
import { PatternFingerprint } from './PatternFingerprint'
import {
  resolvePatternInvariantConfig,
  summarizeDimensionConsistency,
} from './summarizeDimensionConsistency'
import type {
  ActorRole,
  DimensionAssessmentEntry,
  InvariantDimensionId,
  InvariantDimensionRole,
  PatternFlexibility,
  PatternLogDraft,
  PatternLogObservation,
  PrimaryActionEquality,
  SequenceSimilarity,
  TargetEffect,
} from './types'

type PatternInvariantDrillProps = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraft(): PatternLogDraft {
  return {
    zone: '',
    trigger: '',
    primaryAction: '',
    targetEffect: '',
    actorRole: '',
    side: '',
    sequenceSimilarity: '',
    note: '',
  }
}

const PRIMARY_ACTION_EQUALITY_OPTIONS = [
  { value: 'yes' as const, label: 'ja', description: 'Funktional über die Beobachtungen gleich.' },
  { value: 'mostly' as const, label: 'meistens' },
  { value: 'no' as const, label: 'nein' },
  { value: 'unclear' as const, label: 'unklar' },
]

export function PatternInvariantDrill({ drill, answers, setAnswers }: PatternInvariantDrillProps) {
  const safeAnswers = answers || {}
  const cfg = resolvePatternInvariantConfig(drill?.config || {})
  const observations: PatternLogObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: PatternLogDraft = { ...emptyDraft(), ...(safeAnswers[cfg.draftKey] || {}) }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const candidate = String(safeAnswers[cfg.candidateKey] || '')
  const assessments: DimensionAssessmentEntry[] = Array.isArray(safeAnswers[cfg.dimensionAssessmentsKey])
    ? safeAnswers[cfg.dimensionAssessmentsKey]
    : []
  const invariantSummary = String(safeAnswers[cfg.invariantSummaryKey] || '')
  const allowedVariation: string[] = Array.isArray(safeAnswers[cfg.allowedVariationKey])
    ? safeAnswers[cfg.allowedVariationKey]
    : []
  const flexibility = safeAnswers[cfg.flexibilityKey] || ''
  const primaryActionEquality = safeAnswers[cfg.primaryActionEqualityKey] || ''
  const addingMore = safeAnswers.__pattern_invariant_adding_more === true

  const count = observations.length
  const atMax = count >= cfg.maxObservations
  const atMin = count >= cfg.minObservations
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || count < cfg.minObservations || (addingMore && !atMax)
  const needsSequence = count >= 1 || (isEditing && editIndex! > 0)

  const summary = useMemo(
    () => summarizeDimensionConsistency(observations, drill?.config || {}),
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
      __pattern_invariant_adding_more: false,
    })
  }

  const canSave = Boolean(
    candidate.trim()
    && draft.zone
    && draft.trigger
    && String(draft.primaryAction || '').trim()
    && draft.targetEffect
    && draft.actorRole
    && (!cfg.enableSide || draft.side || true)
    && (!needsSequence || draft.sequenceSimilarity)
  )

  const saveObservation = () => {
    if (!canSave || (!isEditing && atMax)) return
    const nextObs: PatternLogObservation = {
      id: isEditing ? observations[editIndex!].id : createId(),
      zone: draft.zone as PatternLogObservation['zone'],
      trigger: draft.trigger as PatternLogObservation['trigger'],
      primaryAction: String(draft.primaryAction || '').trim(),
      targetEffect: draft.targetEffect as TargetEffect,
      actorRole: draft.actorRole as ActorRole,
      side: cfg.enableSide && draft.side
        ? (draft.side as PatternLogObservation['side'])
        : undefined,
      sequenceSimilarity: draft.sequenceSimilarity
        ? (draft.sequenceSimilarity as SequenceSimilarity)
        : undefined,
      teamReaction: String(draft.primaryAction || '').trim(),
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
      __pattern_invariant_adding_more: true,
      [cfg.draftKey]: {
        zone: item.zone,
        trigger: item.trigger,
        primaryAction: item.primaryAction || item.teamReaction || '',
        targetEffect: item.targetEffect || '',
        actorRole: item.actorRole || '',
        side: item.side || '',
        sequenceSimilarity: item.sequenceSimilarity || '',
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
        ? { [cfg.draftKey]: emptyDraft(), [cfg.editIndexKey]: null, __pattern_invariant_adding_more: false }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const setAssessment = (dimensionId: InvariantDimensionId, role: InvariantDimensionRole) => {
    const without = assessments.filter((entry) => entry.dimensionId !== dimensionId)
    setAnswers({
      ...safeAnswers,
      [cfg.dimensionAssessmentsKey]: [...without, { dimensionId, role }],
    })
  }

  const guide = drill?.didactics?.observation_guide
  const progressPercent = Math.min(100, Math.round((count / cfg.maxObservations) * 100))
  const assessedIds = new Set(assessments.map((entry) => entry.dimensionId))
  const allDimsAssessed = summary.dimensions.every((dim) => assessedIds.has(dim.dimensionId))

  const coreDims = assessments.filter((entry) => entry.role === 'core')
  const variableDims = assessments.filter((entry) => entry.role === 'variable' || entry.role === 'frequent')

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
        <strong style={{ color: '#fde68a', fontSize: '0.88rem' }}>Leitregel</strong>
        <p style={{ margin: '0.3rem 0 0', color: '#fef3c7', fontSize: '0.86rem', lineHeight: 1.4 }}>
          {cfg.decisionRule}
        </p>
        <p style={{ margin: '0.45rem 0 0', color: 'rgba(254,243,199,0.88)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          Ein Muster kann gleich bleiben, obwohl Spieler, Seite oder genaue Position wechseln. Entscheidend kann die Funktion sein, nicht die exakte Form.
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
          Welches wiederkehrende Verhalten möchtest du zerlegen?
        </label>
        <textarea
          value={candidate}
          onChange={(e) => setAnswers({ ...safeAnswers, [cfg.candidateKey]: e.target.value })}
          maxLength={220}
          placeholder='z. B. „Bei gegnerischen Entries wird der Puck nach außen gelenkt.“'
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
                    {idx + 1} · {labelForOption(cfg.zones, item.zone)} · {labelForOption(cfg.triggers, item.trigger)}
                  </div>
                  <div style={{ marginTop: '0.15rem', fontSize: '0.8rem', color: 'rgba(226,232,240,0.78)' }}>
                    {item.primaryAction || item.teamReaction}
                  </div>
                  <div style={{ marginTop: '0.15rem', fontSize: '0.72rem', color: 'rgba(148,163,184,0.95)' }}>
                    {[
                      item.targetEffect ? labelForOption(cfg.targetEffects, item.targetEffect) : null,
                      item.actorRole ? labelForOption(cfg.actorRoles, item.actorRole) : null,
                      item.sequenceSimilarity ? labelForOption(cfg.sequenceSimilarities, item.sequenceSimilarity) : null,
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

      {count >= 2 && (
        <PatternFingerprint title={cfg.fingerprintTitle} dimensions={summary.fingerprint} />
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
              Bitte zuerst oben den Pattern-Kandidaten formulieren.
            </p>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wo passiert es?</label>
            <OptionChips name="inv_zone" options={cfg.zones} value={draft.zone || ''} onChange={(next) => updateDraft({ zone: next as PatternLogDraft['zone'] })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Was startet die Situation?</label>
            <OptionChips name="inv_trigger" options={cfg.triggers} value={draft.trigger || ''} onChange={(next) => updateDraft({ trigger: next as PatternLogDraft['trigger'] })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Was ist die zentrale Aktion in dieser Situation?</label>
            <textarea
              value={draft.primaryAction || ''}
              onChange={(e) => updateDraft({ primaryAction: e.target.value })}
              maxLength={180}
              placeholder='z. B. „Mitte schließen“ oder „Puckführer nach außen drücken“'
              style={{
                width: '100%', minHeight: '58px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Welcher Raum oder welche Option wird dadurch hauptsächlich beeinflusst?</label>
            <OptionChips name="inv_target" options={cfg.targetEffects} value={draft.targetEffect || ''} onChange={(next) => updateDraft({ targetEffect: next as PatternLogDraft['targetEffect'] })} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wer übernimmt die entscheidende Funktion?</label>
            <OptionChips name="inv_actor" options={cfg.actorRoles} value={draft.actorRole || ''} onChange={(next) => updateDraft({ actorRole: next as PatternLogDraft['actorRole'] })} />
          </div>
          {cfg.enableSide && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Seite</label>
              <OptionChips name="inv_side" options={cfg.sides} value={draft.side || ''} onChange={(next) => updateDraft({ side: next as PatternLogDraft['side'] })} />
            </div>
          )}
          {needsSequence && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Wie ähnlich ist der Ablauf zur bisherigen Pattern-Idee?
              </label>
              <OptionChips
                name="inv_sequence"
                options={cfg.sequenceSimilarities}
                value={draft.sequenceSimilarity || ''}
                onChange={(next) => updateDraft({ sequenceSimilarity: next as PatternLogDraft['sequenceSimilarity'] })}
              />
            </div>
          )}

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
                __pattern_invariant_adding_more: true,
              })}
              style={{ minHeight: '46px' }}
            >
              {cfg.addMoreLabel}
            </button>
          )}

          <InvariantMap
            title="Invariant Map"
            dimensions={summary.dimensions}
            assessments={assessments}
            onAssess={setAssessment}
          />

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              War die zentrale Aktion über die Beobachtungen funktional gleich?
            </label>
            <OptionChips
              name="primary_action_equality"
              options={PRIMARY_ACTION_EQUALITY_OPTIONS}
              value={primaryActionEquality}
              onChange={(next) => setAnswers({
                ...safeAnswers,
                [cfg.primaryActionEqualityKey]: next as PrimaryActionEquality,
              })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Was ist der kleinste gemeinsame Kern, der in allen Beobachtungen erhalten bleibt?
            </label>
            <textarea
              value={invariantSummary}
              onChange={(e) => setAnswers({ ...safeAnswers, [cfg.invariantSummaryKey]: e.target.value })}
              maxLength={320}
              placeholder='z. B. „Die Defensive schützt zuerst die Mitte und zwingt den Puckführer in einen äußeren Lane.“'
              style={{
                width: '100%', minHeight: '72px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Welche sichtbaren Merkmale dürfen sich verändern, ohne dass du das Muster als gebrochen ansiehst?
            </label>
            <OptionChips
              name="allowed_variation"
              options={DEFAULT_ALLOWED_VARIATION_OPTIONS}
              multi
              selectedValues={allowedVariation}
              onChange={(next) => setAnswers({
                ...safeAnswers,
                [cfg.allowedVariationKey]: next as string[],
              })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Wie flexibel erscheint dieses Muster?
            </label>
            <OptionChips
              name="flexibility"
              options={DEFAULT_FLEXIBILITY_OPTIONS}
              value={flexibility}
              onChange={(next) => setAnswers({
                ...safeAnswers,
                [cfg.flexibilityKey]: next as PatternFlexibility,
              })}
            />
          </div>

          {allDimsAssessed && invariantSummary.trim() && flexibility && primaryActionEquality && allowedVariation.length > 0 && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(153,246,228,0.35)',
                background: 'rgba(6,78,59,0.25)',
                display: 'grid',
                gap: '0.4rem',
              }}
            >
              <h4 style={{ margin: 0, color: '#99f6e4' }}>Ergebnis</h4>
              <div style={{ fontSize: '0.86rem', color: 'rgba(236,253,245,0.92)' }}>
                <strong>Bisher wiederkehrende Merkmale:</strong> „{invariantSummary.trim()}“
              </div>
              {coreDims.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                  <strong>Bisher wiederkehrende Kernmerkmale:</strong>{' '}
                  {coreDims.map((entry) => labelForOption(
                    summary.dimensions.map((d) => ({ value: d.dimensionId, label: d.label })),
                    entry.dimensionId,
                  )).join(' · ')}
                </div>
              )}
              {variableDims.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                  <strong>Variable / häufige Ausprägungen:</strong>{' '}
                  {variableDims.map((entry) => labelForOption(
                    summary.dimensions.map((d) => ({ value: d.dimensionId, label: d.label })),
                    entry.dimensionId,
                  )).join(' · ')}
                </div>
              )}
              <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                <strong>Musterflexibilität:</strong> {labelForOption(DEFAULT_FLEXIBILITY_OPTIONS, flexibility)}
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

export default PatternInvariantDrill
