/**
 * Share helpers: Web Share API with clipboard fallback.
 */

export type SharePayload = {
  title: string
  text: string
  url?: string
}

export async function shareOrCopy(payload: SharePayload): Promise<'shared' | 'copied'> {
  const shareData: ShareData = {
    title: payload.title,
    text: payload.text,
    url: payload.url || (typeof window !== 'undefined' ? window.location.href : undefined),
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (err) {
      // User cancel — treat as soft abort by rethrowing AbortError
      if ((err as Error)?.name === 'AbortError') throw err
      // Fall through to clipboard
    }
  }

  const clip = [payload.title, payload.text, shareData.url].filter(Boolean).join('\n')
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(clip)
    return 'copied'
  }

  // Last resort: prompt
  window.prompt('Kopieren:', clip)
  return 'copied'
}
