import { useSpoilerProtection } from '../../features/schedule/useSpoilerProtection'
import styles from './SpoilerProtectionToggle.module.css'

type SpoilerProtectionToggleProps = {
  className?: string
}

/** Shared Spoiler-Schutz control — default on, persisted globally. */
export function SpoilerProtectionToggle({ className = '' }: SpoilerProtectionToggleProps) {
  const [hideSpoilers, setHideSpoilers] = useSpoilerProtection()

  return (
    <button
      type="button"
      className={[
        styles.spoilerToggle,
        hideSpoilers ? styles.spoilerOn : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={() => setHideSpoilers((current) => !current)}
      aria-pressed={hideSpoilers}
      title={hideSpoilers
        ? 'Ergebnisse sind ausgeblendet — antippen zum Anzeigen'
        : 'Ergebnisse sichtbar — antippen zum Ausblenden'}
    >
      <span className={styles.spoilerMark} aria-hidden="true" />
      <span className={styles.spoilerLabel}>{hideSpoilers ? 'Spoiler-Schutz an' : 'Spoiler-Schutz aus'}</span>
      <span className={styles.spoilerHint}>
        {hideSpoilers ? 'Ergebnisse ausgeblendet' : 'Ergebnisse sichtbar'}
      </span>
    </button>
  )
}
