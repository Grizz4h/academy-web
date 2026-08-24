import { useEffect, type RefObject } from 'react'

type Options = {
  draggingClass?: string
  dragThreshold?: number
}

/** Wheel + optional drag-to-scroll for horizontal overflow (desktop). */
export function useHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
  options: Options = {},
) {
  const draggingClass = options.draggingClass ?? 'isDragging'
  const dragThreshold = options.dragThreshold ?? 8

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const syncScrollable = () => {
      const scrollable = el.scrollWidth > el.clientWidth + 2
      el.dataset.scrollable = scrollable ? 'true' : 'false'
    }

    syncScrollable()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollable) : null
    ro?.observe(el)
    if (el.firstElementChild) ro?.observe(el.firstElementChild)

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!delta) return

      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return

      event.preventDefault()
      el.scrollLeft += delta
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

    let pointerId: number | null = null
    let startX = 0
    let startScroll = 0
    let dragged = false

    const cleanupWindowListeners = () => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)
    }

    const finishPointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      pointerId = null
      el.classList.remove(draggingClass)
      cleanupWindowListeners()

      if (dragged) {
        const blockClick = (e: MouseEvent) => {
          e.preventDefault()
          e.stopImmediatePropagation()
          el.removeEventListener('click', blockClick, true)
        }
        el.addEventListener('click', blockClick, true)
      }
      dragged = false
    }

    const onWindowPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      const dx = event.clientX - startX
      if (!dragged && Math.abs(dx) < dragThreshold) return

      if (!dragged) {
        dragged = true
        el.classList.add(draggingClass)
      }
      event.preventDefault()
      el.scrollLeft = startScroll - dx
    }

    const onWindowPointerUp = (event: PointerEvent) => {
      finishPointer(event)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!finePointer.matches) return
      if (event.button !== 0) return
      if (el.scrollWidth <= el.clientWidth + 1) return

      pointerId = event.pointerId
      startX = event.clientX
      startScroll = el.scrollLeft
      dragged = false

      window.addEventListener('pointermove', onWindowPointerMove)
      window.addEventListener('pointerup', onWindowPointerUp)
      window.addEventListener('pointercancel', onWindowPointerUp)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', syncScrollable)

    return () => {
      ro?.disconnect()
      cleanupWindowListeners()
      window.removeEventListener('resize', syncScrollable)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.classList.remove(draggingClass)
      delete el.dataset.scrollable
    }
  }, [ref, draggingClass, dragThreshold])
}
