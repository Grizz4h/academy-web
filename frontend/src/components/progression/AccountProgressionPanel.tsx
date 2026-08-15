import {
  selectAchievementViews,
  selectAchievementsByCategory,
  selectLevelProgress,
  selectRecentUnlocks,
  selectTaglineOptions,
  RARITY_LABELS,
  type AchievementViewItem,
} from '../../features/progression'
import { useRewards } from '../../features/rewards'
import { lockerTaskHref } from '../../features/progression/tasks'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UiButton, UiPill, UiProgress } from '../ui'
import styles from '../../pages/Account.module.css'

function formatUnlockDate(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('de-DE')
}

function AchievementCard({ item }: { item: AchievementViewItem }) {
  if (item.secretHidden) {
    return (
      <article className={`${styles.achievementCard} ${styles.achievementSecret}`}>
        <div className={styles.achievementName}>???</div>
        <p className={styles.hint}>Geheim. Bleibt verborgen, bis es freigeschaltet ist.</p>
      </article>
    )
  }

  const rarity = item.definition.rarity ? RARITY_LABELS[item.definition.rarity] : null
  return (
    <article className={`${styles.achievementCard} ${item.unlocked ? styles.achievementUnlocked : ''}`}>
      <div className={styles.achievementTop}>
        <div className={styles.achievementName}>{item.definition.name}</div>
        {rarity && <UiPill tone="neutral" className={styles.rarityPill}>{rarity}</UiPill>}
      </div>
      <p className={styles.achievementDesc}>{item.definition.description}</p>
      <div className={styles.achievementProgress}>
        <UiProgress
          value={item.current}
          max={item.target || 1}
          label={item.definition.name}
          size="sm"
        />
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
}

export default function AccountProgressionPanel() {
  const { rewardState, rebuildProgression, bootstrapStatus } = useRewards()
  const level = selectLevelProgress(rewardState)
  const groups = selectAchievementsByCategory(rewardState)
  const recent = selectRecentUnlocks(rewardState, 6)
  const taglines = selectTaglineOptions(rewardState)
  const achievementViews = useMemo(() => selectAchievementViews(rewardState), [rewardState])
  const visibleAchievements = achievementViews.filter((item) => !item.secretHidden)
  const unlockedCount = visibleAchievements.filter((item) => item.unlocked).length
  const nearAchievements = visibleAchievements
    .filter((item) => !item.unlocked && item.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio || b.current - a.current)
    .slice(0, 3)

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
        <UiProgress value={Math.round(level.progress01 * 100)} label="Account-Level XP" size="lg" />
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
        <div className={styles.achievementSummary}>
          <UiProgress
            value={unlockedCount}
            max={visibleAchievements.length || 1}
            label="Achievements"
          />
          <p className={styles.hint}>
            {unlockedCount} / {visibleAchievements.length} freigeschaltet
          </p>
        </div>

        {nearAchievements.length > 0 ? (
          <div className={styles.nearBlock}>
            <h4 className={styles.achievementGroupTitle}>Bald erreicht</h4>
            <ul className={styles.nearList}>
              {nearAchievements.map((item) => (
                <li key={item.definition.id}>
                  <Link className={styles.nearItem} to={lockerTaskHref({ sourceId: item.definition.id, lane: 'permanent' })}>
                    <div className={styles.nearTop}>
                      <strong>{item.definition.name}</strong>
                      <span className={styles.hint}>{item.current} / {item.target}</span>
                    </div>
                    <UiProgress value={item.current} max={item.target || 1} label={item.definition.name} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <details className={styles.achievementDetails}>
          <summary className={styles.achievementSummaryToggle}>
            <span>Alle Achievements · {unlockedCount}/{visibleAchievements.length}</span>
            <span className={styles.achievementChevron} aria-hidden="true" />
          </summary>
          <div className={styles.achievementDetailsBody}>
            {groups.map((group) => (
              <div key={group.category} className={styles.achievementGroup}>
                <h4 className={styles.achievementGroupTitle}>{group.label}</h4>
                <div className={styles.achievementGrid}>
                  {group.items.map((item) => (
                    <AchievementCard key={item.definition.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>

      {taglines.length > 0 && (
        <p className={styles.hint}>
          Freigeschaltete Taglines: {taglines.map((item) => item.label).join(' · ')}
        </p>
      )}

      {isDev && (
        <UiButton
          type="button"
          variant="dev"
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
        </UiButton>
      )}
    </div>
  )
}
