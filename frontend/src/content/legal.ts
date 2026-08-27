/**
 * Public legal / contact constants for rInQ Tank.
 *
 * Official support/contact address (confirmed).
 */
export const RINQ_CONTACT_EMAIL = 'kontakt@rinq-tank.de'

export const RINQ_PROVIDER = {
  name: 'Christoph Rabhansl',
  careOf: 'c/o MDC Management#4062',
  street: 'Welserstraße 3',
  cityLine: '87463 Dietmannsried',
  country: 'Deutschland',
} as const

/** Related content project — not rInQ Tank support channels. */
export const RINK_ABOUT_IT_LINKS = [
  { platform: 'TikTok', href: 'https://www.tiktok.com/@rinkaboutit' },
  { platform: 'Instagram', href: 'https://www.instagram.com/rinkaboutit' },
  { platform: 'YouTube', href: 'https://youtube.com/@rinkaboutit' },
  { platform: 'X', href: 'https://x.com/rinkabout' },
] as const

/** Client-reported app build label for support mails (not a secret). */
export const APP_VERSION =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_VERSION) || 'dev'

export type ProblemReportContext = {
  path?: string
  drillId?: string
  sessionId?: string
  moduleId?: string
  note?: string
}

/** Mailto for in-app „Problem melden“ — includes route + optional drill/session ids. */
export function buildProblemReportMailto(ctx: ProblemReportContext = {}): string {
  const path = ctx.path || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const lines = [
    'Kurzbeschreibung des Problems:',
    '',
    '',
    '---',
    `App: rInQ Tank ${APP_VERSION}`,
    `Pfad: ${path}`,
    ctx.moduleId ? `Modul: ${ctx.moduleId}` : null,
    ctx.drillId ? `Drill: ${ctx.drillId}` : null,
    ctx.sessionId ? `Session: ${ctx.sessionId}` : null,
    ctx.note ? `Notiz: ${ctx.note}` : null,
    `Zeit: ${new Date().toISOString()}`,
  ].filter(Boolean)

  const subject = encodeURIComponent(
    ctx.drillId ? `rInQ Problem · ${ctx.drillId}` : 'rInQ Problem melden',
  )
  const body = encodeURIComponent(lines.join('\n'))
  return `mailto:${RINQ_CONTACT_EMAIL}?subject=${subject}&body=${body}`
}
