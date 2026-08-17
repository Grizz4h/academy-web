import type { UserProfileCustomization } from './types'
import { DEFAULT_AVATAR_ID } from './avatarCatalog'
import { DEFAULT_BANNER_ID } from './bannerCatalog'
import { DEFAULT_EMBLEM_ID } from './emblemCatalog'
import { DEFAULT_PROFILE_TITLE_ID } from './profileTitleCatalog'

export function createDefaultProfile(displayName: string): UserProfileCustomization {
  return {
    displayName: displayName || 'Spieler',
    avatar: { type: 'catalog', avatarId: DEFAULT_AVATAR_ID },
    bannerId: DEFAULT_BANNER_ID,
    frameId: null,
    emblem: { type: 'catalog', emblemId: DEFAULT_EMBLEM_ID },
    customEmblemId: null,
    customEmblems: [],
    profileTitle: DEFAULT_PROFILE_TITLE_ID,
    jerseyNumber: null,
    favoriteLeague: null,
    favoriteTeamName: null,
    profileTagline: null,
    stickerIds: [],
    academyHelpLevel: 'guided',
    terminologyMode: 'direct',
    preferredAttackDirection: 'auto',
    hockeyExperience: null,
    experiencePromptDismissed: false,
    dashboardPreferences: {},
    updatedAt: null,
  }
}
