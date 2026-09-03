import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { resolveTeamLogo } from '../../data/teamLogos'
import { resolveNationalTeamFlag } from '../../data/nationalTeamFlags'
import { resolveTeamShortCode } from '../../data/teamShortCodes'
import { getChlTeamFacts, getChlTeamFactsByName } from '../../data/chlTeamFacts'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import styles from './TeamCrest.module.css'

const CREST_HUES = [168, 186, 204, 18, 34, 262, 332, 142]

function crestHue(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) % 997
  }
  return CREST_HUES[hash % CREST_HUES.length]
}

function crestLetters(name: string): string {
  return resolveTeamShortCode(name) || name.replace(/[^A-Za-zÄÖÜäöüß]/g, '').slice(0, 3).toUpperCase() || '?'
}

/** True for mouse / trackpad — CSS hover media. Not used to gate fact clicks. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ))
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return fine
}

export function resolveTeamFacts(teamId: string | undefined, name: string) {
  return (teamId ? getChlTeamFacts(teamId) : null) || getChlTeamFactsByName(name)
}

type TeamCrestProps = {
  name: string
  teamId?: string
  size?: 'sm' | 'md' | 'lg'
  /** Enable club-facts popover (typically CHL). */
  showFacts?: boolean
  /** Controlled open from parent (second tap/click on tile). */
  factsOpen?: boolean
  onFactsOpenChange?: (open: boolean) => void
}

function FactsPopover({ teamId, name }: { teamId?: string; name: string }) {
  const facts = resolveTeamFacts(teamId, name)
  if (!facts) return null
  return (
    <div style={{ minWidth: 220 }} data-popover-no-dismiss>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.55rem' }}>
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{facts.countryFlag}</span>
        <div>
          <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'rgba(247,247,255,0.95)', lineHeight: 1.2 }}>
            {facts.fullName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(143,211,223,0.9)', marginTop: '0.1rem' }}>
            {facts.country}{facts.city ? ` · ${facts.city}` : ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.75rem', fontSize: '0.78rem', lineHeight: 1.4 }}>
        {facts.founded ? (
          <>
            <span style={{ color: 'rgba(148,163,184,0.8)' }}>Gegründet</span>
            <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 600 }}>{facts.founded}</span>
          </>
        ) : null}
        {facts.league ? (
          <>
            <span style={{ color: 'rgba(148,163,184,0.8)' }}>Liga</span>
            <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 600 }}>{facts.league}</span>
          </>
        ) : null}
        {facts.arena ? (
          <>
            <span style={{ color: 'rgba(148,163,184,0.8)' }}>Arena</span>
            <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 600 }}>{facts.arena}</span>
          </>
        ) : null}
        {facts.arenaCapacity ? (
          <>
            <span style={{ color: 'rgba(148,163,184,0.8)' }}>Kapazität</span>
            <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 600 }}>{facts.arenaCapacity.toLocaleString('de-DE')}</span>
          </>
        ) : null}
      </div>
      {facts.note ? (
        <div style={{
          marginTop: '0.55rem',
          paddingTop: '0.45rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.76rem',
          color: 'rgba(167,243,208,0.9)',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {facts.note}
        </div>
      ) : null}
    </div>
  )
}

export function TeamCrest({
  name,
  teamId,
  size = 'md',
  showFacts = false,
  factsOpen,
  onFactsOpenChange,
}: TeamCrestProps) {
  const logo = resolveTeamLogo(teamId) || resolveTeamLogo(name)
  const flag = resolveNationalTeamFlag(teamId) || resolveNationalTeamFlag(name)
  const [logoFailed, setLogoFailed] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const leaveTimer = useRef<number | null>(null)
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const letters = crestLetters(name)
  const showLogo = Boolean(logo) && !logoFailed
  const hasFacts = Boolean(resolveTeamFacts(teamId, name))
  const factsEnabled = showFacts && hasFacts

  const controlled = typeof factsOpen === 'boolean'
  const pinnedOpen = controlled ? Boolean(factsOpen) : internalOpen
  const open = factsEnabled && (hoverOpen || pinnedOpen)

  const setPinnedOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next)
    onFactsOpenChange?.(next)
  }

  const clearLeaveTimer = () => {
    if (leaveTimer.current != null) {
      window.clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }

  const dismissAll = () => {
    clearLeaveTimer()
    setHoverOpen(false)
    setPinnedOpen(false)
  }

  useEffect(() => () => {
    clearLeaveTimer()
  }, [])

  const inner = flag ? (
    <span
      className={[styles.crest, styles.hasFlag, styles[size]].join(' ')}
      role="img"
      aria-label={name}
    >
      <span className={styles.flagEmoji} aria-hidden="true">{flag}</span>
    </span>
  ) : showLogo && logo ? (
    <span
      className={[styles.crest, styles.hasLogo, styles[size]].join(' ')}
      aria-hidden="true"
    >
      <span className={styles.crestGlow} />
      <img className={styles.logo} src={logo} alt="" onError={() => setLogoFailed(true)} />
    </span>
  ) : (
    <span
      className={[styles.crest, styles[size]].join(' ')}
      style={{ '--crest-hue': String(crestHue(letters || name)) } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.letters}>{letters}</span>
    </span>
  )

  if (!factsEnabled) return inner

  // Clicks pass through to the parent tile (1st = select, 2nd = pin facts).
  // Desktop also opens on hover over the crest.
  return (
    <span
      ref={triggerRef}
      className={styles.factsHost}
      aria-label={`${name}: Club-Infos`}
      onMouseEnter={() => {
        clearLeaveTimer()
        setHoverOpen(true)
      }}
      onMouseLeave={() => {
        leaveTimer.current = window.setTimeout(() => setHoverOpen(false), 220)
      }}
    >
      {inner}
      {open ? (
        <AnchoredPopover
          open={open}
          anchorRef={triggerRef as RefObject<HTMLElement | null>}
          ariaLabel={`${name} Club-Infos`}
          preferredWidth={260}
          dismissOnContentClick={false}
          onDismiss={dismissAll}
        >
          <div
            data-popover-no-dismiss
            onMouseEnter={clearLeaveTimer}
            onMouseLeave={() => {
              leaveTimer.current = window.setTimeout(() => setHoverOpen(false), 220)
            }}
          >
            <FactsPopover teamId={teamId} name={name} />
          </div>
        </AnchoredPopover>
      ) : null}
    </span>
  )
}
