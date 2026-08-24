import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { AdjustmentChain } from './AdjustmentChain'
import {
  ASSESSMENT_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  INTERACTION_RESPONSE_OPTIONS,
  NO_ADJUSTMENT_REASON_OPTIONS,
  POSSIBLE_TRIGGER_OPTIONS,
  PRIMARY_CHANGE_OPTIONS,
  PRIMARY_PICK_EXTRA_OPTIONS,
  STABILITY_OPTIONS,
  STABLE_ELEMENT_OPTIONS,
  labelForOption,
  labelsForValues,
  shortLabel,
} from './labels'
import {
  describeProfile,
  draftToEntry,
  emptyAdjustmentDraft,
  entryToDraft,
  getNextWatchOptions,
  isAdjustmentEntryComplete,
  resolveAdjustmentProfileConfig,
  validateAdjustmentProfileAnswers,
} from './profileLogic'
import type {
  AdjustmentDraftStage,
  AdjustmentProfileDraft,
  AdjustmentProfileEntry,
  AdjustmentProfileStage,
  ProfileExamplesHelp,
} from './types'
import styles from './AdjustmentProfileDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

const DRAFT_STAGES: AdjustmentDraftStage[] = ['before', 'trigger', 'after', 'assess']

function patchAnswers(
  answers: Record<string, any>,
  setAnswers: (next: Record<string, any>) => void,
  patch: Record<string, any>,
) {
  setAnswers({ ...(answers || {}), ...patch })
}

function ExamplesAccordion({ help }: { help: ProfileExamplesHelp }) {
  return (
    <details className={`${styles.examplesHelp} ui-flat-mobile mobile-flatten`}>
      <summary className={styles.examplesSummary}>{help.title}</summary>
      <div className={styles.examplesBody}>
        {help.intro && <p className={styles.examplesIntro}>{help.intro}</p>}
        {help.suitable.length > 0 && (
          <ul className={styles.examplesList}>
            {help.suitable.map((example) => (
              <li key={example.title} className={styles.exampleItem}>
                <p className={styles.exampleTitle}>{example.title}</p>
                <p className={styles.exampleDescription}>{example.description}</p>
              </li>
            ))}
          </ul>
        )}
        {help.unsuitable.length > 0 && (
          <>
            <p className={styles.unsuitableTitle}>{help.unsuitableTitle}</p>
            <ul className={styles.unsuitableList}>
              {help.unsuitable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        {help.footer && <p className={styles.examplesFooter}>{help.footer}</p>}
      </div>
    </details>
  )
}

function canAdvanceDraft(stage: AdjustmentDraftStage, draft: AdjustmentProfileDraft): boolean {
  if (stage === 'before') {
    return Boolean(
      String(draft.beforeBehavior || '').trim()
        && String(draft.changedBehavior || '').trim()
        && draft.primaryChange,
    )
  }
  if (stage === 'trigger') {
    return Boolean(draft.stability && draft.possibleTrigger && String(draft.triggerEvidence || '').trim())
  }
  if (stage === 'after') {
    return Boolean((draft.stableElements || []).length > 0 && draft.interactionResponse)
  }
  return isAdjustmentEntryComplete(draft)
}

function CompactAdjustmentCard({
  index,
  entry,
  onEdit,
  onRemove,
}: {
  index: number
  entry: AdjustmentProfileEntry
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <article className={styles.compactCard}>
      <p className={styles.compactTitle}>
        {index + 1} · {shortLabel(entry.changedBehavior, `Anpassung ${index + 1}`)}
      </p>
      <p className={styles.compactMeta}>
        Vorher: {shortLabel(entry.beforeBehavior, '—')}
        <br />
        Nachher: {shortLabel(entry.changedBehavior, '—')}
        <br />
        möglicher Trigger: {labelForOption(POSSIBLE_TRIGGER_OPTIONS, entry.possibleTrigger)}
        <br />
        Signal: {labelForOption(ASSESSMENT_OPTIONS, entry.assessment)}
        {' · '}
        Sicherheit der Interpretation: {labelForOption(DEFAULT_CONFIDENCE_OPTIONS, entry.confidence)}
      </p>
      <div className={styles.cardActions}>
        <button type="button" className={styles.miniBtn} onClick={onEdit}>
          Bearbeiten
        </button>
        <button type="button" className={styles.miniBtn} onClick={onRemove}>
          Entfernen
        </button>
      </div>
    </article>
  )
}

export function AdjustmentProfileDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveAdjustmentProfileConfig(drill?.config || {})
  const stage = (safeAnswers[cfg.stageKey] || 'collect') as AdjustmentProfileStage
  const entries: AdjustmentProfileEntry[] = Array.isArray(safeAnswers[cfg.entriesKey])
    ? safeAnswers[cfg.entriesKey]
    : []
  const draft: AdjustmentProfileDraft = { ...emptyAdjustmentDraft(), ...(safeAnswers[cfg.draftKey] || {}) }
  const draftStage = (safeAnswers[cfg.draftStageKey] || 'before') as AdjustmentDraftStage
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const adding = safeAnswers[cfg.addingKey] === true
  const noClear = safeAnswers[cfg.noClearKey] === true
  const count = entries.length
  const atMax = count >= cfg.maxAdjustments
  const atMin = count >= cfg.minAdjustments
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = !noClear && (isEditing || adding || count < cfg.minAdjustments)

  const setStage = (next: AdjustmentProfileStage) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: next })
  }

  const updateDraft = (patch: Partial<AdjustmentProfileDraft>) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.draftKey]: { ...draft, ...patch } })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyAdjustmentDraft(),
      [cfg.draftStageKey]: 'before',
      [cfg.editIndexKey]: null,
      [cfg.addingKey]: false,
    })
  }

  const saveEntry = () => {
    if (!isAdjustmentEntryComplete(draft) || (!isEditing && atMax)) return
    const nextEntry = draftToEntry(draft, isEditing ? entries[editIndex!] : undefined)
    const nextList = isEditing
      ? entries.map((item, idx) => (idx === editIndex ? nextEntry : item))
      : [...entries, nextEntry]
    clearDraft({
      [cfg.entriesKey]: nextList,
      [cfg.noClearKey]: false,
      [cfg.noClearReasonKey]: '',
    })
  }

  const startAdd = () => {
    if (atMax || noClear) return
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: emptyAdjustmentDraft(),
      [cfg.draftStageKey]: 'before',
      [cfg.editIndexKey]: null,
      [cfg.addingKey]: true,
      [cfg.stageKey]: 'collect',
    })
  }

  const startEdit = (index: number) => {
    const item = entries[index]
    if (!item) return
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.editIndexKey]: index,
      [cfg.addingKey]: true,
      [cfg.draftStageKey]: 'before',
      [cfg.draftKey]: entryToDraft(item),
      [cfg.stageKey]: 'collect',
    })
  }

  const removeEntry = (index: number) => {
    const removed = entries[index]
    const nextList = entries.filter((_, idx) => idx !== index)
    const patch: Record<string, any> = { [cfg.entriesKey]: nextList }
    if (removed && safeAnswers[cfg.primaryAdjustmentKey] === removed.id) {
      patch[cfg.primaryAdjustmentKey] = ''
    }
    const clearingEdit = editIndex === index
    patchAnswers(safeAnswers, setAnswers, {
      ...patch,
      ...(clearingEdit
        ? {
            [cfg.draftKey]: emptyAdjustmentDraft(),
            [cfg.draftStageKey]: 'before',
            [cfg.editIndexKey]: null,
            [cfg.addingKey]: false,
          }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
    })
  }

  const markNoClear = () => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.noClearKey]: true,
      [cfg.entriesKey]: [],
      [cfg.draftKey]: emptyAdjustmentDraft(),
      [cfg.draftStageKey]: 'before',
      [cfg.editIndexKey]: null,
      [cfg.addingKey]: false,
      [cfg.primaryAdjustmentKey]: '',
      [cfg.stageKey]: 'wrapup',
    })
  }

  const goDraftNext = () => {
    if (!canAdvanceDraft(draftStage, draft)) return
    const idx = DRAFT_STAGES.indexOf(draftStage)
    if (idx < DRAFT_STAGES.length - 1) {
      patchAnswers(safeAnswers, setAnswers, { [cfg.draftStageKey]: DRAFT_STAGES[idx + 1] })
      return
    }
    saveEntry()
  }

  const goDraftBack = () => {
    const idx = DRAFT_STAGES.indexOf(draftStage)
    if (idx <= 0) return
    patchAnswers(safeAnswers, setAnswers, { [cfg.draftStageKey]: DRAFT_STAGES[idx - 1] })
  }

  const guide = drill?.didactics?.observation_guide
  const stats = describeProfile(entries)
  const wrapupValid = validateAdjustmentProfileAnswers(cfg, { ...safeAnswers, [cfg.stageKey]: 'complete' }) === null
  const primaryOptions = [
    ...entries.map((entry, idx) => ({
      value: entry.id,
      label: `${idx + 1} · ${shortLabel(entry.changedBehavior, `Anpassung ${idx + 1}`)}`,
    })),
    ...PRIMARY_PICK_EXTRA_OPTIONS,
  ]
  const nextWatchOptions = getNextWatchOptions(noClear ? 0 : count)

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Mögliche Spielanpassungen im beobachteten Segment</span>

        {noClear ? (
          <div className={styles.resultBlock}>
            <div className={styles.resultLabel}>Keine ausreichend gestützte Spielanpassung</div>
            <p className={styles.resultValue}>
              {labelForOption(NO_ADJUSTMENT_REASON_OPTIONS, String(safeAnswers[cfg.noClearReasonKey] || ''))}
            </p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={entry.id} className={styles.panel}>
              <p className={styles.compactTitle}>
                {idx + 1} · {shortLabel(entry.changedBehavior, `Anpassung ${idx + 1}`)}
              </p>
              <AdjustmentChain
                before={entry.beforeBehavior}
                possibleTrigger={labelForOption(POSSIBLE_TRIGGER_OPTIONS, entry.possibleTrigger)}
                change={entry.changedBehavior}
                response={labelForOption(INTERACTION_RESPONSE_OPTIONS, entry.interactionResponse)}
              />
              <div className={styles.resultBlock}>
                <div className={styles.resultLabel}>Was blieb stabil?</div>
                <p className={styles.resultValue}>
                  {labelsForValues(STABLE_ELEMENT_OPTIONS, entry.stableElements).join(' · ')}
                </p>
              </div>
              <div className={styles.resultBlock}>
                <div className={styles.resultLabel}>Deine Einordnung · Sicherheit der Interpretation</div>
                <p className={styles.resultValue}>
                  {labelForOption(ASSESSMENT_OPTIONS, entry.assessment)}
                  {' · '}
                  {labelForOption(DEFAULT_CONFIDENCE_OPTIONS, entry.confidence)}
                </p>
              </div>
              {entry.counterEvidence && (
                <div className={styles.resultBlock}>
                  <div className={styles.resultLabel}>Gegenargument</div>
                  <p className={styles.resultValue}>{entry.counterEvidence}</p>
                </div>
              )}
            </div>
          ))
        )}

        {!noClear && count >= 2 && (
          <div className={styles.resultBlock}>
            <div className={styles.resultLabel}>Am deutlichsten gestützte mögliche Spielanpassung</div>
            <p className={styles.resultValue}>
              {labelForOption(primaryOptions, String(safeAnswers[cfg.primaryAdjustmentKey] || ''))}
            </p>
          </div>
        )}

        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Segment Summary</div>
          <p className={styles.resultValue}>{String(safeAnswers[cfg.segmentSummaryKey] || '')}</p>
        </div>

        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Weiter beobachten</div>
          <p className={styles.resultValue}>
            {labelForOption(nextWatchOptions, String(safeAnswers[cfg.nextWatchKey] || ''))}
            {safeAnswers[cfg.falsificationNoteKey]
              ? ` · Falsifikation: ${safeAnswers[cfg.falsificationNoteKey]}`
              : ''}
          </p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('collect')}>
            Kandidaten bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('wrapup')}>
            Summary bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Mögliche Spielanpassungen</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {cfg.examplesHelp && <ExamplesAccordion help={cfg.examplesHelp} />}
      {guide && <DrillGuideCard guide={guide} />}

      {entries.length > 0 && (
        <div className={styles.cardList}>
          {entries.map((entry, idx) => (
            <CompactAdjustmentCard
              key={entry.id}
              index={idx}
              entry={entry}
              onEdit={() => startEdit(idx)}
              onRemove={() => removeEntry(idx)}
            />
          ))}
          {stats.length > 0 && <p className={styles.stats}>{stats.join(' ')}</p>}
        </div>
      )}

      {stage === 'collect' && collecting && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <p className={styles.fieldLabel}>
            {isEditing ? `Anpassung ${editIndex! + 1} bearbeiten` : `Anpassungskandidat ${count + 1}`}
          </p>

          {draftStage === 'before' && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Was war vor der Veränderung typisch?</div>
                <textarea
                  className={styles.textarea}
                  value={draft.beforeBehavior}
                  maxLength={400}
                  placeholder="z. B. Die erste defensive Linie griff gegnerische Entries früh an der Blue Line an."
                  onChange={(event) => updateDraft({ beforeBehavior: event.target.value })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Was war später anders?</div>
                <textarea
                  className={styles.textarea}
                  value={draft.changedBehavior}
                  maxLength={400}
                  placeholder="z. B. Die erste Linie fiel tiefer zurück und priorisierte stärker die Mitte."
                  onChange={(event) => updateDraft({ changedBehavior: event.target.value })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Hauptdimension der Veränderung</div>
                <OptionChips
                  name="primary-change"
                  options={PRIMARY_CHANGE_OPTIONS}
                  value={draft.primaryChange}
                  onChange={(next) => updateDraft({ primaryChange: String(next) })}
                />
              </div>
            </>
          )}

          {draftStage === 'trigger' && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Wie stabil wirkte die Veränderung danach?</div>
                <OptionChips
                  name="stability"
                  options={STABILITY_OPTIONS}
                  value={draft.stability}
                  onChange={(next) => updateDraft({ stability: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Worauf könnte die Veränderung reagiert haben?</div>
                <p className={styles.lead}>Vorsichtig: könnte — nicht „kam wegen“.</p>
                <OptionChips
                  name="possible-trigger"
                  options={POSSIBLE_TRIGGER_OPTIONS}
                  value={draft.possibleTrigger}
                  onChange={(next) => updateDraft({ possibleTrigger: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>
                  Was spricht dafür, dass Veränderung und möglicher Auslöser zusammenhängen?
                </div>
                <textarea
                  className={styles.textarea}
                  value={draft.triggerEvidence}
                  maxLength={400}
                  placeholder="z. B. Der tiefere Rückzug begann erst, nachdem der Gegner mehrfach zentral durch die erste Linie kam."
                  onChange={(event) => updateDraft({ triggerEvidence: event.target.value })}
                />
              </div>
            </>
          )}

          {draftStage === 'after' && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Was blieb trotz der Veränderung erkennbar gleich?</div>
                <OptionChips
                  name="stable-elements"
                  multi
                  options={STABLE_ELEMENT_OPTIONS}
                  selectedValues={draft.stableElements || []}
                  onChange={(next) =>
                    updateDraft({ stableElements: Array.isArray(next) ? next : [String(next)] })
                  }
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>
                  Was passierte nach der Veränderung mit der ursprünglichen Interaktion?
                </div>
                <p className={styles.lead}>Nicht: Hat die Spielanpassung funktioniert? Sondern: Hat sich die Interaktion verändert?</p>
                <OptionChips
                  name="interaction-response"
                  options={INTERACTION_RESPONSE_OPTIONS}
                  value={draft.interactionResponse}
                  onChange={(next) => updateDraft({ interactionResponse: String(next) })}
                />
              </div>
            </>
          )}

          {draftStage === 'assess' && (
            <>
              <AdjustmentChain
                before={draft.beforeBehavior}
                possibleTrigger={labelForOption(POSSIBLE_TRIGGER_OPTIONS, draft.possibleTrigger)}
                change={draft.changedBehavior}
                response={labelForOption(INTERACTION_RESPONSE_OPTIONS, draft.interactionResponse)}
              />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>
                  Wie stark ist dein Hinweis, dass es sich wirklich um eine mögliche Spielanpassung handelt?
                </div>
                <OptionChips
                  name="assessment"
                  options={ASSESSMENT_OPTIONS}
                  value={draft.assessment}
                  onChange={(next) => updateDraft({ assessment: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Wie sicher bist du dir mit deiner Einordnung?</div>
                <p className={styles.lead}>Getrennt vom Signal: Sicherheit der Interpretation ist nicht dasselbe wie das Beobachtungssignal.</p>
                <OptionChips
                  name="confidence"
                  options={DEFAULT_CONFIDENCE_OPTIONS}
                  value={draft.confidence}
                  onChange={(next) => updateDraft({ confidence: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Optional: Was spricht gegen deine Adjustment-Hypothese?</div>
                <textarea
                  className={styles.textarea}
                  value={draft.counterEvidence || ''}
                  maxLength={300}
                  placeholder="z. B. Nach der Veränderung spielte gleichzeitig eine andere Reihe."
                  onChange={(event) => updateDraft({ counterEvidence: event.target.value })}
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            {draftStage !== 'before' && (
              <button type="button" className={styles.secondaryBtn} onClick={goDraftBack}>
                Zurück
              </button>
            )}
            {(isEditing || (adding && count >= cfg.minAdjustments)) && (
              <button type="button" className={styles.secondaryBtn} onClick={() => clearDraft()}>
                Abbrechen
              </button>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canAdvanceDraft(draftStage, draft)}
              onClick={goDraftNext}
            >
              {draftStage === 'assess' ? (isEditing ? 'Änderung speichern' : 'Kandidat speichern') : 'Weiter'}
            </button>
          </div>
        </section>
      )}

      {stage === 'collect' && !collecting && !noClear && (
        <div className={styles.actions}>
          {!atMax && (
            <button type="button" className={styles.secondaryBtn} onClick={startAdd}>
              + Zweite mögliche Spielanpassung hinzufügen
            </button>
          )}
          {atMin && (
            <button type="button" className={styles.primaryBtn} onClick={() => setStage('wrapup')}>
              Segment-Zusammenfassung abschließen
            </button>
          )}
        </div>
      )}

      {stage === 'collect' && count === 0 && cfg.allowNoClearAdjustment && (
        <button type="button" className={styles.ghostBtn} onClick={markNoClear}>
          Keine ausreichend gestützte Spielanpassung
        </button>
      )}

      {stage === 'wrapup' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          {noClear && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Warum keine ausreichend gestützte Spielanpassung?</div>
              <OptionChips
                name="no-clear-reason"
                options={NO_ADJUSTMENT_REASON_OPTIONS}
                value={String(safeAnswers[cfg.noClearReasonKey] || '')}
                onChange={(next) =>
                  patchAnswers(safeAnswers, setAnswers, { [cfg.noClearReasonKey]: String(next) })
                }
              />
            </div>
          )}

          {!noClear && count >= 2 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Welche mögliche Spielanpassung ist im beobachteten Segment am deutlichsten gestützt?</div>
              <OptionChips
                name="primary-adjustment"
                options={primaryOptions}
                value={String(safeAnswers[cfg.primaryAdjustmentKey] || '')}
                onChange={(next) =>
                  patchAnswers(safeAnswers, setAnswers, { [cfg.primaryAdjustmentKey]: String(next) })
                }
              />
            </div>
          )}

          {cfg.requireSegmentSummary && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                Fasse die möglichen Spielanpassungen im beobachteten Segment in 2–4 Sätzen zusammen.
              </div>
              <textarea
                className={styles.textarea}
                value={String(safeAnswers[cfg.segmentSummaryKey] || '')}
                maxLength={800}
                placeholder="Im beobachteten Drittel … Die Veränderung könnte auf … reagiert haben. Danach …"
                onChange={(event) =>
                  patchAnswers(safeAnswers, setAnswers, { [cfg.segmentSummaryKey]: event.target.value })
                }
              />
            </div>
          )}

          {cfg.requireNextWatchFocus && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Was würdest du im nächsten Segment gezielt weiter beobachten?</div>
                <OptionChips
                  name="next-watch"
                  options={nextWatchOptions}
                  value={String(safeAnswers[cfg.nextWatchKey] || '')}
                  onChange={(next) =>
                    patchAnswers(safeAnswers, setAnswers, { [cfg.nextWatchKey]: String(next) })
                  }
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>
                  Optional: Woran würdest du erkennen, dass deine Einordnung falsch war?
                </div>
                <textarea
                  className={styles.textarea}
                  value={String(safeAnswers[cfg.falsificationNoteKey] || '')}
                  maxLength={280}
                  placeholder="z. B. Wenn das alte Verhalten im nächsten Drittel unverändert zurückkehrt."
                  onChange={(event) =>
                    patchAnswers(safeAnswers, setAnswers, { [cfg.falsificationNoteKey]: event.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                if (noClear) {
                  patchAnswers(safeAnswers, setAnswers, {
                    [cfg.noClearKey]: false,
                    [cfg.noClearReasonKey]: '',
                    [cfg.stageKey]: 'collect',
                    [cfg.addingKey]: true,
                  })
                  return
                }
                setStage('collect')
              }}
            >
              Zurück
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!wrapupValid}
              onClick={() => setStage('complete')}
            >
              Segment-Zusammenfassung abschließen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
