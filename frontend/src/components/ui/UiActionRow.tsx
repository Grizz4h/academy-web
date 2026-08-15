import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { UiButtonSize, UiButtonVariant } from './UiButton'

type ActionChildProps = {
  variant?: UiButtonVariant
  size?: UiButtonSize
}

/**
 * Locks button pairing: first/only action is primary (türkis),
 * every further action is secondary (farblos).
 */
export function UiActionRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const items = Children.toArray(children)
  return (
    <div className={['ui-tap-reveal-actions', className].filter(Boolean).join(' ')}>
      {items.map((child, index) => {
        if (!isValidElement<ActionChildProps>(child)) return child
        return cloneElement(child as ReactElement<ActionChildProps>, {
          variant: index === 0 ? 'primary' : 'secondary',
          size: child.props.size ?? 'sm',
        })
      })}
    </div>
  )
}
