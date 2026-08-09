import type { HTMLAttributes, ReactNode } from 'react'

export type UiPillTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'new'

type UiPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: UiPillTone
  children: ReactNode
}

/** Non-interactive status/label pill. */
export function UiPill({ tone = 'neutral', className, children, ...rest }: UiPillProps) {
  return (
    <span
      className={['ui-pill', `ui-pill--${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </span>
  )
}
