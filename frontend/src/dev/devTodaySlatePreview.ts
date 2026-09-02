import { useEffect, useState } from 'react'

const STORAGE_KEY = 'academy.devTodaySlatePreview'

export const DEV_TODAY_SLATE_EVENT = 'academy-dev-today-slate'

export function isDevTodaySlatePreviewEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setDevTodaySlatePreviewEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(DEV_TODAY_SLATE_EVENT))
  } catch {
    // ignore storage errors
  }
}

/** Reactive dev toggle — same flag as DevLab „Dummy-Spieltag“. */
export function useDevTodaySlatePreview(): boolean {
  const [enabled, setEnabled] = useState(isDevTodaySlatePreviewEnabled)
  useEffect(() => {
    const sync = () => setEnabled(isDevTodaySlatePreviewEnabled())
    window.addEventListener(DEV_TODAY_SLATE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(DEV_TODAY_SLATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return enabled
}
