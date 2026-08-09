import {
  selectAchievementsByCategory,
  selectLevelProgress,
  selectRecentUnlocks,
  selectTaglineOptions,
  RARITY_LABELS,
} from '../../features/progression'
import { useRewards } from '../../features/rewards'
import type { ReactNode } from 'react'
import styles from '../../pages/Account.module.css'

function formatUnlockDate(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('de-DE')
}

export default function AccountProgressionPanel() {
  const { rewardState, rebuildProgression, bootstrapStatus } = useRewards()
  const level = selectLevelProgress(rewardState)
  const groups = selectAchievementsByCategory(rewardState)
  const recent = selectRecentUnlocks(rewardState, 6)
  const taglines = selectTaglineOptions(rewardState)

  const isDev =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV ||
      localStorage.getItem('academy.devRewards') === '1' ||
      new URLSearchParams(window.location.search).get('rewardsDebug') === '1')

  return (
    <div className={styles.progressionWrap}>
      <div className={styles.levelCard}>
        <div className={styles.levelHeader}>
          <div>
            <div className={styles.statusLabel}>Account-Level</div>
            <div className={styles.levelValue}>Level {level.level}</div>
          </div>
          <div className={styles.levelXpMeta}>
            <div>{level.xpIntoLevel.toLocaleString('de-DE')} / {level.xpForNextLevel.toLocaleString('de-DE')} XP</div>
            <div className={styles.hint}>Gesamt {level.totalXp.toLocaleString('de-DE')} XP · {Number(rewardState.currency?.PUX || 0)} PUX</div>
          </div>
        </div>
        <div className={styles.xpBar} aria-hidden>
          <div className={styles.xpBarFill} style={{ width: `${Math.round(level.progress01 * 100)}%` }} />
        </div>
        {bootstrapStatus === 'running' && (
          <p className={styles.hint}>Historischer Fortschritt wird ausgewertet …</p>
        )}
      </div>

      {recent.length > 0 && (
        <div className={styles.recentUnlocks}>
          <h3 className={styles.subSectionTitle}>Letzte Unlocks</h3>
          <ul className={styles.unlockList}>
            {recent.map((entry) => (
              <li key={entry.id} className={styles.unlockItem}>
                <span className={styles.unlockIcon}>
                  {entry.kind === 'achievement' ? '🏆' : entry.kind === 'cosmetic' ? '🎨' : entry.kind === 'level' ? '✦' : '⚡'}
                </span>
                <span>
                  <strong>{entry.title}</strong>
                  {entry.description ? <span className={styles.hint}> · {entry.description}</span> : null}
                  <div className={styles.hint}>{formatUnlockDate(entry.occurredAt)}</div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.achievementsBlock}>
        <h3 className={styles.subSectionTitle}>Achievements</h3>
        {groups.map((group) => (
          <div key={group.category} className={styles.achievementGroup}>
            <h4 className={styles.achievementGroupTitle}>{group.label}</h4>
            <div className={styles.achievementGrid}>
              {group.items.map((item) => {
                if (item.secretHidden) {
                  return (
                    <article key={item.definition.id} className={`${styles.achievementCard} ${styles.achievementSecret}`}>
                      <div className={styles.achievementName}>???</div>
                      <p className={styles.hint}>Geheim. Bleibt verborgen, bis es freigeschaltet ist.</p>
                    </article>
                  )
                }
                const rarity = item.definition.rarity ? RARITY_LABELS[item.definition.rarity] : null
                return (
                  <article
                    key={item.definition.id}
                    className={`${styles.achievementCard} ${item.unlocked ? styles.achievementUnlocked : ''}`}
                  >
                    <div className={styles.achievementTop}>
                      <div className={styles.achievementName}>{item.definition.name}</div>
                      {rarity && <span className={styles.rarityPill}>{rarity}</span>}
                    </div>
                    <p className={styles.achievementDesc}>{item.definition.description}</p>
                    <div className={styles.achievementProgress}>
                      <div className={styles.xpBar} aria-hidden>
                        <div className={styles.xpBarFill} style={{ width: `${Math.round(item.ratio * 100)}%` }} />
                      </div>
                      <span className={styles.hint}>
                        {item.unlocked
                          ? `✓ Freigeschaltet am ${formatUnlockDate(item.unlockedAt)}`
                          : `${item.current} / ${item.target}`}
                      </span>
                    </div>
                    <div className={styles.achievementRewards}>
                      {item.definition.rewards
                        .map((reward, index): ReactNode => {
                          if (reward.type === 'xp') return <span key={index}>+{reward.amount} XP</span>
                          if (reward.type === 'pux') return <span key={index}>+{reward.amount} PUX</span>
                          return <span key={index}>Cosmetic</span>
                        })
                        .reduce<ReactNode[]>((acc, node, index) => {
                          if (index > 0) acc.push(' · ')
                          acc.push(node)
                          return acc
                        }, [])}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {taglines.length > 0 && (
        <p className={styles.hint}>
          Freigeschaltete Taglines: {taglines.map((item) => item.label).join(' · ')}
        </p>
      )}

      {isDev && (
        <button
          type="button"
          className={styles.devRebuildButton}
          onClick={async () => {
            const sessions = await (await import('../../api')).api.getSessions()
            const scenes = await (await import('../../api')).api.getScenes()
            const curriculum = await (await import('../../api')).api.getCurriculum()
            const trackDrills: Record<string, string[]> = {}
            for (const track of curriculum.tracks || []) {
              const ids: string[] = []
              for (const module of track.modules || []) {
                if (module.active === false) continue
                for (const drill of module.drills || []) {
                  if (drill.id) ids.push(drill.id)
                }
                if (module.id) ids.push(module.id)
              }
              trackDrills[track.id] = Array.from(new Set(ids))
            }
            await rebuildProgression({
              sessions,
              scenes: scenes.scenes || [],
              trackDrills,
            })
          }}
        >
          ⚡ Progression neu berechnen
        </button>
      )}
    </div>
  )
}
