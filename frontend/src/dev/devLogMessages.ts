type ImportScheduleResult = {
  imported_count?: number
  total?: number
  import_source?: string
  months_fetched?: string[]
  created?: number
  updated?: number
  errors?: string[]
}

type ImportAllResult = {
  total?: number
  results?: Array<{
    team?: string
    team_id?: string
    error?: string
    created?: number
    updated?: number
    total_players?: number
  }>
}

export function buildScheduleImportLogDetail(result: ImportScheduleResult): string | undefined {
  const parts: string[] = []
  const source = result.import_source || 'unbekannt'

  if (result.created != null || result.updated != null) {
    parts.push(`Datei: ${result.created ?? 0} neu, ${result.updated ?? 0} aktualisiert`)
  }

  if (source === 'spiele_monat' && Array.isArray(result.months_fetched) && result.months_fetched.length) {
    parts.push(`Monatsseiten: ${result.months_fetched.length} (${result.months_fetched.join(', ')})`)
  }

  const errors = (result.errors || []).filter(Boolean)
  if (errors.length) {
    parts.push(`Hinweise:\n${errors.join('\n')}`)
  }

  return parts.length ? parts.join('\n\n') : undefined
}

export function buildRosterImportAllLogDetail(result: ImportAllResult): string | undefined {
  const results = result.results || []
  const failed = results.filter((item) => item.error)
  const ok = results.filter((item) => !item.error)

  if (failed.length) {
    return [
      `Erfolgreich: ${ok.length}`,
      `Fehler: ${failed.length}`,
      failed.map((item) => `${item.team || item.team_id}: ${item.error}`).join('\n'),
    ].join('\n\n')
  }

  if (!ok.length) return undefined

  const totalPlayers = ok.reduce((sum, item) => sum + (item.total_players || 0), 0)
  const created = ok.reduce((sum, item) => sum + (item.created || 0), 0)
  const updated = ok.reduce((sum, item) => sum + (item.updated || 0), 0)
  return `${ok.length} Teams · ${totalPlayers} Spieler · ${created} neu · ${updated} aktualisiert`
}

export function buildMigrationLogDetail(result: Record<string, unknown>): string | undefined {
  const parts: string[] = []
  if (typeof result.total === 'number') parts.push(`Teams: ${result.total}`)
  if (typeof result.migrated === 'number') parts.push(`Migriert: ${result.migrated}`)
  if (typeof result.skipped === 'number') parts.push(`Übersprungen: ${result.skipped}`)
  return parts.length ? parts.join(' · ') : undefined
}

type GameStatsImportResult = {
  ok?: boolean
  game_id?: string
  external_id?: string
  stats_summary?: {
    team_metrics?: number
    player_rows?: number
    warnings?: string[]
  }
}

export function buildGameStatsImportLogDetail(result: GameStatsImportResult): string | undefined {
  const parts: string[] = []
  if (result.game_id) parts.push(`Game: ${result.game_id}`)
  if (result.external_id) parts.push(`PENNY: ${result.external_id}`)
  const summary = result.stats_summary
  if (summary) {
    parts.push(`Team-Kennzahlen: ${summary.team_metrics ?? 0}`)
    parts.push(`Spielerzeilen: ${summary.player_rows ?? 0}`)
    if (summary.warnings?.length) {
      parts.push(`Warnungen:\n${summary.warnings.join('\n')}`)
    }
  }
  return parts.length ? parts.join('\n') : undefined
}

type GameStatsBatchResult = {
  attempted?: number
  imported?: number
  failed?: number
  saved?: number
  candidates?: number
  results?: Array<{
    game_id?: string
    external_id?: string
    ok?: boolean
    saved?: boolean
    error?: string
    warnings?: string[]
    home_team_name?: string
    away_team_name?: string
    date?: string
    matchday?: number
    stats_summary?: {
      team_metrics?: number
      player_rows?: number
      warnings?: string[]
    }
  }>
}

function formatStatsGameLabel(item: NonNullable<GameStatsBatchResult['results']>[number]): string {
  const day = item.matchday ? `ST ${item.matchday}` : 'ST ?'
  const date = item.date ? item.date.split('-').reverse().join('.') : ''
  const home = item.home_team_name || '?'
  const away = item.away_team_name || '?'
  const rows = item.stats_summary?.player_rows
  const suffix = rows != null ? ` · ${rows} Spielerzeilen` : ''
  return `${day}${date ? ` · ${date}` : ''} · ${home} vs ${away}${suffix}`
}

export function buildGameStatsBatchLogDetail(result: GameStatsBatchResult): string | undefined {
  const parts: string[] = []
  if (result.candidates != null) parts.push(`Kandidaten: ${result.candidates}`)
  if (result.attempted != null) parts.push(`Versucht: ${result.attempted}`)
  if (result.saved != null) parts.push(`Gespeichert: ${result.saved}`)
  if (result.failed != null && result.failed > 0) parts.push(`Fehler: ${result.failed}`)

  const results = result.results || []
  const ok = results.filter((item) => item.ok && item.saved !== false)
  const failed = results.filter((item) => !item.ok || item.saved === false)

  if (ok.length) {
    parts.push(`Erfolgreich (${ok.length}):\n${ok.map(formatStatsGameLabel).join('\n')}`)
  }

  if (failed.length) {
    parts.push(
      `Fehlgeschlagen (${failed.length}):\n${
        failed.map((item) => `${formatStatsGameLabel(item)} — ${item.error || 'Fehler'}`).join('\n')
      }`,
    )
  }

  return parts.length ? parts.join('\n\n') : undefined
}
