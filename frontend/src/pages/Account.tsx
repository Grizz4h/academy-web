import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import Card from '../components/Card'
import RinkIdentityCard from '../components/profile/RinkIdentityCard'
import ProfileAssetSelector from '../components/profile/ProfileAssetSelector'
import { useUser } from '../context/UserContext'
import { useRewards } from '../features/rewards'
import { avatarCatalog, DEFAULT_AVATAR_ID } from '../data/profile/avatarCatalog'
import { bannerCatalog, DEFAULT_BANNER_ID } from '../data/profile/bannerCatalog'
import { emblemCatalog, DEFAULT_EMBLEM_ID } from '../data/profile/emblemCatalog'
import { profileTitleCatalog, DEFAULT_PROFILE_TITLE_ID } from '../data/profile/profileTitleCatalog'
import { createDefaultProfile } from '../data/profile/defaults'
import type {
  AcademyHelpLevel,
  PreferredAttackDirection,
  TerminologyMode,
  UserProfileCustomization,
} from '../data/profile/types'
import { LEAGUES, teamsByLeague } from '../data/teamsByLeague'
import styles from './Account.module.css'

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
  const { user } = useUser()
  const { rewardState } = useRewards()

  const { data: account, isLoading, error, refetch } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  })

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
    const completed = sessions.filter((session) => session.state === 'COMPLETED').length
    return {
      drillsCompleted: completed,
      scenesCount: Array.isArray(scenesPayload?.scenes) ? scenesPayload.scenes.length : 0,
      topTrack: deriveTopTrack(sessions),
      memberSince: formatMemberSince(account?.createdAt),
      pux: Number(rewardState?.currency?.PUX || 0),
    }
  }, [sessions, scenesPayload, account?.createdAt, rewardState])

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
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.pageLead}>Bitte melde dich an, um dein RINK-Profil zu bearbeiten.</p>
      </div>
    )
  }

  if (isLoading || !draft) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.pageLead}>Profil wird geladen …</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.pageLead}>Profil konnte nicht geladen werden.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.pageLead}>
          Baue deine RINK ID und speichere persönliche Präferenzen. Keine zweite Stats-Seite – nur Profil und Identität.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>RINK ID</h2>
        <RinkIdentityCard profile={draft} stats={identityStats} />
      </section>

      <Card className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Profil</h2>

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
          <span className={styles.label}>Avatar aus Pool</span>
          <ProfileAssetSelector
            type="avatar"
            items={avatarCatalog}
            selectedId={selectedAvatarId || (draft.avatar?.type === 'upload' ? null : DEFAULT_AVATAR_ID)}
            onSelect={(id) => updateDraft({ avatar: { type: 'catalog', avatarId: id } })}
          />
        </div>
      </Card>

      <Card className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Hockey-Personalisierung</h2>

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
              value={draft.profileTitle || DEFAULT_PROFILE_TITLE_ID}
              onChange={(e) => updateDraft({ profileTitle: e.target.value || null })}
            >
              {profileTitleCatalog.map((title) => (
                <option key={title.id} value={title.id}>{title.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Profil-Tagline</span>
          <input
            className={styles.input}
            maxLength={120}
            placeholder="Ich bringe mir gerade Hockey bei."
            value={draft.profileTagline || ''}
            onChange={(e) => updateDraft({ profileTagline: e.target.value })}
          />
          <span className={styles.hint}>{(draft.profileTagline || '').length}/120</span>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Banner</span>
          <ProfileAssetSelector
            type="banner"
            items={bannerCatalog}
            selectedId={draft.bannerId || DEFAULT_BANNER_ID}
            onSelect={(id) => updateDraft({ bannerId: id })}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Emblem</span>
          <ProfileAssetSelector
            type="emblem"
            items={emblemCatalog}
            selectedId={draft.emblem?.type === 'catalog' ? draft.emblem.emblemId : DEFAULT_EMBLEM_ID}
            onSelect={(id) => updateDraft({ emblem: { type: 'catalog', emblemId: id } })}
          />
          <p className={styles.hint}>
            Custom-Embleme aus einem Formen-Editor sind vorbereitet, aber noch nicht im MVP freigeschaltet.
          </p>
        </div>
      </Card>

      <Card className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Academy-Personalisierung</h2>
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
      </Card>

      <Card className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Account-Status</h2>
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
        <button type="button" className={styles.saveButton} onClick={handleSave} disabled={saveState === 'saving'}>
          {saveState === 'saving' ? 'Speichert …' : 'Änderungen speichern'}
        </button>
        {saveState === 'saved' && <span className={styles.saveOk}>Gespeichert</span>}
        {saveState === 'error' && <span className={styles.error}>{saveError}</span>}
      </div>
    </div>
  )
}
