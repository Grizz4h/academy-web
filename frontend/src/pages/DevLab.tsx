import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { getHiddenNavTabs, isDevNavEnabled, setDevNavEnabled } from '../config/featureFlags'
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
  REWARD_PREVIEW_SILVER,
  setFloatingRewardDevToolsEnabled,
} from '../dev/rewardPreviewActions'
import { selectLevelProgress } from '../features/progression'
import { useRewards } from '../features/rewards'
import { formatPux } from '../features/rewards/types'
import { countDummySessions, getRealSessions } from '../utils/sessionEligibility'
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
  const [status, setStatus] = useState('')
  const [diagCopied, setDiagCopied] = useState(false)

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
      setStatus(`Dummy-Session erstellt · ${session.module_id}`)
      navigate(getDummySessionPath(session))
    },
    onError: (err: Error) => setStatus(err.message || 'Dummy fehlgeschlagen'),
  })

  const deleteDummiesMutation = useMutation({
    mutationFn: async () => deleteAllDummySessions(sessionList),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['scenes'] })
      setStatus(`Gelöscht: ${result.deletedSessions} Sessions, ${result.deletedScenes} Szenen`)
    },
    onError: (err: Error) => setStatus(err.message || 'Cleanup fehlgeschlagen'),
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
      setStatus(`${signed} PUX — Seite lädt neu…`)
      window.setTimeout(() => window.location.reload(), 500)
    },
    onError: (err: Error) => setStatus(err.message || 'PUX-Änderung fehlgeschlagen'),
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
      window.setTimeout(() => setDiagCopied(false), 1600)
    } catch {
      setStatus('Clipboard nicht verfügbar')
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
      setStatus('Dev-Flags gelöscht')
    } catch {
      setStatus('LocalStorage nicht verfügbar')
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

      {status && <p className={styles.status}>{status}</p>}

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
              setStatus(next ? 'Dev-Nav an' : 'Dev-Nav aus')
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
              setStatus(next ? 'Floating Rewards an — Seite neu laden' : 'Floating Rewards aus')
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
              }).catch((err) => setStatus(err instanceof Error ? err.message : 'Rebuild fehlgeschlagen'))
            }}
          >
            Progression rebuild
          </UiButton>
        </div>
      </section>

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
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Shortcuts</h2>
        <div className={styles.actions}>
          <UiButtonLink to="/curriculum" size="sm" variant="secondary">Akademie</UiButtonLink>
          <UiButtonLink to="/theory/A1" size="sm" variant="secondary">Theorie A1</UiButtonLink>
          <UiButtonLink to="/setup/A1" size="sm" variant="secondary">Setup A1</UiButtonLink>
          <UiButtonLink to="/locker" size="sm" variant="secondary">Locker</UiButtonLink>
          <UiButtonLink to="/ringabout" size="sm" variant="secondary">Szenenpool</UiButtonLink>
          <UiButtonLink to="/ringabout?tab=insights" size="sm" variant="secondary">Insights</UiButtonLink>
          <UiButtonLink to="/history" size="sm" variant="secondary">Verlauf</UiButtonLink>
          <UiButtonLink to="/progress" size="sm" variant="secondary">Stats</UiButtonLink>
          <UiButtonLink to="/account" size="sm" variant="secondary">Account</UiButtonLink>
          <UiButtonLink to="/dev/ui" size="sm">UI Kit</UiButtonLink>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Diagnostics</h2>
        <pre className={styles.diag}>{JSON.stringify(diagnostics, null, 2)}</pre>
        <div className={styles.actions}>
          <UiButton type="button" size="sm" variant="secondary" onClick={copyDiagnostics}>
            {diagCopied ? 'Kopiert' : 'JSON kopieren'}
          </UiButton>
        </div>
      </section>

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
