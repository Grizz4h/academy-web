/** Inline SVG art — 24×24, stroke-first ice/rink aesthetic. Uses currentColor. */

import type { ReactNode } from 'react'
import type { RinQIconName } from './types'

const S = {
  stroke: 1.75,
  cap: 'round' as const,
  join: 'round' as const,
}

type ArtProps = { className?: string }

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {children}
    </svg>
  )
}

const ICONS: Record<RinQIconName, (p: ArtProps) => ReactNode> = {
  observe: ({ className }) => (
    <Svg className={className}>
      <path
        d="M3 12c2.8-4.2 6.2-6 9-6s6.2 1.8 9 6c-2.8 4.2-6.2 6-9 6s-6.2-1.8-9-6Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
      />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
      <path d="M6 8.5 12 4.5 18 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap={S.cap} opacity="0.45" />
    </Svg>
  ),
  learn: ({ className }) => (
    <Svg className={className}>
      <path
        d="M12 4.5 5 8v5.5c0 3.2 3 5.5 7 6.5 4-.9 7-3.3 7-6.5V8l-7-3.5Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
      />
      <path d="M12 4.5v15" stroke="currentColor" strokeWidth="1.4" strokeLinecap={S.cap} opacity="0.5" />
      <path d="M8.5 10.5h7M9 13h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} opacity="0.65" />
    </Svg>
  ),
  terms: ({ className }) => (
    <Svg className={className}>
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap={S.cap}
        opacity="0.55"
      />
      <path
        d="M12 8.5c-1.8 0-3 1-3 2.4S10.2 13 12 13s3 1.1 3 2.1-1.2 2.4-3 2.4"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinecap={S.cap}
      />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" />
    </Svg>
  ),
  mission: ({ className }) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth={S.stroke} />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} opacity="0.45" />
    </Svg>
  ),
  trophy: ({ className }) => (
    <Svg className={className}>
      <path
        d="M8 5h8v5.5c0 2.5-1.8 4.5-4 4.5s-4-2-4-4.5V5Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinejoin={S.join}
      />
      <path d="M8 6H5.5a1.5 1.5 0 0 0 0 3H8M16 6h2.5a1.5 1.5 0 0 1 0 3H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap={S.cap} />
      <path d="M10 17h4v2.5H9.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1H14V17" stroke="currentColor" strokeWidth="1.3" strokeLinejoin={S.join} />
    </Svg>
  ),
  scene: ({ className }) => (
    <Svg className={className}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M4 10h16M9 6v12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.5 13.5 15 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap={S.cap} strokeLinejoin={S.join} />
    </Svg>
  ),
  celebrate: ({ className }) => (
    <Svg className={className}>
      <path d="M12 3.5 13.2 8.5 18 9.5 14.5 12.5 15.5 17.5 12 14.8 8.5 17.5 9.5 12.5 6 9.5 10.8 8.5 12 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin={S.join} />
      <path d="M5 6l1 1M19 6l-1 1M5 18l1.5-1M19 18l-1.5-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap={S.cap} opacity="0.55" />
    </Svg>
  ),
  continue: ({ className }) => (
    <Svg className={className}>
      <path
        d="M18 12a6 6 0 1 0-1.8 4.3M18 8v4h-4"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
      />
    </Svg>
  ),
  delete: ({ className }) => (
    <Svg className={className}>
      <path d="M6 7.5h12M9.5 7.5V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap={S.cap} />
      <path d="M8 7.5l.6 11a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-11" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} opacity="0.65" />
    </Svg>
  ),
  shop: ({ className }) => (
    <Svg className={className}>
      <path d="M5.5 8.5 6.5 5h11l1 3.5" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <path d="M6 8.5h12l-1 10H7L6 8.5Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <circle cx="10" cy="19" r="1" fill="currentColor" />
      <circle cx="15" cy="19" r="1" fill="currentColor" />
    </Svg>
  ),
  bolt: ({ className }) => (
    <Svg className={className}>
      <path
        d="M13.5 3 8.5 12.5H12l-1.5 8.5L17 11h-3.5L13.5 3Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinejoin={S.join}
      />
    </Svg>
  ),
  compass: ({ className }) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap={S.cap} opacity="0.45" />
      <path d="m14.5 9.5-5 2 2 5 5-2-2-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin={S.join} />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Svg>
  ),
  puzzle: ({ className }) => (
    <Svg className={className}>
      <path
        d="M8 5h3a1.5 1.5 0 0 0 3 0h3v3a1.5 1.5 0 0 1 0 3v3h-3a1.5 1.5 0 0 0-3 0H8v-3a1.5 1.5 0 0 1 0-3V5Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinejoin={S.join}
      />
    </Svg>
  ),
  tools: ({ className }) => (
    <Svg className={className}>
      <path d="M14.5 5.5a3.5 3.5 0 0 0-4.9 4.9L6 14l4 4 3.6-3.6a3.5 3.5 0 0 0 4.9-4.9l-2.2 2.2-2.5-2.5 2.2-2.2Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
    </Svg>
  ),
  arena: ({ className }) => (
    <Svg className={className}>
      <path d="M4 16c2.5-4 5.5-6 8-6s5.5 2 8 6" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
      <path d="M6 16v2.5M18 16v2.5M8 18.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} />
      <path d="M12 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap={S.cap} opacity="0.55" />
    </Svg>
  ),
  home: ({ className }) => (
    <Svg className={className}>
      <path d="M5 11.5 12 5l7 6.5V19a1 1 0 0 1-1 1h-4.5v-5H10.5v5H6a1 1 0 0 1-1-1v-7.5Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
    </Svg>
  ),
  ticket: ({ className }) => (
    <Svg className={className}>
      <path
        d="M6 8.5h12v7H6v-2a1.5 1.5 0 0 0 0-3v-2a1.5 1.5 0 0 0 0-3V8.5Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinejoin={S.join}
      />
      <path d="M12 8.5v7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 2" opacity="0.55" />
    </Svg>
  ),
  ice: ({ className }) => (
    <Svg className={className}>
      <path d="M8 6.5 12 4l4 2.5v7L12 16l-4-2.5v-7Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <path d="M12 4v12M8 6.5l4 2.5 4-2.5M8 13.5l4-2.5 4 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap={S.cap} opacity="0.5" />
    </Svg>
  ),
  ai: ({ className }) => (
    <Svg className={className}>
      <rect x="6" y="8" width="12" height="10" rx="2" stroke="currentColor" strokeWidth={S.stroke} />
      <circle cx="10" cy="13" r="1.2" fill="currentColor" />
      <circle cx="14" cy="13" r="1.2" fill="currentColor" />
      <path d="M10 16h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} />
      <path d="M12 8V6M9 6h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} />
    </Svg>
  ),
  lock: ({ className }) => (
    <Svg className={className}>
      <rect x="7" y="11" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M9 11V8.5a3 3 0 0 1 6 0V11" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </Svg>
  ),
  palette: ({ className }) => (
    <Svg className={className}>
      <path d="M12 4a8 8 0 1 0 0 16h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h.5a2 2 0 0 0 0-4H12Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="11" cy="7.5" r="1" fill="currentColor" opacity="0.65" />
      <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.55" />
    </Svg>
  ),
  coin: ({ className }) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M12 7.5v9M9 10.5h4a2 2 0 0 1 0 4h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap={S.cap} />
    </Svg>
  ),
  star: ({ className }) => (
    <Svg className={className}>
      <path
        d="M12 4.5 13.8 9.2 19 9.8 15.2 13.2 16.3 18.2 12 15.6 7.7 18.2 8.8 13.2 5 9.8 10.2 9.2 12 4.5Z"
        stroke="currentColor"
        strokeWidth={S.stroke}
        strokeLinejoin={S.join}
      />
    </Svg>
  ),
  starOutline: ({ className }) => (
    <Svg className={className}>
      <path
        d="M12 5.2 13.5 9.4 18 10l-3.5 2.8 1.1 4.3L12 15.2 8.4 17.1 9.5 12.8 6 10l4.5-.6L12 5.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin={S.join}
        fill="none"
      />
    </Svg>
  ),
  check: ({ className }) => (
    <Svg className={className}>
      <path d="M6.5 12.5 10 16l7.5-8" stroke="currentColor" strokeWidth={S.stroke + 0.25} strokeLinecap={S.cap} strokeLinejoin={S.join} />
    </Svg>
  ),
  edit: ({ className }) => (
    <Svg className={className}>
      <path d="M15.5 5.5 18.5 8.5 8.5 18.5H5.5V15.5l10-10Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <path d="M13.5 7.5 16.5 10.5" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
    </Svg>
  ),
  close: ({ className }) => (
    <Svg className={className}>
      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
    </Svg>
  ),
  eye: ({ className }) => (
    <Svg className={className}>
      <path d="M3 12c2.8-4.2 6.2-6 9-6s6.2 1.8 9 6c-2.8 4.2-6.2 6-9 6s-6.2-1.8-9-6Z" stroke="currentColor" strokeWidth={S.stroke} />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.4" />
    </Svg>
  ),
  eyeOff: ({ className }) => (
    <Svg className={className}>
      <path d="M3 12c2.8-4.2 6.2-6 9-6 1.6 0 3.1.5 4.4 1.4M21 12c-1.2 1.8-2.8 3.2-4.8 4" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
      <path d="M10.5 10.5a2.5 2.5 0 0 0 3.5 3.5M6 6l12 12" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
    </Svg>
  ),
  film: ({ className }) => (
    <Svg className={className}>
      <rect x="5" y="6" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M5 9h3v2H5M5 13h3v2H5M16 9h3v2h-3M16 13h3v2h-3" stroke="currentColor" strokeWidth="1.2" />
    </Svg>
  ),
  book: ({ className }) => (
    <Svg className={className}>
      <path d="M6 5.5h5.5a2 2 0 0 1 2 2V19H8a2 2 0 0 0-2 2V5.5Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
      <path d="M11.5 7.5H18A2 2 0 0 1 20 9.5V19h-6.5" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
    </Svg>
  ),
  bus: ({ className }) => (
    <Svg className={className}>
      <rect x="5" y="7" width="14" height="9" rx="2" stroke="currentColor" strokeWidth={S.stroke} />
      <path d="M5 11h14M8 16.5a1 1 0 1 0 0 .1M16 16.5a1 1 0 1 0 0 .1" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} />
      <path d="M8 7V5.5h8V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap={S.cap} />
    </Svg>
  ),
  gear: ({ className }) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M6.4 17.6l1.4-1.4M16.2 7.8l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap={S.cap}
      />
    </Svg>
  ),
  folder: ({ className }) => (
    <Svg className={className}>
      <path d="M4 7.5a1 1 0 0 1 1-1h4l1.5 2H19a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5Z" stroke="currentColor" strokeWidth={S.stroke} strokeLinejoin={S.join} />
    </Svg>
  ),
  magnet: ({ className }) => (
    <Svg className={className}>
      <path d="M8 8v5a4 4 0 0 0 8 0V8" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
      <path d="M8 8H6v3h2M16 8h2v3h-2" stroke="currentColor" strokeWidth={S.stroke} strokeLinecap={S.cap} />
    </Svg>
  ),
}

export function renderIconArt(name: RinQIconName, className?: string) {
  const Art = ICONS[name]
  return Art ? <Art className={className} /> : null
}

export const RINQ_ICON_LABELS: Record<RinQIconName, string> = {
  observe: 'Beobachten',
  learn: 'Lernen',
  terms: 'Begriffe',
  mission: 'Mission',
  trophy: 'Erfolg',
  scene: 'Szene',
  celebrate: 'Fertig',
  continue: 'Fortsetzen',
  delete: 'Löschen',
  shop: 'Shop',
  bolt: 'Energie',
  compass: 'Analyse',
  puzzle: 'Reflexion',
  tools: 'Werkzeug',
  arena: 'Arena',
  home: 'Heim',
  ticket: 'Ticket',
  ice: 'Eis',
  ai: 'KI',
  lock: 'Gesperrt',
  palette: 'Kosmetik',
  coin: 'Münze',
  star: 'Stern',
  starOutline: 'Stern leer',
  check: 'Erledigt',
  edit: 'Bearbeiten',
  close: 'Schließen',
  eye: 'Anzeigen',
  eyeOff: 'Verbergen',
  film: 'Film',
  book: 'Lesen',
  bus: 'Auswärts',
  gear: 'Einstellungen',
  folder: 'Sammlung',
  magnet: 'Anziehen',
}
