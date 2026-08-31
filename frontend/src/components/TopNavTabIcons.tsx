/** Minimal outline icons for mobile TopNav tiles. Color via currentColor. */

import type { ReactElement, ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {children}
    </svg>
  )
}

const stroke = {
  width: 1.75,
  cap: 'round' as const,
  join: 'round' as const,
}

export function NavIconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4.5 10.8 12 4.5l7.5 6.3V19a1.2 1.2 0 0 1-1.2 1.2h-4.3v-5.2h-4V20.2H5.7A1.2 1.2 0 0 1 4.5 19v-8.2Z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
    </Svg>
  )
}

export function NavIconAcademy({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M3.5 9.5 12 5l8.5 4.5L12 14 3.5 9.5Z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M7 11.5v4.2c1.4 1.1 3.1 1.8 5 1.8s3.6-.7 5-1.8v-4.2"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M20.5 9.5v5.2"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </Svg>
  )
}

export function NavIconHistory({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="6" cy="7" r="2" stroke="currentColor" strokeWidth={stroke.width} />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth={stroke.width} />
      <circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth={stroke.width} />
      <path
        d="M8 7.5h6.2c1.6 0 2.8 1.2 2.8 2.8V10"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M8 16.5h6.2c1.6 0 2.8-1.2 2.8-2.8V14"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
    </Svg>
  )
}

export function NavIconStats({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M5 19V11M10.5 19V7M16 19v-5.5M21.5 19V9"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
      <path
        d="M3.5 19.5h18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap={stroke.cap}
        opacity="0.55"
      />
    </Svg>
  )
}

export function NavIconLocker({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect
        x="4.5"
        y="3.5"
        width="15"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth={stroke.width}
      />
      <path d="M12 3.5v17" stroke="currentColor" strokeWidth={stroke.width} />
      <circle cx="9.2" cy="12" r="1" fill="currentColor" />
      <circle cx="14.8" cy="12" r="1" fill="currentColor" />
    </Svg>
  )
}

export function NavIconColumn({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="1.6"
        stroke="currentColor"
        strokeWidth={stroke.width}
      />
      <path
        d="M8.2 8h7.6M8.2 11.2h7.6M8.2 14.4h5.2"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </Svg>
  )
}

export function NavIconClapper({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4.5 9.5h15v9.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 19V9.5Z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M4.5 9.5 7 4.5h12.5L17 9.5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M8.2 4.9 9.5 9.5M12.2 4.7 13 9.5M16.2 4.8 16.5 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap={stroke.cap}
      />
    </Svg>
  )
}

export function NavIconLab({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M9.5 3.5h5M10.5 3.5v5.2L6.2 17.2A2.4 2.4 0 0 0 8.3 20.5h7.4a2.4 2.4 0 0 0 2.1-3.3L13.5 8.7V3.5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M8.2 14.5h7.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap={stroke.cap}
        opacity="0.65"
      />
    </Svg>
  )
}

export function NavIconEye({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M2.8 12c2.4-4 5.6-6 9.2-6s6.8 2 9.2 6c-2.4 4-5.6 6-9.2 6s-6.8-2-9.2-6Z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth={stroke.width} />
    </Svg>
  )
}

export function NavIconEyeStats({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M3.2 9.5c2-3.2 4.6-4.7 7.3-4.7 2.2 0 4.1.9 5.8 2.5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <circle cx="10.5" cy="9.8" r="2" stroke="currentColor" strokeWidth={stroke.width} />
      <path
        d="M15.5 14.2v5.3M18.2 12.5v7M20.9 15.5v4"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </Svg>
  )
}

export function NavIconDev({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M8.5 7.5 4.5 12l4 4.5M15.5 7.5 19.5 12l-4 4.5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M13.2 6.5 10.8 17.5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </Svg>
  )
}

const CORE_NAV_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  '/': NavIconHome,
  '/curriculum': NavIconAcademy,
  '/history': NavIconHistory,
  '/progress': NavIconStats,
  '/locker': NavIconLocker,
}

const SECONDARY_NAV_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  '/ringabout': NavIconClapper,
  '/off-the-rink': NavIconColumn,
  '/lab': NavIconLab,
  '/observation/setup': NavIconEye,
  '/observation/stats': NavIconEyeStats,
  '/dev': NavIconDev,
}

const ALL_NAV_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  ...CORE_NAV_ICONS,
  ...SECONDARY_NAV_ICONS,
}

export function isCoreNavTile(to: string): boolean {
  return Object.prototype.hasOwnProperty.call(CORE_NAV_ICONS, to)
}

export function isSecondaryNavTile(to: string): boolean {
  return Object.prototype.hasOwnProperty.call(SECONDARY_NAV_ICONS, to)
}

export function NavTabIcon({ to, className }: { to: string; className?: string }) {
  const Icon = ALL_NAV_ICONS[to]
  if (!Icon) return null
  return <Icon className={className} />
}
