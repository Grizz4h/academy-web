// ✅ ACTIVE: Renderer v2 for A2+ (UI-only, no Buttons, no API, no onComplete)

import { useEffect, useMemo, useRef, useState } from "react";
import type { Drill } from "../../api";
import { renderWithGlossary, makeGlossaryRenderer, highlightGlossaryTerms } from "../../components/GlossaryTerm";

interface DrillRendererV2Props {
  drill: Drill;
  answers: any;
  setAnswers: (next: any) => void;
	session?: any;
	phase?: string;
}

const DEFAULT_5V5_BASE_FORMATION_RIGHT = [
	{ value: "LW", label: "LW", start_x: 0.62, start_y: 0.32 },
	{ value: "RW", label: "RW", start_x: 0.62, start_y: 0.68 },
	{ value: "C", label: "C", start_x: 0.48, start_y: 0.50 },
	{ value: "LD", label: "LD", start_x: 0.30, start_y: 0.38 },
	{ value: "RD", label: "RD", start_x: 0.30, start_y: 0.62 },
];

const PERSPECTIVE_ROLE_SWAP: Record<string, string> = {
	LW: "RW",
	RW: "LW",
	LD: "RD",
	RD: "LD",
	C: "C",
};

function getFormationPreset(preset: string) {
	if (preset === "5v5_default") return DEFAULT_5V5_BASE_FORMATION_RIGHT;
	return DEFAULT_5V5_BASE_FORMATION_RIGHT;
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
			className="nested-section mobile-flatten observation-guide-section"
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

export default function DrillRendererV2({ drill, answers, setAnswers, session, phase }: DrillRendererV2Props) {
	switch (drill.drill_type) {
		case "rink_corridor_observation":
		case "rink_segmented_zone_observation":
			return <RinkSegmentedZoneObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "rink_zone_priority_observation":
			return <RinkZonePriorityObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "paintable_rink_observation":
			return <PaintableRinkObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "draggable_rink_observation":
			return <DraggableRinkObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} session={session} phase={phase} />;
		case "clickable_rink_observation":
			return <DraggableRinkObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} session={session} phase={phase} />;
		case "observation_log_drill":
		case "impact_classification_observation":
		case "support_classification_observation":
		case "sequence_classification_observation":
			return <ObservationLogDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
		case "pattern_reflection_observation":
			return <PatternReflectionObservationDrill drill={drill} answers={answers} setAnswers={setAnswers} />;
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

type PaintPoint = { x: number; y: number };
type PaintAnnotation = { layerId: string; points: PaintPoint[] };
type PaintLayer = { id: string; label: string; color: string };
type RinkOverlays = {
	zones: boolean;
	goals: boolean;
	crease: boolean;
	faceoffDots: boolean;
	labels: boolean;
	defendingSide: "left" | "right";
	showDefendingHint: boolean;
};

const DEFAULT_PAINT_LAYERS: Record<string, PaintLayer[]> = {
	free_annotation: [
		{ id: "annotation", label: "Annotation", color: "#38bdf8" },
	],
	zone_priority: [
		{ id: "protected_space", label: "Geschuetzter Raum", color: "#22c55e" },
		{ id: "danger_space", label: "Gefaehrlicher Raum", color: "#ef4444" },
		{ id: "accepted_space", label: "Bewusst zugelassener Raum", color: "#facc15" },
	],
};

function clamp01(value: number) {
	return Math.max(0, Math.min(1, value));
}

function normalizePaintLayers(mode: string, config: any): PaintLayer[] {
	const source = Array.isArray(config?.paintLayers)
		? config.paintLayers
		: Array.isArray(config?.paint_layers)
			? config.paint_layers
			: [];

	if (source.length > 0) {
		return source
			.map((layer: any, idx: number) => ({
				id: String(layer?.id || `layer_${idx + 1}`),
				label: String(layer?.label || layer?.id || `Layer ${idx + 1}`),
				color: String(layer?.color || ["#22c55e", "#ef4444", "#facc15", "#38bdf8"][idx % 4]),
			}))
			.filter((layer: PaintLayer) => !!layer.id);
	}

	return DEFAULT_PAINT_LAYERS[mode] || DEFAULT_PAINT_LAYERS.free_annotation;
}

/** Shared visual markings for the detailed 900×620 hockey rink (interaction-agnostic). */
const DETAILED_HOCKEY_RINK_PRESET: Partial<RinkOverlays> = {
	zones: true,
	goals: true,
	crease: true,
	faceoffDots: true,
	labels: false,
	defendingSide: "left",
	showDefendingHint: false,
};

function wantsDetailedHockeyRink(mode: string, config: any): boolean {
	const presetName = String(config?.rink_preset || config?.rinkPreset || "");
	if (presetName === "detailed") return true;
	return mode === "defensive_structure" || mode === "formation_shift" || mode === "single_marker_observation";
}

function normalizeRinkOverlays(mode: string, config: any): RinkOverlays {
	const source = config?.rinkOverlays || config?.rink_overlays || {};
	const presetName = String(config?.rink_preset || config?.rinkPreset || "");
	const modeDefaults: Record<string, Partial<RinkOverlays>> = {
		free_annotation: {
			zones: false,
			goals: false,
			crease: false,
			faceoffDots: false,
			labels: false,
			defendingSide: "left",
			showDefendingHint: false,
		},
		zone_priority: {
			zones: true,
			goals: true,
			crease: true,
			faceoffDots: true,
			labels: false,
			defendingSide: "left",
			showDefendingHint: true,
		},
		detailed: { ...DETAILED_HOCKEY_RINK_PRESET },
		segmented_zone_selection: {
			zones: true,
			goals: true,
			crease: true,
			faceoffDots: true,
			labels: false,
			defendingSide: "left",
			showDefendingHint: false,
		},
		corridor_selection: {
			zones: true,
			goals: true,
			crease: true,
			faceoffDots: true,
			labels: false,
			defendingSide: "left",
			showDefendingHint: false,
		},
	};

	const defaults = (presetName === "detailed" ? modeDefaults.detailed : null)
		|| modeDefaults[mode]
		|| modeDefaults.free_annotation;
	const defendingSide = (source?.defendingSide || source?.defending_side || defaults.defendingSide || "left") === "right" ? "right" : "left";

	return {
		zones: source?.zones ?? defaults.zones ?? false,
		goals: source?.goals ?? source?.goal ?? defaults.goals ?? false,
		crease: source?.crease ?? source?.creases ?? defaults.crease ?? false,
		faceoffDots: source?.faceoffDots ?? source?.faceoff_dots ?? source?.faceoffCircles ?? source?.faceoff_circles ?? defaults.faceoffDots ?? false,
		labels: source?.labels ?? source?.zoneLabels ?? source?.zone_labels ?? defaults.labels ?? false,
		defendingSide,
		showDefendingHint: source?.showDefendingHint ?? source?.show_defending_hint ?? defaults.showDefendingHint ?? false,
	};
}

function buildSvgPath(points: PaintPoint[], width: number, height: number): string {
	if (!Array.isArray(points) || points.length === 0) return "";
	const [first, ...rest] = points;
	const start = `M ${Math.round(first.x * width)} ${Math.round(first.y * height)}`;
	if (rest.length === 0) return start;
	const segments = rest.map((point) => `L ${Math.round(point.x * width)} ${Math.round(point.y * height)}`).join(" ");
	return `${start} ${segments}`;
}

function mergePointIntoLayer(annotations: PaintAnnotation[], layerId: string, point: PaintPoint): PaintAnnotation[] {
	const next = [...annotations];
	const idx = next.findIndex((item) => item.layerId === layerId);
	if (idx === -1) {
		next.push({ layerId, points: [point] });
		return next;
	}
	next[idx] = {
		...next[idx],
		points: [...(next[idx].points || []), point],
	};
	return next;
}

function PaintableRinkObservationDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};
	const mode = String(config?.mode || "free_annotation");

	const observationCount = Number(config?.observation_count ?? config?.observationCount ?? 1);
	const observationsKey = config?.observations_key || "observations";
	const annotationsKey = config?.annotations_key || "rinkAnnotations";
	const noteKey = config?.note_key || "note";
	const createdAtKey = config?.created_at_key || "createdAt";
	const observationIndexKey = config?.observation_index_key || "observationIndex";
	const selectedLayerKey = config?.selected_layer_key || "selectedLayerId";
	const minimumLayers = Number(config?.minimumLayers ?? config?.minimum_layers ?? 1);

	const layers = normalizePaintLayers(mode, config);
	const overlays = normalizeRinkOverlays(mode, config);
	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const observations = Array.isArray(safeAnswers[observationsKey]) ? safeAnswers[observationsKey] : [];
	const isComplete = observations.length >= observationCount;
	const progressPct = observationCount > 0 ? Math.round((observations.length / observationCount) * 100) : 0;

	const draft = safeAnswers.__paintable_rink_observation_draft || {};
	const draftAnnotations: PaintAnnotation[] = Array.isArray(draft?.[annotationsKey]) ? draft[annotationsKey] : [];
	const selectedLayerId: string = draft?.[selectedLayerKey] || layers[0]?.id || "annotation";
	const draftNote = draft?.[noteKey] || "";

	const completionQuestion = config?.completion_question || null;
	const completionNote = config?.completion_note || null;
	const completionChoiceKey = completionQuestion?.key || "dominant_priority";
	const completionNoteKey = completionNote?.key || "pattern_reason";

	const svgRef = useRef<SVGSVGElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);

	const currentMission = missions[observations.length] || {
		title: `Mission ${Math.min(observations.length + 1, observationCount)} von ${observationCount}`,
		prompt: "Markiere die relevanten Raumprioritaeten auf dem Rink.",
		hint: "Zeichne auf mindestens zwei Ebenen, wenn mehrere Prioritaeten erkennbar sind.",
	};

	const updateDraft = (nextDraft: any) => {
		setAnswers({
			...safeAnswers,
			__paintable_rink_observation_draft: {
				...draft,
				...nextDraft,
			},
		});
	};

	const getPointFromEvent = (event: any): PaintPoint | null => {
		if (!svgRef.current) return null;
		const rect = svgRef.current.getBoundingClientRect();
		if (!rect.width || !rect.height) return null;
		return {
			x: clamp01((event.clientX - rect.left) / rect.width),
			y: clamp01((event.clientY - rect.top) / rect.height),
		};
	};

	const appendPoint = (point: PaintPoint) => {
		if (!selectedLayerId) return;
		const nextAnnotations = mergePointIntoLayer(draftAnnotations, selectedLayerId, point);
		updateDraft({ [annotationsKey]: nextAnnotations });
	};

	const onPointerDown = (event: any) => {
		if (!selectedLayerId) return;
		const point = getPointFromEvent(event);
		if (!point) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		setIsDrawing(true);
		appendPoint(point);
	};

	const onPointerMove = (event: any) => {
		if (!isDrawing) return;
		const point = getPointFromEvent(event);
		if (!point) return;
		event.preventDefault();
		appendPoint(point);
	};

	const stopDrawing = (event?: any) => {
		if (event?.currentTarget?.releasePointerCapture && event?.pointerId !== undefined) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		setIsDrawing(false);
	};

	const paintedLayerIds = draftAnnotations
		.filter((annotation) => Array.isArray(annotation.points) && annotation.points.length > 1)
		.map((annotation) => annotation.layerId);
	const paintedLayerCount = new Set(paintedLayerIds).size;
	const canSave = paintedLayerCount >= minimumLayers && !isComplete;

	const clearLayer = (layerId: string) => {
		const nextAnnotations = draftAnnotations.filter((annotation) => annotation.layerId !== layerId);
		updateDraft({ [annotationsKey]: nextAnnotations });
	};

	const clearAll = () => {
		updateDraft({ [annotationsKey]: [], [noteKey]: "" });
	};

	const onSaveObservation = () => {
		if (!canSave) return;
		const cleanedAnnotations = draftAnnotations
			.filter((annotation) => Array.isArray(annotation.points) && annotation.points.length > 1)
			.map((annotation) => ({
				layerId: annotation.layerId,
				points: annotation.points.map((point) => ({
					x: Number(point.x.toFixed(4)),
					y: Number(point.y.toFixed(4)),
				})),
			}));

		const nextObservation = {
			[observationIndexKey]: observations.length + 1,
			[annotationsKey]: cleanedAnnotations,
			[noteKey]: draftNote?.trim() ? draftNote.trim() : undefined,
			[createdAtKey]: new Date().toISOString(),
		};

		setAnswers({
			...safeAnswers,
			[observationsKey]: [...observations, nextObservation],
			__paintable_rink_observation_draft: {
				[selectedLayerKey]: selectedLayerId,
				[annotationsKey]: [],
				[noteKey]: "",
			},
		});
	};

	const removeObservation = (index: number) => {
		const nextObservations = observations.filter((_: any, idx: number) => idx !== index);
		setAnswers({
			...safeAnswers,
			[observationsKey]: nextObservations,
		});
	};

	const completionChoiceValue = safeAnswers?.[completionChoiceKey] || "";
	const completionNoteValue = safeAnswers?.[completionNoteKey] || "";

	const defensiveLabel = overlays.defendingSide === "left" ? "Defensive Zone" : "Offensive Zone";
	const offensiveLabel = overlays.defendingSide === "left" ? "Offensive Zone" : "Defensive Zone";

	return (
		<div className="card primary-card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.65rem" }}>
					{drill.description}
				</p>
			)}

			<details className="nested-section mobile-flatten didactic-focus-section" style={{ marginBottom: "0.7rem" }}>
				<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
				<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
					{drill?.didactics?.explanation || "Markiere relevante Raeume auf dem Rink und leite daraus wiederkehrende Prioritaeten ab."}
				</p>
			</details>

			<ObservationGuide drill={drill} />

			{!isComplete && (
				<section className="mobile-flatten-card" style={{ marginBottom: "0.75rem", padding: "0.8rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
					<div style={{ marginBottom: "0.45rem", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>{currentMission.title}</p>
						{currentMission.prompt && <p style={{ margin: "0.18rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.32 }}>{currentMission.prompt}</p>}
						{currentMission.hint && <p style={{ margin: "0.24rem 0 0", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem" }}>{currentMission.hint}</p>}
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

					<div style={{ marginBottom: "0.55rem", padding: "0.55rem 0.65rem", borderRadius: "6px", border: "1px solid rgba(148,163,184,0.38)", background: "rgba(15,23,42,0.45)" }}>
						<p style={{ margin: "0 0 0.35rem", color: "#e2e8f0", fontWeight: 600 }}>Markiere die Raumprioritaeten:</p>
						<div style={{ display: "grid", gap: "0.25rem" }}>
							{layers.map((layer) => (
								<div key={layer.id} style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "rgba(255,255,255,0.84)", fontSize: "0.86rem" }}>
									<span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "999px", display: "inline-block", background: layer.color }} />
									{layer.label}
								</div>
							))}
						</div>
					</div>

					{overlays.showDefendingHint && (
						<p style={{ marginTop: "-0.1rem", marginBottom: "0.55rem", color: "rgba(186,230,253,0.9)", fontSize: "0.82rem" }}>
							Eigenes Tor: <strong>{overlays.defendingSide === "left" ? "links" : "rechts"}</strong>
						</p>
					)}

					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
						{layers.map((layer) => {
							const isActive = layer.id === selectedLayerId;
							return (
								<button
									key={layer.id}
									type="button"
									onClick={() => updateDraft({ [selectedLayerKey]: layer.id })}
									style={{
										padding: "0.35rem 0.62rem",
										borderRadius: "999px",
										border: isActive ? `2px solid ${layer.color}` : "1px solid rgba(148,163,184,0.35)",
										background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
										color: "#e2e8f0",
										fontSize: "0.82rem",
										fontWeight: 700,
										cursor: "pointer",
									}}
								>
									{layer.label}
								</button>
							);
						})}
					</div>

					<div className="interaction-surface" style={{ marginBottom: "0.55rem" }}>
						<div
							className={`rink-wrapper rink-interaction-surface${isDrawing ? " is-interacting" : ""}`}
							style={{
								position: "relative",
								width: "100%",
								maxWidth: "760px",
								aspectRatio: "900 / 620",
								borderRadius: "10px",
								border: "1px solid rgba(81,145,162,0.45)",
								overflow: "hidden",
								background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
								touchAction: isDrawing ? "none" : "manipulation",
							}}
						>
							<svg
								ref={svgRef}
								viewBox="0 0 900 620"
								onPointerDown={onPointerDown}
								onPointerMove={onPointerMove}
								onPointerUp={stopDrawing}
								onPointerLeave={stopDrawing}
								onPointerCancel={stopDrawing}
								role="img"
								aria-label="Paintable Rink"
								style={{ width: "100%", height: "100%", display: "block", cursor: isDrawing ? "crosshair" : "pointer" }}
							>
								<DetailedHockeyRinkLayers
									overlays={overlays}
									defensiveLabel={defensiveLabel}
									offensiveLabel={offensiveLabel}
								/>

								{layers.map((layer) => {
									const layerAnnotation = draftAnnotations.find((annotation) => annotation.layerId === layer.id);
									if (!layerAnnotation || !Array.isArray(layerAnnotation.points) || layerAnnotation.points.length < 2) return null;
									const path = buildSvgPath(layerAnnotation.points, 900, 620);
									if (!path) return null;
									return (
										<path
											key={layer.id}
											d={path}
											fill="none"
											stroke={layer.color}
											strokeWidth={12}
											strokeLinecap="round"
											strokeLinejoin="round"
											opacity={0.78}
										/>
									);
								})}
							</svg>
						</div>
					</div>

					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.5rem" }}>
						<button
							type="button"
							onClick={() => clearLayer(selectedLayerId)}
							style={{
								padding: "0.34rem 0.65rem",
								borderRadius: "6px",
								border: "1px solid rgba(148,163,184,0.4)",
								background: "rgba(255,255,255,0.04)",
								color: "#cbd5e1",
								fontSize: "0.82rem",
								cursor: "pointer",
							}}
						>
							Aktive Ebene leeren
						</button>
						<button
							type="button"
							onClick={clearAll}
							style={{
								padding: "0.34rem 0.65rem",
								borderRadius: "6px",
								border: "1px solid rgba(148,163,184,0.4)",
								background: "rgba(255,255,255,0.04)",
								color: "#cbd5e1",
								fontSize: "0.82rem",
								cursor: "pointer",
							}}
						>
							Alles leeren
						</button>
					</div>

					<div style={{ marginBottom: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)" }}>
						Gemalte Ebenen: <strong>{paintedLayerCount}</strong> / mindestens <strong>{minimumLayers}</strong>
					</div>

					<textarea
						value={draftNote}
						onChange={(event) => updateDraft({ [noteKey]: event.target.value })}
						placeholder={config?.note_placeholder || "Optionale Notiz"}
						maxLength={Number(config?.note_max_chars || 320)}
						style={{
							width: "100%",
							minHeight: "60px",
							marginBottom: "0.5rem",
							padding: "0.45rem",
							backgroundColor: "#050712",
							color: "#f7f7ff",
							border: "1px solid rgba(81,145,162,0.5)",
							borderRadius: "4px",
							fontFamily: "inherit",
							fontSize: "0.9rem",
						}}
					/>

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
						{config?.save_button_label || "Beobachtung speichern"}
					</button>
				</section>
			)}

			<section className="mobile-flatten-card" style={{ marginBottom: "0.4rem", padding: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.55rem" }}>
					<h4 style={{ margin: 0 }}>Erfasste Beobachtungen</h4>
					<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>{observations.length}/{observationCount}</span>
				</div>
				<div style={{ display: "grid", gap: "0.4rem" }}>
					{observations.map((entry: any, idx: number) => {
						const entryAnnotations: PaintAnnotation[] = Array.isArray(entry?.[annotationsKey]) ? entry[annotationsKey] : [];
						return (
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
									{entryAnnotations.length} Layer gespeichert
								</div>
								{entry?.[noteKey] && <div style={{ marginTop: "0.22rem", fontSize: "0.81rem", color: "rgba(255,255,255,0.64)" }}>{entry[noteKey]}</div>}
							</div>
						);
					})}
				</div>

				{isComplete && completionQuestion?.options?.length > 0 && (
					<div style={{ marginTop: "0.75rem" }}>
						<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{completionQuestion.label}</label>
						<div style={{ display: "grid", gap: "0.28rem", marginBottom: "0.55rem" }}>
							{completionQuestion.options.map((option: any) => {
								const value = option?.value || option;
								const label = option?.label || option;
								return (
									<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem", color: "#e2e8f0" }}>
										<input
											type="radio"
											name="paintable_completion_choice"
											value={value}
											checked={completionChoiceValue === value}
											onChange={() => setAnswers({ ...safeAnswers, [completionChoiceKey]: value })}
										/>
										<span>{label}</span>
									</label>
								);
							})}
						</div>
					</div>
				)}

				{isComplete && completionNote && (
					<div>
						<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{completionNote.label}</label>
						<textarea
							value={completionNoteValue}
							onChange={(event) => setAnswers({ ...safeAnswers, [completionNoteKey]: event.target.value })}
							placeholder={completionNote.placeholder || "Optional"}
							maxLength={Number(completionNote.max_chars || 600)}
							style={{
								width: "100%",
								minHeight: "64px",
								padding: "0.45rem",
								backgroundColor: "#050712",
								color: "#f7f7ff",
								border: "1px solid rgba(81,145,162,0.5)",
								borderRadius: "4px",
								fontFamily: "inherit",
								fontSize: "0.9rem",
							}}
						/>
					</div>
				)}
			</section>
		</div>
	);
}

type ConfigurableSegmentZone = {
	id: string;
	label: string;
	path?: string;
	geometry?: { x0?: number; y0?: number; x1?: number; y1?: number; x?: number; y?: number; width?: number; height?: number };
};

const DETAILED_RINK_VIEWBOX = { width: 900, height: 620 };

/** Blue-line x as fraction of the detailed viewBox (for zone_boundaries). Matches painted blue lines. */
const DETAILED_RINK_ZONE_BOUNDARIES = {
	left_blue_line_x: (30 + 840 * 0.3438) / DETAILED_RINK_VIEWBOX.width,
	right_blue_line_x: (30 + 840 * 0.6562) / DETAILED_RINK_VIEWBOX.width,
};

/** Geometry aligned with C1_D1 / paintable detailed rink visuals. */
function getDetailedRinkMetrics() {
	const rinkX = 30;
	const rinkY = 40;
	const rinkWidth = 840;
	const rinkHeight = 540;
	const rinkRight = rinkX + rinkWidth;
	const rinkCenterX = rinkX + rinkWidth / 2;
	const rinkCenterY = rinkY + rinkHeight / 2;
	const leftBlueLineX = rinkX + rinkWidth * 0.3438;
	const rightBlueLineX = rinkX + rinkWidth * 0.6562;
	const leftGoalLineX = rinkX + rinkWidth * 0.11;
	const rightGoalLineX = rinkRight - rinkWidth * 0.11;
	const goalMouth = rinkHeight * 0.078;
	const goalHalf = goalMouth / 2;
	const goalDepth = rinkWidth * 0.018;
	const creaseRadius = rinkHeight * 0.100;
	const faceoffRadius = rinkHeight * 0.100;
	const leftZoneFaceoffX = rinkX + rinkWidth * 0.26;
	const rightZoneFaceoffX = rinkRight - rinkWidth * 0.26;
	const topFaceoffY = rinkCenterY - rinkHeight * 0.26;
	const bottomFaceoffY = rinkCenterY + rinkHeight * 0.26;
	const neutralOffsetX = rinkWidth * 0.11;
	const neutralOffsetY = rinkHeight * 0.22;
	const neutralDots = [
		{ x: rinkCenterX - neutralOffsetX, y: rinkCenterY - neutralOffsetY },
		{ x: rinkCenterX - neutralOffsetX, y: rinkCenterY + neutralOffsetY },
		{ x: rinkCenterX + neutralOffsetX, y: rinkCenterY - neutralOffsetY },
		{ x: rinkCenterX + neutralOffsetX, y: rinkCenterY + neutralOffsetY },
	];
	return {
		rinkX,
		rinkY,
		rinkWidth,
		rinkHeight,
		rinkRight,
		rinkCenterX,
		rinkCenterY,
		leftBlueLineX,
		rightBlueLineX,
		leftGoalLineX,
		rightGoalLineX,
		goalHalf,
		goalDepth,
		creaseRadius,
		faceoffRadius,
		leftZoneFaceoffX,
		rightZoneFaceoffX,
		topFaceoffY,
		bottomFaceoffY,
		neutralDots,
	};
}

/** Shared detailed rink markings (900×620). Interaction layers stay outside this base. */
function DetailedHockeyRinkLayers({
	overlays,
	defensiveLabel = "Defensive Zone",
	offensiveLabel = "Offensive Zone",
}: {
	overlays: RinkOverlays;
	defensiveLabel?: string;
	offensiveLabel?: string;
}) {
	const m = getDetailedRinkMetrics();
	return (
		<>
			<rect x={m.rinkX} y={m.rinkY} width={m.rinkWidth} height={m.rinkHeight} rx="110" ry="110" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
			<line x1={m.rinkCenterX} y1={m.rinkY + 4} x2={m.rinkCenterX} y2={m.rinkY + m.rinkHeight - 4} stroke="rgba(255,120,120,0.55)" strokeWidth="4" />
			<line x1={m.leftBlueLineX} y1={m.rinkY + 4} x2={m.leftBlueLineX} y2={m.rinkY + m.rinkHeight - 4} stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
			<line x1={m.rightBlueLineX} y1={m.rinkY + 4} x2={m.rightBlueLineX} y2={m.rinkY + m.rinkHeight - 4} stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
			<circle cx={m.rinkCenterX} cy={m.rinkCenterY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />

			{overlays.faceoffDots && (
				<>
					<circle cx={m.leftZoneFaceoffX} cy={m.topFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
					<circle cx={m.leftZoneFaceoffX} cy={m.bottomFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
					<circle cx={m.rightZoneFaceoffX} cy={m.topFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
					<circle cx={m.rightZoneFaceoffX} cy={m.bottomFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
					<circle cx={m.leftZoneFaceoffX} cy={m.topFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
					<circle cx={m.leftZoneFaceoffX} cy={m.bottomFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
					<circle cx={m.rightZoneFaceoffX} cy={m.topFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
					<circle cx={m.rightZoneFaceoffX} cy={m.bottomFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
					{m.neutralDots.map((dot, idx) => (
						<circle key={`neutral-dot-${idx}`} cx={dot.x} cy={dot.y} r="3.2" fill="rgba(203,213,225,0.78)" />
					))}
				</>
			)}

			{overlays.zones && (
				<>
					<line x1={m.leftGoalLineX} y1={m.rinkY + 6} x2={m.leftGoalLineX} y2={m.rinkY + m.rinkHeight - 6} stroke="rgba(248,113,113,0.62)" strokeWidth="2.5" />
					<line x1={m.rightGoalLineX} y1={m.rinkY + 6} x2={m.rightGoalLineX} y2={m.rinkY + m.rinkHeight - 6} stroke="rgba(248,113,113,0.62)" strokeWidth="2.5" />
				</>
			)}

			{overlays.goals && (
				<>
					<line x1={m.leftGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(220,38,38,0.94)" strokeWidth="3.2" />
					<line x1={m.leftGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY - m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
					<line x1={m.leftGoalLineX} y1={m.rinkCenterY + m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
					<line x1={m.leftGoalLineX - m.goalDepth} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(203,213,225,0.42)" strokeWidth="1.6" />
					<path d={`M ${m.leftGoalLineX - m.goalDepth} ${m.rinkCenterY - m.goalHalf} L ${m.leftGoalLineX} ${m.rinkCenterY - m.goalHalf} L ${m.leftGoalLineX} ${m.rinkCenterY + m.goalHalf} L ${m.leftGoalLineX - m.goalDepth} ${m.rinkCenterY + m.goalHalf} Z`} fill="rgba(148,163,184,0.08)" stroke="none" />

					<line x1={m.rightGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(220,38,38,0.94)" strokeWidth="3.2" />
					<line x1={m.rightGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY - m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
					<line x1={m.rightGoalLineX} y1={m.rinkCenterY + m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
					<line x1={m.rightGoalLineX + m.goalDepth} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(203,213,225,0.42)" strokeWidth="1.6" />
					<path d={`M ${m.rightGoalLineX + m.goalDepth} ${m.rinkCenterY - m.goalHalf} L ${m.rightGoalLineX} ${m.rinkCenterY - m.goalHalf} L ${m.rightGoalLineX} ${m.rinkCenterY + m.goalHalf} L ${m.rightGoalLineX + m.goalDepth} ${m.rinkCenterY + m.goalHalf} Z`} fill="rgba(148,163,184,0.08)" stroke="none" />
				</>
			)}

			{overlays.crease && (
				<>
					<path d={`M ${m.leftGoalLineX} ${m.rinkCenterY - m.creaseRadius} A ${m.creaseRadius} ${m.creaseRadius} 0 0 1 ${m.leftGoalLineX} ${m.rinkCenterY + m.creaseRadius}`} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.72)" strokeWidth="2.4" />
					<path d={`M ${m.rightGoalLineX} ${m.rinkCenterY - m.creaseRadius} A ${m.creaseRadius} ${m.creaseRadius} 0 0 0 ${m.rightGoalLineX} ${m.rinkCenterY + m.creaseRadius}`} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.72)" strokeWidth="2.4" />
				</>
			)}

			{overlays.labels && overlays.zones && (
				<>
					<text x={m.rinkX + m.rinkWidth * 0.08} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">{defensiveLabel}</text>
					<text x={m.rinkCenterX - 32} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">Neutral Zone</text>
					<text x={m.rinkRight - m.rinkWidth * 0.26} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">{offensiveLabel}</text>
				</>
			)}
		</>
	);
}

function buildSegmentZonePath(zone: ConfigurableSegmentZone): string {
	if (typeof zone.path === "string" && zone.path.trim()) return zone.path.trim();
	const geometry = zone.geometry || {};
	const vbW = DETAILED_RINK_VIEWBOX.width;
	const vbH = DETAILED_RINK_VIEWBOX.height;
	let x0 = Number(geometry.x0 ?? geometry.x);
	let y0 = Number(geometry.y0 ?? geometry.y);
	let x1 = Number(geometry.x1);
	let y1 = Number(geometry.y1);
	if (!Number.isFinite(x1) && Number.isFinite(geometry.width)) x1 = x0 + Number(geometry.width);
	if (!Number.isFinite(y1) && Number.isFinite(geometry.height)) y1 = y0 + Number(geometry.height);
	if (![x0, y0, x1, y1].every(Number.isFinite)) return "";
	const toX = (value: number) => (value <= 1 ? value * vbW : value);
	const toY = (value: number) => (value <= 1 ? value * vbH : value);
	const left = Math.min(toX(x0), toX(x1));
	const right = Math.max(toX(x0), toX(x1));
	const top = Math.min(toY(y0), toY(y1));
	const bottom = Math.max(toY(y0), toY(y1));
	return `M${left} ${top} L${right} ${top} L${right} ${bottom} L${left} ${bottom} Z`;
}

function RinkSegmentedZoneObservationDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};
	const mode = String(config?.mode || "segmented_zone_selection");
	const overlays = normalizeRinkOverlays(mode, config);

	const observationCount = Number(config?.observation_count ?? config?.observationCount ?? 3);
	const observationsKey = config?.observations_key || "observations";
	const observationIndexKey = config?.observation_index_key || "observationIndex";
	const createdAtKey = config?.created_at_key || "createdAt";
	const activeGroupKey = config?.active_selection_group_key || "activeSelectionGroup";
	const draftKey = config?.draft_key || "__rink_segmented_zone_observation_draft";

	const zoneDefinitions: ConfigurableSegmentZone[] = Array.isArray(config?.zones) ? config.zones : [];
	const zoneMap = Object.fromEntries(
		zoneDefinitions
			.map((zone) => [String(zone.id), { ...zone, path: buildSegmentZonePath(zone) }])
			.filter(([_, zone]) => !!(zone as ConfigurableSegmentZone).path),
	) as Record<string, ConfigurableSegmentZone & { path: string }>;

	const selectionGroups = Array.isArray(config?.selection_groups) ? config.selection_groups : [];
	const observationFields = Array.isArray(config?.observation_fields) ? config.observation_fields : [];
	const observationNoteConfig = config?.observation_note || {};
	const observationNoteKey = observationNoteConfig?.key || "observationNote";
	const observationNoteLabel = observationNoteConfig?.label || "Woran hast du erkannt, welcher Weg geschlossen und welcher angeboten wurde?";
	const observationNotePlaceholder = observationNoteConfig?.placeholder || "Optional";
	const observationNoteMaxChars = Number(observationNoteConfig?.max_chars || 600);
	const conflictHint = String(config?.conflict_hint || "Du hast denselben Weg als primär geschlossen und als am ehesten verfügbar ausgewählt. Prüfe, ob das deine Beobachtung korrekt beschreibt.");

	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const observations = Array.isArray(safeAnswers[observationsKey]) ? safeAnswers[observationsKey] : [];
	const currentIndex = observations.length;
	const isComplete = observations.length >= observationCount;
	const progressPct = observationCount > 0 ? Math.round((observations.length / observationCount) * 100) : 0;
	const currentMission = missions[currentIndex] || {
		title: `Mission ${currentIndex + 1} von ${observationCount}`,
		prompt: "Beobachte einen kontrollierten gegnerischen Aufbau durch die Neutral Zone.",
		hint: "Wähle zuerst den geschlossenen und danach den verbleibenden Weg.",
	};

	const draft = safeAnswers[draftKey] || {};
	const activeGroupId = draft[activeGroupKey] || selectionGroups[0]?.id || "";
	const activeGroup = selectionGroups.find((group: any) => group.id === activeGroupId) || selectionGroups[0];
	const activeSelectionKey = String(activeGroup?.key || activeGroup?.id || "");
	const activeSelectionValue = activeSelectionKey ? (draft[activeSelectionKey] || "") : "";

	const draftObservationFieldValues = Object.fromEntries(
		observationFields.map((field: any) => [String(field?.key || ""), draft[String(field?.key || "")] || ""]),
	);
	const draftObservationNote = draft[observationNoteKey] || "";
	const emptyObservationFieldDraft = Object.fromEntries(
		observationFields.map((field: any) => [String(field?.key || ""), ""]),
	);

	const [isInteracting, setIsInteracting] = useState(false);

	const saveButtonLabel = config?.save_button_label || "Beobachtung speichern";
	const savedFeedbackTemplate = config?.saved_feedback_template || "Beobachtung {index} gespeichert";
	const activeFocusTitle = config?.active_focus_title || "Aktiver Fokus";
	const activeFocusText = config?.active_focus_text || "Beobachte weiterhin, welche Wege durch die Neutral Zone geschlossen werden und welche dem Gegner bleiben.";
	const [flashMessage, setFlashMessage] = useState("");

	const updateDraft = (nextDraft: any) => {
		setAnswers({
			...safeAnswers,
			[draftKey]: {
				...draft,
				...nextDraft,
			},
		});
	};

	const getGroupZoneIds = (group: any) => {
		const ids = Array.isArray(group?.zone_ids) ? group.zone_ids : (Array.isArray(group?.zones) ? group.zones : []);
		return ids.map(String).filter((id: string) => !!zoneMap[id]);
	};

	const getGroupOffRinkOptions = (group: any) => {
		const source = group?.off_rink_options || group?.additional_options || group?.additionalOptions || [];
		return Array.isArray(source) ? source : [];
	};

	const getOptionLabel = (options: any[], value: string) => {
		const found = options.find((opt: any) => String(opt?.value || opt) === value);
		if (!found) return zoneMap[value]?.label || value;
		return typeof found === "string" ? found : String(found?.label || found?.value || value);
	};

	const requiredSelectionKeys = selectionGroups
		.filter((group: any) => group?.required !== false)
		.map((group: any) => String(group?.key || group?.id || ""))
		.filter(Boolean);
	const requiredObservationFieldsFilled = observationFields
		.filter((field: any) => field?.required !== false)
		.every((field: any) => {
			const key = String(field?.key || "");
			return !!key && !!draftObservationFieldValues[key];
		});
	const requiredSelectionsFilled = requiredSelectionKeys.every((key: string) => !!draft[key]);
	const canSave = requiredSelectionsFilled && requiredObservationFieldsFilled && !isComplete;

	const closedLaneKey = selectionGroups[0]?.key || "closedLane";
	const availableRouteKey = selectionGroups[1]?.key || "availableRoute";
	const laneIds = new Set(getGroupZoneIds(selectionGroups[0] || {}));
	const showConflictHint = laneIds.has(String(draft[closedLaneKey]))
		&& String(draft[closedLaneKey]) === String(draft[availableRouteKey])
		&& !!draft[closedLaneKey];

	const onSaveObservation = () => {
		if (!canSave) return;
		const nextObservation: Record<string, any> = {
			[observationIndexKey]: currentIndex + 1,
			[observationNoteKey]: draftObservationNote.trim() || "",
			[createdAtKey]: new Date().toISOString(),
		};
		selectionGroups.forEach((group: any) => {
			const key = String(group?.key || group?.id || "");
			if (!key) return;
			nextObservation[key] = draft[key] || "";
		});
		observationFields.forEach((field: any) => {
			const key = String(field?.key || "");
			if (!key) return;
			nextObservation[key] = draftObservationFieldValues[key] || "";
		});

		setAnswers({
			...safeAnswers,
			[observationsKey]: [...observations, nextObservation],
			[draftKey]: {
				[activeGroupKey]: selectionGroups[0]?.id || "",
				...Object.fromEntries(selectionGroups.map((group: any) => [String(group?.key || group?.id || ""), ""])),
				...emptyObservationFieldDraft,
				[observationNoteKey]: "",
			},
		});
		setFlashMessage(savedFeedbackTemplate.replace("{index}", String(currentIndex + 1)));
		window.setTimeout(() => setFlashMessage(""), 1200);
	};

	const removeObservation = (index: number) => {
		setAnswers({
			...safeAnswers,
			[observationsKey]: observations.filter((_: any, idx: number) => idx !== index),
		});
	};

	const activeGroupZoneIds = activeGroup ? getGroupZoneIds(activeGroup) : [];
	const activeGroupOffRinkOptions = activeGroup ? getGroupOffRinkOptions(activeGroup) : [];

	return (
		<div className="card primary-card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.65rem" }}>
					{drill.description}
				</p>
			)}

			<details className="nested-section mobile-flatten didactic-focus-section" style={{ marginBottom: "0.7rem" }}>
				<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
				<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45, whiteSpace: "pre-line" }}>
					{drill?.didactics?.explanation || ""}
				</p>
			</details>

			<ObservationGuide drill={drill} />

			{!isComplete && (
				<section className="mobile-flatten-card" style={{ marginBottom: "0.75rem", padding: "0.8rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
					<div style={{ marginBottom: "0.45rem", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>{currentMission?.title || `Mission ${currentIndex + 1} von ${observationCount}`}</p>
						{currentMission?.prompt && <p style={{ margin: "0.18rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.32 }}>{currentMission.prompt}</p>}
						{currentMission?.hint && <p style={{ margin: "0.22rem 0 0", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem" }}>{currentMission.hint}</p>}
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

					{selectionGroups.length > 1 && (
						<div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
							{selectionGroups.map((group: any) => {
								const groupId = String(group?.id || group?.key || "");
								const isActive = groupId === activeGroupId;
								return (
									<button
										key={groupId}
										type="button"
										onClick={() => updateDraft({ [activeGroupKey]: groupId })}
										style={{
											padding: "0.28rem 0.7rem",
											borderRadius: "999px",
											border: isActive ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
											background: isActive ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
											color: "#f7f7ff",
											fontSize: "0.82rem",
											fontWeight: 700,
											cursor: "pointer",
										}}
									>
										{group?.label || groupId}
									</button>
								);
							})}
						</div>
					)}

					{activeGroup && (
						<div style={{ marginBottom: "0.45rem" }}>
							<strong>{activeGroup?.question || activeGroup?.label}</strong>
							{activeGroup?.hint && <p style={{ margin: "0.22rem 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.62)" }}>{activeGroup.hint}</p>}
						</div>
					)}

					<div className="interaction-surface">
						<div
							className={`rink-wrapper rink-interaction-surface${isInteracting ? " is-interacting" : ""}`}
							onPointerDown={(event) => {
								if (event.pointerType === "touch" || event.pointerType === "pen") setIsInteracting(true);
							}}
							onPointerUp={() => setIsInteracting(false)}
							onPointerCancel={() => setIsInteracting(false)}
							style={{
								position: "relative",
								width: "100%",
								maxWidth: "760px",
								aspectRatio: "900 / 620",
								borderRadius: "10px",
								border: "1px solid rgba(81,145,162,0.45)",
								overflow: "hidden",
								background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
								marginBottom: "0.55rem",
								touchAction: isInteracting ? "none" : "manipulation",
								overscrollBehavior: isInteracting ? "contain" : "auto",
							}}
						>
							<svg viewBox="0 0 900 620" role="img" aria-label="Neutral Zone mit auswählbaren Korridoren" style={{ width: "100%", height: "100%", display: "block" }}>
								<DetailedHockeyRinkLayers overlays={overlays} />

								{activeGroupZoneIds.map((zoneId: string) => {
									const zone = zoneMap[zoneId];
									if (!zone) return null;
									const selected = activeSelectionValue === zoneId;
									return (
										<path
											key={zoneId}
											d={zone.path}
											fill={selected ? "rgba(45,212,191,0.28)" : "rgba(255,255,255,0.03)"}
											stroke={selected ? "rgba(153,246,228,0.95)" : "rgba(255,255,255,0.18)"}
											strokeWidth={selected ? 3 : 2}
											onClick={() => activeSelectionKey && updateDraft({ [activeSelectionKey]: zoneId })}
											style={{ cursor: "pointer" }}
										>
											<title>{zone.label}</title>
										</path>
									);
								})}
							</svg>
						</div>
					</div>

					{activeGroupZoneIds.length > 0 && (
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: "0.35rem", marginBottom: "0.5rem" }}>
							{activeGroupZoneIds.map((zoneId: string) => {
								const zone = zoneMap[zoneId];
								if (!zone) return null;
								const selected = activeSelectionValue === zoneId;
								return (
									<button
										key={zoneId}
										type="button"
										onClick={() => activeSelectionKey && updateDraft({ [activeSelectionKey]: zoneId })}
										style={{
											minHeight: "44px",
											padding: "0.42rem 0.55rem",
											borderRadius: "6px",
											border: selected ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
											background: selected ? "rgba(20,184,166,0.24)" : "rgba(255,255,255,0.04)",
											color: "#f7f7ff",
											fontSize: "0.83rem",
											textAlign: "left",
											cursor: "pointer",
										}}
									>
										{zone.label}
									</button>
								);
							})}
						</div>
					)}

					{activeGroupOffRinkOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{activeGroupOffRinkOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `option_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									const description = typeof opt === "string" ? "" : String(opt?.description || "");
									return (
										<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name={`segment_group_${activeSelectionKey}`}
												value={value}
												checked={activeSelectionValue === value}
												onChange={() => activeSelectionKey && updateDraft({ [activeSelectionKey]: value })}
											/>
											<span>
												<span>{label}</span>
												{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{showConflictHint && (
						<p style={{ margin: "0 0 0.55rem", fontSize: "0.82rem", color: "rgba(251,191,36,0.92)", lineHeight: 1.35 }}>
							{conflictHint}
						</p>
					)}

					{observationFields.map((field: any, fieldIdx: number) => {
						const fieldKey = String(field?.key || `field_${fieldIdx}`);
						const fieldLabel = String(field?.label || fieldKey);
						const fieldOptions = Array.isArray(field?.options) ? field.options : [];
						if (fieldOptions.length === 0) return null;
						return (
							<div key={fieldKey} style={{ marginBottom: "0.55rem" }}>
								<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{fieldLabel}</label>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
									{fieldOptions.map((opt: any, idx: number) => {
										const value = typeof opt === "string" ? opt : String(opt?.value || `${fieldKey}_${idx}`);
										const label = typeof opt === "string" ? opt : String(opt?.label || value);
										const description = typeof opt === "string" ? "" : String(opt?.description || "");
										return (
											<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
												<input
													type="radio"
													name={`segment_field_${fieldKey}`}
													value={value}
													checked={draftObservationFieldValues[fieldKey] === value}
													onChange={() => updateDraft({ [fieldKey]: value })}
												/>
												<span>
													<span>{label}</span>
													{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						);
					})}

					<details style={{ marginBottom: "0.45rem" }} open={!!draftObservationNote}>
						<summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "#8fd3df" }}>Optionale Reflexion</summary>
						<p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)" }}>{observationNoteLabel}</p>
						<textarea
							value={draftObservationNote}
							onChange={(e) => updateDraft({ [observationNoteKey]: e.target.value })}
							maxLength={observationNoteMaxChars}
							placeholder={observationNotePlaceholder}
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
					{flashMessage && <p style={{ margin: "0.45rem 0 0", color: "#99f6e4", fontSize: "0.84rem" }}>{flashMessage}</p>}
				</section>
			)}

			<section className="mobile-flatten-card" style={{ marginBottom: "0.4rem", padding: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.55rem" }}>
					<h4 style={{ margin: 0 }}>Erfasste Beobachtungen</h4>
					<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.62)" }}>{observations.length}/{observationCount}</span>
				</div>
				<div style={{ display: "grid", gap: "0.4rem" }}>
					{observations.map((entry: any, idx: number) => (
						<div key={idx} style={{ padding: "0.5rem 0.62rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", background: "rgba(255,255,255,0.03)" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.55rem" }}>
								<strong>Beobachtung {idx + 1}</strong>
								<button type="button" onClick={() => removeObservation(idx)} style={{ padding: "0.14rem 0.45rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#f7f7ff", fontSize: "0.82rem", cursor: "pointer" }}>
									Entfernen
								</button>
							</div>
							<div style={{ marginTop: "0.22rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.34 }}>
								{selectionGroups.map((group: any) => {
									const key = String(group?.key || group?.id || "");
									const value = entry?.[key];
									if (!key || !value) return null;
									const label = getOptionLabel([...(getGroupOffRinkOptions(group)), ...getGroupZoneIds(group).map((id: string) => ({ value: id, label: zoneMap[id]?.label || id }))], value);
									return `${group?.label || key}: ${label}`;
								}).filter(Boolean).join(" · ")}
								{observationFields.map((field: any) => {
									const key = String(field?.key || "");
									if (!key || !entry?.[key]) return "";
									return ` · ${getOptionLabel(field?.options || [], entry[key])}`;
								}).join("")}
							</div>
						</div>
					))}
				</div>

				{isComplete && (
					<section style={{ marginTop: "0.7rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
						<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
						<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
					</section>
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

type PriorityZone =
	| "crease"
	| "low_slot"
	| "high_slot"
	| "left_halfwall"
	| "right_halfwall"
	| "behind_net"
	| "left_point_lane"
	| "right_point_lane";

type ReflectionBucket = "crease" | "low_slot" | "high_slot" | "halfwalls" | "behind_net" | "point_lanes" | "unclear";

const ZONE_CONFIG: Record<PriorityZone, { label: string; bucket: Exclude<ReflectionBucket, "unclear">; bucketLabel: string; path: string }> = {
	crease: {
		label: "Torraum",
		bucket: "crease",
		bucketLabel: "Torraum",
		path: "M124 258 L206 258 L206 362 L124 362 Z",
	},
	low_slot: {
		label: "Low Slot",
		bucket: "low_slot",
		bucketLabel: "Low Slot",
		path: "M206 242 L356 206 L356 414 L206 378 Z",
	},
	high_slot: {
		label: "High Slot",
		bucket: "high_slot",
		bucketLabel: "High Slot",
		path: "M356 206 L500 176 L500 444 L356 414 Z",
	},
	left_halfwall: {
		label: "linke Halfwall",
		bucket: "halfwalls",
		bucketLabel: "Halfwalls",
		path: "M254 86 L580 86 L580 226 L254 226 Z",
	},
	right_halfwall: {
		label: "rechte Halfwall",
		bucket: "halfwalls",
		bucketLabel: "Halfwalls",
		path: "M254 394 L580 394 L580 534 L254 534 Z",
	},
	behind_net: {
		label: "hinter dem Tor",
		bucket: "behind_net",
		bucketLabel: "Hinter dem Tor",
		path: "M56 206 L124 206 L124 414 L56 414 Z",
	},
	left_point_lane: {
		label: "linke obere Zone",
		bucket: "point_lanes",
		bucketLabel: "Obere Zone",
		path: "M500 86 L848 86 L848 266 L500 266 Z",
	},
	right_point_lane: {
		label: "rechte obere Zone",
		bucket: "point_lanes",
		bucketLabel: "Obere Zone",
		path: "M500 354 L848 354 L848 534 L500 534 Z",
	},
};

function RinkZonePriorityObservationDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};

	const observationCount = Number(config?.observation_count ?? config?.observationCount ?? 3);
	const observationsKey = config?.observations_key || "observations";
	const observationIndexKey = config?.observation_index_key || "observationIndex";
	const selectedZoneKey = config?.selected_zone_key || "selectedZone";
	const noteKey = config?.note_key || "note";
	const createdAtKey = config?.created_at_key || "createdAt";
	const mostFrequentZoneKey = config?.most_frequent_zone_key || "mostFrequentZone";
	const reflectionConfig = config?.reflection || {};
	const reflectionKey = reflectionConfig?.key || "reflection";

	const noteEnabled = config?.note_enabled !== false;
	const summaryEnabled = config?.summary_enabled !== false;
	const reflectionEnabled = config?.reflection_enabled !== false;
	const activeFocusEnabled = config?.active_focus_enabled !== false;
	const zoneValues: PriorityZone[] = Array.isArray(config?.zones) && config.zones.length > 0
		? config.zones.filter((zone: string) => zone in ZONE_CONFIG)
		: [
			"crease",
			"low_slot",
			"high_slot",
			"left_halfwall",
			"right_halfwall",
			"behind_net",
			"left_point_lane",
			"right_point_lane",
		];

	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const observations = Array.isArray(safeAnswers[observationsKey]) ? safeAnswers[observationsKey] : [];
	const currentIndex = observations.length;
	const isComplete = observations.length >= observationCount;
	const progressPct = observationCount > 0 ? Math.round((observations.length / observationCount) * 100) : 0;

	const currentMission = missions[currentIndex] || {
		title: `Mission ${currentIndex + 1} von ${observationCount}`,
		prompt: "Finde eine geordnete Defensivszene.",
		hint: "Markiere den Raum, den die Defensive sichtbar priorisiert schützt.",
	};

	const draft = safeAnswers.__rink_zone_priority_observation_draft || {};
	const selectedZone: PriorityZone | "" = draft[selectedZoneKey] || "";
	const draftNote = draft[noteKey] || "";
	const reflectionValue: ReflectionBucket | "" = safeAnswers[reflectionKey] || "";

	const [isInteracting, setIsInteracting] = useState(false);

	const noteLabel = config?.note_label || "Woran hast du die Priorität erkannt?";
	const notePlaceholder = config?.note_placeholder || "Optional";
	const noteMaxChars = Number(config?.note_max_chars || 220);
	const saveButtonLabel = config?.save_button_label || "Beobachtung speichern";
	const decisionRule = config?.decision_rule || "Markiere nicht einfach den Ort des Pucks. Markiere den Raum, den die Defensive sichtbar priorisiert schützt.";
	const activeFocusTitle = config?.active_focus_title || "Active Focus";
	const activeFocusText = config?.active_focus_text || "Beobachte im weiteren Spiel, ob dieselbe Raumpriorität bestehen bleibt oder sich je nach Puckposition und Spielsituation verändert.";

	const updateDraft = (nextDraft: any) => {
		setAnswers({
			...safeAnswers,
			__rink_zone_priority_observation_draft: {
				...draft,
				...nextDraft,
			},
		});
	};

	const zoneCounts = observations.reduce((acc: Record<PriorityZone, number>, entry: any) => {
		const zone = entry?.[selectedZoneKey] as PriorityZone;
		if (zone && zone in ZONE_CONFIG) {
			acc[zone] = (acc[zone] || 0) + 1;
		}
		return acc;
	}, {} as Record<PriorityZone, number>);

	const bucketCounts = observations.reduce((acc: Record<Exclude<ReflectionBucket, "unclear">, number>, entry: any) => {
		const zone = entry?.[selectedZoneKey] as PriorityZone;
		if (!zone || !(zone in ZONE_CONFIG)) return acc;
		const bucket = ZONE_CONFIG[zone].bucket;
		acc[bucket] = (acc[bucket] || 0) + 1;
		return acc;
	}, {
		crease: 0,
		low_slot: 0,
		high_slot: 0,
		halfwalls: 0,
		behind_net: 0,
		point_lanes: 0,
	});

	const mostFrequentBucket = (Object.entries(bucketCounts) as Array<[Exclude<ReflectionBucket, "unclear">, number]>)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.find(([, count]) => count > 0)?.[0];

	const mostFrequentLabel = mostFrequentBucket
		? {
			crease: "Torraum",
			low_slot: "Low Slot",
			high_slot: "High Slot",
			halfwalls: "Halfwalls",
			behind_net: "Hinter dem Tor",
			point_lanes: "Obere Zone",
		}[mostFrequentBucket]
		: "";

	const reflectionOptions: Array<{ value: ReflectionBucket; label: string }> = [
		...(Object.entries(bucketCounts)
			.filter(([, count]) => count > 0)
			.map(([bucket]) => ({
				value: bucket as ReflectionBucket,
				label: {
					crease: "Torraum",
					low_slot: "Low Slot",
					high_slot: "High Slot",
					halfwalls: "Halfwalls",
					behind_net: "Hinter dem Tor",
					point_lanes: "Obere Zone",
				}[bucket as Exclude<ReflectionBucket, "unclear">],
			}))),
		{ value: "unclear", label: "Kein klares Muster" },
	];

	const setReflection = (nextReflection: ReflectionBucket) => {
		setAnswers({
			...safeAnswers,
			[reflectionKey]: nextReflection,
			[mostFrequentZoneKey]: mostFrequentBucket,
		});
	};

	const onSaveObservation = () => {
		if (!selectedZone || isComplete) return;

		const nextObservation = {
			[observationIndexKey]: currentIndex + 1,
			[selectedZoneKey]: selectedZone,
			[noteKey]: noteEnabled && draftNote.trim() ? draftNote.trim() : undefined,
			[createdAtKey]: new Date().toISOString(),
		};

		setAnswers({
			...safeAnswers,
			[observationsKey]: [...observations, nextObservation],
			__rink_zone_priority_observation_draft: {
				[selectedZoneKey]: "",
				[noteKey]: "",
			},
			[mostFrequentZoneKey]: mostFrequentBucket,
		});
	};

	const removeObservation = (index: number) => {
		const nextObservations = observations.filter((_: any, idx: number) => idx !== index);
		setAnswers({
			...safeAnswers,
			[observationsKey]: nextObservations,
		});
	};

	const isZoneSelected = (zone: PriorityZone) => selectedZone === zone;

	return (
		<div className="card primary-card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.65rem" }}>
					{drill.description}
				</p>
			)}

			<details className="nested-section mobile-flatten didactic-focus-section" style={{ marginBottom: "0.7rem" }}>
				<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
				<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
					{drill?.didactics?.explanation || "Achte nicht nur auf den Puck. Beobachte, welchen Raum die Defensive auch dann absichert, wenn sich der Puck bewegt."}
				</p>
			</details>

			<ObservationGuide drill={drill} />

			{!isComplete && (
				<section className="mobile-flatten-card" style={{ marginBottom: "0.75rem", padding: "0.8rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
					<div style={{ marginBottom: "0.45rem", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>{currentMission?.title || `Mission ${currentIndex + 1} von ${observationCount}`}</p>
						{currentMission?.prompt && <p style={{ margin: "0.18rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.32 }}>{currentMission.prompt}</p>}
						{currentMission?.hint && <p style={{ margin: "0.22rem 0 0", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem" }}>{currentMission.hint}</p>}
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

					<p className="nested-section mobile-flatten decision-rule-section" style={{ marginTop: 0, marginBottom: "0.5rem", color: "rgba(255,255,255,0.72)", fontSize: "0.86rem", lineHeight: 1.35 }}>
						<strong>Zentrale Entscheidungsregel:</strong><br />
						{decisionRule}
					</p>

					<div className="interaction-surface">
						<div
							className={`rink-wrapper rink-interaction-surface${isInteracting ? " is-interacting" : ""}`}
							onPointerDown={(event) => {
								if (event.pointerType === "touch") setIsInteracting(true);
							}}
							onPointerUp={() => setIsInteracting(false)}
							onPointerCancel={() => setIsInteracting(false)}
							style={{
								position: "relative",
								width: "100%",
								maxWidth: "760px",
								aspectRatio: "900 / 620",
								borderRadius: "10px",
								border: "1px solid rgba(81,145,162,0.45)",
								overflow: "hidden",
								background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
								marginBottom: "0.55rem",
								touchAction: isInteracting ? "none" : "manipulation",
							}}
						>
						<svg viewBox="0 0 900 620" role="img" aria-label="Defensivzone mit auswählbaren Räumen" style={{ width: "100%", height: "100%", display: "block" }}>
							<rect x="30" y="40" width="840" height="540" rx="110" ry="110" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
							<line x1="850" y1="50" x2="850" y2="570" stroke="rgba(86,153,255,0.75)" strokeWidth="5" />
							<rect x="118" y="268" width="14" height="84" fill="rgba(220,38,38,0.95)" />
							<path d="M132 258 A60 60 0 0 0 132 362" fill="none" stroke="rgba(220,38,38,0.82)" strokeWidth="5" />
							<circle cx="250" cy="165" r="62" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
							<circle cx="250" cy="455" r="62" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
							{zoneValues.map((zone) => {
								const zoneDef = ZONE_CONFIG[zone];
								const selected = isZoneSelected(zone);
								return (
									<g key={zone}>
										<path
											d={zoneDef.path}
											fill={selected ? "rgba(45,212,191,0.35)" : "rgba(255,255,255,0.02)"}
											stroke={selected ? "rgba(153,246,228,0.95)" : "rgba(255,255,255,0.22)"}
											strokeWidth={selected ? 3 : 2}
											onClick={() => updateDraft({ [selectedZoneKey]: zone })}
											style={{ cursor: "pointer" }}
										/>
										<title>{zoneDef.label}</title>
									</g>
								);
							})}
						</svg>
						</div>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: "0.35rem", marginBottom: "0.5rem" }}>
						{zoneValues.map((zone) => {
							const zoneDef = ZONE_CONFIG[zone];
							const selected = isZoneSelected(zone);
							return (
								<button
									key={zone}
									type="button"
									onClick={() => updateDraft({ [selectedZoneKey]: zone })}
									style={{
										minHeight: "44px",
										padding: "0.42rem 0.55rem",
										borderRadius: "6px",
										border: selected ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
										background: selected ? "rgba(20,184,166,0.24)" : "rgba(255,255,255,0.04)",
										color: "#f7f7ff",
										fontSize: "0.83rem",
										textAlign: "left",
										cursor: "pointer",
									}}
								>
									{zoneDef.label}
								</button>
							);
						})}
					</div>

					<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
						Ausgewählt: <strong>{selectedZone ? ZONE_CONFIG[selectedZone].label : "Keine Zone"}</strong>
					</div>

					{noteEnabled && (
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
						disabled={!selectedZone}
						style={{
							padding: "0.5rem 0.85rem",
							background: selectedZone ? "rgba(81,145,162,0.36)" : "rgba(81,145,162,0.14)",
							border: "1px solid rgba(81,145,162,0.62)",
							borderRadius: "4px",
							color: "#f7f7ff",
							fontWeight: 600,
							fontSize: "0.9rem",
							cursor: selectedZone ? "pointer" : "not-allowed",
						}}
					>
						{saveButtonLabel}
					</button>
				</section>
			)}

			<section className="mobile-flatten-card" style={{ marginBottom: "0.4rem", padding: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
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
								{ZONE_CONFIG[entry?.[selectedZoneKey] as PriorityZone]?.label || "Unbekannt"}
							</div>
							{entry?.[noteKey] && <div style={{ marginTop: "0.22rem", fontSize: "0.81rem", color: "rgba(255,255,255,0.64)" }}>{entry[noteKey]}</div>}
						</div>
					))}
				</div>

				{isComplete && summaryEnabled && (
					<div style={{ marginTop: "0.7rem" }}>
						<h4 style={{ marginTop: 0, marginBottom: "0.4rem" }}>Deine Beobachtungen</h4>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.4rem", marginBottom: "0.55rem" }}>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>Torraum: {bucketCounts.crease}</div>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>Low Slot: {bucketCounts.low_slot}</div>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>High Slot: {bucketCounts.high_slot}</div>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>Halfwalls: {bucketCounts.halfwalls}</div>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>Hinter dem Tor: {bucketCounts.behind_net}</div>
							<div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.82)" }}>Obere Zone: {bucketCounts.point_lanes}</div>
						</div>

						<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.35 }}>
							<strong>Rohdaten:</strong> {zoneValues.map((zone) => `${ZONE_CONFIG[zone].label} (${zoneCounts[zone] || 0})`).join(", ")}
						</div>

						{reflectionEnabled && reflectionOptions.length > 0 && (
							<>
								<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>
									{reflectionConfig?.label || "Welcher Raum hatte in deinen Beobachtungen die höchste erkennbare Schutzpriorität?"}
								</label>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.55rem" }}>
									{reflectionOptions.map((opt) => (
										<label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="rink_zone_priority_reflection"
												value={opt.value}
												checked={reflectionValue === opt.value}
												onChange={() => setReflection(opt.value)}
											/>
											<span>{opt.label}</span>
										</label>
									))}
								</div>
							</>
						)}

						{activeFocusEnabled && (!reflectionEnabled || !!reflectionValue) && (
							<section style={{ marginTop: "0.45rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
								<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
								<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
								{mostFrequentLabel && (
									<p style={{ margin: "0.35rem 0 0", color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>
										Bisher am häufigsten markiert:<br />
										<strong>{mostFrequentLabel}</strong>
									</p>
								)}
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

function DraggableRinkObservationDrill({ drill, answers, setAnswers, session, phase }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};
	const rinkMode = String(config?.mode || "position_observation");
	const isDefensiveStructureMode = rinkMode === "defensive_structure";
	const isFormationShiftMode = rinkMode === "formation_shift";
	const isSingleMarkerMode = rinkMode === "single_marker_observation";
	const usesDetailedRink = wantsDetailedHockeyRink(rinkMode, config);
	const rinkOverlays = normalizeRinkOverlays(usesDetailedRink ? "detailed" : rinkMode, config);

	const observationCount = Number(config?.observation_count || 3);
	const observationsKey = config?.observations_key || "observations";
	const attackDirectionKey = config?.attack_direction_key || "attackDirection";
	const attackDirectionOverrideKey = config?.attack_direction_override_key || attackDirectionKey;
	const attackDirectionDefault = config?.attack_direction_default || "right";
	const homeAttackDirectionP1 = config?.home_attack_direction_p1 || "right";
	const mirrorBubblesWithDirection = config?.mirror_bubbles_with_attack_direction !== false;
	const manualAttackDirection = safeAnswers[attackDirectionOverrideKey] || "";
	const reflectionConfig = config?.completion_reflection || {};
	const reflectionKey = reflectionConfig?.key || "final_reflection";
	const reflectionOptions = Array.isArray(reflectionConfig?.options) ? reflectionConfig.options : ["ja", "nein", "kein klares Muster"];

	const initiatorKey = config?.initiator_key || "initiatorPosition";
	const locationKey = config?.location_key || "accessLocation";
	const playerPositionsKey = config?.player_positions_key || "playerPositions";
	const zoneKey = config?.zone_key || "zone";
	const noteKey = config?.note_key || "note";
	const observationIndexKey = config?.observation_index_key || "observationIndex";
	const createdAtKey = config?.created_at_key || "createdAt";
	const structureRatingConfig = config?.structure_rating || {};
	const structureRatingKey = structureRatingConfig?.key || "structureRating";
	const structureRatingLabel = structureRatingConfig?.label || "Wie wirkt die defensive Struktur?";
	const structureRatingOptions = Array.isArray(structureRatingConfig?.options) ? structureRatingConfig.options : [];
	const structuralFunctionConfig = config?.structural_function || {};
	const structuralFunctionKey = structuralFunctionConfig?.key || "structuralFunction";
	const structuralFunctionLabel = structuralFunctionConfig?.label || "Welche Funktion erfüllt diese Struktur hauptsächlich?";
	const structuralFunctionOptions = Array.isArray(structuralFunctionConfig?.options) ? structuralFunctionConfig.options : [];
	const keyStructureElementConfig = config?.key_structure_element || {};
	const keyStructureElementKey = keyStructureElementConfig?.key || "keyStructureElement";
	const keyStructureElementLabel = keyStructureElementConfig?.label || "Welcher Teil der Struktur war entscheidend?";
	const keyStructureElementOptions = Array.isArray(keyStructureElementConfig?.options) ? keyStructureElementConfig.options : [];
	const completionQuestionConfig = config?.completion_question || {};
	const completionQuestionKey = completionQuestionConfig?.key || "defensiveStructureSummary";
	const completionQuestionLabel = completionQuestionConfig?.label || "Welche Struktur zeigte die Defensive?";
	const completionQuestionOptions = Array.isArray(completionQuestionConfig?.options) ? completionQuestionConfig.options : [];
	const completionNoteConfig = config?.completion_note || {};
	const completionNoteKey = completionNoteConfig?.key || "defensiveStructureReason";
	const completionNoteLabel = completionNoteConfig?.label || "Woran hast du diese Struktur erkannt?";
	const completionNotePlaceholder = completionNoteConfig?.placeholder || "Optional";
	const completionNoteMaxChars = Number(completionNoteConfig?.max_chars || 600);
	const formationStatesKey = config?.formation_states_key || "formationStates";
	const beforeStateKey = config?.before_state_key || "before";
	const afterStateKey = config?.after_state_key || "after";
	const activeFormationStateKey = config?.active_formation_state_key || "activeFormationState";
	const copyBeforeToAfterEnabled = config?.copy_before_to_after_enabled !== false;
	const copyBeforeToAfterLabel = config?.copy_before_to_after_label || "Positionen aus Vorher übernehmen";
	const beforeHeading = config?.before_heading || "1. Struktur vor der Bewegung";
	const beforeHint = config?.before_hint || "Positioniere die fünf Defensivspieler so, wie die Formation vor der Puckverlagerung oder offensiven Bewegung organisiert war.";
	const afterHeading = config?.after_heading || "2. Struktur nach der Reaktion";
	const afterHint = config?.after_hint || "Positioniere die Spieler so, wie die Defensive nach der Bewegung reagiert hat.";

	const reactionTypeConfig = config?.reaction_type || {};
	const reactionTypeKey = reactionTypeConfig?.key || "reactionType";
	const reactionTypeLabel = reactionTypeConfig?.label || "Wie reagierte die Defensive auf die Bewegung?";
	const reactionTypeOptions = Array.isArray(reactionTypeConfig?.options) ? reactionTypeConfig.options : [];

	const structuralOutcomeConfig = config?.structural_outcome || {};
	const structuralOutcomeKey = structuralOutcomeConfig?.key || "structuralOutcome";
	const structuralOutcomeLabel = structuralOutcomeConfig?.label || "Was geschah mit der defensiven Struktur?";
	const structuralOutcomeOptions = Array.isArray(structuralOutcomeConfig?.options) ? structuralOutcomeConfig.options : [];

	const movementTriggerConfig = config?.movement_trigger || {};
	const movementTriggerKey = movementTriggerConfig?.key || "movementTrigger";
	const movementTriggerLabel = movementTriggerConfig?.label || "Was löste die defensive Anpassung hauptsächlich aus?";
	const movementTriggerOptions = Array.isArray(movementTriggerConfig?.options) ? movementTriggerConfig.options : [];

	const observationNoteConfig = config?.observation_note || {};
	const observationNoteKey = observationNoteConfig?.key || "observationNote";
	const observationNoteLabel = observationNoteConfig?.label || "Woran hast du die Veränderung der Struktur erkannt?";
	const observationNotePlaceholder = observationNoteConfig?.placeholder || "Optional";
	const observationNoteMaxChars = Number(observationNoteConfig?.max_chars || 600);

	const observationFields = Array.isArray(config?.observation_fields) ? config.observation_fields : [];
	const markersConfig = Array.isArray(config?.markers) && config.markers.length > 0
		? config.markers
		: (config?.marker ? [config.marker] : [{ id: "marker", label: "Marker", required: true }]);
	const primaryMarker = markersConfig[0] || { id: "marker", label: "Marker", required: true };
	const markerId = String(primaryMarker?.id || "marker");
	const markerLabel = String(primaryMarker?.label || "Marker");
	const markerRequired = primaryMarker?.required !== false;
	const allowMarkerReposition = config?.allow_reposition !== false && config?.allowReposition !== false;

	const missions = Array.isArray(config?.missions) ? config.missions : [];
	const formationPreset = String(config?.formation_preset || config?.formationPreset || "5v5_default");
	const presetPositionBubbles = getFormationPreset(formationPreset);
	const positionBubbles = Array.isArray(config?.position_bubbles) && config.position_bubbles.length > 0
		? config.position_bubbles
		: presetPositionBubbles;
	const leftBlueLineX = Number(
		config?.zone_boundaries?.left_blue_line_x
		?? (usesDetailedRink ? DETAILED_RINK_ZONE_BOUNDARIES.left_blue_line_x : 0.291),
	);
	const rightBlueLineX = Number(
		config?.zone_boundaries?.right_blue_line_x
		?? (usesDetailedRink ? DETAILED_RINK_ZONE_BOUNDARIES.right_blue_line_x : 0.709),
	);
	const zoneLabels = {
		defensive: config?.zone_labels?.defensive || "Defensive Zone",
		neutral: config?.zone_labels?.neutral || "Neutrale Zone",
		offensive: config?.zone_labels?.offensive || "Offensive Zone",
	};

	const selectionLabel = config?.selection_label || (isSingleMarkerMode ? "1. Wo entstand der Trigger?" : "Ziehe eine Positions-Bubble an den Zugriffsort");
	const locationLabel = config?.location_label || (isSingleMarkerMode
		? "Setze den Marker an den Ort, an dem die Defensive von kontrollierter Raumverteidigung zu aktivem Zugriff übergeht."
		: "Bubble bewegen = Position und Zugriffsort in einer Aktion");
	const markerHeading = config?.marker_heading || selectionLabel;
	const markerHint = config?.marker_hint || locationLabel;
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
		prompt: isSingleMarkerMode
			? "Markiere den Ort, an dem aktiver defensiver Druck entsteht."
			: "Finde eine passende Situation mit erstem defensivem Druck.",
		hint: isSingleMarkerMode
			? "Tippe auf den Rink, um den Trigger-Marker zu setzen."
			: "Ziehe die passende Positions-Bubble direkt an den Zugriffsort.",
	};

	const draft = safeAnswers.__draggable_rink_observation_draft || {};
	const selectedPosition = draft[initiatorKey] || "";
	const selectedLocationRaw = draft[locationKey] || null;
	const draftPlayerPositionsRaw = draft[playerPositionsKey] || {};
	const draftStructureRating = draft[structureRatingKey] || "";
	const draftStructuralFunction = draft[structuralFunctionKey] || "";
	const draftKeyStructureElement = draft[keyStructureElementKey] || "";
	const draftNote = draft[noteKey] || "";
	const draftReactionType = draft[reactionTypeKey] || "";
	const draftStructuralOutcome = draft[structuralOutcomeKey] || "";
	const draftMovementTrigger = draft[movementTriggerKey] || "";
	const draftObservationNote = draft[observationNoteKey] || "";
	const activeFormationState = draft[activeFormationStateKey] === afterStateKey ? afterStateKey : beforeStateKey;
	const draftObservationFieldValues = Object.fromEntries(
		observationFields.map((field: any) => {
			const key = String(field?.key || "");
			return [key, key ? (draft[key] || "") : ""];
		}),
	) as Record<string, string>;
	const emptyObservationFieldDraft = Object.fromEntries(
		observationFields.map((field: any) => [String(field?.key || ""), ""]),
	);

	const rinkRef = useRef<HTMLDivElement | null>(null);
	const [draggingPosition, setDraggingPosition] = useState<string>("");
	const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
	const [dragPointerType, setDragPointerType] = useState<string>("");

	const [flashMessage, setFlashMessage] = useState<string>("");

	const clamp = (value: number) => Math.max(0, Math.min(1, value));
	const movementThreshold = Number(config?.movement_threshold || 0.015);
	const normalizePositionMap = (raw: any) => Object.fromEntries(
		positionBubbles.map((bubble: any) => {
			const point = raw?.[bubble.value];
			const x = Number(point?.x);
			const y = Number(point?.y);
			if (!Number.isFinite(x) || !Number.isFinite(y)) return [bubble.value, undefined];
			return [bubble.value, { x: clamp(Number(x.toFixed(3))), y: clamp(Number(y.toFixed(3))) }];
		}),
	) as Record<string, { x: number; y: number } | undefined>;

	const normalizeStateMap = (raw: any) => ({
		[beforeStateKey]: normalizePositionMap(raw?.[beforeStateKey] || {}),
		[afterStateKey]: normalizePositionMap(raw?.[afterStateKey] || {}),
	});

	const draftPlayerPositions = Object.fromEntries(
		positionBubbles.map((bubble: any) => {
			const raw = draftPlayerPositionsRaw?.[bubble.value];
			const x = Number(raw?.x);
			const y = Number(raw?.y);
			if (!Number.isFinite(x) || !Number.isFinite(y)) return [bubble.value, undefined];
			return [bubble.value, { x: clamp(Number(x.toFixed(3))), y: clamp(Number(y.toFixed(3))) }];
		}),
	) as Record<string, { x: number; y: number } | undefined>;
	const [localPlayerPositions, setLocalPlayerPositions] = useState<Record<string, { x: number; y: number } | undefined>>(draftPlayerPositions);
	const [localFormationStates, setLocalFormationStates] = useState<Record<string, Record<string, { x: number; y: number } | undefined>>>(
		normalizeStateMap(draft[formationStatesKey] || {}),
	);
	const serializedDraftPlayerPositions = JSON.stringify(draftPlayerPositionsRaw || {});
	const serializedDraftFormationStates = JSON.stringify(draft[formationStatesKey] || {});

	useEffect(() => {
		if (!isDefensiveStructureMode) return;
		setLocalPlayerPositions(draftPlayerPositions);
	}, [isDefensiveStructureMode, serializedDraftPlayerPositions]);

	useEffect(() => {
		if (!isFormationShiftMode) return;
		setLocalFormationStates(normalizeStateMap(draft[formationStatesKey] || {}));
	}, [isFormationShiftMode, serializedDraftFormationStates]);

	const normalizeTeam = (value: any) => String(value || "").trim().toLowerCase();
	const inferPeriodNumber = () => {
		const fromPhase = String(phase || session?.current_phase || "").toUpperCase();
		if (fromPhase.startsWith("P")) {
			const n = Number(fromPhase.replace("P", ""));
			if (Number.isFinite(n) && n >= 1) return n;
		}
		return 1;
	};

	const inferAutoAttackDirection = (): "left" | "right" => {
		const period = inferPeriodNumber();
		const homeDirection = period % 2 === 1
			? homeAttackDirectionP1
			: (homeAttackDirectionP1 === "right" ? "left" : "right");

		const observedTeam = normalizeTeam(session?.game_info?.observed_team || session?.observed_team);
		const homeTeam = normalizeTeam(session?.game_info?.team_home);
		const awayTeam = normalizeTeam(session?.game_info?.team_away);

		if (observedTeam && homeTeam && observedTeam === homeTeam) {
			return homeDirection === "left" ? "left" : "right";
		}
		if (observedTeam && awayTeam && observedTeam === awayTeam) {
			return homeDirection === "left" ? "right" : "left";
		}

		return attackDirectionDefault === "left" ? "left" : "right";
	};

	const autoAttackDirection = inferAutoAttackDirection();
	const attackDirection: "left" | "right" = manualAttackDirection === "left" || manualAttackDirection === "right"
		? manualAttackDirection
		: autoAttackDirection;
	const isDirectionOverrideActive = manualAttackDirection === "left" || manualAttackDirection === "right";

	const normalizeLocation = (location: any): { x: number; y: number } | null => {
		const x = Number(location?.x);
		const y = Number(location?.y);
		if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
		return {
			x: clamp(x),
			y: clamp(y),
		};
	};

	const selectedLocation = normalizeLocation(selectedLocationRaw);

	const baseFormationByRole: Record<string, { x: number; y: number }> = useMemo(
		() => Object.fromEntries(
			positionBubbles.map((bubble: any) => [
				bubble.value,
				{
					x: clamp(Number(bubble.start_x)),
					y: clamp(Number(bubble.start_y)),
				},
			]),
		),
		[positionBubbles],
	);

	const getFormationForDirection = (baseFormation: Record<string, { x: number; y: number }>, direction: "left" | "right") => {
		return Object.fromEntries(
			Object.keys(baseFormation).map((role) => {
				const sourceRole = mirrorBubblesWithDirection && direction === "left"
					? (PERSPECTIVE_ROLE_SWAP[role] || role)
					: role;
				const source = baseFormation[sourceRole] || baseFormation[role];
				const mirroredX = mirrorBubblesWithDirection && direction === "left"
					? (1 - source.x)
					: source.x;
				return [
					role,
					{
						x: Number(mirroredX.toFixed(3)),
						y: Number(source.y.toFixed(3)),
					},
				];
			}),
		);
	};

	const startByPosition: Record<string, { x: number; y: number }> = useMemo(
		() => getFormationForDirection(baseFormationByRole, attackDirection),
		[attackDirection, baseFormationByRole, mirrorBubblesWithDirection],
	);

	const getBaseZone = (x: number): "left" | "neutral" | "right" => {
		if (x < leftBlueLineX) return "left";
		if (x > rightBlueLineX) return "right";
		return "neutral";
	};

	const deriveZone = (x: number): "defensive" | "neutral" | "offensive" => {
		const base = getBaseZone(x);
		if (base === "neutral") return "neutral";
		if (attackDirection === "left") {
			return base === "left" ? "offensive" : "defensive";
		}
		return base === "left" ? "defensive" : "offensive";
	};

	const updateDraft = (nextDraft: any) => {
		setAnswers({
			...safeAnswers,
			__draggable_rink_observation_draft: {
				...draft,
				...nextDraft,
			},
		});
	};

	const clearDraft = () => {
		if (isDefensiveStructureMode) {
			setLocalPlayerPositions({});
		}
		if (isFormationShiftMode) {
			setLocalFormationStates({
				[beforeStateKey]: {},
				[afterStateKey]: {},
			});
		}
		setAnswers({
			...safeAnswers,
			__draggable_rink_observation_draft: {
				[initiatorKey]: "",
				[locationKey]: null,
				[playerPositionsKey]: {},
				[formationStatesKey]: {
					[beforeStateKey]: {},
					[afterStateKey]: {},
				},
				[activeFormationStateKey]: beforeStateKey,
				[structureRatingKey]: "",
				[structuralFunctionKey]: "",
				[keyStructureElementKey]: "",
				[reactionTypeKey]: "",
				[structuralOutcomeKey]: "",
				[movementTriggerKey]: "",
				[observationNoteKey]: "",
				[noteKey]: "",
				...emptyObservationFieldDraft,
			},
		});
	};

	const locationFromPointer = (event: PointerEvent) => {
		if (!rinkRef.current) return null;
		const rect = rinkRef.current.getBoundingClientRect();
		const x = clamp((event.clientX - rect.left) / rect.width);
		const y = clamp((event.clientY - rect.top) / rect.height);
		return { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) };
	};

	useEffect(() => {
		if (!draggingPosition) return;

		const onPointerMove = (event: PointerEvent) => {
			if (dragPointerType === "touch" || dragPointerType === "pen") {
				event.preventDefault();
			}
			const nextPoint = locationFromPointer(event);
			if (!nextPoint) return;
			setDragPoint(nextPoint);
		};

		const onPointerUp = () => {
			if (!draggingPosition || !dragPoint) {
				setDraggingPosition("");
				setDragPoint(null);
				setDragPointerType("");
				return;
			}

			if (isDefensiveStructureMode) {
				const nextPositions = {
					...localPlayerPositions,
					[draggingPosition]: dragPoint,
				};
				setLocalPlayerPositions(nextPositions);
				updateDraft({
					[playerPositionsKey]: nextPositions,
				});
			} else if (isFormationShiftMode) {
				const nextStatePositions = {
					...(localFormationStates[activeFormationState] || {}),
					[draggingPosition]: dragPoint,
				};
				const nextFormationStates = {
					...localFormationStates,
					[activeFormationState]: nextStatePositions,
				};
				setLocalFormationStates(nextFormationStates);
				updateDraft({
					[formationStatesKey]: nextFormationStates,
				});
			} else if (isSingleMarkerMode) {
				updateDraft({
					[locationKey]: dragPoint,
				});
			} else {
				updateDraft({
					[initiatorKey]: draggingPosition,
					[locationKey]: dragPoint,
				});
			}
			setDraggingPosition("");
			setDragPoint(null);
			setDragPointerType("");
		};

		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);

		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};
	}, [dragPoint, draggingPosition, dragPointerType, isDefensiveStructureMode, isFormationShiftMode, isSingleMarkerMode, localPlayerPositions, localFormationStates, activeFormationState]);

	useEffect(() => {
		if (!draggingPosition) return;
		if (dragPointerType !== "touch" && dragPointerType !== "pen") return;

		const previousOverflow = document.body.style.overflow;
		const previousTouchAction = document.body.style.touchAction;
		const previousOverscrollBehavior = document.body.style.overscrollBehavior;

		document.body.style.overflow = "hidden";
		document.body.style.touchAction = "none";
		document.body.style.overscrollBehavior = "none";

		return () => {
			document.body.style.overflow = previousOverflow;
			document.body.style.touchAction = previousTouchAction;
			document.body.style.overscrollBehavior = previousOverscrollBehavior;
		};
	}, [draggingPosition, dragPointerType]);

	const startDrag = (positionValue: string, event: any) => {
		event.preventDefault();
		event.stopPropagation();
		setDragPointerType(String(event.pointerType || ""));
		setDraggingPosition(positionValue);
		event.currentTarget?.setPointerCapture?.(event.pointerId);
		const startPoint = isDefensiveStructureMode
			? (localPlayerPositions[positionValue] || startByPosition[positionValue])
			: isFormationShiftMode
				? ((localFormationStates[activeFormationState] || {})[positionValue] || startByPosition[positionValue])
			: isSingleMarkerMode
				? (selectedLocation || null)
			: (draft[initiatorKey] === positionValue && draft[locationKey]
				? draft[locationKey]
				: startByPosition[positionValue]);
		setDragPoint(startPoint || null);
	};

	const placeSingleMarker = (event: any) => {
		if (!isSingleMarkerMode || isComplete) return;
		if ((event.target as HTMLElement)?.closest?.("button")) return;
		if (event.pointerType === "touch" || event.pointerType === "pen") {
			event.preventDefault?.();
		}
		const point = locationFromPointer(event.nativeEvent || event);
		if (!point) return;
		if (selectedLocation && !allowMarkerReposition) return;
		updateDraft({ [locationKey]: point });
	};

	const setActiveFormationState = (nextState: string) => {
		if (!isFormationShiftMode) return;
		updateDraft({ [activeFormationStateKey]: nextState });
	};

	const copyBeforeToAfter = () => {
		if (!isFormationShiftMode || !copyBeforeToAfterEnabled) return;
		const copiedAfter = Object.fromEntries(
			positionBubbles.map((bubble: any) => {
				const source = localFormationStates[beforeStateKey]?.[bubble.value];
				if (!source) return [bubble.value, undefined];
				return [bubble.value, { x: source.x, y: source.y }];
			}),
		) as Record<string, { x: number; y: number } | undefined>;
		const nextFormationStates = {
			...localFormationStates,
			[afterStateKey]: copiedAfter,
		};
		setLocalFormationStates(nextFormationStates);
		updateDraft({ [formationStatesKey]: nextFormationStates, [activeFormationStateKey]: afterStateKey });
	};

	const applyDirectionChange = (nextDirection: "left" | "right", useManualOverride: boolean) => {
		const nextAnswers: any = {
			...safeAnswers,
		};

		if (useManualOverride) {
			nextAnswers[attackDirectionOverrideKey] = nextDirection;
		} else {
			delete nextAnswers[attackDirectionOverrideKey];
		}

		setAnswers(nextAnswers);
	};

	const setAttackDirection = (value: "left" | "right") => {
		applyDirectionChange(value, true);
	};

	const resetAttackDirectionOverride = () => {
		applyDirectionChange(autoAttackDirection, false);
	};

	const effectivePosition = draggingPosition || selectedPosition;
	const effectiveLocation = draggingPosition ? dragPoint : selectedLocation;
	const effectiveZone = effectiveLocation ? deriveZone(effectiveLocation.x) : null;
	const activeFormationPositions = localFormationStates[activeFormationState] || {};
	const startForActive = effectivePosition ? startByPosition[effectivePosition] : null;
	const movedEnough = !!(effectivePosition && effectiveLocation && startForActive && Math.hypot(effectiveLocation.x - startForActive.x, effectiveLocation.y - startForActive.y) > movementThreshold);
	const positionedPlayers = positionBubbles
		.map((bubble: any) => ({ position: bubble.value, location: (isDefensiveStructureMode ? localPlayerPositions[bubble.value] : draftPlayerPositions[bubble.value]) }))
		.filter((entry: { position: string; location?: { x: number; y: number } }) => !!entry.location);
	const beforePositionedPlayers = positionBubbles
		.map((bubble: any) => ({ position: bubble.value, location: localFormationStates[beforeStateKey]?.[bubble.value] }))
		.filter((entry: { position: string; location?: { x: number; y: number } }) => !!entry.location);
	const afterPositionedPlayers = positionBubbles
		.map((bubble: any) => ({ position: bubble.value, location: localFormationStates[afterStateKey]?.[bubble.value] }))
		.filter((entry: { position: string; location?: { x: number; y: number } }) => !!entry.location);
	const allPlayersPositioned = positionedPlayers.length === positionBubbles.length;
	const canSaveFormationShift = beforePositionedPlayers.length === positionBubbles.length
		&& afterPositionedPlayers.length === positionBubbles.length
		&& !!draftReactionType
		&& !!draftStructuralOutcome
		&& !!draftMovementTrigger;
	const requiredObservationFieldsFilled = observationFields
		.filter((field: any) => field?.required !== false)
		.every((field: any) => {
			const key = String(field?.key || "");
			return !!key && !!draftObservationFieldValues[key];
		});
	const markerLocationEffective = draggingPosition === markerId && dragPoint
		? dragPoint
		: selectedLocation;
	const canSaveSingleMarker = (!markerRequired || !!markerLocationEffective)
		&& requiredObservationFieldsFilled;
	const canSave = isFormationShiftMode
		? canSaveFormationShift
		: isDefensiveStructureMode
		? (allPlayersPositioned && !!draftStructureRating && !!draftStructuralFunction)
		: isSingleMarkerMode
		? canSaveSingleMarker
		: movedEnough;

	const onSaveObservation = () => {
		if (!canSave || isComplete) return;

		if (isSingleMarkerMode) {
			const nextObservation: Record<string, any> = {
				[observationIndexKey]: currentIndex + 1,
				[locationKey]: markerLocationEffective
					? {
						x: Number(markerLocationEffective.x.toFixed(4)),
						y: Number(markerLocationEffective.y.toFixed(4)),
					}
					: null,
				[observationNoteKey]: draftObservationNote.trim() || "",
				[createdAtKey]: new Date().toISOString(),
			};
			observationFields.forEach((field: any) => {
				const key = String(field?.key || "");
				if (!key) return;
				nextObservation[key] = draftObservationFieldValues[key] || "";
			});

			setAnswers({
				...safeAnswers,
				[observationsKey]: [...observations, nextObservation],
				__draggable_rink_observation_draft: {
					[locationKey]: null,
					[observationNoteKey]: "",
					...emptyObservationFieldDraft,
				},
			});

			setFlashMessage(savedFeedbackTemplate.replace("{index}", String(currentIndex + 1)));
			window.setTimeout(() => setFlashMessage(""), 1200);
			return;
		}

		if (isFormationShiftMode) {
			const serializePositions = (entries: Array<{ position: string; location?: { x: number; y: number } }>) => entries
				.filter((entry) => !!entry.location)
				.map((entry) => ({
					position: entry.position,
					x: Number(entry.location!.x.toFixed(4)),
					y: Number(entry.location!.y.toFixed(4)),
				}));

			const nextObservation = {
				[observationIndexKey]: currentIndex + 1,
				[formationStatesKey]: {
					[beforeStateKey]: serializePositions(beforePositionedPlayers),
					[afterStateKey]: serializePositions(afterPositionedPlayers),
				},
				[reactionTypeKey]: draftReactionType,
				[structuralOutcomeKey]: draftStructuralOutcome,
				[movementTriggerKey]: draftMovementTrigger,
				[observationNoteKey]: draftObservationNote.trim() || "",
				[createdAtKey]: new Date().toISOString(),
			};

			setAnswers({
				...safeAnswers,
				[observationsKey]: [...observations, nextObservation],
				__draggable_rink_observation_draft: {
					[formationStatesKey]: {
						[beforeStateKey]: {},
						[afterStateKey]: {},
					},
					[activeFormationStateKey]: beforeStateKey,
					[reactionTypeKey]: "",
					[structuralOutcomeKey]: "",
					[movementTriggerKey]: "",
					[observationNoteKey]: "",
				},
			});
			setLocalFormationStates({
				[beforeStateKey]: {},
				[afterStateKey]: {},
			});

			setFlashMessage(savedFeedbackTemplate.replace("{index}", String(currentIndex + 1)));
			window.setTimeout(() => setFlashMessage(""), 1200);
			return;
		}

		if (isDefensiveStructureMode) {
			const nextObservation = {
				[observationIndexKey]: currentIndex + 1,
				[playerPositionsKey]: positionedPlayers.map((entry: { position: string; location?: { x: number; y: number } }) => ({
					position: entry.position,
					x: Number(entry.location!.x.toFixed(4)),
					y: Number(entry.location!.y.toFixed(4)),
				})),
				[structureRatingKey]: draftStructureRating,
				[structuralFunctionKey]: draftStructuralFunction,
				[keyStructureElementKey]: draftKeyStructureElement || undefined,
				[noteKey]: draftNote.trim() || undefined,
				[createdAtKey]: new Date().toISOString(),
			};

			setAnswers({
				...safeAnswers,
				[observationsKey]: [...observations, nextObservation],
				__draggable_rink_observation_draft: {
					[playerPositionsKey]: {},
					[structureRatingKey]: "",
					[structuralFunctionKey]: "",
					[keyStructureElementKey]: "",
					[noteKey]: "",
				},
			});
			setLocalPlayerPositions({});

			setFlashMessage(savedFeedbackTemplate.replace("{index}", String(currentIndex + 1)));
			window.setTimeout(() => setFlashMessage(""), 1200);
			return;
		}

		const nextObservation = {
			[initiatorKey]: effectivePosition,
			[locationKey]: effectiveLocation,
			[zoneKey]: effectiveLocation ? deriveZone(effectiveLocation.x) : undefined,
			[noteKey]: draftNote.trim() || undefined,
			[observationIndexKey]: currentIndex + 1,
			[createdAtKey]: new Date().toISOString(),
		};

		setAnswers({
			...safeAnswers,
			[observationsKey]: [...observations, nextObservation],
			__draggable_rink_observation_draft: {
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
	const completionQuestionValue = safeAnswers[completionQuestionKey] || "";
	const completionNoteValue = safeAnswers[completionNoteKey] || "";
	const positionCounts = observations.reduce((acc: Record<string, number>, entry: any) => {
		const key = entry?.[initiatorKey] || "";
		if (!key) return acc;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});
	const zoneCounts = observations.reduce((acc: Record<string, number>, entry: any) => {
		const key = entry?.[zoneKey] || "";
		if (!key) return acc;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	const findMarkerLabel = (value: string) => {
		const found = positionBubbles.find((bubble: any) => bubble.value === value);
		return found?.label || value;
	};

	const zoneDisplay = (zoneValue: string) => {
		if (zoneValue === "defensive") return zoneLabels.defensive;
		if (zoneValue === "offensive") return zoneLabels.offensive;
		if (zoneValue === "neutral") return zoneLabels.neutral;
		return zoneValue;
	};

	const getOptionLabel = (options: any[], value: string) => {
		const found = options.find((opt: any) => (typeof opt === "string" ? opt : String(opt?.value || "")) === value);
		if (!found) return value;
		return typeof found === "string" ? found : String(found?.label || found?.value || value);
	};

	return (
		<div className="card primary-card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.65rem" }}>
					{drill.description}
				</p>
			)}

			<details className="nested-section mobile-flatten didactic-focus-section" style={{ marginBottom: "0.7rem" }}>
				<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
				<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
					{drill?.didactics?.explanation || "Defensiver Druck beginnt, sobald ein Spieler den Gegner aktiv zwingt, Zeit, Raum, Laufweg oder eine Option anzupassen."}
				</p>
			</details>

			<ObservationGuide drill={drill} />

			{!isComplete && (
				<section className="mobile-flatten-card" style={{ marginBottom: "0.75rem", padding: "0.8rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
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

					{!(isDefensiveStructureMode || isFormationShiftMode || isSingleMarkerMode) && (
					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.38rem", alignItems: "center", marginBottom: "0.45rem" }}>
						<span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.76)" }}>
							Angriffsrichtung: <strong>{attackDirection === "right" ? "nach rechts" : "nach links"}</strong> {isDirectionOverrideActive ? "(manuell)" : "(auto aus Session)"}
						</span>
						<button
							type="button"
							onClick={() => setAttackDirection("right")}
							style={{
								padding: "0.2rem 0.55rem",
								borderRadius: "999px",
								border: attackDirection === "right" ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
								background: attackDirection === "right" ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
								color: "#f7f7ff",
								fontSize: "0.8rem",
								cursor: "pointer",
							}}
						>
							nach rechts
						</button>
						<button
							type="button"
							onClick={() => setAttackDirection("left")}
							style={{
								padding: "0.2rem 0.55rem",
								borderRadius: "999px",
								border: attackDirection === "left" ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
								background: attackDirection === "left" ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
								color: "#f7f7ff",
								fontSize: "0.8rem",
								cursor: "pointer",
							}}
						>
							nach links
						</button>
						<button
							type="button"
							onClick={() => setAttackDirection(attackDirection === "right" ? "left" : "right")}
							style={{
								padding: "0.2rem 0.55rem",
								borderRadius: "999px",
								border: "1px solid rgba(255,255,255,0.3)",
								background: "rgba(255,255,255,0.04)",
								color: "#f7f7ff",
								fontSize: "0.8rem",
								cursor: "pointer",
							}}
						>
							Angriffsrichtung wechseln ↔
						</button>
						{isDirectionOverrideActive && (
							<button
								type="button"
								onClick={resetAttackDirectionOverride}
								style={{
									padding: "0.2rem 0.55rem",
									borderRadius: "999px",
									border: "1px solid rgba(255,255,255,0.3)",
									background: "rgba(255,255,255,0.04)",
									color: "#f7f7ff",
									fontSize: "0.8rem",
									cursor: "pointer",
								}}
							>
								Auto wiederherstellen
							</button>
						)}
					</div>
					)}

					{isFormationShiftMode && (
						<div style={{ marginBottom: "0.5rem" }}>
							<div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.45rem", flexWrap: "wrap" }}>
								<button
									type="button"
									onClick={() => setActiveFormationState(beforeStateKey)}
									style={{
										padding: "0.28rem 0.7rem",
										borderRadius: "999px",
										border: activeFormationState === beforeStateKey ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
										background: activeFormationState === beforeStateKey ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
										color: "#f7f7ff",
										fontSize: "0.82rem",
										fontWeight: 700,
										cursor: "pointer",
									}}
								>
									Vorher
								</button>
								<button
									type="button"
									onClick={() => setActiveFormationState(afterStateKey)}
									style={{
										padding: "0.28rem 0.7rem",
										borderRadius: "999px",
										border: activeFormationState === afterStateKey ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.3)",
										background: activeFormationState === afterStateKey ? "rgba(20,184,166,0.88)" : "rgba(255,255,255,0.04)",
										color: "#f7f7ff",
										fontSize: "0.82rem",
										fontWeight: 700,
										cursor: "pointer",
									}}
								>
									Nachher
								</button>
								{copyBeforeToAfterEnabled && (
									<button
										type="button"
										onClick={copyBeforeToAfter}
										style={{
											padding: "0.28rem 0.7rem",
											borderRadius: "999px",
											border: "1px solid rgba(255,255,255,0.3)",
											background: "rgba(255,255,255,0.04)",
											color: "#f7f7ff",
											fontSize: "0.82rem",
											cursor: "pointer",
										}}
									>
										{copyBeforeToAfterLabel}
									</button>
								)}
							</div>
							<div style={{ marginBottom: "0.32rem" }}>
								<strong>{activeFormationState === beforeStateKey ? beforeHeading : afterHeading}</strong>
							</div>
							<p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
								{activeFormationState === beforeStateKey ? beforeHint : afterHint}
							</p>
						</div>
					)}

					<div style={{ marginBottom: "0.45rem" }}>
						<label style={{ display: "block", marginBottom: "0.22rem", fontWeight: 600 }}>{isSingleMarkerMode ? markerHeading : selectionLabel}</label>
						<p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.62)" }}>{isSingleMarkerMode ? markerHint : locationLabel}</p>
					</div>

					<div className="interaction-surface">
						<div
							className={`rink-wrapper rink-interaction-surface${draggingPosition ? " is-interacting" : ""}`}
						ref={rinkRef}
						onPointerDown={isSingleMarkerMode ? placeSingleMarker : undefined}
						style={{
							position: "relative",
							width: "100%",
							maxWidth: usesDetailedRink ? "760px" : "660px",
							aspectRatio: usesDetailedRink ? "900 / 620" : "11 / 7",
							borderRadius: "10px",
							border: "1px solid rgba(81,145,162,0.45)",
							overflow: "hidden",
							background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
							marginBottom: "0.55rem",
							cursor: draggingPosition ? "grabbing" : (isSingleMarkerMode ? "crosshair" : "default"),
							touchAction: draggingPosition ? "none" : "manipulation",
							overscrollBehavior: draggingPosition ? "contain" : "auto",
						}}
					>
						{usesDetailedRink ? (
							<svg viewBox="0 0 900 620" role="img" aria-label="Klickbare Eisfläche" style={{ width: "100%", height: "100%", display: "block" }}>
								<DetailedHockeyRinkLayers overlays={rinkOverlays} />
							</svg>
						) : (
							<svg viewBox="0 0 1100 700" role="img" aria-label="Klickbare Eisfläche" style={{ width: "100%", height: "100%", display: "block" }}>
								<rect x="28" y="28" width="1044" height="644" rx="78" ry="78" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
								<line x1="550" y1="34" x2="550" y2="666" stroke="rgba(255,120,120,0.65)" strokeWidth="4" />
								<line x1="320" y1="34" x2="320" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
								<line x1="780" y1="34" x2="780" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
								<circle cx="550" cy="350" r="74" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
							</svg>
						)}

						{isSingleMarkerMode ? (
							markerLocationEffective ? (
								<button
									key={markerId}
									type="button"
									onPointerDown={(e) => {
										if (!allowMarkerReposition) return;
										startDrag(markerId, e);
									}}
									draggable={false}
									aria-label={markerLabel}
									style={{
										position: "absolute",
										left: `${Number(markerLocationEffective.x) * 100}%`,
										top: `${Number(markerLocationEffective.y) * 100}%`,
										transform: "translate(-50%, -50%)",
										minWidth: "46px",
										height: "46px",
										padding: "0 0.6rem",
										borderRadius: "999px",
										border: "2px solid #8ff0dd",
										background: "rgba(20,184,166,0.92)",
										color: "#f7f7ff",
										fontWeight: 700,
										fontSize: "0.82rem",
										cursor: allowMarkerReposition ? (draggingPosition === markerId ? "grabbing" : "grab") : "default",
										touchAction: "none",
										userSelect: "none",
										WebkitUserSelect: "none",
										boxShadow: "0 0 0 3px rgba(20,184,166,0.28)",
									}}
								>
									{markerLabel}
								</button>
							) : null
						) : positionBubbles.map((bubble: any) => {
							const isActive = (isDefensiveStructureMode || isFormationShiftMode)
								? draggingPosition === bubble.value
								: effectivePosition === bubble.value;
							const isMuted = (isDefensiveStructureMode || isFormationShiftMode) ? false : (!!effectivePosition && !isActive);
							const mirroredStart = startByPosition[bubble.value] || { x: Number(bubble.start_x), y: Number(bubble.start_y) };
							const renderedLocation = isDefensiveStructureMode
								? ((draggingPosition === bubble.value && dragPoint) ? dragPoint : (localPlayerPositions[bubble.value] || mirroredStart))
								: isFormationShiftMode
									? ((draggingPosition === bubble.value && dragPoint) ? dragPoint : (activeFormationPositions[bubble.value] || mirroredStart))
								: (isActive && effectiveLocation
									? effectiveLocation
									: mirroredStart);
							return (
								<button
									key={bubble.value}
									type="button"
									onPointerDown={(e) => startDrag(bubble.value, e)}
									draggable={false}
									style={{
										position: "absolute",
										left: `${Number(renderedLocation.x) * 100}%`,
										top: `${Number(renderedLocation.y) * 100}%`,
										transform: "translate(-50%, -50%)",
										minWidth: "42px",
										height: "42px",
										padding: "0 0.55rem",
										borderRadius: "999px",
										border: isActive ? "2px solid #8ff0dd" : "1px solid rgba(255,255,255,0.45)",
										background: isActive ? "rgba(20,184,166,0.88)" : "rgba(13,29,46,0.84)",
										opacity: isMuted ? 0.45 : 1,
										color: "#f7f7ff",
										fontWeight: 700,
										fontSize: "0.82rem",
										cursor: draggingPosition && isActive ? "grabbing" : "grab",
										touchAction: "none",
										userSelect: "none",
										WebkitUserSelect: "none",
									}}
								>
									{bubble.label}
								</button>
							);
						})}
						</div>
					</div>

					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
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

					{isDefensiveStructureMode && (
						<div style={{ marginBottom: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
							Spieler positioniert: <strong>{positionedPlayers.length}/{positionBubbles.length}</strong>
						</div>
					)}

					{isFormationShiftMode && (
						<div style={{ marginBottom: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
							Vorher positioniert: <strong>{beforePositionedPlayers.length}/{positionBubbles.length}</strong> · Nachher positioniert: <strong>{afterPositionedPlayers.length}/{positionBubbles.length}</strong>
						</div>
					)}

					{isSingleMarkerMode && (
						<div style={{ marginBottom: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
							{markerLocationEffective
								? <>Marker gesetzt: <strong>{markerLabel}</strong> · Tippe erneut oder ziehe den Marker, um die Position anzupassen.</>
								: <>Tippe auf den Rink, um den Marker <strong>{markerLabel}</strong> zu setzen.</>}
						</div>
					)}

					{isSingleMarkerMode && observationFields.map((field: any, fieldIdx: number) => {
						const fieldKey = String(field?.key || `field_${fieldIdx}`);
						const fieldLabel = String(field?.label || fieldKey);
						const fieldOptions = Array.isArray(field?.options) ? field.options : [];
						if (fieldOptions.length === 0) return null;
						return (
							<div key={fieldKey} style={{ marginBottom: "0.55rem" }}>
								<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{fieldLabel}</label>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
									{fieldOptions.map((opt: any, idx: number) => {
										const value = typeof opt === "string" ? opt : String(opt?.value || `${fieldKey}_${idx}`);
										const label = typeof opt === "string" ? opt : String(opt?.label || value);
										const description = typeof opt === "string" ? "" : String(opt?.description || "");
										return (
											<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
												<input
													type="radio"
													name={`single_marker_field_${fieldKey}`}
													value={value}
													checked={draftObservationFieldValues[fieldKey] === value}
													onChange={() => updateDraft({ [fieldKey]: value })}
												/>
												<span>
													<span>{label}</span>
													{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						);
					})}

					{isDefensiveStructureMode && structureRatingOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{structureRatingLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{structureRatingOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `structure_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									const description = typeof opt === "string" ? "" : String(opt?.description || "");
									return (
										<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="defensive_structure_rating"
												value={value}
												checked={draftStructureRating === value}
												onChange={() => updateDraft({ [structureRatingKey]: value })}
											/>
											<span>
												<span>{label}</span>
												{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{isDefensiveStructureMode && structuralFunctionOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{structuralFunctionLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{structuralFunctionOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `function_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									const description = typeof opt === "string" ? "" : String(opt?.description || "");
									return (
										<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="defensive_structure_function"
												value={value}
												checked={draftStructuralFunction === value}
												onChange={() => updateDraft({ [structuralFunctionKey]: value })}
											/>
											<span>
												<span>{label}</span>
												{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{isDefensiveStructureMode && keyStructureElementOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{keyStructureElementLabel} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "rgba(255,255,255,0.62)" }}>(optional)</span></label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{keyStructureElementOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `key_element_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									return (
										<label key={value} style={{ display: "flex", alignItems: "center", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="defensive_key_structure_element"
												value={value}
												checked={draftKeyStructureElement === value}
												onChange={() => updateDraft({ [keyStructureElementKey]: value })}
											/>
											<span>{label}</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{isFormationShiftMode && reactionTypeOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{reactionTypeLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{reactionTypeOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `reaction_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									const description = typeof opt === "string" ? "" : String(opt?.description || "");
									return (
										<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="formation_shift_reaction"
												value={value}
												checked={draftReactionType === value}
												onChange={() => updateDraft({ [reactionTypeKey]: value })}
											/>
											<span>
												<span>{label}</span>
												{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{isFormationShiftMode && structuralOutcomeOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{structuralOutcomeLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{structuralOutcomeOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `outcome_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									const description = typeof opt === "string" ? "" : String(opt?.description || "");
									return (
										<label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="formation_shift_outcome"
												value={value}
												checked={draftStructuralOutcome === value}
												onChange={() => updateDraft({ [structuralOutcomeKey]: value })}
											/>
											<span>
												<span>{label}</span>
												{description && <span style={{ display: "block", color: "rgba(255,255,255,0.62)", marginTop: "0.1rem" }}>{description}</span>}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{isFormationShiftMode && movementTriggerOptions.length > 0 && (
						<div style={{ marginBottom: "0.55rem" }}>
							<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>{movementTriggerLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{movementTriggerOptions.map((opt: any, idx: number) => {
									const value = typeof opt === "string" ? opt : String(opt?.value || `trigger_${idx}`);
									const label = typeof opt === "string" ? opt : String(opt?.label || value);
									return (
										<label key={value} style={{ display: "flex", alignItems: "center", gap: "0.42rem", fontSize: "0.88rem" }}>
											<input
												type="radio"
												name="formation_shift_trigger"
												value={value}
												checked={draftMovementTrigger === value}
												onChange={() => updateDraft({ [movementTriggerKey]: value })}
											/>
											<span>{label}</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{!(isDefensiveStructureMode || isFormationShiftMode || isSingleMarkerMode) && (
					<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
						<div>
							<strong>{effectivePosition ? findMarkerLabel(effectivePosition) : "Keine Auswahl"}</strong>
							{effectiveZone && <> - <strong>{zoneDisplay(effectiveZone)}</strong></>}
						</div>
						<div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.62)" }}>Position oder Ort ändern? Ziehe die Bubble erneut.</div>
					</div>
					)}

					{(isDefensiveStructureMode || isFormationShiftMode || isSingleMarkerMode || (effectivePosition && effectiveLocation)) && (
						<details style={{ marginBottom: "0.45rem" }} open={!!((isFormationShiftMode || isSingleMarkerMode) ? draftObservationNote : draftNote)}>
							<summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "#8fd3df" }}>
								{isSingleMarkerMode ? "Optionale Reflexion" : "Optionale Notiz"}
							</summary>
							{(isFormationShiftMode || isSingleMarkerMode) && (
								<p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)" }}>
									{observationNoteLabel}
								</p>
							)}
							<textarea
								value={(isFormationShiftMode || isSingleMarkerMode) ? draftObservationNote : draftNote}
								onChange={(e) => updateDraft({ [(isFormationShiftMode || isSingleMarkerMode) ? observationNoteKey : noteKey]: e.target.value })}
								maxLength={(isFormationShiftMode || isSingleMarkerMode) ? observationNoteMaxChars : noteMaxChars}
								placeholder={(isFormationShiftMode || isSingleMarkerMode) ? observationNotePlaceholder : notePlaceholder}
								aria-label={(isFormationShiftMode || isSingleMarkerMode) ? observationNoteLabel : noteLabel}
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
								{isDefensiveStructureMode
									? `Spieler platziert: ${Array.isArray(entry?.[playerPositionsKey]) ? entry[playerPositionsKey].length : 0}/${positionBubbles.length} - Struktur: ${getOptionLabel(structureRatingOptions, entry?.[structureRatingKey] || "-")} - Wirkung: ${getOptionLabel(structuralFunctionOptions, entry?.[structuralFunctionKey] || "-")}${entry?.[keyStructureElementKey] ? ` - Kern: ${getOptionLabel(keyStructureElementOptions, entry[keyStructureElementKey])}` : ""}`
									: isFormationShiftMode
										? `Vorher: ${Array.isArray(entry?.[formationStatesKey]?.[beforeStateKey]) ? entry[formationStatesKey][beforeStateKey].length : 0}/${positionBubbles.length} - Nachher: ${Array.isArray(entry?.[formationStatesKey]?.[afterStateKey]) ? entry[formationStatesKey][afterStateKey].length : 0}/${positionBubbles.length} - Reaktion: ${getOptionLabel(reactionTypeOptions, entry?.[reactionTypeKey] || "-")} - Wirkung: ${getOptionLabel(structuralOutcomeOptions, entry?.[structuralOutcomeKey] || "-")} - Auslöser: ${getOptionLabel(movementTriggerOptions, entry?.[movementTriggerKey] || "-")}`
									: isSingleMarkerMode
										? `${markerLabel}: ${entry?.[locationKey] ? "gesetzt" : "fehlt"}${observationFields.map((field: any) => {
											const key = String(field?.key || "");
											if (!key) return "";
											const options = Array.isArray(field?.options) ? field.options : [];
											return ` - ${getOptionLabel(options, entry?.[key] || "-")}`;
										}).join("")}`
									: `${findMarkerLabel(entry?.[initiatorKey])} - ${zoneDisplay(entry?.[zoneKey] || "neutral")}`}
							</div>
						</div>
					))}
				</div>

				{isComplete && (
					<div style={{ marginTop: "0.7rem" }}>
						{isDefensiveStructureMode ? (
							<>
								{completionQuestionOptions.length > 0 && (
									<>
										<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>
											{completionQuestionLabel}
										</label>
										<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.55rem" }}>
											{completionQuestionOptions.map((opt: any, idx: number) => {
												const value = typeof opt === "string" ? opt : String(opt?.value || `completion_${idx}`);
												const label = typeof opt === "string" ? opt : String(opt?.label || value);
												return (
													<label key={value} style={{ display: "flex", alignItems: "center", gap: "0.42rem", fontSize: "0.88rem" }}>
														<input
															type="radio"
															name="defensive_structure_completion"
															value={value}
															checked={completionQuestionValue === value}
															onChange={(e) => setAnswers({ ...safeAnswers, [completionQuestionKey]: e.target.value })}
														/>
														<span>{label}</span>
													</label>
												);
											})}
										</div>
									</>
								)}

								<label style={{ display: "block", marginBottom: "0.28rem", fontWeight: 600 }}>
									{completionNoteLabel}
								</label>
								<textarea
									value={completionNoteValue}
									onChange={(e) => setAnswers({ ...safeAnswers, [completionNoteKey]: e.target.value })}
									maxLength={completionNoteMaxChars}
									placeholder={completionNotePlaceholder}
									style={{
										width: "100%",
										minHeight: "64px",
										marginTop: "0.1rem",
										padding: "0.45rem",
										backgroundColor: "#050712",
										color: "#f7f7ff",
										border: "1px solid rgba(81,145,162,0.5)",
										borderRadius: "4px",
										fontFamily: "inherit",
										fontSize: "0.9rem",
									}}
								/>

								{completionQuestionValue && (
									<section style={{ marginTop: "0.45rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
										<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
										<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
									</section>
								)}
							</>
						) : isFormationShiftMode || isSingleMarkerMode ? (
							<section style={{ marginTop: "0.45rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
								<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
								<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
							</section>
						) : (
							<>
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
						<div style={{ marginBottom: "0.45rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.35 }}>
							<strong>Zonen:</strong> {Object.entries(zoneCounts).map(([key, count]) => `${zoneDisplay(key)} (${count})`).join(", ") || "keine"}
						</div>

						<div style={{
							position: "relative",
							width: "100%",
							maxWidth: "640px",
							aspectRatio: usesDetailedRink ? "900 / 620" : "11 / 7",
							borderRadius: "10px",
							border: "1px solid rgba(81,145,162,0.38)",
							overflow: "hidden",
							background: "linear-gradient(180deg, #0d1d2e 0%, #12243b 100%)",
							marginBottom: "0.55rem",
						}}>
							{usesDetailedRink ? (
								<svg viewBox="0 0 900 620" role="img" aria-label="Rink Übersicht" style={{ width: "100%", height: "100%", display: "block" }}>
									<DetailedHockeyRinkLayers overlays={rinkOverlays} />
								</svg>
							) : (
								<svg viewBox="0 0 1100 700" role="img" aria-label="Rink Übersicht" style={{ width: "100%", height: "100%", display: "block" }}>
									<rect x="28" y="28" width="1044" height="644" rx="78" ry="78" fill="rgba(240,248,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="4" />
									<line x1="550" y1="34" x2="550" y2="666" stroke="rgba(255,120,120,0.65)" strokeWidth="4" />
									<line x1="320" y1="34" x2="320" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
									<line x1="780" y1="34" x2="780" y2="666" stroke="rgba(86,153,255,0.75)" strokeWidth="4" />
								</svg>
							)}
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
							</>
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
	const completionReflectionConfig = config?.completion_reflection || {};
	const completionReflectionKey = completionReflectionConfig?.key || "completion_reflection";
	const completionReflectionLabel = completionReflectionConfig?.label || "Welche Wirkung war am häufigsten zu sehen?";
	const completionReflectionOptions = Array.isArray(completionReflectionConfig?.options) ? completionReflectionConfig.options : [];
	const completionReflectionValue = safeAnswers?.[completionReflectionKey] || "";

	const secondaryDecisionConfig = config?.secondary_decision || {};
	const secondaryDecisionKey = secondaryDecisionConfig?.key || "secondary_decision";
	const secondaryDecisionLabel = secondaryDecisionConfig?.label || "Welche Funktion übernimmt die Unterstützung?";
	const secondaryDecisionOptions = Array.isArray(secondaryDecisionConfig?.options) ? secondaryDecisionConfig.options : [];
	const secondaryDecisionShowWhen = Array.isArray(secondaryDecisionConfig?.show_when_decision_in) ? secondaryDecisionConfig.show_when_decision_in : [];
	const activeFocusTitle = config?.active_focus_title || "Active Focus";
	const activeFocusText = config?.active_focus_text || "";

	const currentIndex = logs.length;
	const currentMission = missions[currentIndex] || {
		title: `Mission ${currentIndex + 1}`,
		prompt: "Finde eine passende Beobachtungssituation.",
	};

	const draftDecision = safeAnswers.__observation_log_draft_decision || "";
	const draftReflection = safeAnswers.__observation_log_draft_reflection || "";
	const draftSecondaryDecision = safeAnswers.__observation_log_draft_secondary_decision || "";
	const isComplete = logs.length >= targetCount;
	const progressPercent = targetCount > 0 ? Math.min(100, Math.round((logs.length / targetCount) * 100)) : 0;
	const decisionCounts = decisionOptions.reduce((acc: Record<string, number>, opt: string) => {
		acc[opt] = logs.filter((entry: any) => entry?.[decisionKey] === opt).length;
		return acc;
	}, {});
	const showCompletionReflection = isComplete && completionReflectionOptions.length > 0;
	const showSecondaryDecision = !!draftDecision
		&& secondaryDecisionOptions.length > 0
		&& (secondaryDecisionShowWhen.length === 0 || secondaryDecisionShowWhen.includes(draftDecision));

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
			...(showSecondaryDecision && draftSecondaryDecision ? { [secondaryDecisionKey]: draftSecondaryDecision } : {}),
			[reflectionKey]: draftReflection.trim(),
		};

		setAnswers({
			...safeAnswers,
			[logsKey]: [...logs, nextLog],
			__observation_log_draft_decision: "",
			__observation_log_draft_secondary_decision: "",
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
						{currentMission?.hint && (
							<p style={{ margin: "0.22rem 0 0", color: "rgba(255,255,255,0.72)", fontSize: "0.84rem" }}>{currentMission.hint}</p>
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
										onChange={(e) => {
											const nextDecision = e.target.value;
											const shouldKeepSecondary = secondaryDecisionOptions.length > 0
												&& (secondaryDecisionShowWhen.length === 0 || secondaryDecisionShowWhen.includes(nextDecision));
											updateDraft({
												__observation_log_draft_decision: nextDecision,
												__observation_log_draft_secondary_decision: shouldKeepSecondary ? draftSecondaryDecision : "",
											});
										}}
									/>
									<span style={{ fontSize: "0.92rem" }}>{opt}</span>
								</label>
							))}
						</div>
					</div>

					{showSecondaryDecision && (
						<div style={{ marginBottom: "0.6rem" }}>
							<label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{secondaryDecisionLabel}</label>
							<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
								{secondaryDecisionOptions.map((opt: string) => (
									<label key={`secondary-${opt}`} style={{ display: "flex", alignItems: "center", gap: "0.4rem", lineHeight: 1.15 }}>
										<input
											type="radio"
											name="observation_log_secondary_decision"
											value={opt}
											checked={draftSecondaryDecision === opt}
											onChange={(e) => updateDraft({ __observation_log_draft_secondary_decision: e.target.value })}
										/>
										<span style={{ fontSize: "0.9rem" }}>{opt}</span>
									</label>
								))}
							</div>
						</div>
					)}

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
							{log?.[secondaryDecisionKey] && (
								<div style={{ marginTop: "0.15rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.35 }}>
									{secondaryDecisionLabel}: {log?.[secondaryDecisionKey]}
								</div>
							)}
							{log?.[reflectionKey] && (
								<div style={{ marginTop: "0.2rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.35 }}>
									{log[reflectionKey]}
								</div>
							)}
						</div>
					))}
				</div>

				{isComplete && (
					<div style={{ marginTop: "0.6rem" }}>
						<p style={{ marginTop: 0, marginBottom: "0.45rem", color: "rgba(153,246,228,0.95)" }}>
							Drill abgeschlossen. Du kannst jetzt weitergehen.
						</p>
						<div style={{ marginBottom: "0.45rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>
							<strong>{config?.summary_title || "Automatische Zusammenfassung"}</strong>
						</div>
						<div style={{ display: "grid", gap: "0.2rem", marginBottom: showCompletionReflection ? "0.55rem" : 0 }}>
							{decisionOptions.map((opt: string) => (
								<div key={`summary-${opt}`} style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.72)" }}>
									{opt}: <strong>{decisionCounts[opt] || 0}</strong>
								</div>
							))}
						</div>

						{showCompletionReflection && (
							<div>
								<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>
									{completionReflectionLabel}
								</label>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
									{completionReflectionOptions.map((opt: string) => (
										<label key={`completion-${opt}`} style={{ display: "flex", alignItems: "center", gap: "0.4rem", lineHeight: 1.15 }}>
											<input
												type="radio"
												name="observation_log_completion_reflection"
												value={opt}
												checked={completionReflectionValue === opt}
												onChange={(e) => setAnswers({ ...safeAnswers, [completionReflectionKey]: e.target.value })}
											/>
											<span style={{ fontSize: "0.9rem" }}>{opt}</span>
										</label>
									))}
								</div>
							</div>
						)}

						{activeFocusText && (!showCompletionReflection || !!completionReflectionValue) && (
							<section style={{ marginTop: "0.65rem", padding: "0.7rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
								<h4 style={{ marginTop: 0, marginBottom: "0.3rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
								<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
							</section>
						)}
					</div>
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

function PatternReflectionObservationDrill({ drill, answers, setAnswers }: any) {
	const safeAnswers = answers || {};
	const config = drill?.config || {};

	const observationPhaseTitle = config?.observation_phase?.title || "Beobachtungsphase";
	const observationPhaseText = config?.observation_phase?.text || "Beobachte mehrere Situationen und suche wiederkehrende Muster.";
	const observationPhaseHint = config?.observation_phase?.hint || "Achte darauf, wie das Team Druck erzeugt, Räume kontrolliert und auf gegnerische Aktionen reagiert.";

	const analysisPhaseTitle = config?.analysis_phase?.title || "Defensive Identität";
	const analysisPhaseText = config?.analysis_phase?.text || "Welche Beschreibung passt am besten zu diesem Team?";

	const reflectionPhaseTitle = config?.reflection_phase?.title || "Warum?";
	const reflectionPhaseText = config?.reflection_phase?.text || "Welche Beobachtungen unterstützen deine Einschätzung?";

	const identityConfig = config?.identity || {};
	const identityKey = identityConfig?.key || "patternIdentity";
	const identityLabel = identityConfig?.label || "Welche defensive Identität beschreibt das Team am besten?";
	const identityOptions = Array.isArray(identityConfig?.options) ? identityConfig.options : [];

	const supportConfig = config?.supporting_observations || {};
	const supportKey = supportConfig?.key || "supportingObservations";
	const supportLabel = supportConfig?.label || "Welche Beobachtung unterstützt deine Einschätzung?";
	const supportOptions = Array.isArray(supportConfig?.options) ? supportConfig.options : [];

	const changedConfig = config?.changed_during_observation || {};
	const changedKey = changedConfig?.key || "changedDuringObservation";
	const changedLabel = changedConfig?.label || "Hat sich deine Einschätzung während der Beobachtung verändert?";
	const changedOptions = Array.isArray(changedConfig?.options) ? changedConfig.options : [];

	const noteConfig = config?.note || {};
	const noteKey = noteConfig?.key || "note";
	const noteLabel = noteConfig?.label || "Optionale Notiz";
	const notePlaceholder = noteConfig?.placeholder || "Optional: kurze Beobachtung";
	const noteMaxChars = Number(noteConfig?.max_chars || 500);

	const summaryTitle = config?.summary_title || "Deine Einschätzung";
	const activeFocusTitle = config?.active_focus_title || "Active Focus";
	const activeFocusText = config?.active_focus_text || "";
	const createdAtKey = config?.created_at_key || "createdAt";

	const identityValue = safeAnswers?.[identityKey] || "";
	const supportValues = Array.isArray(safeAnswers?.[supportKey]) ? safeAnswers[supportKey] : [];
	const changedValue = safeAnswers?.[changedKey] || "";
	const noteValue = safeAnswers?.[noteKey] || "";

	const isComplete = !!identityValue && supportValues.length > 0 && !!changedValue;

	useEffect(() => {
		if (!isComplete || safeAnswers?.[createdAtKey]) return;
		setAnswers({
			...safeAnswers,
			[createdAtKey]: new Date().toISOString(),
		});
	}, [createdAtKey, isComplete, safeAnswers, setAnswers]);

	const selectedIdentity = identityOptions.find((opt: any) => opt?.value === identityValue);

	const updateValue = (key: string, value: any) => {
		setAnswers({
			...safeAnswers,
			[key]: value,
		});
	};

	const toggleSupportValue = (value: string) => {
		const hasValue = supportValues.includes(value);
		const nextValues = hasValue
			? supportValues.filter((item: string) => item !== value)
			: [...supportValues, value];
		updateValue(supportKey, nextValues);
	};

	return (
		<div className="card">
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word", marginBottom: "0.45rem" }}>{drill.title}</h3>
			{drill.description && (
				<p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "0.75rem" }}>
					{drill.description}
				</p>
			)}

			<ObservationGuide drill={drill} />

			<section style={{ marginBottom: "0.75rem", padding: "0.85rem", backgroundColor: "rgba(81,145,162,0.08)", border: "1px solid rgba(81,145,162,0.35)", borderRadius: "6px" }}>
				<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>👀 {observationPhaseTitle}</h4>
				<p style={{ marginTop: 0, marginBottom: "0.4rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>{observationPhaseText}</p>
				<p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.86rem", lineHeight: 1.4 }}>{observationPhaseHint}</p>
			</section>

			<section style={{ marginBottom: "0.75rem", padding: "0.85rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<h4 style={{ marginTop: 0, marginBottom: "0.3rem" }}>🧭 {analysisPhaseTitle}</h4>
				<p style={{ marginTop: 0, marginBottom: "0.55rem", color: "rgba(255,255,255,0.72)", fontSize: "0.86rem" }}>{analysisPhaseText}</p>
				<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{identityLabel}</label>
				<div style={{ display: "grid", gap: "0.45rem" }}>
					{identityOptions.map((opt: any) => {
						const checked = identityValue === opt?.value;
						const markers = Array.isArray(opt?.markers) ? opt.markers : [];
						return (
							<label key={opt?.value} style={{ display: "block", padding: "0.55rem 0.6rem", borderRadius: "6px", border: checked ? "1px solid rgba(45,212,191,0.7)" : "1px solid rgba(255,255,255,0.15)", background: checked ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)", cursor: "pointer" }}>
								<div style={{ display: "flex", alignItems: "flex-start", gap: "0.45rem" }}>
									<input
										type="radio"
										name="pattern_identity"
										value={opt?.value}
										checked={checked}
										onChange={(e) => updateValue(identityKey, e.target.value)}
									/>
									<div>
										<div style={{ fontWeight: 600, color: "#f7f7ff" }}>{opt?.label || opt?.value}</div>
										{opt?.description && <div style={{ marginTop: "0.2rem", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem", lineHeight: 1.35 }}>{opt.description}</div>}
										{markers.length > 0 && (
											<ul style={{ margin: "0.3rem 0 0", paddingLeft: "1rem", color: "rgba(255,255,255,0.68)", fontSize: "0.82rem", lineHeight: 1.35 }}>
												{markers.map((marker: string) => (<li key={`${opt?.value}-${marker}`}>{marker}</li>))}
											</ul>
										)}
									</div>
								</div>
							</label>
						);
					})}
				</div>
			</section>

			<section style={{ marginBottom: "0.4rem", padding: "0.85rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
				<h4 style={{ marginTop: 0, marginBottom: "0.3rem" }}>🧩 {reflectionPhaseTitle}</h4>
				<p style={{ marginTop: 0, marginBottom: "0.55rem", color: "rgba(255,255,255,0.72)", fontSize: "0.86rem" }}>{reflectionPhaseText}</p>

				<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{supportLabel}</label>
				<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.65rem" }}>
					{supportOptions.map((opt: any) => {
						const value = typeof opt === "string" ? opt : opt?.value;
						const label = typeof opt === "string" ? opt : (opt?.label || opt?.value);
						if (!value) return null;
						return (
							<label key={`support-${value}`} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
								<input
									type="checkbox"
									checked={supportValues.includes(value)}
									onChange={() => toggleSupportValue(value)}
								/>
								<span style={{ fontSize: "0.9rem" }}>{label}</span>
							</label>
						);
					})}
				</div>

				{changedOptions.length > 0 && (
					<div style={{ marginBottom: "0.65rem" }}>
						<label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{changedLabel}</label>
						<div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
							{changedOptions.map((opt: any) => {
								const value = typeof opt === "string" ? opt : opt?.value;
								const label = typeof opt === "string" ? opt : (opt?.label || opt?.value);
								if (!value) return null;
								return (
									<label key={`changed-${value}`} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
										<input
											type="radio"
											name="pattern_changed_during_observation"
											value={value}
											checked={changedValue === value}
											onChange={(e) => updateValue(changedKey, e.target.value)}
										/>
										<span style={{ fontSize: "0.9rem" }}>{label}</span>
									</label>
								);
							})}
						</div>
					</div>
				)}

				<div>
					<label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{noteLabel}</label>
					<textarea
						value={noteValue}
						onChange={(e) => updateValue(noteKey, e.target.value)}
						maxLength={noteMaxChars}
						placeholder={notePlaceholder}
						style={{
							width: "100%",
							minHeight: "56px",
							padding: "0.45rem",
							backgroundColor: "#050712",
							color: "#f7f7ff",
							border: "1px solid rgba(81,145,162,0.5)",
							borderRadius: "4px",
							fontFamily: "inherit",
							fontSize: "0.9rem",
						}}
					/>
				</div>

				{identityValue && (
					<section style={{ marginTop: "0.7rem", padding: "0.7rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
						<h4 style={{ marginTop: 0, marginBottom: "0.35rem", color: "#99f6e4" }}>✓ {summaryTitle}</h4>
						<div style={{ marginBottom: "0.35rem", color: "rgba(240,253,250,0.92)", lineHeight: 1.4 }}>
							<strong>Defensive Identität:</strong><br />
							{selectedIdentity?.label || identityValue}
						</div>
						<div style={{ color: "rgba(240,253,250,0.9)", lineHeight: 1.4 }}>
							<strong>Begründung:</strong>
							<div style={{ marginTop: "0.25rem", display: "grid", gap: "0.15rem" }}>
								{supportValues.length > 0 ? supportValues.map((value: string) => {
									const found = supportOptions.find((opt: any) => (typeof opt === "string" ? opt : opt?.value) === value);
									const label = typeof found === "string" ? found : (found?.label || value);
									return <div key={`summary-support-${value}`}>✓ {label}</div>;
								}) : <div>Keine Begründung ausgewählt.</div>}
							</div>
						</div>
					</section>
				)}

				{activeFocusText && isComplete && (
					<section style={{ marginTop: "0.65rem", padding: "0.7rem", borderRadius: "6px", border: "1px solid rgba(45,212,191,0.36)", background: "rgba(20,184,166,0.1)" }}>
						<h4 style={{ marginTop: 0, marginBottom: "0.3rem", color: "#99f6e4" }}>✓ {activeFocusTitle}</h4>
						<p style={{ margin: 0, color: "rgba(240,253,250,0.9)", lineHeight: 1.45 }}>{activeFocusText}</p>
					</section>
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
	const missions = Array.isArray(drill?.config?.missions) ? drill.config.missions : [];

	const samples: any[] = Array.isArray(safeAnswers[sampleKey]) ? safeAnswers[sampleKey] : [];
	const pressureLabels = Object.fromEntries(sampleFields.map((field: any) => [field.key, field.label]));
	const isObservationMode = samples.length >= requiredSamples;
	const canAddMore = true;
	const currentMission = missions[samples.length] || null;

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

				{currentMission && !isObservationMode && (
					<div style={{ marginBottom: "0.75rem", padding: "0.55rem 0.65rem", borderRadius: "6px", border: "1px solid rgba(153,246,228,0.4)", background: "rgba(20,184,166,0.12)" }}>
						<p style={{ margin: 0, color: "#99f6e4", fontWeight: 700 }}>{currentMission.title || `Mission ${samples.length + 1} von ${requiredSamples}`}</p>
						{currentMission.prompt && <p style={{ margin: "0.2rem 0 0", color: "rgba(240,253,250,0.92)", lineHeight: 1.32 }}>{currentMission.prompt}</p>}
						{currentMission.hint && <p style={{ margin: "0.22rem 0 0", color: "rgba(255,255,255,0.74)", fontSize: "0.84rem" }}>{currentMission.hint}</p>}
					</div>
				)}

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
										<label key={optionValue(opt)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
											<span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
												<input
													type="radio"
													name={`${field.key}_sample`}
													value={optionValue(opt)}
													checked={form[field.key] === optionValue(opt)}
													onChange={(e) => updateForm(field.key, e.target.value)}
												/>
												<span>{optionLabel(opt)}</span>
											</span>
											{typeof opt === "object" && opt?.description && (
												<span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.64)", marginLeft: "1.45rem", lineHeight: 1.35 }}>
													{opt.description}
												</span>
											)}
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
export function PeriodCheckin({ drill, answers, setAnswers }: any) {
	const questions = drill?.config?.questions || [];
	const safeAnswers = answers || {};
	const optionLayout = String(drill?.config?.option_layout || "inline");
	const useOptionCards = optionLayout === "cards";
	const summaryWhenComplete = drill?.config?.summary_when_complete === true;
	const sentenceHelpers = drill?.config?.sentence_helpers || null;
	const normalizeOptions = (options: any[]) =>
		(options || []).map((opt: any) => {
			if (typeof opt === "string") {
				return { value: opt, label: opt, description: undefined as string | undefined, phrase: undefined as string | undefined };
			}
			if (opt && typeof opt === "object") {
				const value = String(opt.value ?? opt.label ?? "");
				const label = String(opt.label ?? opt.value ?? "");
				const description = typeof opt.description === "string" ? opt.description : undefined;
				const phrase = typeof opt.phrase === "string" ? opt.phrase : undefined;
				return { value, label, description, phrase };
			}
			const fallback = String(opt ?? "");
			return { value: fallback, label: fallback, description: undefined as string | undefined, phrase: undefined as string | undefined };
		});

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
			const effectiveOptionsRaw = q.conditional_options?.[controllerKey]?.[controllerValue] || q.options || [];
			const effectiveOptions = normalizeOptions(Array.isArray(effectiveOptionsRaw) ? effectiveOptionsRaw : []);
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
					const optionValues = new Set(effectiveOptions.map((opt: any) => opt.value));
					const filtered = currentValue.filter((v: string) => optionValues.has(v));
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

			const optionValues = new Set(effectiveOptions.map((opt: any) => opt.value));
			if (currentValue && !optionValues.has(currentValue)) {
				delete next[q.key];
				changed = true;
			}
		}

		if (changed) setAnswers(next);
	}, [signature, drill?.id]); // eslint-disable-line react-hooks/exhaustive-deps
	
	const glossary = drill?.didactics?.glossary;
	const focusText = drill?.didactics?.focus_text || drill?.description;
	const didacticExplanation = drill?.didactics?.explanation || "";
	const guidingQuestions = Array.isArray(drill?.didactics?.guiding_questions)
		? drill.didactics.guiding_questions
		: [];
	const observationPhase = drill?.config?.observation_phase;
	const analysisPhase = drill?.config?.analysis_phase;
	const reflectionPhase = drill?.config?.reflection_phase;
	const summaryTitle = drill?.config?.summary_title;
	const summaryDisclaimer = drill?.config?.summary_disclaimer;
	const isQuestionAnswered = (q: any) => {
		const value = safeAnswers?.[q.key];
		if (q.type === "multi_select") return Array.isArray(value) && value.length > 0;
		if (q.type === "text") {
			const minChars = Number(q.min_chars || 0);
			const trimmed = String(value || "").trim();
			if (!trimmed) return false;
			return trimmed.length >= minChars;
		}
		return value !== undefined && value !== null && String(value).trim() !== "";
	};
	const requiredQuestions = questions.filter((q: any) => q?.required === true || (q?.optional === false));
	const allRequiredAnswered = requiredQuestions.length === 0
		? questions.filter((q: any) => q?.optional !== true).every(isQuestionAnswered)
		: requiredQuestions.every(isQuestionAnswered);
	const summarizeQuestionValue = (q: any, rawValue: any) => {
		if (rawValue === undefined || rawValue === null || rawValue === "") return null;
		const optionMap = new Map(normalizeOptions(Array.isArray(q.options) ? q.options : []).map((opt: any) => [opt.value, opt.label]));

		if (q.type === "multi_select") {
			if (!Array.isArray(rawValue) || rawValue.length === 0) return null;
			return rawValue.map((v: string) => optionMap.get(v) || formatOptionText(String(v))).join(", ");
		}

		if (typeof rawValue === "string") {
			if (q.type === "radio" || q.type === "select") return optionMap.get(rawValue) || formatOptionText(rawValue);
			return rawValue;
		}

		return String(rawValue);
	};
	const summaryRows = questions
		.map((q: any) => ({
			q,
			label: q.summary_label || q.label,
			value: summarizeQuestionValue(q, safeAnswers?.[q.key]),
		}))
		.filter((row: any) => row.value);
	const showSummary = !!summaryTitle && summaryRows.length > 0 && (!summaryWhenComplete || allRequiredAnswered);

	const selectedPhrases = questions.flatMap((q: any) => {
		if (q.type !== "radio" && q.type !== "select") return [];
		const options = normalizeOptions(Array.isArray(q.options) ? q.options : []);
		const selected = options.find((opt: any) => opt.value === safeAnswers?.[q.key]);
		return selected?.phrase ? [selected.phrase] : [];
	});
	const helperStarter = typeof sentenceHelpers?.starter === "string" ? sentenceHelpers.starter : "";
	const helperPhrases = Array.isArray(sentenceHelpers?.phrases) && sentenceHelpers.phrases.length > 0
		? sentenceHelpers.phrases
		: selectedPhrases;
	const showSentenceHelpers = !!sentenceHelpers && (helperStarter || helperPhrases.length > 0);

	const insertPhrase = (phrase: string, targetKey: string) => {
		const current = String(safeAnswers?.[targetKey] || "");
		const next = current.trim() ? `${current.trim()} ${phrase}` : `${helperStarter ? `${helperStarter} ` : ""}${phrase}`.replace(/\s+/g, " ").trim();
		setAnswers({ ...safeAnswers, [targetKey]: next });
	};

	const isCompactUi = drill?.config?.compact_ui === true;

	return (
		<div className={isCompactUi ? undefined : "card primary-card"}>
			<h3 style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{drill.title}</h3>
			{focusText && (
				<p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", whiteSpace: "pre-line", marginBottom: "1rem", wordWrap: "break-word", overflowWrap: "break-word" }}>
					{focusText}
				</p>
			)}
			{didacticExplanation && (
				<details className="nested-section mobile-flatten didactic-focus-section" style={{ marginBottom: "0.7rem" }}>
					<summary style={{ cursor: "pointer", color: "#8fd3df", fontWeight: 600 }}>Didaktischer Fokus</summary>
					<p style={{ marginTop: "0.45rem", marginBottom: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45, whiteSpace: "pre-line" }}>
						{didacticExplanation}
					</p>
				</details>
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
			{!isCompactUi && guidingQuestions.length === 0 && <ObservationGuide drill={drill} />}
			{observationPhase?.title || observationPhase?.text || observationPhase?.hint ? (
				<section style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(81,145,162,0.12)", border: "1px solid rgba(81,145,162,0.28)", borderRadius: "4px" }}>
					{observationPhase?.title && <h4 style={{ marginTop: 0, marginBottom: "0.4rem", color: "#89c8da" }}>{observationPhase.title}</h4>}
					{observationPhase?.text && <p style={{ marginTop: 0, marginBottom: observationPhase?.hint ? "0.45rem" : 0, color: "rgba(255,255,255,0.86)", whiteSpace: "pre-line" }}>{observationPhase.text}</p>}
					{observationPhase?.hint && <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.86rem", whiteSpace: "pre-line" }}>{observationPhase.hint}</p>}
				</section>
			) : null}
			{analysisPhase?.title || analysisPhase?.text ? (
				<section style={{ marginBottom: "0.7rem" }}>
					{analysisPhase?.title && <h4 style={{ marginTop: 0, marginBottom: "0.25rem", color: "rgba(255,255,255,0.9)" }}>{analysisPhase.title}</h4>}
					{analysisPhase?.text && <p style={{ marginTop: 0, marginBottom: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.88rem", whiteSpace: "pre-line" }}>{analysisPhase.text}</p>}
				</section>
			) : null}
			{reflectionPhase?.title || reflectionPhase?.text ? (
				<section style={{ marginBottom: "0.7rem" }}>
					{reflectionPhase?.title && <h4 style={{ marginTop: 0, marginBottom: "0.25rem", color: "rgba(255,255,255,0.9)" }}>{reflectionPhase.title}</h4>}
					{reflectionPhase?.text && <p style={{ marginTop: 0, marginBottom: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.88rem", whiteSpace: "pre-line" }}>{reflectionPhase.text}</p>}
				</section>
			) : null}
			{questions.map((q: any) => {
				const controllerKey = q.conditional_options ? Object.keys(q.conditional_options)[0] : null;
				const controllerValue = controllerKey ? safeAnswers?.[controllerKey] : undefined;
				const effectiveOptionsRaw = q.conditional_options && controllerKey
					? q.conditional_options?.[controllerKey]?.[controllerValue] || []
					: q.options || [];
				const effectiveOptions = normalizeOptions(Array.isArray(effectiveOptionsRaw) ? effectiveOptionsRaw : []);
				const hasConditionalOptions = !!q.conditional_options;
				const shouldRenderQuestion = !hasConditionalOptions || effectiveOptions.length > 0;
				const questionHelp = q.help || q.desc || q.helper_text || "";

				if (!shouldRenderQuestion) {
					return null;
				}

				return (
				<div key={q.key} className="mobile-flatten-card" style={{ marginBottom: "1rem" }}>
					<label style={{ display: "block", marginBottom: questionHelp ? "0.25rem" : "0.5rem", fontWeight: "bold" }}>{q.label}</label>
					{questionHelp && (
						<p style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.4 }}>{questionHelp}</p>
					)}
					{q.type === "radio" && Array.isArray(effectiveOptions) && (
						<div style={{ display: "flex", flexDirection: "column", gap: useOptionCards ? "0.45rem" : "0.25rem" }}>
							{effectiveOptions.map((opt: any) => {
								const inlineExplanations = drill.didactics?.inline_explanations || {};
								const rawLabel = String(opt.label ?? opt.value ?? "");
								const explanationFromOption = typeof opt.description === "string" ? opt.description : undefined;
								const optKey = Object.keys(inlineExplanations).find(
									k => k === rawLabel || k.toLowerCase() === rawLabel.toLowerCase()
								);
								const explanation = explanationFromOption || (optKey ? inlineExplanations[optKey]?.meaning : undefined);
								const checked = safeAnswers[q.key] === opt.value;
								if (useOptionCards) {
									return (
										<label
											key={opt.value}
											style={{
												display: "block",
												padding: "0.55rem 0.65rem",
												borderRadius: "6px",
												border: checked ? "1px solid rgba(45,212,191,0.7)" : "1px solid rgba(255,255,255,0.15)",
												background: checked ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
												cursor: "pointer",
											}}
										>
											<span style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
												<input
													type="radio"
													name={q.key}
													value={opt.value}
													checked={checked}
													onChange={(e) => setAnswers({ ...safeAnswers, [q.key]: e.target.value })}
													style={{ marginTop: "0.2rem" }}
												/>
												<span>
													<span style={{ display: "block", fontWeight: 600, color: "#f7f7ff" }}>
														{highlightGlossaryTerms(rawLabel, glossary)}
													</span>
													{explanation && (
														<span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
															{explanation}
														</span>
													)}
												</span>
											</span>
										</label>
									);
								}
								return (
									<label key={opt.value} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
										<span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<input
												type="radio"
												name={q.key}
												value={opt.value}
												checked={checked}
												onChange={(e) => setAnswers({ ...safeAnswers, [q.key]: e.target.value })}
											/>
											<span style={{ textTransform: "none" }}>
												{highlightGlossaryTerms(rawLabel, glossary)}
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
							{effectiveOptions.map((opt: any) => (
								<option key={opt.value} value={opt.value}>
										{opt.label}
								</option>
							))}
						</select>
					)}
					{q.type === "multi_select" && Array.isArray(effectiveOptions) && (
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
							{effectiveOptions.map((opt: any) => {
								const currentValues = Array.isArray(safeAnswers[q.key]) ? safeAnswers[q.key] : [];
								const checked = currentValues.includes(opt.value);
								return (
									<label key={opt.value} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
										<span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<input
											type="checkbox"
											checked={checked}
											onChange={(e) => {
												const nextValues = e.target.checked
														? [...currentValues, opt.value]
														: currentValues.filter((v: string) => v !== opt.value);
												const nextAnswers = { ...safeAnswers };
												if (nextValues.length > 0) nextAnswers[q.key] = nextValues;
												else delete nextAnswers[q.key];
												setAnswers(nextAnswers);
											}}
										/>
											<span>{highlightGlossaryTerms(String(opt.label ?? opt.value ?? ""), glossary)}</span>
										</span>
										{opt.description && (
											<span style={{ fontSize: "0.85em", color: "#aaa", marginLeft: 24 }}>{opt.description}</span>
										)}
									</label>
								);
							})}
						</div>
					)}
					{q.type === "text" && (
						<>
							{showSentenceHelpers && q.use_sentence_helpers === true && (
								<section style={{ marginBottom: "0.55rem", padding: "0.65rem 0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
									<p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)" }}>
										{sentenceHelpers?.label || "Optionale Satzhilfe"}
									</p>
									{helperStarter && (
										<p style={{ margin: "0 0 0.4rem", fontSize: "0.86rem", color: "rgba(240,253,250,0.9)" }}>{helperStarter}</p>
									)}
									{helperPhrases.length > 0 && (
										<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
											{helperPhrases.map((phrase: string) => (
												<button
													key={phrase}
													type="button"
													onClick={() => insertPhrase(phrase, q.key)}
													style={{
														textAlign: "left",
														padding: "0.35rem 0.5rem",
														borderRadius: "4px",
														border: "1px solid rgba(255,255,255,0.18)",
														background: "rgba(255,255,255,0.04)",
														color: "rgba(255,255,255,0.86)",
														fontSize: "0.82rem",
														cursor: "pointer",
													}}
												>
													{phrase}
												</button>
											))}
										</div>
									)}
								</section>
							)}
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
						</>
					)}
				</div>
				);
			})}
			{showSummary && (
				<section style={{ marginTop: "0.9rem", padding: "0.9rem 1rem", border: "1px solid rgba(120,180,210,0.26)", borderRadius: "6px", background: "rgba(120,180,210,0.08)" }}>
					<h4 style={{ marginTop: 0, marginBottom: "0.55rem", color: "#89c8da" }}>{summaryTitle}</h4>
					<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
						{summaryRows.map((row: any) => (
							<div key={row.q.key}>
								<strong>{row.label}</strong>
								<div style={{ color: "rgba(240,253,250,0.94)", marginTop: "0.15rem", whiteSpace: "pre-line" }}>{row.value}</div>
							</div>
						))}
					</div>
					{summaryDisclaimer && (
						<p style={{ marginTop: "0.6rem", marginBottom: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.86rem" }}>{summaryDisclaimer}</p>
					)}
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
