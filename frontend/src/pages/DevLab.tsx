import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { getHiddenNavTabs, isDevNavEnabled, setDevNavEnabled } from '../config/featureFlags'
import DevActionLogPanel from '../components/dev/DevActionLogPanel'
import ProgressionPersonaSimPanel from '../components/dev/ProgressionPersonaSimPanel'
import {
  buildGameStatsBatchLogDetail,
  buildGameStatsImportLogDetail,
  buildMigrationLogDetail,
  buildRosterImportAllLogDetail,
  buildScheduleImportLogDetail,
} from '../dev/devLogMessages'
import {
  formatDevError,
  prependDevLogEntry,
  type DevLogEntry,
} from '../dev/devActionLog'
import {
  createDummySessionForDrill,
  deleteAllDummySessions,
  getDummySessionPath,
} from '../dev/createDummySession'
import {
  DEV_LAST_PUX_GRANT_KEY,
  DEV_REWARDS_STORAGE_KEY,
  isFloatingRewardDevToolsEnabled,
  REWARD_PREVIEW_BRONZE,
  REWARD_PREVIEW_GOLD,
  REWARD_PREVIEW_MASTERY,
  REWARD_PREVIEW_QUEUE,
  REWARD_PREVIEW_SESSION_QUEUE,
  REWARD_PREVIEW_SILVER,
  setFloatingRewardDevToolsEnabled,
} from '../dev/rewardPreviewActions'
import { selectLevelProgress } from '../features/progression'
import { useRewards } from '../features/rewards'
import { formatPux } from '../features/rewards/types'
import { countDummySessions, getRealSessions } from '../utils/sessionEligibility'
import { getDevLocationScenario, setDevLocationScenario, type DevLocationScenario } from '../features/location'
import { UiButton, UiButtonLink } from '../components/ui'
import styles from './DevLab.module.css'

export default function DevLab() {
  const { user } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { rewardState, enqueueReward, enqueueRewards, rebuildProgression, bootstrapStatus } = useRewards()
  const hidden = getHiddenNavTabs()
  const level = selectLevelProgress(rewardState)

  const [devNavOn, setDevNavOn] = useState(() => isDevNavEnabled())
  const [floatRewardsOn, setFloatRewardsOn] = useState(() => isFloatingRewardDevToolsEnabled())
  const [logEntries, setLogEntries] = useState<DevLogEntry[]>([])
  const [diagCopied, setDiagCopied] = useState(false)
  const [delSeason, setDelSeason] = useState('2025/26')
  const [statsBatchLimit, setStatsBatchLimit] = useState(5)
  const [statsGameId, setStatsGameId] = useState('')
  const [locationScenario, setLocationScenario] = useState<DevLocationScenario>(() => getDevLocationScenario())

  const appendLog = useCallback((entry: Omit<DevLogEntry, 'id' | 'at'> & { at?: string }) => {
    setLogEntries((prev) => prependDevLogEntry(prev, entry))
  }, [])

  const clearLog = useCallback(() => setLogEntries([]), [])

  const { data: delDataStatus, refetch: refetchDelStatus } = useQuery({
    queryKey: ['del-data-status', delSeason],
    queryFn: () => api.getDelDataStatus(delSeason, 'DEL'),
    enabled: Boolean(user),
  })

  const { data: delSeasonGames, refetch: refetchDelGames } = useQuery({
    queryKey: ['games', 'DEL', delSeason],
    queryFn: () => api.getGames({ league: 'DEL', season: delSeason }),
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  const gamesWithStats = useMemo(
    () => (delSeasonGames?.games || []).filter((game) => Boolean(game.stats?.imported_at)),
    [delSeasonGames?.games],
  )

  const { data: importableTeamsData } = useQuery({
    queryKey: ['importable-teams'],
    queryFn: () => api.getImportableTeams(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  })

  const importableTeams = importableTeamsData?.teams || []

  const importScheduleMutation = useMutation({
    mutationFn: () => api.importDelSchedule(delSeason, 'DEL'),
    onMutate: () => {
      appendLog({
        level: 'pending',
        action: 'Spielplan sync',
        message: `Import startet für ${delSeason}…`,
      })
    },
    onSuccess: (result) => {
      const count = result.imported_count || result.total || 0
      const months = Array.isArray(result.months_fetched) ? result.months_fetched.join(', ') : ''
      const source = result.import_source || 'unbekannt'
      appendLog({
        level: 'success',
        action: 'Spielplan sync',
        message: `${count} Spiele importiert · Quelle: ${source}${months ? ` · Monate: ${months}` : ''}`,
        detail: buildScheduleImportLogDetail(result),
      })
      refetchDelStatus()
      queryClient.invalidateQueries({ queryKey: ['games'] })
      refetchDelGames()
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Spielplan sync',
        message: formatDevError(err),
      })
    },
  })

  const importRostersMutation = useMutation({
    mutationFn: () => api.importAllPlayers(delSeason, 'DEL'),
    onMutate: () => {
      appendLog({
        level: 'pending',
        action: 'Kader sync (alle)',
        message: `Alle Kader werden für ${delSeason} synchronisiert…`,
      })
    },
    onSuccess: (result) => {
      const failed = (result.results || []).filter((item) => item.error)
      appendLog({
        level: failed.length ? 'warn' : 'success',
        action: 'Kader sync (alle)',
        message: `${result.total} Team(s) verarbeitet (${delSeason})`,
        detail: buildRosterImportAllLogDetail(result),
      })
      refetchDelStatus()
      queryClient.invalidateQueries({ queryKey: ['team-players'] })
      queryClient.invalidateQueries({ queryKey: ['roster'] })
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Kader sync (alle)',
        message: formatDevError(err),
      })
    },
  })

  const importTeamRosterMutation = useMutation({
    mutationFn: (targetTeamId: string) => api.importPlayers(targetTeamId, delSeason, 'DEL'),
    onMutate: (targetTeamId) => {
      const team = importableTeams.find((item) => item.id === targetTeamId || item.catalog_id === targetTeamId)
      appendLog({
        level: 'pending',
        action: 'Kader sync (Team)',
        message: `${team?.name || targetTeamId} · ${delSeason}…`,
      })
    },
    onSuccess: (result) => {
      appendLog({
        level: result.error ? 'warn' : 'success',
        action: 'Kader sync (Team)',
        message: result.error
          ? `${result.team || result.team_id}: ${result.error}`
          : `${result.team || result.team_id}: ${result.created} neu, ${result.updated} aktualisiert (${result.total_players} Spieler)`,
        detail: result.url ? `Quelle: ${result.url}` : undefined,
      })
      refetchDelStatus()
      queryClient.invalidateQueries({ queryKey: ['team-players'] })
      queryClient.invalidateQueries({ queryKey: ['roster'] })
    },
    onError: (err: Error, targetTeamId) => {
      appendLog({
        level: 'error',
        action: 'Kader sync (Team)',
        message: `${targetTeamId}: ${formatDevError(err)}`,
      })
    },
  })

  const migrateRostersMutation = useMutation({
    mutationFn: () => api.migrateDelRosters(delSeason, 'DEL'),
    onMutate: () => {
      appendLog({
        level: 'pending',
        action: 'Legacy-Migration',
        message: `Migration startet für ${delSeason}…`,
      })
    },
    onSuccess: (result) => {
      appendLog({
        level: 'success',
        action: 'Legacy-Migration',
        message: `${result.total} Team(s) migriert`,
        detail: buildMigrationLogDetail(result as Record<string, unknown>),
      })
      refetchDelStatus()
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Legacy-Migration',
        message: formatDevError(err),
      })
    },
  })

  const importGameStatsBatchMutation = useMutation({
    mutationFn: () => api.importDelGameStatsBatch({
      season: delSeason,
      league: 'DEL',
      limit: statsBatchLimit,
      skipExisting: true,
    }),
    onMutate: () => {
      appendLog({
        level: 'pending',
        action: 'Spielstats sync',
        message: `Batch-Import startet (${delSeason}, max ${statsBatchLimit})…`,
      })
    },
    onSuccess: (result) => {
      const failed = result.failed || 0
      const saved = result.saved ?? result.imported ?? 0
      appendLog({
        level: failed ? 'warn' : 'success',
        action: 'Spielstats sync',
        message: `${saved} gespeichert · ${result.attempted ?? 0} versucht (${delSeason}) — Details im Log aufklappen`,
        detail: buildGameStatsBatchLogDetail(result),
      })
      refetchDelStatus()
      queryClient.invalidateQueries({ queryKey: ['games'] })
      refetchDelGames()
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Spielstats sync',
        message: formatDevError(err),
      })
    },
  })

  const importGameStatsSingleMutation = useMutation({
    mutationFn: (gameId: string) => api.importDelGameStats(gameId),
    onMutate: (gameId) => {
      appendLog({
        level: 'pending',
        action: 'Spielstats (1 Spiel)',
        message: `Import startet für ${gameId}…`,
      })
    },
    onSuccess: (result) => {
      appendLog({
        level: 'success',
        action: 'Spielstats (1 Spiel)',
        message: `Stats importiert · ${result.stats_summary?.player_rows ?? 0} Spielerzeilen`,
        detail: buildGameStatsImportLogDetail(result),
      })
      refetchDelStatus()
      queryClient.invalidateQueries({ queryKey: ['games'] })
      refetchDelGames()
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Spielstats (1 Spiel)',
        message: formatDevError(err),
      })
    },
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user),
  })

  const { data: scenesData } = useQuery({
    queryKey: ['scenes'],
    queryFn: () => api.getScenes(),
    enabled: Boolean(user),
  })

  const sessionList = sessions || []
  const dummyCount = countDummySessions(sessionList)
  const realCount = getRealSessions(sessionList).length
  const sceneCount = scenesData?.scenes?.length || 0

  const firstDrill = useMemo(() => {
    for (const track of curriculum?.tracks || []) {
      for (const module of track.modules || []) {
        if (module.active === false) continue
        const drill = module.drills?.[0]
        if (drill?.id) {
          return { moduleId: module.id, drillId: drill.id, title: drill.title || drill.id }
        }
      }
    }
    return null
  }, [curriculum])

  const diagnostics = useMemo(() => ({
    user,
    bootstrapStatus,
    level: level.level,
    xp: level.totalXp,
    pux: rewardState.currency?.PUX || 0,
    achievements: Object.keys(rewardState.unlockedAchievements || {}).length,
    cosmetics: Object.keys(rewardState.unlockedCosmetics || {}).length,
    sessions: sessionList.length,
    realSessions: realCount,
    dummySessions: dummyCount,
    scenes: sceneCount,
    flags: {
      devNav: isDevNavEnabled(),
      floatingRewards: isFloatingRewardDevToolsEnabled(),
    },
    href: typeof window !== 'undefined' ? window.location.href : '',
  }), [
    user,
    bootstrapStatus,
    level.level,
    level.totalXp,
    rewardState,
    sessionList.length,
    realCount,
    dummyCount,
    sceneCount,
  ])

  const createDummyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nicht angemeldet')
      if (!firstDrill) throw new Error('Kein Drill im Curriculum gefunden')
      return createDummySessionForDrill({
        user,
        curriculum,
        drillId: firstDrill.drillId,
        moduleId: firstDrill.moduleId,
      })
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      appendLog({
        level: 'success',
        action: 'Dummy-Session',
        message: `Erstellt · Modul ${session.module_id}`,
        detail: `Session-ID: ${session.id}`,
      })
      navigate(getDummySessionPath(session))
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Dummy-Session',
        message: formatDevError(err),
      })
    },
  })

  const deleteDummiesMutation = useMutation({
    mutationFn: async () => deleteAllDummySessions(sessionList),
    onMutate: () => {
      appendLog({
        level: 'pending',
        action: 'Dummy-Cleanup',
        message: `Lösche ${dummyCount} Dummy-Session(s)…`,
      })
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['scenes'] })
      appendLog({
        level: 'success',
        action: 'Dummy-Cleanup',
        message: `${result.deletedSessions} Sessions, ${result.deletedScenes} Szenen gelöscht`,
      })
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'Dummy-Cleanup',
        message: formatDevError(err),
      })
    },
  })

  const [lastDevPuxDelta, setLastDevPuxDelta] = useState<number | null>(() => {
    try {
      const raw = sessionStorage.getItem(DEV_LAST_PUX_GRANT_KEY)
      if (!raw) return null
      const parsed = Number(raw)
      return Number.isFinite(parsed) && parsed !== 0 ? parsed : null
    } catch {
      return null
    }
  })

  const grantPuxMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!amount) throw new Error('Betrag fehlt')
      const current = Number(rewardState.currency?.PUX || 0)
      if (current + amount < 0) {
        throw new Error(`Nicht genug PUX (aktuell ${current})`)
      }
      const eventId = `dev:grant_pux:${amount > 0 ? 'add' : 'sub'}:${Date.now()}`
      const evaluatedAt = new Date().toISOString()
      const signed = amount > 0 ? `+${amount}` : `${amount}`
      const response = await api.applyRewardResult({
        event_id: eventId,
        evaluated_at: evaluatedAt,
        granted_pux: amount,
        granted_xp: 0,
        reward_events: [
          {
            id: eventId,
            kind: 'currency',
            title: `DEV · ${signed} PUX`,
            description: 'Dev-Cockpit Grant',
            amountPux: amount,
            variant: 'popup',
            visualTier: amount > 0 ? 'gold' : 'silver',
          },
        ],
        unlocked_achievements: [],
        unlocked_masteries: [],
        skip_idempotency: true,
      })
      if (response.applied === false) {
        throw new Error(response.reason || 'PUX-Änderung abgelehnt')
      }
      return amount
    },
    onSuccess: (amount) => {
      try {
        sessionStorage.setItem(DEV_LAST_PUX_GRANT_KEY, String(amount))
      } catch {
        // ignore
      }
      setLastDevPuxDelta(amount)
      const signed = amount > 0 ? `+${amount}` : `${amount}`
      appendLog({
        level: 'success',
        action: 'PUX Grant',
        message: `${signed} PUX angewendet — Seite lädt neu…`,
      })
      window.setTimeout(() => window.location.reload(), 500)
    },
    onError: (err: Error) => {
      appendLog({
        level: 'error',
        action: 'PUX Grant',
        message: formatDevError(err),
      })
    },
  })

  const trackDrills = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const track of curriculum?.tracks || []) {
      const trackId = String(track.id || '').trim()
      if (!trackId) continue
      const drillIds: string[] = []
      for (const module of track.modules || []) {
        if (module.active === false) continue
        for (const drill of module.drills || []) {
          if (drill.id) drillIds.push(drill.id)
        }
      }
      map[trackId] = Array.from(new Set(drillIds))
    }
    return map
  }, [curriculum])

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      setDiagCopied(true)
      appendLog({
        level: 'info',
        action: 'Diagnostics',
        message: 'JSON in Zwischenablage kopiert',
      })
      window.setTimeout(() => setDiagCopied(false), 1600)
    } catch {
      appendLog({
        level: 'error',
        action: 'Diagnostics',
        message: 'Clipboard nicht verfügbar',
      })
    }
  }

  const clearDevFlags = () => {
    try {
      localStorage.removeItem('academy.devNav')
      localStorage.removeItem(DEV_REWARDS_STORAGE_KEY)
      setDevNavOn(false)
      setFloatRewardsOn(false)
      setDevNavEnabled(false)
      setFloatingRewardDevToolsEnabled(false)
      appendLog({
        level: 'info',
        action: 'Flags',
        message: 'Dev-Flags gelöscht',
      })
    } catch {
      appendLog({
        level: 'error',
        action: 'Flags',
        message: 'LocalStorage nicht verfügbar',
      })
    }
  }

  return (
    <div className={styles.page}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Dev Cockpit</h1>
        <p className="ui-page-lead">
          Seeds, Rewards, Shortcuts und Diagnostics — nur für Entwicklung.
          Logo fünfmal tippen schaltet den Dev-Tab in der Nav.
        </p>
      </header>

      <DevActionLogPanel entries={logEntries} onClear={clearLog} />

      {!user && (
        <section className={styles.card}>
          <p className={styles.empty}>Melde dich an, um Seeds und Rewards zu nutzen. Links und UI-Kit gehen trotzdem.</p>
        </section>
      )}

      <section className={styles.card}>
        <h2 className="ui-section-title">Flags</h2>
        <div className={styles.actions}>
          <UiButton
            type="button"
            size="sm"
            variant={devNavOn ? 'primary' : 'secondary'}
            onClick={() => {
              const next = !devNavOn
              setDevNavEnabled(next)
              setDevNavOn(next)
              appendLog({
                level: 'info',
                action: 'Dev-Nav',
                message: next ? 'Dev-Nav eingeschaltet' : 'Dev-Nav ausgeschaltet',
              })
            }}
          >
            Dev-Nav {devNavOn ? 'an' : 'aus'}
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant={floatRewardsOn ? 'primary' : 'secondary'}
            onClick={() => {
              const next = !floatRewardsOn
              setFloatingRewardDevToolsEnabled(next)
              setFloatRewardsOn(next)
              appendLog({
                level: 'info',
                action: 'Floating Rewards',
                message: next ? 'Floating Rewards an — Seite neu laden' : 'Floating Rewards aus',
              })
              if (next) window.setTimeout(() => window.location.reload(), 400)
            }}
          >
            Floating Rewards {floatRewardsOn ? 'an' : 'aus'}
          </UiButton>
          <UiButton type="button" size="sm" variant="ghost" onClick={clearDevFlags}>
            Flags löschen
          </UiButton>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">DEV → Location</h2>
        <p className={styles.note}>
          Simuliert den Arena Check. Schreibt keine echten Rewards und füllt nicht den Arena Passport.
        </p>
        <div className={styles.actions}>
          {(
            [
              ['off', 'Aus'],
              ['inside_home', 'Im Stadion'],
              ['inside_away', 'Im Stadion (Away-Rolle)'],
              ['outside', 'Außerhalb'],
              ['poor_accuracy', 'Schlechte Genauigkeit'],
              ['denied', 'Permission denied'],
            ] as Array<[DevLocationScenario, string]>
          ).map(([id, label]) => (
            <UiButton
              key={id}
              type="button"
              size="sm"
              variant={locationScenario === id ? 'primary' : 'secondary'}
              onClick={() => {
                setDevLocationScenario(id)
                setLocationScenario(id)
                appendLog({
                  level: 'info',
                  action: 'Location Sim',
                  message: `Szenario: ${label}`,
                })
              }}
            >
              {label}
            </UiButton>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Seeds & Daten</h2>
        <p className={styles.note}>
          Sessions: {realCount} echt · {dummyCount} dummy · Szenen: {sceneCount}
          {firstDrill ? ` · Seed-Drill: ${firstDrill.drillId}` : ''}
        </p>
        <div className={styles.actions}>
          <UiButton
            type="button"
            size="sm"
            disabled={!user || !firstDrill || createDummyMutation.isPending}
            onClick={() => createDummyMutation.mutate()}
          >
            {createDummyMutation.isPending ? 'Erstelle…' : 'Dummy-Session starten'}
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="danger"
            disabled={!user || dummyCount === 0 || deleteDummiesMutation.isPending}
            onClick={() => {
              const ok = window.confirm(
                `${dummyCount} Dummy-Session${dummyCount === 1 ? '' : 's'} löschen? Echte Sessions bleiben.`,
              )
              if (!ok) return
              deleteDummiesMutation.mutate()
            }}
          >
            {deleteDummiesMutation.isPending ? 'Lösche…' : `Dummies löschen (${dummyCount})`}
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user || grantPuxMutation.isPending}
            onClick={() => grantPuxMutation.mutate(500)}
          >
            +500 PUX
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user || grantPuxMutation.isPending}
            onClick={() => grantPuxMutation.mutate(-500)}
          >
            −500 PUX
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={!user || grantPuxMutation.isPending || !lastDevPuxDelta}
            onClick={() => {
              if (!lastDevPuxDelta) return
              grantPuxMutation.mutate(-lastDevPuxDelta)
            }}
          >
            {lastDevPuxDelta
              ? `Letzten Grant rückgängig (${lastDevPuxDelta > 0 ? '+' : ''}${lastDevPuxDelta})`
              : 'Letzten Grant rückgängig'}
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user}
            onClick={() => {
              rebuildProgression({
                sessions: getRealSessions(sessionList),
                scenes: scenesData?.scenes || [],
                trackDrills,
              })
                .then(() => {
                  appendLog({
                    level: 'success',
                    action: 'Progression rebuild',
                    message: 'Progression neu berechnet',
                  })
                })
                .catch((err) => {
                  appendLog({
                    level: 'error',
                    action: 'Progression rebuild',
                    message: formatDevError(err),
                  })
                })
            }}
          >
            Progression rebuild
          </UiButton>
        </div>
      </section>

      <ProgressionPersonaSimPanel />

      <section className={styles.card}>
        <h2 className="ui-section-title">Rewards Lab</h2>
        <p className={styles.note}>
          Nur Popup-Preview — ändert keine Balance. Aktuell {formatPux(rewardState.currency?.PUX || 0)} · Level {level.level}
        </p>
        <div className={styles.actions}>
          <UiButton type="button" size="sm" variant="secondary" disabled={!user} onClick={() => enqueueReward(REWARD_PREVIEW_BRONZE)}>
            Bronze
          </UiButton>
          <UiButton type="button" size="sm" variant="secondary" disabled={!user} onClick={() => enqueueReward(REWARD_PREVIEW_SILVER)}>
            Silver
          </UiButton>
          <UiButton type="button" size="sm" variant="secondary" disabled={!user} onClick={() => enqueueReward(REWARD_PREVIEW_GOLD)}>
            Gold
          </UiButton>
          <UiButton type="button" size="sm" variant="secondary" disabled={!user} onClick={() => enqueueReward(REWARD_PREVIEW_MASTERY)}>
            Mastery
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            disabled={!user}
            onClick={() => enqueueRewards([...REWARD_PREVIEW_QUEUE])}
          >
            Queue B→S→G
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            disabled={!user}
            onClick={() => enqueueRewards([...REWARD_PREVIEW_SESSION_QUEUE])}
          >
            Queue Session
          </UiButton>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Shortcuts</h2>
        <div className={styles.actions}>
          <UiButtonLink to="/curriculum" size="sm" variant="secondary">Akademie</UiButtonLink>
          <UiButtonLink to="/theory/A1" size="sm" variant="secondary">Theorie A1</UiButtonLink>
          <UiButtonLink to="/setup/A1" size="sm" variant="secondary">Setup A1</UiButtonLink>
          <UiButtonLink to="/locker" size="sm" variant="secondary">Spind</UiButtonLink>
          <UiButtonLink to="/ringabout" size="sm" variant="secondary">Szenenpool</UiButtonLink>
          <UiButtonLink to="/ringabout?tab=insights" size="sm" variant="secondary">Insights</UiButtonLink>
          <UiButtonLink to="/history" size="sm" variant="secondary">Verlauf</UiButtonLink>
          <UiButtonLink to="/progress" size="sm" variant="secondary">Stats</UiButtonLink>
          <UiButtonLink to="/account" size="sm" variant="secondary">Account</UiButtonLink>
          <UiButtonLink to="/dev/ui" size="sm">UI Kit</UiButtonLink>
          <UiButtonLink to="/dev/content" size="sm">Content</UiButtonLink>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">DEL Data</h2>
        <p className={styles.note}>
          Saisonbezogene Kader + Spielplan.
          {' '}
          25/26: Statistik-Hauptrunde · 26/27 (noch):{' '}
          <a href="https://www.penny-del.org/spiele/monat/januar" target="_blank" rel="noreferrer" style={{ color: 'rgba(153, 246, 228, 0.95)' }}>
            penny-del.org/spiele/monat/…
          </a>
        </p>
        <div className={styles.actions}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Saison
            <select className="appSelect" value={delSeason} onChange={(e) => setDelSeason(e.target.value)}>
              <option value="2025/26">2025/26</option>
              <option value="2026/27">2026/27</option>
            </select>
          </label>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user || importScheduleMutation.isPending}
            onClick={() => importScheduleMutation.mutate()}
          >
            Spielplan synchronisieren
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user || importRostersMutation.isPending}
            onClick={() => importRostersMutation.mutate()}
          >
            Kader synchronisieren
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={!user || migrateRostersMutation.isPending}
            onClick={() => migrateRostersMutation.mutate()}
          >
            Legacy → Saison migrieren
          </UiButton>
        </div>

        <div className={styles.actions} style={{ marginTop: '0.65rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Stats-Batch
            <select
              className="appSelect"
              value={statsBatchLimit}
              onChange={(e) => setStatsBatchLimit(Number(e.target.value))}
            >
              <option value={3}>3 Spiele</option>
              <option value={5}>5 Spiele</option>
              <option value={10}>10 Spiele</option>
            </select>
          </label>
          <UiButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={!user || importGameStatsBatchMutation.isPending}
            onClick={() => importGameStatsBatchMutation.mutate()}
          >
            Spielstats sync (Batch)
          </UiButton>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
            game_id
            <input
              className="appInput"
              value={statsGameId}
              onChange={(e) => setStatsGameId(e.target.value)}
              placeholder="del:2025_2026:…"
              style={{ minWidth: '220px' }}
            />
          </label>
          <UiButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={!user || !statsGameId.trim() || importGameStatsSingleMutation.isPending}
            onClick={() => importGameStatsSingleMutation.mutate(statsGameId.trim())}
          >
            1 Spiel importieren
          </UiButton>
        </div>
        <p className={styles.note}>
          Spielstats: PENNY spieldetails (Übersicht + Boxscore). Experiment — Ergebnisse landen im Game-Katalog unter{' '}
          <code>stats</code>.
        </p>

        {delDataStatus && (
          <>
            <p className={styles.note}>
              Games: {delDataStatus.games.total}
              {typeof delDataStatus.games.with_stats === 'number'
                ? ` · Stats: ${delDataStatus.games.with_stats}`
                : ''}
              {typeof delDataStatus.games.final_without_stats === 'number'
                && delDataStatus.games.final_without_stats > 0
                ? ` · ${delDataStatus.games.final_without_stats} Final ohne Stats`
                : ''}
              {' · '}
              Rosters: {delDataStatus.rosters.teams_with_roster}/{delDataStatus.expected_teams}
              {delDataStatus.rosters.warnings_count > 0 ? ` · ${delDataStatus.rosters.warnings_count} Warnung(en)` : ''}
            </p>
            {delDataStatus.issues.length > 0 && (
              <ul className={styles.list}>
                {delDataStatus.issues.map((issue) => (
                  <li key={issue.team_id} className={styles.item}>
                    <div className={styles.itemMain}>
                      <strong>{issue.name}</strong>
                      <p className={styles.note}>Status: {issue.quality} · {(issue.warnings || []).join(', ')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <details className={styles.collapsible} style={{ marginTop: '0.75rem' }}>
              <summary className={styles.collapsibleSummary}>
                <span>Spiele mit Stats</span>
                <span className={styles.summaryMeta}>{gamesWithStats.length} importiert</span>
              </summary>
              <div className={styles.collapsibleBody}>
                <p className={styles.note} style={{ marginTop: '0.65rem' }}>
                  Finale Spiele mit importiertem Boxscore für {delSeason}. Session Setup (Dev) zeigt die Vorschau,
                  wenn du eine dieser Paarungen wählst.
                </p>
                {gamesWithStats.length === 0 ? (
                  <p className={styles.empty}>Noch keine Spielstats importiert — Batch oben starten.</p>
                ) : (
                  <ul className={styles.teamImportList}>
                    {gamesWithStats.map((game) => (
                      <li key={game.id} className={styles.teamImportItem}>
                        <span className={styles.teamImportName}>
                          <strong>
                            ST {game.matchday ?? '?'} · {game.home_team_name} vs {game.away_team_name}
                          </strong>
                          <span className={styles.teamImportMeta}>
                            {' '}
                            · {game.date?.split('-').reverse().join('.') || '?'}
                            {' '}
                            · {game.score ? `${game.score.home}:${game.score.away}` : '–'}
                            {' '}
                            · {game.stats?.imported_at
                              ? new Date(game.stats.imported_at).toLocaleString('de-DE')
                              : ''}
                          </span>
                        </span>
                        <UiButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setStatsGameId(game.id)}
                        >
                          game_id
                        </UiButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <details className={styles.collapsible} style={{ marginTop: '0.75rem' }}>
              <summary className={styles.collapsibleSummary}>
                <span>Einzelteams importieren</span>
                <span className={styles.summaryMeta}>{importableTeams.length} Teams</span>
              </summary>
              <div className={styles.collapsibleBody}>
                <p className={styles.note} style={{ marginTop: '0.65rem' }}>
                  PENNY-DEL Kader pro Team — Saison wie oben ({delSeason}).
                </p>
                {importableTeams.length === 0 ? (
                  <p className={styles.empty}>Keine importierbaren Teams geladen.</p>
                ) : (
                  <ul className={styles.teamImportList}>
                    {importableTeams.map((team) => (
                      <li key={team.id} className={styles.teamImportItem}>
                        <span className={styles.teamImportName}>
                          <strong>{team.name}</strong>
                          <span className={styles.teamImportMeta}> · {team.league}</span>
                          {team.kader_available === false && (
                            <span className={styles.kaderPendingBadge}>Kader folgt</span>
                          )}
                          {team.kader_available === false && team.kader_note && (
                            <span className={styles.kaderPendingNote}>{team.kader_note}</span>
                          )}
                        </span>
                        <UiButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            !user
                            || !team.enabled
                            || team.kader_available === false
                            || importTeamRosterMutation.isPending
                            || importRostersMutation.isPending
                          }
                          onClick={() => importTeamRosterMutation.mutate(team.id)}
                        >
                          {importTeamRosterMutation.isPending ? '…' : 'Kader laden'}
                        </UiButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <details className={styles.collapsible} style={{ marginTop: '0.75rem' }}>
              <summary className={styles.collapsibleSummary}>
                <span>Roster-Übersicht</span>
                <span className={styles.summaryMeta}>
                  {delDataStatus.rosters.teams_with_roster}/{delDataStatus.expected_teams}
                </span>
              </summary>
              <div className={styles.collapsibleBody}>
                <ul className={styles.list}>
                  {(delDataStatus.rosters.teams || []).map((team) => (
                    <li key={team.team_id} className={styles.item}>
                      <div className={styles.itemMain}>
                        <strong>{team.name}</strong>
                        <p className={styles.note}>
                          {team.player_count} Spieler · {team.quality || '—'}
                          {team.imported_at ? ` · Import ${new Date(team.imported_at).toLocaleDateString('de-DE')}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </>
        )}
      </section>

      <details className={styles.collapsible}>
        <summary className={styles.collapsibleSummary}>
          <span>Diagnostics</span>
          <span className={styles.summaryMeta}>JSON Snapshot</span>
        </summary>
        <div className={styles.collapsibleBody}>
          <pre className={styles.diag}>{JSON.stringify(diagnostics, null, 2)}</pre>
          <div className={styles.actions}>
            <UiButton type="button" size="sm" variant="secondary" onClick={copyDiagnostics}>
              {diagCopied ? 'Kopiert' : 'JSON kopieren'}
            </UiButton>
          </div>
        </div>
      </details>

      <section className={styles.card}>
        <h2 className="ui-section-title">Unfertige Bereiche</h2>
        {hidden.length === 0 ? (
          <p className={styles.empty}>Aktuell ist nichts ausgeblendet.</p>
        ) : (
          <ul className={styles.list}>
            {hidden.map((item) => (
              <li key={item.to} className={styles.item}>
                <div className={styles.itemMain}>
                  <Link to={item.to} className={styles.link}>{item.label}</Link>
                  {item.note && <p className={styles.note}>{item.note}</p>}
                </div>
                <code className={styles.path}>{item.to}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
