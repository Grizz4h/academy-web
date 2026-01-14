import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Session, Curriculum, Drill } from "../api";
import { useUser } from "../context/UserContext";

export default function Dashboard() {
  const { user, setUser } = useUser();

  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

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

  const handleLogin = () => {
    const name = nameInput.trim();
    if (!name || !passwordInput) {
      setLoginError("Benutzername und Passwort erforderlich");
      return;
    }
    const success = setUser(name, passwordInput);
    if (!success) {
      setLoginError("Ungültige Anmeldedaten");
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
    };
  }, [sessions, curriculum]);

  // ---- Render Branches (ab hier dürfen returns kommen) ----
  if (!user)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h1>Dashboard</h1>
        <div className="card">
          <h2>Login</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "300px" }}>
            <input
              autoComplete="username"
              placeholder="Name"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setLoginError("");
              }}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: loginError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.08)",
                color: "#f7f7ff",
              }}
            />
            <div style={{ position: "relative" }}>
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
                style={{
                  padding: "0.5rem 2.5rem 0.5rem 0.5rem",
                  borderRadius: "4px",
                  border: loginError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#f7f7ff",
                  width: "100%",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid #5191a2",
                background: "#5191a2",
                color: "#050712",
                cursor: "pointer",
              }}
            >
              Login
            </button>
            {loginError && <span style={{ fontSize: "0.9rem", color: "#ff6b6b" }}>{loginError}</span>}
          </div>
        </div>
      </div>
    );

  if (isLoading) return <div className="card">Lade Sessions...</div>;
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>;

  return (
    <div className="dashboard-page" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <h1>Dashboard</h1>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.2rem" }}>
          <div style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 4 }}>Letzte Session</div>
          {derived.lastSession ? (
            <>
              <div>
                <strong>Datum:</strong> {new Date(derived.lastSession.created_at).toLocaleDateString()}
              </div>
              <div>
                <strong>Modul:</strong> {derived.lastSession.module_id}
              </div>
              <div>
                <strong>Status:</strong> {derived.lastSession.state}
              </div>
            </>
          ) : (
            <div>Keine Daten</div>
          )}
        </div>

        <div className="card" style={{ padding: "1.2rem" }}>
          <div style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 4 }}>Sessions gesamt</div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{derived.total}</div>
        </div>

        <div className="card" style={{ padding: "1.2rem" }}>
          <div style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 4 }}>Diese Woche</div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{derived.sessionsThisWeek.length}</div>
        </div>

        <div className="card" style={{ padding: "1.2rem" }}>
          <div style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 4 }}>Streak</div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{derived.streak} Tage</div>
        </div>
      </div>

      {/* Progress & Hygiene */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 260, padding: "1.2rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 8 }}>Fortschritt</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6 }}>
                Abgeschlossen: <strong>{derived.completed}</strong>
              </div>
              <div style={{ marginBottom: 6 }}>
                Abgebrochen: <strong>{derived.aborted}</strong>
              </div>
              <div style={{ marginBottom: 6 }}>
                In Bearbeitung: <strong>{derived.inProgress}</strong>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ background: "#222", borderRadius: 6, height: 18, width: "100%", overflow: "hidden", marginBottom: 8 }}>
                  <div
                    style={{
                      background: "#5191a2",
                      height: "100%",
                      width: `${derived.totalDrills ? (derived.completedDrills / derived.totalDrills) * 100 : 0}%`,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: 8 }}>
                  Drill-Fortschritt: {derived.totalDrills ? Math.round((derived.completedDrills / derived.totalDrills) * 100) : 0}%
                </div>
                {/* Fortschritt pro Track */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Prozentualer Drill-Fortschritt pro Track:</div>
                  {Object.values(derived.trackProgress).map((track: any) => (
                    <div key={track.title} style={{ marginBottom: 6 }}>
                      <span style={{ color: '#5191a2', fontWeight: 500 }}>{track.title}:</span>
                      <div style={{ background: '#333', borderRadius: 4, height: 12, width: '100%', margin: '2px 0', overflow: 'hidden' }}>
                        <div style={{
                          background: '#6ec1e4',
                          height: '100%',
                          width: `${track.total ? (track.completed / track.total) * 100 : 0}%`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.9em', color: '#aaa' }}>{track.total ? Math.round((track.completed / track.total) * 100) : 0}% ({track.completed}/{track.total})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 260, padding: "1.2rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 8 }}>Hygiene</h2>
          {derived.hygieneIssues.length === 0 ? (
            <div style={{ color: "#28a745", fontWeight: 600 }}>✅ Alle Sessions sauber!</div>
          ) : (
            <ul style={{ color: "#ffc107", fontWeight: 600, fontSize: "0.95rem", margin: 0, paddingLeft: 18 }}>
              {derived.hygieneIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card" style={{ marginTop: "2rem", padding: "1.2rem" }}>
        <h2 style={{ fontSize: "1.1rem", color: "#5191a2", marginBottom: 8 }}>Zuletzt</h2>
        {derived.recentSessions.length === 0 ? (
          <div>Keine Sessions vorhanden.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {derived.recentSessions.map((s: Session) => (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  padding: "0.5rem 0",
                }}
              >
                <span style={{ minWidth: 90 }}>{new Date(s.created_at).toLocaleDateString()}</span>
                <span style={{ minWidth: 90 }}>{s.module_id}</span>
                <span style={{ minWidth: 90 }}>{s.state}</span>
                <a href={`/session/${s.id}`} className="btn" style={{ fontSize: "0.9rem", padding: "0.2rem 0.7rem" }}>
                  Öffnen
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}