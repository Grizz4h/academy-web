import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Session, Curriculum, Drill } from "../api";
import { useUser } from "../context/UserContext";
import Card from '../components/Card';
import { DrillPriorityCards } from '../components/dashboard/DrillPriorityCards';
import type { DrillWithCount } from '../components/dashboard/DrillPriorityCards';
import { CoverageMap } from '../components/dashboard/CoverageMap';
import type { ModuleCoverage } from '../components/dashboard/CoverageMap';
import { formatPux, getRecentUnlockedAchievements, getTopNearAchievements, useRewards } from '../features/rewards';
import { computeObservedTeamStats } from '../stats/exposureStats';
import styles from './Dashboard.module.css';

const formatSessionState = (state: string): string =>
  state
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

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
  const [currentScope, setCurrentScope] = useState<string>("Global");
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
    setCurrentScope("Global");
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

    setCurrentScope(lastUsedModule ?? "Global");
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
      setLoginError(result.error || "Login fehlgeschlagen");
      setPasswordInput("");
      return;
    }
  };

  // ✅ WICHTIG: useMemo läuft IMMER (auch wenn user null ist). Das verhindert React #310.
  const derived = useMemo(() => {
    const list = sessions ?? [];
    const now = new Date();

    const sessionsThisWeek = list.filter((s) => {
      const d = new Date(s.created_at);
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return d >= weekAgo;
    });

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
    const availableScopes = ["Global"];
    if (curriculum) {
      for (const track of curriculum.tracks) {
        for (const module of track.modules) {
          availableScopes.push(module.id);
        }
      }
    }
    
    // Scope-basierte Filterung
    const scopedCountsArray = currentScope === "Global" 
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

      // Microfeedback: Prüfe s.microfeedback für P1/P2/P3
      ["P1", "P2", "P3"].forEach((phase) => {
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

  // ---- Render Branches (ab hier dürfen returns kommen) ----
  if (!user)
    return (
      <div className={styles.dashboardPage}>
        <h1>Dashboard</h1>
        <Card>
          <h2>{signupMode ? "Account erstellen" : "Login"}</h2>
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
              <button type="button" onClick={handleLogin} className={styles.primaryBtn}>Login</button>
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
              <button type="button" onClick={async () => { setSignupError(""); setSignupSuccess(""); const name = signupName.trim(); if (!name || !signupPassword || !signupPassword2) { setSignupError("Alle Felder erforderlich"); return; } if (signupPassword !== signupPassword2) { setSignupError("Passwörter stimmen nicht überein"); return; } try { await api.signup(name, signupPassword); setSignupSuccess("Account erstellt! Du wirst eingeloggt..."); setTimeout(async () => { await setUser(name, signupPassword); }, 800); } catch (e: any) { setSignupError(e.message || "Signup fehlgeschlagen"); } }} className={styles.primaryBtn}>Account erstellen</button>
              <button type="button" onClick={() => { setSignupMode(false); setSignupError(""); setSignupSuccess(""); }} className={styles.secondaryBtn}>Zurück zum Login</button>
              {signupError && <span className={styles.errorMsg}>{signupError}</span>}
              {signupSuccess && <span className={styles.successMsg}>{signupSuccess}</span>}
            </div>
          )}
        </Card>
      </div>
    );

  if (isLoading) return <Card>Lade Sessions...</Card>;
  if (error) return <Card>Fehler beim Laden: {(error as Error).message}</Card>;

  const nearAchievements = getTopNearAchievements(sessions || [], rewardState, 5);
  const recentUnlocked = getRecentUnlockedAchievements(rewardState, 5);

  return (
    <div className={styles.dashboardPage}>
      <h1>Dashboard</h1>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiTitle}>Letzte Session</div>
          {derived.lastSession ? (
            <>
              <div><strong>Datum:</strong> {new Date(derived.lastSession.created_at).toLocaleDateString()}</div>
              <div><strong>Modul:</strong> {derived.lastSession.module_id}</div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={styles.statusBadge}>{formatSessionState(derived.lastSession.state)}</span>
              </div>
            </>
          ) : <div>Keine Daten</div>}
        </Card>
        <Card>
          <div className={styles.kpiTitle}>Sessions gesamt</div>
          <div className={styles.kpiValue}>{derived.total}</div>
        </Card>
        <Card>
          <div className={styles.kpiTitle}>Diese Woche</div>
          <div className={styles.kpiValue}>{derived.sessionsThisWeek.length}</div>
        </Card>
        <Card>
          <div className={styles.kpiTitle}>Streak</div>
          <div className={styles.kpiValue}>{derived.streak} Tage</div>
        </Card>
      </div>

      {/* Progress & Hygiene */}
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
                  <div className={styles.progressBarFill} style={{ width: `${derived.totalDrills ? (derived.completedDrills / derived.totalDrills) * 100 : 0}%` }} />
                </div>
                <div className={styles.progressBarLabel}>Drill-Fortschritt: {derived.totalDrills ? Math.round((derived.completedDrills / derived.totalDrills) * 100) : 0}%</div>
                {/* Fortschritt pro Track */}
                <div className={styles.trackProgressWrap}>
                  <div className={styles.trackProgressTitle}>Prozentualer Drill-Fortschritt pro Track:</div>
                  {Object.values(derived.trackProgress).map((track: any) => (
                    <div key={track.title} className={styles.trackProgressItem}>
                      <span className={styles.trackTitle}>{track.title}:</span>
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
          <h2 className={styles.sectionTitle}>Session Integrity</h2>
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

      <Card>
        <h2 className={styles.sectionTitle}>Belohnungen</h2>
        <div className={styles.rewardHeaderRow}>
          <div className={styles.rewardHeaderItem}><strong>PUX!:</strong> {formatPux(rewardState.currency.PUX || 0)}</div>
          <div className={styles.rewardHeaderItem}><strong>Freigeschaltet:</strong> {Object.keys(rewardState.unlockedAchievements || {}).length}</div>
        </div>

        <div className={styles.rewardColumns}>
          <div>
            <h3 className={styles.rewardColumnTitle}>Top 5 nah dran</h3>
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
            <h3 className={styles.rewardColumnTitle}>Letzte 5 erreicht</h3>
            {recentUnlocked.length === 0 ? (
              <div className={styles.rewardHint}>Noch keine Achievements erreicht.</div>
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

      {/* Drill Priority Cards mit Scope */}
      <DrillPriorityCards
        recommendedNext={derived.recommendedNext}
        mostTrained={derived.mostTrained}
        availableScopes={derived.availableScopes}
        currentScope={currentScope}
        onScopeChange={setCurrentScope}
      />


      <Card>
        <h2 className={styles.sectionTitle}>Most Observed Teams</h2>
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
              <h3 className={styles.rewardColumnTitle}>Least Observed Teams</h3>
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

      {/* Coverage Map */}
      <CoverageMap moduleCoverages={derived.moduleCoverages} />

      {/* Recent Sessions */}
      <Card className={styles.recentCard}>
        <h2 className={styles.sectionTitle}>Zuletzt</h2>
        {derived.recentSessions.length === 0 ? (
          <div>Keine Sessions vorhanden.</div>
        ) : (
          <ul className={styles.recentList}>
            {derived.recentSessions.map((s: Session) => (
              <li key={s.id} className={styles.recentItem}>
                <span className={styles.recentDate}>{new Date(s.created_at).toLocaleDateString()}</span>
                <span className={styles.recentModule}>{s.module_id}</span>
                <span className={styles.statusBadge}>{formatSessionState(s.state)}</span>
                <a href={`/session/${s.id}`} className={styles.openBtn}>Öffnen</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}