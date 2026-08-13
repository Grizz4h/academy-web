import {
  COMPARABILITY_OPTIONS,
  DEFAULT_CHANGE_MAGNITUDE_OPTIONS,
  DIMENSION_OPTIONS,
  EXAMPLE_COUNT_OPTIONS,
  INTERACTION_ASSESSMENT_OPTIONS,
  PROBLEM_CATEGORY_OPTIONS,
  PROBLEM_EFFECT_OPTIONS,
  RESPONSE_REPETITION_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  TRADEOFF_OPTIONS,
  labelForOption,
} from './labels'
import type { InteractionChainView } from './types'
import styles from './InteractionChainSurface.module.css'

type Props = {
  title?: string
  result: InteractionChainView
  compact?: boolean
}

export function InteractionChainSurface({
  title = 'Adjustment-Interaktion',
  result,
  compact = false,
}: Props) {
  return (
    <section className={`${styles.surface} ui-flat-mobile mobile-flatten-card`}>
      <div>
        <h4 className={styles.header}>{title}</h4>
        <p className={styles.hint}>
          Problem → Veränderung → Reaktion. Keine Erfolgsbewertung, kein Scoreboard.
        </p>
      </div>

      <div className={styles.chain}>
        <div className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={`${styles.dot} ${styles.dotProblem}`}>1</span>
            <span className={styles.line} />
          </div>
          <div className={styles.card}>
            <p className={styles.label}>01 · Problem</p>
            <p className={styles.value}>{result.problemDescription || '—'}</p>
            <p className={styles.meta}>
              {labelForOption(PROBLEM_CATEGORY_OPTIONS, result.problemCategory)}
              {result.problemExampleCount
                ? ` · beobachtet: ${labelForOption(EXAMPLE_COUNT_OPTIONS, result.problemExampleCount)}`
                : ''}
            </p>
          </div>
        </div>

        <div className={styles.arrow} aria-hidden>
          →
        </div>

        <div className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={`${styles.dot} ${styles.dotAdjustment}`}>2</span>
            <span className={styles.line} />
          </div>
          <div className={styles.card}>
            <p className={styles.label}>02 · Veränderung</p>
            <p className={styles.value}>{result.adjustmentDescription || '—'}</p>
            <p className={styles.meta}>
              {labelForOption(DIMENSION_OPTIONS, result.adjustmentDimension)}
              {result.changeMagnitude
                ? ` · ${labelForOption(DEFAULT_CHANGE_MAGNITUDE_OPTIONS, result.changeMagnitude)}`
                : ''}
            </p>
          </div>
        </div>

        <div className={styles.arrow} aria-hidden>
          →
        </div>

        <div className={styles.step}>
          <div className={styles.rail} aria-hidden>
            <span className={`${styles.dot} ${styles.dotResponse}`}>3</span>
          </div>
          <div className={styles.card}>
            <p className={styles.label}>03 · Reaktion</p>
            <p className={styles.value}>{result.responseDescription || '—'}</p>
            <p className={styles.meta}>
              {labelForOption(RESPONSE_TYPE_OPTIONS, result.responseType)}
              {result.responseRepetition
                ? ` · danach: ${labelForOption(RESPONSE_REPETITION_OPTIONS, result.responseRepetition)}`
                : ''}
            </p>
          </div>
        </div>
      </div>

      {!compact && (
        <div className={styles.assessGrid}>
          <div className={styles.block}>
            <p className={styles.label}>Was passierte mit dem Problem?</p>
            <p className={styles.value}>{labelForOption(PROBLEM_EFFECT_OPTIONS, result.problemEffect)}</p>
          </div>
          {result.tradeoff && (
            <div className={styles.block}>
              <p className={styles.label}>Trade-off</p>
              <p className={styles.value}>
                {labelForOption(TRADEOFF_OPTIONS, result.tradeoff)}
                {result.tradeoffDetail ? ` · ${result.tradeoffDetail}` : ''}
              </p>
            </div>
          )}
          {result.comparability && (
            <div className={styles.block}>
              <p className={styles.label}>Vergleichbarkeit</p>
              <p className={styles.value}>{labelForOption(COMPARABILITY_OPTIONS, result.comparability)}</p>
            </div>
          )}
          <div className={styles.block}>
            <p className={styles.label}>Deine Einschätzung</p>
            <p className={styles.value}>
              {labelForOption(INTERACTION_ASSESSMENT_OPTIONS, result.interactionAssessment)}
            </p>
          </div>
          {result.chainSummary && (
            <div className={styles.block}>
              <p className={styles.label}>Zusammenfassung</p>
              <p className={styles.summary}>{result.chainSummary}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
