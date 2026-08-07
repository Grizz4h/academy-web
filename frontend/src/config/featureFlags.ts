/**
 * Temporary visibility flags for unfinished product surfaces.
 * Flip `navVisible` to true when a feature is ready for the main demo nav.
 * Routes stay registered either way; only the top tabs are gated.
 */

export type NavFeature = {
  to: string
  label: string
  /** Show in the public top navigation. */
  navVisible: boolean
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
  { to: '/ringabout', label: 'Rink About It', navVisible: true, group: 'core' },
]

export const DEV_MODE_STORAGE_KEY = 'academy.devNav'

export function isDevNavEnabled(): boolean {
  try {
    return localStorage.getItem(DEV_MODE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setDevNavEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEV_MODE_STORAGE_KEY, '1')
    else localStorage.removeItem(DEV_MODE_STORAGE_KEY)
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

export function getPublicNavTabs(): NavFeature[] {
  return NAV_FEATURES.filter((tab) => tab.navVisible)
}

export function getHiddenNavTabs(): NavFeature[] {
  return NAV_FEATURES.filter((tab) => !tab.navVisible)
}
