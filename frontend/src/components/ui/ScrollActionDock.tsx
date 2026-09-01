import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { ScrollDockLayer } from './ScrollDockLayer'
import { useScrollDockEnd } from './useScrollDockEnd'
import styles from './ScrollActionDock.module.css'

type ScrollActionDockProps = {
  enabled?: boolean
  resetKey?: string | number
  hint?: ReactNode
  children: ReactNode
  className?: string
  onDockedChange?: (docked: boolean) => void
  htmlAttrs?: HTMLAttributes<HTMLDivElement> & Record<string, string | undefined>
}

export function scrollActionDockPageClass(enabled: boolean, docked: boolean): string {
  return enabled && !docked ? styles.pageWithDock : ''
}

export function ScrollActionDock({
  enabled = true,
  resetKey = 0,
  hint,
  children,
  className,
  onDockedChange,
  htmlAttrs,
}: ScrollActionDockProps) {
  const { sentinelRef, docked } = useScrollDockEnd(enabled, resetKey)

  useEffect(() => {
    onDockedChange?.(docked)
  }, [docked, onDockedChange])

  if (!enabled) return null

  return (
    <div
      className={[
        styles.slot,
        styles.slotActive,
        docked ? styles.slotParked : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <ScrollDockLayer docked={docked} htmlAttrs={htmlAttrs}>
        <div className={styles.inner}>
          {hint ? <span className={styles.hint}>{hint}</span> : null}
          <div className={styles.row}>{children}</div>
        </div>
      </ScrollDockLayer>
    </div>
  )
}
