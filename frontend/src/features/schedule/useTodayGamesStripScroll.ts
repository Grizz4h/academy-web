import { useEffect, type RefObject } from 'react'

const DEFAULT_SPEED = 0.35
const DEFAULT_RESUME_MS = 2200
const DRAG_THRESHOLD = 10

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isTouchLikePointer(event: PointerEvent, coarsePointer: MediaQueryList): boolean {
  return event.pointerType === 'touch' || (event.pointerType === 'pen' && coarsePointer.matches)
}

function pillFromTarget(target: EventTarget | null): HTMLButtonElement | null {
  return (target as HTMLElement | null)?.closest('button') ?? null
}

/** Transform-based marquee — reliable on iOS; pauses on hover (desktop), touch, drag, wheel. */
export function useTodayGamesStripScroll(
  scrollRef: RefObject<HTMLElement | null>,
  loopRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  options?: { speed?: number; resumeDelayMs?: number; hoverRef?: RefObject<HTMLElement | null> },
) {
  const speed = options?.speed ?? DEFAULT_SPEED
  const resumeDelayMs = options?.resumeDelayMs ?? DEFAULT_RESUME_MS
  const hoverRef = options?.hoverRef

  useEffect(() => {
    const scrollEl = scrollRef.current
    const loopEl = loopRef.current
    if (!scrollEl || !loopEl) return

    const touchEl = hoverRef?.current || scrollEl
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const autoScrollEnabled = enabled && !prefersReducedMotion()

    let paused = !autoScrollEnabled
    let resumeTimer: number | null = null
    let loopWidth = 0
    let offset = 0
    let raf = 0
    let hovering = false

    let pointerId: number | null = null
    let startX = 0
    let startY = 0
    let startOffset = 0
    let dragged = false
    let touchLike = false
    let activePill: HTMLButtonElement | null = null
    let pageLocked = false

    const measure = () => {
      loopWidth = loopEl.scrollWidth / 2
      normalizeOffset()
      applyOffset()
    }

    const normalizeOffset = () => {
      if (loopWidth <= 0) return
      while (offset >= loopWidth) offset -= loopWidth
      while (offset < 0) offset += loopWidth
    }

    const applyOffset = () => {
      loopEl.style.transform = `translate3d(${-offset}px, 0, 0)`
    }

    const clearResume = () => {
      if (resumeTimer != null) {
        window.clearTimeout(resumeTimer)
        resumeTimer = null
      }
    }

    const pause = () => {
      paused = true
      clearResume()
    }

    const canResume = () => {
      if (!autoScrollEnabled) return false
      if (pointerId != null) return false
      if (hovering && finePointer.matches) return false
      return true
    }

    const scheduleResume = () => {
      clearResume()
      if (!canResume()) return
      resumeTimer = window.setTimeout(() => {
        resumeTimer = null
        if (!canResume()) return
        paused = false
      }, resumeDelayMs)
    }

    const canAutoScroll = () => enabled && loopWidth > scrollEl.clientWidth + 1

    const tick = () => {
      if (!paused && canAutoScroll()) {
        offset += speed
        if (offset >= loopWidth) offset -= loopWidth
        applyOffset()
      }
      raf = window.requestAnimationFrame(tick)
    }

    const setPressed = (pill: HTMLButtonElement | null, pressed: boolean) => {
      if (!pill) return
      if (pressed) pill.dataset.pressed = 'true'
      else delete pill.dataset.pressed
    }

    const lockPageScroll = () => {
      if (pageLocked) return
      pageLocked = true
      touchEl.dataset.touchLock = 'true'
      document.addEventListener('touchmove', blockPageScroll, { passive: false, capture: true })
    }

    const unlockPageScroll = () => {
      if (!pageLocked) return
      pageLocked = false
      delete touchEl.dataset.touchLock
      document.removeEventListener('touchmove', blockPageScroll, { capture: true } as EventListenerOptions)
    }

    const blockPageScroll = (event: TouchEvent) => {
      event.preventDefault()
    }

    const clearPointerState = () => {
      setPressed(activePill, false)
      pointerId = null
      dragged = false
      touchLike = false
      activePill = null
      delete touchEl.dataset.dragging
      unlockPageScroll()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (pointerId != null) return

      activePill = pillFromTarget(event.target)
      touchLike = isTouchLikePointer(event, coarsePointer)
      pause()
      pointerId = event.pointerId
      startX = event.clientX
      startY = event.clientY
      startOffset = offset
      dragged = false
      setPressed(activePill, true)

      // Immediate vertical lock as soon as finger is on the strip.
      if (touchLike) {
        lockPageScroll()
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', finishPointer)
      window.addEventListener('pointercancel', finishPointer)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return

      const dx = event.clientX - startX
      const dy = event.clientY - startY
      if (!dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return

      if (!dragged) {
        dragged = true
        touchEl.dataset.dragging = 'true'
        setPressed(activePill, false)
        if (touchLike) lockPageScroll()
      }

      // Only horizontal strip movement matters once dragging.
      if (!enabled) return
      event.preventDefault()
      offset = startOffset - dx
      normalizeOffset()
      applyOffset()
    }

    const finishPointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return

      const wasDragged = dragged
      const pill = activePill

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishPointer)
      window.removeEventListener('pointercancel', finishPointer)

      clearPointerState()
      scheduleResume()

      if (wasDragged) {
        // Swallow the synthetic click that would otherwise fire after a drag.
        const blockClick = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault()
          clickEvent.stopImmediatePropagation()
          touchEl.removeEventListener('click', blockClick, true)
        }
        touchEl.addEventListener('click', blockClick, true)
        return
      }

      // Tap on a pill (touch): fire exactly one click, then swallow Safari's delayed ghost click.
      if (pill && touchLike) {
        let passNext = false
        const guard = (clickEvent: MouseEvent) => {
          if (passNext) {
            passNext = false
            return
          }
          clickEvent.preventDefault()
          clickEvent.stopImmediatePropagation()
        }
        touchEl.addEventListener('click', guard, true)
        passNext = true
        pill.click()
        window.setTimeout(() => {
          touchEl.removeEventListener('click', guard, true)
        }, 450)
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (!enabled) return
      if (Math.abs(event.deltaX) < 0.5 && Math.abs(event.deltaY) < 0.5) return
      pause()
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      offset += delta
      normalizeOffset()
      applyOffset()
      scheduleResume()
    }

    const onMouseEnter = () => {
      if (!finePointer.matches) return
      hovering = true
      pause()
    }

    const onMouseLeave = () => {
      if (!finePointer.matches) return
      hovering = false
      scheduleResume()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        pause()
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', finishPointer)
        window.removeEventListener('pointercancel', finishPointer)
        clearPointerState()
        return
      }
      scheduleResume()
    }

    measure()
    if (autoScrollEnabled) paused = false
    raf = window.requestAnimationFrame(tick)

    touchEl.addEventListener('pointerdown', onPointerDown)
    scrollEl.addEventListener('wheel', onWheel, { passive: true })
    touchEl.addEventListener('mouseenter', onMouseEnter)
    touchEl.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(loopEl)
    ro?.observe(scrollEl)
    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(raf)
      clearResume()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishPointer)
      window.removeEventListener('pointercancel', finishPointer)
      clearPointerState()
      ro?.disconnect()
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      touchEl.removeEventListener('pointerdown', onPointerDown)
      scrollEl.removeEventListener('wheel', onWheel)
      touchEl.removeEventListener('mouseenter', onMouseEnter)
      touchEl.removeEventListener('mouseleave', onMouseLeave)
      loopEl.style.transform = ''
      delete touchEl.dataset.dragging
      delete touchEl.dataset.touchLock
    }
  }, [enabled, scrollRef, loopRef, hoverRef, speed, resumeDelayMs])
}
