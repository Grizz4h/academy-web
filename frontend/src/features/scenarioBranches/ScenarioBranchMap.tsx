import styles from './ScenarioBranchMap.module.css'

type Props = {
  situation?: string
  primary?: string
  alternative?: string
  triggers?: string[]
}

export function ScenarioBranchMap({ situation, primary, alternative, triggers = [] }: Props) {
  const triggerText = triggers.filter(Boolean).join(' · ')
  return (
    <div className={styles.stack} aria-label="Szenario-Zweige">
      <div className={styles.fork}>
        {situation ? (
          <div className={styles.situation}>
            <div className={styles.label}>Situation</div>
            <p className={styles.value}>{situation}</p>
          </div>
        ) : null}
        <span className={styles.trunk} aria-hidden />
        <div className={styles.primary}>
          <div className={styles.label}>Primärer Read</div>
          <p className={styles.value}>{primary || '—'}</p>
        </div>
        <span className={styles.trunk} aria-hidden />
        <div className={`${styles.arm} ${styles.armAlt}`}>
          <div className={styles.label}>Alternative</div>
          <p className={styles.value}>{alternative || 'Plan B wählen'}</p>
        </div>
        <div className={styles.arm}>
          <div className={styles.label}>bleibt aktiv, wenn …</div>
          <p className={styles.value}>{triggerText || 'Trigger definieren'}</p>
          {triggerText ? (
            <p className={styles.note}>Keine Prozentwerte – nur die Bedingung, die Plan B wahrscheinlicher macht.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
