import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnchoredPopover, type AnchoredPopoverAlign } from './AnchoredPopover'

export type TapRevealAlign = AnchoredPopoverAlign

type TapRevealProps = {
  trigger: ReactNode
  title: string
  children: ReactNode
  align?: TapRevealAlign
  className?: string
  triggerClassName?: string
  ariaLabel?: string
}

export function TapReveal({
  trigger,
  title,
  children,
  align = 'left',
  className,
  triggerClassName,
  ariaLabel,
}: TapRevealProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = () => setOpen((value) => !value)

  return (
    <span className={['ui-tap-reveal-wrap', className].filter(Boolean).join(' ')}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className={['ui-tap-reveal-trigger', triggerClassName].filter(Boolean).join(' ')}
        aria-label={ariaLabel || `${title}: Details anzeigen`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggle()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            toggle()
          }
        }}
      >
        {trigger}
      </div>

      <AnchoredPopover
        ref={popoverRef}
        open={open}
        anchorRef={triggerRef}
        align={align}
        preferredWidth={300}
        id={panelId}
        ariaLabel={title}
        className="ui-tap-reveal-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-tap-reveal-header">
          <h3 className="ui-tap-reveal-title">{title}</h3>
          <button
            type="button"
            className="ui-tap-reveal-close"
            aria-label="Schließen"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
            }}
          >
            ×
          </button>
        </div>
        <div className="ui-tap-reveal-body">{children}</div>
      </AnchoredPopover>
    </span>
  )
}
