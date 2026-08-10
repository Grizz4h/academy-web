import type { ReactNode } from 'react'
import Card from '../Card'
import { TapReveal, type TapRevealAlign } from '../ui/TapReveal'
import styles from './KpiRevealCard.module.css'

type KpiRevealCardProps = {
  title: string
  value: ReactNode
  hint: string
  panelTitle: string
  panel: ReactNode
  align?: TapRevealAlign
  elevation?: 'quiet' | 'default' | 'featured'
  to?: string
}

export function KpiRevealCard({
  title,
  value,
  hint,
  panelTitle,
  panel,
  align = 'left',
  elevation = 'quiet',
}: KpiRevealCardProps) {
  return (
    <TapReveal
      className={styles.wrap}
      align={align}
      title={panelTitle}
      ariaLabel={`${title}: ${hint}. Details anzeigen`}
      trigger={
        <Card className={styles.card} elevation={elevation}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>{value}</div>
          <div className={styles.hint}>{hint}</div>
          <span className="ui-tap-hint" aria-hidden="true">
            Antippen für Details
          </span>
        </Card>
      }
    >
      {panel}
    </TapReveal>
  )
}
