import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dev'
export type UiButtonSize = 'md' | 'sm'

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type CommonProps = {
  variant?: UiButtonVariant
  size?: UiButtonSize
  block?: boolean
  className?: string
  children: ReactNode
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
}: Omit<CommonProps, 'children'>) {
  return cx(
    'ui-btn',
    `ui-btn--${variant}`,
    size === 'sm' && 'ui-btn--sm',
    block && 'ui-btn--block',
    className,
  )
}

type UiButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export function UiButton({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  children,
  ...rest
}: UiButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, block, className })}
      {...rest}
    >
      {children}
    </button>
  )
}

type UiButtonLinkProps = CommonProps & Omit<LinkProps, 'className' | 'children'>

export function UiButtonLink({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  children,
  ...rest
}: UiButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  )
}
