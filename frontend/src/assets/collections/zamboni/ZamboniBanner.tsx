import { useId } from 'react'
import { ZamboniMark } from './ZamboniMark'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function ZamboniBanner({ decorative = true, className, title = 'Night Cut' }: ArtProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `zbanner-${uid}-${name}`

  return (
    <svg
      className={className}
      viewBox="0 0 960 240"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={id('wet')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.05" />
          <stop offset="55%" stopColor="#E6F6FF" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="960" height="240" fill="#0B0F15" />
      <rect x="48" y="28" width="864" height="184" rx="18" fill="#101820" stroke="#1A1A1B" strokeWidth="3" />
      <line x1="480" y1="32" x2="480" y2="208" stroke="#FF007A" strokeWidth="3" opacity="0.35" />
      <line x1="280" y1="32" x2="280" y2="208" stroke="#00E5FF" strokeWidth="3" opacity="0.28" />
      <line x1="680" y1="32" x2="680" y2="208" stroke="#00E5FF" strokeWidth="3" opacity="0.28" />
      <circle cx="480" cy="120" r="26" fill="none" stroke="#E6F6FF" strokeWidth="2" opacity="0.2" />
      <path d="M90 128 H870" fill="none" stroke={`url(#${id('wet')})`} strokeWidth="22" />
      <g transform="translate(360,58) scale(0.92)">
        <ZamboniMark />
      </g>
      <text x="72" y="58" fill="#00E5FF" fontFamily="ui-monospace, monospace" fontSize="14" letterSpacing="3">
        NIGHT CUT
      </text>
      <text x="780" y="210" fill="#FF007A" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="2">
        RT-81
      </text>
    </svg>
  )
}
