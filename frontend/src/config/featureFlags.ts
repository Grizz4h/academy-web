/**
 * Temporary visibility flags for unfinished product surfaces.
 * Flip `navVisible` to true when a feature is ready for the main demo nav.
 * Routes stay registered either way; only the top tabs are gated.
 */

import { useEffect, useState } from 'react'

export type NavFeature = {
  to: string
  label: string
  /** Show in the public top navigation. */
  navVisible: boolean
  /** Only for creator-mode accounts (server flag on /api/me). */
  creatorOnly?: boolean
  /** Exact match for NavLink `end` (home). */
  exact?: boolean
  /** Optional group for the hidden Dev hub. */
  group?: 'core' | 'lab' | 'observation'
  /** Short note shown on /dev. */
  note?: string
}

export const NAV_FEATURES: NavFeature[] = [
  { to: '/', label: 'Start', navVisible: true, exact: true, group: 'core' },
  { to: '/curriculum', label: 'Akademie', navVisible: true, group: 'core' },
  {
    to: '/lab',
    label: 'Lab',
    navVisible: false,
    group: 'lab',
    note: 'Predict / Experimente – noch WIP, deshalb aus der Demo-Nav ausgelagert.',
  },
  { to: '/history', label: 'Verlauf', navVisible: true, group: 'core' },
  { to: '/progress', label: 'Stats', navVisible: true, group: 'core' },
  {
    to: '/observation/setup',
    label: 'Obs Setup',
    navVisible: false,
    group: 'observation',
    note: 'Spielerbeobachtung Setup – intern, noch nicht Demo-ready.',
  },
  {
    to: '/observation/stats',
    label: 'Obs Stats',
    navVisible: false,
    group: 'observation',
    note: 'Spielerbeobachtung Stats – intern, noch nicht Demo-ready.',
  },
  { to: '/ringabout', label: 'Rink About It!', navVisible: true, group: 'core', creatorOnly: true },
  { to: '/off-the-rink', label: 'Off the Rink', navVisible: true, group: 'core', creatorOnly: true },
  { to: '/locker', label: 'Spind', navVisible: true, group: 'core' },
]

export type PublicNavTabsOptions = {
  /** Server-confirmed creator tools (/api/me creator_mode). */
  creatorMode?: boolean
}

export const DEV_MODE_STORAGE_KEY = 'academy.devNav'

export function isDevNavEnabled(): boolean {
  try {
    return localStorage.getItem(DEV_MODE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function useDevNavEnabled(): boolean {
  const [enabled, setEnabled] = useState(isDevNavEnabled)
  useEffect(() => {
    const sync = () => setEnabled(isDevNavEnabled())
    window.addEventListener('academy-dev-nav', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('academy-dev-nav', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return enabled
}

export function setDevNavEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEV_MODE_STORAGE_KEY, '1')
    else localStorage.removeItem(DEV_MODE_STORAGE_KEY)
    window.dispatchEvent(new Event('academy-dev-nav'))
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

export function getPublicNavTabs(options?: PublicNavTabsOptions): NavFeature[] {
  const creatorMode = options?.creatorMode ?? false
  const visible = NAV_FEATURES.filter((tab) => {
    if (!tab.navVisible) return false
    if (tab.creatorOnly && !creatorMode) return false
    return true
  })
  const regular = visible.filter((tab) => !tab.creatorOnly)
  const creator = visible.filter((tab) => tab.creatorOnly)
  return [...regular, ...creator]
}

export function getHiddenNavTabs(): NavFeature[] {
  return NAV_FEATURES.filter((tab) => !tab.navVisible)
}
