import type { BranchTrigger } from './types'
import { canAddTrigger, emptyTrigger } from './branchLogic'
import styles from './ScenarioBranchPanel.module.css'

type Props = {
  triggers: BranchTrigger[]
  minTriggers: number
  maxTriggers: number
  suggestions?: string[]
  cueCategories?: string[]
  categoryLabel?: (category: string) => string
  title?: string
  help?: string
  onChange: (triggers: BranchTrigger[]) => void
}

export function ScenarioBranchPanel({
  triggers,
  minTriggers,
  maxTriggers,
  suggestions = [],
  cueCategories = [],
  categoryLabel = (category) => category,
  title = 'Was würde Plan B wahrscheinlicher machen?',
  help,
  onChange,
}: Props) {
  const rows = triggers.length ? triggers : [emptyTrigger()]

  const update = (triggerId: string, patch: Partial<BranchTrigger>) => {
    onChange(rows.map((item) => (item.id === triggerId ? { ...item, ...patch } : item)))
  }

  const add = (description = '') => {
    if (!canAddTrigger(rows.length, maxTriggers)) return
    onChange([...rows, { ...emptyTrigger(), description }])
  }

  const applySuggestion = (description: string) => {
    const empty = rows.find((item) => !String(item.description || '').trim())
    if (empty) {
      update(empty.id, { description })
      return
    }
    add(description)
  }

  const remove = (triggerId: string) => {
    const next = rows.filter((item) => item.id !== triggerId)
    onChange(next.length ? next : [emptyTrigger()])
  }

  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      <p className={styles.help}>
        {help || `${minTriggers}–${maxTriggers} Trigger. Keine Prozentwerte – nur konkrete Bedingungen, die deine Erwartung verschieben würden.`}
      </p>
      {suggestions.length > 0 && (
        <div className={styles.chips}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.chip}
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className={styles.list}>
        {rows.map((trigger, index) => (
          <div key={trigger.id || index} className={styles.row}>
            {cueCategories.length > 0 && (
              <select
                className={styles.select}
                value={trigger.cueCategory || ''}
                onChange={(event) => update(trigger.id, { cueCategory: event.target.value || undefined })}
              >
                <option value="">Cue-Art (optional)</option>
                {cueCategories.map((category) => (
                  <option key={category} value={category}>{categoryLabel(category)}</option>
                ))}
              </select>
            )}
            <input
              className={styles.input}
              value={trigger.description}
              maxLength={80}
              placeholder="z. B. Passlinie wird geschlossen"
              onChange={(event) => update(trigger.id, { description: event.target.value })}
            />
            {rows.length > 1 && (
              <div className={styles.actions}>
                <button type="button" className={styles.actionBtn} onClick={() => remove(trigger.id)}>
                  Trigger entfernen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {canAddTrigger(rows.length, maxTriggers) && (
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={() => add()}>
            + Trigger
          </button>
        </div>
      )}
    </div>
  )
}
