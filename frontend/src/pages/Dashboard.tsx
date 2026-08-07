import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Session, Curriculum, Drill } from "../api";
import { useUser } from "../context/UserContext";
import Card from '../components/Card';
import { PageSkeleton } from '../components/Skeleton';
import { DrillPriorityCards } from '../components/dashboard/DrillPriorityCards';
import type { DrillWithCount } from '../components/dashboard/DrillPriorityCards';
import { CoverageMap } from '../components/dashboard/CoverageMap';
import { LearningRhythmWidget } from '../components/dashboard/LearningRhythmWidget';
import type { ModuleCoverage } from '../components/dashboard/CoverageMap';
import { formatPux, getRecentUnlockedAchievements, getTopNearAchievements, useRewards } from '../features/rewards';
import { computeObservedTeamStats } from '../stats/exposureStats';
import { buildWeeklyActivity } from '../stats/learningRhythm';
import { getActivePeriodsForScope } from '../utils/observationScope';
import { getSessionRoute } from '../features/lab/sessionRouting';
import styles from './Dashboard.module.css';

const formatSessionState = (state: string): string => {
  const normalized = String(state || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'Abgeschlossen';
  if (normalized === 'ABORTED') return 'Abgebrochen';
  if (normalized === 'IN_PROGRESS') return 'In Bearbeitung';
  return state;
};

export default function Dashboard() {
  const { user, setUser } = useUser();
  const { rewardState } = useRewards();

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
  
  // Scope State für modulbasierte Filterung
  const [currentScope, setCurrentScope] = useState<string>("Gesamt");
  const [scopeInitialized, setScopeInitialized] = useState(false);

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
  useEffect(() => {
    if (!user || scopeInitialized || !curriculum || !sessions) return;

    const validModuleIds = new Set(
      curriculum.tracks.flatMap((track) => track.modules.map((module) => module.id))
    );

    const lastUsedModule = [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((s) => s.module_id)
      .find((moduleId) => validModuleIds.has(moduleId));

    setCurrentScope(lastUsedModule ?? "Gesamt");
    setScopeInitialized(true);
  }, [user, scopeInitialized, curriculum, sessions]);

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
    const list = sessions ?? [];
    const sessionsThisWeek = buildWeeklyActivity(list, { weeks: 1, weekStartsOn: 1 })[0]?.completedSessions ?? 0;

    // --- Drill-Fortschritt pro Track berechnen ---
    // Map: trackId -> { total: number, completed: number, title: string }
    let trackProgress: Record<string, { total: number; completed: number; title: string }> = {};
    if (curriculum) {
      for (const track of curriculum.tracks) {
        let total = 0;
        for (const module of track.modules) {
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
      allDrills = curriculum.tracks.flatMap((t) => t.modules.flatMap((m) => m.drills));
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
    
    // Drill-zu-Modul-Zuordnung erstellen
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          for (const drill of module.drills) {
            drillToModuleMap.set(drill.id, module.id);
          }
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
    }));
    
    // Available Scopes generieren
    const availableScopes = ["Gesamt"];
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          availableScopes.push(module.id);
        }
      }
    }

    // Scope-basierte Filterung
    const scopedCountsArray = currentScope === "Gesamt" || currentScope === "Global"
      ? countsArray
      : countsArray.filter(d => d.moduleId === currentScope);
    
    // Recommended Next (niedrigste Counts zuerst, bei Gleichstand alphabetisch)
    const recommendedNext = [...scopedCountsArray]
      .sort((a, b) => a.count - b.count || a.title.localeCompare(b.title))
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

      // Scope-aware: Nur aktive Drittel der Session auf Microfeedback prüfen.
      getActivePeriodsForScope(s.observation_scope).forEach((phase) => {
        const mf = s.microfeedback?.[phase];
        if (!mf || !mf.done) {
          hygieneIssues.push(`Session ${s.id}: Microfeedback fehlt in ${phase}`);
        }
      });
    }

    const recentSessions = list
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

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
  }, [sessions, curriculum, currentScope]);

  const resumeSession = useMemo(() => {
    return (sessions || [])
      .filter((s) => String(s.state || '').toUpperCase() === 'IN_PROGRESS')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }, [sessions]);

  // ---- Render Branches (ab hier dürfen returns kommen) ----
  if (!user)
    return (
      <div className={styles.dashboardPage}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Übersicht</h1>
          <p className={styles.pageLead}>Melde dich an, um deinen Lernstand und die nächste Session zu sehen.</p>
        </header>
        <Card>
          <h2 className={styles.sectionTitle}>{signupMode ? "Account erstellen" : "Anmelden"}</h2>
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
              <button type="button" onClick={handleLogin} className={styles.primaryBtn}>Anmelden</button>
              <button type="button" onClick={() => { setSignupMode(true); setSignupError(""); setSignupSuccess(""); }} className={styles.secondaryBtn}>Account erstellen</button>
              {loginError && <span className={styles.errorMsg}>{loginError}</span>}
            </div>
          ) : (
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
              <button type="button" onClick={async () => { setSignupError(""); setSignupSuccess(""); const name = signupName.trim(); if (!name || !signupPassword || !signupPassword2) { setSignupError("Alle Felder erforderlich"); return; } if (signupPassword !== signupPassword2) { setSignupError("Passwörter stimmen nicht überein"); return; } try { await api.signup(name, signupPassword); setSignupSuccess("Account erstellt! Du wirst eingeloggt..."); setTimeout(async () => { await setUser(name, signupPassword); }, 800); } catch (e: any) { setSignupError(e.message || "Registrierung fehlgeschlagen"); } }} className={styles.primaryBtn}>Account erstellen</button>
              <button type="button" onClick={() => { setSignupMode(false); setSignupError(""); setSignupSuccess(""); }} className={styles.secondaryBtn}>Zurück zur Anmeldung</button>
              {signupError && <span className={styles.errorMsg}>{signupError}</span>}
              {signupSuccess && <span className={styles.successMsg}>{signupSuccess}</span>}
            </div>
          )}
        </Card>
      </div>
    );

  if (isLoading) return <PageSkeleton />;
  if (error) return <Card>Fehler beim Laden: {(error as Error).message}</Card>;

  const nearAchievements = getTopNearAchievements(sessions || [], rewardState, 5);
  const recentUnlocked = getRecentUnlockedAchievements(rewardState, 5);
  const nextDrill = derived.recommendedNext[0] as DrillWithCount | undefined;
  const nextDrillTitle = nextDrill
    ? (nextDrill.moduleId ? `${nextDrill.moduleId} · ${nextDrill.title}` : nextDrill.title)
    : null;
  const drillProgressPct = derived.totalDrills
    ? Math.round((derived.completedDrills / derived.totalDrills) * 100)
    : 0;

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Übersicht</h1>
        <p className={styles.pageLead}>
          Dein aktueller Stand auf einen Blick — und der nächste sinnvolle Schritt.
        </p>
      </header>

      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Streak</div>
          <div className={styles.kpiValue}>{derived.streak}</div>
          <div className={styles.kpiHint}>Tage in Folge</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Diese Woche</div>
          <div className={styles.kpiValue}>{derived.sessionsThisWeek}</div>
          <div className={styles.kpiHint}>Sessions</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Sessions gesamt</div>
          <div className={styles.kpiValue}>{derived.total}</div>
          <div className={styles.kpiHint}>{derived.completed} abgeschlossen</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Fortschritt</div>
          <div className={styles.kpiValue}>{drillProgressPct}%</div>
          <div className={styles.kpiHint}>{derived.completedDrills}/{derived.totalDrills} Drills</div>
        </Card>
      </div>

      <Card className={styles.nextStepCard}>
        <div className={styles.nextStepCopy}>
          <h2 className={styles.sectionTitle}>
            {resumeSession ? 'Weiter geht’s' : 'Nächster Schritt'}
          </h2>
          {resumeSession ? (
            <p className={styles.nextStepText}>
              Aktive Session offen
              {derived.streak > 0 ? ` · Streak ${derived.streak}` : ''}.
              {' '}Mach weiter, bevor der Faden reißt.
            </p>
          ) : nextDrillTitle ? (
            <p className={styles.nextStepText}>
              {derived.streak > 0 ? `Streak ${derived.streak} · ` : ''}
              Als Nächstes empfohlen: <strong>{nextDrillTitle}</strong>
            </p>
          ) : (
            <p className={styles.nextStepText}>
              Noch keine klare Empfehlung — starte einfach in der Akademie.
            </p>
          )}
          {derived.lastSession && !resumeSession && (
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
            <>
              <Link to={getSessionRoute(resumeSession)} className={styles.ctaBtn}>
                Session fortsetzen
              </Link>
              {nextDrill?.moduleId ? (
                <Link to={`/setup/${nextDrill.moduleId}`} className={styles.ctaSecondary}>
                  Neue Session
                </Link>
              ) : (
                <Link to="/curriculum" className={styles.ctaSecondary}>
                  Akademie öffnen
                </Link>
              )}
            </>
          ) : nextDrill?.moduleId ? (
            <>
              <Link to={`/setup/${nextDrill.moduleId}`} className={styles.ctaBtn}>
                Session starten
              </Link>
              <Link to="/curriculum" className={styles.ctaSecondary}>
                Akademie öffnen
              </Link>
            </>
          ) : (
            <Link to="/curriculum" className={styles.ctaBtn}>
              Zur Akademie
            </Link>
          )}
        </div>
      </Card>

      <DrillPriorityCards
        recommendedNext={derived.recommendedNext}
        mostTrained={derived.mostTrained}
        availableScopes={derived.availableScopes}
        currentScope={currentScope}
        onScopeChange={setCurrentScope}
      />

      <Card>
        <LearningRhythmWidget
          sessions={sessions ?? []}
          weeks={8}
          showAverage
          showStatus
          compact
        />
      </Card>

      <Card className={styles.recentCard}>
        <h2 className={styles.sectionTitle}>Zuletzt</h2>
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
                <Link to={getSessionRoute(s)} className={styles.openBtn}>Öffnen</Link>
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
            <Card className={styles.flexCard}>
              <h2 className={styles.sectionTitle}>Fortschritt</h2>
              <div className={styles.progressRow}>
                <div className={styles.progressCol}>
                  <div className={styles.progressItem}>Abgeschlossen: <strong>{derived.completed}</strong></div>
                  <div className={styles.progressItem}>Abgebrochen: <strong>{derived.aborted}</strong></div>
                  <div className={styles.progressItem}>In Bearbeitung: <strong>{derived.inProgress}</strong></div>

                  <div className={styles.progressBarWrap}>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${drillProgressPct}%` }} />
                    </div>
                    <div className={styles.progressBarLabel}>Drill-Fortschritt: {drillProgressPct}%</div>
                    <div className={styles.trackProgressWrap}>
                      <div className={styles.trackProgressTitle}>Pro Track</div>
                      {Object.values(derived.trackProgress).map((track: any) => (
                        <div key={track.title} className={styles.trackProgressItem}>
                          <span className={styles.trackTitle}>{track.title}</span>
                          <div className={styles.trackBarBg}>
                            <div className={styles.trackBarFill} style={{ width: `${track.total ? (track.completed / track.total) * 100 : 0}%` }} />
                          </div>
                          <span className={styles.trackBarLabel}>{track.total ? Math.round((track.completed / track.total) * 100) : 0}% ({track.completed}/{track.total})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className={styles.flexCard}>
              <h2 className={styles.sectionTitle}>Session-Qualität</h2>
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
          <Card>
            <div className={styles.rewardHeaderRow}>
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
                      <li key={item.achievement.id} className={styles.rewardListItem}>
                        <div>
                          <div className={styles.rewardName}>{item.achievement.title}</div>
                          <div className={styles.rewardMeta}>{item.label}</div>
                        </div>
                        <span className={styles.rewardProgress}>{Math.round(item.progress * 100)}%</span>
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
                      <li key={item.achievement.id} className={styles.rewardListItem}>
                        <div>
                          <div className={styles.rewardName}>{item.achievement.title}</div>
                          <div className={styles.rewardMeta}>{new Date(item.unlockedAt).toLocaleString('de-DE')}</div>
                        </div>
                        <span className={styles.rewardTag}>{item.achievement.category}</span>
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
          <Card>
            <h2 className={styles.sectionTitle}>Meist beobachtete Teams</h2>
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
