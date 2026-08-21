import type { ReactNode } from 'react'

type MarkProps = {
  children?: ReactNode
}

/**
 * Shared 3/4 ice-resurfacer silhouette.
 * Front/cab on the right, tank in the middle, conditioner on the left.
 */
export function ZamboniMark({ children }: MarkProps) {
  return (
    <g>
      <ellipse cx="118" cy="146" rx="96" ry="11" fill="#00E5FF" opacity="0.18" />
      <ellipse cx="118" cy="148" rx="88" ry="8" fill="#050505" opacity="0.45" />

      {/* Rear conditioner (left) */}
      <path d="M14 108 L78 100 L86 126 L10 132 Z" fill="#0B0F15" />
      <path d="M14 108 L42 92 L102 86 L78 100 Z" fill="#1A1A1B" />
      <path d="M10 132 L86 126 L88 134 L8 138 Z" fill="#C1C7D3" />
      <path d="M10 136 L86 130 L86 134 L10 140 Z" fill="#00E5FF" />

      {/* Side conveyor */}
      <path d="M78 104 L92 72 L104 70 L96 108 Z" fill="#0E0E0E" />
      <path d="M86 100 L96 76" stroke="#00E5FF" strokeWidth="2" opacity="0.7" />

      {/* Tank */}
      <path d="M52 56 L168 40 L172 112 L48 122 Z" fill="#1A1A1B" />
      <path d="M52 56 L86 28 L198 16 L168 40 Z" fill="#2A2D33" />
      <path d="M168 40 L198 16 L204 86 L172 112 Z" fill="#14161A" />
      <path d="M58 70 L164 56" stroke="#7C7F8B" strokeWidth="1.2" opacity="0.45" />
      <path d="M54 48 L166 34" stroke="#FF007A" strokeWidth="2.2" />
      <text
        x="108"
        y="86"
        fill="#FF007A"
        fontFamily="Impact, Haettenschweiler, sans-serif"
        fontSize="28"
        textAnchor="middle"
      >
        R
      </text>
      <text
        x="108"
        y="104"
        fill="#00E5FF"
        fontFamily="ui-monospace, monospace"
        fontSize="8"
        letterSpacing="1.4"
        textAnchor="middle"
      >
        RT-81
      </text>
      <path d="M132 78 L162 74 L164 92 L134 96 Z" fill="#00E5FF" opacity="0.18" />

      {/* Cab left-front */}
      <path d="M148 44 L186 38 L190 96 L152 106 Z" fill="#1A1A1B" />
      <path d="M154 48 L182 44 L184 76 L156 80 Z" fill="#081820" opacity="0.85" />
      <path d="M156 50 L178 47 L179 70 L157 73 Z" fill="#00E5FF" opacity="0.22" />
      <circle cx="176" cy="32" r="5.5" fill="#FF8A1F" />
      <circle cx="176" cy="32" r="2.4" fill="#FFE7C2" />

      {/* Front-right dump bin */}
      <path d="M172 62 L208 56 L214 104 L176 112 Z" fill="#0B0F15" />
      <path d="M176 62 L206 58 L208 70 L178 74 Z" fill="#7C7F8B" opacity="0.45" />

      {/* Fascia */}
      <path d="M204 58 L226 62 L228 112 L206 116 Z" fill="#0B0F15" />
      <circle cx="218" cy="76" r="4.2" fill="#E6F6FF" />
      <circle cx="218" cy="90" r="4.2" fill="#E6F6FF" />
      <circle cx="218" cy="76" r="2.2" fill="#00E5FF" />
      <circle cx="218" cy="90" r="2.2" fill="#00E5FF" />
      <rect x="210" y="96" width="14" height="6" rx="1" fill="#FF007A" />

      {/* Wheels */}
      <ellipse cx="46" cy="132" rx="14" ry="13" fill="#111" />
      <ellipse cx="46" cy="132" rx="8" ry="7.5" fill="#7C7F8B" />
      <ellipse cx="46" cy="132" rx="11" ry="10" fill="none" stroke="#00E5FF" strokeWidth="1.4" />
      <ellipse cx="78" cy="136" rx="16" ry="14" fill="#111" />
      <ellipse cx="78" cy="136" rx="9" ry="8" fill="#7C7F8B" />
      <ellipse cx="78" cy="136" rx="12.5" ry="11" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
      <ellipse cx="158" cy="130" rx="13" ry="12" fill="#111" />
      <ellipse cx="158" cy="130" rx="7.5" ry="7" fill="#7C7F8B" />
      <ellipse cx="158" cy="130" rx="10" ry="9.5" fill="none" stroke="#00E5FF" strokeWidth="1.3" />
      <ellipse cx="188" cy="134" rx="15" ry="13" fill="#111" />
      <ellipse cx="188" cy="134" rx="8.5" ry="7.5" fill="#7C7F8B" />
      <ellipse cx="188" cy="134" rx="12" ry="10.5" fill="none" stroke="#00E5FF" strokeWidth="1.5" />

      {children}
    </g>
  )
}
