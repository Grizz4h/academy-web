import {
  forwardRef,
  useEffect,
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
  /** Close on outside tap, Escape, and tap on panel surface (not buttons/links/inputs). */
  onDismiss?: () => void
  /**
   * When onDismiss is set, tapping the panel closes it unless the target is interactive.
   * Default true.
   */
  dismissOnContentClick?: boolean
  preferredWidth?: number
  align?: AnchoredPopoverAlign
}

type ViewportBox = {
  width: number
  height: number
  top: number
  left: number
  bottom: number
  right: number
}

function readViewport(): ViewportBox {
  const vv = window.visualViewport
  if (vv) {
    return {
      width: vv.width,
      height: vv.height,
      top: vv.offsetTop,
      left: vv.offsetLeft,
      bottom: vv.offsetTop + vv.height,
      right: vv.offsetLeft + vv.width,
    }
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    top: 0,
    left: 0,
    bottom: window.innerHeight,
    right: window.innerWidth,
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'button, a[href], input, select, textarea, label, [role="button"], [data-popover-no-dismiss]',
    ),
  )
}

function computePosition(
  anchor: HTMLElement,
  popover: HTMLElement | null,
  preferredWidth: number,
  align: AnchoredPopoverAlign = 'left',
): CSSProperties {
  const margin = 10
  const gap = 8
  const vp = readViewport()
  const rect = anchor.getBoundingClientRect()
  const popupWidth = Math.min(preferredWidth, Math.max(180, vp.width - margin * 2))
  const maxHeight = Math.max(160, vp.height - margin * 2)

  // Prefer measured height; avoid tiny guesses that flip placement and cause jumps.
  const measured = popover?.scrollHeight ?? popover?.offsetHeight ?? 0
  const popupHeight = Math.min(measured > 0 ? measured : Math.min(260, maxHeight * 0.65), maxHeight)

  let left = rect.left
  if (align === 'right') left = rect.right - popupWidth
  if (align === 'center') left = rect.left + rect.width / 2 - popupWidth / 2
  if (left + popupWidth > vp.right - margin) left = rect.right - popupWidth
  left = Math.max(vp.left + margin, Math.min(left, vp.right - margin - popupWidth))

  const spaceBelow = vp.bottom - rect.bottom - gap - margin
  const spaceAbove = rect.top - vp.top - gap - margin
  const placeBelow = spaceBelow >= Math.min(popupHeight, 130) || spaceBelow >= spaceAbove

  let top = placeBelow ? rect.bottom + gap : rect.top - gap - popupHeight
  top = Math.max(vp.top + margin, Math.min(top, vp.bottom - margin - Math.min(popupHeight, maxHeight)))

  return {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(popupWidth)}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    zIndex: 220,
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
    onDismiss,
    dismissOnContentClick = true,
    preferredWidth = 300,
    align = 'left',
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const [placed, setPlaced] = useState(false)

  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPlaced(false)
      setStyle({ visibility: 'hidden' })
      return
    }

    let frame = 0
    let secondFrame = 0

    const update = (reveal: boolean) => {
      const anchor = anchorRef.current
      if (!anchor) return
      const next = computePosition(anchor, innerRef.current, preferredWidth, align)
      setStyle({
        ...next,
        visibility: reveal ? 'visible' : 'hidden',
      })
      setPlaced(reveal)
    }

    // Measure twice in layout: first with hidden panel, then reveal at final coords.
    update(false)
    frame = window.requestAnimationFrame(() => {
      update(false)
      secondFrame = window.requestAnimationFrame(() => update(true))
    })

    const onScroll = (event: Event) => {
      const target = event.target
      if (
        innerRef.current
        && target instanceof Node
        && (target === innerRef.current || innerRef.current.contains(target))
      ) {
        return
      }
      update(true)
    }

    const onViewportChange = () => update(true)

    const resizeObserver = innerRef.current ? new ResizeObserver(() => update(true)) : null
    if (innerRef.current) resizeObserver?.observe(innerRef.current)

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('scroll', onViewportChange)

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(secondFrame)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('scroll', onViewportChange)
    }
  }, [open, anchorRef, preferredWidth, align])

  useEffect(() => {
    if (!open || !onDismiss) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (anchorRef.current?.contains(target)) return
      if (innerRef.current?.contains(target)) return
      onDismiss()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onDismiss, anchorRef])

  if (!open) return null

  return createPortal(
    <div
      ref={innerRef}
      id={id}
      role="dialog"
      aria-label={ariaLabel}
      className={[
        'ui-anchored-popover',
        placed ? 'ui-anchored-popover--placed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      onClick={(event) => {
        onClick?.(event)
        if (!onDismiss || dismissOnContentClick === false) return
        if (isInteractiveTarget(event.target)) return
        onDismiss()
      }}
    >
      {children}
    </div>,
    document.body,
  )
})
