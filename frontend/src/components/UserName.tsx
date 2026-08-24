import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, resolveUploadUrl } from '../api'
import { useUser } from '../context/UserContext'
import { getAvatarAsset, DEFAULT_AVATAR_ID } from '../data/profile/avatarCatalog'
import { resolveAvatarRarity, resolveEquippedTitle } from '../features/progression'
import { useEntitlements } from '../features/entitlements'
import { TUTORIAL_TARGET } from '../features/tutorial'
import { UiPill } from './ui'
import styles from './TopNav.module.css'

export default function UserName() {
  const { user } = useUser()
  const { hasAcademyPremium } = useEntitlements()
  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })

  if (!user) return null

  const profile = account?.profile
  const displayName = profile?.displayName || user
  const title = resolveEquippedTitle(profile?.profileTitle)

  let avatarSrc = getAvatarAsset(DEFAULT_AVATAR_ID)?.src || ''
  let avatarRarity = resolveAvatarRarity(DEFAULT_AVATAR_ID)
  if (profile?.avatar?.type === 'upload') {
    avatarSrc = resolveUploadUrl(profile.avatar.uploadUrl) || avatarSrc
    avatarRarity = 'common'
  } else if (profile?.avatar?.type === 'catalog') {
    avatarSrc = getAvatarAsset(profile.avatar.avatarId)?.src || avatarSrc
    avatarRarity = resolveAvatarRarity(profile.avatar.avatarId)
  }

  return (
    <NavLink
      to="/account"
      className={styles.userLink}
      title={title ? `Account · ${displayName} · ${title.label}` : `Account · ${displayName}`}
      aria-label={title ? `Account öffnen · ${displayName}, ${title.label}` : `Account öffnen · ${displayName}`}
      data-tutorial-id={TUTORIAL_TARGET.navAccount}
    >
      <span className={styles.userAvatarWrap} data-avatar-rarity={avatarRarity} data-premium={hasAcademyPremium || undefined}>
        <img className={styles.userAvatar} src={avatarSrc} alt="" />
      </span>
      <span className={styles.userCopy}>
        <span className={styles.userNameRow}>
          <span className={styles.userName}>{displayName}</span>
          {hasAcademyPremium ? (
            <UiPill tone="accent" className={styles.premiumNavPill}>Premium</UiPill>
          ) : null}
        </span>
        {title ? <span className={`${styles.userTitle} rarity-type`} data-rarity={title.rarity}>{title.label}</span> : null}
      </span>
    </NavLink>
  )
}
