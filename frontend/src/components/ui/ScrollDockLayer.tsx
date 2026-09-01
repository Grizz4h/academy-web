import { createPortal } from 'react-dom'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './ScrollActionDock.module.css'

type ScrollDockLayerProps = {
  docked: boolean
  children: ReactNode
  htmlAttrs?: HTMLAttributes<HTMLDivElement> & Record<string, string | undefined>
}

export function ScrollDockLayer({
  docked,
  children,
  htmlAttrs,
}: ScrollDockLayerProps) {
  const layer = (
    <div
      className={`${styles.dock} ${docked ? styles.dockParked : styles.dockFloating}`}
      {...htmlAttrs}
    >
      {children}
    </div>
  )

  if (docked || typeof document === 'undefined') {
    return layer
  }

  return createPortal(layer, document.body)
}
