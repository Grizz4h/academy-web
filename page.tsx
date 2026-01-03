// src/app/pux/replay/[season]/[matchday]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./replay.module.css";

type ReplayEvent = {
  i: number;
  t: number;
  action_id: number;
  step_in_action: number;
  team: "home" | "away";
  zone: "defensive" | "neutral" | "offensive" | string;
  type: "build_up" | "attack" | "goal" | string;
  result: "none" | "goal" | string;
  player_main: string | null;
  player_main_number: number | null;
  player_secondary: string | null;
  player_secondary_number: number | null;
  details: Record<string, unknown>;
};

type ReplayGame = {
  game_id: string;
  featured?: boolean;
  conference?: string;
  home: string;
  away: string;
  g_home: number;
  g_away: number;
};

type MatchdayReplay = {
  season: number;
  matchday: number;
  games: ReplayGame[];
};

type GameDetail = {
  season: number;
  matchday: number;
  game_id: string;
  conference?: string;
  home: { id: string; name: string; score: number };
  away: { id: string; name: string; score: number };
  events: ReplayEvent[];
};

type ReplayState = {
  currentActionId: number;
  stepInAction: number;
  homeScore: number;
  awayScore: number;
  finished: boolean;
};


export default function ReplayPage() {
  const params = useParams<{ season: string; matchday: string }>();

  const season = parseInt(String(params.season), 10);
  const matchday = parseInt(String(params.matchday), 10);

  const [matchdayData, setMatchdayData] = useState<MatchdayReplay | null>(null);
  const [games, setGames] = useState<GameDetail[]>([]);
  const [replayStates, setReplayStates] = useState<ReplayState[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slotHasJustFinishedAction, setSlotHasJustFinishedAction] =
    useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [allFinished, setAllFinished] = useState(false);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Matchday + Spiele laden
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const basePath = `/data/replays/saison_${String(season).padStart(
          2,
          "0"
        )}/spieltag_${String(matchday).padStart(2, "0")}`;

        const mdRes = await fetch(`${basePath}/replay_matchday.json`);
        if (!mdRes.ok) {
          throw new Error(`Matchday-JSON nicht gefunden (${mdRes.status})`);
        }
        const mdJson: MatchdayReplay = await mdRes.json();
        setMatchdayData(mdJson);

        const gamesSorted =
          mdJson.games.filter((g) => g.featured) || mdJson.games;
        const selected = gamesSorted.slice(0, 3);

        const detailPromises = selected.map(async (g) => {
          const fileName = `${g.game_id}.json`;
          const res = await fetch(`${basePath}/${encodeURIComponent(fileName)}`);
          if (!res.ok) {
            throw new Error(
              `Replay-File für ${g.game_id} nicht gefunden (${res.status})`
            );
          }
          const detail: GameDetail = await res.json();
          return detail;
        });

        const details = await Promise.all(detailPromises);
        setGames(details);
      } catch (e: unknown) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Unbekannter Fehler beim Laden."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [season, matchday]);

  // 2) Replay-States initialisieren, sobald Spiele da sind
  useEffect(() => {
    if (games.length === 0) return;

      const initialStates: ReplayState[] = games.map((g) => {
        const events = g.events ?? [];
        if (events.length === 0) {
          return {
            currentActionId: 0,
            stepInAction: 0,
            homeScore: 0,
            awayScore: 0,
            finished: true,
          };
        }
        const actionIds = Array.from(
          new Set(events.map((ev) => ev.action_id ?? 0))
        ).sort((a, b) => a - b);
        const firstActionId = actionIds[0] ?? 0;

        return {
          currentActionId: firstActionId,
          stepInAction: 0,
          homeScore: 0,
          awayScore: 0,
          finished: false,
        };
      });

      setReplayStates(initialStates);
      setActiveIndex(0);
      setSlotHasJustFinishedAction(false);
      setAllFinished(false);
      setIsRunning(false); // Page lädt → erstmal nur Standbild

  }, [games]);

      // 3) Tick: pro Tick EIN Schritt in der aktuellen Aktion des aktiven Slots
      useEffect(() => {
        if (!isRunning || allFinished) return;
        if (games.length === 0 || replayStates.length === 0) return;

        const TICK_MS = 2000; // Tempo

        const interval = setInterval(() => {
          setReplayStates((prevStates) => {
            if (prevStates.length === 0) return prevStates;

            const len = prevStates.length;

            // aktiven, noch nicht fertigen Slot finden
            let effectiveActive = -1;
            for (let k = 0; k < len; k++) {
              const candidate = (activeIndex + k) % len;
              if (!prevStates[candidate].finished) {
                effectiveActive = candidate;
                break;
              }
            }

            if (effectiveActive === -1) {
              // alles fertig
              setAllFinished(true);
              return prevStates;
            }

            const nextStates = [...prevStates];
            const game = games[effectiveActive];
            const state = nextStates[effectiveActive];

            const events = game.events ?? [];
            if (events.length === 0) {
              nextStates[effectiveActive] = { ...state, finished: true };
              return nextStates;
            }

            const actionIds = Array.from(
              new Set(events.map((ev) => ev.action_id ?? 0))
            ).sort((a, b) => a - b);

            if (actionIds.length === 0) {
              nextStates[effectiveActive] = { ...state, finished: true };
              return nextStates;
            }

            let { currentActionId } = state;
            if (!actionIds.includes(currentActionId)) {
              currentActionId = actionIds[0];
            }

            const actionEvents = events
              .filter((ev) => ev.action_id === currentActionId)
              .sort((a, b) => a.step_in_action - b.step_in_action);

            if (actionEvents.length === 0) {
              nextStates[effectiveActive] = { ...state, finished: true };
              return nextStates;
            }

            const maxStep = actionEvents.length - 1;
            const clampedStep = Math.min(state.stepInAction, maxStep);
            const ev = actionEvents[clampedStep];

            let homeScore = state.homeScore;
            let awayScore = state.awayScore;
            if (ev.type === "goal" && ev.result === "goal") {
              if (ev.team === "home") homeScore += 1;
              if (ev.team === "away") awayScore += 1;
            }

            let nextActionId = currentActionId;
            let nextStepInAction = clampedStep + 1;
            let finishedThisAction = false;
            let finishedThisGame = false;

            if (nextStepInAction > maxStep) {
              const idxInList = actionIds.indexOf(currentActionId);
              if (idxInList >= 0 && idxInList < actionIds.length - 1) {
                // -> nächste Aktion vorbereiten
                nextActionId = actionIds[idxInList + 1];
                nextStepInAction = 0;
                finishedThisAction = true;
              } else {
                // letzte Aktion -> Spiel fertig
                nextActionId = currentActionId;
                nextStepInAction = maxStep;
                finishedThisAction = true;
                finishedThisGame = true;
              }
            }

            nextStates[effectiveActive] = {
              ...state,
              currentActionId: nextActionId,
              stepInAction: nextStepInAction,
              homeScore,
              awayScore,
              finished: state.finished || finishedThisGame,
            };

            if (finishedThisAction) {
              setSlotHasJustFinishedAction(true);
            }

            const allDone = nextStates.every((s) => s.finished);
            if (allDone) {
              setAllFinished(true);
            }

            return nextStates;
          });
        }, TICK_MS);

        return () => clearInterval(interval);
      }, [games, replayStates.length, activeIndex, isRunning, allFinished]);


  // 4) Slot-Wechsel nach abgeschlossener Aktion
      useEffect(() => {
        if (!slotHasJustFinishedAction) return;
        setSlotHasJustFinishedAction(false);

        setActiveIndex((prev) => {
          if (games.length === 0) return 0;
          const len = games.length;

          // nächsten unfertigen Slot suchen
          for (let k = 1; k <= len; k++) {
            const candidate = (prev + k) % len;
            if (!replayStates[candidate]?.finished) {
              return candidate;
            }
          }
          // falls alle fertig, bleib wo du bist
          return prev;
        });
      }, [slotHasJustFinishedAction, games.length, replayStates]);


  if (loading) {
    return (
      <main className={styles.wrap}>
        <div className={styles.status}>Lade Replay…</div>
      </main>
    );
  }

  if (error || !matchdayData) {
    return (
      <main className={styles.wrap}>
        <div className={styles.statusError}>
          Fehler beim Laden: {error ?? "Keine Daten gefunden."}
        </div>
      </main>
    );
  }

  // aktuellen Event einer Kachel bestimmen (für Puck)
  function getCurrentEventForGame(
    game: GameDetail,
    state: ReplayState | undefined
  ): ReplayEvent | null {
    const events = game.events ?? [];
    if (!events.length || !state) return null;

    const actionEvents = events
      .filter((ev) => ev.action_id === state.currentActionId)
      .sort((a, b) => a.step_in_action - b.step_in_action);

    if (!actionEvents.length) return null;

    const maxStep = actionEvents.length - 1;
    const clampedStep = Math.min(state.stepInAction, maxStep);
    return actionEvents[clampedStep];
  }

  // sichtbare Event-Zeilen:
  // - aktive Kachel: aktueller ActionId, bis stepInAction (Aufbau)
  // - inaktive Kachel:
  //     * wenn schon mind. eine Aktion fertig: letzte KOMPLETTE Aktion
  //     * sonst: aktueller ActionId bis stepInAction
  function getVisibleEventsForGame(
    game: GameDetail,
    state: ReplayState | undefined,
    isActive: boolean
  ): ReplayEvent[] {
    const events = game.events ?? [];
    if (!events.length || !state) return [];

    const actionIds = Array.from(
      new Set(events.map((ev) => ev.action_id ?? 0))
    ).sort((a, b) => a - b);

    if (actionIds.length === 0) return [];

    if (isActive) {
      // normale Aufbau-Logik
      const actionEvents = events
        .filter((ev) => ev.action_id === state.currentActionId)
        .sort((a, b) => a.step_in_action - b.step_in_action);

      if (!actionEvents.length) return [];

      const maxStep = actionEvents.length - 1;
      const clampedStep = Math.min(state.stepInAction, maxStep);

      return actionEvents.filter((ev) => ev.step_in_action <= clampedStep);
    } else {
      // inaktive Kachel: letzte volle Aktion zeigen
      const idx = actionIds.indexOf(state.currentActionId);

      if (idx > 0) {
        const prevId = actionIds[idx - 1];
        const prevEvents = events
          .filter((ev) => ev.action_id === prevId)
          .sort((a, b) => a.step_in_action - b.step_in_action);
        return prevEvents;
      } else {
        // wir sind noch in der ersten Aktion → auch inaktiv nur bis aktuellen Step
        const actionEvents = events
          .filter((ev) => ev.action_id === state.currentActionId)
          .sort((a, b) => a.step_in_action - b.step_in_action);

        if (!actionEvents.length) return [];

        const maxStep = actionEvents.length - 1;
        const clampedStep = Math.min(state.stepInAction, maxStep);

        return actionEvents.filter((ev) => ev.step_in_action <= clampedStep);
      }
    }
  }
// Variationen für die Commentary-Sätze
const DEF_VARIANTS = [
  (team: string) => `${team} ordnet sich im eigenen Drittel`,
  (team: string) => `${team} sammelt sich hinten`,
  (team: string) => `${team} startet ruhig aus der Defensive`
];

const NEUTRAL_VARIANTS = [
  (team: string) => `${team} durch die neutrale Zone`,
  (team: string) => `${team} nimmt Geschwindigkeit auf`,
  (team: string) => `${team} steht gut im Übergangsbereich`
];

const OFF_VARIANTS = [
  (team: string, player?: string) =>
    player ? `${team} drückt in die Zone – ${player}` : `${team} drückt in die Zone`,
  (team: string, player?: string) =>
    player ? `${team} setzt sich vorne fest – ${player}` : `${team} setzt sich vorne fest`,
  (team: string, player?: string) =>
    player ? `${team} macht Druck – ${player}` : `${team} macht Druck`
];

function pickDeterministic<T>(arr: T[], seed: number): T {
  if (arr.length === 0) {
    throw new Error("pickDeterministic: empty array");
  }
  const index = Math.abs(seed) % arr.length;
  return arr[index];
}


function describeEvent(
  g: GameDetail,
  ev: ReplayEvent | null,
  showPlayer: boolean = false
): string {
  if (!ev) return "Keine Events";

  const teamName = ev.team === "home" ? g.home.name : g.away.name;
  const shooter = ev.player_main;
  const shooterNum = ev.player_main_number;
  const helper = ev.player_secondary;

  // shooterLabel sauber typisiert (string | undefined)
  let shooterLabel: string | undefined = undefined;
  if (shooter) {
    shooterLabel =
      shooterNum != null ? `${shooter} (#${shooterNum})` : shooter;
  }

  const helperLabel = helper ? `Assist: ${helper}` : "";

  // Tor bleibt fix, nicht randomisiert
  if (ev.type === "goal" && ev.result === "goal") {
    return shooterLabel
      ? `TOR ${teamName}! ${shooterLabel}${
          helperLabel ? " · " + helperLabel : ""
        }`
      : `TOR ${teamName}!`;
  }

  // Seed aus Aktion + Step → gleicher Event = gleicher Text
  const seed = (ev.action_id ?? 0) * 31 + ev.step_in_action;

  // DEFENSIV
  if (ev.type === "build_up" && ev.zone === "defensive") {
    return pickDeterministic(DEF_VARIANTS, seed)(teamName);
  }

  // NEUTRAL
  if (ev.type === "attack" && ev.zone === "neutral") {
    return pickDeterministic(NEUTRAL_VARIANTS, seed)(teamName);
  }

  // OFFENSIV
  if (ev.type === "attack" && ev.zone === "offensive") {
    return pickDeterministic(OFF_VARIANTS, seed)(
      teamName,
      showPlayer ? shooterLabel : undefined
    );
  }

  // Fallback
  return `${teamName} in Aktion (${ev.zone})`;
}





  function puckClassForEvent(
    _g: GameDetail,
    ev: ReplayEvent | null,
    isActive: boolean
  ): string {
    // Inaktive Kacheln: Puck immer neutral in der Mitte
    if (!isActive || !ev) {
      return `${styles.puck} ${styles.puckCenter}`;
    }

    const isHome = ev.team === "home";

    if (isHome) {
      if (ev.zone === "defensive") return `${styles.puck} ${styles.puckHomeDef}`;
      if (ev.zone === "offensive") return `${styles.puck} ${styles.puckHomeOff}`;
      return `${styles.puck} ${styles.puckHomeNeutral}`;
    } else {
      if (ev.zone === "defensive") return `${styles.puck} ${styles.puckAwayDef}`;
      if (ev.zone === "offensive") return `${styles.puck} ${styles.puckAwayOff}`;
      return `${styles.puck} ${styles.puckAwayNeutral}`;
    }
  }

  function isGoalEvent(ev: ReplayEvent | null): boolean {
    return !!ev && ev.type === "goal" && ev.result === "goal";
  }
  function handleStart() {
    if (allFinished) return;
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleReplay() {
    if (games.length === 0) return;

    const resetStates: ReplayState[] = games.map((g) => {
      const events = g.events ?? [];
      if (events.length === 0) {
        return {
          currentActionId: 0,
          stepInAction: 0,
          homeScore: 0,
          awayScore: 0,
          finished: true,
        };
      }
      const actionIds = Array.from(
        new Set(events.map((ev) => ev.action_id ?? 0))
      ).sort((a, b) => a - b);
      const firstActionId = actionIds[0] ?? 0;

      return {
        currentActionId: firstActionId,
        stepInAction: 0,
        homeScore: 0,
        awayScore: 0,
        finished: false,
      };
    });

    setReplayStates(resetStates);
    setActiveIndex(0);
    setSlotHasJustFinishedAction(false);
    setAllFinished(false);
    setIsRunning(false);
  }
  const finishedCount = replayStates.filter((s) => s.finished).length;
  const progress =
    games.length > 0 ? (finishedCount / games.length) * 100 : 0;

      // Scores aus der Simulation per game_id ablegen
  const scoreByGameId = new Map<string, { home: number; away: number }>();

  games.forEach((g, idx) => {
    const st = replayStates[idx];
    if (st) {
      scoreByGameId.set(g.game_id, {
        home: st.homeScore,
        away: st.awayScore,
      });
    }
  });


  return (
    <main className={styles.wrap}>
      {/* Header-Bereich */}
      <header className={styles.header}>
        <div className={styles.logo}>
        <Image
          src="/images/pux/pux-logo.png"   // Datei ins public/ legen, z.B. public/pux-logo.svg
          alt="PUX! Logo"
          fill
          className={styles.logoImage}
        />
      </div>
        <div className={styles.titleBlock}>
          <div className={styles.title}>
            SPIELTAG {matchdayData.matchday.toString().padStart(2, "0")}
          </div>
          
        </div>
      </header>
      <header className={styles.header}>
</header>

<section className={styles.controls}>
  <button
    className={styles.controlButton}
    onClick={handleStart}
    disabled={isRunning || allFinished}
  >
    ▶ Start
  </button>
  <button
    className={styles.controlButton}
    onClick={handlePause}
    disabled={!isRunning}
  >
    ❚❚ Pause
  </button>
  <button
    className={styles.controlButton}
    onClick={handleReplay}
  >
    ⟲ Replay
  </button>
  <span className={styles.statusText}>
    {allFinished
      ? "Alle Spiele beendet"
      : isRunning
      ? "Konferenz läuft"
      : "Bereit"}
  </span>
</section>


      {/* Mini-Scroller – nur unfeatured Spiele */}
      <section className={styles.scroller}>
        <div className={styles.scrollerInner}>

          {/* Loop 1 */}
          {matchdayData.games
            .filter((g) => !g.featured)
            .map((g) => (
              <span key={g.game_id + "_a"} className={styles.scrollerItem}>
                {g.home} {g.g_home}:{g.g_away} {g.away}
              </span>
            ))}

          {/* Loop 2 (Endlosschleife) */}
          {matchdayData.games
            .filter((g) => !g.featured)
            .map((g) => (
              <span key={g.game_id + "_b"} className={styles.scrollerItem}>
                {g.home} {g.g_home}:{g.g_away} {g.away}
              </span>
            ))}

        </div>
      </section>



      {/* Drei Felder untereinander */}
      {/* Drei Felder untereinander – nur solange Konferenz läuft */}
      {!allFinished && (
        <section className={styles.fields}>
          {games.map((g, idx) => {
            const isActive = idx === activeIndex;
            const state = replayStates[idx];
            const currentEvent = getCurrentEventForGame(g, state);
            const visibleEvents = getVisibleEventsForGame(g, state, isActive);
            const isGoalNow = isGoalEvent(currentEvent);

            const homeDisplay = state ? state.homeScore : 0;
            const awayDisplay = state ? state.awayScore : 0;

            return (
              <article
                key={g.game_id}
                className={`${styles.field} ${
                  isActive ? styles.fieldActive : styles.fieldInactive
                } ${isActive && isGoalNow ? styles.fieldGoal : ""}`}
              >
                {/* Rink + Header + Commentary – alles wie bisher */}
                <div className={styles.fieldHeader}>
                  <span className={styles.teamName}>{g.home.name}</span>
                  <span className={styles.score}>
                    {homeDisplay} : {awayDisplay}
                  </span>
                  <span className={styles.teamName}>{g.away.name}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.meta}>
                    {g.conference ?? "PUX!"} · Spiel {idx + 1}
                  </span>
                  
                </div>

                <div className={styles.rink}>
                  <div className={styles.rinkCenterLine} />
                  <div className={styles.rinkCircle} />
                  <div
                    className={`${puckClassForEvent(
                      g,
                      currentEvent,
                      isActive
                    )} ${isActive && isGoalNow ? styles.puckGoal : ""}`}
                  />
                </div>

                <div className={styles.eventInfo}>
                  {visibleEvents.length === 0 ? (
                    <span>Keine Events</span>
                  ) : (
                    (() => {
                      let lastText = "";

                      return visibleEvents.map((ev) => {
                        const isGoal = isGoalEvent(ev);
                        const isOffense =
                          ev.type === "attack" && ev.zone === "offensive";

                        const text = describeEvent(
                          g,
                          ev,
                          isOffense || isGoal
                        );

                        if (text === lastText) {
                          return null;
                        }
                        lastText = text;

                        return (
                          <span
                            key={`${ev.action_id}-${ev.step_in_action}`}
                            className={isGoal ? styles.goalText : undefined}
                          >
                            {text}
                          </span>
                        );
                      });
                    })()
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

        {allFinished && (
        <section className={`${styles.finalSummary} ${styles.glowFrame}`}>
          <h2 className={styles.finalTitle}>
            SPIELTAG{" "}
            {matchdayData.matchday.toString().padStart(2, "0")} – Endergebnisse
          </h2>

          {(() => {
            const northGames = matchdayData.games.filter(
              (g) => g.conference === "Nord"
            );
            const southGames = matchdayData.games.filter(
              (g) => g.conference === "Süd"
            );
            const otherGames = matchdayData.games.filter(
              (g) =>
                !g.conference ||
                (g.conference !== "Nord" && g.conference !== "Süd")
            );

            const renderGroup = (
              title: string,
              list: typeof matchdayData.games
            ) => {
              if (list.length === 0) return null;

              return (
                <div className={styles.finalGroup}>
                  <h3 className={styles.finalGroupTitle}>{title}</h3>
                  <ul className={styles.finalList}>
                    {list.map((g) => {
                      const simScore = scoreByGameId.get(g.game_id);

                      const homeScore =
                        simScore?.home ?? g.g_home ?? 0;
                      const awayScore =
                        simScore?.away ?? g.g_away ?? 0;

                      return (
                        <li key={g.game_id} className={styles.finalItem}>
                          <span className={styles.finalTeam}>{g.home}</span>
                          <span className={styles.finalScore}>
                            {homeScore} : {awayScore}
                          </span>
                          <span className={styles.finalTeam}>{g.away}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            };

            return (
              <>
                {renderGroup("Nord", northGames)}
                {renderGroup("Süd", southGames)}
                {renderGroup("Weitere", otherGames)}
              </>
            );
          })()}
        </section>
      )}



      {/* Footer mit Progress-Bar (Dummy) */}
<footer className={styles.footer}>
  <div className={styles.progressOuter}>
    <div
      className={styles.progressInner}
      style={{
        width: `${progress}%`,
      }}
    />
  </div>
  <div className={styles.footerText}>
    <span className={styles.liveDot} />
    LIVE · Konferenz-Ansicht
  </div>
</footer>

    </main>
  );
}
