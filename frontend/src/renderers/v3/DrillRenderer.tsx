// ✅ ACTIVE: Renderer v3 for E (Kopie von v2, Stand 2026-01-21)

import type { Drill } from "../../api";
import { renderWithGlossary, highlightGlossaryTerms } from "../../components/GlossaryTerm";

interface DrillRendererV3Props {
  drill: Drill;
  answers: any;
  setAnswers: (next: any) => void;
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

export default function DrillRendererV3({ drill, answers, setAnswers }: DrillRendererV3Props) {
	return (
		<div>
			<div style={{
				background: '#1e293b',
				color: '#fff',
				padding: '6px 12px',
				fontWeight: 700,
				fontSize: '1.1rem',
				borderRadius: 6,
				marginBottom: 12,
				textAlign: 'center',
				letterSpacing: 1,
				zIndex: 1000
			}}>
				[DrillRenderer V3 AKTIV]
			</div>
			{/* Drill-Rendering wie bisher */}
			{
				(() => {
					switch (drill.drill_type) {
						case "period_checkin":
							return <PeriodCheckin drill={drill} answers={answers} setAnswers={setAnswers} />;
						case "micro_quiz":
							return <MicroQuiz drill={drill} answers={answers} setAnswers={setAnswers} />;
						case "shift_tracker":
							return <ShiftTracker drill={drill} answers={answers} setAnswers={setAnswers} />;
						case "triangle_spotting":
							return <TriangleSpotting drill={drill} answers={answers} setAnswers={setAnswers} />;
						case "role_identification":
							return <RoleIdentification drill={drill} answers={answers} setAnswers={setAnswers} />;
						default:
							return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>;
					}
				})()
			}
		</div>
	);
}


// ----------------------------- PERIOD CHECKIN -----------------------------
function PeriodCheckin({ drill, answers, setAnswers }: any) {
  const questions = drill?.config?.questions || [];
  const glossary = drill?.didactics?.glossary;

  // Spezial-Layout für E1_D3
  if (drill.id === 'E1_D3') {
    // Annahme: Reihenfolge der questions im JSON: [Tendenz, Trigger1, Trigger2, Gültigkeit]
    const tendenzQ = questions[0];
    const trigger1Q = questions[1];
    const trigger2Q = questions[2];
    const validQ = questions[3];
    return (
      <div className="card">
        <h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
        {drill.description && (
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.description}</p>
        )}
        {drill.didactics?.explanation && (
          <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
            <h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
            <div style={{ whiteSpace: "pre-line" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
          </div>
        )}
        {/* Block A: Beobachtete Tendenz */}
        <section style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(81,145,162,0.07)", borderRadius: 6 }}>
          <h4 style={{ margin: 0, color: '#5191a2' }}>Beobachtete Tendenz</h4>
          <label style={{ fontWeight: 500, marginTop: 8, display: 'block' }}>{tendenzQ?.label || 'Welche Tendenz hast du über mehrere Szenen erkannt?'}</label>
          <textarea
            value={answers[tendenzQ?.key] || ""}
            onChange={e => setAnswers({ ...answers, [tendenzQ?.key]: e.target.value })}
            maxLength={tendenzQ?.max_chars || 140}
            style={{ width: '100%', minHeight: 48, marginTop: 6, borderRadius: 4, padding: 6, fontSize: '1rem', background: '#050712', color: '#fff', border: '1px solid #5191a2' }}
            placeholder={tendenzQ?.placeholder || 'z.B. „Team verliert nach Turnover in der NZ oft die Mitte“'}
          />
        </section>

        {/* Block B: Trigger & Bedingungen */}
        <section style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(81,145,162,0.07)", borderRadius: 6 }}>
          <h4 style={{ margin: 0, color: '#5191a2' }}>Trigger & Bedingungen</h4>
          {/* Trigger 1 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500, display: 'block' }}>Trigger 1 (Pflicht)</label>
            <select
              value={answers[trigger1Q?.key + '_type'] || ''}
              onChange={e => setAnswers({ ...answers, [trigger1Q?.key + '_type']: e.target.value })}
              required
              style={{ marginRight: 8, minWidth: 120, padding: 4, borderRadius: 4, border: '1px solid #5191a2', background: '#050712', color: '#fff' }}
            >
              <option value="">Typ wählen…</option>
              <option value="strukturell">strukturell</option>
              <option value="situativ">situativ</option>
              <option value="zufällig">zufällig</option>
            </select>
            <input
              type="text"
              value={answers[trigger1Q?.key] || ''}
              onChange={e => setAnswers({ ...answers, [trigger1Q?.key]: e.target.value })}
              placeholder="Kurzbeschreibung des Triggers"
              style={{ width: '60%', marginLeft: 8, borderRadius: 4, padding: 6, fontSize: '1rem', background: '#050712', color: '#fff', border: '1px solid #5191a2' }}
            />
          </div>
          {/* Trigger 2 (optional) */}
          <div>
            <label style={{ fontWeight: 500, display: 'block' }}>Trigger 2 (optional)</label>
            <select
              value={answers[trigger2Q?.key + '_type'] || ''}
              onChange={e => setAnswers({ ...answers, [trigger2Q?.key + '_type']: e.target.value })}
              style={{ marginRight: 8, minWidth: 120, padding: 4, borderRadius: 4, border: '1px solid #5191a2', background: '#050712', color: '#fff' }}
            >
              <option value="">Typ wählen…</option>
              <option value="strukturell">strukturell</option>
              <option value="situativ">situativ</option>
              <option value="zufällig">zufällig</option>
            </select>
            <input
              type="text"
              value={answers[trigger2Q?.key] || ''}
              onChange={e => setAnswers({ ...answers, [trigger2Q?.key]: e.target.value })}
              placeholder="Kurzbeschreibung des Triggers (optional)"
              style={{ width: '60%', marginLeft: 8, borderRadius: 4, padding: 6, fontSize: '1rem', background: '#050712', color: '#fff', border: '1px solid #5191a2' }}
            />
          </div>
        </section>

        {/* Block C: Gültigkeit der Analyse */}
        <section style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(81,145,162,0.07)", borderRadius: 6 }}>
          <h4 style={{ margin: 0, color: '#5191a2' }}>Analyse-Sicherheit</h4>
          <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>{validQ?.label || 'Wie sicher bist du, dass diese Tendenz reproduzierbar ist?'}</label>
          <div style={{ display: 'flex', gap: 24 }}>
            {validQ?.options?.map((opt: string) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                <input
                  type="radio"
                  name={validQ.key}
                  value={opt}
                  checked={answers[validQ.key] === opt}
                  onChange={e => setAnswers({ ...answers, [validQ.key]: e.target.value })}
                />
                {opt}
              </label>
            ))}
          </div>
          <div style={{ fontSize: '0.95em', color: '#aaa', marginTop: 6 }}>
            Wie sicher bist du, dass diese Tendenz reproduzierbar ist?
          </div>
        </section>

        {drill.didactics?.learning_hint && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
            <h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
            <p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
          </div>
        )}
      </div>
    );
  }

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.description}</p>
			)}
			{drill.didactics?.explanation && (
				<div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
					<div style={{ whiteSpace: "pre-line" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
				</div>
			)}
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
			{questions.map((q: any) => (
				<div key={q.key} style={{ marginBottom: "1rem" }}>
					<label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{q.label}</label>
					{q.type === "radio" && Array.isArray(q.options) && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
							{q.options.map((opt: string) => {
								const inlineExplanations = drill.didactics?.inline_explanations || {};
								const optKey = Object.keys(inlineExplanations).find(
									k => k === opt || k.toLowerCase() === opt.toLowerCase()
								);
								const explanation = optKey ? inlineExplanations[optKey]?.meaning : undefined;
								return (
									<label key={opt} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
										<span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<input
												type="radio"
												name={q.key}
												value={opt}
												checked={answers[q.key] === opt}
												onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
											/>
											{highlightGlossaryTerms(opt, glossary)}
										</span>
										{explanation && (
											<span style={{ fontSize: "0.85em", color: "#aaa", marginLeft: 24 }}>{explanation}</span>
										)}
									</label>
								);
							})}
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
			{drill.didactics?.learning_hint && (
				<div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
					<p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
				</div>
			)}
		</div>
	);
}

// -------------------------------- MICRO QUIZ --------------------------------
function MicroQuiz({ drill, answers, setAnswers }: any) {
	const questions = drill?.config?.questions || [];
	return (
		<div className="card">
			<h3>{drill.title}</h3>
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
		</div>
	);
}

// ------------------------------ SHIFT TRACKER ------------------------------
function ShiftTracker({ drill, answers, setAnswers }: any) {
	const shiftCount = drill?.config?.shift_count || 10;
	const questions = drill?.config?.questions || [];
	const glossary = drill?.didactics?.glossary;
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
			{drill.didactics?.learning_hint && (
				<div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", borderLeft: "4px solid #ffc107" }}>
					<h4 style={{ marginTop: 0, color: "#ffc107" }}>Lernhinweis</h4>
					<p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
				</div>
			)}
		</div>
	);
}

// ---------------------------- TRIANGLE SPOTTING ----------------------------
function TriangleSpotting({ drill, answers, setAnswers }: any) {
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
									<div key={opt} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<input
												type="radio"
												name={q.key}
												value={opt}
												checked={answers[q.key] === opt}
												onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
											/>
											{opt}
										</div>
										{drill.didactics?.inline_explanations?.[opt]?.meaning && (
											<div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
												{drill.didactics.inline_explanations[opt].meaning}
											</div>
										)}
									</div>
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
			{drill.didactics?.learning_hint && (
				<div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
					<p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
				</div>
			)}
		</div>
	);
}

// --------------------------- ROLE IDENTIFICATION ---------------------------
function RoleIdentification({ drill, answers, setAnswers }: any) {
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
			{drill.didactics?.learning_hint && (
				<div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
					<p style={{ fontStyle: "italic", whiteSpace: "pre-line" }}>{drill.didactics.learning_hint}</p>
				</div>
			)}
		</div>
	);
}
