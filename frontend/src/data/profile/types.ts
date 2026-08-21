/** Shared profile personalization types for RINK ID. */

export type ProfileAssetKind = 'avatar' | 'banner' | 'emblem'

export type ProfileAsset = {
  id: string
  label: string
  src: string
  category?: string
  tags?: string[]
  unlock?: {
    type: string
    value?: unknown
  }
  locked?: boolean
  /** If false, the asset is not a starter cosmetic. Default: starter. */
  starter?: boolean
}

export type ProfileTitleAsset = {
  id: string
  label: string
  description?: string
  unlock?: {
    type: string
    value?: unknown
  }
  locked?: boolean
}

export type UserAvatarSelection =
  | {
      type: 'catalog'
      avatarId: string
    }
  | {
      type: 'upload'
      uploadUrl: string
    }

export type UserEmblemSelection =
  | {
      type: 'catalog'
      emblemId: string
    }
  | {
      type: 'custom'
      customEmblemId: string
    }

/** Prepared for a future mini SVG layer editor — not used in MVP UI. */
export type EmblemLayer = {
  id: string
  shape: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  fill?: string
  stroke?: string
  zIndex: number
}

export type CustomEmblem = {
  id: string
  name?: string
  background?: string
  layers: EmblemLayer[]
  updatedAt?: string
}

export type AcademyHelpLevel = 'discover' | 'guided' | 'learning'
export type TerminologyMode = 'direct' | 'explained'
export type PreferredAttackDirection = 'left' | 'right' | 'auto'
export type HockeyExperienceLevel = 'beginner' | 'familiar' | 'advanced'

export type DashboardPreferences = {
  layoutHints?: string[]
  hiddenWidgets?: string[]
  [key: string]: unknown
}

export type UserProfileCustomization = {
  displayName: string
  avatar: UserAvatarSelection
  bannerId: string | null
  frameId: string | null
  emblem: UserEmblemSelection | null
  customEmblemId?: string | null
  customEmblems?: CustomEmblem[]
  profileTitle: string | null
  jerseyNumber: number | null
  favoriteLeague: string | null
  favoriteTeamName: string | null
  profileTagline: string | null
  /** Up to 3 sticker cosmetic ids, stuck onto the identity card. */
  stickerIds?: string[]
  academyHelpLevel: AcademyHelpLevel
  terminologyMode: TerminologyMode
  preferredAttackDirection: PreferredAttackDirection
  /** Optional foundation onboarding signal — null/undefined = legacy profile */
  hockeyExperience?: HockeyExperienceLevel | null
  /** Soft dismiss for experience prompt (existing users) */
  experiencePromptDismissed?: boolean
  dashboardPreferences: DashboardPreferences
  updatedAt?: string | null
}

export type UserAccountPayload = {
  username: string
  /** Stable RinQ app identity (opaque UUID). Not the JWT sub. */
  rinq_user_id?: string
  user_id?: string
  display_name?: string | null
  createdAt: string | null
  role: string | null
  profile: UserProfileCustomization
}
