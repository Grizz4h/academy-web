import { TUTORIAL_TARGET } from './ids'

const DEFAULT_TIMEOUT_MS = 2800

function isRendered(node: HTMLElement): boolean {
  if (node.getClientRects().length === 0) return false
  const style = window.getComputedStyle(node)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

export function queryTutorialTarget(targetId: string): HTMLElement | null {
  if (!targetId || typeof document === 'undefined') return null
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial-id="${cssEscape(targetId)}"]`))
  if (nodes.length === 0) return null
  const scored = nodes
    .map((node) => {
      const rect = node.getBoundingClientRect()
      const area = isRendered(node)
        ? Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
          * Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
        : 0
      const sticky = Boolean(node.closest('[data-session-sticky="true"]'))
      const enabled = !(node instanceof HTMLButtonElement && node.disabled)
      return { node, area, sticky, enabled }
    })
    .sort((a, b) => {
      if (a.sticky !== b.sticky) return a.sticky ? -1 : 1
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return b.area - a.area
    })
  return scored.find((item) => item.area > 0)?.node || scored[0]?.node || nodes[0]
}

function isDisabledControl(node: HTMLElement | null): boolean {
  if (!node) return false
  if (node instanceof HTMLButtonElement && node.disabled) return true
  if (node instanceof HTMLAnchorElement && node.getAttribute('aria-disabled') === 'true') return true
  const inner = node.querySelector('button, a')
  return inner instanceof HTMLButtonElement && inner.disabled
}

/** If the configured CTA is still disabled, highlight the lesson instead. */
export function resolveLiveTutorialTarget(targetId: string): HTMLElement | null {
  const node = queryTutorialTarget(targetId)
  if (isDisabledControl(node) && targetId === TUTORIAL_TARGET.sessionAdvance) {
    return queryTutorialTarget(TUTORIAL_TARGET.sessionDrill) || node
  }
  return node
}

export function shouldScrollToTarget(node: HTMLElement): boolean {
  if (isDisabledControl(node)) return false
  if (node.closest('[data-session-sticky="true"]')) return false
  return window.getComputedStyle(node).position !== 'fixed'
}

export function waitForTarget(
  targetId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<HTMLElement | null> {
  const existing = queryTutorialTarget(targetId)
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (node: HTMLElement | null) => {
      if (settled) return
      settled = true
      observer.disconnect()
      window.clearTimeout(timer)
      resolve(node)
    }

    const observer = new MutationObserver(() => {
      const found = queryTutorialTarget(targetId)
      if (found) finish(found)
    })

    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    const timer = window.setTimeout(() => finish(queryTutorialTarget(targetId)), timeoutMs)
  })
}

export function scrollTargetIntoView(el: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const large = el.getBoundingClientRect().height > window.innerHeight * 0.42
  el.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: large ? 'start' : 'center',
    inline: 'nearest',
  })
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/"/g, '\\"')
}
