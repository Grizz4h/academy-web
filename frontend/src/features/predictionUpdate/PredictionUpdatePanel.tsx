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
        <div className={styles.stopLabel}>Stop – neue sichtbare Information</div>
        <p className={styles.stopTitle}>Ändert sich deine Erwartung?</p>
      </div>
      <div className={styles.locked}>
        <div className={styles.lockedLabel}>Ursprüngliche Erwartung</div>
        <p className={styles.lockedValue}>{initialPrediction || '—'}</p>
      </div>
      <ScenarioBranchPanel
        triggers={triggers}
        minTriggers={minTriggers}
        maxTriggers={maxTriggers}
        suggestions={suggestions}
        cueCategories={cueCategories}
        categoryLabel={categoryLabel}
        title="Neue sichtbare Information"
        help={
          minTriggers > 0
            ? `${minTriggers}–${maxTriggers} Auslöser. Was hat sich in der Situation verändert? Keine Prozentwerte.`
            : `Optional bis ${maxTriggers} Auslöser. Wenn keine relevante neue Information sichtbar war, kannst du ohne Eintrag weiter und das im nächsten Schritt markieren.`
        }
        onChange={onChangeTriggers}
      />
      <p className={styles.help}>
        Nicht jede neue Information zwingt zum Ändern. Beibehalten und Ändern sind beide gültig – entscheidend ist die dokumentierte Grundlage.
      </p>
    </div>
  )
}
