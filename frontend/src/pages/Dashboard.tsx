import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getRegistrationStatus } from "../api";
import { isSupabaseConfigured, signInWithGoogle } from "../lib/supabase";
import type { Session, Curriculum, Drill } from "../api";
import { useUser } from "../context/UserContext";
import Card from '../components/Card';
import { PageSkeleton } from '../components/Skeleton';
import { DrillPriorityCards } from '../components/dashboard/DrillPriorityCards';
import type { DrillWithCount } from '../components/dashboard/DrillPriorityCards';
import { CoverageMap } from '../components/dashboard/CoverageMap';
import { LearningRhythmWidget } from '../components/dashboard/LearningRhythmWidget';
import { LearningProgressTeaser } from '../components/dashboard/LearningProgressTeaser';
import type { ModuleCoverage } from '../components/dashboard/CoverageMap';
import { formatPux, useRewards } from '../features/rewards';
import { selectAchievementViews, selectLevelProgress } from '../features/progression';
import { lockerTaskHref } from '../features/progression/tasks';
import { computeObservedTeamStats } from '../stats/exposureStats';
import { buildWeeklyActivity } from '../stats/learningRhythm';
import { getActivePeriodsForScope } from '../utils/observationScope';
import { sessionExpectsPeriodMicrofeedback } from '../utils/sessionMicrofeedback';
import { getSessionRoute } from '../features/lab/sessionRouting';
import { getRealSessions } from '../utils/sessionEligibility';
import { UiActionRow, UiButton, UiButtonLink, UiProgress } from '../components/ui';
import { KpiRevealCard } from '../components/dashboard/KpiRevealCard';
import TodayMatchdaySlate from '../components/game/TodayMatchdaySlate';
import TodayChallenges from '../features/progression/challenges/TodayChallenges';
import { filterCatalogGamesForSeason, filterGamesForDate, localTodayIsoDate } from '../components/game/gameCatalogUtils';
import { inferSplitSeasonLabelForDate, normalizeSeasonValue } from '../stats/seasonNormalization';
import {
  getAcademyEntryModule,
  getFoundationModule,
  hasCompletedAnyFoundationDrill,
  isAcademyLocked,
  selectNextStepRecommendation,
  shouldPromptHockeyExperience,
} from '../features/foundation/recommendations';
import HockeyExperiencePrompt from '../features/foundation/HockeyExperiencePrompt';
import { selectTutorialEntryRecommendation } from '../features/tutorial/resolveEntry';
import { TUTORIAL_TARGET, useTutorialOptional } from '../features/tutorial';
import { useDevNavEnabled } from '../config/featureFlags';
import styles from './Dashboard.module.css';

const formatSessionState = (state: string): string => {
  const normalized = String(state || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'Abgeschlossen';
  if (normalized === 'ABORTED') return 'Abgebrochen';
  if (normalized === 'IN_PROGRESS') return 'In Bearbeitung';
  return state;
};

export default function Dashboard() {
  const { user, setUser, needsDisplayName } = useUser();
  const { rewardState } = useRewards();
  const tutorial = useTutorialOptional();
  const queryClient = useQueryClient();
  const devMode = useDevNavEnabled();

  const skipBasicsMutation = useMutation({
    mutationFn: () =>
      api.updateMyProfile({
        hockeyExperience: 'familiar',
        experiencePromptDismissed: true,
      } as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      tutorial?.dismiss()
    },
  })

  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  // Signup State
  const [signupMode, setSignupMode] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPassword2, setSignupPassword2] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [allowLegacySignup, setAllowLegacySignup] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleConfigured = isSupabaseConfigured();

  useEffect(() => {
    let cancelled = false
    getRegistrationStatus()
      .then((status) => {
        if (!cancelled) setAllowLegacySignup(Boolean(status.allow_legacy_signup))
      })
      .catch(() => {
        if (!cancelled) setAllowLegacySignup(false)
      })
    return () => {
      cancelled = true
    }
  }, [])
  
  // Scope State für modulbasierte Filterung
  const [currentScope, setCurrentScope] = useState<string>("Gesamt");
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const slateSeason = useMemo(
    () => normalizeSeasonValue(inferSplitSeasonLabelForDate(), 'DEL') || inferSplitSeasonLabelForDate(),
    [],
  );

  const { data: slateGamesData } = useQuery({
    queryKey: ['games', 'DEL', slateSeason, 'today-slate'],
    queryFn: () => api.getGames({ league: 'DEL', season: slateSeason }),
    enabled: Boolean(user && slateSeason),
    staleTime: 60_000,
  });

  const slateCatalogGames = useMemo(
    () => filterCatalogGamesForSeason(slateGamesData?.games || [], slateSeason),
    [slateGamesData?.games, slateSeason],
  );
  const todaySlateGames = useMemo(
    () => filterGamesForDate(slateCatalogGames, localTodayIsoDate()),
    [slateCatalogGames],
  );

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["sessions", user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user),
  });

  // Curriculum laden, um alle Drills zu kennen
  const { data: curriculum } = useQuery<Curriculum>({
    queryKey: ["curriculum"],
    queryFn: () => api.getCurriculum(),
    enabled: Boolean(user),
  });

  const { data: account } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  });

  const [experiencePromptOpen, setExperiencePromptOpen] = useState(false);

  useEffect(() => {
    if (!user || !account?.profile) return
    const completedCount = getRealSessions(sessions || []).filter(
      (s) => String(s.state || '').toUpperCase() === 'COMPLETED',
    ).length
    setExperiencePromptOpen(
      shouldPromptHockeyExperience(
        account.profile.hockeyExperience,
        account.profile.experiencePromptDismissed,
        { completedSessionCount: completedCount },
      ),
    )
  }, [user, account?.profile?.hockeyExperience, account?.profile?.experiencePromptDismissed, sessions]);

  useEffect(() => {
    if (user) {
      setNameInput("");
      setPasswordInput("");
      setLoginError("");
    }
  }, [user]);

  // Bei User-Wechsel Scope-Initialisierung zurücksetzen.
  useEffect(() => {
    setCurrentScope("Gesamt");
    setScopeInitialized(false);
  }, [user]);

  // Scope einmalig auf zuletzt verwendetes Modul setzen, sobald Daten geladen sind.
  const lastUsedModuleId = useMemo(() => {
    if (!curriculum || !sessions) return null
    const validModuleIds = new Set(
      curriculum.tracks.flatMap((track) =>
        track.modules.filter((module) => module.active !== false).map((module) => module.id),
      ),
    )
    return [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((s) => s.module_id)
      .find((moduleId) => moduleId && validModuleIds.has(moduleId)) || null
  }, [curriculum, sessions])

  useEffect(() => {
    if (!user || scopeInitialized || !curriculum || !sessions) return
    setCurrentScope(lastUsedModuleId ?? 'Gesamt')
    setScopeInitialized(true)
  }, [user, scopeInitialized, curriculum, sessions, lastUsedModuleId])

  // Until the one-shot init lands, prefer last-used module so Next Step / Recommended
  // do not briefly rank against the whole curriculum (e.g. show A1/C1 instead of B3).
  const activeScope =
    !scopeInitialized && currentScope === 'Gesamt' && lastUsedModuleId
      ? lastUsedModuleId
      : currentScope

  const handleLogin = async () => {
    const name = nameInput.trim();
    if (!name || !passwordInput) {
      setLoginError("Benutzername und Passwort erforderlich");
      return;
    }
    const result = await setUser(name, passwordInput);
    if (!result.ok) {
      setLoginError(result.error || "Anmeldung fehlgeschlagen");
      setPasswordInput("");
      return;
    }
  };

  // ✅ WICHTIG: useMemo läuft IMMER (auch wenn user null ist). Das verhindert React #310.
  const derived = useMemo(() => {
    const list = getRealSessions(sessions ?? []);
    const sessionsThisWeek = buildWeeklyActivity(list, { weeks: 1, weekStartsOn: 1 })[0]?.completedSessions ?? 0;

    // --- Drill-Fortschritt pro Track berechnen ---
    // Map: trackId -> { total: number, completed: number, title: string }
    let trackProgress: Record<string, { total: number; completed: number; title: string }> = {};
    if (curriculum) {
      for (const track of curriculum.tracks) {
        let total = 0;
        for (const module of track.modules) {
          if (module.active === false) continue;
          total += module.drills.length;
        }
        trackProgress[track.id] = { total, completed: 0, title: track.title };
      }
      // Completed Drills pro Track zählen
      const completedDrillIds = new Set<string>();
      for (const s of list) {
        if (s.state === "COMPLETED") {
          for (const d of s.drills || []) {
            completedDrillIds.add(d.id);
          }
        }
      }
      for (const track of curriculum.tracks) {
        let completed = 0;
        for (const module of track.modules) {
          if (module.active === false) continue;
          for (const drill of module.drills) {
            if (completedDrillIds.has(drill.id)) completed++;
          }
        }
        trackProgress[track.id].completed = completed;
      }
    }

    // Streak wie gehabt
    const streak = (() => {
      if (!list.length) return 0;
      let days = 0;
      let lastDay: string | null = null;
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      for (const s of sorted) {
        const d = new Date(s.created_at).toDateString();
        if (lastDay === null || d === lastDay) {
          lastDay = d;
          days++;
        } else if (new Date(lastDay).getTime() - new Date(d).getTime() === 86400000) {
          lastDay = d;
          days++;
        } else {
          break;
        }
      }
      return days;
    })();

    const lastSession =
      list.length
        ? [...list].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

    // --- Drill-Fortschritt berechnen ---
    // 1. Alle Drills aus Curriculum extrahieren
    let allDrills: Drill[] = [];
    if (curriculum) {
      allDrills = curriculum.tracks.flatMap((t) =>
        t.modules.filter((m) => m.active !== false).flatMap((m) => m.drills)
      );
    }
    // 2. Alle abgeschlossenen Drills aus allen Sessions
    const completedDrillIds = new Set<string>();
    for (const s of list) {
      if (s.state === "COMPLETED") {
        for (const d of s.drills || []) {
          completedDrillIds.add(d.id);
        }
      }
    }
    const totalDrills = allDrills.length;
    const completedDrills = Array.from(completedDrillIds).length;

    const completed = list.filter((s) => s.state === "COMPLETED").length;
    const aborted = list.filter((s) => s.state === "ABORTED").length;
    const inProgress = list.filter((s) => s.state === "IN_PROGRESS").length;

    // --- Drill-Counts für Priorisierung (mit Scope-Support) ---
    // Lookup Maps
    const drillById = new Map(allDrills.map((d) => [d.id, d]));
    const drillToModuleMap = new Map<string, string>();
    const drillNumberMap = new Map<string, number>();
    
    // Drill-zu-Modul-Zuordnung erstellen
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          if (module.active === false) continue;
          module.drills.forEach((drill, index) => {
            drillToModuleMap.set(drill.id, module.id);
            drillNumberMap.set(drill.id, index + 1);
          });
        }
      }
    }
    
    // Counts initialisieren (alle mit 0, damit nie trainierte Drills sichtbar sind)
    const drillCounts = new Map<string, number>();
    for (const d of allDrills) {
      drillCounts.set(d.id, 0);
    }
    
    // Nur COMPLETED Sessions zählen
    for (const s of list) {
      if (s.state !== "COMPLETED") continue;
      
      for (const d of s.drills || []) {
        drillCounts.set(d.id, (drillCounts.get(d.id) ?? 0) + 1);
      }
    }
    
    // In Array umwandeln (mit moduleId)
    const countsArray: DrillWithCount[] = Array.from(drillCounts.entries()).map(([id, count]) => ({
      id,
      title: drillById.get(id)?.title ?? id,
      drill_type: drillById.get(id)?.drill_type,
      count,
      moduleId: drillToModuleMap.get(id),
      drillNumber: drillNumberMap.get(id),
    }));
    
    // Available Scopes generieren
    const availableScopes = ["Gesamt"];
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          if (module.active === false) continue;
          availableScopes.push(module.id);
        }
      }
    }

    // Scope-basierte Filterung
    const scopedCountsArray = activeScope === "Gesamt" || activeScope === "Global"
      ? countsArray
      : countsArray.filter(d => d.moduleId === activeScope);
    
    // Recommended Next: lowest count first, then didactic drill order (1→5), then title
    const recommendedNext = [...scopedCountsArray]
      .sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count
        const aNum = a.drillNumber ?? Number.POSITIVE_INFINITY
        const bNum = b.drillNumber ?? Number.POSITIVE_INFINITY
        if (aNum !== bNum) return aNum - bNum
        return a.title.localeCompare(b.title)
      })
      .slice(0, 5);
    
    // Most Trained (höchste Counts zuerst, nur count > 0)
    const mostTrained = [...scopedCountsArray]
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, 3);
    
    // --- Coverage Map (global) ---
    const moduleCoverages: ModuleCoverage[] = [];
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          const totalDrills = module.drills.length;
          const completedDrills = module.drills.filter(
            d => (drillCounts.get(d.id) ?? 0) > 0
          ).length;
          
          moduleCoverages.push({
            moduleId: module.id,
            moduleTitle: module.title,
            totalDrills,
            completedDrills,
          });
        }
      }
    }

    // --- Drill-Aktivität für Heatmap aggregieren ---
    const drillAttempts: Array<{ 
      drillId: string; 
      drillName: string; 
      timestamp: string;
      moduleId?: string;
      trackTitle?: string;
      drillNumber?: number;
    }> = [];
    
    // Erstelle Map für schnelles Drill-Lookup mit Kontext
    const drillContextMap = new Map<string, { moduleId: string; trackTitle: string; drillNumber: number }>();
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          module.drills.forEach((drill, index) => {
            drillContextMap.set(drill.id, {
              moduleId: module.id,
              trackTitle: track.title,
              drillNumber: index + 1
            });
          });
        }
      }
    }
    
    for (const s of list) {
      // Nur abgeschlossene Sessions zählen für die Heatmap
      if (s.state === "COMPLETED") {
        for (const d of s.drills || []) {
          const context = drillContextMap.get(d.id);
          drillAttempts.push({
            drillId: d.id,
            drillName: d.title,
            timestamp: s.created_at,
            moduleId: context?.moduleId,
            trackTitle: context?.trackTitle,
            drillNumber: context?.drillNumber
          });
        }
      }
    }

    // Hygiene: Doppelte Phasen, fehlendes Microfeedback (korrektes Feld prüfen)
    const hygieneIssues: string[] = [];
    for (const s of list) {
      const phaseCounts: Record<string, number> = {};
      s.checkins?.forEach((c: any) => {
        phaseCounts[c.phase] = (phaseCounts[c.phase] || 0) + 1;
      });
      for (const [phase, count] of Object.entries(phaseCounts)) {
        if (count > 1) hygieneIssues.push(`Session ${s.id}: Phase ${phase} doppelt (${count}x)`);
      }

      // Nur abgeschlossene Sessions — laufende Sessions dürfen offenes Microfeedback haben.
      if (String(s.state || '').toUpperCase() !== 'COMPLETED') continue;

      const matchup = s.game_info?.team_home && s.game_info?.team_away
        ? `${s.game_info.team_home} vs ${s.game_info.team_away}`
        : s.id;

      // Scope-aware: Nur aktive Drittel mit Checkin auf Microfeedback prüfen.
      // Track 0 / LESSON sessions have no period microfeedback.
      if (!sessionExpectsPeriodMicrofeedback(s, curriculum)) continue;
      const checkedPhases = new Set(
        (s.checkins || [])
          .map((c: any) => String(c.phase || '').toUpperCase())
          .filter((phase: string) => phase === 'P1' || phase === 'P2' || phase === 'P3'),
      );
      getActivePeriodsForScope(s.observation_scope).forEach((phase) => {
        if (!checkedPhases.has(phase)) return;
        const mf = s.microfeedback?.[phase];
        if (!mf || !mf.done) {
          hygieneIssues.push(`${matchup}: Microfeedback fehlt in ${phase}`);
        }
      });
    }

    const recentSessions = list
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    const observedTeamStats = computeObservedTeamStats(list);
    const mostObservedTeams = [...observedTeamStats]
      .sort((a, b) => b.sessionCount - a.sessionCount || a.team.localeCompare(b.team))
      .slice(0, 5);
    const leastObservedTeams = [...observedTeamStats]
      .sort((a, b) => a.sessionCount - b.sessionCount || a.team.localeCompare(b.team))
      .slice(0, 5);

    return {
      total: list.length,
      sessionsThisWeek,
      streak,
      lastSession,
      completed,
      aborted,
      inProgress,
      hygieneIssues,
      recentSessions,
      totalDrills,
      completedDrills,
      trackProgress,
      drillAttempts,
      recommendedNext,
      mostTrained,
      availableScopes,
      moduleCoverages,
      mostObservedTeams,
      leastObservedTeams,
    };
  }, [sessions, curriculum, activeScope]);

  const resumeSession = useMemo(() => {
    return (sessions || [])
      .filter((s) => String(s.state || '').toUpperCase() === 'IN_PROGRESS')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }, [sessions]);

  const foundationRecommendation = useMemo(() => {
    const completed = new Set<string>()
    for (const s of getRealSessions(sessions || [])) {
      if (String(s.state || '').toUpperCase() !== 'COMPLETED') continue
      for (const d of s.drills || []) {
        if (d?.id) completed.add(d.id)
      }
      if (s.drill_id) completed.add(s.drill_id)
    }
    const args = {
      curriculum,
      completedDrillIds: completed,
      hockeyExperience: account?.profile?.hockeyExperience,
    }
    // New profiles have no hockeyExperience yet; without this the hero card
    // points at A1 (full game setup) while the tutorial leads to Track 0.
    return tutorial?.active
      ? selectTutorialEntryRecommendation(args)
      : selectNextStepRecommendation(args)
  }, [curriculum, sessions, account?.profile?.hockeyExperience, tutorial?.active]);

  // ---- Render Branches (ab hier dürfen returns kommen) ----
  if (!user)
    return (
      <div className={styles.dashboardPage}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Übersicht</h1>
          <p className="ui-page-lead">Melde dich an, um deinen Lernstand und die nächste Session zu sehen.</p>
        </header>
        <Card>
          <h2 className="ui-section-title">{signupMode ? "Account erstellen" : "Anmelden"}</h2>
          {!signupMode ? (
            <div className={styles.formColumn}>
              <input
                autoComplete="username"
                placeholder="Name"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setLoginError("");
                }}
                className={styles.input}
              />
              <div className={styles.inputWrapper}>
                <input
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPasswordBtn}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <UiActionRow>
                <UiButton type="button" onClick={handleLogin}>Anmelden</UiButton>
                {googleConfigured ? (
                  <UiButton
                    type="button"
                    onClick={async () => {
                      setLoginError('')
                      setGoogleBusy(true)
                      try {
                        const result = await signInWithGoogle()
                        if (result.error) setLoginError(result.error)
                      } finally {
                        setGoogleBusy(false)
                      }
                    }}
                    disabled={googleBusy}
                  >
                    {googleBusy ? 'Weiterleitung…' : 'Mit Google anmelden'}
                  </UiButton>
                ) : null}
              </UiActionRow>
              {allowLegacySignup ? (
                <UiButton type="button" variant="ghost" onClick={() => { setSignupMode(true); setSignupError(""); setSignupSuccess(""); }}>Account erstellen</UiButton>
              ) : null}
              {loginError && <span className={styles.errorMsg}>{loginError}</span>}
            </div>
          ) : allowLegacySignup ? (
            <div className={styles.formColumn}>
              <input
                autoComplete="username"
                placeholder="Name"
                value={signupName}
                onChange={(e) => {
                  setSignupName(e.target.value);
                  setSignupError("");
                  setSignupSuccess("");
                }}
                className={styles.input}
              />
              <input
                autoComplete="new-password"
                type="password"
                placeholder="Passwort"
                value={signupPassword}
                onChange={(e) => {
                  setSignupPassword(e.target.value);
                  setSignupError("");
                  setSignupSuccess("");
                }}
                className={styles.input}
              />
              <input
                autoComplete="new-password"
                type="password"
                placeholder="Passwort wiederholen"
                value={signupPassword2}
                onChange={(e) => {
                  setSignupPassword2(e.target.value);
                  setSignupError("");
                  setSignupSuccess("");
                }}
                className={styles.input}
              />
              <UiButton type="button" onClick={async () => { setSignupError(""); setSignupSuccess(""); const name = signupName.trim(); if (!name || !signupPassword || !signupPassword2) { setSignupError("Alle Felder erforderlich"); return; } if (signupPassword !== signupPassword2) { setSignupError("Passwörter stimmen nicht überein"); return; } try { await api.signup(name, signupPassword); setSignupSuccess("Account erstellt! Du wirst eingeloggt..."); setTimeout(async () => { await setUser(name, signupPassword); }, 800); } catch (e: any) { setSignupError(e.message || "Registrierung fehlgeschlagen"); } }}>Account erstellen</UiButton>
              <UiButton type="button" variant="secondary" onClick={() => { setSignupMode(false); setSignupError(""); setSignupSuccess(""); }}>Zurück zur Anmeldung</UiButton>
              {signupError && <span className={styles.errorMsg}>{signupError}</span>}
              {signupSuccess && <span className={styles.successMsg}>{signupSuccess}</span>}
            </div>
          ) : null}
        </Card>
      </div>
    );

  if (isLoading) return <PageSkeleton />;
  if (error) return <Card>Fehler beim Laden: {(error as Error).message}</Card>;

  const achievementViews = selectAchievementViews(rewardState);
  const nearAchievements = achievementViews
    .filter((item) => !item.unlocked && !item.secretHidden && item.ratio > 0)
    .sort((left, right) => right.ratio - left.ratio || right.current - left.current)
    .slice(0, 5);
  const recentUnlocked = achievementViews
    .filter((item) => item.unlocked && !item.secretHidden)
    .sort((left, right) => String(right.unlockedAt || '').localeCompare(String(left.unlockedAt || '')))
    .slice(0, 5);
  const levelProgress = selectLevelProgress(rewardState);
  const weekActivityDays = (() => {
    const list = getRealSessions(sessions ?? []);
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - diff);
    const days = new Set<string>();
    for (const session of list) {
      const created = new Date(session.created_at);
      if (created >= weekStart) {
        days.add(created.toDateString());
      }
    }
    return days.size;
  })();
  const nextDrill = derived.recommendedNext[0] as DrillWithCount | undefined;
  const showFoundationEntry =
    !resumeSession
    && foundationRecommendation?.kind === 'foundation_entry';
  const completedDrillIds = (() => {
    const completed = new Set<string>()
    for (const s of getRealSessions(sessions || [])) {
      if (String(s.state || '').toUpperCase() !== 'COMPLETED') continue
      for (const d of s.drills || []) {
        if (d?.id) completed.add(d.id)
      }
      if (s.drill_id) completed.add(s.drill_id)
    }
    return completed
  })()
  const foundationModule = getFoundationModule(curriculum)
  const academyEntry = getAcademyEntryModule(curriculum)
  const completedModuleIds = getRealSessions(sessions || [])
    .filter((session) => String(session.state || '').toUpperCase() === 'COMPLETED')
    .map((session) => String(session.module_id || ''))
    .filter(Boolean)
  const track0Done = hasCompletedAnyFoundationDrill(curriculum, completedDrillIds)
    || completedModuleIds.some((id) => id === 'T0' || id.startsWith('T0'))
  const hasUsedAcademy = getRealSessions(sessions || []).some((session) => {
    const moduleId = String(session.module_id || '')
    return moduleId && moduleId !== 'T0' && !moduleId.startsWith('T0')
  })
  const academyLocked = isAcademyLocked(curriculum, completedDrillIds, {
    devMode,
    hasUsedAcademy,
    completedModuleIds,
    hockeyExperience: account?.profile?.hockeyExperience,
  })
  const showBasicsStep = Boolean(
    !resumeSession
    && !track0Done
    && foundationModule
    && (showFoundationEntry || academyLocked),
  )
  const canSkipBasics = showBasicsStep
  const continueModuleMeta = (() => {
    if (!curriculum || !nextDrill?.moduleId) return null
    for (const track of curriculum.tracks) {
      const mod = track.modules.find((m) => m.id === nextDrill.moduleId && m.active !== false)
      if (!mod) continue
      return {
        trackId: track.id,
        moduleId: mod.id,
        title: mod.title,
        subtitle: mod.summary || track.goal || '',
      }
    }
    return null
  })()
  // Fresh academy start only when the learner has not trained A1+ yet.
  // Otherwise continue from the scoped next drill (e.g. B3), not A1.
  const showAcademyEntryCta = Boolean(
    !showBasicsStep
    && !hasUsedAcademy
    && academyEntry
    && !academyLocked,
  )
  const showContinueCta = Boolean(
    !showBasicsStep
    && !showAcademyEntryCta
    && nextDrill?.moduleId
    && !academyLocked,
  )
  const foundationSetupHref = foundationRecommendation?.kind === 'foundation_entry'
    ? `/setup/${foundationRecommendation.moduleId}?drill=${encodeURIComponent(foundationRecommendation.drillId)}`
    : foundationModule?.id
      ? `/setup/${foundationModule.id}`
      : '/curriculum'
  const academySetupHref = academyEntry
    ? `/setup/${academyEntry.moduleId}`
    : '/curriculum'
  const continueSetupHref = nextDrill?.moduleId
    ? `/setup/${nextDrill.moduleId}?drill=${encodeURIComponent(nextDrill.id)}`
    : '/curriculum'
  const nextStepTitle = resumeSession ? 'Weiter geht’s' : 'Nächster Schritt'
  const nextStepLead = resumeSession
    ? `Aktive Session offen${derived.streak > 0 ? ` · Streak ${derived.streak}` : ''}. Mach weiter, bevor der Faden reißt.`
    : showBasicsStep
      ? (
        foundationRecommendation?.kind === 'foundation_entry'
          ? (foundationRecommendation.subtitle || 'Hockey Basics — Spielfeld, Regeln, Rollen und Begriffe.')
          : 'Zuerst Track 0 — oder Basics überspringen, wenn du Hockey schon kennst.'
      )
      : showContinueCta && continueModuleMeta
        ? (continueModuleMeta.subtitle || `${continueModuleMeta.moduleId} · ${nextDrill?.title || 'Weiter trainieren.'}`)
        : showAcademyEntryCta && academyEntry
          ? (academyEntry.subtitle || 'Weiter in der Akademie beobachten und trainieren.')
          : nextDrill
            ? `${nextDrill.moduleId} · ${nextDrill.title}`
            : 'Wähle in der Akademie den nächsten Track.'
  const nextStepFocus = resumeSession
    ? null
    : showBasicsStep
      ? (
        foundationRecommendation?.kind === 'foundation_entry'
          ? foundationRecommendation.title
          : (foundationModule?.title || 'Hockey Basics')
      )
      : showContinueCta && continueModuleMeta
        ? `${continueModuleMeta.moduleId} · ${nextDrill?.title || continueModuleMeta.title}`
        : showAcademyEntryCta && academyEntry
          ? academyEntry.title
          : nextDrill
            ? nextDrill.title
            : null
  const drillProgressPct = derived.totalDrills
    ? Math.round((derived.completedDrills / derived.totalDrills) * 100)
    : 0;
  const TRACK_PREVIEW = 3;
  const trackProgressList = Object.values(derived.trackProgress)
    .map((track) => {
      const total = track.total || 0;
      const completed = track.completed || 0;
      const pct = total ? completed / total : 0;
      return { ...track, pct };
    })
    .sort((a, b) => a.pct - b.pct || String(a.title).localeCompare(String(b.title), 'de'));
  const visibleTracks = showAllTracks ? trackProgressList : trackProgressList.slice(0, TRACK_PREVIEW);
  const hiddenTrackCount = Math.max(0, trackProgressList.length - TRACK_PREVIEW);

  return (
    <div className={`${styles.dashboardPage} ui-page-shell`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Übersicht</h1>
        <p className="ui-page-lead">Stand und nächster Schritt.</p>
      </header>

      {todaySlateGames.length > 0 ? (
        <Card surface="primary" className={styles.todaySlateCard}>
          <TodayMatchdaySlate
            league="DEL"
            games={slateCatalogGames}
            hint="Spielplan aus dem DEL-Import. In der Session-Vorbereitung kannst du eine Paarung antippen und Teams + Spieltag übernehmen."
          />
        </Card>
      ) : null}

      {user ? <TodayChallenges games={slateCatalogGames} /> : null}

      <div data-tutorial-id={TUTORIAL_TARGET.homeNextStep}>
      <Card className={styles.nextStepCard} elevation="featured" surface="primary">
        <div className={styles.nextStepCopy}>
          <h2 className={styles.nextStepTitle}>{nextStepTitle}</h2>
          <p className={styles.nextStepText}>{nextStepLead}</p>
          {nextStepFocus && (
            <p className={styles.nextStepDrillName}>{nextStepFocus}</p>
          )}
          {derived.lastSession && !resumeSession && !showBasicsStep && (
            <p className={styles.nextStepMeta}>
              Letzte Session: {new Date(derived.lastSession.created_at).toLocaleDateString('de-DE')}
              {' · '}
              {derived.lastSession.module_id}
              {' · '}
              {formatSessionState(derived.lastSession.state)}
            </p>
          )}
          {resumeSession && (
            <p className={styles.nextStepMeta}>
              {resumeSession.module_id}
              {resumeSession.game_info?.team_home && resumeSession.game_info?.team_away
                ? ` · ${resumeSession.game_info.team_home} vs ${resumeSession.game_info.team_away}`
                : ''}
            </p>
          )}
        </div>
        <div className={styles.nextStepActions}>
          {resumeSession ? (
            <UiActionRow>
              <UiButtonLink to={getSessionRoute(resumeSession)}>
                Session fortsetzen
              </UiButtonLink>
              <UiButtonLink to="/curriculum" variant="secondary">
                Zur Akademie
              </UiButtonLink>
            </UiActionRow>
          ) : showBasicsStep ? (
            <UiActionRow>
              <UiButtonLink to={foundationSetupHref} data-tutorial-id={TUTORIAL_TARGET.homeStartT0}>
                Track 0 starten
              </UiButtonLink>
              {canSkipBasics ? (
                <UiButton
                  type="button"
                  variant="secondary"
                  disabled={skipBasicsMutation.isPending}
                  onClick={() => skipBasicsMutation.mutate()}
                >
                  {skipBasicsMutation.isPending ? '…' : 'Basics überspringen'}
                </UiButton>
              ) : null}
            </UiActionRow>
          ) : (
            <UiActionRow>
              {showContinueCta && nextDrill?.moduleId ? (
                <UiButtonLink
                  to={continueSetupHref}
                  data-tutorial-id={TUTORIAL_TARGET.homeStartA1}
                >
                  {continueModuleMeta?.moduleId
                    ? `${continueModuleMeta.moduleId} starten`
                    : 'Session starten'}
                </UiButtonLink>
              ) : showAcademyEntryCta && academyEntry ? (
                <UiButtonLink
                  to={academySetupHref}
                  data-tutorial-id={TUTORIAL_TARGET.homeStartA1}
                >
                  {academyEntry.moduleId === 'A1' || academyEntry.trackId === 'A'
                    ? 'Track A1 starten'
                    : `${academyEntry.moduleId} starten`}
                </UiButtonLink>
              ) : nextDrill?.moduleId ? (
                <UiButtonLink to={continueSetupHref}>
                  Session starten
                </UiButtonLink>
              ) : (
                <UiButtonLink to="/curriculum">Zur Akademie</UiButtonLink>
              )}
              {foundationModule?.id && !track0Done ? (
                <UiButtonLink
                  to={foundationSetupHref}
                  variant="secondary"
                  data-tutorial-id={TUTORIAL_TARGET.homeStartT0}
                >
                  Track 0 optional
                </UiButtonLink>
              ) : (
                <UiButtonLink to="/curriculum" variant="secondary">
                  Lehrplan
                </UiButtonLink>
              )}
            </UiActionRow>
          )}
          {skipBasicsMutation.isError && (
            <p className={styles.nextStepMeta} style={{ color: '#f87171', margin: '0.35rem 0 0' }}>
              Überspringen fehlgeschlagen. Bitte erneut versuchen.
            </p>
          )}
        </div>
      </Card>
      </div>

      <div className={styles.kpiGrid}>
        <KpiRevealCard
          title="Streak"
          value={derived.streak}
          hint="Tage in Folge"
          panelTitle="Lern-Streak"
          panel={
            <>
              <p>
                Zählt aufeinanderfolgende Kalendertage mit mindestens einer Session — rückwärts ab heute.
              </p>
              <div className="ui-tap-reveal-stat">
                <span>Aktuell</span>
                <strong>{derived.streak} Tage</strong>
              </div>
              {derived.lastSession && (
                <div className="ui-tap-reveal-stat">
                  <span>Letzte Session</span>
                  <strong>{new Date(derived.lastSession.created_at).toLocaleDateString('de-DE')}</strong>
                </div>
              )}
              <UiActionRow>
                <UiButtonLink to="/history" size="sm">
                  Session-Verlauf
                </UiButtonLink>
              </UiActionRow>
            </>
          }
        />
        <KpiRevealCard
          title="Diese Woche"
          value={derived.sessionsThisWeek}
          hint="Sessions"
          panelTitle="Wochenrhythmus"
          panel={
            <>
              <p>Abgeschlossene Sessions in der laufenden Kalenderwoche (Mo–So).</p>
              <div className="ui-tap-reveal-stat">
                <span>Sessions</span>
                <strong>{derived.sessionsThisWeek}</strong>
              </div>
              <div className="ui-tap-reveal-stat">
                <span>Aktive Tage</span>
                <strong>{weekActivityDays}</strong>
              </div>
              <UiActionRow>
                <UiButtonLink to="/history" size="sm">
                  Verlauf ansehen
                </UiButtonLink>
              </UiActionRow>
            </>
          }
        />
        <KpiRevealCard
          title="Sessions gesamt"
          value={derived.total}
          hint={`${derived.completed} abgeschlossen`}
          panelTitle="Session-Übersicht"
          align="right"
          panel={
            <>
              <p>Alle echten Academy-Sessions — ohne Dev/Dummy-Einträge.</p>
              <div className="ui-tap-reveal-stat">
                <span>Abgeschlossen</span>
                <strong>{derived.completed}</strong>
              </div>
              <div className="ui-tap-reveal-stat">
                <span>In Bearbeitung</span>
                <strong>{derived.inProgress}</strong>
              </div>
              <div className="ui-tap-reveal-stat">
                <span>Abgebrochen</span>
                <strong>{derived.aborted}</strong>
              </div>
              <UiActionRow>
                <UiButtonLink to="/history" size="sm">
                  Alle Sessions
                </UiButtonLink>
              </UiActionRow>
            </>
          }
        />
        <KpiRevealCard
          title="Level"
          value={levelProgress.level}
          hint={`${levelProgress.xpIntoLevel.toLocaleString('de-DE')} / ${levelProgress.xpForNextLevel.toLocaleString('de-DE')} XP`}
          panelTitle={`Level ${levelProgress.level}`}
          align="right"
          panel={
            <>
              <p>XP sammelst du durch Sessions, Achievements und Meisterschaften.</p>
              <UiProgress
                value={levelProgress.xpIntoLevel}
                max={levelProgress.xpForNextLevel || 1}
                label="XP bis zum nächsten Level"
              />
              <div className="ui-tap-reveal-stat">
                <span>Gesamt-XP</span>
                <strong>{levelProgress.totalXp.toLocaleString('de-DE')}</strong>
              </div>
              <UiActionRow>
                <UiButtonLink to="/progress" size="sm">
                  Belohnungen
                </UiButtonLink>
                <UiButtonLink to="/account" size="sm">
                  Profil
                </UiButtonLink>
              </UiActionRow>
            </>
          }
        />
      </div>

      <HockeyExperiencePrompt
        open={experiencePromptOpen && !tutorial?.isSurfaceOpen && !needsDisplayName}
        onDone={() => setExperiencePromptOpen(false)}
      />

      <DrillPriorityCards
        recommendedNext={derived.recommendedNext}
        mostTrained={derived.mostTrained}
        availableScopes={derived.availableScopes}
        currentScope={activeScope}
        onScopeChange={(scope) => {
          setCurrentScope(scope)
          setScopeInitialized(true)
        }}
      />

      <Card surface="section">
        <LearningRhythmWidget
          sessions={getRealSessions(sessions ?? [])}
          weeks={8}
          showAverage
          showStatus
          compact
        />
      </Card>

      <LearningProgressTeaser
        trackProgress={derived.trackProgress}
        attempts={derived.drillAttempts}
      />

      <Card surface="section" className={styles.recentCard}>
        <h2 className="ui-section-title">Zuletzt</h2>
        {derived.recentSessions.length === 0 ? (
          <p className={styles.emptyState}>
            Noch keine Sessions vorhanden. Starte in der Akademie mit dem ersten Modul.
          </p>
        ) : (
          <ul className={styles.recentList}>
            {derived.recentSessions.map((s: Session) => (
              <li key={s.id} className={styles.recentItem}>
                <span className={styles.recentDate}>{new Date(s.created_at).toLocaleDateString('de-DE')}</span>
                <span className={styles.recentModule}>{s.module_id}</span>
                <span className={styles.statusBadge}>{formatSessionState(s.state)}</span>
                <UiButtonLink to={getSessionRoute(s)} size="sm" variant="secondary" className={styles.openBtn}>
                  Öffnen
                </UiButtonLink>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <details className={styles.morePanel}>
        <summary className={styles.moreSummary}>
          <span>Fortschritt & Session-Qualität</span>
          <span className={styles.moreChevron} aria-hidden="true" />
        </summary>
        <div className={styles.moreBody}>
          <div className={styles.flexWrapRow}>
            <Card surface="nested" className={styles.flexCard}>
              <h2 className="ui-section-title">Fortschritt</h2>
              <div className={styles.progressRow}>
                <div className={styles.progressCol}>
                  <div className={styles.progressItem}>Abgeschlossen: <strong>{derived.completed}</strong></div>
                  <div className={styles.progressItem}>Abgebrochen: <strong>{derived.aborted}</strong></div>
                  <div className={styles.progressItem}>In Bearbeitung: <strong>{derived.inProgress}</strong></div>

                  <div className={styles.progressBarWrap}>
                    <UiProgress value={drillProgressPct} label="Drill-Fortschritt" size="lg" />
                    <div className={styles.progressBarLabel}>Drill-Fortschritt: {drillProgressPct}%</div>
                    <div className={styles.trackProgressWrap}>
                      <div className={styles.trackProgressTitle}>Pro Track</div>
                      {visibleTracks.map((track) => (
                        <div key={track.title} className={styles.trackProgressItem}>
                          <span className={styles.trackTitle}>{track.title}</span>
                          <UiProgress
                            value={track.completed}
                            max={track.total || 1}
                            label={`${track.title} Fortschritt`}
                          />
                          <span className={styles.trackBarLabel}>
                            {track.total ? Math.round((track.completed / track.total) * 100) : 0}% ({track.completed}/{track.total})
                          </span>
                        </div>
                      ))}
                      {hiddenTrackCount > 0 && (
                        <UiButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={styles.trackMoreBtn}
                          onClick={() => setShowAllTracks((value) => !value)}
                        >
                          {showAllTracks ? 'Weniger anzeigen' : `${hiddenTrackCount} weitere Tracks`}
                        </UiButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card surface="nested" className={styles.flexCard}>
              <h2 className="ui-section-title">Session-Qualität</h2>
              {derived.hygieneIssues.length === 0 ? (
                <div className={styles.integrityStatus}>
                  <div className={styles.statusIndicator} data-status="clean" />
                  <span className={styles.statusText}>Alle Sessions sauber</span>
                </div>
              ) : (
                <ul className={styles.hygieneList}>
                  {derived.hygieneIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </details>

      <details className={styles.morePanel}>
        <summary className={styles.moreSummary}>
          <span>Belohnungen</span>
          <span className={styles.moreChevron} aria-hidden="true" />
        </summary>
        <div className={styles.moreBody}>
          <Card surface="section">
            <div className={styles.rewardHeaderRow}>
              <div className={styles.rewardHeaderItem}>
                <strong>Level {levelProgress.level}</strong>
                {' · '}
                {levelProgress.xpIntoLevel.toLocaleString('de-DE')} / {levelProgress.xpForNextLevel.toLocaleString('de-DE')} XP
              </div>
              <div className={styles.rewardHeaderItem}><strong>PUX!:</strong> {formatPux(rewardState.currency.PUX || 0)}</div>
              <div className={styles.rewardHeaderItem}><strong>Freigeschaltet:</strong> {Object.keys(rewardState.unlockedAchievements || {}).length}</div>
            </div>

            <div className={styles.rewardColumns}>
              <div>
                <h3 className={styles.rewardColumnTitle}>Nah dran</h3>
                {nearAchievements.length === 0 ? (
                  <div className={styles.rewardHint}>Noch keine klaren Kandidaten.</div>
                ) : (
                  <ul className={styles.rewardList}>
                    {nearAchievements.map((item) => (
                      <li key={item.definition.id}>
                        <Link
                          className={styles.rewardListItem}
                          to={lockerTaskHref({ sourceId: item.definition.id, lane: 'permanent' })}
                        >
                          <div>
                            <div className={styles.rewardName}>{item.definition.name}</div>
                            <div className={styles.rewardMeta}>{item.current} / {item.target}</div>
                          </div>
                          <span className={styles.rewardProgress}>{Math.round(item.ratio * 100)}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className={styles.rewardColumnTitle}>Zuletzt erreicht</h3>
                {recentUnlocked.length === 0 ? (
                  <div className={styles.rewardHint}>Noch keine Erfolge erreicht.</div>
                ) : (
                  <ul className={styles.rewardList}>
                    {recentUnlocked.map((item) => (
                      <li key={item.definition.id}>
                        <Link
                          className={styles.rewardListItem}
                          to={lockerTaskHref({ sourceId: item.definition.id, lane: 'permanent' })}
                        >
                          <div>
                            <div className={styles.rewardName}>{item.definition.name}</div>
                            <div className={styles.rewardMeta}>
                              {item.unlockedAt ? new Date(item.unlockedAt).toLocaleString('de-DE') : 'Freigeschaltet'}
                            </div>
                          </div>
                          <span className={styles.rewardTag}>Freigeschaltet</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      </details>

      <details className={styles.morePanel}>
        <summary className={styles.moreSummary}>
          <span>Teams & Modul-Abdeckung</span>
          <span className={styles.moreChevron} aria-hidden="true" />
        </summary>
        <div className={styles.moreBody}>
          <Card surface="section">
            <h2 className="ui-section-title">Meist beobachtete Teams</h2>
            {derived.mostObservedTeams.length === 0 ? (
              <div className={styles.rewardHint}>Noch keine Team-Beobachtungen vorhanden.</div>
            ) : (
              <div className={styles.teamExposureGrid}>
                <div>
                  <ol className={styles.teamExposureList}>
                    {derived.mostObservedTeams.map((team, index) => (
                      <li key={team.team} className={styles.teamExposureItem}>
                        <span>{index + 1}. {team.team}</span>
                        <strong>({team.sessionCount})</strong>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className={styles.rewardColumnTitle}>Wenigst beobachtete Teams</h3>
                  <ol className={styles.teamExposureList}>
                    {derived.leastObservedTeams.map((team, index) => (
                      <li key={team.team} className={styles.teamExposureItem}>
                        <span>{index + 1}. {team.team}</span>
                        <strong>({team.sessionCount})</strong>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </Card>

          <CoverageMap moduleCoverages={derived.moduleCoverages} />
        </div>
      </details>
    </div>
  );
}
