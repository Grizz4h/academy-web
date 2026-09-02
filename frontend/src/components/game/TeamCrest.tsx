import { useState, type CSSProperties } from 'react'
import { resolveTeamLogo } from '../../data/teamLogos'
import { resolveNationalTeamFlag } from '../../data/nationalTeamFlags'
import { resolveTeamShortCode } from '../../data/teamShortCodes'
import styles from './TeamCrest.module.css'

const CREST_HUES = [168, 186, 204, 18, 34, 262, 332, 142]

function crestHue(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) % 997
  }
  return CREST_HUES[hash % CREST_HUES.length]
}

function crestLetters(name: string): string {
  return resolveTeamShortCode(name) || name.replace(/[^A-Za-zÄÖÜäöüß]/g, '').slice(0, 3).toUpperCase() || '?'
}

export function TeamCrest({
  name,
  teamId,
  size = 'md',
}: {
  name: string
  teamId?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const logo = resolveTeamLogo(teamId) || resolveTeamLogo(name)
  const flag = resolveNationalTeamFlag(teamId) || resolveNationalTeamFlag(name)
  const [logoFailed, setLogoFailed] = useState(false)
  const letters = crestLetters(name)
  const showLogo = Boolean(logo) && !logoFailed

  if (flag) {
    return (
      <span
        className={[styles.crest, styles.hasFlag, styles[size]].join(' ')}
        role="img"
        aria-label={name}
      >
        <span className={styles.flagEmoji} aria-hidden="true">{flag}</span>
      </span>
    )
  }

  if (showLogo && logo) {
    return (
      <span
        className={[styles.crest, styles.hasLogo, styles[size]].join(' ')}
        aria-hidden="true"
      >
        <span className={styles.crestGlow} />
        <img className={styles.logo} src={logo} alt="" onError={() => setLogoFailed(true)} />
      </span>
    )
  }

  return (
    <span
      className={[styles.crest, styles[size]].join(' ')}
      style={{ '--crest-hue': String(crestHue(letters || name)) } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.letters}>{letters}</span>
    </span>
  )
}
