import type { PrioritizableCue, CuePriority } from './types'
import { cuePriorityOptions, formatCuePriorityLine } from './cueLogic'
import styles from './CuePriorityPanel.module.css'

type Props = {
  cues: PrioritizableCue[]
  onChange: (cueId: string, priority: CuePriority) => void
  title?: string
  help?: string
  formatCategory?: (category?: string) => string
}

export function CuePriorityPanel({
  cues,
  onChange,
  title = 'Ordne die Wichtigkeit deiner Hinweise',
  help = 'Was hat deine Erwartung getragen? Genau ein Haupthinweis; keine Punkte, keine Prozentwerte.',
  formatCategory,
}: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      {help && <p className={styles.help}>{help}</p>}
      <div className={styles.list}>
        {cues.map((cue) => (
          <div key={cue.id} className={styles.row}>
            <div className={styles.cueLabel}>
              {formatCuePriorityLine({
                ...cue,
                priority: undefined,
                category: formatCategory ? formatCategory(cue.category) : cue.category,
              })}
            </div>
            <div className={styles.choices} role="group" aria-label={cue.label}>
              {cuePriorityOptions().map((option) => {
                const selected = cue.priority === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.choice} ${selected ? styles.choiceActive : ''}`}
                    aria-pressed={selected}
                    onClick={() => onChange(cue.id, option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
