import { CLAIM_LEVELS, claimLevelIndex, claimLevelLabel } from './claimLogic'
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
  levels = CLAIM_LEVELS,
  selectedMaxLevel,
  onChange,
  examples,
  readOnly = false,
}: Props) {
  const maxIndex = claimLevelIndex(selectedMaxLevel || undefined)

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Claim Ladder</h3>
      <div className={styles.list} role="radiogroup" aria-label="Maximale Aussagestärke">
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
              disabled={readOnly}
              className={`${styles.level} ${included ? styles.included : ''} ${isCeiling ? styles.ceiling : ''}`}
              onClick={() => onChange?.(level)}
            >
              <span className={styles.index}>{index + 1}</span>
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
    </div>
  )
}
