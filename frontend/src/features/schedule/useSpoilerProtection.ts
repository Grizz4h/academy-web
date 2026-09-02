import { useEffect, useState } from 'react'

export const SPOILER_PROTECTION_STORAGE_KEY = 'academy.spoilerProtection'
export const SPOILER_PROTECTION_EVENT = 'academy-spoiler-protection'

/** Default: on (Ergebnisse ausgeblendet). */
export function isSpoilerProtectionOn(): boolean {
  try {
    const raw = localStorage.getItem(SPOILER_PROTECTION_STORAGE_KEY)
    if (raw === null) return true
    return raw !== '0'
  } catch {
    return true
  }
}

export function setSpoilerProtectionOn(enabled: boolean): void {
  try {
    localStorage.setItem(SPOILER_PROTECTION_STORAGE_KEY, enabled ? '1' : '0')
    window.dispatchEvent(new Event(SPOILER_PROTECTION_EVENT))
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

export function useSpoilerProtection(): [boolean, (next: boolean | ((current: boolean) => boolean)) => void] {
  const [enabled, setEnabled] = useState(isSpoilerProtectionOn)

  useEffect(() => {
    const sync = () => setEnabled(isSpoilerProtectionOn())
    window.addEventListener(SPOILER_PROTECTION_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SPOILER_PROTECTION_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setProtection = (next: boolean | ((current: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(isSpoilerProtectionOn()) : next
    setSpoilerProtectionOn(value)
    setEnabled(value)
  }

  return [enabled, setProtection]
}
