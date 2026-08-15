import type { ReactNode } from 'react'
import { resolveFrameLook } from '../../features/progression/frames/frameLooks'
import styles from './AccountPillFrame.module.css'

type Props = {
  frameId?: string | null
  className?: string
  children?: ReactNode
  preview?: boolean
  previewSize?: 'tile' | 'sheet'
}

function HudChrome() {
  return (
    <span className={styles.hudChrome} aria-hidden="true">
      <span className={styles.hudCorner} data-pos="tl" />
      <span className={styles.hudCorner} data-pos="tr" />
      <span className={styles.hudCorner} data-pos="bl" />
      <span className={styles.hudCorner} data-pos="br" />
      <span className={styles.hudNotch} data-pos="left" />
      <span className={styles.hudNotch} data-pos="right" />
      <span className={styles.hudTicks} />
    </span>
  )
}

export function AccountPillFrame({
  frameId,
  className,
  children,
  preview = false,
  previewSize = 'tile',
}: Props) {
  const look = resolveFrameLook(frameId)
  const frame = look?.id || 'none'
  const rarity = look?.rarity || 'none'
  const isHud = frame === 'frame_night_circuit'

  if (preview) {
    return (
      <div className={`${styles.host} ${styles.hostPreview}`} data-frame={frame}>
        {isHud && <HudChrome />}
        <div
          className={`${styles.pill} ${styles.preview}`}
          data-frame={frame}
          data-rarity={rarity}
          data-size={previewSize}
          aria-hidden="true"
        >
          <span className={styles.previewBar} />
          <span className={styles.previewDot} />
          <span className={styles.previewBar} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.host} data-frame={frame}>
      {isHud && <HudChrome />}
      <div
        className={[styles.pill, className].filter(Boolean).join(' ')}
        data-frame={frame}
        data-rarity={rarity}
        data-account-pill="true"
      >
        {children}
      </div>
    </div>
  )
}
