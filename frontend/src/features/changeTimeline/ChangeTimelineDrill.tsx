import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SCENE_PERIOD_OPTIONS, formatGameTimeInput } from '../../utils/sceneHelpers'
import { ChangeTimelineSurface } from './ChangeTimelineSurface'
import {
  buildChangePointOptions,
  canSaveTimelineDraft,
  computeChangePointEvidence,
  createObservationId,
  emptyTimelineDraft,
  getAssessmentOptions,
  getComparabilityOptions,
  getDimensionOptions,
  getMagnitudeOptions,
  getRelationOptions,
  getStabilityOptions,
  getStableDimensionOptions,
  resolveChangeTimelineConfig,
  validateChangeTimelineAnswers,
} from './timelineLogic'
import { isDeviationRelation, labelForOption } from './labels'
import type { ChangeTimelineDraft, ChangeTimelineObservation } from './types'
import styles from './ChangeTimelineDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function patchAnswers(
  answers: Record<string, any>,
  setAnswers: (next: Record<string, any>) => void,
  patch: Record<string, any>,
) {
  setAnswers({ ...(answers || {}), ...patch })
}

export function ChangeTimelineDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveChangeTimelineConfig(drill?.config || {})
  const observations: ChangeTimelineObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: ChangeTimelineDraft = {
    ...emptyTimelineDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const count = observations.length
  const atMax = count >= cfg.maxObservations
  const atMin = count >= cfg.minObservations
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < count
  const collecting = isEditing || count < cfg.minObservations || (addingMore && !atMax)
  const showAssess = atMin && !collecting
  const isComplete = String(safeAnswers.__change_timeline_stage || '') === 'complete'

  const focus = String(safeAnswers[cfg.focusKey] || '')
  const baseline = String(safeAnswers[cfg.baselineKey] || '')
  const changePointId = String(safeAnswers[cfg.changePointKey] || '')
  const stableDimensions = Array.isArray(safeAnswers[cfg.stableDimensionsKey])
    ? safeAnswers[cfg.stableDimensionsKey]
    : []

  const evidence = useMemo(
    () => computeChangePointEvidence(observations, changePointId || undefined),
    [observations, changePointId],
  )

  const changePointOptions = useMemo(
    () => buildChangePointOptions(observations),
    [observations],
  )

  const updateDraft = (patch: Partial<ChangeTimelineDraft>) => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyTimelineDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
    })
  }

  const saveObservation = () => {
    if (!canSaveTimelineDraft(draft, cfg.supportsGameClock)) return
    if (!String(focus).trim()) return

    const nextObs: ChangeTimelineObservation = {
      id: isEditing ? observations[editIndex!].id : createObservationId(),
      order: isEditing ? observations[editIndex!].order : count + 1,
      period: draft.period || undefined,
      gameClock: draft.gameClock.trim() || undefined,
      relationToBaseline: draft.relationToBaseline as ChangeTimelineObservation['relationToBaseline'],
      changedDimension: isDeviationRelation(draft.relationToBaseline)
        ? (draft.changedDimension as ChangeTimelineObservation['changedDimension'])
        : undefined,
      description: String(draft.description || '').trim(),
      createdAt: isEditing
        ? observations[editIndex!].createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }

    let nextLogs: ChangeTimelineObservation[]
    if (isEditing) {
      nextLogs = observations.map((obs, idx) => (idx === editIndex ? nextObs : obs))
    } else {
      if (atMax) return
      nextLogs = [...observations, nextObs].map((obs, idx) => ({ ...obs, order: idx + 1 }))
    }

    clearDraft({
      [cfg.logsKey]: nextLogs,
      __change_timeline_stage: '',
    })
  }

  const startEdit = (index: number) => {
    const obs = observations[index]
    if (!obs) return
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.editIndexKey]: index,
      [cfg.draftKey]: {
        period: obs.period || '',
        gameClock: obs.gameClock || '',
        relationToBaseline: obs.relationToBaseline || '',
        changedDimension: obs.changedDimension || '',
        description: obs.description || '',
      },
      __change_timeline_stage: '',
    })
  }

  const removeObservation = (index: number) => {
    const removed = observations[index]
    const nextLogs = observations
      .filter((_, idx) => idx !== index)
      .map((obs, idx) => ({ ...obs, order: idx + 1 }))
    const clearingEdit = editIndex === index
    const clearChangePoint = removed && changePointId === removed.id
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: nextLogs,
      ...(clearChangePoint ? { [cfg.changePointKey]: '' } : {}),
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyTimelineDraft(), [cfg.editIndexKey]: null }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
      __change_timeline_stage: '',
    })
  }

  const guide = drill?.didactics?.observation_guide
  const progressLabel = `${count} / ${cfg.maxObservations} Beobachtungen`
  const progressPercent = Math.min(100, Math.round((count / cfg.maxObservations) * 100))
  const showBaselineField = count >= cfg.baselineAfterCount || Boolean(baseline.trim())

  if (isComplete) {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Change Timeline abgeschlossen</span>
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Beobachtungsfokus</div>
          <p className={styles.resultValue}>{focus}</p>
        </div>
        <ChangeTimelineSurface
          observations={observations}
          changePointId={changePointId}
        />
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Ausgangsbeobachtungen</div>
          <p className={styles.resultValue}>{baseline}</p>
        </div>
        {evidence && (
          <div className={styles.evidence}>
            <div>Vor möglichem Veränderungszeitpunkt: {evidence.beforeCount} Beobachtungen · {evidence.beforeBaselineCount}× Ausgangsbeobachtungen</div>
            <div>
              Nach möglichem Veränderungszeitpunkt: {evidence.afterCount} Beobachtungen · {evidence.afterDeviationCount}× abweichend/neu · {evidence.afterBaselineCount}× Ausgangsbeobachtungen
            </div>
          </div>
        )}
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Einschätzung</div>
          <p className={styles.resultValue}>
            {labelForOption(getAssessmentOptions(), String(safeAnswers[cfg.assessmentKey] || ''))}
          </p>
        </div>
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Deine Zusammenfassung</div>
          <p className={styles.resultValue}>{safeAnswers[cfg.summaryKey]}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => patchAnswers(safeAnswers, setAnswers, { __change_timeline_stage: '' })}
          >
            Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Change Timeline</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}

      <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>Welches Verhalten möchtest du über Zeit beobachten?</div>
          <textarea
            className={styles.textarea}
            value={focus}
            maxLength={300}
            placeholder="z. B. Wie früh greift die erste defensive Linie beim gegnerischen Entry zu?"
            onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.focusKey]: event.target.value })}
          />
        </div>
      </section>

      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span>{progressLabel}</span>
          {atMin && <span>Genug Material für eine erste Einschätzung</span>}
        </div>
        <div className={styles.progressBar} aria-hidden>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <ChangeTimelineSurface
        observations={observations}
        changePointId={changePointId}
        onEdit={collecting || showAssess ? startEdit : undefined}
        onRemove={collecting || showAssess ? removeObservation : undefined}
      />

      {showBaselineField && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was wirkt aktuell wie das Ausgangsverhalten?</div>
            <textarea
              className={styles.textarea}
              value={baseline}
              maxLength={500}
              placeholder="z. B. Die erste Linie greift Entries früh an der Blue Line an."
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.baselineKey]: event.target.value })}
            />
          </div>
        </section>
      )}

      {collecting && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.title}>
            {isEditing ? `Beobachtung ${editIndex! + 1} bearbeiten` : `Situation ${count + 1} speichern`}
          </h3>

          {cfg.supportsGameClock && (
            <div className={styles.row2}>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Drittel (optional)</div>
                <select
                  className={styles.select}
                  value={draft.period}
                  onChange={(event) => updateDraft({ period: event.target.value })}
                >
                  <option value="">—</option>
                  {SCENE_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Spieluhr (optional)</div>
                <input
                  className={styles.input}
                  value={draft.gameClock}
                  placeholder="z. B. 12:43"
                  onChange={(event) => updateDraft({ gameClock: formatGameTimeInput(event.target.value) })}
                />
              </div>
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie verhält sich das Team hier im Vergleich zum bisherigen Ausgangsmuster?</div>
            <OptionChips
              name="relationToBaseline"
              options={getRelationOptions()}
              value={draft.relationToBaseline}
              onChange={(next) => updateDraft({
                relationToBaseline: String(next),
                changedDimension: isDeviationRelation(String(next)) ? draft.changedDimension : '',
              })}
            />
          </div>

          {isDeviationRelation(draft.relationToBaseline) && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Was verändert sich hauptsächlich?</div>
              <OptionChips
                name="changedDimension"
                options={getDimensionOptions()}
                value={draft.changedDimension}
                onChange={(next) => updateDraft({ changedDimension: String(next) })}
              />
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was siehst du konkret?</div>
            <textarea
              className={styles.textarea}
              value={draft.description}
              maxLength={400}
              placeholder="Kurzer Satz zur Situation …"
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!String(focus).trim() || !canSaveTimelineDraft(draft, cfg.supportsGameClock)}
              onClick={saveObservation}
            >
              {isEditing ? 'Beobachtung speichern' : 'Beobachtung speichern'}
            </button>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => clearDraft()}
              >
                Abbrechen
              </button>
            )}
          </div>
        </section>
      )}

      {atMin && !collecting && (
        <div className={styles.actions}>
          {!atMax && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.addingMoreKey]: true })}
            >
              + Weitere Beobachtung
            </button>
          )}
        </div>
      )}

      {showAssess && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.title}>Veränderung über Zeit einschätzen</h3>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Ab welcher Beobachtung beginnt deiner Einschätzung nach ein neues Verhalten?</div>
            <OptionChips
              name="changePoint"
              options={changePointOptions}
              value={changePointId}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.changePointKey]: next })}
            />
          </div>

          {evidence && (
            <div className={styles.evidence}>
              <div>Vor möglichem Veränderungszeitpunkt: {evidence.beforeCount} Beobachtungen · {evidence.beforeBaselineCount}× Ausgangsbeobachtungen</div>
              <div>
                Nach möglichem Veränderungszeitpunkt: {evidence.afterCount} Beobachtungen · {evidence.afterDeviationCount}× abweichend/neu · {evidence.afterBaselineCount}× Ausgangsbeobachtungen
              </div>
            </div>
          )}

          {changePointId
            && !['no_clear_change_point', 'too_variable', 'unclear'].includes(changePointId) && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Wie stabil bleibt das neue Verhalten danach?</div>
              <OptionChips
                name="stability"
                options={getStabilityOptions()}
                value={safeAnswers[cfg.stabilityKey] || ''}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.stabilityKey]: next })}
              />
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie deutlich unterscheidet sich das Verhalten vor und nach dem möglichen Veränderungszeitpunkt?</div>
            <OptionChips
              name="magnitude"
              options={getMagnitudeOptions()}
              value={safeAnswers[cfg.changeMagnitudeKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.changeMagnitudeKey]: next })}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Waren die Situationen vor und nach dem möglichen Veränderungszeitpunkt ausreichend vergleichbar?</div>
            <OptionChips
              name="comparability"
              options={getComparabilityOptions()}
              value={safeAnswers[cfg.comparabilityKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.comparabilityKey]: next })}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie würdest du die zeitliche Veränderung einordnen?</div>
            <OptionChips
              name="assessment"
              options={getAssessmentOptions()}
              value={safeAnswers[cfg.assessmentKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.assessmentKey]: next })}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was blieb trotz der Veränderung stabil?</div>
            <OptionChips
              name="stableDimensions"
              options={getStableDimensionOptions()}
              multi
              selectedValues={stableDimensions}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.stableDimensionsKey]: next })}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Beschreibe die zeitliche Veränderung in 1–2 Sätzen</div>
            <textarea
              className={styles.textarea}
              value={safeAnswers[cfg.summaryKey] || ''}
              maxLength={1500}
              placeholder="In den ersten … Situationen … Ab der … Beobachtung …"
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.summaryKey]: event.target.value })}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={Boolean(validateChangeTimelineAnswers(cfg, {
                ...safeAnswers,
                [cfg.logsKey]: observations,
              }))}
              onClick={() => {
                const error = validateChangeTimelineAnswers(cfg, {
                  ...safeAnswers,
                  [cfg.logsKey]: observations,
                })
                if (error) return
                patchAnswers(safeAnswers, setAnswers, { __change_timeline_stage: 'complete' })
              }}
            >
              Auswertung abschließen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
