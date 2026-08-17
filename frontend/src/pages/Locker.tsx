import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import {
  COLLECTIONS,
  COSMETIC_TYPE_TO_SLOT,
  filterLockerItems,
  getCosmetic,
  isEquipableCosmetic,
  LOCKER_TYPE_CHIPS,
  RARITY_LABELS,
  RARITY_RANK,
  selectCollectionProgress,
  selectLockerItems,
  selectLockerStats,
  selectTrackMasteryViews,
  SHOP_LISTINGS,
  type CosmeticType,
  type LockerItemView,
  type TaskLaneFilter,
  type TaskStatusFilter,
} from '../features/progression'
import { useRewards } from '../features/rewards'
import { isStarterCosmetic } from '../features/progression/cosmetics/cosmeticCatalog'
import { Puck3DLab } from '../components/puck3d'
import { CosmeticGlyph } from '../components/visuals/CosmeticGlyph'
import { useDevNavEnabled } from '../config/featureFlags'
import { UiActionRow, UiButton, UiChip, UiPill, UiProgress } from '../components/ui'
import { TUTORIAL_TARGET } from '../features/tutorial'
import { AccountPillFrame } from '../components/profile/AccountPillFrame'
import { CollectionArtwork, CosmeticArtwork, hasCosmeticArt } from '../assets/collections/collectionArtwork'
import { LockerTasksPanel } from '../features/progression/tasks/LockerTasksPanel'
import ArenaPassportList from '../components/game/ArenaPassportList'
import { toggleProfileSticker } from '../data/profile/stickerCatalog'
import type { UserProfileCustomization } from '../data/profile/types'
import styles from './Locker.module.css'

type LockerTab = 'home' | 'cosmetics' | 'collections' | 'shop' | 'mastery' | 'achievements'

const LOCKER_TABS: LockerTab[] = ['home', 'cosmetics', 'collections', 'shop', 'mastery', 'achievements']
const TASK_LANES = ['all', 'permanent', 'daily', 'weekly', 'matchday', 'event'] as const
const TASK_STATUSES = ['all', 'active', 'completed'] as const

function parseLockerTab(value: string | null): LockerTab {
  return LOCKER_TABS.includes(value as LockerTab) ? (value as LockerTab) : 'home'
}

function parseTaskLane(value: string | null): TaskLaneFilter {
  return TASK_LANES.includes(value as TaskLaneFilter) ? (value as TaskLaneFilter) : 'all'
}

function parseTaskStatus(value: string | null): TaskStatusFilter {
  return TASK_STATUSES.includes(value as TaskStatusFilter) ? (value as TaskStatusFilter) : 'all'
}

function isCosmeticEquipped(profile: UserProfileCustomization | null | undefined, item: LockerItemView): boolean {
  if (!profile) return false
  const id = item.definition.id
  const assetId = item.definition.assetId || id
  const type = item.definition.type
  if (type === 'avatar') return profile.avatar?.type === 'catalog' && profile.avatar.avatarId === assetId
  if (type === 'banner') return profile.bannerId === assetId
  if (type === 'emblem') return profile.emblem?.type === 'catalog' && profile.emblem.emblemId === assetId
  if (type === 'frame') return profile.frameId === id
  if (type === 'title') {
    const stored = profile.profileTitle
    if (!stored) return false
    if (stored === id) return true
    // Legacy profiles stored profileTitleId / display text — that maps to the starter, not the rarer twin.
    if (stored === item.definition.metadata?.profileTitleId) return id === `title_catalog_${stored}`
    return false
  }
  if (type === 'tagline') {
    const stored = profile.profileTagline
    return stored === id || stored === item.definition.text || stored === item.definition.name
  }
  if (type === 'sticker') return (profile.stickerIds || []).includes(id)
  return false
}

function equipLabel(item: LockerItemView, equipped: boolean): string {
  if (item.definition.type === 'sticker') return equipped ? 'Abziehen' : 'Aufkleben'
  return equipped ? 'Ausgerüstet' : 'Ausrüsten'
}

function TypeMark({ type, size = 'meta' }: { type: string; size?: 'meta' | 'sm' }) {
  return (
    <span className={styles.typeMark}>
      <CosmeticGlyph type={type} size={size} />
    </span>
  )
}

function LockMark() {
  return (
    <span className={styles.lockMark} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="3.5" y="7" width="9" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.4 7 V5.2 A2.6 2.6 0 0 1 10.6 5.2 V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function LockerArt({
  type,
  artworkUrl,
  variant = 'tile',
  muted = false,
  className,
  frameId,
  rarity,
  cosmeticId,
  previewText,
}: {
  type: CosmeticType
  artworkUrl?: string
  variant?: 'tile' | 'sheet'
  muted?: boolean
  className?: string
  frameId?: string
  rarity?: string
  cosmeticId?: string
  previewText?: string
}) {
  const hasPhoto = Boolean(artworkUrl) && ['banner', 'avatar', 'emblem', 'sticker', 'masteryCoin'].includes(type)
  const artClass = variant === 'sheet' ? styles.sheetArt : styles.tileArt
  const shapeClass = type === 'banner' || type === 'frame'
    ? (variant === 'sheet' ? styles.sheetArtWide : styles.tileArtWide)
    : (variant === 'sheet' ? styles.sheetArtSquare : styles.tileArtSquare)

  return (
    <div className={`${artClass} ${shapeClass} ${muted ? styles.tileArtMuted : ''} ${className || ''}`}>
      {cosmeticId && hasCosmeticArt(cosmeticId) ? (
        <CosmeticArtwork cosmeticId={cosmeticId} variant={variant} title={undefined} />
      ) : type === 'frame' ? (
        <AccountPillFrame frameId={frameId} preview previewSize={variant} />
      ) : type === 'title' || type === 'tagline' ? (
        <span
          className={`rarity-type ${type === 'tagline' ? 'rarity-type--tagline' : ''} ${styles.typePreview}`}
          data-rarity={rarity || 'common'}
        >
          {previewText || (type === 'title' ? 'Titel' : 'Tagline')}
        </span>
      ) : type === 'avatar' && artworkUrl ? (
        <span className={`${styles.avatarShape} ${variant === 'sheet' ? styles.avatarShapeSheet : ''}`} data-avatar-rarity={rarity || 'common'}>
          <img src={artworkUrl} alt="" />
        </span>
      ) : hasPhoto ? (
        <img className={type === 'sticker' ? styles.stickerPreview : undefined} src={artworkUrl} alt="" />
      ) : (
        <CosmeticGlyph type={type} size={variant === 'sheet' ? 'lg' : 'tile'} />
      )}
    </div>
  )
}

function LockerItemCard({
  item,
  previewUnlocked,
  onOpen,
}: {
  item: LockerItemView
  previewUnlocked: boolean
  onOpen: (item: LockerItemView) => void
}) {
  const locked = !item.owned && !previewUnlocked
  return (
    <button
      type="button"
      className={`${styles.tile} ${styles[`rarity_${item.definition.rarity}`]} ${locked ? styles.tileLocked : ''}`}
      onClick={() => onOpen(item)}
    >
      {locked && <LockMark />}
      {previewUnlocked && !item.owned && (
        <UiPill tone="warn" className={styles.devPreview}>DEV</UiPill>
      )}
      <span className={styles.corners} aria-hidden="true" />
      <div className={styles.tileChrome}>
        <div className={styles.rarityRibbon}>{RARITY_LABELS[item.definition.rarity]}</div>
        {item.isNew && <UiPill tone="new" className={styles.badgeNew}>NEU</UiPill>}
        <TypeMark type={item.definition.type} />
      </div>
      <LockerArt
        type={item.definition.type}
        artworkUrl={item.artworkUrl}
        muted={locked}
        frameId={item.definition.id}
        rarity={item.definition.rarity}
        cosmeticId={item.definition.id}
        previewText={item.definition.text || item.displayName}
      />
      <div className={styles.tileName}>{item.displayName}</div>
      {locked && item.unlockHint && <p className={styles.unlockHow}>{item.unlockHint}</p>}
    </button>
  )
}

function buildTrackDrills(curriculum: Awaited<ReturnType<typeof api.getCurriculum>> | null | undefined) {
  const trackDrills: Record<string, string[]> = {}
  for (const track of curriculum?.tracks || []) {
    const ids: string[] = []
    for (const module of track.modules || []) {
      if (module.active === false) continue
      for (const drill of module.drills || []) {
        if (drill.id) ids.push(drill.id)
      }
      if (module.id) ids.push(module.id)
    }
    trackDrills[track.id] = Array.from(new Set(ids))
  }
  return trackDrills
}

export default function LockerPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const {
    rewardState,
    purchaseShopListing,
    markCosmeticsSeen,
    toggleFavoriteCosmetic,
    rebuildProgression,
  } = useRewards()
  const devMode = useDevNavEnabled()
  const [params, setParams] = useSearchParams()
  const tab = parseLockerTab(params.get('tab'))
  const taskLane = parseTaskLane(params.get('lane'))
  const taskStatus = parseTaskStatus(params.get('status'))
  const selectedTaskId = params.get('task')

  const setTab = (next: LockerTab) => {
    const nextParams = new URLSearchParams(params)
    if (next === 'home') nextParams.delete('tab')
    else nextParams.set('tab', next)
    if (next !== 'achievements') {
      nextParams.delete('lane')
      nextParams.delete('status')
      nextParams.delete('task')
    }
    setParams(nextParams, { replace: true })
  }

  const patchTaskParams = (patch: { lane?: TaskLaneFilter; status?: TaskStatusFilter; task?: string | null }) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', 'achievements')
    if (patch.lane) {
      if (patch.lane === 'all') nextParams.delete('lane')
      else nextParams.set('lane', patch.lane)
    }
    if (patch.status) {
      if (patch.status === 'all') nextParams.delete('status')
      else nextParams.set('status', patch.status)
    }
    if (patch.task !== undefined) {
      if (patch.task) nextParams.set('task', patch.task)
      else nextParams.delete('task')
    }
    setParams(nextParams, { replace: true })
  }

  const [typeFilter, setTypeFilter] = useState<CosmeticType | 'all'>('all')
  const [ownership, setOwnership] = useState<'all' | 'unlocked' | 'locked' | 'new' | 'favorites'>('all')
  const [selected, setSelected] = useState<LockerItemView | null>(null)
  const [shopBusy, setShopBusy] = useState<string | null>(null)
  const [shopError, setShopError] = useState('')
  const [equipMsg, setEquipMsg] = useState('')

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user, 'locker'],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user),
  })
  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
  })
  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  })

  const trackDrills = useMemo(() => buildTrackDrills(curriculum), [curriculum])
  const stats = useMemo(
    () => selectLockerStats({ ...rewardState, favoriteCosmeticIds: rewardState.favoriteCosmeticIds }),
    [rewardState],
  )
  const items = useMemo(
    () => selectLockerItems(
      { ...rewardState, favoriteCosmeticIds: rewardState.favoriteCosmeticIds },
      { revealAll: devMode },
    ),
    [rewardState, devMode],
  )
  const filtered = useMemo(
    () => filterLockerItems(items, { type: typeFilter, ownership }),
    [items, typeFilter, ownership],
  )
  const shopListings = useMemo(
    () =>
      [...SHOP_LISTINGS].sort((left, right) => {
        const leftDef = getCosmetic(left.cosmeticId)
        const rightDef = getCosmetic(right.cosmeticId)
        const rarity =
          (leftDef ? RARITY_RANK[leftDef.rarity] : 99) - (rightDef ? RARITY_RANK[rightDef.rarity] : 99)
        if (rarity !== 0) return rarity
        const category = (left.category || '').localeCompare(right.category || '', 'de')
        if (category !== 0) return category
        return (leftDef?.name || left.cosmeticId).localeCompare(rightDef?.name || right.cosmeticId, 'de')
      }),
    [],
  )
  const collections = useMemo(
    () =>
      selectCollectionProgress(rewardState.unlockedCosmetics || {}, (id) =>
        isStarterCosmetic(id),
      ),
    [rewardState.unlockedCosmetics],
  )
  const masteryViews = useMemo(
    () => selectTrackMasteryViews(sessions, trackDrills, rewardState.processedEvents || {}),
    [sessions, trackDrills, rewardState.processedEvents],
  )
  const newItems = items.filter((item) => item.isNew).slice(0, 8)

  // IMPORTANT: no automatic meta-eval on Locker mount.
  // Catch-up runs after real session completion only (Session.tsx),
  // otherwise stale builds / effect races can re-grant Pux in a loop.

  const openDetail = (item: LockerItemView) => {
    setSelected(item)
    if (item.isNew) {
      void markCosmeticsSeen([item.definition.id])
    }
  }

  const handleEquip = async (item: LockerItemView) => {
    const canEquip = item.owned || (devMode && ['frame', 'avatar', 'banner', 'emblem', 'title', 'tagline', 'sticker'].includes(item.definition.type))
    if (!me?.profile || !canEquip || !isEquipableCosmetic(item.definition)) return
    const slot = COSMETIC_TYPE_TO_SLOT[item.definition.type]
    if (!slot) return
    const profile = { ...me.profile }
    const cosmeticId = item.definition.id
    const assetId = item.definition.assetId || cosmeticId
    if (slot === 'avatar') {
      profile.avatar = { type: 'catalog', avatarId: assetId }
    } else if (slot === 'banner') {
      profile.bannerId = assetId
    } else if (slot === 'emblem') {
      profile.emblem = { type: 'catalog', emblemId: assetId }
    } else if (slot === 'frame') {
      profile.frameId = cosmeticId
    } else if (slot === 'title') {
      profile.profileTitle = cosmeticId
    } else if (slot === 'tagline') {
      profile.profileTagline = cosmeticId
    } else if (slot === 'sticker') {
      profile.stickerIds = toggleProfileSticker(profile.stickerIds, cosmeticId)
    }
    try {
      const saved = await api.updateMyProfile(profile)
      await refetchMe()
      queryClient.setQueryData(['me', user], (prev: { profile?: Record<string, unknown> } | undefined) => {
        const current = prev?.profile || saved || profile
        return {
          ...(prev || { username: user, createdAt: null, role: null }),
          profile: {
            ...current,
            ...profile,
            frameId: profile.frameId ?? (current as { frameId?: string | null }).frameId ?? null,
          },
        }
      })
      setEquipMsg('✓ Ausgerüstet')
      window.setTimeout(() => setEquipMsg(''), 2000)
    } catch (err: any) {
      setEquipMsg(err?.message || 'Equip fehlgeschlagen')
    }
  }

  const handleBuy = async (listingId: string) => {
    const listing = SHOP_LISTINGS.find((item) => item.id === listingId)
    if (!listing) return
    const def = getCosmetic(listing.cosmeticId)
    const ok = window.confirm(`${def?.name || listing.cosmeticId} für ${listing.pricePux} Pux kaufen?`)
    if (!ok) return
    setShopBusy(listingId)
    setShopError('')
    const result = await purchaseShopListing(listingId)
    setShopBusy(null)
    if (!result.ok) {
      setShopError(
        result.reason === 'insufficient_pux'
          ? 'Nicht genug Pux.'
          : result.reason === 'already_owned' || result.reason === 'already_purchased'
            ? 'Bereits freigeschaltet.'
            : 'Kauf fehlgeschlagen.',
      )
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Locker</h1>
          <p className="ui-page-lead">Bitte melde dich an, um deinen Locker zu öffnen.</p>
        </header>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className="ui-page-header ui-page-header--row" data-tutorial-id={TUTORIAL_TARGET.lockerHome}>
        <div>
          <h1 className="ui-page-title">Locker</h1>
          <p className="ui-page-lead">Sammeln · Browsen · Freischalten · Ausrüsten</p>
        </div>
        <Link className={styles.accountLink} to="/account">
          Profil bearbeiten →
        </Link>
      </header>

      <section className={styles.statusStrip}>
        <div><strong>Level {stats.level}</strong></div>
        <div>{stats.xpIntoLevel.toLocaleString('de-DE')} / {stats.xpForNextLevel.toLocaleString('de-DE')} XP</div>
        <div>{stats.pux.toLocaleString('de-DE')} Pux</div>
        <div>{stats.cosmeticsOwned} / {stats.cosmeticsTotal} Cosmetics</div>
        <div>{stats.newUnlocks} neu</div>
      </section>

      <nav className="ui-tablist" aria-label="Locker Bereiche">
        {([
          ['home', 'Start'],
          ['cosmetics', 'Cosmetics'],
          ['collections', 'Collections'],
          ['shop', 'Pux Shop'],
          ['mastery', 'Mastery'],
          ['achievements', 'Achievements'],
        ] as Array<[LockerTab, string]>).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`ui-tab ${tab === id ? 'is-active' : ''}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'home' && (
        <div className={styles.stack}>
          <Puck3DLab />

          <section>
            <h2 className="ui-section-title">Neue Unlocks</h2>
            {newItems.length === 0 ? (
              <p className={styles.muted}>Keine neuen Items.</p>
            ) : (
              <div className={styles.grid}>
                {newItems.map((item) => (
                  <LockerItemCard
                    key={item.definition.id}
                    item={item}
                    previewUnlocked={devMode}
                    onOpen={openDetail}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="ui-section-title">Collections</h2>
            <div className={styles.collectionRow}>
              {collections.map((entry) => (
                <button key={entry.collection.id} type="button" className={styles.collectionCard} onClick={() => setTab('collections')}>
                  <div className={styles.collectionCover}>
                    <CollectionArtwork collectionId={entry.collection.id} variant="card" title={entry.collection.name} />
                  </div>
                  <strong>{entry.collection.name}</strong>
                  <UiProgress value={entry.owned} max={entry.total || 1} label={entry.collection.name} />
                  <span className={styles.muted}>{entry.owned} / {entry.total}{entry.completed ? ' · Complete' : ''}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.statMini}>
            <div>Collections {stats.collectionsDone} / {stats.collectionsTotal}</div>
            <div>Legendary {stats.legendary}</div>
            <div>Secrets {stats.secretsDiscovered}</div>
          </section>
        </div>
      )}

      {tab === 'cosmetics' && (
        <div className={styles.stack}>
          <div className={styles.chipRow}>
            {LOCKER_TYPE_CHIPS.filter((chip) => {
              if (chip.id === 'all') return true
              if (chip.id === 'stickModel' || chip.id === 'puckModel') {
                return items.some((item) => item.definition.type === chip.id || item.definition.type === (chip.id === 'stickModel' ? 'stickSkin' : 'puckSkin'))
              }
              return items.some((item) => item.definition.type === chip.id)
            }).map((chip) => (
              <UiChip key={chip.id} active={typeFilter === chip.id} onClick={() => setTypeFilter(chip.id)}>
                {chip.label}
              </UiChip>
            ))}
          </div>
          <div className={styles.chipRow}>
            {(['all', 'unlocked', 'locked', 'new', 'favorites'] as const).map((id) => (
              <UiChip key={id} active={ownership === id} onClick={() => setOwnership(id)}>
                {id === 'all' ? 'Alle' : id === 'unlocked' ? 'Unlocked' : id === 'locked' ? 'Locked' : id === 'new' ? 'Neu' : 'Favoriten'}
              </UiChip>
            ))}
          </div>
          <div className={styles.grid}>
            {filtered.map((item) => (
              <LockerItemCard
                key={item.definition.id}
                item={item}
                previewUnlocked={devMode}
                onOpen={openDetail}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'collections' && (
        <div className={styles.stack}>
          {collections.map((entry) => (
            <article key={entry.collection.id} className={styles.collectionDetail}>
              <header>
                <div className={styles.collectionHero}>
                  <CollectionArtwork collectionId={entry.collection.id} variant="detail" labeled title={entry.collection.name} />
                </div>
                <h2 className="ui-section-title-content">{entry.collection.name}</h2>
                <p className={styles.muted}>{entry.collection.description}</p>
                <UiProgress value={entry.owned} max={entry.total || 1} label={entry.collection.name} />
                <div className={styles.muted}>{entry.owned} / {entry.total}{entry.completed ? ' · Collection Complete' : ''}</div>
              </header>
              {entry.collection.id === 'arena_passport' ? (
                <ArenaPassportList visits={rewardState.venueVisits} />
              ) : null}
              <div className={styles.grid}>
                {entry.collection.itemIds.map((id) => {
                  const item = items.find((entryItem) => entryItem.definition.id === id)
                  if (!item) {
                    const def = getCosmetic(id)
                    return (
                      <div key={id} className={`${styles.tile} ${styles.tileLocked}`}>
                        <LockMark />
                        <LockerArt type={def?.type || 'title'} muted cosmeticId={id} />
                        <div className={styles.tileName}>{def?.name || id}</div>
                        <div className={styles.tileMeta}>Gesperrt</div>
                      </div>
                    )
                  }
                  return (
                    <LockerItemCard
                      key={id}
                      item={item}
                      previewUnlocked={devMode}
                      onOpen={openDetail}
                    />
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'shop' && (
        <div className={styles.stack}>
          <p className={styles.muted}>Evergreen Pux Shop · keine Timer, keine Echtgeldkäufe. Balance: {stats.pux} Pux</p>
          {shopError && <p className={styles.error}>{shopError}</p>}
          <div className={styles.grid}>
            {shopListings.map((listing) => {
              const def = getCosmetic(listing.cosmeticId)
              const owned = Boolean(rewardState.unlockedCosmetics?.[listing.cosmeticId] || isStarterCosmetic(listing.cosmeticId))
              return (
                <article key={listing.id} className={`${styles.shopCard} ${def ? styles[`rarity_${def.rarity}`] : ''}`}>
                  <div className={styles.tileChrome}>
                    {def && <div className={styles.rarityRibbon}>{RARITY_LABELS[def.rarity]}</div>}
                    {def ? <TypeMark type={def.type} /> : <div className={styles.tileMeta}>{listing.category}</div>}
                  </div>
                  <LockerArt type={def?.type || 'title'} />
                  <div className={styles.tileName}>{def?.name || listing.cosmeticId}</div>
                  <div className={styles.price}>{listing.pricePux} Pux</div>
                  <UiButton
                    type="button"
                    size="sm"
                    disabled={owned || shopBusy === listing.id}
                    onClick={() => handleBuy(listing.id)}
                  >
                    {owned ? 'Besitzt' : shopBusy === listing.id ? 'Kauft…' : `Kaufen · ${listing.pricePux}`}
                  </UiButton>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'mastery' && (
        <div className={styles.stack}>
          {masteryViews.map((view) => (
            <article key={view.masteryId} className={styles.masteryCard}>
              <h2 className="ui-section-title-content">{view.name}</h2>
              {view.description && <p className={styles.muted}>{view.description}</p>}
              <div className={styles.muted}>
                {view.complete
                  ? 'Track Mastery abgeschlossen'
                  : view.nextThreshold
                    ? `Nächstes Ziel · Mastery ${view.nextThreshold}× · ${Math.round(view.nextRatio * 100)}%`
                    : '—'}
              </div>
              <UiProgress value={Math.round(view.nextRatio * 100)} label={view.name} />
              <div className={styles.tileMeta}>Freigeschaltet: {view.unlockedThresholds.join(', ') || '—'}</div>
            </article>
          ))}
        </div>
      )}

      {tab === 'achievements' && (
        <LockerTasksPanel
          lane={taskLane}
          status={taskStatus}
          selectedId={selectedTaskId}
          onLaneChange={(next) => patchTaskParams({ lane: next })}
          onStatusChange={(next) => patchTaskParams({ status: next })}
          onSelect={(sourceId) => patchTaskParams({ task: sourceId })}
        />
      )}

      {selected && (
        <div
          className={`${styles.sheetScrim} ${styles[`rarity_${selected.definition.rarity}`]}`}
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div className={styles.inspectBurst} aria-hidden="true" />
          <div
            key={selected.definition.id}
            className={`${styles.sheet} ${styles[`rarity_${selected.definition.rarity}`]}`}
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
          >
            <span className={styles.corners} aria-hidden="true" />
            <span className={styles.sheetTrace} aria-hidden="true" />
            <span className={styles.sheetTraceEcho} aria-hidden="true" />
            <UiButton type="button" variant="ghost" size="sm" className={styles.sheetClose} onClick={() => setSelected(null)}>
              Schließen
            </UiButton>
            <div className={styles.tileChrome}>
              <div className={styles.rarityRibbon}>{RARITY_LABELS[selected.definition.rarity]}</div>
              <TypeMark type={selected.definition.type} size="sm" />
            </div>
            <LockerArt
              type={selected.definition.type}
              artworkUrl={selected.artworkUrl}
              variant="sheet"
              muted={!selected.owned && !devMode}
              frameId={selected.definition.id}
              rarity={selected.definition.rarity}
              cosmeticId={selected.definition.id}
              previewText={selected.definition.text || selected.displayName}
            />
            <h2 className={styles.sheetTitle}>{selected.displayName}</h2>
            {selected.definition.flavorText && !selected.mystery && (
              <p className={styles.flavor}>“{selected.definition.flavorText}”</p>
            )}
            {selected.displayDescription && <p className={styles.muted}>{selected.displayDescription}</p>}
            <p><strong>{selected.owned ? 'Herkunft' : 'Freischalten'}</strong><br />{selected.owned ? selected.originLabel : selected.unlockHint}</p>
            {selected.definition.collectionId && !selected.mystery && (
              <p><strong>Collection</strong><br />{COLLECTIONS.find((c) => c.id === selected.definition.collectionId)?.name || selected.definition.collectionId}</p>
            )}
            {devMode && !selected.owned && (
              <p className={styles.muted}>DEV-Ansicht · Item ist auf diesem Account noch nicht freigeschaltet.</p>
            )}
            {(() => {
              const canEquip =
                (selected.owned ||
                  (devMode && ['frame', 'avatar', 'banner', 'emblem', 'title', 'tagline', 'sticker'].includes(selected.definition.type))) &&
                isEquipableCosmetic(selected.definition)
              const favoriteButton = (
                <UiButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleFavoriteCosmetic(selected.definition.id)
                  }}
                >
                  {selected.isFavorite ? '★ Favorit' : '☆ Favorit'}
                </UiButton>
              )
              if (!canEquip) {
                return <div className={styles.sheetActions}>{favoriteButton}</div>
              }
              return (
                <UiActionRow className={styles.sheetActions}>
                  <UiButton
                    type="button"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleEquip(selected)
                    }}
                  >
                    {equipLabel(selected, isCosmeticEquipped(me?.profile, selected))}
                  </UiButton>
                  {favoriteButton}
                </UiActionRow>
              )
            })()}
            {equipMsg && <p className={styles.muted}>{equipMsg}</p>}
          </div>
        </div>
      )}

      {devMode && (
        <UiButton
          type="button"
          variant="dev"
          onClick={async () => {
            const scenes = await api.getScenes()
            await rebuildProgression({ sessions, scenes: scenes.scenes || [], trackDrills })
          }}
        >
          ⚡ DEV · Progression neu berechnen
        </UiButton>
      )}
    </div>
  )
}
