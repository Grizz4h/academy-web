import { useCallback, useEffect, useRef, useState } from 'react'

function bindDockSentinel(node: HTMLDivElement, setDocked: (docked: boolean) => void) {
  let docked = false

  const update = () => {
    const rect = node.getBoundingClientRect()
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const reserveHeight = Math.max(node.offsetHeight, 72)
    const parkLine = viewportHeight - 4
    let nextDocked = docked

    if (!docked) {
      nextDocked = rect.bottom <= parkLine
    } else {
      nextDocked = rect.top <= parkLine - reserveHeight + 12
    }

    if (nextDocked !== docked) {
      docked = nextDocked
      setDocked(docked)
    }
  }

  update()

  const observer = new IntersectionObserver(update, {
    root: null,
    threshold: [0, 0.01, 0.5, 1],
  })
  observer.observe(node)

  window.addEventListener('scroll', update, { passive: true, capture: true })
  window.addEventListener('resize', update)
  document.addEventListener('scroll', update, { passive: true, capture: true })
  window.visualViewport?.addEventListener('scroll', update)
  window.visualViewport?.addEventListener('resize', update)

  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(update)
    : null
  resizeObserver?.observe(node)

  return () => {
    observer.disconnect()
    resizeObserver?.disconnect()
    window.removeEventListener('scroll', update, true)
    window.removeEventListener('resize', update)
    document.removeEventListener('scroll', update, true)
    window.visualViewport?.removeEventListener('scroll', update)
    window.visualViewport?.removeEventListener('resize', update)
  }
}

export function useScrollDockEnd(enabled: boolean, resetKey: string | number = 0): {
  sentinelRef: (node: HTMLDivElement | null) => void
  docked: boolean
} {
  const cleanupRef = useRef<(() => void) | null>(null)
  const [docked, setDocked] = useState(false)

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (!enabled || !node) {
      setDocked(false)
      return
    }

    cleanupRef.current = bindDockSentinel(node, setDocked)
  }, [enabled, resetKey])

  useEffect(() => () => {
    cleanupRef.current?.()
  }, [])

  return { sentinelRef, docked }
}
