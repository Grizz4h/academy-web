/**
 * Unified Home/Locker task views.
 * Run: npx --yes tsx src/features/progression/tasks/taskViews.test.ts
 */
import { contentRegistry, runContentValidation } from '../../../content/registry'
import { getActiveProgressViews, syncChallengeRotation } from '../challenges/challengeEngine'
import {
  compactRewardLabel,
  filterLockerTaskViews,
  formatRewardLabel,
  selectHomeTodaySummary,
  selectLockerTaskViews,
  validateHomeLockerIntegrity,
} from './taskViews'
import type { ProgressionViewState } from '../selectors'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const now = new Date('2026-08-15T12:00:00')
const emptyState: ProgressionViewState = {
  xp: 0,
  unlockedAchievements: {},
  unlockedCosmetics: {},
  activityLog: [],
  unlockHistory: [],
}

const synced = syncChallengeRotation({
  definitions: contentRegistry.challenges,
  pools: contentRegistry.pools,
  campaigns: contentRegistry.campaigns,
  progress: {},
  matchday: null,
  now,
  userId: 'christoph',
})

const home = getActiveProgressViews({
  definitions: contentRegistry.challenges,
  pools: contentRegistry.pools,
  campaigns: contentRegistry.campaigns,
  progress: synced.progress,
  rotation: synced.rotation,
  matchday: null,
  now,
  userId: 'christoph',
})

const locker = selectLockerTaskViews({
  state: emptyState,
  definitions: contentRegistry.challenges,
  pools: contentRegistry.pools,
  campaigns: contentRegistry.campaigns,
  progress: synced.progress,
  rotation: synced.rotation,
  matchday: null,
  now,
  userId: 'christoph',
})

{
  const lookHome = home.find((item) => item.definition.id === 'challenge_daily_look_again')
  const lookLocker = locker.find((item) => item.sourceId === 'challenge_daily_look_again')
  assert(Boolean(lookHome), 'Look Again is an active Home daily')
  assert(Boolean(lookLocker), 'Look Again is resolvable in Locker')
  assert(lookLocker?.lane === 'daily', 'Look Again is in Daily lane')
  assert(lookHome?.definition.title === lookLocker?.title, 'Home and Locker share the same title')
  assert(
    formatRewardLabel(lookHome!.definition.rewards) === lookLocker?.rewardLabel,
    'Home and Locker share the same reward label',
  )
  assert(lookHome!.progress.requirements[0].current === lookLocker!.current, 'Home and Locker share progress')
}

{
  const daily = filterLockerTaskViews(locker, 'daily')
  const weekly = filterLockerTaskViews(locker, 'weekly')
  const matchday = filterLockerTaskViews(locker, 'matchday')
  const permanent = filterLockerTaskViews(locker, 'permanent')
  const all = filterLockerTaskViews(locker, 'all')
  assert(daily.every((item) => item.lane === 'daily'), 'Daily filter is daily only')
  assert(weekly.every((item) => item.lane === 'weekly'), 'Weekly filter is weekly only')
  assert(matchday.every((item) => item.lane === 'matchday'), 'Matchday filter is matchday only')
  assert(permanent.every((item) => item.lane === 'permanent' && item.source === 'achievement'), 'Permanent is achievements only')
  assert(all.length === locker.length, 'Alle shows every relevant task')
  assert(daily.some((item) => item.sourceId === 'challenge_daily_look_again'), 'Daily filter contains Look Again')
  assert(!permanent.some((item) => item.sourceId === 'challenge_daily_look_again'), 'Look Again is not a permanent achievement')
}

{
  const summary = selectHomeTodaySummary(locker, null)
  assert(summary.daily.total >= 1, 'Home daily summary counts Look Again')
  assert(summary.matchday.total >= 3, 'bound matchday set is visible without today slate')
  assert(summary.matchday.empty === false, 'prototype matchday is not treated as empty')
  assert(summary.highlight?.source === 'challenge', 'Home highlight comes from the same challenge views')
  if (summary.highlight?.sourceId === 'challenge_daily_look_again') {
    assert(summary.highlight.rewardLabel === formatRewardLabel(contentRegistry.challenges.find((item) => item.id === 'challenge_daily_look_again')!.rewards), 'highlight reward is registry data')
  }
}

{
  const set = locker.filter((item) => item.matchdayGroupId === 'matchday_del_2025_2026_aev_str_2025-12-21')
  assert(set.length === 3, 'AEV–STR matchday set has 3 challenges')
  assert(set.every((item) => item.challenge?.definition.context?.gameId === 'del:2025_2026:21122025_augsburger-panther_gg_straubing-tigers_4151'), 'all three bind the same gameId')
  assert(set.some((item) => item.sourceId.endsWith('form_check')), 'pregame form check exists')
  assert(set.some((item) => item.sourceId.endsWith('pressure_watch')), 'ingame pressure watch exists')
  assert(set.some((item) => item.sourceId.endsWith('read_it_back')), 'postgame read it back exists')
  const dailyFilter = filterLockerTaskViews(locker, 'daily')
  assert(!dailyFilter.some((item) => item.matchdayGroupId), 'matchday set is not in Daily')
}

{
  const look = contentRegistry.challenges.find((item) => item.id === 'challenge_daily_look_again')
  assert(Boolean(look), 'Look Again is defined once in the challenge registry')
  assert(look?.rewards[0].type === 'pux' && compactRewardLabel(look.rewards) === '+20 Pux', 'compact reward comes from definition')
}

{
  const issues = validateHomeLockerIntegrity({
    challenges: contentRegistry.challenges,
    pools: contentRegistry.pools,
    campaigns: contentRegistry.campaigns,
    now,
    userId: 'christoph',
  })
  assert(issues.length === 0, `home/locker integrity: ${issues.map((item) => item.message).join('; ')}`)
}

{
  const errors = runContentValidation().filter((item) => item.severity === 'error')
  assert(errors.length === 0, `content validation: ${errors.map((item) => item.message).join('; ')}`)
}

console.log('taskViews.test.ts: all assertions passed')
