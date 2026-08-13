import {
  ALTERNATIVE_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  EVIDENCE_OPTIONS,
  LINK_STRENGTH_OPTIONS,
  PRIOR_PROBLEM_OPTIONS,
  PROBLEM_FIT_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
  labelForOption,
  labelsForValues,
} from './labels'
import styles from './TriggerHypothesisSurface.module.css'

export type HypothesisResultView = {
  observedChange: string
  priorProblem: string
  priorProblemDetail?: string
  triggerType: string
  evidence: string[]
  alternativeExplanation: string
  alternativeDetail?: string
  problemFit: string
  linkStrength: string
  functionalLink: string
  hypothesisSummary: string
  confidence: string
}

type Props = {
  title?: string
  result: HypothesisResultView
}

export function TriggerHypothesisSurface({
  title = 'Mögliche Adjustment-Hypothese',
  result,
}: Props) {
  return (
    <section className={`${styles.surface} ui-flat-mobile mobile-flatten-card`}>
      <div>
        <h4 className={styles.header}>{title}</h4>
        <p className={styles.hint}>
          Vorsichtige Hypothese — keine behauptete Coaching-Absicht und keine Erfolgsbewertung.
        </p>
      </div>

      <div className={styles.flow}>
        <div className={styles.block}>
          <p className={styles.label}>Vorheriges Problem</p>
          <p className={styles.value}>
            {labelForOption(PRIOR_PROBLEM_OPTIONS, result.priorProblem)}
            {result.priorProblemDetail ? ` · ${result.priorProblemDetail}` : ''}
          </p>
        </div>

        <div className={styles.arrow} aria-hidden>
          ↓ mögliche Reaktion
        </div>

        <div className={styles.block}>
          <p className={styles.label}>Beobachtete Veränderung</p>
          <p className={styles.value}>{result.observedChange}</p>
        </div>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Art des Triggers</p>
        <p className={styles.value}>{labelForOption(TRIGGER_TYPE_OPTIONS, result.triggerType)}</p>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Evidenz</p>
        <ul className={styles.list}>
          {labelsForValues(EVIDENCE_OPTIONS, result.evidence).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Alternative Erklärung</p>
        <p className={styles.value}>
          {labelForOption(ALTERNATIVE_OPTIONS, result.alternativeExplanation)}
          {result.alternativeDetail ? ` · ${result.alternativeDetail}` : ''}
        </p>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Zusammenhang · Passung · Confidence</p>
        <p className={styles.value}>
          {labelForOption(LINK_STRENGTH_OPTIONS, result.linkStrength)}
          {' · '}
          {labelForOption(PROBLEM_FIT_OPTIONS, result.problemFit)}
          {' · '}
          {labelForOption(DEFAULT_CONFIDENCE_OPTIONS, result.confidence)}
        </p>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Funktionale Verbindung</p>
        <p className={styles.value}>{result.functionalLink}</p>
      </div>

      <div className={styles.block}>
        <p className={styles.label}>Deine Hypothese</p>
        <p className={styles.value}>{result.hypothesisSummary}</p>
      </div>
    </section>
  )
}
