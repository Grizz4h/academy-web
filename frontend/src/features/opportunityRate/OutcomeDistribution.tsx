import type { OutcomeDistributionItem } from './types'
import styles from './OutcomeDistribution.module.css'

type Props = {
  items: OutcomeDistributionItem[]
  total: number
  compact?: boolean
}

export function OutcomeDistribution({ items, total, compact = false }: Props) {
  const max = Math.max(total, ...items.map((item) => item.count), 1)

  return (
    <ul className={`${styles.list} ${compact ? styles.compact : ''}`}>
      {items.map((item) => {
        const width = Math.round((item.count / max) * 100)
        return (
          <li
            key={item.id}
            className={[
              styles.row,
              item.isTarget ? styles.target : '',
              item.isUnclear ? styles.unclear : '',
            ].filter(Boolean).join(' ')}
          >
            <div className={styles.meta}>
              <span className={styles.label}>
                {item.label}
                {item.isTarget ? ' ← Target' : ''}
              </span>
              <span className={styles.count}>{item.count}</span>
            </div>
            <div className={styles.track} aria-hidden>
              <div className={styles.fill} style={{ width: `${width}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
