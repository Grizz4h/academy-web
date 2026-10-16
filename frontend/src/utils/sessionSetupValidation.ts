import { hasExplicitObservationScope } from './observationScope'

export const SESSION_SETUP_FIELD_IDS = {
  observedTeam: 'session-setup-observed-team',
  observationScope: 'session-setup-observation-scope',
} as const

export type SessionSetupRequiredField = keyof typeof SESSION_SETUP_FIELD_IDS

export type SessionSetupRequiredIssue = {
  field: SessionSetupRequiredField
  fieldId: string
  message: string
}

type RequiredCheckInput = {
  observedTeam?: string | null
  observationScope?: string | null
  /** Foundation / lesson setup skips live matchup requirements. */
  skipLiveMatchup?: boolean
}

/**
 * First missing live-setup required field (observed team, then observation scope).
 * Returns null when both are set — or when live matchup is not required.
 */
export function getFirstMissingSessionSetupRequiredField(
  input: RequiredCheckInput,
): SessionSetupRequiredIssue | null {
  if (input.skipLiveMatchup) return null

  if (!String(input.observedTeam || '').trim()) {
    return {
      field: 'observedTeam',
      fieldId: SESSION_SETUP_FIELD_IDS.observedTeam,
      message: 'Bitte wähle das beobachtete Team aus (Pflichtfeld).',
    }
  }

  if (!hasExplicitObservationScope(input.observationScope)) {
    return {
      field: 'observationScope',
      fieldId: SESSION_SETUP_FIELD_IDS.observationScope,
      message: 'Bitte wähle den Beobachtungsumfang (Drittel / gesamtes Spiel).',
    }
  }

  return null
}

/**
 * Scroll the target field into view (scroll-margin covers sticky TopNav) and focus
 * the first interactive control inside it when possible.
 */
export function scrollToSessionSetupField(fieldId: string): boolean {
  if (typeof document === 'undefined') return false
  const root = document.getElementById(fieldId)
  if (!root) return false

  root.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

  const focusTarget =
    root.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ? root
      : root.querySelector<HTMLElement>(
        'button:not([disabled]), [role="button"][tabindex]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      )

  if (focusTarget) {
    try {
      focusTarget.focus({ preventScroll: true })
    } catch {
      // Some environments may not support focus options.
      focusTarget.focus()
    }
  }

  return true
}
