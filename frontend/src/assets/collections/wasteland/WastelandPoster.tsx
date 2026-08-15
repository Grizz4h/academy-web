import { useId } from 'react'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function WastelandPoster({ decorative = true, className, title = 'Wasteland' }: ArtProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `wl-${uid}-${name}`

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
          <stop offset="0%" stopColor="#120c0a" />
          <stop offset="28%" stopColor="#3a1c10" />
          <stop offset="52%" stopColor="#8a3a14" />
          <stop offset="74%" stopColor="#c47a32" />
          <stop offset="100%" stopColor="#e8c078" />
        </linearGradient>
        <radialGradient id={id('sun')} cx="78%" cy="30%" r="42%">
          <stop offset="0%" stopColor="#fff3c8" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#f0b45a" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#c45a18" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7a2808" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5634" />
          <stop offset="18%" stopColor="#4a3220" />
          <stop offset="55%" stopColor="#241810" />
          <stop offset="100%" stopColor="#0c0806" />
        </linearGradient>
        <linearGradient id={id('rust')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a3414" />
          <stop offset="45%" stopColor="#d06828" />
          <stop offset="100%" stopColor="#3a180c" />
        </linearGradient>
        <linearGradient id={id('steel')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#b8aea0" />
          <stop offset="38%" stopColor="#6a6258" />
          <stop offset="100%" stopColor="#1c1814" />
        </linearGradient>
        <linearGradient id={id('plate')} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4030" />
          <stop offset="100%" stopColor="#1a100c" />
        </linearGradient>
        <linearGradient id={id('warn')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c47a14" />
          <stop offset="50%" stopColor="#f0d06a" />
          <stop offset="100%" stopColor="#8a4a0c" />
        </linearGradient>
        <radialGradient id={id('puck')} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#4a3a2c" />
          <stop offset="70%" stopColor="#16110d" />
          <stop offset="100%" stopColor="#050403" />
        </radialGradient>
        <filter id={id('blur')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={id('soft')} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="11" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g">
            <feFuncA type="table" tableValues="0 0.42 0.12 0.38" />
          </feComponentTransfer>
        </filter>
        <clipPath id={id('frame')}>
          <rect width="400" height="500" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id('frame')})`}>
        {/* Sky / heat */}
        <rect width="400" height="500" fill={`url(#${id('sky')})`} />
        <circle cx="308" cy="132" r="118" fill={`url(#${id('sun')})`} />
        <ellipse cx="300" cy="138" rx="36" ry="34" fill="#fff6d0" opacity="0.55" />
        <path d="M40 210 C120 188 220 196 390 168" fill="none" stroke="#f0c080" strokeWidth="18" opacity="0.12" filter={`url(#${id('blur')})`} />

        {/* Distant wreckage / arena bones */}
        <g fill="#120c08" opacity="0.78">
          <path d="M-10 268 L18 214 L46 268" />
          <path d="M54 270 L78 198 L98 198 L118 270" />
          <path d="M122 268 L138 228 L162 228 L176 268" />
          <path d="M292 268 L310 210 L338 210 L358 268" />
          <path d="M250 268 L268 236 L286 268" />
        </g>
        <g fill="#1a100c" opacity="0.55">
          <rect x="22" y="188" width="8" height="80" />
          <rect x="70" y="162" width="10" height="108" />
          <rect x="318" y="148" width="11" height="122" />
          <rect x="352" y="176" width="7" height="92" />
        </g>

        {/* Floodlight towers */}
        <g>
          <path d="M48 268 L58 96 L74 96 L86 268" fill="#14100c" />
          <path d="M42 96 h48 l-8 16 h-34 z" fill="#2a2018" />
          <path d="M54 88 h28 v10 h-28 z" fill={`url(#${id('rust')})`} />
          <path d="M66 96 L66 58 L92 42" fill="none" stroke="#2a1c12" strokeWidth="4" />
          <ellipse cx="96" cy="40" rx="16" ry="10" fill="#3a2a18" stroke="#c49a48" strokeWidth="1.4" />
          <ellipse cx="96" cy="40" rx="7" ry="4" fill="#f0d090" opacity="0.35" />

          <path d="M322 270 L332 82 L352 82 L364 270" fill="#120e0a" />
          <path d="M314 82 h56 l-8 18 h-42 z" fill="#241810" />
          <path d="M328 72 h32 v12 h-32 z" fill={`url(#${id('steel')})`} />
          <path d="M348 82 L360 44 L392 58" fill="none" stroke="#1c1410" strokeWidth="4" />
          <ellipse cx="394" cy="56" rx="18" ry="11" fill="#2c2218" />
          <ellipse cx="394" cy="56" rx="8" ry="5" fill="#e8c070" opacity="0.28" />
        </g>

        {/* Ground / cracked rink */}
        <path d="M-24 262 L88 244 L214 240 L332 246 L424 268 L424 500 L-24 500 Z" fill={`url(#${id('ground')})`} />
        <path d="M62 258 L200 250 L338 260 L322 402 L78 408 Z" fill="#2c2218" opacity="0.62" />
        <path d="M78 262 L190 254 L310 262 L300 388 L86 394 Z" fill="#1c1612" opacity="0.5" />
        <circle cx="196" cy="322" r="42" fill="none" stroke="#8a6a48" strokeWidth="2.4" opacity="0.28" />
        <circle cx="196" cy="322" r="6" fill="#6a4a30" opacity="0.35" />
        <path d="M92 318 L300 312" stroke="#7a5a3a" strokeWidth="2" opacity="0.22" />
        <path d="M84 392 L314 384" stroke="#4a3220" strokeWidth="5" opacity="0.45" />
        <g fill="none" stroke="#3a2a1c" strokeWidth="1.4" opacity="0.45">
          <path d="M110 280 L128 360 L118 400" />
          <path d="M240 274 L228 348 L250 396" />
          <path d="M160 400 L196 330 L250 292" />
        </g>
        <text x="168" y="338" fontFamily="ui-monospace, monospace" fontSize="28" fill="#c49a5a" opacity="0.12" letterSpacing="4">
          07
        </text>

        {/* Destroyed boards */}
        <g>
          <path d="M8 248 L86 236 L92 292 L4 308 Z" fill={`url(#${id('plate')})`} stroke="#1a100c" strokeWidth="2" />
          <path d="M18 252 l62 -8" stroke={`url(#${id('warn')})`} strokeWidth="7" />
          <path d="M16 266 l64 -8" stroke="#1a120c" strokeWidth="7" />
          <circle cx="22" cy="258" r="3.2" fill="#8a8478" />
          <circle cx="74" cy="250" r="3.2" fill="#8a8478" />
          <path d="M308 240 L398 252 L392 312 L300 294 Z" fill={`url(#${id('plate')})`} stroke="#140e0a" strokeWidth="2" />
          <path d="M318 256 l70 10" stroke={`url(#${id('warn')})`} strokeWidth="6" />
          <path d="M316 270 l72 10" stroke="#16100c" strokeWidth="6" />
          <circle cx="324" cy="262" r="3" fill="#9a9488" />
          <circle cx="372" cy="270" r="3" fill="#9a9488" />
        </g>

        {/* Rusted goal */}
        <g transform="translate(208,250)">
          <rect x="-58" y="14" width="116" height="12" fill="#120c08" />
          <path d="M-54 14 L-46 -86 L46 -86 L54 14" fill={`url(#${id('steel')})`} stroke="#120c08" strokeWidth="3.2" />
          <path d="M-32 -86 v100 M32 -86 v100" stroke="#2a221c" strokeWidth="5" />
          <path d="M-46 -86 C-20 -58 18 -70 46 -86" fill="none" stroke="#4a4036" strokeWidth="2.2" />
          <rect x="-48" y="-64" width="22" height="18" fill={`url(#${id('rust')})`} />
          <rect x="16" y="-48" width="28" height="14" fill="#5a2410" />
          <path d="M-42 -24 h84" stroke="#d08a28" strokeWidth="2.2" strokeDasharray="9 5" opacity="0.75" />
          <path d="M-38 8 C-8 -22 14 -8 38 8" fill="none" stroke="#7a7268" strokeWidth="2" />
          <circle cx="-34" cy="-10" r="3.4" fill="#14100c" />
          <circle cx="34" cy="-14" r="3.4" fill="#14100c" />
          <circle cx="-22" cy="-70" r="2.6" fill="#c4b49a" />
          <circle cx="22" cy="-70" r="2.6" fill="#c4b49a" />
          <path d="M-40 -40 l8 6 M-28 -52 l6 10 M12 -60 l10 8" stroke="#8a6a48" strokeWidth="1.2" opacity="0.6" />
        </g>

        {/* Pipe stick */}
        <g transform="translate(78,292) rotate(-22)">
          <path d="M2 8 L10 -132 L22 -128 L16 12 Z" fill={`url(#${id('steel')})`} />
          <path d="M4 -118 h26 v12 h-22 z" fill={`url(#${id('rust')})`} />
          <rect x="-8" y="-2" width="30" height="16" rx="2" fill="#221810" stroke="#a07a42" strokeWidth="1.6" />
          <circle cx="8" cy="6" r="2.4" fill="#8a8478" />
          <path d="M8 -80 l6 10 M14 -50 l-5 8" stroke="#1a1410" strokeWidth="1.3" opacity="0.5" />
        </g>

        {/* Chains */}
        <g fill="none" stroke="#5a5046" strokeWidth="2.4">
          <path d="M36 300 C70 278 96 328 72 358" />
          <path d="M44 318 C66 308 78 340 60 352" />
          <path d="M344 292 C372 318 356 366 324 370" />
        </g>
        <g fill="#3a342c">
          <ellipse cx="72" cy="358" rx="5" ry="3.5" />
          <ellipse cx="324" cy="370" rx="5" ry="3.5" />
        </g>

        {/* Scrap puck, foreground */}
        <g transform="translate(176,404)">
          <ellipse cx="0" cy="14" rx="44" ry="12" fill="#050403" opacity="0.5" />
          <ellipse cx="0" cy="0" rx="38" ry="16" fill={`url(#${id('puck')})`} stroke="#8a6a42" strokeWidth="4" />
          <ellipse cx="0" cy="-2" rx="24" ry="9" fill="none" stroke="#3a2a1c" strokeWidth="3" />
          <path d="M-26 2 C-4 -10 10 -6 26 4" fill="none" stroke="#c46a28" strokeWidth="1.8" />
          <circle cx="-22" cy="0" r="3.2" fill="#9a9488" />
          <circle cx="22" cy="2" r="3.2" fill="#9a9488" />
          <circle cx="0" cy="-8" r="2.6" fill="#6a6258" />
          <text x="0" y="5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#d8b070" opacity="0.75">
            WL-07
          </text>
        </g>

        {/* Dust / heat haze */}
        <g opacity="0.42" fill="#e8c090" filter={`url(#${id('blur')})`}>
          <ellipse cx="86" cy="246" rx="78" ry="16" />
          <ellipse cx="310" cy="238" rx="90" ry="18" />
          <ellipse cx="196" cy="256" rx="60" ry="10" />
        </g>

        {/* Weld sparks */}
        <g fill="#f0c060" filter={`url(#${id('soft')})`}>
          <circle cx="186" cy="214" r="1.6" />
          <circle cx="198" cy="206" r="1.1" />
          <circle cx="174" cy="220" r="0.9" />
          <circle cx="230" cy="218" r="1.3" />
          <circle cx="222" cy="198" r="0.8" />
        </g>

        {/* Hazard footer */}
        <rect x="0" y="454" width="400" height="46" fill="#100c08" />
        {Array.from({ length: 11 }).map((_, i) => (
          <polygon
            key={i}
            points={`${i * 40},454 ${i * 40 + 20},454 ${i * 40 + 40},500 ${i * 40 + 20},500`}
            fill={i % 2 === 0 ? '#c47a14' : '#16100c'}
          />
        ))}

        {/* Stencil type */}
        <g fill="#f0d8b0">
          <text x="20" y="40" fontFamily="Impact, Haettenschweiler, 'Arial Narrow', sans-serif" fontSize="36" letterSpacing="5">
            WASTELAND
          </text>
          <text x="22" y="60" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2.4" fill="#c49a5a">
            RINK TANK · SHIFT 07 · RT-WL
          </text>
        </g>
        <text x="20" y="446" fontFamily="ui-monospace, monospace" fontSize="10" fill="#c4a06a" opacity="0.72">
          UNIT 07 · SCRAP SERIES · NOT STREET LEGAL
        </text>
        <text x="292" y="446" fontFamily="ui-monospace, monospace" fontSize="10" fill="#e8c070" opacity="0.55">
          SN-4418
        </text>

        {/* Grain + frame */}
        <rect width="400" height="500" filter={`url(#${id('grain')})`} opacity="0.28" style={{ mixBlendMode: 'overlay' }} />
        <rect x="0" y="0" width="400" height="500" fill="none" stroke="#1a120c" strokeWidth="12" />
        <rect x="8" y="8" width="384" height="484" fill="none" stroke="#8a5a28" strokeWidth="1.2" opacity="0.4" />
      </g>
    </svg>
  )
}
