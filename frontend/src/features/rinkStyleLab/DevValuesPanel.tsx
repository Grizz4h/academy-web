import { useEffect, useState } from 'react'
import { UiButton } from '../../components/ui'
import {
  formatStoredGlobalDisplayCopyPayload,
  formatStoredNumber,
  GLOBAL_PLAYER_DISPLAY_KEY,
  readStoredGlobalDisplayFields,
  type StoredGlobalDisplayFields,
} from './globalPlayerDisplay.ts'
import styles from './DevValuesPanel.module.css'

type Props = {
  /** Bump when lab writes player-display storage so the panel re-reads. */
  refreshKey?: unknown
}

function FieldRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className={styles.row}>
      <dt className={styles.key}>{label}</dt>
      <dd className={value === null ? styles.missing : styles.value}>
        {value === null ? 'Nicht gespeichert' : formatStoredNumber(value)}
      </dd>
    </div>
  )
}

/**
 * Lab-only inspector for raw player-display storage numbers.
 * Does not affect player/puck rendering.
 */
export function DevValuesPanel({ refreshKey }: Props) {
  const [fields, setFields] = useState<StoredGlobalDisplayFields>(() => (
    readStoredGlobalDisplayFields()
  ))
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  useEffect(() => {
    setFields(readStoredGlobalDisplayFields())
  }, [refreshKey])

  const handleCopy = async () => {
    const payload = formatStoredGlobalDisplayCopyPayload(fields)
    try {
      await navigator.clipboard.writeText(payload)
      setCopyStatus('Kopiert')
    } catch {
      setCopyStatus('Kopieren fehlgeschlagen')
    }
  }

  useEffect(() => {
    if (!copyStatus) return undefined
    const t = window.setTimeout(() => setCopyStatus(null), 2000)
    return () => window.clearTimeout(t)
  }, [copyStatus])

  return (
    <details className={`ui-more ui-more--flush ${styles.wrap}`}>
      <summary className="ui-more__summary">
        <span>Dev-Werte</span>
        <span className="ui-more__chevron" aria-hidden="true" />
      </summary>
      <div className={`ui-more__body ${styles.body}`}>
        <p className={styles.meta}>
          Rohwerte aus
          {' '}
          <code>{GLOBAL_PLAYER_DISPLAY_KEY}</code>
          {fields.hasKey ? '' : ' · Key fehlt'}
        </p>
        <dl className={styles.list}>
          <FieldRow label="playerScale" value={fields.playerScale} />
          <FieldRow label="puckLocalX" value={fields.puckLocalX} />
          <FieldRow label="puckLocalY" value={fields.puckLocalY} />
        </dl>
        <div className={styles.actions}>
          <UiButton type="button" size="sm" variant="secondary" onClick={() => void handleCopy()}>
            Werte kopieren
          </UiButton>
          {copyStatus ? (
            <span className={styles.status} role="status">{copyStatus}</span>
          ) : null}
        </div>
      </div>
    </details>
  )
}
