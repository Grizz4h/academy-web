import { useCallback, useEffect, useId, useRef, useState } from 'react'

const BUS = 'academy:exclusive-popover'

type BusDetail = { id: string }

/**
 * One open explain-popover at a time.
 * Dismiss UX lives on AnchoredPopover (`onDismiss`: outside / Escape / panel tap).
 * Shared by MechanicGlyph, TapReveal, TrackProgressMap, PUX wallet.
 */
export function useExclusivePopover() {
  const id = useId()
  const [open, setOpenRaw] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLElement | null>(null)

  const setOpen = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setOpenRaw((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      if (value) {
        window.dispatchEvent(new CustomEvent<BusDetail>(BUS, { detail: { id } }))
      }
      return value
    })
  }, [id])

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [setOpen])

  const close = useCallback(() => setOpen(false), [setOpen])

  useEffect(() => {
    const onBus = (event: Event) => {
      const detail = (event as CustomEvent<BusDetail>).detail
      if (detail?.id !== id) setOpenRaw(false)
    }
    window.addEventListener(BUS, onBus as EventListener)
    return () => window.removeEventListener(BUS, onBus as EventListener)
  }, [id])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpenRaw(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenRaw(false)
    }

    // Capture phase so nested stopPropagation still sees outside taps
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return {
    open,
    setOpen,
    toggle,
    close,
    triggerRef,
    popoverRef,
    panelId: id,
    exclusiveId: id,
  }
}

/** Notify other popovers to close (e.g. TrackProgressMap multi-node). */
export function claimExclusivePopover(id: string) {
  window.dispatchEvent(new CustomEvent<BusDetail>(BUS, { detail: { id } }))
}

export function subscribeExclusivePopover(id: string, onForeignOpen: () => void) {
  const onBus = (event: Event) => {
    const detail = (event as CustomEvent<BusDetail>).detail
    if (detail?.id !== id) onForeignOpen()
  }
  window.addEventListener(BUS, onBus as EventListener)
  return () => window.removeEventListener(BUS, onBus as EventListener)
}
