import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, resolveUploadUrl } from '../api'
import { useUser } from '../context/UserContext'
import { getAvatarAsset, DEFAULT_AVATAR_ID } from '../data/profile/avatarCatalog'
import styles from './TopNav.module.css'

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

  let avatarSrc = getAvatarAsset(DEFAULT_AVATAR_ID)?.src || ''
  if (profile?.avatar?.type === 'upload') {
    avatarSrc = resolveUploadUrl(profile.avatar.uploadUrl) || avatarSrc
  } else if (profile?.avatar?.type === 'catalog') {
    avatarSrc = getAvatarAsset(profile.avatar.avatarId)?.src || avatarSrc
  }

  return (
    <NavLink to="/account" className={styles.userLink} title="Account öffnen">
      <img className={styles.userAvatar} src={avatarSrc} alt="" />
      <span className={styles.userLine}>
        Angemeldet: <strong>{displayName}</strong>
      </span>
    </NavLink>
  )
}
