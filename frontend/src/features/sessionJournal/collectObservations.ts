import type { Drill, Session } from '../../api'
import {
  formatOptionLabel,
  getPhaseLabel,
  getSessionDrill,
  type JournalSceneEntry,
} from './sessionMeta'

type Point = { x: number; y: number }
type SpatialSnapshot = {
  kind: 'paint' | 'path' | 'placement' | 'marker' | 'zone'
  label: string
  paint?: Array<{ layerId: string; color?: string; strokes: Point[][] }>
  path?: { start: Point; end: Point } | null
  markers?: Point[]
  players?: Array<Point & { label?: string }>
}

const META_KEYS = new Set([
  'id',
  'sceneId',
  'sceneCode',
  'scene_id',
  'scene_code',
  'createdAt',
  'created_at',
  'observationIndex',
  'timestamp',
  'ts',
])

const SPATIAL_KEYS = new Set([
  'rinkAnnotations',
  'annotations',
  'paintAnnotations',
  'directionPath',
  'transitionPath',
  'path',
  'playerPositions',
  'accessLocation',
  'location',
  'marker',
  'wingerLocation',
  'selectedZone',
  'selectedZones',
])

export type JournalFieldRow = {
  key: string
  label: string
  value: string
  kind: 'choice' | 'multi' | 'note' | 'text' | 'other'
}

export type JournalObservation = {
  id: string
  index: number
  phase: string
  phaseLabel: string
  collectionKey: string
  collectionLabel: string
  drillId: string | null
  drillTitle: string | null
  fields: JournalFieldRow[]
  note: string | null
  spatial: SpatialSnapshot | null
  sceneId: string | null
  sceneCode: string | null
  sceneTime: string | null
  scenePeriod: string | null
  scenePeriodLabel: string | null
  /** True when the observation references a scene id that is no longer in the pool. */
  sceneUnavailable: boolean
  raw: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function resolveCollectionKeys(drill: Drill | null): Array<{ key: string; label: string }> {
  const config = (drill?.config || {}) as Record<string, unknown>
  const keys: Array<{ key: string; label: string }> = []
  const push = (key: unknown, label: unknown, fallbackLabel: string) => {
    const k = String(key || '').trim()
    if (!k || keys.some((entry) => entry.key === k)) return
    keys.push({ key: k, label: String(label || '').trim() || fallbackLabel })
  }

  push(config.sample_key, config.sample_label, 'Beobachtung')
  push(config.event_key, config.event_label, 'Event')
  push(config.observations_key, config.observation_label || config.sample_label, 'Beobachtung')
  push(config.logs_key, config.logs_label, 'Beobachtung')

  // Common fallbacks when snapshot config is sparse
  for (const fallback of ['observations', 'savedObservations', 'rinkObservations', 'samples', 'events']) {
    push(fallback, null, 'Beobachtung')
  }
  return keys
}

function labelForKey(drill: Drill | null, key: string): string {
  const config = (drill?.config || {}) as Record<string, unknown>
  const map: Record<string, unknown> = {
    [String(config.state_key || 'state')]: config.state_label || 'Zustand',
    [String(config.factor_key || 'factor')]: config.factor_label || 'Funktion',
    [String(config.quality_key || '')]: config.quality_label || 'Qualität',
    [String(config.note_key || 'note')]: config.note_label || 'Notiz',
    [String(config.sample_note_key || '')]: config.sample_note_label || 'Notiz',
  }

  const observationNote = asRecord(config.observation_note)
  if (observationNote) {
    const noteKey = String(observationNote.key || 'note')
    map[noteKey] = observationNote.label || 'Notiz'
  }

  const sections = Array.isArray(config.observation_sections) ? config.observation_sections : []
  for (const section of sections) {
    const row = asRecord(section)
    if (!row) continue
    const sectionKey = String(row.key || '').trim()
    if (!sectionKey) continue
    map[sectionKey] = row.label || row.title || row.field_label || sectionKey
  }

  const fields = Array.isArray(config.fields) ? config.fields : []
  for (const field of fields) {
    const row = asRecord(field)
    if (!row) continue
    const fieldKey = String(row.key || '').trim()
    if (!fieldKey) continue
    map[fieldKey] = row.label || fieldKey
  }

  const observationFields = Array.isArray(config.observation_fields) ? config.observation_fields : []
  for (const field of observationFields) {
    const row = asRecord(field)
    if (!row) continue
    const fieldKey = String(row.key || '').trim()
    if (!fieldKey) continue
    map[fieldKey] = row.label || fieldKey
  }

  if (map[key]) return String(map[key])
  return formatOptionLabel(key)
}

function resolveOptionLabel(drill: Drill | null, key: string, rawValue: string): string {
  const config = (drill?.config || {}) as Record<string, unknown>
  const inline = asRecord(config.inline_explanations)
  if (inline && asRecord(inline[rawValue])?.meaning) {
    // Prefer human option text; meaning is available elsewhere if needed
  }

  const observationFields = Array.isArray(config.observation_fields) ? config.observation_fields : []
  for (const field of observationFields) {
    const row = asRecord(field)
    if (!row || String(row.key || '') !== key) continue
    const options = Array.isArray(row.options) ? row.options : []
    for (const opt of options) {
      if (typeof opt === 'string' && opt === rawValue) return formatOptionLabel(opt)
      const optRow = asRecord(opt)
      if (!optRow) continue
      if (String(optRow.value || '') === rawValue) {
        return String(optRow.label || optRow.value || rawValue)
      }
    }
  }

  const sections = Array.isArray(config.observation_sections) ? config.observation_sections : []
  for (const section of sections) {
    const row = asRecord(section)
    if (!row || String(row.key || '') !== key) continue
    const options = Array.isArray(row.options) ? row.options : []
    for (const opt of options) {
      if (typeof opt === 'string' && opt === rawValue) return formatOptionLabel(opt)
      const optRow = asRecord(opt)
      if (!optRow) continue
      if (String(optRow.value || '') === rawValue || String(optRow.label || '') === rawValue) {
        return String(optRow.label || optRow.value || rawValue)
      }
    }
  }

  return formatOptionLabel(rawValue)
}

function formatValue(drill: Drill | null, key: string, value: unknown): JournalFieldRow | null {
  if (value == null) return null
  if (META_KEYS.has(key) || SPATIAL_KEYS.has(key)) return null
  if (key.startsWith('__')) return null

  const label = labelForKey(drill, key)
  const noteKeys = new Set([
    String(((drill?.config || {}) as Record<string, unknown>).note_key || 'note'),
    String(((drill?.config || {}) as Record<string, unknown>).sample_note_key || ''),
    'note',
    'evidence',
    'evidence_text',
  ].filter(Boolean))

  if (Array.isArray(value)) {
    const parts = value.map((item) => String(item || '').trim()).filter(Boolean)
    if (!parts.length) return null
    return {
      key,
      label,
      value: parts.map((part) => resolveOptionLabel(drill, key, part)).join(' · '),
      kind: 'multi',
    }
  }

  if (typeof value === 'boolean') {
    return { key, label, value: value ? 'Ja' : 'Nein', kind: 'other' }
  }

  if (typeof value === 'number') {
    return { key, label, value: String(value), kind: 'other' }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (noteKeys.has(key) || /note|notiz|evidence|beleg/i.test(key)) {
      return { key, label, value: trimmed, kind: 'note' }
    }
    return {
      key,
      label,
      value: resolveOptionLabel(drill, key, trimmed),
      kind: 'choice',
    }
  }

  if (typeof value === 'object') {
    // Skip nested objects (spatial blobs etc.) — spatial handled separately
    return null
  }

  return null
}

function extractNote(fields: JournalFieldRow[]): string | null {
  const note = fields.find((field) => field.kind === 'note')
  return note?.value || null
}

function readPoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== 'object') return null
  const row = value as { x?: unknown; y?: unknown }
  if (!Number.isFinite(Number(row.x)) || !Number.isFinite(Number(row.y))) return null
  return { x: Number(row.x), y: Number(row.y) }
}

function extractPaint(raw: unknown): NonNullable<SpatialSnapshot['paint']> {
  if (!Array.isArray(raw)) return []
  const layers: NonNullable<SpatialSnapshot['paint']> = []
  raw.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return
    const layer = item as { layerId?: string; color?: string; strokes?: unknown }
    const strokesRaw = Array.isArray(layer.strokes) ? layer.strokes : []
    const strokes = []
    for (const stroke of strokesRaw) {
      if (!Array.isArray(stroke)) continue
      const pts = stroke.map(readPoint).filter((p): p is { x: number; y: number } => !!p)
      if (pts.length) strokes.push(pts)
    }
    if (!strokes.length) return
    layers.push({
      layerId: layer.layerId || `layer-${idx}`,
      color: typeof layer.color === 'string' ? layer.color : undefined,
      strokes,
    })
  })
  return layers
}

function extractPath(raw: unknown): NonNullable<SpatialSnapshot['path']> | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const start = readPoint(obj.start) || readPoint(obj.from) || readPoint(obj.a)
  const end = readPoint(obj.end) || readPoint(obj.to) || readPoint(obj.b)
  if (start && end) return { start, end }
  return null
}

function spatialFromEntry(entry: Record<string, unknown>): SpatialSnapshot | null {
  for (const key of ['rinkAnnotations', 'annotations', 'paintAnnotations']) {
    const paint = extractPaint(entry[key])
    if (paint.length) return { kind: 'paint', label: 'Paint', paint }
  }
  for (const key of ['directionPath', 'transitionPath', 'path']) {
    const path = extractPath(entry[key])
    if (path) return { kind: 'path', label: 'Pfad', path }
  }
  if (Array.isArray(entry.playerPositions) && entry.playerPositions.length) {
    const players: Array<Point & { label?: string }> = []
    for (const p of entry.playerPositions) {
      const pt = readPoint(p)
      if (!pt) continue
      const label = typeof (p as { position?: string }).position === 'string'
        ? String((p as { position?: string }).position)
        : undefined
      players.push({ ...pt, label })
    }
    if (players.length) return { kind: 'placement', label: 'Placement', players }
  }
  for (const key of ['wingerLocation', 'accessLocation', 'location', 'marker']) {
    const point = readPoint(entry[key])
    if (point) return { kind: 'marker', label: 'Marker', markers: [point] }
  }
  return null
}

function sceneForObservation(
  entry: Record<string, unknown>,
  scenes: JournalSceneEntry[],
): JournalSceneEntry | null {
  const sceneId = String(entry.sceneId || entry.scene_id || '').trim()
  const observationId = String(entry.id || '').trim()
  if (sceneId) {
    const byId = scenes.find((scene) => scene.id === sceneId)
    if (byId) return byId
  }
  if (observationId) {
    const byObs = scenes.find((scene) => scene.observation_id === observationId)
    if (byObs) return byObs
  }
  return null
}

/**
 * Collect human-readable observations from session checkins using the
 * session's drill config snapshot. No invented categories.
 */
export function collectSessionObservations(
  session: Session,
  scenes: JournalSceneEntry[] = [],
): JournalObservation[] {
  const drill = getSessionDrill(session)
  const collectionKeys = resolveCollectionKeys(drill)
  const out: JournalObservation[] = []
  let index = 0

  for (const checkin of session.checkins || []) {
    const answers = asRecord(checkin.answers)
    if (!answers) continue
    const phase = String(checkin.phase || '').trim() || '—'

    for (const { key, label } of collectionKeys) {
      const bucket = answers[key]
      if (!Array.isArray(bucket)) continue
      for (const item of bucket) {
        const entry = asRecord(item)
        if (!entry) continue

        const fields: JournalFieldRow[] = []
        for (const [fieldKey, fieldValue] of Object.entries(entry)) {
          const row = formatValue(drill, fieldKey, fieldValue)
          if (row) fields.push(row)
        }

        const spatial = spatialFromEntry(entry)
        const linkedScene = sceneForObservation(entry, scenes)
        const referencedSceneId = String(entry.sceneId || entry.scene_id || '').trim()
        const sceneUnavailable = Boolean(referencedSceneId) && !linkedScene
        const note = extractNote(fields)
        const choiceFields = fields.filter((field) => field.kind !== 'note')
        const entrySceneTime = String(entry.game_time || entry.sceneTime || '').trim() || null
        const entrySceneCode = String(entry.sceneCode || entry.scene_code || '').trim() || null

        // Skip empty shells
        if (!choiceFields.length && !note && !spatial && !linkedScene && !entrySceneTime && !sceneUnavailable) continue

        index += 1
        out.push({
          id: String(entry.id || `${phase}-${key}-${index}`),
          index,
          phase,
          phaseLabel: getPhaseLabel(phase),
          collectionKey: key,
          collectionLabel: label,
          drillId: drill?.id || null,
          drillTitle: drill?.title || null,
          fields: choiceFields,
          note,
          spatial,
          // Only link when the Scene.id still resolves in the pool (stable identity).
          sceneId: linkedScene?.id || null,
          sceneCode: linkedScene?.scene_code || entrySceneCode,
          sceneTime: linkedScene?.game_time || entrySceneTime,
          scenePeriod: linkedScene?.period || null,
          scenePeriodLabel: linkedScene?.period ? getPhaseLabel(linkedScene.period) : null,
          sceneUnavailable,
          raw: entry,
        })
      }
    }
  }

  return out
}

export function countSessionObservations(session: Session): number {
  return collectSessionObservations(session).length
}
