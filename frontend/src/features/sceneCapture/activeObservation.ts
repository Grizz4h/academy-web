/** Active drill observation draft — shared between capture UI and observation renderers. */

export const ACTIVE_OBSERVATION_DRAFT_KEY = '__active_observation_draft'

export type ActiveObservationDraft = {
  id: string
  sessionId: string
  phase: string
  drillId: string
  drillTitle: string
  /** sample_key / event_key in phase answers */
  collectionKey: string
  /** Human label, e.g. "Unterstützungsmoment" */
  label: string
  /** Set when a scene was captured against this draft */
  sceneId?: string | null
  sceneCode?: string | null
}

export function createObservationId(prefix = 'obs'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function readActiveObservationDraft(
  answers: Record<string, unknown> | null | undefined,
): ActiveObservationDraft | null {
  const raw = answers?.[ACTIVE_OBSERVATION_DRAFT_KEY]
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = String(row.id || '').trim()
  const sessionId = String(row.sessionId || '').trim()
  const phase = String(row.phase || '').trim()
  const drillId = String(row.drillId || '').trim()
  const collectionKey = String(row.collectionKey || '').trim()
  const label = String(row.label || '').trim()
  if (!id || !sessionId || !phase || !drillId || !collectionKey || !label) return null
  return {
    id,
    sessionId,
    phase,
    drillId,
    drillTitle: String(row.drillTitle || '').trim(),
    collectionKey,
    label,
    sceneId: row.sceneId == null ? null : String(row.sceneId),
    sceneCode: row.sceneCode == null ? null : String(row.sceneCode),
  }
}

export function withActiveObservationDraft(
  answers: Record<string, unknown>,
  draft: ActiveObservationDraft | null,
): Record<string, unknown> {
  const next = { ...answers }
  if (!draft) {
    delete next[ACTIVE_OBSERVATION_DRAFT_KEY]
    return next
  }
  next[ACTIVE_OBSERVATION_DRAFT_KEY] = draft
  return next
}
