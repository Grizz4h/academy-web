import styles from './RinQIcon.module.css'
import { renderIconArt, RINQ_ICON_LABELS } from './iconArt'
import type { RinQIconName, RinQIconSize, RinQIconTone } from './types'

export type RinQIconProps = {
  name: RinQIconName
  size?: RinQIconSize
  tone?: RinQIconTone
  /** Frosted chip behind icon (MechanicGlyph-adjacent). */
  badge?: boolean
  /** Space after icon when inline with text. */
  inline?: boolean
  className?: string
  title?: string
}

const TONE_CLASS: Record<RinQIconTone, string | undefined> = {
  ice: undefined,
  accent: styles.toneAccent,
  muted: styles.toneMuted,
  ok: styles.toneOk,
  warn: styles.toneWarn,
  danger: styles.toneDanger,
}

export function RinQIcon({
  name,
  size = 'md',
  tone = 'ice',
  badge = false,
  inline = false,
  className,
  title,
}: RinQIconProps) {
  const label = title ?? RINQ_ICON_LABELS[name]
  const art = renderIconArt(name, styles.icon)
  const toneClass = TONE_CLASS[tone]
  const sizeClass = styles[size]

  const iconNode = (
    <span
      className={[
        styles.icon,
        sizeClass,
        toneClass,
        inline ? styles.inline : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title ? label : undefined}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {art}
    </span>
  )

  if (!badge) return iconNode

  return (
    <span
      className={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : size === 'lg' ? styles.badgeLg : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {iconNode}
    </span>
  )
}
