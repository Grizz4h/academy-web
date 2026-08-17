import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { contentRegistry, runContentValidation, runRewardReachabilityAudit } from '../content/registry'
import { getActiveProgressViews } from '../features/progression/challenges/challengeEngine'
import { useRewards } from '../features/rewards'
import { useUser } from '../context/UserContext'
import { UiButton, UiChip } from '../components/ui'
import { buildObservationCreatedEvent, buildSceneCreatedEvent } from '../features/progression'
import { VENUE_CATALOG, venueForInspector } from '../data/venues'
import { isGeofenceUsable } from '../data/venues/resolveVenue'
import { inferSplitSeasonLabelForDate, normalizeSeasonValue } from '../stats/seasonNormalization'
import styles from './DevLab.module.css'

type Filter = 'all' | 'active' | 'daily' | 'weekly' | 'matchday' | 'event' | 'broken' | 'orphaned'

export default function DevContent() {
  const { user } = useUser()
  const { rewardState, ingestActivityEvents, syncChallengeBoard } = useRewards()
  const [filter, setFilter] = useState<Filter>('all')
  const season = normalizeSeasonValue(inferSplitSeasonLabelForDate(), 'DEL') || inferSplitSeasonLabelForDate()
  const { data: gamesData } = useQuery({
    queryKey: ['games', 'DEL', season, 'content-inspector'],
    queryFn: () => api.getGames({ league: 'DEL', season }),
    staleTime: 60_000,
  })
  const games = gamesData?.games || []
  const issues = useMemo(() => runContentValidation(games), [games])
  const reachability = useMemo(() => runRewardReachabilityAudit(), [])
  const errors = issues.filter((item) => item.severity === 'error')
  const warnings = issues.filter((item) => item.severity === 'warning')
  const unreachable = reachability.filter((item) => !item.reachable && item.rewardId !== 'PUX' && item.rewardId !== 'XP')

  const activeViews = useMemo(() => {
    if (!rewardState.challengeRotation) return []
    return getActiveProgressViews({
      definitions: contentRegistry.challenges,
      pools: contentRegistry.pools,
      campaigns: contentRegistry.campaigns,
      progress: rewardState.challengeProgress || {},
      rotation: rewardState.challengeRotation,
      matchday: rewardState.challengeRotation.matchdayGameId
        ? {
            gameId: rewardState.challengeRotation.matchdayGameId,
            homeTeamId: '',
            awayTeamId: '',
            startsAt: new Date().toISOString(),
            phase: 'live',
            game: {
              id: rewardState.challengeRotation.matchdayGameId,
              league_id: '',
              season_id: '',
              home_team_id: '',
              away_team_id: '',
              status: 'live',
            },
          }
        : null,
      userId: user || undefined,
    })
  }, [rewardState.challengeProgress, rewardState.challengeRotation, user])

  const visibleChallenges = contentRegistry.challenges.filter((challenge) => {
    if (filter === 'all') return true
    if (filter === 'daily' || filter === 'weekly' || filter === 'matchday' || filter === 'event') {
      return challenge.type === filter || (filter === 'event' && (challenge.type === 'seasonal' || challenge.type === 'event'))
    }
    if (filter === 'active') return activeViews.some((item) => item.definition.id === challenge.id)
    if (filter === 'broken') return issues.some((item) => item.entityId === challenge.id)
    return true
  })

  const visibleRewards = filter === 'orphaned' ? unreachable : reachability.filter((item) => item.rewardId.startsWith('sticker_') || item.sources.some((source) => source.type === 'challenge'))

  return (
    <div className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <p className="ui-page-kicker">Dev</p>
        <h1 className="ui-page-title">Content Inspector</h1>
        <p className="ui-page-lead">
          Challenges, Rewards, Collections, Validation. <Link to="/dev">Zurück zum Dev-Cockpit</Link>
        </p>
      </header>

      <section className={styles.card}>
        <h2 className="ui-section-title">Validation</h2>
        <p className={styles.note}>
          ✓ {contentRegistry.challenges.length} challenges · {contentRegistry.rewards.length} cosmetics · {contentRegistry.collections.length} collections
          {errors.length ? ` · ✕ ${errors.length} errors` : ''}
          {warnings.length ? ` · ⚠ ${warnings.length} warnings` : ''}
          {unreachable.length ? ` · ⚠ ${unreachable.length} unreachable` : ' · keine Challenge-Orphans'}
        </p>
        {issues.length > 0 ? (
          <ul className={styles.list}>
            {issues.map((issue) => (
              <li key={`${issue.code}:${issue.entityId}:${issue.message}`}>
                {issue.severity === 'error' ? '✕' : '⚠'} {issue.code} · {issue.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>Keine Content-Fehler.</p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Filter</h2>
        <div className={styles.actions}>
          {(['all', 'active', 'daily', 'weekly', 'matchday', 'event', 'broken', 'orphaned'] as Filter[]).map((item) => (
            <UiChip key={item} active={filter === item} onClick={() => setFilter(item)}>
              {item}
            </UiChip>
          ))}
        </div>
      </section>

      {filter !== 'orphaned' ? (
        <section className={styles.card}>
          <h2 className="ui-section-title">Challenges</h2>
          <ul className={styles.list}>
            {visibleChallenges.map((challenge) => {
              const view = activeViews.find((item) => item.definition.id === challenge.id)
              return (
                <li key={challenge.id}>
                  <strong>{challenge.title}</strong>
                  {' · '}
                  {challenge.id} · {challenge.type} · {challenge.enabled ? 'enabled' : 'disabled'}
                  {view ? ` · ${view.progress.status} · ${view.progress.requirements.map((req) => `${req.current}/${req.target}`).join(' + ')}` : ''}
                  <div className={styles.actions} style={{ marginTop: '0.35rem' }}>
                    <UiButton
                      type="button"
                      size="sm"
                      variant="dev"
                      disabled={!user}
                      onClick={() => {
                        const gameId = view?.progress.boundGameId || rewardState.challengeRotation?.matchdayGameId
                        const event = challenge.requirements[0]?.eventType.includes('scene')
                          ? buildSceneCreatedEvent({
                              sceneId: `dev:${Date.now()}`,
                              isDummy: false,
                              gameId: gameId || undefined,
                            })
                          : buildObservationCreatedEvent({
                              sessionId: `dev:${Date.now()}`,
                              gameId: gameId || undefined,
                              isDummy: false,
                            })
                        void ingestActivityEvents([event])
                      }}
                    >
                      Complete Requirement
                    </UiButton>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <section className={styles.card}>
          <h2 className="ui-section-title">Unreachable rewards</h2>
          <ul className={styles.list}>
            {visibleRewards.map((item) => (
              <li key={item.rewardId}>
                {item.rewardId} · {item.reachable ? 'reachable' : 'no active unlock source'}
                {item.sources.length ? ` · ${item.sources.map((source) => source.label).join(', ')}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2 className="ui-section-title">Rotation</h2>
        <p className={styles.note}>
          Daily {rewardState.challengeRotation?.dailyKey || '—'} · Weekly {rewardState.challengeRotation?.weeklyKey || '—'}
          {rewardState.challengeRotation?.matchdayGameId ? ` · Matchday ${rewardState.challengeRotation.matchdayGameId}` : ' · kein Matchday'}
        </p>
        <UiButton type="button" size="sm" variant="secondary" onClick={() => void syncChallengeBoard()}>
          Sync Board
        </UiButton>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Venues</h2>
        <p className={styles.note}>
          {VENUE_CATALOG.length} Arenen · {VENUE_CATALOG.filter((venue) => isGeofenceUsable(venue)).length} Geofence aktiv ·{' '}
          {games.length} Games geprüft
        </p>
        <ul className={styles.list}>
          {VENUE_CATALOG.map((venue) => {
            const row = venueForInspector(venue, games)
            return (
              <li key={venue.id}>
                <strong>{row.name}</strong>
                {' · '}
                {row.id} · {row.teams.join(', ') || 'kein Team'} · {row.coordinates} · {row.radius} m · {row.dataQuality}
                {' · '}
                {row.source} · {row.games} Games
                {!isGeofenceUsable(venue) ? ' · ⚠ Geofence aus' : ''}
                {venue.dataQuality === 'missing' ? ' · ⚠ Missing coordinates' : ''}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}