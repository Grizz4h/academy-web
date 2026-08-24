import type { CurriculumModule } from '../../api'
import { ACADEMY_PREMIUM_FEATURE, type EntitlementGrant } from './types'

/** Server sets this on filtered curriculum modules (Phase 5B). */
export function isModulePremiumLocked(module: Pick<CurriculumModule, 'premium_locked'> | null | undefined): boolean {
  return module?.premium_locked === true
}

export function hasAcademyPremium(grants: EntitlementGrant[] | null | undefined): boolean {
  return (grants || []).some(
    (grant) => grant.feature_key === ACADEMY_PREMIUM_FEATURE && grant.status === 'active',
  )
}

export function premiumLockMessage(moduleId?: string | null): string {
  const label = moduleId ? ` (${moduleId})` : ''
  return `Dieses Modul${label} gehört zu RinQ Premium (Track A2+). Premium kannst du im Account oder Lehrplan freischalten.`
}
