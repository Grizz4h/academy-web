import type { RewardEvent } from '../features/rewards/types'

export type RewardPreviewDraft = Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>

export const REWARD_PREVIEW_BRONZE: RewardPreviewDraft = {
  kind: 'achievement',
  title: 'Bronze Unlock',
  description: 'Kleiner Fortschritt freigeschaltet.',
  amountPux: 10,
  visualTier: 'bronze',
  icon: '1',
  variant: 'popup',
  autoCloseMs: 3200,
}

export const REWARD_PREVIEW_SILVER: RewardPreviewDraft = {
  kind: 'achievement',
  title: 'Silver Unlock',
  description: 'Stärkerer Reward freigeschaltet.',
  amountPux: 25,
  visualTier: 'silver',
  icon: '10',
  variant: 'popup',
  autoCloseMs: 3200,
}

export const REWARD_PREVIEW_GOLD: RewardPreviewDraft = {
  kind: 'achievement',
  title: 'Gold Unlock',
  description: 'Besonderes Achievement freigeschaltet.',
  amountPux: 50,
  visualTier: 'gold',
  icon: '50',
  variant: 'popup',
  autoCloseMs: 3600,
}

export const REWARD_PREVIEW_MASTERY: RewardPreviewDraft = {
  kind: 'mastery',
  title: 'Mastery Unlock',
  description: 'Höchste Stufe. Seltene Auszeichnung.',
  amountPux: 100,
  visualTier: 'mastery',
  icon: 'M',
  variant: 'hero',
  mastery: 'mastery',
  autoCloseMs: 4200,
}

export const REWARD_PREVIEW_PUX: RewardPreviewDraft = {
  kind: 'currency',
  title: 'PUX! erhalten',
  description: 'Drill abgeschlossen',
  amountPux: 10,
  visualTier: 'silver',
  icon: 'PUX',
  variant: 'small',
  autoCloseMs: 2600,
}

export const REWARD_PREVIEW_QUEUE = [
  REWARD_PREVIEW_BRONZE,
  REWARD_PREVIEW_SILVER,
  REWARD_PREVIEW_GOLD,
] as const

/** Simulates session completion: PUX toast first, then tier popups. */
export const REWARD_PREVIEW_SESSION_QUEUE = [
  REWARD_PREVIEW_PUX,
  ...REWARD_PREVIEW_QUEUE,
  REWARD_PREVIEW_MASTERY,
] as const

export const DEV_REWARDS_STORAGE_KEY = 'academy.devRewards'
export const DEV_LAST_PUX_GRANT_KEY = 'academy.devLastPuxGrant'

export function isFloatingRewardDevToolsEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (new URLSearchParams(window.location.search).get('rewardsDebug') === '1') return true
    return localStorage.getItem(DEV_REWARDS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setFloatingRewardDevToolsEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEV_REWARDS_STORAGE_KEY, '1')
    else localStorage.removeItem(DEV_REWARDS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
