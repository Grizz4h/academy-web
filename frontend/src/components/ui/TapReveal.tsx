import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type TapRevealAlign = 'left' | 'right' | 'center'

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
  const rootRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false)
      }
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

  const panelAlignClass =
    align === 'right'
      ? 'ui-tap-reveal-panel--right'
      : align === 'center'
        ? 'ui-tap-reveal-panel--center'
        : 'ui-tap-reveal-panel--left'

  const toggle = () => setOpen((value) => !value)

  return (
    <span ref={rootRef} className={['ui-tap-reveal-wrap', className].filter(Boolean).join(' ')}>
      <div
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

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title}
          className={['ui-tap-reveal-panel', panelAlignClass].join(' ')}
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
        </div>
      )}
    </span>
  )
}
