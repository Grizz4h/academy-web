import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { resolveTeamLogo } from '../../data/teamLogos'
import { resolveNationalTeamFlag } from '../../data/nationalTeamFlags'
import { resolveTeamShortCode } from '../../data/teamShortCodes'
import { getChlTeamFacts, getChlTeamFactsByName } from '../../data/chlTeamFacts'
import { getDelTeamFacts, getDelTeamFactsByName } from '../../data/delTeamFacts'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import styles from './TeamCrest.module.css'

/** Display shape for club-facts popover (CHL + DEL). */
export type CrestTeamFacts = {
  fullName: string
  city?: string
  founded?: number
  arena?: string
  arenaCapacity?: number
  note?: string
  country?: string
  countryFlag?: string
  league?: string
}

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

/** True for mouse / trackpad — CSS hover media. Not used for club-facts gating. */
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

export function leagueHasTeamFacts(league: string | null | undefined): league is 'CHL' | 'DEL' {
  return league === 'CHL' || league === 'DEL'
}

/** Hard-separated catalogs: DEL never falls through to CHL (and vice versa). */
export function resolveTeamFacts(
  teamId: string | undefined,
  name: string,
  league?: string | null,
): CrestTeamFacts | null {
  if (league === 'DEL') {
    return (teamId ? getDelTeamFacts(teamId) : null) || getDelTeamFactsByName(name)
  }
  if (league === 'CHL') {
    return (teamId ? getChlTeamFacts(teamId) : null) || getChlTeamFactsByName(name)
  }
  return null
}

type TeamCrestProps = {
  name: string
  teamId?: string
  size?: 'sm' | 'md' | 'lg'
  /** League catalog for facts (`CHL` / `DEL`). Required when showFacts is on. */
  league?: string | null
  /** Enable club-facts popover (CHL / DEL). */
  showFacts?: boolean
  /**
   * Controlled open from parent tile:
   * 1st click = select · 2nd click on selected tile = open · again = close.
   */
  factsOpen?: boolean
  onFactsOpenChange?: (open: boolean) => void
  /**
   * Element that owns the 1st/2nd click (the whole team tile).
   * Used as popover anchor + outside-click safe area so tile clicks don't race-dismiss.
   */
  factsAnchorRef?: RefObject<HTMLElement | null>
}

function FactsPopover({
  teamId,
  name,
  league,
}: {
  teamId?: string
  name: string
  league?: string | null
}) {
  const facts = resolveTeamFacts(teamId, name, league)
  if (!facts) return null
  const subtitle = [facts.country, facts.city].filter(Boolean).join(' · ')
  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.55rem' }}>
        {facts.countryFlag ? (
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{facts.countryFlag}</span>
        ) : null}
        <div>
          <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'rgba(247,247,255,0.95)', lineHeight: 1.2 }}>
            {facts.fullName}
          </div>
          {subtitle ? (
            <div style={{ fontSize: '0.75rem', color: 'rgba(143,211,223,0.9)', marginTop: '0.1rem' }}>
              {subtitle}
            </div>
          ) : null}
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
  league = null,
  showFacts = false,
  factsOpen,
  onFactsOpenChange,
  factsAnchorRef,
}: TeamCrestProps) {
  const logo = resolveTeamLogo(teamId) || resolveTeamLogo(name)
  const flag = resolveNationalTeamFlag(teamId) || resolveNationalTeamFlag(name)
  const [logoFailed, setLogoFailed] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const fallbackAnchorRef = useRef<HTMLSpanElement | null>(null)
  const letters = crestLetters(name)
  const showLogo = Boolean(logo) && !logoFailed
  const hasFacts = Boolean(resolveTeamFacts(teamId, name, league))
  const factsEnabled = showFacts && hasFacts

  const controlled = typeof factsOpen === 'boolean'
  const open = factsEnabled && (controlled ? Boolean(factsOpen) : internalOpen)
  const anchorRef = (factsAnchorRef || fallbackAnchorRef) as RefObject<HTMLElement | null>

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next)
    onFactsOpenChange?.(next)
  }

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

  // Parent tile owns 1st/2nd click. Crest only hosts the popover.
  // Uncontrolled (e.g. SessionGameInfo): crest click toggles.
  return (
    <span
      ref={factsAnchorRef ? undefined : fallbackAnchorRef}
      className={styles.factsHost}
      aria-label={`${name}: Club-Infos`}
      onClick={controlled ? undefined : (event) => {
        event.stopPropagation()
        setOpen(!open)
      }}
    >
      {inner}
      {open ? (
        <AnchoredPopover
          open={open}
          anchorRef={anchorRef}
          ariaLabel={`${name} Club-Infos`}
          preferredWidth={260}
          dismissOnContentClick
          onDismiss={() => setOpen(false)}
        >
          <FactsPopover teamId={teamId} name={name} league={league} />
        </AnchoredPopover>
      ) : null}
    </span>
  )
}
