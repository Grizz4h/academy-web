/**
 * Public legal / contact constants for rInQ Tank.
 *
 * TODO(launch-legal): Set the official rInQ support/contact email before public launch.
 * Do not fall back to HIGHspeed / NOVADELTA addresses.
 */
export const RINQ_CONTACT_EMAIL: string | null = null

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
