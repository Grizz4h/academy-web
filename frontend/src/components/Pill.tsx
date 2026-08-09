import type { ReactNode } from 'react'
import { UiPill } from './ui'

interface PillProps {
  children: ReactNode
  className?: string
}

/** Legacy alias → UiPill (accent). Prefer importing UiPill directly in new code. */
const Pill = ({ children, className = '' }: PillProps) => (
  <UiPill tone="accent" className={className}>
    {children}
  </UiPill>
)

export default Pill
