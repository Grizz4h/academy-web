import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

export type AnchoredPopoverAlign = 'left' | 'right' | 'center'

type AnchoredPopoverProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
  id?: string
  ariaLabel?: string
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  preferredWidth?: number
  align?: AnchoredPopoverAlign
}

function computePosition(
  anchor: HTMLElement,
  popover: HTMLElement | null,
  preferredWidth: number,
  align: AnchoredPopoverAlign = 'left',
): CSSProperties {
  const margin = 8
  const gap = 6
  const rect = anchor.getBoundingClientRect()
  const popupWidth = Math.min(preferredWidth, window.innerWidth - margin * 2)
  const maxHeight = Math.max(120, window.innerHeight - margin * 2)
  const popupHeight = Math.min(popover?.offsetHeight ?? 160, maxHeight)

  let left = rect.left
  if (align === 'right') left = rect.right - popupWidth
  if (align === 'center') left = rect.left + rect.width / 2 - popupWidth / 2
  if (left + popupWidth > window.innerWidth - margin) {
    left = rect.right - popupWidth
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - margin - popupWidth))

  let top = rect.bottom + gap
  if (top + popupHeight > window.innerHeight - margin) {
    top = rect.top - gap - popupHeight
  }
  top = Math.max(margin, Math.min(top, window.innerHeight - margin - popupHeight))

  return {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(popupWidth)}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    zIndex: 200,
  }
}

export const AnchoredPopover = forwardRef<HTMLDivElement, AnchoredPopoverProps>(function AnchoredPopover(
  {
    open,
    anchorRef,
    children,
    className,
    id,
    ariaLabel,
    onClick,
    preferredWidth = 260,
    align = 'left',
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return

    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      setStyle({
        ...computePosition(anchor, innerRef.current, preferredWidth, align),
        visibility: 'visible',
      })
    }

    update()
    const raf = window.requestAnimationFrame(update)

    const resizeObserver = innerRef.current ? new ResizeObserver(update) : null
    if (innerRef.current) resizeObserver?.observe(innerRef.current)

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef, preferredWidth, align])

  if (!open) return null

  return createPortal(
    <div
      ref={innerRef}
      id={id}
      role="dialog"
      aria-label={ariaLabel}
      className={['ui-anchored-popover', className].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>,
    document.body,
  )
})
