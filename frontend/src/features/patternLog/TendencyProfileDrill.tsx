import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from './OptionChips'
import { TendencyProfileVisual, tendencyShortLabel } from './TendencyProfileVisual'
import {
  isTendencyComplete,
  resolveTendencyProfileConfig,
  summarizeTendencyProfile,
} from './summarizeTendencyProfile'
import { labelForOption } from './labels'
import type {
  AttributionConfidence,
  PatternAttribution,
  TendencyAllowedVariationId,
  TendencyDraft,
  TendencyEntry,
  TendencyFrequency,
  TendencyPrimaryCondition,
  TendencyStableCoreId,
} from './types'

type TendencyProfileDrillProps = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraft(): TendencyDraft {
  return {
    summary: '',
    frequency: '',
    primaryCondition: '',
    conditionDetail: '',
    stableCore: [],
    allowedVariation: [],
    attribution: '',
    confidence: '',
    strongestEvidence: '',
    counterEvidence: '',
  }
}

function draftToEntry(draft: TendencyDraft, existing?: TendencyEntry): TendencyEntry {
  return {
    id: existing?.id || createId(),
    summary: String(draft.summary || '').trim(),
    frequency: (draft.frequency || '') as TendencyFrequency | '',
    primaryCondition: (draft.primaryCondition || '') as TendencyPrimaryCondition | '',
    conditionDetail: String(draft.conditionDetail || '').trim() || undefined,
    stableCore: Array.isArray(draft.stableCore) ? draft.stableCore : [],
    allowedVariation: Array.isArray(draft.allowedVariation) ? draft.allowedVariation : [],
    attribution: (draft.attribution || '') as PatternAttribution | '',
    confidence: (draft.confidence || '') as AttributionConfidence | '',
    strongestEvidence: String(draft.strongestEvidence || '').trim(),
    counterEvidence: String(draft.counterEvidence || '').trim() || undefined,
  }
}

function entryToDraft(entry: TendencyEntry): TendencyDraft {
  return {
    summary: entry.summary || '',
    frequency: entry.frequency || '',
    primaryCondition: entry.primaryCondition || '',
    conditionDetail: entry.conditionDetail || '',
    stableCore: entry.stableCore || [],
    allowedVariation: entry.allowedVariation || [],
    attribution: entry.attribution || '',
    confidence: entry.confidence || '',
    strongestEvidence: entry.strongestEvidence || '',
    counterEvidence: entry.counterEvidence || '',
  }
}

export function TendencyProfileDrill({ drill, answers, setAnswers }: TendencyProfileDrillProps) {
  const safeAnswers = answers || {}
  const cfg = resolveTendencyProfileConfig(drill?.config || {})
  const tendencies: TendencyEntry[] = Array.isArray(safeAnswers[cfg.tendenciesKey])
    ? safeAnswers[cfg.tendenciesKey]
    : []
  const draft: TendencyDraft = { ...emptyDraft(), ...(safeAnswers[cfg.draftKey] || {}) }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const adding = safeAnswers.__tendency_profile_adding === true
  const segmentSummary = String(safeAnswers[cfg.segmentSummaryKey] || '')
  const strongestTendencyId = String(safeAnswers[cfg.strongestTendencyKey] || '')
  const nextWatch = String(safeAnswers[cfg.nextWatchKey] || '')
  const falsificationNote = String(safeAnswers[cfg.falsificationNoteKey] || '')

  const count = tendencies.length
  const atMax = count >= cfg.maxTendencies
  const atMin = count >= cfg.minTendencies
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || adding || count < cfg.minTendencies

  const profileSummary = useMemo(
    () => summarizeTendencyProfile(tendencies, drill?.config || {}),
    [tendencies, drill?.config],
  )

  const updateDraft = (patch: Partial<TendencyDraft>) => {
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
      __tendency_profile_adding: false,
    })
  }

  const canSave = isTendencyComplete(draftToEntry(draft))

  const saveTendency = () => {
    if (!canSave || (!isEditing && atMax)) return
    const nextEntry = draftToEntry(draft, isEditing ? tendencies[editIndex!] : undefined)
    const nextList = isEditing
      ? tendencies.map((item, idx) => (idx === editIndex ? nextEntry : item))
      : [...tendencies, nextEntry]
    clearDraft({ [cfg.tendenciesKey]: nextList })
  }

  const startAdd = () => {
    if (atMax) return
    setAnswers({
      ...safeAnswers,
      [cfg.draftKey]: emptyDraft(),
      [cfg.editIndexKey]: null,
      __tendency_profile_adding: true,
    })
  }

  const startEdit = (index: number) => {
    const item = tendencies[index]
    if (!item) return
    setAnswers({
      ...safeAnswers,
      [cfg.editIndexKey]: index,
      __tendency_profile_adding: true,
      [cfg.draftKey]: entryToDraft(item),
    })
  }

  const removeTendency = (index: number) => {
    const removed = tendencies[index]
    const nextList = tendencies.filter((_, idx) => idx !== index)
    const patch: Record<string, any> = { [cfg.tendenciesKey]: nextList }
    if (removed && strongestTendencyId === removed.id) patch[cfg.strongestTendencyKey] = ''
    if (removed && nextWatch === removed.id) patch[cfg.nextWatchKey] = ''
    const clearingEdit = editIndex === index
    setAnswers({
      ...safeAnswers,
      ...patch,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyDraft(), [cfg.editIndexKey]: null, __tendency_profile_adding: false }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const guide = drill?.didactics?.observation_guide
  const progressPercent = Math.min(100, Math.round((count / cfg.maxTendencies) * 100))
  const allComplete =
    (tendencies.length === 0 && (cfg.allowEmptyTendencies || cfg.minTendencies === 0))
    || (tendencies.length > 0 && tendencies.every(isTendencyComplete))

  const nextWatchOptions = [
    ...tendencies.map((t, idx) => ({
      value: t.id,
      label: `Tendenz ${idx + 1}: ${tendencyShortLabel(t.summary, idx + 1)}`,
    })),
    { value: 'none', label: 'keine davon' },
    { value: 'new_possible', label: 'neue mögliche Tendenz' },
    { value: 'unclear', label: 'unklar' },
  ]

  const strongestOptions = tendencies.map((t, idx) => ({
    value: t.id,
    label: `${idx + 1} · ${tendencyShortLabel(t.summary, idx + 1)}`,
  }))

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
          Formuliere segmentbezogen: „im beobachteten Segment“ — keine Teamwahrheit, keine Systemnamen nötig.
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.25rem' }}>
          <span>Tendenzen</span>
          <span>{count}/{cfg.maxTendencies}{atMin ? ' · Abschluss möglich' : ''}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #2dd4bf, #14b8a6)' }} />
        </div>
      </div>

      {tendencies.length > 0 && (
        <section style={{ display: 'grid', gap: '0.45rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Verfolgte Tendenzen</h4>
          {tendencies.map((item, idx) => (
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
                    {idx + 1} · {tendencyShortLabel(item.summary, idx + 1)}
                  </div>
                  <div style={{ marginTop: '0.15rem', fontSize: '0.76rem', color: 'rgba(148,163,184,0.95)' }}>
                    {[
                      item.frequency ? labelForOption(cfg.frequencyOptions, item.frequency) : null,
                      item.confidence ? `Sicherheit ${labelForOption(cfg.confidenceOptions, item.confidence)}` : null,
                      item.attribution ? labelForOption(cfg.attributionOptions, item.attribution) : null,
                      isTendencyComplete(item) ? null : 'unvollständig',
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  <button type="button" className="btn" onClick={() => startEdit(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
                    Bearbeiten
                  </button>
                  <button type="button" className="btn" onClick={() => removeTendency(idx)} style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}>
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
              {isEditing ? `Tendenz ${editIndex! + 1} bearbeiten` : `Tendenz ${count + 1}`}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
              {cfg.observeHint}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>Was wiederholt sich?</label>
            <textarea
              value={draft.summary || ''}
              onChange={(e) => updateDraft({ summary: e.target.value })}
              maxLength={220}
              placeholder='z. B. „Bei kontrollierten Entries schließt das Team früh die Mitte und lenkt den Puck nach außen.“'
              style={{
                width: '100%', minHeight: '58px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.45)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Wie oft hast du das Verhalten im beobachteten Segment gesehen?
            </label>
            <OptionChips
              name="tend_freq"
              options={cfg.frequencyOptions}
              value={draft.frequency || ''}
              onChange={(next) => updateDraft({ frequency: next as TendencyFrequency })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Unter welcher Bedingung tritt die Tendenz besonders auf?
            </label>
            <OptionChips
              name="tend_cond"
              options={cfg.primaryConditionOptions}
              value={draft.primaryCondition || ''}
              onChange={(next) => updateDraft({ primaryCondition: next as TendencyPrimaryCondition })}
            />
            <label style={{ display: 'block', fontWeight: 650, margin: '0.55rem 0 0.3rem', fontSize: '0.86rem' }}>
              Welche genau? <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={draft.conditionDetail || ''}
              onChange={(e) => updateDraft({ conditionDetail: e.target.value })}
              maxLength={120}
              placeholder="z. B. kontrollierter gegnerischer Entry"
              style={{
                width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.4)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Was bleibt in den Situationen am ehesten konstant?
            </label>
            <OptionChips
              name="tend_core"
              options={cfg.stableCoreOptions}
              multi
              selectedValues={draft.stableCore || []}
              onChange={(next) => updateDraft({ stableCore: next as TendencyStableCoreId[] })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Was darf sich verändern, ohne dass du die Tendenz als gebrochen ansiehst?
            </label>
            <OptionChips
              name="tend_var"
              options={cfg.variationOptions}
              multi
              selectedValues={draft.allowedVariation || []}
              onChange={(next) => updateDraft({ allowedVariation: next as TendencyAllowedVariationId[] })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              In welchen beobachteten Kontexten bleibt diese Tendenz sichtbar?
            </label>
            <OptionChips
              name="tend_attr"
              options={cfg.attributionOptions}
              value={draft.attribution || ''}
              onChange={(next) => updateDraft({ attribution: next as PatternAttribution })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Sicherheit der vorläufigen Einordnung
            </label>
            <OptionChips
              name="tend_conf"
              options={cfg.confidenceOptions}
              value={draft.confidence || ''}
              onChange={(next) => updateDraft({ confidence: next as AttributionConfidence })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
              Welche Beobachtung stützt diese vorläufige Tendenz am deutlichsten?
            </label>
            <textarea
              value={draft.strongestEvidence || ''}
              onChange={(e) => updateDraft({ strongestEvidence: e.target.value })}
              maxLength={280}
              placeholder='z. B. „Das Verhalten blieb bei drei vergleichbaren Entry-Situationen sichtbar.“'
              style={{
                width: '100%', minHeight: '62px', padding: '0.65rem', borderRadius: '8px',
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
              value={draft.counterEvidence || ''}
              onChange={(e) => updateDraft({ counterEvidence: e.target.value })}
              maxLength={220}
              placeholder='z. B. „In einer vergleichbaren Lage trat das Verhalten nicht auf.“'
              style={{
                width: '100%', minHeight: '52px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.4)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <button type="button" className="btn" onClick={saveTendency} disabled={!canSave} style={{ minHeight: '48px', opacity: canSave ? 1 : 0.55 }}>
            {isEditing ? 'Änderung speichern' : cfg.submitLabel}
          </button>
          {(isEditing || (adding && count >= cfg.minTendencies)) && (
            <button type="button" className="btn" onClick={() => clearDraft()} style={{ minHeight: '42px' }}>
              Abbrechen
            </button>
          )}
        </section>
      )}

      {atMin && allComplete && !collecting && (
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

          {count === 0 && (
            <div
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(251,191,36,0.3)',
                background: 'rgba(245,158,11,0.08)',
              }}
            >
              <strong style={{ color: '#fde68a' }}>Keine ausreichend gestützte Tendenz</strong>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'rgba(254,243,199,0.9)', lineHeight: 1.4 }}>
                Das ist ein gültiger Abschluss, wenn die Beobachtungsgrundlage nicht reicht. Du kannst optional trotzdem eine Tendenz hinzufügen.
              </p>
            </div>
          )}

          {!atMax && (
            <button type="button" className="btn" onClick={startAdd} style={{ minHeight: '46px' }}>
              {cfg.addMoreLabel}
            </button>
          )}
          {atMax && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(254,243,199,0.9)' }}>
              Maximum erreicht — priorisiere höchstens drei vorläufige Tendenzen, die das beobachtete Segment beschreiben.
            </p>
          )}

          {count > 0 && (
            <TendencyProfileVisual
              title="Tendenzen im beobachteten Segment"
              summary={profileSummary}
              strongestTendencyId={strongestTendencyId || undefined}
            />
          )}

          {count >= 2 && cfg.requireStrongestTendency && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Welche vorläufige Tendenz ist am deutlichsten gestützt?
              </label>
              <OptionChips
                name="strongest_tend"
                options={strongestOptions}
                value={strongestTendencyId}
                onChange={(next) => setAnswers({ ...safeAnswers, [cfg.strongestTendencyKey]: next as string })}
              />
            </div>
          )}

          {cfg.requireSegmentSummary && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Fasse die Tendenzen im beobachteten Segment in 2–4 Sätzen zusammen.
              </label>
              <textarea
                value={segmentSummary}
                onChange={(e) => setAnswers({ ...safeAnswers, [cfg.segmentSummaryKey]: e.target.value })}
                maxLength={700}
                placeholder='z. B. „Im beobachteten Drittel …“ oder „Keine ausreichend gestützte Tendenz — Beobachtungsgrundlage reicht noch nicht.“'
                style={{
                  width: '100%', minHeight: '96px', padding: '0.65rem', borderRadius: '8px',
                  border: '1px solid rgba(81,145,162,0.5)', background: '#050712', color: '#f7f7ff',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {count > 0 && cfg.requireNextWatch && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                Welche Tendenz soll als Nächstes weiter geprüft werden?
              </label>
              <OptionChips
                name="next_watch"
                options={nextWatchOptions}
                value={nextWatch}
                onChange={(next) => setAnswers({ ...safeAnswers, [cfg.nextWatchKey]: next as string })}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 650, margin: '0 0 0.3rem', fontSize: '0.86rem' }}>
              {count === 0
                ? 'Was solltest du als Nächstes beobachten?'
                : 'Welche nächste Beobachtung würde gegen diese vorläufige Tendenz sprechen oder eine engere Formulierung erforderlich machen?'}{' '}
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <textarea
              value={falsificationNote}
              onChange={(e) => setAnswers({ ...safeAnswers, [cfg.falsificationNoteKey]: e.target.value })}
              maxLength={220}
              placeholder={count === 0
                ? 'Nächste Prüfbeobachtung oder offener Vergleichspunkt.'
                : 'Nächste Prüfbeobachtung — ohne den Begriff Falsifikation vorauszusetzen.'}
              style={{
                width: '100%', minHeight: '52px', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(81,145,162,0.4)', background: '#050712', color: '#f7f7ff',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {segmentSummary.trim() && (count < 2 || strongestTendencyId || !cfg.requireStrongestTendency) && (count === 0 || !cfg.requireNextWatch || Boolean(nextWatch)) && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(153,246,228,0.35)',
                background: 'rgba(6,78,59,0.25)',
                display: 'grid',
                gap: '0.55rem',
              }}
            >
              <h4 style={{ margin: 0, color: '#99f6e4' }}>Ergebnis · beobachtetes Segment</h4>
              {count === 0 ? (
                <div style={{ fontSize: '0.84rem', color: 'rgba(236,253,245,0.9)' }}>
                  Keine ausreichend gestützte Tendenz im beobachteten Segment.
                </div>
              ) : tendencies.map((t, idx) => (
                <div key={t.id} style={{ fontSize: '0.82rem', color: 'rgba(236,253,245,0.9)', display: 'grid', gap: '0.15rem' }}>
                  <strong>{idx + 1} · {t.summary}</strong>
                  <span>
                    {labelForOption(cfg.frequencyOptions, t.frequency)}
                    {' · '}
                    {t.conditionDetail || labelForOption(cfg.primaryConditionOptions, t.primaryCondition)}
                    {' · '}
                    {labelForOption(cfg.attributionOptions, t.attribution)}
                    {' · Sicherheit '}
                    {labelForOption(cfg.confidenceOptions, t.confidence)}
                  </span>
                  <span style={{ color: 'rgba(236,253,245,0.75)' }}>
                    Wiederkehrend: {(t.stableCore || []).map((v) => labelForOption(cfg.stableCoreOptions, v)).join(', ')}
                  </span>
                  <span style={{ color: 'rgba(236,253,245,0.75)' }}>
                    Variabel: {(t.allowedVariation || []).map((v) => labelForOption(cfg.variationOptions, v)).join(', ')}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: '0.84rem', color: 'rgba(236,253,245,0.92)' }}>
                <strong>Zusammenfassung:</strong> „{segmentSummary.trim()}“
              </div>
              {strongestTendencyId && (
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>Am deutlichsten gestützt:</strong>{' '}
                  {tendencyShortLabel(
                    tendencies.find((t) => t.id === strongestTendencyId)?.summary || '',
                    1,
                  )}
                </div>
              )}
              {nextWatch && (
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>Weiter prüfen:</strong>{' '}
                  {nextWatchOptions.find((o) => o.value === nextWatch)?.label || nextWatch}
                </div>
              )}
              {falsificationNote.trim() && (
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>Nächste Prüfbeobachtung:</strong> „{falsificationNote.trim()}“
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

export default TendencyProfileDrill
