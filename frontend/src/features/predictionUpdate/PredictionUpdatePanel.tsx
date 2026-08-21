import { ScenarioBranchPanel } from '../scenarioBranches/ScenarioBranchPanel'
import type { BranchTrigger } from '../scenarioBranches/types'
import styles from './PredictionUpdatePanel.module.css'

type Props = {
  initialPrediction: string
  triggers: BranchTrigger[]
  minTriggers: number
  maxTriggers: number
  suggestions?: string[]
  cueCategories?: string[]
  categoryLabel?: (category: string) => string
  onChangeTriggers: (triggers: BranchTrigger[]) => void
}

export function PredictionUpdatePanel({
  initialPrediction,
  triggers,
  minTriggers,
  maxTriggers,
  suggestions = [],
  cueCategories = [],
  categoryLabel,
  onChangeTriggers,
}: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.stop}>
        <div className={styles.stopLabel}>Stop – neue Information</div>
        <p className={styles.stopTitle}>Ändert sich deine Erwartung?</p>
      </div>
      <div className={styles.locked}>
        <div className={styles.lockedLabel}>Dein erster Read</div>
        <p className={styles.lockedValue}>{initialPrediction || '—'}</p>
      </div>
      <ScenarioBranchPanel
        triggers={triggers}
        minTriggers={minTriggers}
        maxTriggers={maxTriggers}
        suggestions={suggestions}
        cueCategories={cueCategories}
        categoryLabel={categoryLabel}
        title="Neue Information"
        help={`${minTriggers}–${maxTriggers} Trigger. Was hat sich in der Situation verändert? Keine Prozentwerte.`}
        onChange={onChangeTriggers}
      />
      <p className={styles.help}>Nicht jede neue Information zwingt dich zum Umschalten. Entscheide im nächsten Schritt bewusst.</p>
    </div>
  )
}
