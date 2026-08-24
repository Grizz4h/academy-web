import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { ConditionComparison } from './ConditionComparison'
import {
  DEFAULT_CASE_TYPE_OPTIONS,
  DEFAULT_CONDITION_ASSESSMENT_OPTIONS,
  DEFAULT_CONDITION_ROLE_OPTIONS,
  DEFAULT_COUNTER_DIFFERENCE_OPTIONS,
  DEFAULT_RELEVANT_CONDITION_OPTIONS,
  labelForOption,
} from './labels'
import { OptionChips } from './OptionChips'
import { PatternFingerprint } from './PatternFingerprint'
import {
  resolvePatternConditionConfig,
  summarizePatternConditions,
} from './summarizePatternConditions'
import type {
  ConditionDimensionId,
  ConditionRole,
  CounterDifference,
  PatternCaseType,
  PatternLogDraft,
  PatternLogObservation,
  PossessionState,
  PressureLevel,
  RelevantConditionEntry,
  SupportState,
} from './types'

type PatternConditionDrillProps = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraft(): PatternLogDraft {
  return {
    caseType: 'pattern_case',
    zone: '',
    trigger: '',
    pressureLevel: '',
    possessionState: '',
    supportState: '',
    side: '',
    teamReaction: '',
    note: '',
  }
}

function isDimensionId(value: string): value is ConditionDimensionId {
  return ['zone', 'trigger', 'pressureLevel', 'possessionState', 'supportState', 'side'].includes(value)
}

export function PatternConditionDrill({ drill, answers, setAnswers }: PatternConditionDrillProps) {
  const safeAnswers = answers || {}
  const cfg = resolvePatternConditionConfig(drill?.config || {})
  const cases: PatternLogObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: PatternLogDraft = { ...emptyDraft(), ...(safeAnswers[cfg.draftKey] || {}) }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const candidate = String(safeAnswers[cfg.candidateKey] || '')
  const relevantConditions: RelevantConditionEntry[] = Array.isArray(safeAnswers[cfg.relevantConditionsKey])
    ? safeAnswers[cfg.relevantConditionsKey]
    : []
  const counterDifferences: CounterDifference[] = Array.isArray(safeAnswers[cfg.counterDifferencesKey])
    ? safeAnswers[cfg.counterDifferencesKey]
    : []
  const counterDifferenceNote = String(safeAnswers[cfg.counterDifferenceNoteKey] || '')
  const conditionAssessment = safeAnswers[cfg.conditionAssessmentKey] || ''
  const ifThenSummary = String(safeAnswers[cfg.ifThenKey] || '')
  const addingMore = safeAnswers.__pattern_condition_adding_more === true
  const noCounterAcknowledged = safeAnswers.__pattern_condition_no_counter === true

  const patternCases = cases.filter((item) => (item.caseType || 'pattern_case') === 'pattern_case')
  const counterCases = cases.filter((item) => item.caseType === 'counter_case')
  const count = cases.length
  const patternCount = patternCases.length
  const counterCount = counterCases.length
  const atMax = count >= cfg.maxObservations
  const atMinPattern = patternCount >= cfg.minPatternCases
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || !atMinPattern || (addingMore && !atMax)
  const canAddCounter = cfg.enableCounterCases && counterCount < cfg.maxCounterCases

  const summary = useMemo(
    () => summarizePatternConditions(cases, drill?.config || {}),
    [cases, drill?.config],
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
      __pattern_condition_adding_more: false,
    })
  }

  const reactionLabel = draft.caseType === 'counter_case'
    ? 'Was passiert stattdessen?'
    : 'Was macht das Team in dieser Situation?'

  const canSave = Boolean(
    candidate.trim()
    && draft.caseType
    && draft.zone
    && draft.trigger
    && (!cfg.enablePressure || draft.pressureLevel)
    && (!cfg.enablePossession || draft.possessionState)
    && (!cfg.enableSupport || draft.supportState)
    && String(draft.teamReaction || '').trim()
    && (draft.caseType !== 'counter_case' || canAddCounter || isEditing),
  )

  const saveCase = () => {
    if (!canSave) return
    if (!isEditing && atMax) return
    if (!isEditing && draft.caseType === 'counter_case' && !canAddCounter) return

    const nextCase: PatternLogObservation = {
      id: isEditing ? cases[editIndex!].id : createId(),
      caseType: draft.caseType as PatternCaseType,
      zone: draft.zone as PatternLogObservation['zone'],
      trigger: draft.trigger as PatternLogObservation['trigger'],
      pressureLevel: cfg.enablePressure
        ? (draft.pressureLevel as PressureLevel)
        : undefined,
      possessionState: cfg.enablePossession
        ? (draft.possessionState as PossessionState)
        : undefined,
      supportState: cfg.enableSupport
        ? (draft.supportState as SupportState)
        : undefined,
      side: cfg.enableSide && draft.side
        ? (draft.side as PatternLogObservation['side'])
        : undefined,
      teamReaction: String(draft.teamReaction || '').trim(),
      note: String(draft.note || '').trim() || undefined,
      createdAt: isEditing
        ? cases[editIndex!].createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }

    const nextCases = isEditing
      ? cases.map((item, idx) => (idx === editIndex ? nextCase : item))
      : [...cases, nextCase]

    clearDraft({ [cfg.logsKey]: nextCases })
  }

  const startEdit = (index: number) => {
    const item = cases[index]
    if (!item) return
    setAnswers({
      ...safeAnswers,
      [cfg.editIndexKey]: index,
      __pattern_condition_adding_more: true,
      [cfg.draftKey]: {
        caseType: item.caseType || 'pattern_case',
        zone: item.zone,
        trigger: item.trigger,
        pressureLevel: item.pressureLevel || '',
        possessionState: item.possessionState || '',
        supportState: item.supportState || '',
        side: item.side || '',
        teamReaction: item.teamReaction || '',
        note: item.note || '',
      },
    })
  }

  const removeCase = (index: number) => {
    const nextCases = cases.filter((_, idx) => idx !== index)
    const clearingEdit = editIndex === index
    setAnswers({
      ...safeAnswers,
      [cfg.logsKey]: nextCases,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyDraft(), [cfg.editIndexKey]: null, __pattern_condition_adding_more: false }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const selectedDimensionIds = relevantConditions
    .map((entry) => entry.dimensionId)
    .filter((id) => id !== 'none_clear' && id !== 'unclear')

  const toggleRelevantDimension = (value: ConditionDimensionId | 'none_clear' | 'unclear') => {
    const current = [...relevantConditions]
    const exists = current.some((entry) => entry.dimensionId === value)

    if (value === 'none_clear' || value === 'unclear') {
      setAnswers({
        ...safeAnswers,
        [cfg.relevantConditionsKey]: exists ? [] : [{ dimensionId: value }],
      })
      return
    }

    let next = current.filter((entry) => entry.dimensionId !== 'none_clear' && entry.dimensionId !== 'unclear')
    if (exists) {
      next = next.filter((entry) => entry.dimensionId !== value)
    } else {
      next = [...next, { dimensionId: value, role: undefined }]
    }
    setAnswers({
      ...safeAnswers,
      [cfg.relevantConditionsKey]: next,
    })
  }

  const setRole = (dimensionId: ConditionDimensionId, role: ConditionRole) => {
    const next = relevantConditions.map((entry) => (
      entry.dimensionId === dimensionId ? { ...entry, role } : entry
    ))
    setAnswers({
      ...safeAnswers,
      [cfg.relevantConditionsKey]: next,
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
          Welches Verhalten möchtest du auf seine Bedingungen prüfen?
        </label>
        <textarea
          value={candidate}
          onChange={(e) => setAnswers({ ...safeAnswers, [cfg.candidateKey]: e.target.value })}
          maxLength={220}
          placeholder='z. B. „Defense lenkt kontrollierte Entries nach außen.“'
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
          <span>
            {patternCount}/{cfg.minPatternCases}+ Muster
            {cfg.enableCounterCases ? ` · ${counterCount} Gegenfall` : ''}
            {' · '}
            {count}/{cfg.maxObservations}
            {atMinPattern ? ' · Abschluss möglich' : ''}
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #2dd4bf, #14b8a6)' }} />
        </div>
      </div>

      {cases.length > 0 && (
        <section style={{ display: 'grid', gap: '0.45rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Erfasste Fälle</h4>
          {cases.map((item, idx) => {
            const isCounter = item.caseType === 'counter_case'
            return (
              <div
                key={item.id}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: isCounter
                    ? '1px solid rgba(251,191,36,0.35)'
                    : '1px solid rgba(255,255,255,0.12)',
                  background: isCounter ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 750, fontSize: '0.84rem', color: '#e2e8f0' }}>
                      {idx + 1} · {isCounter ? 'Gegenfall' : 'Musterfall'} · {labelForOption(cfg.zones, item.zone)} · {labelForOption(cfg.triggers, item.trigger)}
                    </div>
                    <div style={{ marginTop: '0.15rem', fontSize: '0.8rem', color: 'rgba(226,232,240,0.78)' }}>
                      {item.teamReaction}
                    </div>
                    <div style={{ marginTop: '0.15rem', fontSize: '0.72rem', color: 'rgba(148,163,184,0.95)' }}>
                      {[
                        item.pressureLevel ? labelForOption(cfg.pressureLevels, item.pressureLevel) : null,
                        item.possessionState ? labelForOption(cfg.possessionStates, item.possessionState) : null,
                        item.supportState ? labelForOption(cfg.supportStates, item.supportState) : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button type="button" className="btn" onClick={() => startEdit(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
                      Bearbeiten
                    </button>
                    <button type="button" className="btn" onClick={() => removeCase(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {patternCount >= 2 && (
        <>
          <PatternFingerprint title={cfg.fingerprintTitle} dimensions={summary.fingerprint} />
          <ConditionComparison
            title="Condition Comparison"
            dimensions={summary.dimensions}
            hasCounterCases={counterCount > 0}
          />
        </>
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
              {isEditing ? `Fall ${editIndex! + 1} bearbeiten` : `Neuer Fall (${count + 1}/${cfg.maxObservations})`}
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
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Falltyp</label>
            <OptionChips
              name="case_type"
              options={
                canAddCounter || (isEditing && draft.caseType === 'counter_case')
                  ? DEFAULT_CASE_TYPE_OPTIONS
                  : DEFAULT_CASE_TYPE_OPTIONS.filter((opt) => opt.value === 'pattern_case')
              }
              value={draft.caseType || 'pattern_case'}
              onChange={(next) => updateDraft({ caseType: next as PatternCaseType })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wo findet die Situation statt?</label>
            <OptionChips
              name="cond_zone"
              options={cfg.zones}
              value={draft.zone || ''}
              onChange={(next) => updateDraft({ zone: next as PatternLogDraft['zone'] })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Was löst die Situation aus?</label>
            <OptionChips
              name="cond_trigger"
              options={cfg.triggers}
              value={draft.trigger || ''}
              onChange={(next) => updateDraft({ trigger: next as PatternLogDraft['trigger'] })}
            />
          </div>

          {cfg.enablePressure && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wie hoch ist der unmittelbare Druck?</label>
              <OptionChips
                name="cond_pressure"
                options={cfg.pressureLevels}
                value={draft.pressureLevel || ''}
                onChange={(next) => updateDraft({ pressureLevel: next as PatternLogDraft['pressureLevel'] })}
              />
            </div>
          )}

          {cfg.enablePossession && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wie kontrolliert ist die Situation?</label>
              <OptionChips
                name="cond_possession"
                options={cfg.possessionStates}
                value={draft.possessionState || ''}
                onChange={(next) => updateDraft({ possessionState: next as PatternLogDraft['possessionState'] })}
              />
            </div>
          )}

          {cfg.enableSupport && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Wie gut ist das Team in der Situation unterstützt?</label>
              <OptionChips
                name="cond_support"
                options={cfg.supportStates}
                value={draft.supportState || ''}
                onChange={(next) => updateDraft({ supportState: next as PatternLogDraft['supportState'] })}
              />
            </div>
          )}

          {cfg.enableSide && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Seite <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
              </label>
              <OptionChips
                name="cond_side"
                options={cfg.sides}
                value={draft.side || ''}
                onChange={(next) => updateDraft({ side: next as PatternLogDraft['side'] })}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>{reactionLabel}</label>
            <textarea
              value={draft.teamReaction || ''}
              onChange={(e) => updateDraft({ teamReaction: e.target.value })}
              maxLength={280}
              placeholder={draft.caseType === 'counter_case'
                ? 'z. B. „Trotzdem zentraler Pass Entry.“'
                : 'z. B. „Mitte schließen, nach außen lenken.“'}
              style={{
                width: '100%',
                minHeight: '64px',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)',
                background: '#050712',
                color: '#f7f7ff',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="button"
            className="btn"
            onClick={saveCase}
            disabled={!canSave}
            style={{ minHeight: '48px', opacity: canSave ? 1 : 0.55 }}
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

      {atMinPattern && (
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

          <div style={{ fontSize: '0.86rem', color: 'rgba(236,253,245,0.88)' }}>
            Musterfälle: <strong>{patternCount}</strong>
            {' · '}
            Gegenfälle: <strong>{counterCount}</strong>
          </div>

          {counterCount === 0 && (
            <div
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(251,191,36,0.3)',
                background: 'rgba(245,158,11,0.08)',
              }}
            >
              <strong style={{ color: '#fde68a' }}>Kein geeigneter Gegenfall beobachtet.</strong>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'rgba(254,243,199,0.9)', lineHeight: 1.4 }}>
                Das stärkt die vorläufige Tendenz nicht automatisch – es bedeutet nur, dass im beobachteten Segment keine passende Gegenprobe vorhanden war. „Nicht sicher vergleichbar“ ist ebenfalls ein gültiges Ergebnis.
              </p>
              <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.84rem' }}>
                <input
                  type="checkbox"
                  checked={noCounterAcknowledged}
                  onChange={(e) => setAnswers({ ...safeAnswers, __pattern_condition_no_counter: e.target.checked })}
                />
                Verstanden
              </label>
            </div>
          )}

          {!atMax && !isEditing && !addingMore && (
            <button
              type="button"
              className="btn"
              onClick={() => setAnswers({
                ...safeAnswers,
                [cfg.draftKey]: emptyDraft(),
                [cfg.editIndexKey]: null,
                __pattern_condition_adding_more: true,
              })}
              style={{ minHeight: '46px' }}
            >
              {cfg.addMoreLabel}
            </button>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Welche Bedingungen scheinen wirklich Teil des Musters zu sein?
            </label>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {DEFAULT_RELEVANT_CONDITION_OPTIONS.map((opt) => {
                const checked = relevantConditions.some((entry) => entry.dimensionId === opt.value)
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      minHeight: '44px',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      border: checked ? '1px solid rgba(45,212,191,0.5)' : '1px solid rgba(148,163,184,0.22)',
                      background: checked ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRelevantDimension(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {selectedDimensionIds.map((dimensionId) => {
            if (!isDimensionId(dimensionId)) return null
            const entry = relevantConditions.find((item) => item.dimensionId === dimensionId)
            const dimSummary = summary.dimensions.find((item) => item.dimensionId === dimensionId)
            return (
              <div
                key={`role-${dimensionId}`}
                style={{
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  Rolle: {labelForOption(DEFAULT_RELEVANT_CONDITION_OPTIONS, dimensionId)}
                </div>
                {dimSummary && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.7)', marginBottom: '0.45rem' }}>
                    Beobachtet: {dimSummary.patternDetail}
                    {counterCount > 0 ? ` · Gegenfall: ${dimSummary.counterDetail}` : ''}
                  </div>
                )}
                <OptionChips
                  name={`role-${dimensionId}`}
                  options={DEFAULT_CONDITION_ROLE_OPTIONS}
                  value={entry?.role || ''}
                  onChange={(next) => setRole(dimensionId, next as ConditionRole)}
                />
              </div>
            )
          })}

          {counterCount > 0 && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Gegenfall prüfen
              </label>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.8rem', color: 'rgba(226,232,240,0.7)', lineHeight: 1.4 }}>
                Ein Gegenfall ist eine ausreichend ähnliche Ausgangslage, in der das erwartete Verhalten nicht oder anders auftritt.
                Er kann die Formulierung einschränken oder schärfen, widerlegt eine Tendenz aber nicht automatisch.
              </p>
              <ul style={{ margin: '0 0 0.55rem', paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'rgba(226,232,240,0.72)', lineHeight: 1.45 }}>
                <li>Welche Ausgangsmerkmale sind mit den bisherigen Fällen vergleichbar?</li>
                <li>Was verlief sichtbar anders?</li>
                <li>Welche bisherige Annahme wird dadurch schwächer oder muss enger formuliert werden?</li>
                <li>Reicht der Bildausschnitt für den Vergleich?</li>
              </ul>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Was war im Gegenfall anders?
              </label>
              <OptionChips
                name="counter_diff"
                options={DEFAULT_COUNTER_DIFFERENCE_OPTIONS}
                multi
                selectedValues={counterDifferences}
                onChange={(next) => setAnswers({
                  ...safeAnswers,
                  [cfg.counterDifferencesKey]: next as CounterDifference[],
                })}
              />
              <textarea
                value={counterDifferenceNote}
                onChange={(e) => setAnswers({
                  ...safeAnswers,
                  [cfg.counterDifferenceNoteKey]: e.target.value,
                })}
                maxLength={240}
                placeholder="Welche Annahme wird schwächer oder muss enger formuliert werden? (Keine Kausalität.)"
                style={{
                  width: '100%',
                  marginTop: '0.55rem',
                  minHeight: '56px',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(81,145,162,0.45)',
                  background: '#050712',
                  color: '#f7f7ff',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Wie klar kannst du inzwischen die Bedingungen der bisherigen Beobachtungen beschreiben?
            </label>
            <OptionChips
              name="condition_assessment"
              options={DEFAULT_CONDITION_ASSESSMENT_OPTIONS}
              value={conditionAssessment}
              onChange={(next) => setAnswers({
                ...safeAnswers,
                [cfg.conditionAssessmentKey]: next,
              })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Formuliere das Muster als Wenn–Dann-Satz.
            </label>
            <textarea
              value={ifThenSummary}
              onChange={(e) => setAnswers({
                ...safeAnswers,
                [cfg.ifThenKey]: e.target.value,
              })}
              maxLength={360}
              placeholder='z. B. „Wenn der Gegner mit kontrolliertem Entry kommt und die Mitte früh geschlossen ist, dann lenkt das Team den Puck häufig nach außen.“'
              style={{
                width: '100%',
                minHeight: '78px',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.5)',
                background: '#050712',
                color: '#f7f7ff',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: 'rgba(226,232,240,0.55)' }}>
              Formuliere beobachtend („tritt häufig auf, wenn …“), nicht kausal („verursacht“).
            </p>
          </div>

          {conditionAssessment && ifThenSummary.trim() && (
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
                <strong>Wenn–Dann:</strong> „{ifThenSummary.trim()}“
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.85)' }}>
                Einschätzung: {labelForOption(DEFAULT_CONDITION_ASSESSMENT_OPTIONS, conditionAssessment)}
              </div>
              {summary.dimensions.slice(0, 4).map((dim) => (
                <div key={`result-${dim.dimensionId}`} style={{ fontSize: '0.8rem', color: 'rgba(236,253,245,0.8)' }}>
                  <strong>{dim.label}:</strong> {dim.patternDetail}
                </div>
              ))}
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

export default PatternConditionDrill
