import { useId } from 'react'
import { ZamboniMark } from './ZamboniMark'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function ZamboniPoster({ decorative = true, className, title = 'Zamboni RT-81' }: ArtProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `zb-${uid}-${name}`

  return (
    <svg
      className={className}
      viewBox="0 0 400 500"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0F15" />
          <stop offset="55%" stopColor="#101820" />
          <stop offset="100%" stopColor="#15202c" />
        </linearGradient>
        <radialGradient id={id('spot')} cx="58%" cy="22%" r="48%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#FF007A" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ice')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a36" />
          <stop offset="100%" stopColor="#0B0F15" />
        </linearGradient>
        <linearGradient id={id('wet')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#E6F6FF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.08" />
        </linearGradient>
        <filter id={id('glow')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="400" height="500" fill={`url(#${id('sky')})`} />
      <ellipse cx="230" cy="90" rx="180" ry="120" fill={`url(#${id('spot')})`} />
      <path d="M0 210 H400 V500 H0 Z" fill={`url(#${id('ice')})`} />
      <line x1="200" y1="210" x2="200" y2="500" stroke="#E6F6FF" strokeWidth="2" opacity="0.12" />
      <line x1="0" y1="338" x2="400" y2="338" stroke="#FF007A" strokeWidth="3" opacity="0.22" />
      <path
        d="M20 300 C90 278 170 286 300 270 C320 310 280 380 210 400 C90 420 30 390 20 340 Z"
        fill={`url(#${id('wet')})`}
      />
      <path
        d="M48 318 C140 300 220 304 310 288"
        fill="none"
        stroke="#E6F6FF"
        strokeWidth="10"
        opacity="0.22"
        filter={`url(#${id('glow')})`}
      />

      <g transform="translate(28,248) scale(1.42)">
        <ZamboniMark />
      </g>

      <text x="22" y="42" fontFamily="Impact, Haettenschweiler, 'Arial Narrow', sans-serif" fontSize="36" letterSpacing="4" fill="#E6F6FF">
        ZAMBONI
      </text>
      <text x="24" y="64" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2.2" fill="#00E5FF">
        RINK TANK · RT-81
      </text>
      <text x="22" y="478" fontFamily="ui-monospace, monospace" fontSize="11" fill="#7C7F8B">
        FRESH SHEET
      </text>
      <text x="286" y="478" fontFamily="ui-monospace, monospace" fontSize="11" fill="#FF007A">
        LTD EDITION
      </text>
      <rect x="8" y="8" width="384" height="484" fill="none" stroke="#00E5FF" strokeWidth="1.1" opacity="0.35" />
    </svg>
  )
}
