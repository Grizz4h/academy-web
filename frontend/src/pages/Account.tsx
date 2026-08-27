import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import Card from '../components/Card'
import RinkIdentityCard from '../components/profile/RinkIdentityCard'
import ProfileAssetSelector from '../components/profile/ProfileAssetSelector'
import { useUser } from '../context/UserContext'
import { useRewards } from '../features/rewards'
import { isCosmeticOwned, RARITY_LABELS, selectLevelProgress, selectTaglineOptions, selectTitleOptions } from '../features/progression'
import { getCosmetic } from '../features/progression/cosmetics/cosmeticCatalog'
import { coinCatalog } from '../data/profile/coinCatalog'
import AccountProgressionPanel from '../components/progression/AccountProgressionPanel'
import { avatarCatalog, DEFAULT_AVATAR_ID } from '../data/profile/avatarCatalog'
import { bannerCatalog, DEFAULT_BANNER_ID } from '../data/profile/bannerCatalog'
import { emblemCatalog, DEFAULT_EMBLEM_ID } from '../data/profile/emblemCatalog'
import { DEFAULT_PROFILE_TITLE_ID } from '../data/profile/profileTitleCatalog'
import { createDefaultProfile } from '../data/profile/defaults'
import type {
  AcademyHelpLevel,
  HockeyExperienceLevel,
  PreferredAttackDirection,
  TerminologyMode,
  UserProfileCustomization,
} from '../data/profile/types'
import { LEAGUES, teamsByLeague } from '../data/teamsByLeague'
import { getRealSessions } from '../utils/sessionEligibility'
import { UiButton, UiPill, UiSheet, UiSheetActions } from '../components/ui'
import { useTutorialOptional } from '../features/tutorial'
import { useEntitlements } from '../features/entitlements'
import { describeAcademyBilling, useBilling } from '../features/billing'
import AccountBillingPanel from '../components/account/AccountBillingPanel'
import { CompetencyRadar, type CompetencyRadarValue } from '../features/competency'
import { isSupabaseConfigured, signInWithGoogle } from '../lib/supabase'
import styles from './Account.module.css'

const PROVIDER_LABELS: Record<string, string> = {
  legacy_password: 'Legacy Password',
  supabase_google: 'Google',
  supabase_email: 'Email OTP',
}

const COMPETENCY_PREVIEW_VALUES: readonly CompetencyRadarValue[] = [
  { competencyId: 'scanning_identification', score: 82 },
  { competencyId: 'roles_support', score: 76 },
  { competencyId: 'space_structure', score: 88 },
  { competencyId: 'options_decisions', score: 64 },
  { competencyId: 'transition_tempo', score: 71 },
  { competencyId: 'pressure_control', score: 79 },
  { competencyId: 'systems_patterns', score: 68 },
  { competencyId: 'evidence_analysis', score: 52 },
]

function formatMemberSince(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
}

function deriveTopTrack(sessions: Array<{ module_id?: string; state?: string }>): string | null {
  const counts = new Map<string, number>()
  for (const session of sessions) {
    const moduleId = String(session.module_id || '').trim().toUpperCase()
    if (!moduleId) continue
    // Prefer track prefix like C2 / B3 from module ids.
    const track = moduleId.includes('_') ? moduleId.split('_')[0] : moduleId.slice(0, 2)
    if (!track) continue
    counts.set(track, (counts.get(track) || 0) + 1)
  }
  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return ranked[0]?.[0] || null
}

export default function AccountPage() {
  const { user, authMode, logout } = useUser()
  const { rewardState } = useRewards()
  const tutorial = useTutorialOptional()
  const [searchParams, setSearchParams] = useSearchParams()
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [unlinkBusy, setUnlinkBusy] = useState<string | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [lifecycleError, setLifecycleError] = useState('')
  const [lifecycleInfo, setLifecycleInfo] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [checkoutNotice, setCheckoutNotice] = useState<'success' | 'cancel' | null>(null)
  const googleConfigured = isSupabaseConfigured()

  const { hasAcademyPremium, refetch: refetchEntitlements } = useEntitlements()
  const billingQuery = useBilling()
  const billingPresentation = useMemo(
    () => describeAcademyBilling(hasAcademyPremium, billingQuery.data),
    [hasAcademyPremium, billingQuery.data],
  )
  const premiumStatusForProfile = useMemo(
    () => (hasAcademyPremium || billingPresentation.profileLine
      ? {
          badgeLabel: billingPresentation.badgeLabel,
          badgeTone: billingPresentation.badgeTone,
          profileLine: billingPresentation.profileLine,
        }
      : null),
    [hasAcademyPremium, billingPresentation],
  )

  const { data: account, isLoading, error, refetch } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  })

  useEffect(() => {
    if (searchParams.get('google') === 'linked') {
      setLinkSuccess('Google-Konto ist jetzt mit diesem Account verknüpft.')
      setSearchParams({}, { replace: true })
      void refetch()
    }
  }, [searchParams, setSearchParams, refetch])

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      setCheckoutNotice('success')
      void refetchEntitlements()
      void billingQuery.refetch()
      setSearchParams({}, { replace: true })
    } else if (checkout === 'cancel') {
      setCheckoutNotice('cancel')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, refetchEntitlements, billingQuery.refetch])

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user, 'account'],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user),
  })

  const { data: scenesPayload } = useQuery({
    queryKey: ['scenes', user, 'account'],
    queryFn: () => api.getScenes(),
    enabled: Boolean(user),
  })

  const [draft, setDraft] = useState<UserProfileCustomization | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (account?.profile) {
      setDraft({
        ...createDefaultProfile(account.profile.displayName || user || 'Spieler'),
        ...account.profile,
      })
      setSaveState('idle')
      setSaveError('')
    }
  }, [account, user])

  const identityStats = useMemo(() => {
    const realSessions = getRealSessions(sessions)
    const completed = realSessions.filter((session) => session.state === 'COMPLETED').length
    const level = selectLevelProgress(rewardState)
    return {
      drillsCompleted: completed,
      scenesCount: Array.isArray(scenesPayload?.scenes) ? scenesPayload.scenes.length : 0,
      topTrack: deriveTopTrack(realSessions),
      memberSince: formatMemberSince(account?.createdAt),
      pux: Number(rewardState?.currency?.PUX || 0),
      level: level.level,
      xpLabel: `${level.xpIntoLevel.toLocaleString('de-DE')} / ${level.xpForNextLevel.toLocaleString('de-DE')} XP`,
    }
  }, [sessions, scenesPayload, account?.createdAt, rewardState])

  const ownedCoinIds = useMemo(
    () => coinCatalog.map((coin) => coin.id).filter((id) => isCosmeticOwned(rewardState, id)),
    [rewardState],
  )

  const avatarItems = useMemo(
    () => avatarCatalog.filter((item) => isCosmeticOwned(rewardState, item.id)),
    [rewardState],
  )
  const bannerItems = useMemo(
    () => bannerCatalog.filter((item) => isCosmeticOwned(rewardState, item.id)),
    [rewardState],
  )
  const emblemItems = useMemo(
    () => emblemCatalog.filter((item) => isCosmeticOwned(rewardState, item.id)),
    [rewardState],
  )
  const titleOptions = selectTitleOptions(rewardState)
  const titleLabelCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of titleOptions) counts.set(item.label, (counts.get(item.label) || 0) + 1)
    return counts
  }, [titleOptions])
  const taglineOptions = selectTaglineOptions(rewardState)
  const titleSelectValue = (() => {
    const raw = draft?.profileTitle
    if (raw && titleOptions.some((item) => item.id === raw)) return raw
    if (raw) {
      const catalogId = `title_catalog_${raw}`
      if (titleOptions.some((item) => item.id === catalogId)) return catalogId
    }
    return raw || DEFAULT_PROFILE_TITLE_ID
  })()
  const taglinePreset = draft?.profileTagline ? getCosmetic(draft.profileTagline) : undefined
  const taglineInputValue =
    taglinePreset?.type === 'tagline'
      ? (taglinePreset.text || taglinePreset.name)
      : (draft?.profileTagline || '')

  const favoriteTeams = draft?.favoriteLeague
    ? teamsByLeague[draft.favoriteLeague] || []
    : []

  const selectedAvatarId = draft?.avatar?.type === 'catalog'
    ? draft.avatar.avatarId
    : null

  const updateDraft = (patch: Partial<UserProfileCustomization>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
    setSaveState('idle')
  }

  const handleSave = async () => {
    if (!draft) return
    setSaveState('saving')
    setSaveError('')
    try {
      const saved = await api.updateMyProfile({
        displayName: draft.displayName,
        avatar: draft.avatar,
        bannerId: draft.bannerId,
        frameId: draft.frameId ?? null,
        emblem: draft.emblem,
        customEmblemId: draft.customEmblemId ?? null,
        customEmblems: draft.customEmblems || [],
        profileTitle: draft.profileTitle,
        jerseyNumber: draft.jerseyNumber,
        favoriteLeague: draft.favoriteLeague,
        favoriteTeamName: draft.favoriteTeamName,
        profileTagline: draft.profileTagline,
        academyHelpLevel: draft.academyHelpLevel,
        terminologyMode: draft.terminologyMode,
        preferredAttackDirection: draft.preferredAttackDirection,
        hockeyExperience: draft.hockeyExperience ?? null,
        experiencePromptDismissed: draft.experiencePromptDismissed ?? false,
        dashboardPreferences: draft.dashboardPreferences || {},
      })
      setDraft(saved)
      setSaveState('saved')
      refetch()
    } catch (err: any) {
      setSaveState('error')
      setSaveError(err?.message || 'Speichern fehlgeschlagen')
    }
  }

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !draft) return
    setUploadError('')
    setUploading(true)
    try {
      const result = await api.uploadMyAvatar(file)
      setDraft(result.profile)
      setSaveState('saved')
      refetch()
    } catch (err: any) {
      setUploadError(err?.message || 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Account</h1>
          <p className="ui-page-lead">Bitte melde dich an, um dein RINK-Profil zu bearbeiten.</p>
        </header>
      </div>
    )
  }

  if (isLoading || !draft) {
    return (
      <div className={styles.page}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Account</h1>
          <p className="ui-page-lead">Profil wird geladen …</p>
        </header>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Account</h1>
          <p className="ui-page-lead">Profil konnte nicht geladen werden.</p>
        </header>
      </div>
    )
  }

  return (
    <div className={`${styles.page} ui-page-shell`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Account</h1>
        <p className="ui-page-lead">
          Baue deine RINK ID und speichere persönliche Präferenzen. Keine zweite Stats-Seite – nur Profil und Identität.
        </p>
      </header>

      {tutorial ? (
        <Card surface="section" className={styles.sectionCard}>
          <h2 className="ui-section-title">Hilfe</h2>
          <p className={styles.sectionLead}>
            Das Tutorial zeigt dir, wo du Übungen findest und wie du eine Session startest.
          </p>
          <UiButton type="button" onClick={tutorial.restart}>
            Tutorial erneut starten
          </UiButton>
        </Card>
      ) : null}

      <AccountBillingPanel
        hasAcademyPremium={hasAcademyPremium}
        checkoutNotice={checkoutNotice}
        presentation={billingPresentation}
        billingLoading={billingQuery.isLoading}
        billingError={billingQuery.isError}
      />

      {googleConfigured || (account?.auth_providers && account.auth_providers.length > 0) ? (
        <Card surface="section" className={styles.sectionCard}>
          <h2 className="ui-section-title">Login-Methoden</h2>
          <p className={styles.sectionLead}>
            Verknüpfte Anmeldewege für diesen RinQ-Account. Die letzte Methode kann nicht entfernt werden.
          </p>
          <ul className={styles.providerList}>
            {(account?.auth_providers || []).map((provider) => {
              const canUnlink = (account?.auth_providers?.length || 0) > 1
              return (
                <li key={provider} className={styles.providerRow}>
                  <UiPill tone="ok">{PROVIDER_LABELS[provider] || provider} verbunden</UiPill>
                  {canUnlink ? (
                    <UiButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={unlinkBusy === provider}
                      onClick={async () => {
                        setLifecycleError('')
                        setUnlinkBusy(provider)
                        try {
                          await api.unlinkAuthProvider(provider)
                          setLinkSuccess(`${PROVIDER_LABELS[provider] || provider} getrennt.`)
                          await refetch()
                        } catch (e: any) {
                          setLifecycleError(e?.message || 'Trennen fehlgeschlagen')
                        } finally {
                          setUnlinkBusy(null)
                        }
                      }}
                    >
                      Trennen
                    </UiButton>
                  ) : null}
                </li>
              )
            })}
          </ul>
          {googleConfigured && !account?.auth_providers?.includes('supabase_google') ? (
            <div className={styles.field}>
              <UiButton
                type="button"
                variant="secondary"
                disabled={linkBusy || authMode === 'supabase'}
                onClick={async () => {
                  setLinkError('')
                  setLinkSuccess('')
                  setLinkBusy(true)
                  try {
                    const result = await signInWithGoogle({ intent: 'link' })
                    if (result.error) setLinkError(result.error)
                  } finally {
                    setLinkBusy(false)
                  }
                }}
              >
                {linkBusy ? 'Weiterleitung…' : 'Google-Konto verbinden'}
              </UiButton>
              {authMode === 'supabase' ? (
                <p className={styles.hint}>
                  Zum Verknüpfen mit Legacy zuerst mit Name/Passwort einloggen.
                </p>
              ) : null}
            </div>
          ) : null}
          {linkSuccess ? <p className={styles.hint}>{linkSuccess}</p> : null}
          {linkError ? <p className={styles.error}>{linkError}</p> : null}
          {lifecycleError ? <p className={styles.error}>{lifecycleError}</p> : null}
        </Card>
      ) : null}

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Daten & Sessions</h2>
        <p className={styles.sectionLead}>
          Export enthält deine Runtime-Daten als JSON. Keine Passwort-Hashes oder Tokens.
        </p>
        <div className={styles.lifecycleActions}>
          <UiButton
            type="button"
            variant="secondary"
            disabled={exportBusy}
            onClick={async () => {
              setLifecycleError('')
              setLifecycleInfo('')
              setExportBusy(true)
              try {
                const blob = await api.exportMyData()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `rinq-user-export-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
                setLifecycleInfo('Export gestartet.')
              } catch (e: any) {
                setLifecycleError(e?.message || 'Export fehlgeschlagen')
              } finally {
                setExportBusy(false)
              }
            }}
          >
            {exportBusy ? 'Exportiere…' : 'Daten exportieren'}
          </UiButton>
          <UiButton type="button" variant="secondary" onClick={() => logout()}>
            Abmelden
          </UiButton>
          {authMode === 'supabase' || googleConfigured ? (
            <UiButton
              type="button"
              variant="ghost"
              onClick={() => {
                logout({ global: true })
              }}
            >
              Auf allen Geräten abmelden
            </UiButton>
          ) : null}
        </div>
        {authMode === 'legacy' ? (
          <p className={styles.hint}>
            Legacy-JWTs können ohne Session-Registry nicht global widerrufen werden — nur dieses Gerät wird abgemeldet.
          </p>
        ) : null}
        {lifecycleInfo ? <p className={styles.hint}>{lifecycleInfo}</p> : null}
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Account löschen</h2>
        <p className={styles.sectionLead}>
          Unwiderruflich: Profil, Sessions, Rewards, Observations, Scenes, Uploads, Login-Wege und Managed-Auth-User.
        </p>
        <UiButton type="button" variant="secondary" onClick={() => setDeleteOpen(true)}>
          Account löschen…
        </UiButton>
      </Card>

      <UiSheet
        open={deleteOpen}
        onClose={() => {
          if (!deleteBusy) setDeleteOpen(false)
        }}
        title="Account wirklich löschen?"
        meta="Diese Aktion kann nicht rückgängig gemacht werden. Tippe LÖSCHEN zur Bestätigung."
      >
        <label className={styles.field}>
          <span className={styles.label}>Bestätigung</span>
          <input
            className={styles.input}
            value={deleteConfirm}
            placeholder="LÖSCHEN"
            disabled={deleteBusy}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
        </label>
        {authMode === 'legacy' || account?.auth_providers?.includes('legacy_password') ? (
          <label className={styles.field}>
            <span className={styles.label}>Passwort</span>
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              disabled={deleteBusy}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </label>
        ) : null}
        {lifecycleError ? <p className={styles.error}>{lifecycleError}</p> : null}
        <UiSheetActions
          secondary={
            <UiButton type="button" variant="ghost" disabled={deleteBusy} onClick={() => setDeleteOpen(false)}>
              Abbrechen
            </UiButton>
          }
          primary={
            <UiButton
              type="button"
              disabled={deleteBusy || deleteConfirm.trim() !== 'LÖSCHEN'}
              onClick={async () => {
                setLifecycleError('')
                setDeleteBusy(true)
                try {
                  await api.deleteMyAccount({
                    confirm: deleteConfirm.trim(),
                    password: deletePassword || undefined,
                  })
                  setDeleteOpen(false)
                  logout({ global: true })
                } catch (e: any) {
                  setLifecycleError(e?.message || 'Löschen fehlgeschlagen')
                } finally {
                  setDeleteBusy(false)
                }
              }}
            >
              {deleteBusy ? 'Lösche…' : 'Endgültig löschen'}
            </UiButton>
          }
        />
      </UiSheet>

      <section className={styles.section}>
        <h2 className="ui-section-title">RINK ID</h2>
        <RinkIdentityCard
          profile={draft}
          stats={identityStats}
          coinIds={ownedCoinIds}
          hasAcademyPremium={hasAcademyPremium}
          premiumStatus={premiumStatusForProfile}
        />
      </section>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Progression & Achievements</h2>
        <p className={styles.sectionLead}>
          XP, Level und Freischaltungen entstehen aus echten Academy-Aktivitäten – nicht aus Dummy-Sessions.
        </p>
        <AccountProgressionPanel />
      </Card>

      <CompetencyRadar values={COMPETENCY_PREVIEW_VALUES} />

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Profil</h2>

        <label className={styles.field}>
          <span className={styles.label}>Anzeigename</span>
          <input
            className={styles.input}
            value={draft.displayName}
            maxLength={40}
            onChange={(e) => updateDraft({ displayName: e.target.value })}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Profilbild hochladen</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => handleAvatarUpload(e.target.files?.[0] || null)}
          />
          <p className={styles.hint}>JPEG, PNG, WebP oder GIF · max. 2 MB. Vorschau rund über CSS.</p>
          {uploadError && <p className={styles.error}>{uploadError}</p>}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Avatar</span>
          <p className={styles.hint}>Nur freigeschaltete Items. Weitere freischalten im <Link to="/locker">Spind</Link>.</p>
          <ProfileAssetSelector
            type="avatar"
            items={avatarItems}
            selectedId={selectedAvatarId || (draft.avatar?.type === 'upload' ? null : DEFAULT_AVATAR_ID)}
            onSelect={(id) => updateDraft({ avatar: { type: 'catalog', avatarId: id } })}
          />
        </div>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Hockey-Personalisierung</h2>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span className={styles.label}>Liga</span>
            <select
              className="appSelect"
              value={draft.favoriteLeague || ''}
              onChange={(e) => {
                const league = e.target.value || null
                updateDraft({
                  favoriteLeague: league,
                  favoriteTeamName: null,
                })
              }}
            >
              <option value="">Keine Auswahl</option>
              {LEAGUES.map((league) => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Lieblingsclub</span>
            <select
              className="appSelect"
              value={draft.favoriteTeamName || ''}
              disabled={!draft.favoriteLeague}
              onChange={(e) => updateDraft({ favoriteTeamName: e.target.value || null })}
            >
              <option value="">Kein Team</option>
              {favoriteTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span className={styles.label}>Jersey-Nummer</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={99}
              placeholder="00–99"
              value={draft.jerseyNumber ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  updateDraft({ jerseyNumber: null })
                  return
                }
                const next = Number(raw)
                if (!Number.isFinite(next)) return
                updateDraft({ jerseyNumber: Math.max(0, Math.min(99, Math.round(next))) })
              }}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Profil-Titel</span>
            <select
              className="appSelect"
              value={titleSelectValue}
              onChange={(e) => updateDraft({ profileTitle: e.target.value || null })}
            >
              {titleOptions.map((title) => (
                <option key={title.id} value={title.id}>
                  {(titleLabelCounts.get(title.label) || 0) > 1
                    ? `${title.label} · ${RARITY_LABELS[title.rarity]}`
                    : title.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Profil-Tagline</span>
          {taglineOptions.length > 0 && (
            <select
              className="appSelect"
              value={taglineOptions.find((item) => item.id === draft.profileTagline || item.label === draft.profileTagline)?.id || ''}
              onChange={(e) => {
                const selected = taglineOptions.find((item) => item.id === e.target.value)
                if (selected) updateDraft({ profileTagline: selected.id })
                else updateDraft({ profileTagline: null })
              }}
            >
              <option value="">Freie Tagline / keine Vorlage</option>
              {taglineOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          )}
          <input
            className={styles.input}
            maxLength={120}
            placeholder="Ich bringe mir gerade Hockey bei."
            value={taglineInputValue}
            onChange={(e) => updateDraft({ profileTagline: e.target.value })}
          />
          <span className={styles.hint}>{taglineInputValue.length}/120</span>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Banner</span>
          <ProfileAssetSelector
            type="banner"
            items={bannerItems}
            selectedId={draft.bannerId || DEFAULT_BANNER_ID}
            onSelect={(id) => updateDraft({ bannerId: id })}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Emblem</span>
          <ProfileAssetSelector
            type="emblem"
            items={emblemItems}
            selectedId={draft.emblem?.type === 'catalog' ? draft.emblem.emblemId : DEFAULT_EMBLEM_ID}
            onSelect={(id) => updateDraft({ emblem: { type: 'catalog', emblemId: id } })}
          />
          <p className={styles.hint}>
            Nur freigeschaltete Items — Rest im Spind. Custom-Embleme aus dem Formen-Editor sind vorbereitet, aber noch nicht im MVP.
          </p>
        </div>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Academy-Personalisierung</h2>
        <p className={styles.sectionLead}>
          Präferenzen werden gespeichert. Die Academy nutzt sie später, ohne bestehende Drills jetzt umzubauen.
        </p>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Wie viel Unterstützung möchtest du bei Drills?</legend>
          {([
            { value: 'discover', label: 'Entdecken', desc: 'Kurze Missionsbeschreibung, wenig zusätzliche Hinweise.' },
            { value: 'guided', label: 'Geführt', desc: 'Standard-Erklärung und Beobachtungsanleitung.' },
            { value: 'learning', label: 'Lernmodus', desc: 'Zusätzliche Definitionen, Erläuterungen und Beispiele.' },
          ] as Array<{ value: AcademyHelpLevel; label: string; desc: string }>).map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input
                type="radio"
                name="academyHelpLevel"
                checked={draft.academyHelpLevel === opt.value}
                onChange={() => updateDraft({ academyHelpLevel: opt.value })}
              />
              <span>
                <strong>{opt.label}</strong>
                <span className={styles.choiceDesc}>{opt.desc}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Fachbegriffe</legend>
          {([
            { value: 'direct', label: 'Begriffe direkt verwenden' },
            { value: 'explained', label: 'Begriffe kurz erklären' },
          ] as Array<{ value: TerminologyMode; label: string }>).map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input
                type="radio"
                name="terminologyMode"
                checked={draft.terminologyMode === opt.value}
                onChange={() => updateDraft({ terminologyMode: opt.value })}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Bevorzugte Rink-Ausrichtung</legend>
          <p className={styles.hint}>Nur als Präferenz gespeichert – ändert bestehende Drill-Sessions nicht automatisch.</p>
          {([
            { value: 'auto', label: 'Automatisch' },
            { value: 'right', label: 'Angriff nach rechts' },
            { value: 'left', label: 'Angriff nach links' },
          ] as Array<{ value: PreferredAttackDirection; label: string }>).map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input
                type="radio"
                name="preferredAttackDirection"
                checked={draft.preferredAttackDirection === opt.value}
                onChange={() => updateDraft({ preferredAttackDirection: opt.value })}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Hockey-Erfahrung</legend>
          <p className={styles.hint}>
            Steuert nur die Empfehlung für Track 0 (Hockey Basics). Keine Sperre für andere Tracks.
          </p>
          {([
            { value: 'beginner', label: 'Neu bei Hockey' },
            { value: 'familiar', label: 'Grundlagen bekannt' },
            { value: 'advanced', label: 'Taktisch erfahren' },
          ] as Array<{ value: HockeyExperienceLevel; label: string }>).map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input
                type="radio"
                name="hockeyExperience"
                checked={draft.hockeyExperience === opt.value}
                onChange={() => updateDraft({
                  hockeyExperience: opt.value,
                  experiencePromptDismissed: true,
                })}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Account-Status</h2>
        <div className={styles.statusGrid}>
          <div>
            <div className={styles.statusLabel}>Sessions abgeschlossen</div>
            <div className={styles.statusValue}>{identityStats.drillsCompleted}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>Szenen im Pool</div>
            <div className={styles.statusValue}>{identityStats.scenesCount}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>Top Track</div>
            <div className={styles.statusValue}>{identityStats.topTrack || '—'}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>Level</div>
            <div className={styles.statusValue}>{identityStats.level}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>XP</div>
            <div className={styles.statusValue}>{identityStats.xpLabel}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>PUX</div>
            <div className={styles.statusValue}>{identityStats.pux}</div>
          </div>
          <div>
            <div className={styles.statusLabel}>Aktiv seit</div>
            <div className={styles.statusValue}>{identityStats.memberSince || '—'}</div>
          </div>
        </div>
        <Link className={styles.statsLink} to="/progress">Alle Statistiken ansehen →</Link>
      </Card>

      <div className={styles.saveBar}>
        <UiButton type="button" onClick={handleSave} disabled={saveState === 'saving'}>
          {saveState === 'saving' ? 'Speichert …' : 'Änderungen speichern'}
        </UiButton>
        {saveState === 'saved' && <span className={styles.saveOk}>Gespeichert</span>}
        {saveState === 'error' && <span className={styles.error}>{saveError}</span>}
      </div>
    </div>
  )
}
