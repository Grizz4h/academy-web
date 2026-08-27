/**
 * Legal document metadata — drafts pending lawyer review before paid launch.
 * Public canonical URLs follow the flat route convention (/agb, /widerruf, …).
 * Aliases under /legal/* exist for Stripe Dashboard convenience.
 */

export const LEGAL_DRAFT_BANNER =
  'Arbeitsentwurf für den Pre-Launch — vor echtem Paid Launch juristisch prüfen. Keine Garantie auf Rechtssicherheit.'

/** Visible stand of the AGB draft (ISO date + Entwurf marker). */
export const AGB_STAND = '2026-08-27 (Entwurf)'

/** Visible stand of the Widerrufsbelehrung draft. */
export const WIDERRUF_STAND = '2026-08-27 (Entwurf)'

export const LEGAL_PUBLIC_PATHS = {
  hub: '/legal',
  impressum: '/impressum',
  datenschutz: '/datenschutz',
  agb: '/agb',
  widerruf: '/widerruf',
  kontakt: '/kontakt',
  kuendigen: '/vertrag-kuendigen',
  widerrufAntrag: '/vertrag-widerrufen',
} as const

/** Absolute production URLs for Stripe Dashboard / consent links. */
export const LEGAL_PUBLIC_URLS = {
  agb: 'https://rinq-tank.de/agb',
  widerruf: 'https://rinq-tank.de/widerruf',
  datenschutz: 'https://rinq-tank.de/datenschutz',
  impressum: 'https://rinq-tank.de/impressum',
  kontakt: 'https://rinq-tank.de/kontakt',
} as const
