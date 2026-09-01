import styles from './MatchupVs.module.css'

type MatchupVsProps = {
  variant?: 'default' | 'inline' | 'board'
}

export function MatchupVs({ variant = 'default' }: MatchupVsProps) {
  return (
    <div
      className={[
        styles.vs,
        variant === 'inline' ? styles.inline : '',
        variant === 'board' ? styles.board : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span className={styles.mark}>VS</span>
    </div>
  )
}
