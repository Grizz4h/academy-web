import { SELECTABLE_CLAIM_LEVELS, claimLevelLabel } from './claimLogic'
import type { ClaimExample, ClaimLevel } from './types'
import styles from './ClaimLadder.module.css'

type Props = {
  levels?: ClaimLevel[]
  selectedMaxLevel?: ClaimLevel | ''
  onChange?: (level: ClaimLevel) => void
  examples?: ClaimExample[]
  readOnly?: boolean
}

export function ClaimLadder({
  levels = SELECTABLE_CLAIM_LEVELS,
  selectedMaxLevel,
  onChange,
  examples,
  readOnly = false,
}: Props) {
  const maxIndex = levels.indexOf((selectedMaxLevel || '') as ClaimLevel)

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Aussagestufen</h3>
      <div className={styles.list} role="radiogroup" aria-label="Höchstens vertretbare Aussage">
        {levels.map((level, index) => {
          const included = maxIndex >= 0 && index <= maxIndex
          const isCeiling = selectedMaxLevel === level
          const example = examples?.find((item) => item.level === level)
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={isCeiling}
              disabled={readOnly || level === 'causal'}
              className={`${styles.level} ${included ? styles.included : ''} ${isCeiling ? styles.ceiling : ''}`}
              onClick={() => {
                if (level === 'causal') return
                onChange?.(level)
              }}
            >
              <span className={styles.index}>{index}</span>
              <span className={styles.body}>
                <span className={styles.label}>{claimLevelLabel(level)}</span>
                {example && <p className={styles.example}>{example.text}</p>}
              </span>
              <span className={styles.mark}>
                {isCeiling ? 'Grenze' : included ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </div>
      <p className={styles.note}>
        Ursache, Teamwahrheit, Zukunftswahrscheinlichkeit und taktische Empfehlung sind mit E3 allein keine erreichbaren Stufen.
        Die App warnt bei Überziehung — sie berechnet die Stufe nicht als objektiv richtig.
      </p>
    </div>
  )
}
