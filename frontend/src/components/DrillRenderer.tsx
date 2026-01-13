// This file has been deprecated. Use src/renderers/v1/DrillRenderer.tsx (A1) or src/renderers/v2/DrillRenderer.tsx (A2+) instead.
// /frontend/src/components/DrillRenderer.tsx
import { useEffect, useState } from "react";
import type { Drill } from "../api";
import { renderWithGlossary, highlightGlossaryTerms } from "./GlossaryTerm";

interface DrillRendererProps {
  drill: Drill;
  onComplete: (answers: any) => void;
  initialAnswers?: any;
  onChangeAnswers?: (answers: any) => void;
}

function ObservationGuide({ drill }: { drill: Drill }) {
  const didactics: any = drill.didactics;
  if (!didactics) return null;

  // Support both observation_guide and observation_guidance structures
  const observationGuide = didactics.observation_guide || didactics.observation_guidance;

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "1rem",
        backgroundColor: "rgba(81,145,162,0.1)",
        border: "1px solid rgba(81,145,162,0.3)",
        borderRadius: "4px",
      }}
    >
      <h4
        style={{
          marginTop: 0,
          color: "#5191a2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>👀 Beobachtungsanleitung</span>

        {didactics.glossary && (
          <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "rgba(255,255,255,0.6)" }}>
            💡 <span style={{ borderBottom: "1px dotted rgba(81,145,162,0.7)", color: "#5191a2" }}>Begriffe</span>{" "}
            = Hover/Tap
          </span>
        )}
      </h4>

      {observationGuide ? (
        <>
          {Array.isArray(observationGuide.what_to_watch) && observationGuide.what_to_watch.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Worauf achten?</strong>
              <ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                {observationGuide.what_to_watch.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(observationGuide.how_to_decide) && observationGuide.how_to_decide.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Wie entscheiden?</strong>
              <ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                {observationGuide.how_to_decide.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(observationGuide.ignore) && observationGuide.ignore.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Was ignorieren?</strong>
              <ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                {observationGuide.ignore.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontStyle: "italic", color: "rgba(81,145,162,0.7)" }}>Keine Beobachtungsanleitung verfügbar.</p>
      )}
    </div>
  );
}

export default function DrillRenderer({ drill, onComplete, initialAnswers, onChangeAnswers }: DrillRendererProps) {
  const [answers, setAnswers] = useState<any>(initialAnswers || {});

  // Initiale Antworten laden (z.B. aus Draft)
  useEffect(() => {
    if (initialAnswers) setAnswers(initialAnswers);
  }, [initialAnswers]);

  const updateAnswers = (next: any) => {
    setAnswers((prev: any) => {
      const computed = typeof next === "function" ? next(prev) : next;
      onChangeAnswers?.(computed);
      return computed;
    });
  };

  const handleSubmit = () => {
    onComplete(answers);
  };

  switch (drill.drill_type) {
    case "period_checkin":
      return <PeriodCheckin drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />;
    case "micro_quiz":
      return <MicroQuiz drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />;
    case "shift_tracker":
      return <ShiftTracker drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />;
    case "triangle_spotting":
      return <TriangleSpotting drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />;
    case "role_identification":
      return <RoleIdentification drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />;
    default:
      return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>;
  }
}

/* ----------------------------- PERIOD CHECKIN ----------------------------- */

function PeriodCheckin({ drill, answers, setAnswers, onSubmit }: any) {
  const questions = drill?.config?.questions || [];
  const glossary = drill?.didactics?.glossary;

  return (
    <div className="card">
      <h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
      {drill.description && (
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", wordWrap: "break-word", overflowWrap: "break-word" }}>
          {drill.description}
        </p>
      )}

      {drill.didactics?.explanation && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
          <div style={{ whiteSpace: "pre-line" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
        </div>
      )}

      {/* Zusatzbereich: role_context (z.B. "Typische Aufgaben eines Centers") */}
      {drill.didactics?.role_context && (
        <section style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0 }}>{drill.didactics.role_context.title}</h4>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            {drill.didactics.role_context.content?.map((item: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <strong>{item.label}:</strong> {item.text}
              </li>
            ))}
          </ul>
          {drill.didactics.role_context.hint && (
            <p style={{ marginTop: 8, fontStyle: "italic", opacity: 0.75 }}>{drill.didactics.role_context.hint}</p>
          )}
        </section>
      )}

      <ObservationGuide drill={drill} />

      {/* Fragen */}
      {questions.map((q: any) => (
        <div key={q.key} style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{q.label}</label>

          {q.type === "radio" && Array.isArray(q.options) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {q.options.map((opt: string) => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    name={q.key}
                    value={opt}
                    checked={answers[q.key] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                  />
                  {highlightGlossaryTerms(opt, glossary)}
                </label>
              ))}
            </div>
          )}

          {q.type === "text" && (
            <textarea
              value={answers[q.key] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
              maxLength={q.max_chars || 200}
              placeholder={q.placeholder || "Optional: kurze Notiz"}
              style={{
                width: "100%",
                minHeight: "60px",
                padding: "0.5rem",
                backgroundColor: "#050712",
                color: "#f7f7ff",
                border: "1px solid rgba(81,145,162,0.5)",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          )}
        </div>
      ))}

      <button onClick={onSubmit} className="btn" style={{ width: "100%", padding: "1rem" }}>
        Weiter
      </button>

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- MICRO QUIZ -------------------------------- */

function MicroQuiz({ drill, answers, setAnswers, onSubmit }: any) {
  const [startTime] = useState(Date.now());
  const timeLimit = drill?.config?.time_limit || 60;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(0, timeLimit - elapsed);

  const questions = drill?.config?.questions || [];

  if (remaining <= 0) {
    return (
      <div className="card">
        <h3>Zeit abgelaufen!</h3>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      <div>Verbleibende Zeit: {remaining} Sekunden</div>
      <progress value={elapsed} max={timeLimit} style={{ width: "100%" }} />

      {questions.map((q: any, i: number) => (
        <div key={i} style={{ marginBottom: "1rem" }}>
          <h4>
            Frage {i + 1}: {q.question}
          </h4>

          {q.options?.map((opt: string, j: number) => (
            <label key={j} style={{ display: "block", margin: "0.5rem 0" }}>
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                checked={answers[`q${i}`] === opt}
                onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
              />
              {opt}
            </label>
          ))}

          {answers[`q${i}`] === q.correct && <div style={{ color: "green" }}>Richtig! {q.explanation}</div>}
          {answers[`q${i}`] && answers[`q${i}`] !== q.correct && <div style={{ color: "red" }}>Falsch. {q.explanation}</div>}
        </div>
      ))}

      <button onClick={onSubmit} className="btn" style={{ width: "100%", padding: "1rem" }}>
        Quiz abschließen
      </button>
    </div>
  );
}

/* ------------------------------ SHIFT TRACKER ------------------------------ */

function ShiftTracker({ drill, answers, setAnswers, onSubmit }: any) {
  const shiftCount = drill?.config?.shift_count || 10;
  const questions = drill?.config?.questions || [];
  const glossary = drill?.didactics?.glossary;

  // Anzahl beantworteter "shift_" Felder grob als Fortschritt
  const completedFields = Object.keys(answers).filter((k) => k.startsWith("shift_")).length;
  const perShiftFields = Math.max(1, questions.length);
  const completedShifts = Math.floor(completedFields / perShiftFields);

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: "1rem" }}>
        {drill.description || "Beobachte Shifts konsequent – Muster erkennen, nicht raten."}
      </p>

      {drill.didactics?.explanation && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", borderLeft: "4px solid #5191a2" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
          <div style={{ whiteSpace: "pre-line" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
        </div>
      )}

      <ObservationGuide drill={drill} />

      {drill.didactics?.shift_marker_explanation && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", borderLeft: "4px solid #ffc107" }}>
          <p>{drill.didactics.shift_marker_explanation}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Array.from({ length: shiftCount }).map((_, idx) => {
          const shiftNum = idx + 1;
          return (
            <div key={shiftNum} style={{ padding: "1rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>
              <h4 style={{ marginTop: 0 }}>Shift {shiftNum}</h4>

              {questions.map((q: any) => {
                const key = `shift_${shiftNum}_${q.key}`;
                return (
                  <div key={key} style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>
                      {renderWithGlossary(q.label || q.key)}
                    </label>

                    {q.type === "radio" && Array.isArray(q.options) && (
                      <div>
                        {q.options.map((opt: string) => (
                          <label
                            key={opt}
                            style={{
                              display: "block",
                              margin: "0.35rem 0",
                              padding: "0.5rem",
                              cursor: "pointer",
                              backgroundColor: answers[key] === opt ? "rgba(81,145,162,0.2)" : "transparent",
                              borderRadius: "4px",
                            }}
                          >
                            <input
                              type="radio"
                              name={key}
                              value={opt}
                              checked={answers[key] === opt}
                              onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                              style={{ marginRight: "0.5rem" }}
                            />
                            {highlightGlossaryTerms(opt, glossary)}
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === "text" && (
                      <textarea
                        value={answers[key] || ""}
                        onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                        maxLength={q.max_chars || 200}
                        placeholder={q.placeholder || "Kurz notieren…"}
                        style={{
                          width: "100%",
                          minHeight: "56px",
                          padding: "0.5rem",
                          backgroundColor: "#050712",
                          color: "#f7f7ff",
                          border: "1px solid rgba(81,145,162,0.5)",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        className="btn"
        disabled={completedShifts < shiftCount}
        style={{ opacity: completedShifts < shiftCount ? 0.5 : 1, width: "100%", padding: "1rem", marginTop: "1rem" }}
      >
        Alle {shiftCount} Shifts abschließen
      </button>

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", borderLeft: "4px solid #ffc107" }}>
          <h4 style={{ marginTop: 0, color: "#ffc107" }}>Lernhinweis</h4>
          <p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- TRIANGLE SPOTTING ---------------------------- */

function TriangleSpotting({ drill, answers, setAnswers, onSubmit }: any) {
  const questions = drill?.config?.questions || [];

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      {drill.description && <p style={{ opacity: 0.75 }}>{drill.description}</p>}

      {drill.didactics?.drill_intro && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>{drill.didactics.drill_intro.title}</h4>
          <p>{drill.didactics.drill_intro.text}</p>
        </div>
      )}

      <ObservationGuide drill={drill} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((q: any) => (
          <div key={q.key}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{q.label}</label>

            {q.type === "radio" && Array.isArray(q.options) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {q.options.map((opt: string) => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <textarea
                value={answers[q.key] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                maxLength={q.max_chars || 200}
                style={{ width: "100%", minHeight: "3rem", padding: "0.5rem" }}
                placeholder="Deine Beobachtung…"
              />
            )}
          </div>
        ))}
      </div>

      <button onClick={onSubmit} className="btn" style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}>
        Drill abschließen
      </button>

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  );
}

/* --------------------------- ROLE IDENTIFICATION --------------------------- */

function RoleIdentification({ drill, answers, setAnswers, onSubmit }: any) {
  const questions = drill?.config?.questions || [];

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      {drill.description && <p style={{ opacity: 0.75 }}>{drill.description}</p>}

      {drill.didactics?.explanation && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
          <div style={{ whiteSpace: "pre-line" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
        </div>
      )}

      {drill.didactics?.role_context && (
        <section style={{ marginTop: 12, fontSize: "0.9rem", opacity: 0.9 }}>
          <h4>{drill.didactics.role_context.title}</h4>
          <ul style={{ paddingLeft: 16 }}>
            {drill.didactics.role_context.content?.map((item: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <strong>{item.label}:</strong> {item.text}
              </li>
            ))}
          </ul>
          {drill.didactics.role_context.hint && (
            <p style={{ marginTop: 8, fontStyle: "italic", opacity: 0.75 }}>{drill.didactics.role_context.hint}</p>
          )}
        </section>
      )}

      <ObservationGuide drill={drill} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((q: any) => (
          <div key={q.key}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{q.label}</label>

            {q.type === "radio" && Array.isArray(q.options) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {q.options.map((opt: string) => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <input
                type="text"
                value={answers[q.key] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                maxLength={q.max_chars || 200}
                style={{ width: "100%", padding: "0.5rem" }}
                placeholder={q.placeholder || "Beschreibe die Rolle (z. B. absichernd, verbindend, antreibend). Kein Name."}
              />
            )}
          </div>
        ))}
      </div>

      <button onClick={onSubmit} className="btn" style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}>
        Drill abschließen
      </button>

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
          <h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  );
}