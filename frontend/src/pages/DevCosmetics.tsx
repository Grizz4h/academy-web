import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { AccountPillFrame } from '../components/profile/AccountPillFrame'
import { UiChip } from '../components/ui'
import { avatarCatalog, getAvatarAsset } from '../data/profile/avatarCatalog'
import { bannerCatalog, getBannerAsset } from '../data/profile/bannerCatalog'
import { coinCatalog, getCoinAsset } from '../data/profile/coinCatalog'
import { emblemCatalog, getEmblemAsset } from '../data/profile/emblemCatalog'
import { stickerCatalog, getStickerAsset } from '../data/profile/stickerCatalog'
import { profileTitleCatalog } from '../data/profile/profileTitleCatalog'
import {
  COSMETIC_CATALOG,
  TAGLINE_PRESETS,
  getStarterCosmeticIds,
  poolReasonLabel,
  selectUnassignedCosmeticPool,
  type CosmeticDefinition,
  type CosmeticType,
  RARITY_LABELS,
} from '../features/progression'
import styles from './DevCosmetics.module.css'

const FRAME_IDS = COSMETIC_CATALOG.filter((c) => c.type === 'frame').map((c) => c.id)
const TEXT_TITLES = COSMETIC_CATALOG.filter((c) => c.type === 'title')
const POC_3D = COSMETIC_CATALOG.filter((c) =>
  ['puckModel', 'puckSkin', 'stickModel', 'stickSkin'].includes(c.type),
)

const QA_REMOVED_IDS = new Set([
  'avatar_zamboni',
  'banner_zamboni_shift',
  'banner_property_of_the_slot',
  'emblem_zamboni',
  'emblem_slot_resident',
  'sticker_fresh_sheet',
  'sticker_slot',
])

const POOL_TYPE_FILTERS: Array<CosmeticType | 'all'> = [
  'all',
  'avatar',
  'banner',
  'emblem',
  'frame',
  'title',
  'tagline',
  'sticker',
  'puckSkin',
  'stickSkin',
  'puckModel',
  'stickModel',
]

function poolAssetSrc(definition: CosmeticDefinition): string | undefined {
  const assetId = definition.assetId || definition.id
  return (
    getAvatarAsset(assetId)?.src ||
    getBannerAsset(assetId)?.src ||
    getEmblemAsset(assetId)?.src ||
    getStickerAsset(assetId)?.src ||
    getCoinAsset(assetId)?.src
  )
}

function AssetGrid({
  items,
}: {
  items: Array<{ id: string; label: string; src: string; starter?: boolean }>
}) {
  const visible = items.filter((item) => !QA_REMOVED_IDS.has(item.id))
  return (
    <div className={styles.grid}>
      {visible.map((item) => {
        const inStarterPool = item.starter !== false
        return (
          <figure key={item.id} className={styles.tile}>
            <img src={item.src} alt="" className={styles.art} />
            <figcaption>
              <code>{item.id}</code>
              <span className={styles.meta}>
                {item.label}
                {inStarterPool ? ' · aktuell starter-flag' : ' · earn/shop'}
              </span>
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export default function DevCosmetics() {
  const starterIds = getStarterCosmeticIds()
  const pool = useMemo(() => selectUnassignedCosmeticPool(), [])
  const [poolType, setPoolType] = useState<CosmeticType | 'all'>('all')
  const [poolReason, setPoolReason] = useState<'all' | 'shop_parked' | 'secret' | 'no_grant'>('all')

  const filteredPool = useMemo(
    () =>
      pool.filter((entry) => {
        if (poolType !== 'all' && entry.definition.type !== poolType) return false
        if (poolReason !== 'all' && entry.poolReason !== poolReason) return false
        return true
      }),
    [pool, poolType, poolReason],
  )

  const poolCounts = useMemo(() => {
    const byReason = { shop_parked: 0, secret: 0, no_grant: 0 }
    for (const entry of pool) byReason[entry.poolReason] += 1
    return {
      total: pool.length,
      catalog: COSMETIC_CATALOG.length,
      assigned: COSMETIC_CATALOG.length - pool.length,
      ...byReason,
    }
  }, [pool])

  return (
    <div className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Cosmetic Kontaktübersicht</h1>
        <p className="ui-page-lead">
          Visuelle Spot-Checks + nicht zugewiesener Vorrat. Zurück zum{' '}
          <Link to="/dev">Dev-Cockpit</Link>
          {' · '}
          <Link to="/dev/progression">Progression Cockpit</Link>
          {' · '}
          Doc: <code>docs/architecture/cosmetic-inventory-phase3.md</code>
        </p>
      </header>

      <Card surface="primary" className={styles.poolCard}>
        <h2 className="ui-section-title">Nicht zugewiesener Pool</h2>
        <p className="ui-page-lead">
          Cosmetics ohne harten Grant-Pfad (Achievement / Event / Level / Mastery / Collection / Challenge / Live-Shop).
          Bleiben im Katalog — später Achievements oder Shop-Listings dranhängen.
        </p>
        <div className={styles.poolStats}>
          <span><strong>{poolCounts.total}</strong> im Pool</span>
          <span><strong>{poolCounts.assigned}</strong> zugewiesen</span>
          <span><strong>{poolCounts.catalog}</strong> Katalog gesamt</span>
          <span>{poolCounts.shop_parked} Shop-Vorrat</span>
          <span>{poolCounts.secret} Secret</span>
          <span>{poolCounts.no_grant} sonst</span>
        </div>

        <div className={styles.poolFilters}>
          {POOL_TYPE_FILTERS.map((type) => (
            <UiChip
              key={type}
              active={poolType === type}
              onClick={() => setPoolType(type)}
            >
              {type === 'all' ? 'Alle Typen' : type}
            </UiChip>
          ))}
        </div>
        <div className={styles.poolFilters}>
          {(
            [
              ['all', 'Alle Gründe'],
              ['shop_parked', 'Shop-Vorrat'],
              ['secret', 'Secret'],
              ['no_grant', 'Kein Grant'],
            ] as const
          ).map(([value, label]) => (
            <UiChip
              key={value}
              active={poolReason === value}
              onClick={() => setPoolReason(value)}
            >
              {label}
            </UiChip>
          ))}
        </div>

        <div className={styles.poolGrid}>
          {filteredPool.map((entry) => {
            const c = entry.definition
            const src = poolAssetSrc(c)
            return (
              <article key={c.id} className={styles.poolTile} data-reason={entry.poolReason}>
                <div className={styles.poolPreview}>
                  {c.type === 'frame' ? (
                    <AccountPillFrame frameId={c.id} preview previewSize="tile" />
                  ) : src ? (
                    <img src={src} alt="" className={styles.art} />
                  ) : (
                    <div className={styles.poolTextPreview}>
                      {c.text || c.name}
                    </div>
                  )}
                </div>
                <div className={styles.poolBody}>
                  <code>{c.id}</code>
                  <strong>{c.name}</strong>
                  <span className={styles.meta}>
                    {c.type} · {RARITY_LABELS[c.rarity]} · {poolReasonLabel(entry.poolReason)}
                  </span>
                  {c.flavorText && <span className={styles.flavor}>„{c.flavorText}“</span>}
                </div>
              </article>
            )
          })}
        </div>
        {filteredPool.length === 0 && (
          <p className={styles.meta}>Kein Eintrag für diesen Filter.</p>
        )}
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Visual-QA (alle Cluster-1-Assets)</h2>
        <p className="ui-page-lead">
          Spot-Checks — nicht das Starter-Bundle. Noch <strong>{starterIds.length}</strong> Cosmetics mit{' '}
          <code>starter</code>-Flag (Soll: ~5–6).
        </p>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Aus Product entfernt (QA)</h2>
        <ul className={styles.textList}>
          {[...QA_REMOVED_IDS].map((id) => (
            <li key={id}>
              <code>{id}</code> — entfernt; Ersatz Slot-Set: <code>sticker_high_slot</code> / <code>emblem_high_slot</code> /{' '}
              <code>banner_high_slot</code>
            </li>
          ))}
        </ul>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Avatare</h2>
        <AssetGrid items={avatarCatalog} />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Banner</h2>
        <AssetGrid items={bannerCatalog} />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Embleme</h2>
        <AssetGrid items={emblemCatalog} />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Sticker</h2>
        <AssetGrid items={stickerCatalog} />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Mastery Coins</h2>
        <AssetGrid items={coinCatalog} />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Frames (CSS)</h2>
        <div className={styles.grid}>
          {FRAME_IDS.map((id) => (
            <figure key={id} className={styles.tile}>
              <div className={styles.framePreview}>
                <AccountPillFrame frameId={id} preview previewSize="tile" />
              </div>
              <figcaption>
                <code>{id}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Profile-Title-Pool (Starter-Text)</h2>
        <ul className={styles.textList}>
          {profileTitleCatalog.map((t) => (
            <li key={t.id}>
              <code>title_catalog_{t.id}</code> — {t.label}
            </li>
          ))}
        </ul>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Reward-Titel (Katalog)</h2>
        <ul className={styles.textList}>
          {TEXT_TITLES.filter((t) => !t.id.startsWith('title_catalog_')).map((t) => (
            <li key={t.id}>
              <code>{t.id}</code> — {t.text || t.name} · {t.rarity} · {t.origin.type}
            </li>
          ))}
        </ul>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Taglines</h2>
        <ul className={styles.textList}>
          {TAGLINE_PRESETS.map((t) => (
            <li key={t.id}>
              <code>{t.id}</code> — „{t.text}“
            </li>
          ))}
          {COSMETIC_CATALOG.filter((c) => c.type === 'tagline' && !TAGLINE_PRESETS.some((p) => p.id === c.id)).map(
            (t) => (
              <li key={t.id}>
                <code>{t.id}</code> — „{t.text || t.name}“ · {t.rarity}
              </li>
            ),
          )}
        </ul>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Puck / Stick — deferred_cluster_2</h2>
        <p className="ui-page-lead">
          3D-Cosmetics: Besitz bleibt, aber <strong>kein</strong> aktueller Visual-QA / keine Early-Slot-Kandidaten.
          Siehe Inventar-Doc Cluster 2.
        </p>
        <ul className={styles.textList}>
          {POC_3D.map((c) => (
            <li key={c.id}>
              <code>{c.id}</code> — {c.type} · {c.rarity} · {c.origin.type}
              {c.metadata?.previewOnly ? ' · previewOnly' : ''}
              {c.metadata?.supersededBy ? ` · superseded→${String(c.metadata.supersededBy)}` : ''}
              {' · '}
              <em>deferred_cluster_2</em>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
