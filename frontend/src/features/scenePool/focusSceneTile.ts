/**
 * Deep-link helpers for focusing a Scene Pool tile by stable Scene.id.
 * Route: /ringabout?scene=<Scene.id>&session_id=<optional>
 * Also accepts legacy hash #scene-<Scene.id>.
 */

export function buildScenePoolFocusHref(options: {
  sceneId: string
  sessionId?: string | null
}): string {
  const sceneId = String(options.sceneId || '').trim()
  const params = new URLSearchParams()
  const sessionId = String(options.sessionId || '').trim()
  if (sessionId) params.set('session_id', sessionId)
  if (sceneId) params.set('scene', sceneId)
  const query = params.toString()
  return query ? `/ringabout?${query}` : '/ringabout'
}

export function readSceneFocusId(
  searchParams: { get: (key: string) => string | null },
  hash = '',
): string | null {
  const fromQuery = String(searchParams.get('scene') || '').trim()
  if (fromQuery) return fromQuery
  const normalizedHash = String(hash || '').trim()
  const match = normalizedHash.match(/^#scene-(.+)$/i)
  if (!match) return null
  const fromHash = String(match[1] || '').trim()
  return fromHash || null
}

export function sceneDomId(sceneId: string): string {
  return `scene-${String(sceneId || '').trim()}`
}

/**
 * Wait until an element with the given id exists in the document, then resolve it.
 * Uses MutationObserver + rAF — not a blind timeout.
 */
export function waitForElementById(
  id: string,
  options?: {
    root?: ParentNode
    timeoutMs?: number
    signal?: AbortSignal
  },
): Promise<HTMLElement | null> {
  const root = options?.root || (typeof document !== 'undefined' ? document : null)
  const timeoutMs = options?.timeoutMs ?? 8000
  const signal = options?.signal
  if (!root || !id) return Promise.resolve(null)

  const existing = root.querySelector(`#${CSS.escape(id)}`)
  if (existing instanceof HTMLElement) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (node: HTMLElement | null) => {
      if (settled) return
      settled = true
      observer.disconnect()
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve(node)
    }

    const onAbort = () => finish(null)
    signal?.addEventListener('abort', onAbort, { once: true })

    const observer = new MutationObserver(() => {
      const node = root.querySelector(`#${CSS.escape(id)}`)
      if (node instanceof HTMLElement) finish(node)
    })
    observer.observe(root, { childList: true, subtree: true })

    const timer = window.setTimeout(() => finish(null), timeoutMs)

    // Also check on next frames in case the node appears without a mutation burst.
    requestAnimationFrame(() => {
      const node = root.querySelector(`#${CSS.escape(id)}`)
      if (node instanceof HTMLElement) finish(node)
    })
  })
}

export const SCENE_FOCUS_HIGHLIGHT_MS = 2200
