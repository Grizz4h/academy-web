import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'
import { formatPux, getAchievementProgressItems, useRewards } from '../features/rewards'
import styles from './Progress.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  progression: 'Progression',
  consistency: 'Konstanz',
  exploration: 'Entdeckung',
  behavior: 'Verhalten',
  time: 'Tageszeit',
  device: 'Gerät',
  absurd: 'Absurd',
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0b0',
  gold: '#f9c730',
  mastery: '#b46aff',
}

export default function Progress() {
  const { user } = useUser()
  const { rewardState } = useRewards()
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  if (!user) return <div className="card">Bitte oben im Login deinen Namen speichern, dann können wir deinen Fortschritt anzeigen.</div>
  if (isLoading) return <div className="card">Lade Fortschritt...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  // Berechne Fortschritt pro Modul
  const moduleProgress = new Map<string, {
    total: number
    completed: number
    aborted: number
    lastSession?: Session
  }>()

  sessions?.forEach(session => {
    if (!moduleProgress.has(session.module_id)) {
      moduleProgress.set(session.module_id, {
        total: 0,
        completed: 0,
        aborted: 0
      })
    }
    const progress = moduleProgress.get(session.module_id)!
    progress.total++

    if (session.state === 'COMPLETED') {
      progress.completed++
    } else if (session.state === 'ABORTED') {
      progress.aborted++
    }

    // Track letzte Session
    if (!progress.lastSession ||
        new Date(session.created_at) > new Date(progress.lastSession.created_at)) {
      progress.lastSession = session
    }
  })

  const getModuleTitle = (moduleId: string) => {
    for (const track of curriculum?.tracks || []) {
      for (const module of track.modules) {
        if (module.id === moduleId) {
          return module.title
        }
      }
    }
    return moduleId
  }

  const nearAchievements = getAchievementProgressItems(sessions || [], rewardState)
  const allProgress = nearAchievements
  const byCategory = allProgress.reduce<Record<string, typeof allProgress>>((acc, item) => {
    const cat = item.achievement.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
  const categoryOrder = ['progression', 'consistency', 'exploration', 'behavior', 'time', 'device', 'absurd']
  const sortedCategories = [
    ...categoryOrder.filter((c) => byCategory[c]),
    ...Object.keys(byCategory).filter((c) => !categoryOrder.includes(c)),
  ]
  const totalAchievements = allProgress.length
  const unlockedAchievementsCount = allProgress.filter((i) => i.isUnlocked).length
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sortedCategories.map((c) => [c, false])),
  )
  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  const unlockedMasteriesCount = Object.keys(rewardState.unlockedMasteries || {}).length

  return (
    <div className={styles.page}>
      <h1>Lernfortschritt</h1>

      <div className="card">
        <h2>Übersicht</h2>
        <p><strong>Gesamt Sessions:</strong> {sessions?.length || 0}</p>
        <p><strong>Abgeschlossen:</strong> {sessions?.filter(s => s.state === 'COMPLETED').length || 0}</p>
        <p><strong>Abgebrochen:</strong> {sessions?.filter(s => s.state === 'ABORTED').length || 0}</p>
        <p><strong>Aktiv:</strong> {sessions?.filter(s => s.state !== 'COMPLETED' && s.state !== 'ABORTED').length || 0}</p>
      </div>

      <div className="card">
        <h2>Belohnungen</h2>
        <p><strong>PUX! Gesamt:</strong> {formatPux(rewardState.currency.PUX || 0)}</p>
        <p><strong>Achievements:</strong> {unlockedAchievementsCount}/{totalAchievements}</p>
        <p><strong>Mastery-Unlocks:</strong> {unlockedMasteriesCount}</p>

        <div className={styles.achievementGroups}>
          {sortedCategories.map((cat) => {
            const items = byCategory[cat]
            const unlockedInCat = items.filter((i) => i.isUnlocked).length
            const isOpen = openCategories[cat] ?? false
            return (
              <div key={cat} className={styles.achievementGroup}>
                <button
                  className={styles.achievementGroupHeader}
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.achievementGroupLabel}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                  <span className={styles.achievementGroupCount}>
                    {unlockedInCat}/{items.length}
                  </span>
                  <span className={`${styles.achievementChevron} ${isOpen ? styles.achievementChevronOpen : ''}`}>
                    ›
                  </span>
                </button>
                <div className={`${styles.achievementGroupBody} ${isOpen ? styles.achievementGroupBodyOpen : ''}`}>
                  <ul className={styles.achievementGroupInner}>
                    {items.map((item) => {
                      const unlocked = rewardState.unlockedAchievements[item.achievement.id]
                      return (
                        <li
                          key={item.achievement.id}
                          className={`${styles.achievementItem} ${item.isUnlocked ? styles.achievementItemUnlocked : ''}`}
                        >
                          <span
                            className={styles.achievementTierDot}
                            style={{ background: TIER_COLORS[item.achievement.tier] ?? '#888' }}
                            title={item.achievement.tier}
                          />
                          <div className={styles.achievementItemContent}>
                            <div className={styles.achievementItemTitle}>
                              {item.achievement.title}
                              <span className={styles.achievementPux}>+{item.achievement.reward.PUX} PUX</span>
                            </div>
                            <div className={styles.achievementItemDesc}>{item.achievement.description}</div>
                            {item.isUnlocked && unlocked && (
                              <div className={styles.achievementUnlockedAt}>
                                ✓ {new Date(unlocked.unlockedAt).toLocaleDateString('de-DE')}
                              </div>
                            )}
                            {!item.isUnlocked && item.progress > 0 && (
                              <div className={styles.achievementProgressWrap}>
                                <div className={styles.achievementProgressTrack}>
                                  <div
                                    className={styles.achievementProgressFill}
                                    style={{ width: `${Math.round(item.progress * 100)}%` }}
                                  />
                                </div>
                                <span className={styles.achievementProgressLabel}>
                                  {item.current}/{item.target}
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.grid}>
        {Array.from(moduleProgress.entries()).map(([moduleId, progress]) => (
          <div key={moduleId} className="card">
            <h3>{getModuleTitle(moduleId)}</h3>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span>Fortschritt</span>
                <span className={styles.completionCount}>{progress.completed}/{progress.total}</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${progress.total > 0 && progress.completed === progress.total ? styles.progressFillComplete : ''}`}
                  style={{
                    width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <p><strong>Abgebrochen:</strong> {progress.aborted}</p>

            {progress.lastSession && (
              <div className={styles.lastSessionCard}>
                <p><strong>Letzte Session:</strong></p>
                <p>{new Date(progress.lastSession.created_at).toLocaleDateString()}</p>
                <p>
                  Status:{' '}
                  <span className={styles.statusBadge}>
                    {progress.lastSession.state.replace(/_/g, ' ')}
                  </span>
                </p>
                {progress.lastSession.abort && (
                  <p>Abbruch: {progress.lastSession.abort.reason}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {moduleProgress.size === 0 && (
        <div className="card">
          <p>Noch keine Sessions vorhanden. Starte mit dem Curriculum!</p>
        </div>
      )}
    </div>
  )
}