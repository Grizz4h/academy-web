import { useId } from 'react'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function ScrapPuck({ decorative = true, className, title = 'Scrap Puck' }: ArtProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `sp-${uid}-${name}`

  return (
    <svg
      className={className}
      viewBox="0 0 256 256"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      <defs>
        <radialGradient id={id('core')} cx="40%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#5a4636" />
          <stop offset="42%" stopColor="#2a2018" />
          <stop offset="78%" stopColor="#120e0c" />
          <stop offset="100%" stopColor="#050403" />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8c8a8" />
          <stop offset="35%" stopColor="#8a7a62" />
          <stop offset="100%" stopColor="#2a2018" />
        </linearGradient>
        <linearGradient id={id('rust')} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a1c0c" />
          <stop offset="55%" stopColor="#c45a1c" />
          <stop offset="100%" stopColor="#e08a40" />
        </linearGradient>
        <linearGradient id={id('plate')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6a5a48" />
          <stop offset="100%" stopColor="#1c1612" />
        </linearGradient>
        <clipPath id={id('disk')}>
          <circle cx="128" cy="128" r="103" />
        </clipPath>
        <filter id={id('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.4" />
          </feComponentTransfer>
        </filter>
      </defs>

      <ellipse cx="128" cy="168" rx="96" ry="22" fill="#000" opacity="0.38" />

      <g>
        <circle cx="128" cy="128" r="98" fill={`url(#${id('core')})`} stroke={`url(#${id('rim')})`} strokeWidth="11" />
        <circle cx="128" cy="128" r="82" fill="none" stroke="#8a6a42" strokeWidth="3.2" opacity="0.55" />
        <circle cx="128" cy="128" r="58" fill="none" stroke="#2a2018" strokeWidth="7" />
        <path d="M86 86 L170 86 L176 128 L168 170 L88 168 L80 126 Z" fill={`url(#${id('plate')})`} opacity="0.35" />
        <path d="M54 114 C92 86 156 82 206 120" fill="none" stroke={`url(#${id('rust')})`} strokeWidth="3.4" />
        <path d="M58 152 C108 184 168 176 202 140" fill="none" stroke="#6a3014" strokeWidth="2.6" />
        <path d="M78 64 L176 198" stroke="#1a1410" strokeWidth="2.2" opacity="0.5" />
        <path d="M196 78 L70 172" stroke="#c4a070" strokeWidth="1.5" opacity="0.4" />
        <path d="M96 96 L150 92 L158 140 L102 146 Z" fill="none" stroke="#c9a45a" strokeWidth="1.3" opacity="0.35" />

        {[
          [68, 108],
          [188, 104],
          [92, 188],
          [170, 184],
          [128, 58],
          [128, 198],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="8" fill={`url(#${id('rim')})`} />
            <circle r="2.6" fill="#14100c" />
          </g>
        ))}

        <path d="M108 74 C118 70 138 70 148 76" fill="none" stroke="#e8d2a0" strokeWidth="1.4" opacity="0.45" />
        <text x="128" y="122" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#d8b070" opacity="0.7">
          RT
        </text>
        <text x="128" y="140" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13" fill="#e8c070" opacity="0.85">
          WL-07
        </text>
        <rect width="256" height="256" filter={`url(#${id('grain')})`} opacity="0.3" style={{ mixBlendMode: 'multiply' }} clipPath={`url(#${id('disk')})`} />
      </g>
    </svg>
  )
}
