import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { CohortRateComparison } from '../cohortRateCompare/CohortRateComparison'
import { ConditionOutcomeMatrix } from '../conditionalOutcome/ConditionOutcomeMatrix'
import { EvidenceAssessmentPanel } from './EvidenceAssessmentPanel'
import {
  DEFAULT_NEXT_EVIDENCE_OPTIONS,
  DEFAULT_WEAKENING_OPTIONS,
  EVIDENCE_CASE_STEPS,
  emptyAssessment,
  evidenceDimensions,
  evidenceStrengthOptions,
  findStatement,
  groupsFromSample,
  isCaseAssessmentComplete,
  microfeedbackOptions,
  overallFeedback,
  readAssessments,
  readCaseStep,
  readEvidenceStage,
  resolveEvidenceAssessmentConfig,
  statementToneExplanation,
  validateEvidenceAssessmentAnswers,
} from './evidenceLogic'
import type {
  EvidenceAssessment,
  EvidenceAssessmentStage,
  EvidenceCaseDefinition,
  EvidenceCaseStep,
  EvidenceDimensionId,
} from './types'
import rateStyles from '../opportunityRate/OpportunityRateDrill.module.css'
import styles from './EvidenceAssessmentDrill.module.css'

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

function SampleVisual({ caseDef }: { caseDef: EvidenceCaseDefinition }) {
  const sample = caseDef.sample
  const groups = groupsFromSample(sample)
  return (
    <div className={rateStyles.resultStack}>
      <span className={styles.practiceTag}>Übungsfall</span>
      <div className={rateStyles.resultBlock}>
        <div className={rateStyles.resultLabel}>Aussage</div>
        <p className={rateStyles.resultValue}>{caseDef.statement}</p>
      </div>
      {sample.matrix && (
        <ConditionOutcomeMatrix
          conditionLabel={sample.conditionLabel || 'Bedingung'}
          targetLabel={sample.targetLabel || 'Zielereignis'}
          matrix={sample.matrix}
        />
      )}
      {groups && (
        <CohortRateComparison
          title="Beobachtete Raten"
          groupA={groups[0]}
          groupB={groups[1]}
          percentagePointDifference={sample.differencePercentagePoints || 0}
          sampleImbalance={groups[0].totalOpportunities !== groups[1].totalOpportunities}
          showPercents
        />
      )}
      <p className={rateStyles.fieldHelp}>n = {sample.sampleSize} Opportunities</p>
      {caseDef.contextNotes && caseDef.contextNotes.length > 0 && (
        <ul className={styles.notes}>
          {caseDef.contextNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function EvidenceAssessmentDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveEvidenceAssessmentConfig(drill?.config || {})
  const stage = readEvidenceStage(safeAnswers, cfg.stageKey)
  const step = readCaseStep(safeAnswers, cfg.stepKey)
  const assessments = readAssessments(safeAnswers, cfg.assessmentsKey)
  const caseIndex = Math.min(
    cfg.cases.length - 1,
    Math.max(0, Number(safeAnswers[cfg.caseIndexKey] || 0)),
  )
  const caseDef = cfg.cases[caseIndex]
  const assessment = assessments[caseDef?.id] || emptyAssessment(caseDef?.id)
  const guide = drill?.didactics?.observation_guide
  const isComplete = stage === 'complete'

  const setStage = (next: EvidenceAssessmentStage, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, { ...extra, [cfg.stageKey]: next })
  }

  const writeAssessment = (next: EvidenceAssessment, extra: Record<string, any> = {}) => {
    if (!caseDef) return
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.assessmentsKey]: { ...assessments, [caseDef.id]: { ...next, caseId: caseDef.id } },
    })
  }

  const goStep = (next: EvidenceCaseStep) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stepKey]: next })
  }

  const currentStepIndex = EVIDENCE_CASE_STEPS.indexOf(step)

  const canAdvanceStep = () => {
    const dims = assessment.dimensions
    if (step === 'sample') return Boolean(dims.sampleStrength)
    if (step === 'comparability') return Boolean(dims.comparability)
    if (step === 'counterexamples') return Boolean(dims.counterexamples)
    if (step === 'difference') return Boolean(dims.differenceClarity)
    if (step === 'definition') return Boolean(dims.definitionClarity)
    if (step === 'overall') return Boolean(assessment.overallStrength)
    if (step === 'statements') {
      const supported = Boolean(assessment.strongestSupportedStatement && assessment.tooStrongStatement)
      if (!supported) return false
      if (cfg.userStatementMinChars > 0) {
        return String(assessment.userStatement || '').trim().length >= cfg.userStatementMinChars
      }
      return true
    }
    return Boolean(String(assessment.evidenceNeededNext || '').trim())
  }

  const advance = () => {
    if (!canAdvanceStep()) return
    if (currentStepIndex < EVIDENCE_CASE_STEPS.length - 1) {
      goStep(EVIDENCE_CASE_STEPS[currentStepIndex + 1])
      return
    }
    if (caseIndex < cfg.cases.length - 1) {
      patchAnswers(safeAnswers, setAnswers, {
        [cfg.caseIndexKey]: caseIndex + 1,
        [cfg.stepKey]: 'sample',
        [cfg.stageKey]: 'assess',
      })
      return
    }
    setStage('review')
  }

  if (isComplete) {
    return (
      <div className={rateStyles.drillRoot}>
        <span className={rateStyles.completeBadge}>✓ Tragfähigkeitsprüfung abgeschlossen</span>
        <ReviewBlock
          cfgCases={cfg.cases}
          assessments={assessments}
          userStatementMinChars={cfg.userStatementMinChars}
        />
        <div className={rateStyles.actions}>
          <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('review')}>
            Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={rateStyles.drillRoot}>
      <p className={rateStyles.eyebrow}>Wie stark trägt die Evidenz?</p>
      <h2 className={rateStyles.title}>{drill.title}</h2>
      {drill.description && <p className={rateStyles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={rateStyles.lead}>{drill.didactics.explanation}</p>}
      <p className={rateStyles.rule}>{cfg.decisionRule}</p>
      <p className={rateStyles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}

      {stage === 'intro' && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Vier Übungsfälle</h3>
          <p className={rateStyles.lead}>
            Du bewertest vorbereitete Mini-Stichproben – nicht ein neues Live-Erfassung.
            Kein p-Wert, kein Score, keine Scheingenauigkeit.
          </p>
          <p className={rateStyles.fieldHelp}>{cfg.sampleLimitNote}</p>
          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              onClick={() => setStage('assess', { [cfg.caseIndexKey]: 0, [cfg.stepKey]: 'sample' })}
            >
              Ersten Fall ansehen
            </button>
          </div>
        </section>
      )}

      {stage === 'assess' && caseDef && (
        <div className={styles.layout}>
          <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
            <h3 className={rateStyles.panelTitle}>
              Fall {caseIndex + 1} / {cfg.cases.length}: {caseDef.title}
            </h3>
            <SampleVisual caseDef={caseDef} />
          </section>

          <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
            <EvidenceAssessmentPanel assessment={assessment} compact />
            <CaseStepFields
              caseDef={caseDef}
              assessment={assessment}
              step={step}
              statementHint={cfg.statementHint}
              userStatementMinChars={cfg.userStatementMinChars}
              onChange={writeAssessment}
            />
            <div className={rateStyles.actions}>
              <button
                type="button"
                className={rateStyles.primaryBtn}
                disabled={!canAdvanceStep()}
                onClick={advance}
              >
                {step === 'next_evidence' && caseIndex === cfg.cases.length - 1
                  ? 'Zur Übersicht'
                  : step === 'next_evidence'
                    ? 'Nächster Fall'
                    : 'Weiter'}
              </button>
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  className={rateStyles.secondaryBtn}
                  onClick={() => goStep(EVIDENCE_CASE_STEPS[currentStepIndex - 1])}
                >
                  Zurück
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {stage === 'review' && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Deine Tragfähigkeits-Checks</h3>
          <ReviewBlock
          cfgCases={cfg.cases}
          assessments={assessments}
          userStatementMinChars={cfg.userStatementMinChars}
        />
          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welche Dimension hat deine Einschätzung der Evidenz am stärksten verändert?</div>
            <OptionChips
              name="evidenceMicrofeedback"
              options={microfeedbackOptions()}
              value={safeAnswers[cfg.microfeedbackKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.microfeedbackKey]: next })}
            />
          </div>
          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Warum? (optional)</div>
            <textarea
              className={rateStyles.textarea}
              value={safeAnswers[cfg.microfeedbackNoteKey] || ''}
              maxLength={240}
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.microfeedbackNoteKey]: event.target.value })}
            />
          </div>
          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              disabled={Boolean(validateEvidenceAssessmentAnswers(cfg, {
                ...safeAnswers,
                [cfg.assessmentsKey]: assessments,
              }))}
              onClick={() => {
                const error = validateEvidenceAssessmentAnswers(cfg, {
                  ...safeAnswers,
                  [cfg.assessmentsKey]: assessments,
                })
                if (error) return
                setStage('complete')
              }}
            >
              Assessment abschließen
            </button>
            <button
              type="button"
              className={rateStyles.secondaryBtn}
              onClick={() => setStage('assess', { [cfg.stepKey]: 'next_evidence' })}
            >
              Zurück zu den Fällen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function CaseStepFields({
  caseDef,
  assessment,
  step,
  statementHint,
  userStatementMinChars,
  onChange,
}: {
  caseDef: EvidenceCaseDefinition
  assessment: EvidenceAssessment
  step: EvidenceCaseStep
  statementHint: string
  userStatementMinChars: number
  onChange: (next: EvidenceAssessment) => void
}) {
  const setDimension = (id: EvidenceDimensionId, value: string) => {
    const dimensions = { ...assessment.dimensions }
    if (id === 'sample') dimensions.sampleStrength = value as EvidenceAssessment['dimensions']['sampleStrength']
    if (id === 'comparability') dimensions.comparability = value as EvidenceAssessment['dimensions']['comparability']
    if (id === 'counterexamples') dimensions.counterexamples = value as EvidenceAssessment['dimensions']['counterexamples']
    if (id === 'difference') dimensions.differenceClarity = value as EvidenceAssessment['dimensions']['differenceClarity']
    if (id === 'definition') dimensions.definitionClarity = value as EvidenceAssessment['dimensions']['definitionClarity']
    onChange({ ...assessment, dimensions })
  }

  const dimension = evidenceDimensions().find((item) => item.id === step)
  if (dimension) {
    const value = (
      dimension.id === 'sample' ? assessment.dimensions.sampleStrength
        : dimension.id === 'comparability' ? assessment.dimensions.comparability
          : dimension.id === 'counterexamples' ? assessment.dimensions.counterexamples
            : dimension.id === 'difference' ? assessment.dimensions.differenceClarity
              : assessment.dimensions.definitionClarity
    ) || ''
    return (
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>{dimension.question}</div>
        {dimension.help && <p className={rateStyles.fieldHelp}>{dimension.help}</p>}
        <OptionChips
          name={`evidence-${dimension.id}`}
          options={dimension.options}
          value={value}
          onChange={(next) => setDimension(dimension.id, String(next))}
        />
      </div>
    )
  }

  if (step === 'overall') {
    const feedback = overallFeedback(caseDef, assessment.overallStrength)
    return (
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Wie tragfähig ist die Beobachtungsgrundlage insgesamt für die Aussage?</div>
        <p className={rateStyles.fieldHelp}>Du entscheidest qualitativ. Die App rechnet daraus keinen Score und keinen p-Wert.</p>
        <OptionChips
          name="evidence-overall"
          options={evidenceStrengthOptions()}
          value={assessment.overallStrength || ''}
          onChange={(next) => onChange({ ...assessment, overallStrength: next as EvidenceAssessment['overallStrength'] })}
        />
        {feedback && <p className={styles.feedback}>{feedback}</p>}
      </div>
    )
  }

  if (step === 'statements') {
    const supported = findStatement(caseDef, assessment.strongestSupportedStatement)
    const tooStrong = findStatement(caseDef, assessment.tooStrongStatement)
    return (
      <>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Welche Aussage wäre mit dieser Evidenz noch vertretbar?</div>
          <p className={rateStyles.fieldHelp}>{statementHint}</p>
          <OptionChips
            name="evidence-supported"
            options={caseDef.statements.map((item) => ({ value: item.id, label: item.text }))}
            value={assessment.strongestSupportedStatement || ''}
            onChange={(next) => onChange({ ...assessment, strongestSupportedStatement: String(next) })}
          />
          {supported && <p className={styles.feedback}>{statementToneExplanation(supported.tone)}</p>}
        </div>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Welche Aussage wäre bereits zu stark?</div>
          <OptionChips
            name="evidence-too-strong"
            options={caseDef.statements.map((item) => ({ value: item.id, label: item.text }))}
            value={assessment.tooStrongStatement || ''}
            onChange={(next) => onChange({ ...assessment, tooStrongStatement: String(next) })}
          />
          {tooStrong && <p className={styles.feedback}>{statementToneExplanation(tooStrong.tone)}</p>}
        </div>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>
            Formuliere selbst eine Aussage, die zur Tragfähigkeit der Beobachtungsgrundlage passt.
            {userStatementMinChars > 0 ? '' : ' (empfohlen)'}
          </div>
          <textarea
            className={rateStyles.textarea}
            value={assessment.userStatement || ''}
            maxLength={320}
            placeholder="In dieser Stichprobe … Die Sample Size begrenzt aber …"
            onChange={(event) => onChange({ ...assessment, userStatement: event.target.value })}
          />
          {userStatementMinChars > 0 && (
            <p className={rateStyles.fieldHelp}>
              {String(assessment.userStatement || '').trim().length}/320 · mind. {userStatementMinChars} Zeichen
            </p>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Welche zusätzliche Beobachtung würde die Aussage am stärksten verbessern?</div>
        <OptionChips
          name="evidence-next"
          options={caseDef.nextEvidenceOptions || DEFAULT_NEXT_EVIDENCE_OPTIONS}
          value={assessment.evidenceNeededNext || ''}
          onChange={(next) => onChange({ ...assessment, evidenceNeededNext: String(next) })}
        />
      </div>
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Was würde deine Aussage schwächen? (optional)</div>
        <OptionChips
          name="evidence-weaken"
          options={caseDef.weakeningOptions || DEFAULT_WEAKENING_OPTIONS}
          value={assessment.weakeningEvidence || ''}
          onChange={(next) => onChange({ ...assessment, weakeningEvidence: String(next) })}
        />
      </div>
    </>
  )
}

function ReviewBlock({
  cfgCases,
  assessments,
  userStatementMinChars = 0,
}: {
  cfgCases: EvidenceCaseDefinition[]
  assessments: Record<string, EvidenceAssessment>
  userStatementMinChars?: number
}) {
  return (
    <div className={styles.reviewList}>
      {cfgCases.map((caseDef) => {
        const item = assessments[caseDef.id] || emptyAssessment(caseDef.id)
        const supported = findStatement(caseDef, item.strongestSupportedStatement)
        const nextLabel = (caseDef.nextEvidenceOptions || DEFAULT_NEXT_EVIDENCE_OPTIONS)
          .find((opt) => opt.value === item.evidenceNeededNext)?.label
        const strengthLabel = evidenceStrengthOptions().find((opt) => opt.value === item.overallStrength)?.label
        return (
          <div key={caseDef.id} className={rateStyles.resultStack}>
            <div className={rateStyles.resultBlock}>
              <div className={rateStyles.resultLabel}>{caseDef.title}</div>
              <p className={rateStyles.resultValue}>{caseDef.statement}</p>
            </div>
            <SampleVisual caseDef={caseDef} />
            <EvidenceAssessmentPanel assessment={item} />
            {strengthLabel && (
              <div className={rateStyles.resultBlock}>
                <div className={rateStyles.resultLabel}>Gesamtevidenz</div>
                <p className={rateStyles.resultValue}>{strengthLabel}</p>
              </div>
            )}
            {supported && (
              <div className={rateStyles.resultBlock}>
                <div className={rateStyles.resultLabel}>Vertretbare Aussage</div>
                <p className={rateStyles.resultValue}>{supported.text}</p>
              </div>
            )}
            {item.userStatement && (
              <div className={rateStyles.resultBlock}>
                <div className={rateStyles.resultLabel}>Deine Formulierung</div>
                <p className={rateStyles.resultValue}>{item.userStatement}</p>
              </div>
            )}
            {nextLabel && (
              <div className={rateStyles.resultBlock}>
                <div className={rateStyles.resultLabel}>Was fehlt noch?</div>
                <p className={rateStyles.resultValue}>{nextLabel}</p>
              </div>
            )}
            {!isCaseAssessmentComplete(item, userStatementMinChars) && (
              <p className={rateStyles.fieldHelp}>Dieser Fall ist noch nicht vollständig bewertet.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
