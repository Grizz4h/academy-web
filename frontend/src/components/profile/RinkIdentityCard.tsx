import { getAvatarAsset, DEFAULT_AVATAR_ID } from '../../data/profile/avatarCatalog'
import { getBannerAsset, DEFAULT_BANNER_ID } from '../../data/profile/bannerCatalog'
import { getCoinAsset } from '../../data/profile/coinCatalog'
import { getEmblemAsset, DEFAULT_EMBLEM_ID } from '../../data/profile/emblemCatalog'
import { getStickerAsset } from '../../data/profile/stickerCatalog'
import { resolveAvatarRarity, resolveEquippedTagline, resolveEquippedTitle } from '../../features/progression'
import type { UserProfileCustomization } from '../../data/profile/types'
import { resolveUploadUrl } from '../../api'
import styles from './RinkIdentityCard.module.css'

export type RinkIdentityStats = {
  drillsCompleted?: number
  scenesCount?: number
  topTrack?: string | null
  memberSince?: string | null
  pux?: number | null
  level?: number | null
  xpLabel?: string | null
}

type RinkIdentityCardProps = {
  profile: UserProfileCustomization
  stats?: RinkIdentityStats
  className?: string
  coinIds?: string[]
}

function formatJersey(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return String(Math.max(0, Math.min(99, value))).padStart(2, '0')
}

export default function RinkIdentityCard({ profile, stats, className = '', coinIds = [] }: RinkIdentityCardProps) {
  const banner = getBannerAsset(profile.bannerId || DEFAULT_BANNER_ID) || getBannerAsset(DEFAULT_BANNER_ID)
  const title = resolveEquippedTitle(profile.profileTitle)
  const tagline = resolveEquippedTagline(profile.profileTagline)

  let avatarSrc = getAvatarAsset(DEFAULT_AVATAR_ID)?.src || ''
  let avatarRarity = resolveAvatarRarity(DEFAULT_AVATAR_ID)
  if (profile.avatar?.type === 'upload') {
    avatarSrc = resolveUploadUrl(profile.avatar.uploadUrl) || avatarSrc
    avatarRarity = 'common'
  } else if (profile.avatar?.type === 'catalog') {
    avatarSrc = getAvatarAsset(profile.avatar.avatarId)?.src || avatarSrc
    avatarRarity = resolveAvatarRarity(profile.avatar.avatarId)
  }

  let emblemSrc: string | null = null
  if (profile.emblem?.type === 'catalog') {
    emblemSrc = getEmblemAsset(profile.emblem.emblemId)?.src || getEmblemAsset(DEFAULT_EMBLEM_ID)?.src || null
  } else if (profile.emblem?.type === 'custom') {
    // Custom SVG renderer comes later; keep slot visible with catalog fallback.
    emblemSrc = getEmblemAsset(DEFAULT_EMBLEM_ID)?.src || null
  }

  const jersey = formatJersey(profile.jerseyNumber)
  const displayName = (profile.displayName || 'Spieler').trim() || 'Spieler'
  const stickers = (profile.stickerIds || []).map((id) => getStickerAsset(id)).filter(Boolean)
  const coins = coinIds.map((id) => getCoinAsset(id)).filter(Boolean)

  const activityBits = [
    typeof stats?.level === 'number' ? `Level ${stats.level}` : null,
    stats?.xpLabel ? stats.xpLabel : null,
    typeof stats?.drillsCompleted === 'number' ? `Drills ${stats.drillsCompleted}` : null,
    typeof stats?.scenesCount === 'number' ? `Szenen ${stats.scenesCount}` : null,
    stats?.topTrack ? `Top Track ${stats.topTrack}` : null,
    typeof stats?.pux === 'number' ? `PUX ${stats.pux}` : null,
  ].filter(Boolean)

  return (
    <article className={`${styles.card} ${className}`}>
      <div className={styles.banner} style={banner ? { backgroundImage: `url(${banner.src})` } : undefined}>
        {emblemSrc && (
          <div className={styles.emblem} aria-hidden="true">
            <img src={emblemSrc} alt="" />
          </div>
        )}
        {stickers.map((sticker, index) => (
          <img
            key={sticker!.id}
            className={styles.sticker}
            data-slot={index}
            src={sticker!.src}
            alt=""
          />
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.avatarWrap} data-avatar-rarity={avatarRarity}>
          <img className={styles.avatar} src={avatarSrc} alt="" />
        </div>

        <div className={styles.identity}>
          <h2 className={styles.name}>{displayName}</h2>
          {(jersey || title) && (
            <p className={styles.meta}>
              {jersey ? <span>#{jersey}</span> : null}
              {jersey && title ? ' · ' : null}
              {title ? (
                <span className="rarity-type" data-rarity={title.rarity}>{title.label}</span>
              ) : null}
            </p>
          )}
          {profile.favoriteTeamName && (
            <p className={styles.team}>{profile.favoriteTeamName}</p>
          )}
          {tagline && (
            <p className={`${styles.tagline} rarity-type rarity-type--tagline`} data-rarity={tagline.rarity}>
              „{tagline.label}“
            </p>
          )}
          {coins.length > 0 && (
            <div className={styles.coinTray} aria-label="Mastery Coins">
              {coins.map((coin) => (
                <img key={coin!.id} src={coin!.src} alt={coin!.label} title={coin!.label} />
              ))}
            </div>
          )}
          {activityBits.length > 0 && (
            <p className={styles.activity}>{activityBits.join(' · ')}</p>
          )}
          {stats?.memberSince && (
            <p className={styles.since}>Aktiv seit {stats.memberSince}</p>
          )}
        </div>
      </div>
    </article>
  )
}
