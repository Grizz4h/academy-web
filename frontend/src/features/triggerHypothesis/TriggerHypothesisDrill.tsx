import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import {
  getAlternativeOptions,
  getConfidenceOptions,
  getEvidenceOptions,
  getLinkStrengthOptions,
  getPriorProblemOptions,
  getProblemFitOptions,
  getTriggerTypeOptions,
  resolveTriggerHypothesisConfig,
  validateTriggerHypothesisAnswers,
} from './hypothesisLogic'
import { groupOptions, labelForOption } from './labels'
import { TriggerHypothesisSurface } from './TriggerHypothesisSurface'
import type { HypothesisExamplesHelp, TriggerHypothesisStage } from './types'
import styles from './TriggerHypothesisDrill.module.css'

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

function ExamplesAccordion({ help }: { help: HypothesisExamplesHelp }) {
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

function canAdvance(
  stage: TriggerHypothesisStage,
  cfg: ReturnType<typeof resolveTriggerHypothesisConfig>,
  answers: Record<string, any>,
): boolean {
  if (stage === 'change') {
    return Boolean(String(answers[cfg.observedChangeKey] || '').trim())
  }
  if (stage === 'problem') {
    return Boolean(answers[cfg.priorProblemKey] && answers[cfg.triggerTypeKey])
  }
  if (stage === 'evidence') {
    const evidence = Array.isArray(answers[cfg.evidenceKey]) ? answers[cfg.evidenceKey] : []
    return evidence.length > 0
  }
  if (stage === 'alternative') {
    return !cfg.requireAlternativeExplanation || Boolean(answers[cfg.alternativeExplanationKey])
  }
  if (stage === 'assess') {
    return validateTriggerHypothesisAnswers(cfg, answers) === null
  }
  return false
}

const STAGE_ORDER: TriggerHypothesisStage[] = [
  'change',
  'problem',
  'evidence',
  'alternative',
  'assess',
  'complete',
]

export function TriggerHypothesisDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveTriggerHypothesisConfig(drill?.config || {})
  const stage = (safeAnswers[cfg.stageKey] || 'change') as TriggerHypothesisStage

  const evidence = Array.isArray(safeAnswers[cfg.evidenceKey])
    ? (safeAnswers[cfg.evidenceKey] as string[])
    : []

  const setStage = (next: TriggerHypothesisStage) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: next })
  }

  const goNext = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return
    if (!canAdvance(stage, cfg, safeAnswers)) return
    setStage(STAGE_ORDER[idx + 1])
  }

  const goBack = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx <= 0) return
    setStage(STAGE_ORDER[idx - 1])
  }

  const guide = drill?.didactics?.observation_guide
  const priorGroups = groupOptions(getPriorProblemOptions())

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Anpassungshypothese formuliert</span>
        <TriggerHypothesisSurface
          result={{
            observedChange: String(safeAnswers[cfg.observedChangeKey] || ''),
            priorProblem: String(safeAnswers[cfg.priorProblemKey] || ''),
            priorProblemDetail: String(safeAnswers[cfg.priorProblemDetailKey] || '') || undefined,
            triggerType: String(safeAnswers[cfg.triggerTypeKey] || ''),
            evidence,
            alternativeExplanation: String(safeAnswers[cfg.alternativeExplanationKey] || ''),
            alternativeDetail: String(safeAnswers[cfg.alternativeDetailKey] || '') || undefined,
            problemFit: String(safeAnswers[cfg.problemFitKey] || ''),
            linkStrength: String(safeAnswers[cfg.linkStrengthKey] || ''),
            functionalLink: String(safeAnswers[cfg.functionalLinkKey] || ''),
            hypothesisSummary: String(safeAnswers[cfg.hypothesisSummaryKey] || ''),
            confidence: String(safeAnswers[cfg.confidenceKey] || ''),
          }}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('change')}>
            Veränderung bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('problem')}>
            Problem / Trigger bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('evidence')}>
            Evidenz bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('assess')}>
            Hypothese bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Trigger Hypothesis</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {cfg.examplesHelp && <ExamplesAccordion help={cfg.examplesHelp} />}
      {guide && <DrillGuideCard guide={guide} />}

      {stage === 'change' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welche Veränderung hast du beobachtet?</div>
            <p className={styles.lead}>Kurzer Vorher→Nachher-Satz. Noch keine Ursache.</p>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.observedChangeKey] || '')}
              maxLength={500}
              placeholder="z. B. Die erste Forecheck-Linie greift später deutlich tiefer an."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.observedChangeKey]: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'problem' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Welche vorherige Herausforderung / Interaktion oder gegnerische Verhalten trat vor der Veränderung wiederholt auf?
            </div>
            {priorGroups.map((group) => (
              <div key={group.group} className={styles.fieldBlock}>
                <p className={styles.groupLabel}>{group.group}</p>
                <OptionChips
                  name={`prior-problem-${group.group}`}
                  options={group.options}
                  value={String(safeAnswers[cfg.priorProblemKey] || '')}
                  onChange={(next) =>
                    patchAnswers(safeAnswers, setAnswers, { [cfg.priorProblemKey]: String(next) })
                  }
                />
              </div>
            ))}
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Problem kurz konkretisieren</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.priorProblemDetailKey] || '')}
              maxLength={300}
              placeholder="z. B. Gegner überspielt F1 mehrfach mit kurzem Pass durch die Mitte."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.priorProblemDetailKey]: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welche Art von Trigger könnte dahinterstecken?</div>
            <p className={styles.lead}>Deine Hypothese — wird nicht aus der Kategorie abgeleitet.</p>
            <OptionChips
              name="trigger-type"
              options={getTriggerTypeOptions()}
              value={String(safeAnswers[cfg.triggerTypeKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.triggerTypeKey]: String(next) })
              }
            />
          </div>
        </section>
      )}

      {stage === 'evidence' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Was spricht dafür, dass genau darauf reagiert wurde?
            </div>
            <p className={styles.lead}>
              Mehrfachauswahl. „Nur zeitlicher Zusammenhang“ allein beweist noch keine Ursache.
            </p>
            <OptionChips
              name="trigger-evidence"
              multi
              options={getEvidenceOptions()}
              selectedValues={evidence}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, {
                  [cfg.evidenceKey]: Array.isArray(next) ? next : [String(next)],
                })
              }
            />
            {evidence.length > 0 && (
              <p className={styles.lead}>
                Ausgewählt: {evidence.length} Indiz
                {evidence.length === 1 ? '' : 'ien'} — die Stärke des Zusammenhangs entscheidest du später selbst.
              </p>
            )}
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Beispiel vor der Veränderung</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers.problemExample || '')}
              maxLength={280}
              placeholder="Was trat wiederholt auf?"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { problemExample: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Beispiel nach der Veränderung</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers.changeExample || '')}
              maxLength={280}
              placeholder="Was sieht jetzt anders aus?"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { changeExample: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'alternative' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welche andere Erklärung wäre ebenfalls plausibel?</div>
            <p className={styles.lead}>
              Verhindert die automatische Story „Problem → Änderung = Coach-Reaktion“.
            </p>
            <OptionChips
              name="alternative-explanation"
              options={getAlternativeOptions()}
              value={String(safeAnswers[cfg.alternativeExplanationKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, {
                  [cfg.alternativeExplanationKey]: String(next),
                })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Alternative kurz beschreiben</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.alternativeDetailKey] || '')}
              maxLength={300}
              placeholder="z. B. Andere eigene Reihe auf dem Eis."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.alternativeDetailKey]: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'assess' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          {(safeAnswers.problemExample || safeAnswers.changeExample) && (
            <div className={styles.fieldBlock}>
              <p className={styles.groupLabel}>Evidence Pairing</p>
              <p className={styles.lead}>
                <strong>PROBLEM:</strong> {String(safeAnswers.problemExample || '—')}
              </p>
              <p className={styles.lead}>↓ mögliche Reaktion</p>
              <p className={styles.lead}>
                <strong>VERÄNDERUNG:</strong> {String(safeAnswers.changeExample || '—')}
              </p>
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Adressiert die Veränderung überhaupt das zuvor beobachtete Problem?
            </div>
            <OptionChips
              name="problem-fit"
              options={getProblemFitOptions()}
              value={String(safeAnswers[cfg.problemFitKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemFitKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Wie stark ist der Zusammenhang zwischen Problem und Veränderung?
            </div>
            <p className={styles.lead}>Du entscheidest — nicht die Anzahl der Indizien.</p>
            <OptionChips
              name="link-strength"
              options={getLinkStrengthOptions()}
              value={String(safeAnswers[cfg.linkStrengthKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.linkStrengthKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Welche funktionale Passung siehst du — oder ist keine ausreichende Verbindung erkennbar?
            </div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.functionalLinkKey] || '')}
              maxLength={500}
              placeholder="z. B. Der tiefere erste Forechecker könnte weniger Raum hinter sich lassen und den Entry früher nach außen zwingen."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.functionalLinkKey]: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Anpassungshypothese (Weil …, könnte …, um …)</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.hypothesisSummaryKey] || '')}
              maxLength={700}
              placeholder="Weil …, könnte das Team … verändert haben, um …"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, {
                  [cfg.hypothesisSummaryKey]: event.target.value,
                })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie sicher bist du dir?</div>
            <p className={styles.lead}>
              Getrennt vom Zusammenhang: Confidence = Sicherheit in deiner Einschätzung.
              {safeAnswers[cfg.linkStrengthKey]
                ? ` Aktueller Zusammenhang: ${labelForOption(getLinkStrengthOptions(), String(safeAnswers[cfg.linkStrengthKey]))}.`
                : ''}
            </p>
            <OptionChips
              name="hypothesis-confidence"
              options={getConfidenceOptions()}
              value={String(safeAnswers[cfg.confidenceKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.confidenceKey]: String(next) })
              }
            />
          </div>
        </section>
      )}

      <div className={styles.actions}>
        {stage !== 'change' && (
          <button type="button" className={styles.secondaryBtn} onClick={goBack}>
            Zurück
          </button>
        )}
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!canAdvance(stage, cfg, safeAnswers)}
          onClick={goNext}
        >
          {stage === 'assess' ? 'Hypothese abschließen' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}
