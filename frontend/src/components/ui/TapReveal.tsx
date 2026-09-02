import { type ReactNode, type Ref } from 'react'
import { AnchoredPopover, type AnchoredPopoverAlign } from './AnchoredPopover'
import { useExclusivePopover } from './useExclusivePopover'

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
  const { open, toggle, close, triggerRef, popoverRef, panelId } = useExclusivePopover()

  return (
    <span className={['ui-tap-reveal-wrap', className].filter(Boolean).join(' ')}>
      <div
        ref={triggerRef as Ref<HTMLDivElement>}
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
        ref={popoverRef as Ref<HTMLDivElement>}
        open={open}
        anchorRef={triggerRef}
        align={align}
        preferredWidth={300}
        id={panelId}
        ariaLabel={title}
        className="ui-tap-reveal-panel"
        onDismiss={close}
      >
        <div className="ui-tap-reveal-header">
          <h3 className="ui-tap-reveal-title">{title}</h3>
        </div>
        <div className="ui-tap-reveal-body">{children}</div>
      </AnchoredPopover>
    </span>
  )
}
