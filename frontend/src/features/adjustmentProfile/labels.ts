import { DEFAULT_CONFIDENCE_OPTIONS } from '../beforeAfterCompare/labels'
import { DIMENSION_OPTIONS } from '../changeTimeline/labels'
import type { ProfileOption } from './types'

export { DEFAULT_CONFIDENCE_OPTIONS }

export const PRIMARY_CHANGE_OPTIONS: ProfileOption[] = [
  ...DIMENSION_OPTIONS.filter((opt) => opt.value !== 'other' && opt.value !== 'unclear'),
  { value: 'risk_profile', label: 'Risikoprofil' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const STABILITY_OPTIONS: ProfileOption[] = [
  { value: 'stable', label: 'Blieb stabil' },
  { value: 'mostly_stable', label: 'Blieb überwiegend bestehen' },
  { value: 'alternating', label: 'Wechselte mit dem alten Verhalten' },
  { value: 'temporary', label: 'Nur temporär' },
  { value: 'single_deviation', label: 'Eher einzelne Abweichung' },
  { value: 'unclear', label: 'Unklar' },
]

export const POSSIBLE_TRIGGER_OPTIONS: ProfileOption[] = [
  { value: 'opponent_repeated_success', label: 'Gegner findet wiederholt dieselbe Lösung' },
  { value: 'own_repeated_problem', label: 'Eigenes Problem wiederholt sich' },
  { value: 'opponent_structure', label: 'Veränderte Gegnerstruktur' },
  { value: 'pressure_change', label: 'Veränderter Druck' },
  { value: 'matchup', label: 'Matchup' },
  { value: 'personnel_change', label: 'Anderes Personal / andere Reihe' },
  { value: 'game_state', label: 'Game State / Spielstand / Zeit' },
  { value: 'special_situation', label: 'Spezielle Spielsituation' },
  { value: 'tempo_change', label: 'Tempoänderung' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const STABLE_ELEMENT_OPTIONS: ProfileOption[] = [
  { value: 'space_priority', label: 'Raumpriorität' },
  { value: 'base_structure', label: 'Grundstruktur' },
  { value: 'role_principle', label: 'Rollenprinzip' },
  { value: 'pressure_idea', label: 'Druckidee' },
  { value: 'support_principle', label: 'Supportprinzip' },
  { value: 'decision_principle', label: 'Entscheidungsprinzip' },
  { value: 'risk_profile', label: 'Risikoprofil' },
  { value: 'nothing_clear', label: 'Nichts klar' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const INTERACTION_RESPONSE_OPTIONS: ProfileOption[] = [
  {
    value: 'problem_reduced',
    label: 'Problem trat seltener auf',
    description: 'Die vorherige Schwäche war weniger sichtbar.',
  },
  {
    value: 'problem_shifted',
    label: 'Problem verlagerte sich',
    description: 'Ein Raum wurde stabiler, dafür entstand ein anderer.',
  },
  {
    value: 'opponent_found_new_solution',
    label: 'Gegner fand eine neue Lösung',
    description: 'Das Adjustment führte zu einer anderen gegnerischen Reaktion.',
  },
  {
    value: 'interaction_became_more_balanced',
    label: 'Interaktion wurde ausgeglichener',
    description: 'Keine Seite hatte denselben klaren Vorteil wie zuvor.',
  },
  { value: 'little_visible_change', label: 'Kaum sichtbare Veränderung' },
  { value: 'too_few_examples', label: 'Zu wenige Beispiele' },
  { value: 'unclear', label: 'Unklar' },
]

export const ASSESSMENT_OPTIONS: ProfileOption[] = [
  {
    value: 'strong_adjustment_signal',
    label: 'Starkes Adjustment-Signal',
    description: 'Vorher/Nachher ist klar, Veränderung bleibt bestehen und passt zeitlich zu einem möglichen Problem.',
  },
  {
    value: 'likely_adjustment',
    label: 'Wahrscheinliches Adjustment',
    description: 'Mehrere Hinweise passen zusammen, aber nicht alles ist eindeutig.',
  },
  {
    value: 'possible_adjustment',
    label: 'Mögliches Adjustment',
    description: 'Veränderung erkennbar, Zusammenhang noch dünn.',
  },
  {
    value: 'probably_context_variation',
    label: 'Eher Kontextvariation',
    description: 'Unterschied könnte durch veränderte Spielsituation entstanden sein.',
  },
  { value: 'single_deviation', label: 'Eher einzelne Abweichung' },
  { value: 'insufficient_evidence', label: 'Zu wenig Evidenz' },
  { value: 'unclear', label: 'Unklar' },
]

export const NO_ADJUSTMENT_REASON_OPTIONS: ProfileOption[] = [
  { value: 'mostly_stable', label: 'Verhalten blieb weitgehend stabil' },
  { value: 'only_situational', label: 'Veränderungen nur situativ' },
  { value: 'too_few_comparable', label: 'Zu wenig vergleichbare Szenen' },
  { value: 'too_variable', label: 'Zu wechselhaft' },
  { value: 'unclear', label: 'Unklar' },
]

export const PRIMARY_PICK_EXTRA_OPTIONS: ProfileOption[] = [
  { value: '__both_similar', label: 'Beide ähnlich' },
  { value: '__unclear', label: 'Unklar' },
]

export const NEXT_WATCH_OPTIONS: ProfileOption[] = [
  { value: 'holds_adjustment_1', label: 'Hält Adjustment 1?' },
  { value: 'holds_adjustment_2', label: 'Hält Adjustment 2?' },
  { value: 'old_behavior_returns', label: 'Kehrt das alte Verhalten zurück?' },
  { value: 'opponent_reacts_again', label: 'Reagiert der Gegner erneut?' },
  { value: 'new_problem', label: 'Entsteht ein neues Problem?' },
  { value: 'no_clear_priority', label: 'Keine klare Priorität' },
  { value: 'other', label: 'Anderes' },
]

export function labelForOption(options: ProfileOption[], value?: string): string {
  if (!value) return '—'
  return options.find((opt) => opt.value === value)?.label || value
}

export function labelsForValues(options: ProfileOption[], values: string[]): string[] {
  return values.map((value) => labelForOption(options, value))
}

export function shortLabel(text: string, fallback: string): string {
  const trimmed = String(text || '').trim()
  if (!trimmed) return fallback
  return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed
}
