import { DEFAULT_CHANGE_MAGNITUDE_OPTIONS } from '../beforeAfterCompare/labels'
import { COMPARABILITY_OPTIONS, DIMENSION_OPTIONS } from '../changeTimeline/labels'
import type { ChainOption } from './types'

export { DEFAULT_CHANGE_MAGNITUDE_OPTIONS, COMPARABILITY_OPTIONS, DIMENSION_OPTIONS }

export const PROBLEM_CATEGORY_OPTIONS: ChainOption[] = [
  { value: 'space_control', label: 'Raumkontrolle' },
  { value: 'pressure', label: 'Druck / Zugriff' },
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
  { value: 'support', label: 'Support' },
  { value: 'possession', label: 'Puckbesitz' },
  { value: 'positioning', label: 'Positionierung' },
  { value: 'role_distribution', label: 'Rollenverteilung' },
  { value: 'puck_movement', label: 'Puckbewegung' },
  { value: 'decision_behavior', label: 'Entscheidungsverhalten' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const PROBLEM_EVIDENCE_OPTIONS: ChainOption[] = [
  { value: 'same_zone', label: 'Gleiche Zone' },
  { value: 'same_trigger', label: 'Gleicher Trigger' },
  { value: 'same_opponent_solution', label: 'Gleiche gegnerische Lösung' },
  { value: 'similar_team_reaction', label: 'Ähnliche Teamreaktion' },
  { value: 'similar_space_opened', label: 'Ähnlicher Raum wird geöffnet' },
  { value: 'similar_structure_breaks', label: 'Ähnliche Struktur bricht' },
  { value: 'repeated_short_span', label: 'Mehrfach innerhalb kurzer Zeit' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const EXAMPLE_COUNT_OPTIONS: ChainOption[] = [
  { value: '2', label: '2 Beispiele' },
  { value: '3', label: '3 Beispiele' },
  { value: '4plus', label: '4 oder mehr' },
  { value: 'hard_to_count', label: 'Schwer zu zählen' },
]

export const RESPONSE_TYPE_OPTIONS: ChainOption[] = [
  { value: 'same_solution', label: 'Gleiche Lösung wie vorher' },
  { value: 'different_solution', label: 'Andere Lösung' },
  { value: 'slowed_down', label: 'Angriff / Spielzug wird verzögert' },
  { value: 'redirected', label: 'Angriff / Spielzug wird umgeleitet' },
  { value: 'reset', label: 'Reset notwendig' },
  { value: 'simplifies', label: 'Vereinfachte Lösung' },
  { value: 'loses_control', label: 'Kontrolle geht verloren' },
  { value: 'creates_different_problem', label: 'Neue Herausforderung / Problemverlagerung' },
  { value: 'no_clear_response', label: 'Keine klare Veränderung' },
  { value: 'unclear', label: 'Unklar' },
]

export const RESPONSE_REPETITION_OPTIONS: ChainOption[] = [
  { value: 'once', label: 'Einmal' },
  { value: 'twice', label: 'Zweimal' },
  { value: 'three_or_more', label: 'Dreimal oder häufiger' },
  { value: 'hard_to_count', label: 'Schwer zu zählen' },
  { value: 'unclear', label: 'Unklar' },
]

export const PROBLEM_EFFECT_OPTIONS: ChainOption[] = [
  {
    value: 'clearly_reduced',
    label: 'Interaktion entwickelt sich wiederholt anders',
    description: 'Die vergleichbare Interaktion verläuft wiederholt sichtbar anders.',
  },
  {
    value: 'partly_reduced',
    label: 'Teilweise verändert',
    description: 'Es bleibt vorhanden, aber verändert sich.',
  },
  {
    value: 'shifted_elsewhere',
    label: 'Herausforderung verlagert sich',
    description: 'Eine bisherige Herausforderung wird weniger sichtbar, dafür entsteht an anderer Stelle eine neue Option oder ein Nachteil.',
  },
  {
    value: 'unchanged',
    label: 'Keine klare Veränderung',
    description: 'Vergleichbare Interaktion bleibt weitgehend gleich.',
  },
  {
    value: 'worse',
    label: 'Herausforderung wird sichtbarer',
    description: 'Das Problem wird sichtbarer.',
  },
  {
    value: 'new_problem_created',
    label: 'Problemverlagerung / Zielkonflikt',
    description: 'Die bisherige Interaktion verändert sich, dafür öffnet sich etwas anderes.',
  },
  { value: 'insufficient_evidence', label: 'Nicht ausreichend beobachtet' },
  { value: 'unclear', label: 'Unklar' },
]

export const TRADEOFF_OPTIONS: ChainOption[] = [
  { value: 'more_outside_space', label: 'Außen mehr Raum' },
  { value: 'more_middle_space', label: 'Mitte mehr Raum' },
  { value: 'weak_side_open', label: 'Weak Side offen' },
  { value: 'more_time', label: 'Mehr Zeit' },
  { value: 'more_depth', label: 'Mehr Tiefe' },
  { value: 'more_blue_line_space', label: 'Mehr Raum an Blue Line / Point' },
  { value: 'easier_reset', label: 'Einfacherer Reset' },
  { value: 'other', label: 'Anderes' },
  { value: 'none_clear', label: 'Keine klar sichtbare' },
  { value: 'unclear', label: 'Unklar' },
]

export const INTERACTION_ASSESSMENT_OPTIONS: ChainOption[] = [
  {
    value: 'clear_effect',
    label: 'Interaktion entwickelt sich wiederholt anders',
    description: 'Die vergleichbare Interaktion verändert sich wiederholt sichtbar — ohne Erfolgsbewertung.',
  },
  {
    value: 'likely_effect',
    label: 'Teilweise verändert',
    description: 'Mehrere Hinweise sprechen dafür.',
  },
  {
    value: 'possible_effect',
    label: 'Erste Veränderung erkennbar',
    description: 'Erste Veränderung erkennbar, aber Sample dünn.',
  },
  {
    value: 'problem_shifted',
    label: 'Herausforderung verlagert sich',
    description: 'Altes Problem kleiner, anderes entsteht.',
  },
  {
    value: 'no_clear_effect',
    label: 'Keine klare Veränderung',
    description: 'Interaktion bleibt weitgehend gleich.',
  },
  { value: 'insufficient_sample', label: 'Nicht ausreichend beobachtet' },
  { value: 'not_comparable', label: 'Nicht ausreichend vergleichbar' },
  { value: 'unclear', label: 'Nicht sicher beurteilbar' },
]

export function labelForOption(options: ChainOption[], value?: string): string {
  if (!value) return '—'
  return options.find((opt) => opt.value === value)?.label || value
}

export function labelsForValues(options: ChainOption[], values: string[]): string[] {
  return values.map((value) => labelForOption(options, value))
}
