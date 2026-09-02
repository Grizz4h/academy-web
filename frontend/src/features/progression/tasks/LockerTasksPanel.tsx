import { Fragment, useEffect, useMemo } from 'react'
import { useUser } from '../../../context/UserContext'
import { contentRegistry } from '../../../content/registry'
import { getMatchdayGroup } from '../../../content/matchdays'
import { getVenue } from '../../../data/venues'
import { useTodayGamesSchedule } from '../../schedule/useTodayGamesSchedule'
import { UiButton, UiChip, UiPill, UiProgress, UiSheet, UiSheetActions } from '../../../components/ui'
import { useRewards } from '../../rewards'
import { resolveMatchdayContext } from '../challenges/matchdayContext'
import { syncChallengeRotation } from '../challenges/challengeEngine'
import {
  LANE_LABELS,
  compactRewardLabel,
  filterLockerTaskViews,
  selectLockerTaskViews,
  type LockerTaskView,
  type TaskLaneFilter,
  type TaskStatusFilter,
} from './taskViews'
import styles from './LockerTasksPanel.module.css'

const LANE_CHIPS: Array<{ id: TaskLaneFilter; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'permanent', label: 'Permanent' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'matchday', label: 'Matchday' },
  { id: 'event', label: 'Event' },
]

const STATUS_CHIPS: Array<{ id: TaskStatusFilter; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'active', label: 'Aktiv' },
  { id: 'completed', label: 'Abgeschlossen' },
]

function statusLabel(status: LockerTaskView['status']) {
  if (status === 'completed') return 'Abgeschlossen'
  if (status === 'expired') return 'Abgelaufen'
  if (status === 'upcoming') return 'Demnächst'
  return 'Aktiv'
}

function emptyCopy(lane: TaskLaneFilter) {
  if (lane === 'daily') return 'Heute sind keine Daily Challenges aktiv.'
  if (lane === 'weekly') return 'Diese Woche sind keine Weekly Challenges aktiv.'
  if (lane === 'matchday') return 'Kein Matchday-Content aktiv.'
  if (lane === 'event') return 'Kein Event-Content aktiv.'
  if (lane === 'permanent') return 'Keine permanenten Achievements in diesem Filter.'
  return 'Keine Aufgaben in diesem Filter.'
}

export function LockerTasksPanel({
  lane,
  status,
  selectedId,
  onLaneChange,
  onStatusChange,
  onSelect,
}: {
  lane: TaskLaneFilter
  status: TaskStatusFilter
  selectedId?: string | null
  onLaneChange: (lane: TaskLaneFilter) => void
  onStatusChange: (status: TaskStatusFilter) => void
  onSelect: (sourceId: string | null) => void
}) {
  const { user, userId } = useUser()
  const seedId = userId || user
  const { rewardState, rewardStateLoaded, syncChallengeBoard } = useRewards()
  const { allTodayGames } = useTodayGamesSchedule({
    enabled: Boolean(user),
  })
  const matchday = useMemo(() => resolveMatchdayContext(allTodayGames), [allTodayGames])

  useEffect(() => {
    if (!user || !rewardStateLoaded) return
    void syncChallengeBoard({ matchday })
  }, [user, rewardStateLoaded, matchday?.gameId, syncChallengeBoard])

  const views = useMemo(() => {
    if (!seedId) return []
    const synced = rewardState.challengeRotation
      ? null
      : syncChallengeRotation({
          definitions: contentRegistry.challenges,
          pools: contentRegistry.pools,
          campaigns: contentRegistry.campaigns,
          progress: rewardState.challengeProgress || {},
          rotation: null,
          matchday,
          userId: seedId,
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
      userId: seedId,
    })
  }, [rewardState, matchday, seedId])

  const filtered = useMemo(() => filterLockerTaskViews(views, lane, status), [views, lane, status])
  const selected = views.find((item) => item.sourceId === selectedId || item.id === selectedId) || null

  return (
    <div className={styles.stack}>
      <div className={styles.chipRow}>
        {LANE_CHIPS.map((chip) => (
          <UiChip key={chip.id} active={lane === chip.id} onClick={() => onLaneChange(chip.id)}>
            {chip.label}
          </UiChip>
        ))}
      </div>
      <div className={styles.chipRow}>
        {STATUS_CHIPS.map((chip) => (
          <UiChip key={chip.id} active={status === chip.id} onClick={() => onStatusChange(chip.id)}>
            {chip.label}
          </UiChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>{emptyCopy(lane)}</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((item, index) => {
            const group = getMatchdayGroup(item.matchdayGroupId)
            const prevGroup = index > 0 ? filtered[index - 1].matchdayGroupId : null
            const showGroup = Boolean(group && item.matchdayGroupId !== prevGroup)
            const groupViews = filtered.filter((entry) => entry.matchdayGroupId === item.matchdayGroupId)
            const groupDone = groupViews.filter((entry) => entry.status === 'completed').length
            const done = item.status === 'completed'
            return (
              <Fragment key={item.id}>
                {showGroup && group ? (
                  <p className={styles.group}>
                    {group.shortLabel}
                    {' · '}
                    {groupDone} / {groupViews.length} Matchday Achievements
                  </p>
                ) : null}
                <button
                  type="button"
                  className={`${styles.card} ${done ? styles.cardDone : ''}`}
                  onClick={() => onSelect(item.sourceId)}
                >
                  <span className={styles.rowTop}>
                    <strong>{item.secretHidden ? 'Geheimnis' : item.title}</strong>
                    <UiPill>{LANE_LABELS[item.lane]}</UiPill>
                  </span>
                  {!item.secretHidden ? (
                    <>
                      {item.description ? <p className={styles.cardDesc}>{item.description}</p> : null}
                      <UiProgress
                        value={item.current}
                        max={item.target || 1}
                        label={item.title}
                        size="sm"
                        complete={done}
                      />
                      <span className={styles.rowMeta}>
                        <span>{item.current} / {item.target}</span>
                        {item.rewardLabel ? <span>{compactRewardLabel(item.rewards)}</span> : null}
                        <span>{statusLabel(item.status)}</span>
                      </span>
                    </>
                  ) : (
                    <span className={styles.rowMeta}>Geheimnis — weiter spielen</span>
                  )}
                </button>
              </Fragment>
            )
          })}
        </div>
      )}

      <UiSheet
        open={Boolean(selected)}
        onClose={() => onSelect(null)}
        title={selected?.secretHidden ? 'Geheimnis' : selected?.title || ''}
        meta={selected ? `${LANE_LABELS[selected.lane]} · ${statusLabel(selected.status)}` : undefined}
      >
        {selected && !selected.secretHidden ? (
          <>
            <p className={styles.detailLead}>{selected.description}</p>
            <div className={styles.detailBlock}>
              <span>Progress</span>
              <strong>{selected.current} / {selected.target}</strong>
              <UiProgress value={selected.current} max={selected.target || 1} label={selected.title} />
            </div>
            {selected.rewardLabel ? (
              <div className={styles.detailBlock}>
                <span>Reward</span>
                <strong>{selected.rewardLabel}</strong>
              </div>
            ) : null}
            <div className={styles.detailBlock}>
              <span>{selected.lane === 'permanent' ? 'Zeitraum' : 'Expires'}</span>
              <strong>{selected.windowLabel}</strong>
            </div>
            {selected.challenge?.progress.boundVenueId ? (
              <div className={styles.detailBlock}>
                <span>Arena</span>
                <strong>{getVenue(selected.challenge.progress.boundVenueId)?.name || selected.challenge.progress.boundVenueId}</strong>
              </div>
            ) : null}
            {selected.challenge?.progress.boundGameId ? (
              <div className={styles.detailBlock}>
                <span>Spiel</span>
                <strong>{selected.challenge.progress.boundGameId}</strong>
                {selected.challenge.progress.completedAt ? (
                  <em>{new Date(selected.challenge.progress.completedAt).toLocaleString('de-DE')}</em>
                ) : null}
              </div>
            ) : null}
            {selected.matchdayGroupId ? (
              <div className={styles.detailBlock}>
                <span>Matchday</span>
                <strong>{getMatchdayGroup(selected.matchdayGroupId)?.shortLabel || 'Matchday'}</strong>
                <em>
                  {views.filter((item) => item.matchdayGroupId === selected.matchdayGroupId && item.status === 'completed').length}
                  {' / '}
                  {views.filter((item) => item.matchdayGroupId === selected.matchdayGroupId).length}
                  {' gesammelt'}
                </em>
              </div>
            ) : null}
            {selected.collectionName ? (
              <div className={styles.detailBlock}>
                <span>Teil von</span>
                <strong>{selected.collectionName} Collection</strong>
                {selected.collectionTotal ? (
                  <em>{selected.collectionOwned} / {selected.collectionTotal} gesammelt</em>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className={styles.detailLead}>Geheimnis — weiter spielen</p>
        )}
        <UiSheetActions
          secondary={
            <UiButton type="button" variant="secondary" onClick={() => onSelect(null)}>
              Abbrechen
            </UiButton>
          }
        />
      </UiSheet>
    </div>
  )
}
