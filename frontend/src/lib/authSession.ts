/** Session-timeout / auth expiry coordination (legacy JWT + Supabase access token). */

export const AUTH_EXPIRED_EVENT = 'academy-auth-expired'

export type AuthExpiredDetail = {
  /** Human-facing reason for the login screen. */
  reason: string
}

export const AUTH_EXPIRED_DEFAULT_REASON =
  'Deine Anmeldung ist abgelaufen. Aus Sicherheitsgründen musst du dich nach längerer Zeit erneut anmelden.'

export function notifyAuthExpired(reason: string = AUTH_EXPIRED_DEFAULT_REASON): void {
  try {
    window.dispatchEvent(
      new CustomEvent<AuthExpiredDetail>(AUTH_EXPIRED_EVENT, {
        detail: { reason },
      }),
    )
  } catch {
    // ignore (SSR / non-browser)
  }
}

export function isAuthEndpointUrl(url: string): boolean {
  return (
    url.includes('/auth/login')
    || url.includes('/auth/signup')
    || url.includes('/auth/registration')
  )
}
