import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, resolveUploadUrl } from '../api'
import { useUser } from '../context/UserContext'
import { getAvatarAsset, DEFAULT_AVATAR_ID } from '../data/profile/avatarCatalog'
import { resolveProfileTitleLabel } from '../data/profile/profileTitleCatalog'
import { getCosmetic, resolveAvatarRarity } from '../features/progression'
import { TUTORIAL_TARGET } from '../features/tutorial'
import styles from './TopNav.module.css'

function titleFromProfile(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cosmetic = getCosmetic(raw)
  if (cosmetic?.type === 'title') return cosmetic.text || cosmetic.name
  return resolveProfileTitleLabel(raw)
}

export default function UserName() {
  const { user } = useUser()
  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })

  if (!user) return null

  const profile = account?.profile
  const displayName = profile?.displayName || user
  const title = titleFromProfile(profile?.profileTitle)

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
      title={title ? `Account · ${displayName} · ${title}` : `Account · ${displayName}`}
      aria-label={title ? `Account öffnen · ${displayName}, ${title}` : `Account öffnen · ${displayName}`}
      data-tutorial-id={TUTORIAL_TARGET.navAccount}
    >
      <span className={styles.userAvatarWrap} data-avatar-rarity={avatarRarity}>
        <img className={styles.userAvatar} src={avatarSrc} alt="" />
      </span>
      <span className={styles.userCopy}>
        <span className={styles.userName}>{displayName}</span>
        {title ? <span className={styles.userTitle}>{title}</span> : null}
      </span>
    </NavLink>
  )
}
