import type { ButtonHTMLAttributes, ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type UiChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  size?: 'md' | 'sm'
  static?: boolean
  children: ReactNode
}

/** Filter / toggle pill. Use `active` for selected state. */
export function UiChip({
  active = false,
  size = 'md',
  static: isStatic = false,
  className,
  type = 'button',
  children,
  ...rest
}: UiChipProps) {
  return (
    <button
      type={type}
      className={cx(
        'ui-chip',
        size === 'sm' && 'ui-chip--sm',
        isStatic && 'ui-chip--static',
        active && 'is-active',
        className,
      )}
      aria-pressed={isStatic ? undefined : active}
      {...rest}
    >
      {children}
    </button>
  )
}
