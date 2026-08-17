import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogGame } from '../../../api'
import { useUser } from '../../../context/UserContext'
import { contentRegistry } from '../../../content/registry'
import { useRewards } from '../../rewards'
import { resolveMatchdayContext } from './matchdayContext'
import { syncChallengeRotation } from './challengeEngine'
import {
  selectHomeTodaySummary,
  selectLockerTaskViews,
} from '../tasks/taskViews'
import Card from '../../../components/Card'
import ArenaCheckPanel from '../../../components/game/ArenaCheckPanel'
import styles from './TodayChallenges.module.css'

function countLabel(done: number, total: number, emptyText: string) {
  if (total === 0) return emptyText
  return `${done} / ${total}`
}

type LaneTileProps = {
  title: string
  value: string
  hint: string
  to: string
  tone?: 'default' | 'empty'
}

function LaneTile({ title, value, hint, to, tone = 'default' }: LaneTileProps) {
  return (
    <Link
      to={to}
      className={styles.tileLink}
      aria-label={`${title}: ${value}. ${hint}`}
      data-tone={tone}
    >
      <Card className={styles.tile} elevation="quiet">
        <div className={styles.tileTitle}>{title}</div>
        <div className={styles.tileValue}>{value}</div>
        <div className={styles.tileHint}>{hint}</div>
      </Card>
    </Link>
  )
}

export default function TodayChallenges({ games = [] }: { games?: CatalogGame[] }) {
  const { user } = useUser()
  const { rewardState, rewardStateLoaded, syncChallengeBoard } = useRewards()
  const matchday = useMemo(() => resolveMatchdayContext(games), [games])

  useEffect(() => {
    if (!user || !rewardStateLoaded) return
    void syncChallengeBoard({ matchday })
  }, [user, rewardStateLoaded, matchday?.gameId, syncChallengeBoard])

  const views = useMemo(() => {
    if (!user) return []
    // While reward state is still loading, derive a provisional board so tiles
    // are not empty on the first paint (sync persists once loaded).
    const synced = rewardState.challengeRotation
      ? null
      : syncChallengeRotation({
          definitions: contentRegistry.challenges,
          pools: contentRegistry.pools,
          campaigns: contentRegistry.campaigns,
          progress: rewardState.challengeProgress || {},
          rotation: null,
          matchday,
          userId: user,
        })
    const rotation = rewardState.challengeRotation || synced?.rotation
    if (!rotation) return []
    return selectLockerTaskViews({
      state: rewardState,
      definitions: contentRegistry.challenges,
      pools: contentRegistry.pools,
      campaigns: contentRegistry.campaigns,
      progress: synced?.progress || rewardState.challengeProgress || {},
      rotation,
      matchday,
      userId: user,
    })
  }, [rewardState, matchday, user])

  const summary = useMemo(() => selectHomeTodaySummary(views, matchday), [views, matchday])

  if (!user) return null

  // Always show the board for signed-in users. Empty tiles beat a missing section
  // while challengeRotation is still syncing or no lane has active items.
  const matchdayValue = summary.matchday.empty
    ? '—'
    : countLabel(summary.matchday.done, summary.matchday.total, '—')
  const matchdayHint = summary.matchday.empty
    ? 'Kein Spiel heute'
    : summary.matchday.label || 'Matchday-Aufgaben'

  return (
    <Card surface="section" className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Aufgaben</p>
          <h2 className="ui-section-title-content">Heute</h2>
        </div>
        <Link className={styles.allLink} to="/locker?tab=achievements&lane=daily">
          Alle Aufgaben
        </Link>
      </header>

      <div className={styles.tileGrid}>
        <LaneTile
          title="Daily"
          value={countLabel(summary.daily.done, summary.daily.total, '—')}
          hint={summary.daily.total === 0 ? 'Keine aktiv' : 'Heute fällig'}
          to="/locker?tab=achievements&lane=daily"
          tone={summary.daily.total === 0 ? 'empty' : 'default'}
        />
        <LaneTile
          title="Weekly"
          value={countLabel(summary.weekly.done, summary.weekly.total, '—')}
          hint={summary.weekly.total === 0 ? 'Keine aktiv' : 'Diese Woche'}
          to="/locker?tab=achievements&lane=weekly"
          tone={summary.weekly.total === 0 ? 'empty' : 'default'}
        />
        <LaneTile
          title="Matchday"
          value={matchdayValue}
          hint={matchdayHint}
          to="/locker?tab=achievements&lane=matchday"
          tone={summary.matchday.empty ? 'empty' : 'default'}
        />
      </div>
      {matchday?.game ? <ArenaCheckPanel game={matchday.game} compact /> : null}
    </Card>
  )
}
