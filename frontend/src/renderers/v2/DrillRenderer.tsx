// ✅ ACTIVE: Renderer v2 for A2+ (UI-only, no Buttons, no API, no onComplete)

import { useEffect, useState } from "react";
import type { Drill } from "../../api";
import { renderWithGlossary, highlightGlossaryTerms } from "../../components/GlossaryTerm";

interface DrillRendererV2Props {
  drill: Drill;
  answers: any;
  setAnswers: (next: any) => void;
}

// Helper: Format snake_case to readable text (e.g., "raum_offen" → "Raum Offen")
function formatOptionText(text: string): string {
	if (!text) return text;
	return text
		.replace(/_/g, " ")
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
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
					{Array.isArray(observationGuide) && observationGuide.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<ul style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
								{observationGuide.map((item: string, i: number) => (
									<li key={i}>{renderWithGlossary(item, didactics.glossary)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.what_to_watch) && observationGuide.what_to_watch.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Worauf achten?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.what_to_watch.map((item: string, i: number) => (
									<li key={i}>{renderWithGlossary(item, didactics.glossary)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.how_to_decide) && observationGuide.how_to_decide.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Wie entscheiden?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.how_to_decide.map((item: string, i: number) => (
									<li key={i}>{renderWithGlossary(item, didactics.glossary)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.common_mistakes) && observationGuide.common_mistakes.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Typische Denkfehler</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.common_mistakes.map((item: string, i: number) => (
									<li key={i}>{renderWithGlossary(item, didactics.glossary)}</li>
								))}
							</ul>
						</div>
					)}

					{Array.isArray(observationGuide.ignore) && observationGuide.ignore.length > 0 && (
						<div style={{ marginBottom: "1rem" }}>
							<strong>Was ignorieren?</strong>
							<ul style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
								{observationGuide.ignore.map((item: string, i: number) => (
									<li key={i}>{renderWithGlossary(item, didactics.glossary)}</li>
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

export default function DrillRendererV2({ drill, answers, setAnswers }: DrillRendererV2Props) {
	switch (drill.drill_type) {
		case "period_checkin":
			return <PeriodCheckin drill={drill} answers={answers} setAnswers={setAnswers} />;
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
											{highlightGlossaryTerms(formatOptionText(opt), glossary)}
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
									{formatOptionText(opt)}
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
	const maxSamples: number = drill?.config?.max_samples_per_phase || 3;
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
	const canAddMore = samples.length < maxSamples;

	const resetForm = () => {
		setForm({
			[stateKey]: "",
			[factorKey]: "",
			...(qualityKey ? { [qualityKey]: "" } : {}),
			[noteKey]: "",
		});
	};

	const addSample = () => {
		if (!canAddMore) return;
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
					{samples.length}/{maxSamples} erfasst
				</span>
			</div>

			{!canAddMore && (
				<p style={{ marginTop: 0, marginBottom: "0.85rem", fontSize: "0.82rem", color: "rgba(255,215,140,0.9)" }}>
					Maximum erreicht: Bitte bei maximal {maxSamples} Beobachtungen pro Drittel bleiben.
				</p>
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
