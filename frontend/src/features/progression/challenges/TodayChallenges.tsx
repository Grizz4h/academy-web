import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogGame } from '../../../api'
import { useUser } from '../../../context/UserContext'
import { contentRegistry } from '../../../content/registry'
import { useRewards } from '../../rewards'
import { resolveMatchdayContext } from './matchdayContext'
import {
  compactRewardLabel,
  lockerTaskHref,
  selectHomeTodaySummary,
  selectLockerTaskViews,
} from '../tasks/taskViews'
import Card from '../../../components/Card'
import styles from './TodayChallenges.module.css'

function countLabel(done: number, total: number, emptyText: string) {
  if (total === 0) return emptyText
  return `${done} / ${total}`
}

export default function TodayChallenges({ games = [] }: { games?: CatalogGame[] }) {
  const { user } = useUser()
  const { rewardState, syncChallengeBoard } = useRewards()
  const matchday = useMemo(() => resolveMatchdayContext(games), [games])

  useEffect(() => {
    if (!user) return
    void syncChallengeBoard({ matchday })
  }, [user, matchday?.gameId, syncChallengeBoard])

  const views = useMemo(() => {
    if (!rewardState.challengeRotation) return []
    return selectLockerTaskViews({
      state: rewardState,
      definitions: contentRegistry.challenges,
      pools: contentRegistry.pools,
      campaigns: contentRegistry.campaigns,
      progress: rewardState.challengeProgress || {},
      rotation: rewardState.challengeRotation,
      matchday,
      userId: user || undefined,
    })
  }, [rewardState, matchday, user])

  const summary = useMemo(() => selectHomeTodaySummary(views, matchday), [views, matchday])
  const highlight = summary.highlight

  if (!user) return null

  const hasAny = summary.daily.total + summary.weekly.total + (summary.matchday.empty ? 0 : summary.matchday.total) > 0
    || Boolean(matchday)

  if (!hasAny && !rewardState.challengeRotation) return null

  return (
    <Card surface="section" className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Heute</h2>
        <Link className={styles.allLink} to="/locker?tab=achievements&lane=daily">
          Alle Aufgaben
        </Link>
      </header>

      <div className={styles.summary}>
        <Link className={styles.summaryRow} to="/locker?tab=achievements&lane=daily">
          <span className={styles.summaryLabel}>Daily</span>
          <span className={styles.summaryValue}>{countLabel(summary.daily.done, summary.daily.total, 'Keine aktiv')}</span>
        </Link>
        <Link className={styles.summaryRow} to="/locker?tab=achievements&lane=weekly">
          <span className={styles.summaryLabel}>Weekly</span>
          <span className={styles.summaryValue}>{countLabel(summary.weekly.done, summary.weekly.total, 'Keine aktiv')}</span>
        </Link>
        <Link className={styles.summaryRow} to="/locker?tab=achievements&lane=matchday">
          <span className={styles.summaryLabel}>Matchday</span>
          <span className={styles.summaryValue}>
            {summary.matchday.empty
              ? 'Kein Spiel heute'
              : [summary.matchday.label, countLabel(summary.matchday.done, summary.matchday.total, 'Kein Matchday-Content aktiv.')]
                  .filter(Boolean)
                  .join(' · ')}
          </span>
        </Link>
      </div>

      {highlight ? (
        <Link
          className={styles.highlight}
          to={lockerTaskHref({ sourceId: highlight.sourceId, lane: highlight.lane })}
        >
          <span className={styles.highlightKicker}>{highlight.lane === 'matchday' ? 'Matchday' : highlight.lane === 'weekly' ? 'Weekly' : 'Daily'}</span>
          <span className={styles.highlightTitle}>{highlight.title}</span>
          <span className={styles.highlightMeta}>
            {highlight.current} / {highlight.target}
            {highlight.rewardLabel ? <span>{compactRewardLabel(highlight.rewards)}</span> : null}
          </span>
        </Link>
      ) : null}
    </Card>
  )
}
