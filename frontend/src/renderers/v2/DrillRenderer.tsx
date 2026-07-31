// ✅ ACTIVE: Renderer v2 for A2+ (UI-only, no Buttons, no API, no onComplete)

import { useEffect, useState } from "react";
import type { Drill } from "../../api";
import { renderWithGlossary, makeGlossaryRenderer, highlightGlossaryTerms } from "../../components/GlossaryTerm";

interface DrillRendererV2Props {
  drill: Drill;
  answers: any;
  setAnswers: (next: any) => void;
}

// Helper: Format snake_case to readable text (e.g., "raum_offen" → "Raum Offen")
function formatOptionText(text: string): string {
	if (!text) return text;
	const trimmed = text.trim();
	const hasUnderscore = trimmed.includes("_");
	const isNaturalSentence = trimmed.includes(" ") && !hasUnderscore && /[.!?]$/.test(trimmed);

	if (isNaturalSentence) return trimmed;
	if (!hasUnderscore && trimmed.includes(" ")) return trimmed;

	return trimmed
		.replace(/_/g, " ")
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

function buildObservationMirror(samples: Array<Record<string, any>>, key: string, labels: Record<string, string> = {}) {
	const counts = new Map<string, number>();
	for (const sample of samples) {
		const value = sample?.[key];
		if (!value) continue;
		counts.set(value, (counts.get(value) || 0) + 1);
	}
	return Array.from(counts.entries())
		.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
		.map(([value, count]) => ({ label: labels[value] || formatOptionText(value), count }));
}

function ObservationModeCard({ count, target, focus, mirror }: { count: number; target: number; focus: string; mirror: Array<{ label: string; count: number }> }) {
	return (
		<section style={{ marginBottom: "0.85rem", padding: "0.9rem 1rem", borderRadius: "6px", background: "rgba(20,184,166,0.10)", border: "1px solid rgba(45,212,191,0.36)" }}>
			<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ Drillziel erreicht</h4>
			<p style={{ marginTop: 0, marginBottom: "0.55rem", color: "rgba(240,253,250,0.88)" }}>
				{count}/{target} Beobachtungen erfasst.
			</p>
			<p style={{ marginTop: 0, marginBottom: "0.65rem", color: "rgba(255,255,255,0.78)" }}>
				<strong>Aktiver Fokus:</strong><br />
				{focus}
			</p>
			<p style={{ marginTop: 0, marginBottom: mirror.length > 0 ? "0.75rem" : 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
				Nutze die verbleibende Beobachtungszeit, um weitere Situationen zu analysieren oder interessante Szenen fuer Rink About It zu markieren.
			</p>
			{mirror.length > 0 && (
				<div>
					<div style={{ marginBottom: "0.35rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
						Bisher häufig beobachtet
					</div>
					<ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(255,255,255,0.86)", lineHeight: 1.55 }}>
						{mirror.map((item) => (
							<li key={item.label}>{item.label} ({item.count})</li>
						))}
					</ul>
				</div>
			)}
		</section>
	);
}

function ObservationGuide({ drill }: { drill: Drill }) {
	const didactics: any = drill.didactics;
	if (!didactics) return null;

	const rwg = makeGlossaryRenderer(didactics.glossary);
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
					{Array.isArray(observationGuide) && observationGuide.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<ul style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
								{observationGuide.map((item: string, i: number) => (
									<li key={i}>{rwg(item)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.what_to_watch) && observationGuide.what_to_watch.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Worauf achten?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.what_to_watch.map((item: string, i: number) => (
									<li key={i}>{rwg(item)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.how_to_decide) && observationGuide.how_to_decide.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Wie entscheiden?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.how_to_decide.map((item: string, i: number) => (
									<li key={i}>{rwg(item)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.common_mistakes) && observationGuide.common_mistakes.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Typische Denkfehler</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.common_mistakes.map((item: string, i: number) => (
									<li key={i}>{rwg(item)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.ignore) && observationGuide.ignore.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Was ignorieren?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.ignore.map((item: string, i: number) => (
									<li key={i}>{rwg(item)}</li>
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

const PRESSURE_DIMENSIONS = [
	{
		key: "zeitdruck",
		label: "Zeitdruck",
		question: "Wie viel Zeit hatte der Spieler fuer seine Entscheidung?",
		options: ["Viel Zeit", "Etwas Zeit", "Wenig Zeit", "Sofort handeln"],
		scoreMap: {
			"Viel Zeit": 0,
			"Etwas Zeit": 1,
			"Wenig Zeit": 2,
			"Sofort handeln": 3,
		},
	},
	{
		key: "raumdruck",
		label: "Raumdruck",
		question: "Wie stark war der verfuegbare Raum eingeschraenkt?",
		options: ["Frei", "Eher frei", "Eingeschraenkt", "Eingekesselt"],
		scoreMap: {
			Frei: 0,
			"Eher frei": 1,
			Eingeschraenkt: 2,
			Eingekesselt: 3,
		},
	},
	{
		key: "gegnerdruck",
		label: "Gegnerdruck",
		question: "Wie direkt wurde der Spieler attackiert?",
		options: ["Kein Druck", "Beobachtet", "Angegriffen", "Sofort attackiert"],
		scoreMap: {
			"Kein Druck": 0,
			Beobachtet: 1,
			Angegriffen: 2,
			"Sofort attackiert": 3,
		},
	},
	{
		key: "optionsdruck",
		label: "Optionsdruck",
		question: "Wie viele realistische Loesungen standen zur Verfuegung?",
		options: ["Viele", "Einige", "Wenige", "Fast keine"],
		scoreMap: {
			Viele: 0,
			Einige: 1,
			Wenige: 2,
			"Fast keine": 3,
		},
	},
];

function normalizeSampleFields(drill: any) {
	const configuredFields = drill?.config?.sample_fields || drill?.config?.diagnosis_fields;
	if (Array.isArray(configuredFields) && configuredFields.length > 0) {
		return configuredFields.map((field: any) => ({
			...field,
			scoreMap: field.score_map || field.scoreMap || {},
		}));
	}
	return PRESSURE_DIMENSIONS;
}

function optionValue(option: any): string {
	return typeof option === "object" ? option.value : option;
}

function optionLabel(option: any): string {
	return typeof option === "object" ? option.label : option;
}

function computeSampleAggregation(samples: any[] = [], fields: any[] = [], checkinOptions: any[] = [], aggregateBy?: string) {
	if (aggregateBy) {
		const totals: Record<string, number> = {};
		for (const option of checkinOptions) {
			totals[option.value] = 0;
		}
		for (const sample of samples) {
			const selected = sample?.[aggregateBy];
			if (!selected) continue;
			totals[selected] = (totals[selected] || 0) + 1;
		}

		let dominantKey = checkinOptions[0]?.value || aggregateBy;
		for (const key of Object.keys(totals)) {
			if ((totals[key] || 0) > (totals[dominantKey] || 0)) {
				dominantKey = key;
			}
		}

		const dominantLabel = checkinOptions.find((option: any) => option.value === dominantKey)?.label || dominantKey;
		return { totals, dominantKey, dominantLabel };
	}

	const totals: Record<string, number> = {};
	for (const field of fields) {
		totals[field.key] = 0;
	}

	for (const sample of samples) {
		for (const field of fields) {
			const selected = sample?.[field.key];
			if (!selected) continue;
			const score = field.scoreMap?.[selected];
			if (typeof score === "number") {
				totals[field.key] += score;
			}
		}
	}

	let dominantKey = fields[0]?.key || "dominant";
	for (const field of fields) {
		if ((totals[field.key] || 0) > (totals[dominantKey] || 0)) {
			dominantKey = field.key;
		}
	}

	const dominantLabel = fields.find((field) => field.key === dominantKey)?.label || dominantKey;
	return { totals, dominantKey, dominantLabel };
}

export default function DrillRendererV2({ drill, answers, setAnswers }: DrillRendererV2Props) {
	switch (drill.drill_type) {
		case "clickable_rink_observation":
			return <ClickableRinkObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "observation_log_drill":
			return <ObservationLogDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "period_checkin":
			if (drill?.config?.mode === "pressure_diagnosis" || drill?.config?.mode === "solution_type_diagnosis" || drill?.config?.mode === "decision_cause_diagnosis" || drill?.config?.mode === "transition_followup_assessment") {
				return <PressureDiagnosisCheckin drill={drill} answers={answers} setAnswers={setAnswers} />;
			}
			return <PeriodCheckin drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "pressure_diagnosis":
			return <PressureDiagnosisCheckin drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "sample_log":
			return <SampleLog drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "micro_quiz":
			return <MicroQuiz drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "shift_tracker":
			return <ShiftTracker drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "triangle_spotting":
			return <TriangleSpotting drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "role_identification":
			return <RoleIdentification drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "event_log":
			return <EventLog drill={drill} answers={answers} setAnswers={setAnswers} />;
		default:
			return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>;
	}
}

function ClickableRinkObservationDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};

	const observationCount = Number(config?.observation_count || 3);
	const observationsKey = config?.observations_key || "observations";
	const reflectionConfig = config?.completion_reflection || {};
	const reflectionKey = reflectionConfig?.key || "final_reflection";
	const reflectionOptions = Array.isArray(reflectionConfig?.options) ? reflectionConfig.options : ["ja", "nein", "kein klares Muster"];

	const initiatorKey = config?.initiator_key || "initiatorPosition";
	const locationKey = config?.location_key || "accessLocation";
	const noteKey = config?.note_key || "note";
	const observationIndexKey = config?.observation_index_key || "observationIndex";
	const createdAtKey = config?.created_at_key || "createdAt";

	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const positionMarkers = Array.isArray(config?.position_markers) && config.position_markers.length > 0
		? config.position_markers
		: [
			{ value: "LW", label: "LW", x: 0.2, y: 0.28 },
			{ value: "C", label: "C", x: 0.42, y: 0.46 },
			{ value: "RW", label: "RW", x: 0.64, y: 0.28 },
			{ value: "LD", label: "LD", x: 0.34, y: 0.72 },
			{ value: "RD", label: "RD", x: 0.56, y: 0.72 },
		];
	const unclearValue = config?.unclear_value || "unclear";
	const unclearLabel = config?.unclear_label || "nicht klar erkennbar";

	const selectionLabel = config?.selection_label || "Spielerposition wählen";
	const locationLabel = config?.location_label || "Ort des Zugriffs markieren";
	const observeHint = config?.observe_hint || "Sobald du eine passende Situation entdeckt hast, erfasse deine Beobachtung.";
	const noteLabel = config?.note_label || "Woran hast du erkannt, dass hier der defensive Druck beginnt?";
	const notePlaceholder = config?.note_placeholder || "Optional";
	const noteMaxChars = Number(config?.note_max_chars || 220);
	const saveButtonLabel = config?.save_button_label || "Beobachtung speichern";
	const savedFeedbackTemplate = config?.saved_feedback_template || "Beobachtung {index} gespeichert";

	const activeFocusTitle = config?.active_focus_title || "Active Focus";
	const activeFocusText = config?.active_focus_text || "Halte weiterhin Ausschau nach erstem defensivem Druck und markiere interessante Szenen im Live-Spiel.";

	const observations = Array.isArray(safeAnswers[observationsKey]) ? safeAnswers[observationsKey] : [];
	const currentIndex = observations.length;
	const isComplete = observations.length >= observationCount;
	const progressPct = observationCount > 0 ? Math.round((observations.length / observationCount) * 100) : 0;

	const currentMission = missions[currentIndex] || {
		title: `Mission ${currentIndex + 1} von ${observationCount}`,
		prompt: "Finde eine passende Situation mit erstem defensivem Druck.",
		hint: "Wähle die Position und markiere den Zugriffsort.",
	};

	const draft = safeAnswers.__clickable_rink_observation_draft || {};
	const selectedPosition = draft[initiatorKey] || "";
	const selectedLocation = draft[locationKey] || null;
	const draftNote = draft[noteKey] || "";
	const canSave = !!selectedPosition && !!selectedLocation;

	const [flashMessage, setFlashMessage] = useState<string>("");

	const clamp = (value: number) => Math.max(0, Math.min(1, value));

	const updateDraft = (nextDraft: any) => {
		setAnswers({
			...safeAnswers,
			__clickable_rink_observation_draft: {
				...draft,
				...nextDraft,
			},
		});
	};

	const clearDraft = () => {
		setAnswers({
			...safeAnswers,
			__clickable_rink_observation_draft: {
				[initiatorKey]: "",
				[locationKey]: null,
				[noteKey]: "",
			},
		});
	};

	const onRinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = clamp((event.clientX - rect.left) / rect.width);
		const y = clamp((event.clientY - rect.top) / rect.height);
		updateDraft({ [locationKey]: { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) } });
	};

	const onSaveObservation = () => {
		if (!canSave || isComplete) return;

		const nextObservation = {
			[initiatorKey]: selectedPosition,
			[locationKey]: selectedLocation,
			[noteKey]: draftNote.trim() || undefined,
			[observationIndexKey]: currentIndex + 1,
			[createdAtKey]: new Date().toISOString(),
		};

		setAnswers({
			...safeAnswers,
			[observationsKey]: [...observations, nextObservation],
			__clickable_rink_observation_draft: {
				[initiatorKey]: "",
				[locationKey]: null,
				[noteKey]: "",
			},
		});

		setFlashMessage(savedFeedbackTemplate.replace("{index}", String(currentIndex + 1)));
		window.setTimeout(() => setFlashMessage(""), 1200);
	};

	const removeObservation = (index: number) => {
		const next = observations.filter((_: any, idx: number) => idx !== index);
		setAnswers({
			...safeAnswers,
			[observationsKey]: next,
		});
	};

	const reflectionValue = safeAnswers[reflectionKey] || "";
	const positionCounts = observations.reduce((acc: Record<string, number>, entry: any) => {
		const key = entry?.[initiatorKey] || unclearValue;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	const findMarkerLabel = (value: string) => {
		if (value === unclearValue) return unclearLabel;
		const found = positionMarkers.find((marker: any) => marker.value === value);
		return found?.label || value;
	};

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.65rem" }}>
					{drill.description}
				</p>
			)}

			<details style={{ marginBottom: "0.7rem" }}>
				<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
				<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
					{drill?.didactics?.explanation || "Defensiver Druck beginnt, sobald ein Spieler den Gegner aktiv zwingt, Zeit, Raum, Laufweg oder eine Option anzupassen."}
				</p>
			</details>

			{!isComplete && (
				<section style={{ marginBottom: "0.75rem", padding: "0.8rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
					<div style={{ marginBottom: "0.45rem", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>🎯 Mission {currentIndex + 1} von {observationCount}</p>
						<p style={{ margin: "0.18rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.32 }}>{currentMission?.prompt}</p>
						{currentMission?.hint && <p style={{ margin: "0.24rem 0 0", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem" }}>{currentMission.hint}</p>}
					</div>

					<div style={{ marginBottom: "0.55rem" }}>
						<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "rgba(255,255,255,0.62)", marginBottom: "0.2rem" }}>
							<span>Fortschritt</span>
							<span>{observations.length}/{observationCount}</span>
						</div>
						<div style={{ height: "5px", width: "100%", borderRadius: "999px", background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
							<div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #2dd4bf 0%, #14b8a6 100%)" }} />
						</div>
					</div>

					<p style={{ marginTop: 0, marginBottom: "0.5rem", color: "rgba(255,255,255,0.72)", fontSize: "0.86rem" }}>{observeHint}</p>

					<div style={{ marginBottom: "0.45rem" }}>
						<label style={{ display: "block", marginBottom: "0.22rem", fontWeight: 600 }}>{selectionLabel}</label>
						<p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.62)" }}>{locationLabel}</p>
					</div>

					<div
						onClick={onRinkClick}
						style={{
							position: "relative",
							width: "100%",
							maxWidth: "660px",
							aspectRatio: "11 / 7",
							borderRadius: "10px",
							border: "1px solid rgba(81,145,162,0.45)",
							overflow: "hidden",
							background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
							marginBottom: "0.55rem",
							cursor: "crosshair",
						}}
					>
						<svg viewBox="0 0 1100 700" role="img" aria-label="Klickbare Eisflaeche" style={{ width: "100%", height: "100%", display: "block" }}>
							<rect x="28" y="28" width="1044" height="644" rx="78" ry="78" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
							<line x1="550" y1="34" x2="550" y2="666" stroke="rgba(255,120,120,0.65)" strokeWidth="4" />
							<line x1="320" y1="34" x2="320" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
							<line x1="780" y1="34" x2="780" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
							<circle cx="550" cy="350" r="74" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
						</svg>

						{positionMarkers.map((marker: any) => {
							const active = selectedPosition === marker.value;
							return (
								<button
									key={marker.value}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										updateDraft({ [initiatorKey]: marker.value });
									}}
									style={{
										position: "absolute",
										left: `${Number(marker.x) * 100}%`,
										top: `${Number(marker.y) * 100}%`,
										transform: "translate(-50%, -50%)",
										minWidth: "42px",
										height: "42px",
										padding: "0 0.55rem",
										borderRadius: "999px",
										border: active ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.45)",
										background: active ? "rgba(20,184,166,0.88)" : "rgba(13,29,46,0.84)",
										color: "#f7f7ff",
										fontWeight: 700,
										fontSize: "0.82rem",
										cursor: "pointer",
									}}
								>
									{marker.label}
								</button>
							);
						})}

						{selectedLocation && (
							<div
								style={{
									position: "absolute",
									left: `${selectedLocation.x * 100}%`,
									top: `${selectedLocation.y * 100}%`,
									transform: "translate(-50%, -50%)",
									width: "20px",
									height: "20px",
									borderRadius: "999px",
									border: "2px solid rgba(255,255,255,0.95)",
									background: "rgba(239,68,68,0.95)",
									boxShadow: "0 0 0 3px rgba(239,68,68,0.25)",
									pointerEvents: "none",
								}}
							/>
						)}
					</div>

					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
						<button
							type="button"
							onClick={() => updateDraft({ [initiatorKey]: unclearValue })}
							style={{
								padding: "0.28rem 0.55rem",
								borderRadius: "999px",
								border: selectedPosition === unclearValue ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
								background: selectedPosition === unclearValue ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
								color: "#f7f7ff",
								fontSize: "0.82rem",
								cursor: "pointer",
							}}
						>
							{unclearLabel}
						</button>
						<button
							type="button"
							onClick={clearDraft}
							style={{
								padding: "0.28rem 0.55rem",
								borderRadius: "999px",
								border: "1px solid rgba(255,255,255,0.25)",
								background: "transparent",
								color: "rgba(255,255,255,0.82)",
								fontSize: "0.82rem",
								cursor: "pointer",
							}}
						>
							Zurücksetzen
						</button>
					</div>

					<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
						<div>Gewählte Position: <strong>{selectedPosition ? findMarkerLabel(selectedPosition) : "noch nicht gewählt"}</strong></div>
						<div>Zugriffsort: <strong>{selectedLocation ? `${Math.round(selectedLocation.x * 100)}% / ${Math.round(selectedLocation.y * 100)}%` : "noch nicht markiert"}</strong></div>
					</div>

					{canSave && (
						<details style={{ marginBottom: "0.45rem" }} open={!!draftNote}>
							<summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "#8fd3df" }}>Optionale Notiz</summary>
							<textarea
								value={draftNote}
								onChange={(e) => updateDraft({ [noteKey]: e.target.value })}
								maxLength={noteMaxChars}
								placeholder={notePlaceholder}
								aria-label={noteLabel}
								style={{
									width: "100%",
									minHeight: "56px",
									marginTop: "0.35rem",
									padding: "0.45rem",
									backgroundColor: "#050712",
									color: "#f7f7ff",
									border: "1px solid rgba(81,145,162,0.5)",
									borderRadius: "4px",
									fontFamily: "inherit",
									fontSize: "0.9rem",
								}}
							/>
						</details>
					)}

					<button
						type="button"
						onClick={onSaveObservation}
						disabled={!canSave}
						style={{
							padding: "0.5rem 0.85rem",
							background: canSave ? "rgba(81,145,162,0.36)" : "rgba(81,145,162,0.14)",
							border: "1px solid rgba(81,145,162,0.62)",
							borderRadius: "4px",
							color: "#f7f7ff",
							fontWeight: 600,
							fontSize: "0.9rem",
							cursor: canSave ? "pointer" : "not-allowed",
						}}
					>
						{saveButtonLabel}
					</button>

					{flashMessage && (
						<p style={{ margin: "0.45rem 0 0", color: "#99f6e4", fontSize: "0.84rem" }}>{flashMessage}</p>
					)}
				</section>
			)}

			<section style={{ marginBottom: "0.4rem", padding: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.55rem" }}>
					<h4 style={{ margin: 0 }}>Erfasste Beobachtungen</h4>
					<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>{observations.length}/{observationCount}</span>
				</div>

				<div style={{ display: "grid", gap: "0.4rem" }}>
					{observations.map((entry: any, idx: number) => (
						<div key={idx} style={{ padding: "0.5rem 0.62rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", background: "rgba(255,255,255,0.03)" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.55rem" }}>
								<strong>Beobachtung {idx + 1}</strong>
								<button
									type="button"
									onClick={() => removeObservation(idx)}
									style={{ padding: "0.14rem 0.45rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#f7f7ff", fontSize: "0.82rem", cursor: "pointer" }}
								>
									Entfernen
								</button>
							</div>
							<div style={{ marginTop: "0.22rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.34 }}>
								{findMarkerLabel(entry?.[initiatorKey])} | {entry?.[locationKey] ? `${Math.round(entry[locationKey].x * 100)}% / ${Math.round(entry[locationKey].y * 100)}%` : "kein Ort"}
							</div>
						</div>
					))}
				</div>

				{isComplete && (
					<div style={{ marginTop: "0.7rem" }}>
						<p style={{ margin: "0 0 0.45rem", color: "rgba(153,246,228,0.96)", fontWeight: 600 }}>
							Du hast drei Situationen mit erstem defensivem Druck beobachtet.
						</p>
						<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>
							{reflectionConfig?.label || "Kam der erste Druck meistens von derselben Spielerposition?"}
						</label>
						<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.55rem" }}>
							{reflectionOptions.map((opt: string) => (
								<label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.42rem", fontSize: "0.88rem" }}>
									<input
										type="radio"
										name="clickable_rink_reflection"
										value={opt}
										checked={reflectionValue === opt}
										onChange={(e) => setAnswers({ ...safeAnswers, [reflectionKey]: e.target.value })}
									/>
									<span>{opt}</span>
								</label>
							))}
						</div>

						<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.35 }}>
							<strong>Positionen:</strong> {Object.entries(positionCounts).map(([key, count]) => `${findMarkerLabel(key)} (${count})`).join(", ") || "keine"}
						</div>

						<div style={{ position: "relative", width: "100%", maxWidth: "640px", aspectRatio: "11 / 7", borderRadius: "10px", border: "1px solid rgba(81,145,162,0.38)", overflow: "hidden", background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)", marginBottom: "0.55rem" }}>
							<svg viewBox="0 0 1100 700" role="img" aria-label="Rink Uebersicht" style={{ width: "100%", height: "100%", display: "block" }}>
								<rect x="28" y="28" width="1044" height="644" rx="78" ry="78" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
								<line x1="550" y1="34" x2="550" y2="666" stroke="rgba(255,120,120,0.65)" strokeWidth="4" />
								<line x1="320" y1="34" x2="320" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
								<line x1="780" y1="34" x2="780" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
							</svg>
							{observations.map((entry: any, idx: number) => {
								const loc = entry?.[locationKey];
								if (!loc) return null;
								return (
									<div
										key={`pt-${idx}`}
										style={{
											position: "absolute",
											left: `${loc.x * 100}%`,
											top: `${loc.y * 100}%`,
											transform: "translate(-50%, -50%)",
											width: "16px",
											height: "16px",
											borderRadius: "999px",
											border: "2px solid rgba(255,255,255,0.94)",
											background: "rgba(239,68,68,0.92)",
											boxShadow: "0 0 0 2px rgba(239,68,68,0.24)",
										}}
									/>
								);
							})}
						</div>

						{reflectionValue && (
							<section style={{ marginTop: "0.45rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
								<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
								<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
							</section>
						)}
					</div>
				)}
			</section>

			{drill.didactics?.learning_hint && (
				<p style={{ marginTop: "0.68rem", marginBottom: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.58)", whiteSpace: "pre-line" }}>
					{drill.didactics.learning_hint}
				</p>
			)}
		</div>
	);
}

function ObservationLogDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};
	const logsKey = config?.logs_key || "logs";
	const targetCount = Number(config?.log_count || 3);
	const logs = Array.isArray(safeAnswers[logsKey]) ? safeAnswers[logsKey] : [];
	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const observeHint = config?.observe_hint || "Sobald du eine passende Situation entdeckt hast, erfasse deine Beobachtung.";

	const decisionConfig = config?.decision || {};
	const decisionKey = decisionConfig?.key || "decision";
	const decisionLabel = decisionConfig?.label || "Wer setzt den ersten defensiven Impuls?";
	const decisionOptions = Array.isArray(decisionConfig?.options) ? decisionConfig.options : [];

	const reflectionConfig = config?.reflection || {};
	const reflectionKey = reflectionConfig?.key || "reflection";
	const reflectionLabel = reflectionConfig?.label || "Woran hast du erkannt, dass genau hier die Defensivaktion beginnt?";
	const reflectionPlaceholder = reflectionConfig?.placeholder || "Optional: kurze Reflexion";
	const reflectionMaxChars = Number(reflectionConfig?.max_chars || 500);

	const currentIndex = logs.length;
	const currentMission = missions[currentIndex] || {
		title: `Mission ${currentIndex + 1}`,
		prompt: "Finde eine passende Beobachtungssituation.",
	};

	const draftDecision = safeAnswers.__observation_log_draft_decision || "";
	const draftReflection = safeAnswers.__observation_log_draft_reflection || "";
	const isComplete = logs.length >= targetCount;
	const progressPercent = targetCount > 0 ? Math.min(100, Math.round((logs.length / targetCount) * 100)) : 0;

	const updateDraft = (next: any) => {
		setAnswers({
			...safeAnswers,
			...next,
		});
	};

	const addLog = () => {
		if (!draftDecision || isComplete) return;
		const nextLog = {
			mission_index: currentIndex + 1,
			mission_title: currentMission?.title || `Mission ${currentIndex + 1}`,
			mission_prompt: currentMission?.prompt || "",
			[decisionKey]: draftDecision,
			[reflectionKey]: draftReflection.trim(),
		};

		setAnswers({
			...safeAnswers,
			[logsKey]: [...logs, nextLog],
			__observation_log_draft_decision: "",
			__observation_log_draft_reflection: "",
		});
	};

	const removeLog = (index: number) => {
		const nextLogs = logs.filter((_: any, idx: number) => idx !== index);
		setAnswers({
			...safeAnswers,
			[logsKey]: nextLogs,
		});
	};

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.75rem" }}>
					{drill.description}
				</p>
			)}
			<ObservationGuide drill={drill} />

			{!isComplete && (
				<section style={{ marginBottom: "0.75rem", padding: "0.85rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
					<div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>🎯 Mission {currentIndex + 1} von {targetCount}</p>
						{currentMission?.prompt && (
							<p style={{ margin: "0.2rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.35 }}>{currentMission.prompt}</p>
						)}
					</div>
					<div style={{ marginBottom: "0.55rem" }}>
						<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(255,255,255,0.62)", marginBottom: "0.2rem" }}>
							<span>Fortschritt</span>
							<span>{logs.length}/{targetCount}</span>
						</div>
						<div style={{ height: "5px", width: "100%", borderRadius: "999px", background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
							<div style={{ height: "100%", width: `${progressPercent}%`, background: "linear-gradient(90deg, #2dd4bf 0%, #14b8a6 100%)" }} />
						</div>
					</div>
					{currentMission?.prompt && (
						<p style={{ marginTop: 0, marginBottom: "0.55rem", color: "rgba(255,255,255,0.7)", fontSize: "0.86rem" }}>
							{observeHint}
						</p>
					)}

					<div style={{ marginBottom: draftDecision ? "0.6rem" : "0.45rem" }}>
						<label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{decisionLabel}</label>
						<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
							{decisionOptions.map((opt: string) => (
								<label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", lineHeight: 1.15 }}>
									<input
										type="radio"
										name="observation_log_decision"
										value={opt}
										checked={draftDecision === opt}
										onChange={(e) => updateDraft({ __observation_log_draft_decision: e.target.value })}
									/>
									<span style={{ fontSize: "0.92rem" }}>{opt}</span>
								</label>
							))}
						</div>
					</div>

					{draftDecision && (
						<div style={{ marginBottom: "0.6rem" }}>
							<label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{reflectionLabel}</label>
							<textarea
								value={draftReflection}
								onChange={(e) => updateDraft({ __observation_log_draft_reflection: e.target.value })}
								maxLength={reflectionMaxChars}
								placeholder={reflectionPlaceholder}
								style={{
									width: "100%",
									minHeight: "52px",
									padding: "0.45rem",
									backgroundColor: "#050712",
									color: "#f7f7ff",
									border: "1px solid rgba(81,145,162,0.5)",
									borderRadius: "4px",
									fontFamily: "inherit",
									fontSize: "0.92rem",
								}}
							/>
						</div>
					)}

					<button
						type="button"
						onClick={addLog}
						disabled={!draftDecision}
						style={{
							padding: "0.48rem 0.85rem",
							background: draftDecision ? "rgba(81,145,162,0.35)" : "rgba(81,145,162,0.15)",
							border: "1px solid rgba(81,145,162,0.6)",
							borderRadius: "4px",
							color: "#f7f7ff",
							fontWeight: 600,
							fontSize: "0.9rem",
							cursor: draftDecision ? "pointer" : "not-allowed",
						}}
					>
						{config?.submit_label || "Beobachtung speichern"}
					</button>
				</section>
			)}

			<section style={{ marginBottom: "0.4rem", padding: "0.85rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
					<h4 style={{ margin: 0 }}>Erfasste Beobachtungen</h4>
					<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>
						{logs.length}/{targetCount} erfasst
					</span>
				</div>

				<div style={{ display: "grid", gap: "0.4rem" }}>
					{logs.map((log: any, idx: number) => (
						<div key={idx} style={{ padding: "0.55rem 0.65rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", background: "rgba(255,255,255,0.03)" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.65rem" }}>
								<strong>{log?.mission_title || `Mission ${idx + 1}`}</strong>
								<button
									type="button"
									onClick={() => removeLog(idx)}
									style={{
										padding: "0.15rem 0.45rem",
										borderRadius: "4px",
										border: "1px solid rgba(255,255,255,0.2)",
										background: "transparent",
										color: "#f7f7ff",
										fontSize: "0.82rem",
										cursor: "pointer",
									}}
								>
									Entfernen
								</button>
							</div>
							<div style={{ marginTop: "0.25rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.73)", lineHeight: 1.35 }}>
								{decisionLabel}: {log?.[decisionKey] || "-"}
							</div>
							{log?.[reflectionKey] && (
								<div style={{ marginTop: "0.2rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.35 }}>
									{log[reflectionKey]}
								</div>
							)}
						</div>
					))}
				</div>

				{isComplete && (
					<p style={{ marginTop: "0.6rem", marginBottom: 0, color: "rgba(153,246,228,0.95)" }}>
						Drill abgeschlossen. Du kannst jetzt weitergehen.
					</p>
				)}
			</section>

			{drill.didactics?.learning_hint && (
				<p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.58)", whiteSpace: "pre-line" }}>
					{drill.didactics.learning_hint}
				</p>
			)}
		</div>
	);
}

function PressureDiagnosisCheckin({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const sampleFields = normalizeSampleFields(drill);
	const sampleKey = drill?.config?.sample_key || "pressure_samples";
	const checkinConfig = drill?.config?.checkin || {};
	const checkinKey = checkinConfig?.key || "dominant_source";
	const requiresCheckin = drill?.config?.enable_checkin !== false && drill?.config?.mode !== "decision_cause_diagnosis";
	const aggregateBy = drill?.config?.aggregate_by;
	const reflectionAlignmentKey = drill?.config?.reflection_alignment_key || "reflection_alignment";
	const totalsKey = drill?.config?.aggregation_totals_key || "pressure_totals";
	const observedDominantKey = drill?.config?.observed_dominant_key || "dominant_pressure_observed";
	const reflectionMessageKey = drill?.config?.reflection_message_key || "pressure_reflection";
	const requiredSamples = Number(drill?.config?.required_samples || drill?.config?.max_samples_per_phase || 3);
	const noteKey = drill?.config?.sample_note_key || "note";
	const noteLabel = drill?.config?.sample_note_label || "Kurze Notiz zur Situation (optional)";
	const noteMaxChars = drill?.config?.sample_note_max_chars || 240;
	const reflectionConfig = drill?.config?.reflection || {};
	const checkinLabel = checkinConfig?.label || "Welche Druckquelle war in diesem Drittel am haeufigsten entscheidend?";
	const phaseOneTitle = drill?.config?.phase1_title || "Phase 1 - Drucksituationen sammeln";
	const phaseOneDescription = drill?.config?.phase1_description || `Erfasse genau ${requiredSamples} Situationen aus dem Drittel. Erst danach folgt die Verdichtung.`;
	const aggregationLabel = drill?.config?.aggregation_label || "Interne Aggregation";

	const samples: any[] = Array.isArray(safeAnswers[sampleKey]) ? safeAnswers[sampleKey] : [];
	const pressureLabels = Object.fromEntries(sampleFields.map((field: any) => [field.key, field.label]));
	const isObservationMode = samples.length >= requiredSamples;
	const canAddMore = true;

	const defaultFormState = sampleFields.reduce((next: any, field: any) => {
		next[field.key] = "";
		return next;
	}, { [noteKey]: "" });

	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<any>(defaultFormState);

	const checkinOptions = Array.isArray(checkinConfig?.options) && checkinConfig.options.length > 0
		? checkinConfig.options
		: sampleFields.map((field: any) => ({ value: field.key, label: field.label }));
	const aggregation = computeSampleAggregation(samples, sampleFields, checkinOptions, aggregateBy);
	const observationMirror = Object.entries(aggregation.totals)
		.filter(([, count]) => Number(count) > 0)
		.sort((a, b) => Number(b[1]) - Number(a[1]) || String(a[0]).localeCompare(String(b[0])))
		.map(([key, count]) => ({ label: pressureLabels[key] || key, count: Number(count) }));
	const checkinSelection = safeAnswers[checkinKey] || "";
	const selectedCheckinOption = checkinOptions.find((opt: any) => opt?.value === checkinSelection);
	const selectedCheckinLabel = selectedCheckinOption?.label || "";
	const checkinKeyNormalized = checkinSelection || undefined;
	const reflectionAlignment =
		checkinKeyNormalized && checkinKeyNormalized === aggregation.dominantKey ? "match" : "mismatch";
	const dominantMessageTemplate = reflectionConfig?.dominant_template || "Deine drei Situationen wurden hauptsaechlich durch {aggregated} gepraegt.";
	const reflectionMatchText = reflectionConfig?.match_text || "Dein Gesamteindruck stimmt mit den beobachteten Situationen ueberein.";
	const reflectionMismatchTemplate = reflectionConfig?.mismatch_template || "Deine Situationen deuteten eher auf {aggregated} als auf {checkin} hin.";

	const dominantMessage = dominantMessageTemplate.replace("{aggregated}", aggregation.dominantLabel);

	const reflectionMessage =
		!checkinSelection
			? ""
			: reflectionAlignment === "match"
				? reflectionMatchText
				: reflectionMismatchTemplate
					.replace("{aggregated}", aggregation.dominantLabel)
					.replace("{checkin}", selectedCheckinLabel || checkinSelection);

	useEffect(() => {
		const shouldStoreReflection = requiresCheckin && !!checkinSelection;
		const shouldUpdateDerived =
			JSON.stringify(safeAnswers[totalsKey] || {}) !== JSON.stringify(aggregation.totals) ||
			safeAnswers[observedDominantKey] !== aggregation.dominantLabel ||
			safeAnswers[reflectionAlignmentKey] !== (shouldStoreReflection ? reflectionAlignment : undefined) ||
			safeAnswers[reflectionMessageKey] !== (shouldStoreReflection ? reflectionMessage : undefined) ||
			(!requiresCheckin && safeAnswers[checkinKey] !== undefined);

		if (!shouldUpdateDerived) return;

		const next = {
			...safeAnswers,
			[totalsKey]: aggregation.totals,
			[observedDominantKey]: aggregation.dominantLabel,
		};

		if (shouldStoreReflection) {
			next[reflectionAlignmentKey] = reflectionAlignment;
			next[reflectionMessageKey] = reflectionMessage;
		} else {
			delete next[reflectionAlignmentKey];
			delete next[reflectionMessageKey];
		}

		if (!requiresCheckin) {
			delete next[checkinKey];
		}

		setAnswers(next);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [samples, checkinSelection, requiresCheckin]);

	const updateForm = (key: string, value: string) => {
		setForm((prev: any) => ({ ...prev, [key]: value }));
	};

	const isSampleComplete = sampleFields.every((field: any) => !!form[field.key]);

	const addSample = () => {
		if (!isSampleComplete || !canAddMore) return;
		const nextSample = sampleFields.reduce((next: any, field: any) => {
			next[field.key] = form[field.key];
			return next;
		}, { [noteKey]: (form[noteKey] || "").trim() });
		setAnswers({
			...safeAnswers,
			[sampleKey]: [...samples, nextSample],
		});
		setForm(defaultFormState);
		setShowForm(false);
	};

	const removeSample = (index: number) => {
		const nextSamples = samples.filter((_, idx) => idx !== index);
		const nextAnswers: any = {
			...safeAnswers,
			[sampleKey]: nextSamples,
		};
		if (!requiresCheckin || nextSamples.length < requiredSamples) {
			delete nextAnswers[checkinKey];
		}
		setAnswers(nextAnswers);
	};

	const canRenderCheckin = requiresCheckin && samples.length >= requiredSamples;
	const focusLabel = drill?.config?.observation_focus || (requiresCheckin ? checkinConfig?.label : sampleFields?.[0]?.question) || "Muster erkennen";

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "1rem" }}>
					{drill.description}
				</p>
			)}
			<ObservationGuide drill={drill} />

			<section style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
				<h4 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#89c8da" }}>{phaseOneTitle}</h4>
				<p style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.76)" }}>
					{phaseOneDescription}
				</p>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.75rem", flexWrap: "wrap" }}>
					<button
						type="button"
						onClick={() => setShowForm((prev) => !prev)}
						disabled={!canAddMore}
						style={{
							padding: "0.55rem 0.95rem",
							background: "rgba(81,145,162,0.25)",
							border: "1px solid rgba(81,145,162,0.6)",
							borderRadius: "4px",
							color: "#f7f7ff",
							fontWeight: 600,
							cursor: canAddMore ? "pointer" : "not-allowed",
						}}
					>
						+ Situation
					</button>
					<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>
						{samples.length}/{requiredSamples} erfasst
					</span>
				</div>

				{isObservationMode && (
					<ObservationModeCard
						count={samples.length}
						target={requiredSamples}
						focus={focusLabel}
						mirror={observationMirror}
					/>
				)}

				{showForm && canAddMore && (
					<div style={{ marginBottom: "0.75rem", padding: "0.85rem", border: "1px solid rgba(81,145,162,0.45)", borderRadius: "6px", background: "rgba(81,145,162,0.08)" }}>
						{sampleFields.map((field: any) => (
							<div key={field.key} style={{ marginBottom: "0.85rem" }}>
								<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{field.label}</label>
								{field.question && <p style={{ marginTop: 0, marginBottom: "0.35rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>{field.question}</p>}
								<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
									{field.options.map((opt: any) => (
										<label key={optionValue(opt)} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
											<input
												type="radio"
												name={`${field.key}_sample`}
												value={optionValue(opt)}
												checked={form[field.key] === optionValue(opt)}
												onChange={(e) => updateForm(field.key, e.target.value)}
											/>
											<span>{optionLabel(opt)}</span>
										</label>
									))}
								</div>
							</div>
						))}

						<div style={{ marginBottom: "0.85rem" }}>
							<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{noteLabel}</label>
							<textarea
								value={form[noteKey] || ""}
								onChange={(e) => updateForm(noteKey, e.target.value)}
								maxLength={noteMaxChars}
								placeholder="Optional"
								style={{
									width: "100%",
									minHeight: "58px",
									padding: "0.5rem",
									backgroundColor: "#050712",
									color: "#f7f7ff",
									border: "1px solid rgba(81,145,162,0.5)",
									borderRadius: "4px",
									fontFamily: "inherit",
								}}
							/>
						</div>

						<button
							type="button"
							onClick={addSample}
							disabled={!isSampleComplete}
							style={{
								padding: "0.55rem 0.95rem",
								background: isSampleComplete ? "rgba(81,145,162,0.35)" : "rgba(81,145,162,0.15)",
								border: "1px solid rgba(81,145,162,0.6)",
								borderRadius: "4px",
								color: "#f7f7ff",
								fontWeight: 600,
								cursor: isSampleComplete ? "pointer" : "not-allowed",
							}}
						>
							Situation speichern
						</button>
					</div>
				)}

				<div style={{ display: "grid", gap: "0.5rem" }}>
					{samples.map((sample, idx) => (
						<div key={idx} style={{ padding: "0.65rem 0.75rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", background: "rgba(255,255,255,0.03)" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
								<strong>Situation {idx + 1}</strong>
								<button
									type="button"
									onClick={() => removeSample(idx)}
									style={{
										padding: "0.2rem 0.5rem",
										borderRadius: "4px",
										border: "1px solid rgba(255,255,255,0.2)",
										background: "transparent",
										color: "#f7f7ff",
										cursor: "pointer",
									}}
								>
									Entfernen
								</button>
							</div>
							<div style={{ marginTop: "0.35rem", fontSize: "0.83rem", color: "rgba(255,255,255,0.73)", lineHeight: 1.5 }}>
								{sampleFields.map((field: any) => {
									const selected = sample[field.key];
									const selectedOption = field.options?.find((opt: any) => optionValue(opt) === selected);
									return `${field.label}: ${selectedOption ? optionLabel(selectedOption) : selected || "-"}`;
								}).join(" | ")}
							</div>
						</div>
					))}
				</div>
			</section>

			{requiresCheckin && (
			<section style={{ marginBottom: "0.5rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Phase 2 - Period Check-in</h4>
				<p style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.76)" }}>
					{checkinLabel}
				</p>

				{canRenderCheckin ? (
					<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
						{checkinOptions.map((option: any) => (
							<label key={option.value} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
								<input
									type="radio"
									name="dominant_pressure_source"
									value={option.value}
									checked={checkinSelection === option.value}
									onChange={(e) => setAnswers({ ...safeAnswers, [checkinKey]: e.target.value })}
								/>
								<span>{option.label}</span>
							</label>
						))}
					</div>
				) : (
					<p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,215,140,0.92)" }}>
						Der Check-in wird freigeschaltet, sobald mindestens {requiredSamples} Situationen erfasst sind.
					</p>
				)}
			</section>
			)}

			{requiresCheckin && checkinSelection && (
				<section style={{ marginTop: "0.85rem", padding: "0.9rem 1rem", borderRadius: "6px", background: "rgba(81,145,162,0.12)", border: "1px solid rgba(81,145,162,0.4)" }}>
					<h4 style={{ marginTop: 0, marginBottom: "0.45rem", color: "#89c8da" }}>Reflexionsmoment</h4>
					<p style={{ marginTop: 0, marginBottom: "0.55rem" }}>
						{dominantMessage}
					</p>
					<p style={{ marginTop: 0, marginBottom: "0.4rem" }}>{reflectionMessage}</p>
					<p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.55)" }}>
						{aggregationLabel}: {Object.entries(aggregation.totals).map(([key, value]) => {
							const label = checkinOptions.find((option: any) => option.value === key)?.label || sampleFields.find((field: any) => field.key === key)?.label || key;
							return `${label} ${value}`;
						}).join(", ")}
					</p>
				</section>
			)}

			{drill.didactics?.learning_hint && (
				<p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.58)", whiteSpace: "pre-line" }}>
					{drill.didactics.learning_hint}
				</p>
			)}
		</div>
	);
}


// ----------------------------- PERIOD CHECKIN -----------------------------
function PeriodCheckin({ drill, answers, setAnswers }: any) {
	const questions = drill?.config?.questions || [];
	const safeAnswers = answers || {};

	// Cleanup: remove stale answers when conditional options change
	const controllers = questions
		.map((q: any) => q.conditional_options ? Object.keys(q.conditional_options)[0] : null)
		.filter(Boolean);
	const signature = controllers.map((k: string) => `${k}:${safeAnswers?.[k] ?? ''}`).join('|');

	useEffect(() => {
		const next = { ...safeAnswers };
		let changed = false;

		for (const q of questions) {
			if (!q.conditional_options) continue;
			const controllerKey = Object.keys(q.conditional_options)[0];
			if (!controllerKey) continue;
			const controllerValue = safeAnswers?.[controllerKey];
			const effectiveOptions = q.conditional_options?.[controllerKey]?.[controllerValue] || q.options || [];
			const currentValue = next[q.key];

			if (Array.isArray(effectiveOptions) && effectiveOptions.length === 0) {
				if (currentValue !== undefined) {
					delete next[q.key];
					changed = true;
				}
				continue;
			}

			if (q.type === "multi_select") {
				if (Array.isArray(currentValue)) {
					const filtered = currentValue.filter((v: string) => effectiveOptions.includes(v));
					if (filtered.length !== currentValue.length) {
						if (filtered.length > 0) next[q.key] = filtered;
						else delete next[q.key];
						changed = true;
					}
				} else if (currentValue !== undefined) {
					delete next[q.key];
					changed = true;
				}
				continue;
			}

			if (currentValue && Array.isArray(effectiveOptions) && !effectiveOptions.includes(currentValue)) {
				delete next[q.key];
				changed = true;
			}
		}

		if (changed) setAnswers(next);
	}, [signature, drill?.id]); // eslint-disable-line react-hooks/exhaustive-deps
	
	const glossary = drill?.didactics?.glossary;
	const focusText = drill?.didactics?.focus_text || drill?.description;
	const guidingQuestions = Array.isArray(drill?.didactics?.guiding_questions)
		? drill.didactics.guiding_questions
		: [];
	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{focusText && (
				<p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "1rem", wordWrap: "break-word", overflowWrap: "break-word" }}>
					{focusText}
				</p>
			)}
			{guidingQuestions.length > 0 && (
				<section style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.14)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#89c8da" }}>Leitfragen</h4>
					<ul style={{ marginTop: "0.5rem", marginBottom: 0, paddingLeft: 18 }}>
						{guidingQuestions.map((item: string, idx: number) => (
							<li key={idx}>{renderWithGlossary(item)}</li>
						))}
					</ul>
				</section>
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
			{guidingQuestions.length === 0 && <ObservationGuide drill={drill} />}
			{questions.map((q: any) => {
				const controllerKey = q.conditional_options ? Object.keys(q.conditional_options)[0] : null;
				const controllerValue = controllerKey ? safeAnswers?.[controllerKey] : undefined;
				const effectiveOptions = q.conditional_options && controllerKey
					? q.conditional_options?.[controllerKey]?.[controllerValue] || []
					: q.options || [];
				const hasConditionalOptions = !!q.conditional_options;
				const shouldRenderQuestion = !hasConditionalOptions || !Array.isArray(effectiveOptions) || effectiveOptions.length > 0;

				if (!shouldRenderQuestion) {
					return null;
				}

				return (
				<div key={q.key} style={{ marginBottom: "1rem" }}>
					<label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>{q.label}</label>
					{q.type === "radio" && Array.isArray(effectiveOptions) && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
							{effectiveOptions.map((opt: string) => {
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
												checked={safeAnswers[q.key] === opt}
												onChange={(e) => setAnswers({ ...safeAnswers, [q.key]: e.target.value })}
											/>
											<span style={{ textTransform: "none" }}>
												{highlightGlossaryTerms(formatOptionText(opt), glossary)}
											</span>
										</span>
										{explanation && (
											<span style={{ fontSize: "0.85em", color: "#aaa", marginLeft: 24 }}>{explanation}</span>
										)}
									</label>
								);
							})}
						</div>
					)}
					{q.type === "select" && Array.isArray(effectiveOptions) && (
						<select
							className="appSelect"
							value={safeAnswers[q.key] || ""}
							onChange={(e) => setAnswers({ ...safeAnswers, [q.key]: e.target.value })}
							style={{ width: "100%" }}
						>
							<option value="">Bitte auswählen</option>
							{effectiveOptions.map((opt: string) => (
								<option key={opt} value={opt}>
										{opt}
								</option>
							))}
						</select>
					)}
					{q.type === "multi_select" && Array.isArray(effectiveOptions) && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
							{effectiveOptions.map((opt: string) => {
								const currentValues = Array.isArray(safeAnswers[q.key]) ? safeAnswers[q.key] : [];
								const checked = currentValues.includes(opt);
								return (
									<label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<input
											type="checkbox"
											checked={checked}
											onChange={(e) => {
												const nextValues = e.target.checked
													? [...currentValues, opt]
													: currentValues.filter((v: string) => v !== opt);
												const nextAnswers = { ...safeAnswers };
												if (nextValues.length > 0) nextAnswers[q.key] = nextValues;
												else delete nextAnswers[q.key];
												setAnswers(nextAnswers);
											}}
										/>
										{highlightGlossaryTerms(formatOptionText(opt), glossary)}
									</label>
								);
							})}
						</div>
					)}
					{q.type === "text" && (
						<textarea
							value={safeAnswers[q.key] || ""}
							onChange={(e) => setAnswers({ ...safeAnswers, [q.key]: e.target.value })}
							maxLength={q.max_chars || 1500}
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
				);
			})}
			{drill.didactics?.learning_hint && (
				<p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.58)", whiteSpace: "pre-line" }}>
					{drill.didactics.learning_hint}
				</p>
			)}
		</div>
	);
}


// -------------------------------- SAMPLE LOG --------------------------------
function SampleLog({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const sampleKey: string = drill?.config?.sample_key || "samples";
	const sampleLabel: string = drill?.config?.sample_label || "Sample";
	const targetSamples: number = Number(drill?.config?.required_samples || drill?.config?.max_samples_per_phase || 3);
	const stateKey: string = drill?.config?.state_key || "state";
	const stateLabel: string = drill?.config?.state_label || "Support";
	const factorKey: string = drill?.config?.factor_key || "factor";
	const factorLabel: string = drill?.config?.factor_label || "Hauptfaktor";
	const qualityKey: string | undefined = drill?.config?.quality_key;
	const qualityLabel: string = drill?.config?.quality_label || "Qualität";
	const qualityOptions: string[] = Array.isArray(drill?.config?.quality_options) ? drill.config.quality_options : [];
	const noteKey: string = drill?.config?.note_key || "note";
	const noteLabel: string = drill?.config?.note_label || "Notiz (optional)";
	const noteMaxChars: number = drill?.config?.note_max_chars || 120;
	const stateOptions: string[] = Array.isArray(drill?.config?.state_options) ? drill.config.state_options : [];
	const factorsByState: Record<string, string[]> = drill?.config?.factors_by_state || {};

	const samples: Record<string, string>[] = Array.isArray(safeAnswers[sampleKey]) ? safeAnswers[sampleKey] : [];
	const selectedSampleIndex = Number.isInteger(safeAnswers.selected_sample_index)
		? safeAnswers.selected_sample_index
		: Math.max(0, samples.length - 1);

	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<Record<string, string>>({
		[stateKey]: "",
		[factorKey]: "",
		...(qualityKey ? { [qualityKey]: "" } : {}),
		[noteKey]: "",
	});

	const currentState = form[stateKey] || "";
	const factorOptions = factorsByState[currentState] || [];
	const observationMirror = buildObservationMirror(samples, stateKey);
	const isObservationMode = samples.length >= targetSamples;
	const canAddMore = true;

	const resetForm = () => {
		setForm({
			[stateKey]: "",
			[factorKey]: "",
			...(qualityKey ? { [qualityKey]: "" } : {}),
			[noteKey]: "",
		});
	};

	const addSample = () => {
		if (!form[stateKey] || !form[factorKey]) return;
		if (qualityKey && qualityOptions.length > 0 && !form[qualityKey]) return;

		const nextSamples = [
			...samples,
			{
				[stateKey]: form[stateKey],
				[factorKey]: form[factorKey],
				...(qualityKey ? { [qualityKey]: form[qualityKey] || "" } : {}),
				[noteKey]: (form[noteKey] || "").trim(),
			},
		];

		setAnswers({
			...safeAnswers,
			[sampleKey]: nextSamples,
			selected_sample_index: nextSamples.length - 1,
		});
		resetForm();
		setShowForm(false);
	};

	const deleteSample = (idx: number) => {
		const nextSamples = samples.filter((_: Record<string, string>, i: number) => i !== idx);
		const nextSelected = nextSamples.length === 0 ? undefined : Math.min(selectedSampleIndex, nextSamples.length - 1);
		const nextAnswers: any = { ...safeAnswers, [sampleKey]: nextSamples };
		if (nextSelected === undefined) {
			delete nextAnswers.selected_sample_index;
		} else {
			nextAnswers.selected_sample_index = nextSelected;
		}
		setAnswers(nextAnswers);
	};

	const updateFormField = (key: string, value: string) => {
		if (key === stateKey) {
			setForm(prev => ({ ...prev, [stateKey]: value, [factorKey]: "" }));
			return;
		}
		setForm(prev => ({ ...prev, [key]: value }));
	};

	const selectedSummary = samples[selectedSampleIndex];

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.78)", marginBottom: "0.75rem" }}>{drill.description}</p>
			)}
			<ObservationGuide drill={drill} />

			<div style={{ marginBottom: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={() => setShowForm(prev => !prev)}
					disabled={!canAddMore}
					style={{
						padding: "0.55rem 0.95rem",
						background: "rgba(81,145,162,0.25)",
						border: "1px solid rgba(81,145,162,0.6)",
						borderRadius: "4px",
						color: "#f7f7ff",
						fontWeight: 600,
						cursor: canAddMore ? "pointer" : "not-allowed",
					}}
				>
					+ {sampleLabel}
				</button>
				<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>
					{samples.length}/{targetSamples} erfasst
				</span>
			</div>

			{isObservationMode && (
				<ObservationModeCard
					count={samples.length}
					target={targetSamples}
					focus={drill?.config?.observation_focus || stateLabel}
					mirror={observationMirror}
				/>
			)}

			{showForm && canAddMore && (
				<div style={{ marginBottom: "1rem", padding: "0.85rem", border: "1px solid rgba(81,145,162,0.45)", borderRadius: "6px", background: "rgba(81,145,162,0.08)" }}>
					<div style={{ marginBottom: "0.75rem" }}>
						<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{stateLabel}</label>
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
							{stateOptions.map((opt: string) => (
								<label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
									<input
										type="radio"
										name={`${drill.id}_${stateKey}`}
										value={opt}
										checked={form[stateKey] === opt}
										onChange={e => updateFormField(stateKey, e.target.value)}
									/>
									<span>{opt}</span>
								</label>
							))}
						</div>
					</div>

					<div style={{ marginBottom: "0.75rem" }}>
						<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{factorLabel}</label>
						<select
							className="appSelect"
							value={form[factorKey]}
							onChange={e => updateFormField(factorKey, e.target.value)}
							disabled={!currentState}
							style={{ width: "100%" }}
						>
							<option value="">{currentState ? `${factorLabel} wählen` : `Zuerst ${stateLabel} wählen`}</option>
							{factorOptions.map((opt: string) => (
								<option key={opt} value={opt}>{opt}</option>
							))}
						</select>
					</div>

					{qualityKey && qualityOptions.length > 0 && (
						<div style={{ marginBottom: "0.75rem" }}>
							<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{qualityLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
								{qualityOptions.map((opt: string) => (
									<label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
										<input
											type="radio"
											name={`${drill.id}_${qualityKey}`}
											value={opt}
											checked={form[qualityKey] === opt}
											onChange={e => updateFormField(qualityKey, e.target.value)}
										/>
										<span>{opt}</span>
									</label>
								))}
							</div>
						</div>
					)}

					<div style={{ marginBottom: "0.75rem" }}>
						<label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>{noteLabel}</label>
						<input
							type="text"
							value={form[noteKey]}
							onChange={e => updateFormField(noteKey, e.target.value)}
							maxLength={noteMaxChars}
							placeholder="Sehr kurz"
							style={{
								width: "100%",
								padding: "0.45rem 0.55rem",
								backgroundColor: "#050712",
								color: "#f7f7ff",
								border: "1px solid rgba(81,145,162,0.5)",
								borderRadius: "4px",
							}}
						/>
					</div>

					<div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end" }}>
						<button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: "0.35rem 0.65rem" }}>
							Abbrechen
						</button>
						<button
							type="button"
							onClick={addSample}
							disabled={!form[stateKey] || !form[factorKey] || !!(qualityKey && qualityOptions.length > 0 && !form[qualityKey])}
							style={{ padding: "0.35rem 0.7rem", fontWeight: 600 }}
						>
							Speichern
						</button>
					</div>
				</div>
			)}

			{samples.length > 0 && (
				<div>
					<div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.42)", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
						Gespeicherte {sampleLabel}-Momente
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
						{samples.map((sample: Record<string, string>, idx: number) => {
							const isSelected = idx === selectedSampleIndex;
							return (
								<div
									key={idx}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: "0.6rem",
										padding: "0.45rem 0.6rem",
										borderRadius: "4px",
										border: isSelected ? "1px solid rgba(81,145,162,0.55)" : "1px solid rgba(255,255,255,0.08)",
										background: isSelected ? "rgba(81,145,162,0.14)" : "rgba(255,255,255,0.04)",
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" }}>
											<strong>{sample[stateKey]}</strong> · {sample[factorKey]}
											{qualityKey && sample[qualityKey] ? ` · ${sample[qualityKey]}` : ""}
										</div>
										{sample[noteKey] && (
											<div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.84rem", marginTop: "0.1rem" }}>
												{sample[noteKey]}
											</div>
										)}
									</div>
									<div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
										<button
											type="button"
											onClick={() => setAnswers({ ...safeAnswers, selected_sample_index: idx })}
											style={{
												padding: "0.2rem 0.5rem",
												fontSize: "0.8rem",
												borderRadius: "4px",
												border: "1px solid rgba(255,255,255,0.18)",
												background: "transparent",
												color: "rgba(255,255,255,0.76)",
											}}
										>
											{isSelected ? "Aktiv" : "Als Moment"}
										</button>
										<button
											type="button"
											onClick={() => deleteSample(idx)}
											style={{
												padding: "0.2rem 0.5rem",
												fontSize: "0.8rem",
												borderRadius: "4px",
												border: "1px solid rgba(255,120,120,0.35)",
												background: "transparent",
												color: "rgba(255,150,150,0.88)",
											}}
										>
											Löschen
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{selectedSummary && (
				<p style={{ marginTop: "0.9rem", marginBottom: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.56)" }}>
					Microfeedback bezieht sich auf den aktiven Moment: {selectedSummary[stateKey]} · {selectedSummary[factorKey]}{qualityKey && selectedSummary[qualityKey] ? ` · ${selectedSummary[qualityKey]}` : ""}.
				</p>
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
							{formatOptionText(opt)}
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
														{highlightGlossaryTerms(formatOptionText(opt), glossary)}
													</label>
												))}
											</div>
										)}
										{q.type === "text" && (
											<textarea
												value={answers[key] || ""}
												onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
												maxLength={q.max_chars || 1500}
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
											{formatOptionText(opt)}
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
								maxLength={q.max_chars || 1500}
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
										{formatOptionText(opt)}
									</label>
								))}
							</div>
						)}
						{q.type === "text" && (
							<input
								type="text"
								value={answers[q.key] || ""}
								onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
								maxLength={q.max_chars || 1500}
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

// -------------------------------- EVENT LOG --------------------------------
function EventLog({ drill, answers, setAnswers }: any) {
	const eventKey: string = drill?.config?.event_key || "events";
	const eventLabel: string = drill?.config?.event_label || "Event";
	const fields: any[] = drill?.config?.fields || [];

	const emptyForm = () => fields.reduce((acc: any, f: any) => ({ ...acc, [f.key]: "" }), {});

	const [form, setForm] = useState<Record<string, string>>(emptyForm);
	const [editIndex, setEditIndex] = useState<number | null>(null);

	const legacyFallbackEvents: Record<string, string>[] =
		eventKey === "puck_win_events" && Array.isArray(answers?.turnover_events)
			? answers.turnover_events
			: [];
	const events: Record<string, string>[] = answers[eventKey] || legacyFallbackEvents;

	const getOptionsForField = (field: any, currentForm: Record<string, string>) => {
		if (Array.isArray(field.options)) return field.options;
		if (field.options_by_value_of && typeof field.options_by_value_of === "object") {
			const controllerKey = Object.keys(field.options_by_value_of)[0];
			if (!controllerKey) return [];
			const optionsMap = field.options_by_value_of[controllerKey] || {};
			const controllerValue = currentForm[controllerKey];
			return optionsMap[controllerValue] || [];
		}
		return [];
	};

	const sanitizeDependentSelects = (nextForm: Record<string, string>) => {
		const sanitized = { ...nextForm };
		for (const f of fields) {
			if (f.type !== "select") continue;
			const validOptions = getOptionsForField(f, sanitized);
			if (sanitized[f.key] && !validOptions.includes(sanitized[f.key])) {
				sanitized[f.key] = "";
			}
		}
		return sanitized;
	};

	const handleFieldChange = (key: string, value: string) => {
		setForm(prev => {
			const next = { ...prev, [key]: value };
			return sanitizeDependentSelects(next);
		});
	};

	const handleSave = () => {
		// alle non-optional select-Felder müssen ausgefüllt sein
		const missing = fields.filter((f: any) => f.type === "select" && !f.optional && !form[f.key]);
		if (missing.length > 0) return;

		const newEvents = [...events];
		if (editIndex !== null) {
			newEvents[editIndex] = { ...form };
			setEditIndex(null);
		} else {
			newEvents.push({ ...form });
		}
		setAnswers({ ...answers, [eventKey]: newEvents });
		setForm(emptyForm());
	};

	const handleEdit = (idx: number) => {
		setForm(sanitizeDependentSelects({ ...events[idx] }));
		setEditIndex(idx);
	};

	const handleDelete = (idx: number) => {
		const newEvents = events.filter((_: any, i: number) => i !== idx);
		setAnswers({ ...answers, [eventKey]: newEvents });
		if (editIndex === idx) {
			setEditIndex(null);
			setForm(emptyForm());
		}
	};

	const handleCancelEdit = () => {
		setEditIndex(null);
		setForm(emptyForm());
	};

	// Format option: convert snake_case to readable text
	const shortLabel = (ev: Record<string, string>) => {
		const selectParts = fields
			.filter((f: any) => f.type === "select")
			.map((f: any) => (ev[f.key] ? formatOptionText(ev[f.key]) : "—"))
			.join(" · ");
		const noteField = fields.find((f: any) => f.type === "text");
		const note = noteField && ev[noteField.key] ? ` – ${ev[noteField.key]}` : "";
		return selectParts + note;
	};

	const selectStyle: React.CSSProperties = {
		padding: "0.4rem 0.5rem",
		backgroundColor: "#050712",
		color: "#f7f7ff",
		border: "1px solid rgba(81,145,162,0.5)",
		borderRadius: "4px",
		fontSize: "1rem",
		minWidth: 0,
		flex: "1 1 80px",
	};

	const textStyle: React.CSSProperties = {
		padding: "0.4rem 0.5rem",
		backgroundColor: "#050712",
		color: "#f7f7ff",
		border: "1px solid rgba(81,145,162,0.5)",
		borderRadius: "4px",
		fontSize: "1rem",
		flex: "2 1 120px",
		minWidth: 0,
	};

	const btnPrimary: React.CSSProperties = {
		padding: "0.45rem 0.9rem",
		background: "rgba(81,145,162,0.25)",
		border: "1px solid rgba(81,145,162,0.6)",
		borderRadius: "4px",
		color: "#f7f7ff",
		fontWeight: 600,
		cursor: "pointer",
		fontSize: "0.95rem",
		whiteSpace: "nowrap",
	};

	const btnSmall: React.CSSProperties = {
		padding: "0.2rem 0.5rem",
		background: "transparent",
		border: "1px solid rgba(255,255,255,0.15)",
		borderRadius: "4px",
		color: "rgba(255,255,255,0.6)",
		cursor: "pointer",
		fontSize: "0.85rem",
		lineHeight: "1.4",
	};

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.75rem" }}>
					{drill.description}
				</p>
			)}
			{drill.didactics?.goal && (
				<p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", marginBottom: "0.4rem" }}>
					<strong>Ziel:</strong> {drill.didactics.goal}
				</p>
			)}
			{drill.didactics?.why_it_matters && (
				<p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", marginBottom: "0.75rem" }}>
					<strong>Warum das wichtig ist:</strong> {drill.didactics.why_it_matters}
				</p>
			)}
			{drill.didactics?.explanation && (
				<div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>Drill-Erklärung</h4>
					<div style={{ whiteSpace: "pre-line", fontSize: "0.9rem" }}>{renderWithGlossary(drill.didactics.explanation)}</div>
				</div>
			)}
			<ObservationGuide drill={drill} />

			{/* Inline-Form */}
			<div style={{ marginBottom: "0.75rem" }}>
				<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
					{fields.map((f: any) => (
						f.type === "select" ? (
							(() => {
								const options = getOptionsForField(f, form);
								const disabled = options.length === 0;
								return (
							<select
								key={f.key}
								value={form[f.key]}
								onChange={e => handleFieldChange(f.key, e.target.value)}
								className="appSelect"
								style={selectStyle}
								aria-label={f.label}
								disabled={disabled}
							>
								<option value="">{f.label}…</option>
								{options.map((opt: string) => (
									<option key={opt} value={opt}>{formatOptionText(opt)}</option>
								))}
							</select>
								);
							})()
						) : (
							<input
								key={f.key}
								type="text"
								value={form[f.key]}
								onChange={e => handleFieldChange(f.key, e.target.value)}
								placeholder={f.label + (f.optional ? " (optional)" : "")}
								maxLength={f.max_chars || 150}
								style={textStyle}
								aria-label={f.label}
							/>
						)
					))}
					<button type="button" onClick={handleSave} style={btnPrimary}>
						{editIndex !== null ? "✓ Speichern" : `+ ${eventLabel}`}
					</button>
					{editIndex !== null && (
						<button type="button" onClick={handleCancelEdit} style={btnSmall}>
							Abbrechen
						</button>
					)}
				</div>
			</div>

			{/* Event-Liste */}
			{events.length > 0 && (
				<div>
					<div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
						{events.length} {events.length === 1 ? eventLabel : `${eventLabel}s`}
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
						{events.map((ev: Record<string, string>, idx: number) => (
							<div
								key={idx}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									padding: "0.4rem 0.6rem",
									background: editIndex === idx
										? "rgba(81,145,162,0.18)"
										: "rgba(255,255,255,0.04)",
									border: editIndex === idx
										? "1px solid rgba(81,145,162,0.5)"
										: "1px solid rgba(255,255,255,0.07)",
									borderRadius: "4px",
									fontSize: "0.9rem",
									gap: "0.5rem",
								}}
							>
								<span style={{ flex: 1, color: "rgba(255,255,255,0.85)" }}>
									{shortLabel(ev)}
								</span>
								<div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
									<button type="button" onClick={() => handleEdit(idx)} style={btnSmall} title="Bearbeiten">✏</button>
									<button type="button" onClick={() => handleDelete(idx)} style={{ ...btnSmall, color: "rgba(255,100,100,0.7)" }} title="Löschen">×</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{drill.didactics?.learning_hint && (
				<div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "rgba(81,145,162,0.05)", borderRadius: "4px" }}>
					<h4 style={{ marginTop: 0, color: "#5191a2" }}>🧠 Lernhinweis</h4>
					<p style={{ fontStyle: "italic", whiteSpace: "pre-line", margin: 0 }}>{drill.didactics.learning_hint}</p>
				</div>
			)}
		</div>
	);
}
