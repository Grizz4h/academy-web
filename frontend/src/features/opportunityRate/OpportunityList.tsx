import { formatObservationMeta } from './rateLogic'
import type { OpportunityObservation, RateDefinition } from './types'
import styles from './OpportunityList.module.css'

type Props = {
  observations: OpportunityObservation[]
  definition: RateDefinition
  onEdit?: (index: number) => void
  onRemove?: (index: number) => void
  badgeFor?: (observation: OpportunityObservation) => string | undefined
}

export function OpportunityList({ observations, definition, onEdit, onRemove, badgeFor }: Props) {
  if (observations.length === 0) {
    return (
      <p className={styles.empty}>Noch keine Opportunity erfasst. Jede gespeicherte Situation zählt in den Nenner.</p>
    )
  }

  return (
    <ol className={styles.list}>
      {observations.map((obs, index) => {
        const outcome = definition.outcomes.find((item) => item.id === obs.outcomeId)
        const isTarget = obs.outcomeId === definition.targetOutcomeId
        return (
          <li key={obs.id} className={styles.row}>
            <div className={styles.body}>
              <div className={styles.meta}>
                {formatObservationMeta(obs)}
                {badgeFor?.(obs) ? ` · ${badgeFor(obs)}` : ''}
              </div>
              <div className={styles.outcome}>
                {outcome?.label || obs.outcomeId}
                {isTarget ? ' ✓' : ''}
              </div>
              {obs.description && <p className={styles.note}>{obs.description}</p>}
            </div>
            {(onEdit || onRemove) && (
              <div className={styles.actions}>
                {onEdit && (
                  <button type="button" className={styles.actionBtn} onClick={() => onEdit(index)}>
                    ändern
                  </button>
                )}
                {onRemove && (
                  <button type="button" className={styles.actionBtn} onClick={() => onRemove(index)}>
                    entfernen
                  </button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
