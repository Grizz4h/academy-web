import type {
  ActorRole,
  AttributionConfidence,
  ConditionAssessment,
  ConditionDimensionId,
  ConditionRole,
  CounterDifference,
  GameStateContext,
  InvariantDimensionId,
  InvariantDimensionRole,
  OpponentContext,
  PatternAssessment,
  PatternAttribution,
  PatternCaseType,
  PatternContextTag,
  PatternFlexibility,
  PatternLogOption,
  PatternPresence,
  PatternSide,
  PatternSimilarity,
  PatternTrigger,
  PatternZone,
  PersonnelContext,
  PossessionState,
  PressureLevel,
  SequenceSimilarity,
  StartingCondition,
  SupportState,
  TargetEffect,
  TendencyAllowedVariationId,
  TendencyFrequency,
  TendencyPrimaryCondition,
  TendencyStableCoreId,
} from './types'

export const DEFAULT_ZONE_OPTIONS: PatternLogOption<PatternZone>[] = [
  { value: 'defensive_zone', label: 'Defensive Zone' },
  { value: 'neutral_zone', label: 'Neutral Zone' },
  { value: 'offensive_zone', label: 'Offensive Zone' },
  { value: 'blue_line', label: 'Rund um die Blue Line' },
  { value: 'multiple_zones', label: 'Mehrere Zonen' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_TRIGGER_OPTIONS: PatternLogOption<PatternTrigger>[] = [
  { value: 'puck_loss', label: 'Puckverlust' },
  { value: 'zone_entry', label: 'Zone Entry' },
  { value: 'zone_exit', label: 'Zone Exit' },
  { value: 'opponent_pressure', label: 'Gegnerdruck' },
  { value: 'pass_to_side', label: 'Pass nach außen / zur Seite' },
  { value: 'reset', label: 'Reset / Neuaufbau' },
  { value: 'rebound_second_puck', label: 'Rebound / zweiter Puck' },
  { value: 'faceoff_or_set_play', label: 'Bully / Set Play' },
  { value: 'transition', label: 'Transition' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_SIDE_OPTIONS: PatternLogOption<PatternSide>[] = [
  { value: 'left', label: 'Links' },
  { value: 'right', label: 'Rechts' },
  { value: 'middle', label: 'Mitte' },
  { value: 'both', label: 'Beide Seiten' },
  { value: 'not_relevant', label: 'Nicht relevant' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_SIMILARITY_OPTIONS: PatternLogOption<PatternSimilarity>[] = [
  { value: 'same_zone', label: 'gleiche Zone' },
  { value: 'same_trigger', label: 'gleicher Trigger' },
  { value: 'same_team_reaction', label: 'ähnliche Teamreaktion' },
  { value: 'same_side', label: 'gleiche Seite' },
  { value: 'similar_positioning', label: 'ähnliche Positionierung' },
  { value: 'similar_sequence', label: 'ähnlicher Ablauf' },
  {
    value: 'only_outcome_similar',
    label: 'nur das Ergebnis ist ähnlich',
    description: 'Ein ähnliches Ergebnis bedeutet noch nicht, dass dasselbe Muster dahintersteckt.',
  },
  { value: 'little_similarity', label: 'kaum etwas ist gleich' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_CONTEXT_TAG_OPTIONS: PatternLogOption<PatternContextTag>[] = [
  { value: 'high_pressure', label: 'hoher Druck' },
  { value: 'low_pressure', label: 'wenig Druck' },
  { value: 'controlled_possession', label: 'kontrollierter Puckbesitz' },
  { value: 'loose_puck', label: 'loser Puck' },
  { value: 'rush', label: 'Rush' },
  { value: 'established_structure', label: 'etablierte Struktur' },
  { value: 'quick_change', label: 'schneller Wechsel' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_ASSESSMENT_OPTIONS: PatternLogOption<PatternAssessment>[] = [
  {
    value: 'possible_signal',
    label: 'Hinweis auf eine mögliche Tendenz',
    description: 'Mehrere Situationen zeigen vergleichbare Merkmale — noch keine allgemeine Teamtendenz.',
  },
  {
    value: 'likely_tendency',
    label: 'Hinweis auf eine mögliche Tendenz (wiederholt ähnlich)',
    description: 'Mehrere Situationen ähneln sich unter vergleichbaren Bedingungen. Drei Fälle sind Mindestmenge der Übung, kein Nachweis.',
  },
  {
    value: 'strong_pattern',
    label: 'Hinweis auf eine mögliche Tendenz (sehr ähnlich)',
    description: 'Die gespeicherten Situationen sind besonders ähnlich — weiterhin nur segmentbezogen und vorläufig.',
  },
  {
    value: 'mostly_individual_cases',
    label: 'Beobachtungen noch zu unterschiedlich',
    description: 'Die Situationen ähneln sich zu wenig, um eine vorläufige Tendenz zu formulieren.',
  },
  {
    value: 'outcome_similarity_only',
    label: 'Nur das Ergebnis ähnelt sich',
    description: 'Ähnliches Ergebnis ohne vergleichbaren Ablauf oder vergleichbare Reaktion.',
  },
  {
    value: 'insufficient_sample',
    label: 'Nicht ausreichend beobachtet',
    description: 'Ausschnitt, Anzahl oder Vergleichbarkeit reichen noch nicht.',
  },
  {
    value: 'unclear',
    label: 'Nicht sicher beurteilbar',
    description: 'Noch keine klare Einordnung möglich.',
  },
]

export const DEFAULT_CASE_TYPE_OPTIONS: PatternLogOption<PatternCaseType>[] = [
  {
    value: 'pattern_case',
    label: 'Musterfall',
    description: 'Das beobachtete Verhalten tritt auf.',
  },
  {
    value: 'counter_case',
    label: 'Gegenfall',
    description: 'Ausreichend ähnliche Ausgangslage, in der das erwartete Verhalten nicht oder anders auftritt.',
  },
]

export const DEFAULT_PRESSURE_OPTIONS: PatternLogOption<PressureLevel>[] = [
  { value: 'low', label: 'wenig Druck' },
  { value: 'moderate', label: 'mittlerer Druck' },
  { value: 'high', label: 'hoher Druck' },
  { value: 'changing', label: 'wechselnd' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_POSSESSION_OPTIONS: PatternLogOption<PossessionState>[] = [
  { value: 'controlled', label: 'kontrolliert' },
  { value: 'partly_controlled', label: 'teilweise kontrolliert' },
  { value: 'loose_puck', label: 'loser Puck' },
  { value: 'contested', label: 'umkämpft' },
  { value: 'transitioning', label: 'im Übergang' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_SUPPORT_OPTIONS: PatternLogOption<SupportState>[] = [
  { value: 'strong_support', label: 'starker Support' },
  { value: 'some_support', label: 'etwas Support' },
  { value: 'isolated', label: 'isoliert' },
  { value: 'changing', label: 'wechselnd' },
  { value: 'not_relevant', label: 'nicht relevant' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_CONDITION_ASSESSMENT_OPTIONS: PatternLogOption<ConditionAssessment>[] = [
  {
    value: 'clear_conditions',
    label: 'Bedingungen der bisherigen Beobachtungen erkennbar',
    description: 'Im beobachteten Segment scheinen wiederkehrende Bedingungen gut beschreibbar.',
  },
  {
    value: 'likely_conditions',
    label: 'mögliche Bedingungen der bisherigen Beobachtungen',
    description: 'Es gibt klare Hinweise, aber noch Variation.',
  },
  {
    value: 'some_signal',
    label: 'erste Hinweise',
    description: 'Etwas scheint zusammenzuhängen, die Grundlage ist noch dünn.',
  },
  {
    value: 'conditions_too_variable',
    label: 'Bedingungen zu wechselhaft',
    description: 'Die Begleitmerkmale wechseln zu stark.',
  },
  {
    value: 'insufficient_sample',
    label: 'nicht ausreichend beobachtet',
    description: 'Keine belastbare Einschätzung möglich.',
  },
  {
    value: 'unclear',
    label: 'unklar',
  },
]

export const DEFAULT_CONDITION_ROLE_OPTIONS: PatternLogOption<ConditionRole>[] = [
  {
    value: 'core',
    label: 'Traf in Musterfällen wiederholt gemeinsam auf',
    description: 'Könnte für die Abgrenzung relevant sein — keine notwendige Ursache.',
  },
  {
    value: 'supporting',
    label: 'Unterschied Musterfall und Gegenfall besonders deutlich',
    description: 'Hilfreich zur Schärfung der Formulierung, keine Kausalität.',
  },
  {
    value: 'incidental',
    label: 'Begleitmerkmal',
    description: 'War häufig vorhanden; Vergleichbarkeit unklar.',
  },
  {
    value: 'unclear',
    label: 'Nicht sicher vergleichbar',
  },
]

export const DEFAULT_RELEVANT_CONDITION_OPTIONS: PatternLogOption<ConditionDimensionId | 'none_clear' | 'unclear'>[] = [
  { value: 'zone', label: 'Zone' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'pressureLevel', label: 'Druckniveau' },
  { value: 'possessionState', label: 'Puckkontrolle' },
  { value: 'supportState', label: 'Support' },
  { value: 'side', label: 'Seite' },
  { value: 'none_clear', label: 'keine davon klar' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_COUNTER_DIFFERENCE_OPTIONS: PatternLogOption<CounterDifference>[] = [
  { value: 'other_zone', label: 'andere Zone' },
  { value: 'other_trigger', label: 'anderer Trigger' },
  { value: 'other_pressure', label: 'anderes Druckniveau' },
  { value: 'other_possession', label: 'andere Puckkontrolle' },
  { value: 'other_support', label: 'anderer Support' },
  { value: 'other_side', label: 'andere Seite' },
  { value: 'other_positioning', label: 'andere Teampositionierung' },
  { value: 'nothing_clear', label: 'nichts klar anders' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_TARGET_EFFECT_OPTIONS: PatternLogOption<TargetEffect>[] = [
  { value: 'middle', label: 'Zentraler Raum' },
  { value: 'outside', label: 'Außenraum' },
  { value: 'weak_side', label: 'Puckferne Seite' },
  { value: 'net_front', label: 'Direkt vor dem Tor' },
  { value: 'depth', label: 'Tiefe' },
  { value: 'blue_line', label: 'Bereich an der blauen Linie' },
  { value: 'passing_lane', label: 'Passlinie' },
  { value: 'shot_lane', label: 'Schussbahn' },
  { value: 'support_option', label: 'Anschlussoption' },
  { value: 'space_behind', label: 'Raum dahinter' },
  { value: 'other', label: 'anderes' },
  { value: 'not_relevant', label: 'für diesen Vergleich nicht relevant' },
  { value: 'unclear', label: 'Nicht sicher beurteilbar' },
]

export const DEFAULT_ACTOR_ROLE_OPTIONS: PatternLogOption<ActorRole>[] = [
  { value: 'center', label: 'Center' },
  { value: 'wing', label: 'Wing' },
  { value: 'defense', label: 'Defense' },
  { value: 'puck_carrier', label: 'Puckführer' },
  { value: 'nearest_defender', label: 'nächster Defender' },
  { value: 'multiple', label: 'mehrere Spieler gemeinsam' },
  { value: 'changing', label: 'wechselnde Rolle' },
  { value: 'not_relevant', label: 'nicht relevant' },
  { value: 'unclear', label: 'nicht klar erkennbar' },
]

export const DEFAULT_SEQUENCE_SIMILARITY_OPTIONS: PatternLogOption<SequenceSimilarity>[] = [
  { value: 'very_similar', label: 'sehr ähnlich' },
  { value: 'similar', label: 'ähnlich' },
  {
    value: 'same_function_different_execution',
    label: 'gleiche Funktion, andere Ausführung',
    description: 'Der Kern bleibt, die sichtbare Form wechselt.',
  },
  { value: 'noticeably_different', label: 'merklich anders' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS: PatternLogOption<InvariantDimensionRole>[] = [
  {
    value: 'core',
    label: 'Bisher stabil beobachtet',
    description: 'In den bisher verglichenen Situationen wiederholt ähnlich sichtbar — vorläufig, nicht bewiesen invariant.',
  },
  {
    value: 'frequent',
    label: 'Häufig ähnlich',
    description: 'Tritt oft ähnlich auf, aber nicht in allen Fällen.',
  },
  {
    value: 'variable',
    label: 'Variabel',
    description: 'Wechselt zwischen vergleichbaren Situationen.',
  },
  { value: 'not_relevant', label: 'Für diesen Vergleich nicht relevant' },
  { value: 'unclear', label: 'Nicht ausreichend beurteilbar' },
]

export const DEFAULT_FLEXIBILITY_OPTIONS: PatternLogOption<PatternFlexibility>[] = [
  {
    value: 'rigid',
    label: 'Sehr starr',
    description: 'Viele Merkmale bleiben nahezu identisch.',
  },
  {
    value: 'stable_with_variation',
    label: 'Stabil mit Variation',
    description: 'Kern bleibt gleich, einzelne Details wechseln.',
  },
  {
    value: 'functionally_stable',
    label: 'Funktional stabil',
    description: 'Die sichtbare Ausführung variiert stark, aber die Funktion bleibt erkennbar.',
  },
  {
    value: 'highly_variable',
    label: 'Stark variabel',
    description: 'Kaum ein stabiler Kern erkennbar.',
  },
  {
    value: 'too_few_examples',
    label: 'Zu wenige Beispiele',
  },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_ALLOWED_VARIATION_OPTIONS: PatternLogOption<InvariantDimensionId | 'other' | 'none' | 'unclear'>[] = [
  { value: 'zone', label: 'Zone' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'actorRole', label: 'Rolle' },
  { value: 'side', label: 'Seite' },
  { value: 'primaryAction', label: 'zentrale Aktion / Positionierung' },
  { value: 'sequenceSimilarity', label: 'Ablauf' },
  { value: 'targetEffect', label: 'Sichtbare Folge / beeinflusster Raum' },
  { value: 'other', label: 'andere' },
  { value: 'none', label: 'keine' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_PATTERN_PRESENCE_OPTIONS: PatternLogOption<PatternPresence>[] = [
  { value: 'clear', label: 'klar ja' },
  { value: 'partial', label: 'teilweise' },
  { value: 'absent', label: 'nein' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_OPPONENT_CONTEXT_OPTIONS: PatternLogOption<OpponentContext>[] = [
  { value: 'very_similar', label: 'sehr ähnlich' },
  { value: 'similar', label: 'ähnlich' },
  { value: 'different', label: 'anders' },
  { value: 'strongly_different', label: 'stark anders' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_PERSONNEL_CONTEXT_OPTIONS: PatternLogOption<PersonnelContext>[] = [
  { value: 'same', label: 'weitgehend dieselben' },
  { value: 'similar_roles', label: 'ähnliche Rollen, andere Spieler' },
  { value: 'different', label: 'deutlich andere Spieler/Rollen' },
  { value: 'changing', label: 'wechselnd' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_GAME_STATE_OPTIONS: PatternLogOption<GameStateContext>[] = [
  { value: 'neutral', label: 'ausgeglichen / normal' },
  { value: 'leading', label: 'Führung' },
  { value: 'trailing', label: 'Rückstand' },
  { value: 'late_game', label: 'späte Spielphase' },
  { value: 'special_situation', label: 'Special Situation' },
  { value: 'changing', label: 'wechselnd' },
  { value: 'not_relevant', label: 'nicht relevant' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_STARTING_CONDITION_OPTIONS: PatternLogOption<StartingCondition>[] = [
  { value: 'very_similar', label: 'sehr ähnlich' },
  { value: 'similar', label: 'ähnlich' },
  { value: 'different', label: 'deutlich anders' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_ATTRIBUTION_OPTIONS: PatternLogOption<PatternAttribution>[] = [
  {
    value: 'mostly_structural',
    label: 'In mehreren unterschiedlichen Kontexten beobachtet',
    description: 'Das Verhalten war unter unterschiedlichen sichtbaren Kontextbedingungen erneut sichtbar — keine Ursache.',
  },
  {
    value: 'mostly_situational',
    label: 'Bisher nur unter ähnlichen Kontextbedingungen beobachtet',
    description: 'Bisher eng an ähnliche Ausgangslagen gebunden — keine situative Ursache behaupten.',
  },
  {
    value: 'mixed',
    label: 'Gemischte beziehungsweise widersprüchliche Beobachtungen',
    description: 'Passende und abweichende Kontexte stehen nebeneinander.',
  },
  {
    value: 'insufficient_evidence',
    label: 'Nicht ausreichend beobachtet',
    description: 'Vergleichbarkeit oder Anzahl reichen noch nicht.',
  },
  { value: 'unclear', label: 'Nicht sicher beurteilbar' },
]

/** Legacy causal labels — readable for old answers, not offered in new UI. */
export const LEGACY_ATTRIBUTION_LABELS: Record<string, string> = {
  opponent_driven: '(Legacy) eher gegnerbedingt',
  personnel_driven: '(Legacy) eher personell',
  game_state_driven: '(Legacy) eher spielstands-/zeitbedingt',
}

export const DEFAULT_CONFIDENCE_OPTIONS: PatternLogOption<AttributionConfidence>[] = [
  { value: 'low', label: 'gering' },
  { value: 'medium', label: 'mittel' },
  { value: 'high', label: 'hoch' },
  { value: 'not_assessable', label: 'nicht beurteilbar' },
]

export const DEFAULT_FREQUENCY_OPTIONS: PatternLogOption<TendencyFrequency>[] = [
  { value: 'two', label: '2×' },
  { value: 'three', label: '3×' },
  { value: 'four', label: '4×' },
  { value: 'five_plus', label: '5× oder häufiger' },
  { value: 'hard_to_count', label: 'schwer zu zählen' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_PRIMARY_CONDITION_OPTIONS: PatternLogOption<TendencyPrimaryCondition>[] = [
  { value: 'trigger', label: 'bestimmter Trigger' },
  { value: 'pressure', label: 'bestimmter Druck' },
  { value: 'zone', label: 'bestimmte Zone' },
  { value: 'possession', label: 'bestimmte Puckkontrolle' },
  { value: 'support', label: 'bestimmter Support' },
  { value: 'opponent_behavior', label: 'bestimmtes Gegnerverhalten' },
  { value: 'game_state', label: 'bestimmter Game State' },
  { value: 'multiple', label: 'mehrere Bedingungen' },
  { value: 'no_clear_condition', label: 'keine klare Bedingung' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_STABLE_CORE_OPTIONS: PatternLogOption<TendencyStableCoreId>[] = [
  { value: 'zone', label: 'Zone' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'team_function', label: 'Teamfunktion' },
  { value: 'target_space', label: 'Zielraum' },
  { value: 'actor_role', label: 'ausführende Rolle' },
  { value: 'side', label: 'Seite' },
  { value: 'sequence', label: 'Ablauf' },
  { value: 'opponent_reaction', label: 'Reaktion auf Gegner' },
  { value: 'other', label: 'anderes' },
  { value: 'none_clear', label: 'nichts klar konstant' },
  { value: 'unclear', label: 'unklar' },
]

export const DEFAULT_TENDENCY_VARIATION_OPTIONS: PatternLogOption<TendencyAllowedVariationId>[] = [
  { value: 'side', label: 'Seite' },
  { value: 'player', label: 'Spieler' },
  { value: 'role', label: 'Rolle' },
  { value: 'exact_position', label: 'genaue Position' },
  { value: 'sequence', label: 'Ablauf' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'zone', label: 'Zone' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'other', label: 'anderes' },
  { value: 'little_variation', label: 'kaum Variation' },
  { value: 'unclear', label: 'unklar' },
]

export const INVARIANT_DIMENSION_LABELS: Record<InvariantDimensionId, string> = {
  zone: 'Zone',
  trigger: 'Trigger',
  primaryAction: 'Zentrale Aktion',
  targetEffect: 'Sichtbare Folge / beeinflusster Raum',
  actorRole: 'Ausführende Rolle',
  side: 'Seite',
  sequenceSimilarity: 'Ablauf',
}

export function labelForOption<T extends string>(
  options: PatternLogOption<T>[],
  value: string | null | undefined,
): string {
  if (!value) return '–'
  const hit = options.find((opt) => opt.value === value)
  return hit?.label || LEGACY_ATTRIBUTION_LABELS[value] || value
}
