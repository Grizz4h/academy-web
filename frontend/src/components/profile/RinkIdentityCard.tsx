import { getAvatarAsset, DEFAULT_AVATAR_ID } from '../../data/profile/avatarCatalog'
import { getBannerAsset, DEFAULT_BANNER_ID } from '../../data/profile/bannerCatalog'
import { getEmblemAsset, DEFAULT_EMBLEM_ID } from '../../data/profile/emblemCatalog'
import { getProfileTitle } from '../../data/profile/profileTitleCatalog'
import type { UserProfileCustomization } from '../../data/profile/types'
import { resolveUploadUrl } from '../../api'
import styles from './RinkIdentityCard.module.css'

export type RinkIdentityStats = {
  drillsCompleted?: number
  scenesCount?: number
  topTrack?: string | null
  memberSince?: string | null
  pux?: number | null
}

type RinkIdentityCardProps = {
  profile: UserProfileCustomization
  stats?: RinkIdentityStats
  className?: string
}

function formatJersey(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return String(Math.max(0, Math.min(99, value))).padStart(2, '0')
}

export default function RinkIdentityCard({ profile, stats, className = '' }: RinkIdentityCardProps) {
  const banner = getBannerAsset(profile.bannerId || DEFAULT_BANNER_ID) || getBannerAsset(DEFAULT_BANNER_ID)
  const title = getProfileTitle(profile.profileTitle)

  let avatarSrc = getAvatarAsset(DEFAULT_AVATAR_ID)?.src || ''
  if (profile.avatar?.type === 'upload') {
    avatarSrc = resolveUploadUrl(profile.avatar.uploadUrl) || avatarSrc
  } else if (profile.avatar?.type === 'catalog') {
    avatarSrc = getAvatarAsset(profile.avatar.avatarId)?.src || avatarSrc
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

  const metaBits = [
    jersey ? `#${jersey}` : null,
    title?.label || null,
  ].filter(Boolean)

  const activityBits = [
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
      </div>

      <div className={styles.body}>
        <div className={styles.avatarWrap}>
          <img className={styles.avatar} src={avatarSrc} alt="" />
        </div>

        <div className={styles.identity}>
          <h2 className={styles.name}>{displayName}</h2>
          {metaBits.length > 0 && <p className={styles.meta}>{metaBits.join(' · ')}</p>}
          {profile.favoriteTeamName && (
            <p className={styles.team}>{profile.favoriteTeamName}</p>
          )}
          {profile.profileTagline && (
            <p className={styles.tagline}>„{profile.profileTagline}“</p>
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
