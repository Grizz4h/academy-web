import { NAV_FEATURES } from '../../config/featureFlags'

export function getTutorialFeatures(): Record<string, boolean> {
  const visible = new Set(NAV_FEATURES.filter((tab) => tab.navVisible).map((tab) => tab.to))
  return {
    academy: visible.has('/curriculum'),
    history: visible.has('/history'),
    locker: visible.has('/locker'),
    scenes: visible.has('/ringabout'),
    stats: visible.has('/progress'),
  }
}

export function stepAllowed(
  when: { feature?: string } | undefined,
  features: Record<string, boolean>,
): boolean {
  if (!when?.feature) return true
  return features[when.feature] !== false
}
