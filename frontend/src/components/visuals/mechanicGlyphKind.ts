export type MechanicKind =
  | 'paint'
  | 'path'
  | 'placement'
  | 'marker'
  | 'zone'
  | 'choice'
  | 'profile'
  | 'log'
  | 'sidequest'
  | 'generic'

export type MechanicInfo = {
  label: string
  summary: string
  detail: string
}

export const MECHANIC_INFO: Record<MechanicKind, MechanicInfo> = {
  paint: {
    label: 'Paint',
    summary: 'Auf dem Rink zeichnen.',
    detail: 'Du markierst Räume oder Muster mit Strichen auf dem Eis — z. B. geschützte und gefährliche Flächen.',
  },
  path: {
    label: 'Pfad',
    summary: 'Richtung mit Start und Ziel setzen.',
    detail: 'Du setzt zuerst einen Ausgangspunkt und danach einen Endpunkt. Der Pfeil zeigt die beobachtete Richtung oder Lenkung.',
  },
  placement: {
    label: 'Placement',
    summary: 'Spieler oder Struktur positionieren.',
    detail: 'Du verschiebst Bubbles auf dem Rink, um Formationen, Rollen oder defensive Strukturen abzubilden.',
  },
  marker: {
    label: 'Marker',
    summary: 'Einen einzelnen Ort setzen.',
    detail: 'Du tippst einen Punkt auf dem Eis — z. B. wo Druck entsteht oder eine Situation kippt.',
  },
  zone: {
    label: 'Zone',
    summary: 'Bereich oder Korridor wählen.',
    detail: 'Du wählst eine Zone, einen Korridor oder einen semantischen Raum auf dem Rink aus.',
  },
  choice: {
    label: 'Auswahl',
    summary: 'Aus Optionen entscheiden.',
    detail: 'Klassifikation, Diagnose oder Period-Checkin: Du wählst die passende Antwort aus vorgegebenen Optionen.',
  },
  profile: {
    label: 'Profil',
    summary: 'Muster einordnen und bündeln.',
    detail: 'Du ordnest Beobachtungen vorsichtig ein oder fasst sie zu einem Tendenzprofil zusammen — weniger Zeichnen, mehr Synthese.',
  },
  log: {
    label: 'Beobachtung',
    summary: 'Situationen erfassen und einordnen.',
    detail: 'Du protokollierst mehrere kurze Beobachtungen (Rollen, Beziehungen, Strukturen, Optionen) in einer Liste statt auf dem Rink.',
  },
  sidequest: {
    label: 'Sidequest',
    summary: 'Nebenaufgabe neben dem Hauptdrill.',
    detail: 'Kurze Zusatzbeobachtung (z. B. Special Teams), parallel zur laufenden Session.',
  },
  generic: {
    label: 'Drill',
    summary: 'Allgemeine Drill-Mechanik.',
    detail: 'Für diesen Drill ist keine spezielle Rink-Mechanik hinterlegt.',
  },
}

export const LABELS: Record<MechanicKind, string> = Object.fromEntries(
  Object.entries(MECHANIC_INFO).map(([key, value]) => [key, value.label]),
) as Record<MechanicKind, string>

function haystack(drillType?: string | null, mode?: string | null, mechanic?: string | null): string {
  return [drillType, mode, mechanic].filter(Boolean).join(' ').toLowerCase()
}

function includesAny(type: string, tokens: string[]): boolean {
  return tokens.some((token) => type.includes(token))
}

/** Map drill_type + optional config.mode / config.mechanic to a mechanic kind. */
export function resolveMechanicKind(
  drillType?: string | null,
  mode?: string | null,
  mechanic?: string | null,
): MechanicKind {
  const type = haystack(drillType, mode, mechanic)
  if (!type.trim()) return 'generic'

  if (includesAny(type, ['paintable', 'paint'])) return 'paint'
  if (includesAny(type, ['directional_path', 'path_observation'])) return 'path'
  // Avoid bare "path" — it false-positives on unrelated ids.
  if (/(^|[\s_])path($|[\s_])/.test(type) || type.endsWith('_path') || type.startsWith('path_')) {
    return 'path'
  }
  if (includesAny(type, ['defensive_structure', 'formation', 'placement'])) return 'placement'
  if (includesAny(type, ['single_marker']) || /(^|[\s_])marker($|[\s_])/.test(type)) return 'marker'
  if (includesAny(type, ['zone', 'corridor', 'semantic_zone', 'blue_line'])) return 'zone'

  if (includesAny(type, [
    'opportunity_rate',
    'rate_definition',
    'opportunity_tracker',
    'cohort_rate_compare',
    'sample_compare',
    'conditional_outcome',
    'condition_outcome_matrix',
    'anticipation_read',
    'next_action_prediction',
    'cue_priority',
    'cue_ranking',
    'scenario_branches',
    'prediction_update',
    'belief_update',
    'event_log',
    'sample_log',
    'decision_analysis',
    'defensive_observation',
    'system_observation',
    'pressure_diagnosis',
    'solution_type_diagnosis',
    'decision_cause_diagnosis',
    'transition_followup_assessment',
    'impact_classification',
    'support_classification',
    'sequence_classification',
    'pattern_reflection',
    'paintable_rink',
    'shift_tracker',
    'player_relation',
    'simple_structure',
    'tactical_observation',
    'observation_log',
    'pattern_log',
    'multi_observation_pattern',
    'pattern_condition',
    'pattern_invariant',
    'change_timeline',
    'change_point_observation',
  ])) {
    return 'log'
  }

  if (includesAny(type, [
    'claim_ladder',
    'evidence_profile',
    'anticipation_profile',
    'pattern_reflection',
    'meta_scan',
    'pattern_attribution',
    'tendency_profile',
    'before_after_compare',
    'state_compare',
    'trigger_hypothesis',
    'adjustment_attribution',
    'interaction_chain',
    'problem_adjustment_response',
    'adjustment_profile',
    'multi_change_synthesis',
  ])) {
    return 'profile'
  }

  if (includesAny(type, [
    'evidence_assessment',
    'assessment',
    'classification',
    'period_checkin',
    'role_identification',
    'triangle',
    'diagnosis',
    'foundation',
    'micro_quiz',
  ])) {
    return 'choice'
  }

  if (type.includes('sidequest')) return 'sidequest'
  if (includesAny(type, ['rink', 'clickable', 'draggable'])) return 'marker'
  return 'generic'
}
