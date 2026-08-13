import { DIMENSION_OPTIONS, labelForOption, relationShortLabel, relationSymbol } from './labels'
import type { ChangeTimelineObservation } from './types'
import styles from './ChangeTimelineSurface.module.css'

type Props = {
  title?: string
  observations: ChangeTimelineObservation[]
  changePointId?: string
  onEdit?: (index: number) => void
  onRemove?: (index: number) => void
}

export function ChangeTimelineSurface({
  title = 'Change Timeline',
  observations,
  changePointId,
  onEdit,
  onRemove,
}: Props) {
  if (observations.length === 0) {
    return (
      <section className={`${styles.surface} ui-flat-mobile mobile-flatten-card`}>
        <h4 className={styles.header}>{title}</h4>
        <p className={styles.hint}>Noch keine Beobachtungen – die Timeline füllt sich mit jeder Situation.</p>
      </section>
    )
  }

  return (
    <section className={`${styles.surface} ui-flat-mobile mobile-flatten-card`}>
      <div>
        <h4 className={styles.header}>{title}</h4>
        <p className={styles.hint}>
          Deskriptiv: Baseline, Abweichungen und möglicher Change Point. Keine automatische Adjustment-Behauptung.
        </p>
      </div>

      <ol className={styles.list}>
        {observations.map((obs, index) => {
          const isChangePoint = changePointId === obs.id
          const isDeviation = obs.relationToBaseline !== 'matches_baseline' && obs.relationToBaseline !== 'unclear'
          const clockParts = [obs.period, obs.gameClock].filter(Boolean).join(' · ')

          return (
            <li key={obs.id} className={styles.item}>
              <div className={styles.rail} aria-hidden>
                <span
                  className={[
                    styles.dot,
                    obs.relationToBaseline === 'matches_baseline' ? styles.dotBaseline : '',
                    isDeviation ? styles.dotDeviation : '',
                    isChangePoint ? styles.dotChangePoint : '',
                  ].filter(Boolean).join(' ')}
                >
                  {relationSymbol(obs.relationToBaseline)}
                </span>
                {index < observations.length - 1 && <span className={styles.line} />}
              </div>

              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.order}>#{index + 1}</span>
                  <span className={`${styles.badge} ${isChangePoint ? styles.badgeChange : ''}`}>
                    {relationShortLabel(obs.relationToBaseline)}
                    {isChangePoint ? ' · Change Point' : ''}
                  </span>
                  {clockParts && <span className={styles.clock}>{clockParts}</span>}
                </div>
                <p className={styles.description}>{obs.description}</p>
                {obs.changedDimension && (
                  <p className={styles.dimension}>
                    Dimension: {labelForOption(DIMENSION_OPTIONS, obs.changedDimension)}
                  </p>
                )}
                {(onEdit || onRemove) && (
                  <div className={styles.actions}>
                    {onEdit && (
                      <button type="button" className={styles.actionBtn} onClick={() => onEdit(index)}>
                        Bearbeiten
                      </button>
                    )}
                    {onRemove && (
                      <button type="button" className={styles.actionBtn} onClick={() => onRemove(index)}>
                        Entfernen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
