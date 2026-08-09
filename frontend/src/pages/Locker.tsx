import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  selectCollectionProgress,
  selectLockerItems,
  selectLockerStats,
  selectTrackMasteryViews,
  SHOP_LISTINGS,
  selectAchievementsByCategory,
  type CosmeticType,
  type LockerItemView,
} from '../features/progression'
import { useRewards } from '../features/rewards'
import { isStarterCosmetic } from '../features/progression/cosmetics/cosmeticCatalog'
import { Puck3DLab } from '../components/puck3d'
import styles from './Locker.module.css'

type LockerTab = 'home' | 'cosmetics' | 'collections' | 'shop' | 'mastery' | 'achievements'

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
  const {
    rewardState,
    purchaseShopListing,
    markCosmeticsSeen,
    toggleFavoriteCosmetic,
    rebuildProgression,
  } = useRewards()

  const [tab, setTab] = useState<LockerTab>('home')
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
    () => selectLockerItems({ ...rewardState, favoriteCosmeticIds: rewardState.favoriteCosmeticIds }),
    [rewardState],
  )
  const filtered = useMemo(
    () => filterLockerItems(items, { type: typeFilter, ownership }),
    [items, typeFilter, ownership],
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
  const achievementGroups = useMemo(() => selectAchievementsByCategory(rewardState), [rewardState])
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
    if (!me?.profile || !item.owned || !isEquipableCosmetic(item.definition)) return
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
    } else if (slot === 'title') {
      profile.profileTitle = String(item.definition.metadata?.profileTitleId || item.definition.text || item.definition.name)
    } else if (slot === 'tagline') {
      profile.profileTagline = item.definition.text || item.definition.name
    }
    try {
      await api.updateMyProfile(profile)
      await refetchMe()
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

  const isDev =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV || localStorage.getItem('academy.devRewards') === '1')

  if (!user) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Locker</h1>
        <p className={styles.lead}>Bitte melde dich an, um deinen Locker zu öffnen.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Locker</h1>
          <p className={styles.lead}>Sammeln · Browsen · Freischalten · Ausrüsten</p>
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

      <nav className={styles.tabs} aria-label="Locker Bereiche">
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
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
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
            <h2 className={styles.sectionTitle}>Neue Unlocks</h2>
            {newItems.length === 0 ? (
              <p className={styles.muted}>Keine neuen Items.</p>
            ) : (
              <div className={styles.grid}>
                {newItems.map((item) => (
                  <button key={item.definition.id} type="button" className={`${styles.tile} ${styles[`rarity_${item.definition.rarity}`]}`} onClick={() => openDetail(item)}>
                    <span className={styles.badgeNew}>NEU</span>
                    <div className={styles.tileArt}>{item.artworkUrl ? <img src={item.artworkUrl} alt="" /> : <span className={styles.tileGlyph}>{item.definition.type.slice(0, 2).toUpperCase()}</span>}</div>
                    <div className={styles.tileName}>{item.displayName}</div>
                    <div className={styles.tileMeta}>{RARITY_LABELS[item.definition.rarity]}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Collections</h2>
            <div className={styles.collectionRow}>
              {collections.map((entry) => (
                <button key={entry.collection.id} type="button" className={styles.collectionCard} onClick={() => setTab('collections')}>
                  <strong>{entry.collection.name}</strong>
                  <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.round(entry.ratio * 100)}%` }} /></div>
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
              <button key={chip.id} type="button" className={`${styles.chip} ${typeFilter === chip.id ? styles.chipActive : ''}`} onClick={() => setTypeFilter(chip.id)}>
                {chip.label}
              </button>
            ))}
          </div>
          <div className={styles.chipRow}>
            {(['all', 'unlocked', 'locked', 'new', 'favorites'] as const).map((id) => (
              <button key={id} type="button" className={`${styles.chip} ${ownership === id ? styles.chipActive : ''}`} onClick={() => setOwnership(id)}>
                {id === 'all' ? 'Alle' : id === 'unlocked' ? 'Unlocked' : id === 'locked' ? 'Locked' : id === 'new' ? 'Neu' : 'Favoriten'}
              </button>
            ))}
          </div>
          <div className={styles.grid}>
            {filtered.map((item) => (
              <button
                key={item.definition.id}
                type="button"
                className={`${styles.tile} ${styles[`rarity_${item.definition.rarity}`]} ${!item.owned ? styles.tileLocked : ''} ${item.silhouette ? styles.tileSilhouette : ''}`}
                onClick={() => openDetail(item)}
              >
                {item.isNew && <span className={styles.badgeNew}>NEU</span>}
                <div className={styles.tileArt}>
                  {item.artworkUrl ? <img src={item.artworkUrl} alt="" /> : <span className={styles.tileGlyph}>{item.silhouette || !item.owned ? '?' : item.definition.type.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className={styles.tileName}>{item.displayName}</div>
                <div className={styles.tileMeta}>{RARITY_LABELS[item.definition.rarity]} · {item.definition.type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'collections' && (
        <div className={styles.stack}>
          {collections.map((entry) => (
            <article key={entry.collection.id} className={styles.collectionDetail}>
              <header>
                <h2 className={styles.sectionTitle}>{entry.collection.name}</h2>
                <p className={styles.muted}>{entry.collection.description}</p>
                <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.round(entry.ratio * 100)}%` }} /></div>
                <div className={styles.muted}>{entry.owned} / {entry.total}{entry.completed ? ' · Collection Complete' : ''}</div>
              </header>
              <div className={styles.grid}>
                {entry.collection.itemIds.map((id) => {
                  const item = items.find((entryItem) => entryItem.definition.id === id)
                  if (!item) {
                    const def = getCosmetic(id)
                    return (
                      <div key={id} className={`${styles.tile} ${styles.tileLocked}`}>
                        <div className={styles.tileName}>{def?.name || id}</div>
                        <div className={styles.tileMeta}>Locked</div>
                      </div>
                    )
                  }
                  return (
                    <button key={id} type="button" className={`${styles.tile} ${!item.owned ? styles.tileLocked : ''}`} onClick={() => openDetail(item)}>
                      <div className={styles.tileName}>{item.displayName}</div>
                      <div className={styles.tileMeta}>{item.owned ? 'Owned' : 'Missing'}</div>
                    </button>
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
            {SHOP_LISTINGS.map((listing) => {
              const def = getCosmetic(listing.cosmeticId)
              const owned = Boolean(rewardState.unlockedCosmetics?.[listing.cosmeticId] || isStarterCosmetic(listing.cosmeticId))
              return (
                <article key={listing.id} className={styles.shopCard}>
                  <div className={styles.tileName}>{def?.name || listing.cosmeticId}</div>
                  <div className={styles.tileMeta}>{listing.category} · {def ? RARITY_LABELS[def.rarity] : ''}</div>
                  <div className={styles.price}>{listing.pricePux} Pux</div>
                  <button
                    type="button"
                    className={styles.buyButton}
                    disabled={owned || shopBusy === listing.id}
                    onClick={() => handleBuy(listing.id)}
                  >
                    {owned ? 'Besitzt' : shopBusy === listing.id ? 'Kauft…' : `Kaufen · ${listing.pricePux}`}
                  </button>
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
              <h2 className={styles.sectionTitle}>{view.name}</h2>
              {view.description && <p className={styles.muted}>{view.description}</p>}
              <div className={styles.muted}>
                {view.complete
                  ? 'Track Mastery abgeschlossen'
                  : view.nextThreshold
                    ? `Nächstes Ziel · Mastery ${view.nextThreshold}× · ${Math.round(view.nextRatio * 100)}%`
                    : '—'}
              </div>
              <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.round(view.nextRatio * 100)}%` }} /></div>
              <div className={styles.tileMeta}>Freigeschaltet: {view.unlockedThresholds.join(', ') || '—'}</div>
            </article>
          ))}
        </div>
      )}

      {tab === 'achievements' && (
        <div className={styles.stack}>
          {achievementGroups.map((group) => (
            <section key={group.category}>
              <h2 className={styles.sectionTitle}>{group.label}</h2>
              <div className={styles.grid}>
                {group.items.map((item) => (
                  <article key={item.definition.id} className={`${styles.shopCard} ${item.unlocked ? styles.tile : styles.tileLocked}`}>
                    <div className={styles.tileName}>{item.secretHidden ? '???' : item.definition.name}</div>
                    {!item.secretHidden && (
                      <>
                        <p className={styles.muted}>{item.definition.description}</p>
                        <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.round(item.ratio * 100)}%` }} /></div>
                        <div className={styles.tileMeta}>{item.unlocked ? 'Freigeschaltet' : `${item.current} / ${item.target}`}</div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <div className={styles.sheetScrim} onClick={() => setSelected(null)} role="presentation">
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button type="button" className={styles.sheetClose} onClick={() => setSelected(null)}>Schließen</button>
            <div className={`${styles.sheetArt} ${styles[`rarity_${selected.definition.rarity}`]}`}>
              {selected.artworkUrl ? <img src={selected.artworkUrl} alt="" /> : <span className={styles.tileGlyph}>{selected.displayName.slice(0, 1)}</span>}
            </div>
            <h2 className={styles.sheetTitle}>{selected.displayName}</h2>
            <div className={styles.tileMeta}>{selected.definition.type} · {RARITY_LABELS[selected.definition.rarity]}</div>
            {selected.definition.flavorText && <p className={styles.flavor}>“{selected.definition.flavorText}”</p>}
            {selected.displayDescription && <p className={styles.muted}>{selected.displayDescription}</p>}
            <p><strong>Herkunft</strong><br />{selected.originLabel}</p>
            {selected.definition.collectionId && (
              <p><strong>Collection</strong><br />{COLLECTIONS.find((c) => c.id === selected.definition.collectionId)?.name || selected.definition.collectionId}</p>
            )}
            {selected.unlockHint && <p className={styles.muted}>{selected.unlockHint}</p>}
            <div className={styles.sheetActions}>
              <button type="button" className={styles.chip} onClick={() => toggleFavoriteCosmetic(selected.definition.id)}>
                {selected.isFavorite ? '★ Favorit' : '☆ Favorit'}
              </button>
              {selected.owned && isEquipableCosmetic(selected.definition) && (
                <button type="button" className={styles.buyButton} onClick={() => handleEquip(selected)}>Ausrüsten</button>
              )}
            </div>
            {equipMsg && <p className={styles.muted}>{equipMsg}</p>}
          </div>
        </div>
      )}

      {isDev && (
        <button
          type="button"
          className={styles.devButton}
          onClick={async () => {
            const scenes = await api.getScenes()
            await rebuildProgression({ sessions, scenes: scenes.scenes || [], trackDrills })
          }}
        >
          ⚡ DEV · Progression neu berechnen
        </button>
      )}
    </div>
  )
}
