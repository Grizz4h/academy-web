export type DevLogLevel = 'info' | 'success' | 'error' | 'warn' | 'pending'

export type DevLogEntry = {
  id: string
  at: string
  level: DevLogLevel
  action: string
  message: string
  detail?: string
}

const MAX_LOG_ENTRIES = 120

export function formatDevError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    const detail = record.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim()
    }
    if (detail && typeof detail === 'object') {
      const detailRecord = detail as Record<string, unknown>
      if (typeof detailRecord.error === 'string') {
        return detailRecord.error
      }
      if (Array.isArray(detailRecord.errors)) {
        return detailRecord.errors.map(String).join(' · ')
      }
    }
    if (typeof record.error === 'string') {
      return record.error
    }
  }
  return 'Unbekannter Fehler'
}

export function formatDevDetail(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (Array.isArray(value)) {
    const items = value.map(String).filter(Boolean)
    return items.length ? items.join('\n') : undefined
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function createDevLogEntry(
  entry: Omit<DevLogEntry, 'id' | 'at'> & { at?: string },
): DevLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at || new Date().toISOString(),
    level: entry.level,
    action: entry.action,
    message: entry.message,
    detail: entry.detail,
  }
}

export function prependDevLogEntry(
  entries: DevLogEntry[],
  entry: Omit<DevLogEntry, 'id' | 'at'> & { at?: string },
): DevLogEntry[] {
  return [createDevLogEntry(entry), ...entries].slice(0, MAX_LOG_ENTRIES)
}

export function formatDevLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}
