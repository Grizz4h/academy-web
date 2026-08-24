import type { TimelineOption } from './types'
import { DEFAULT_CONFIDENCE_OPTIONS } from '../beforeAfterCompare/labels'

export { DEFAULT_CONFIDENCE_OPTIONS }

export const PRIOR_PROBLEM_OPTIONS: TimelineOption[] = [
  { value: 'opponent_breaks_pressure', label: 'Gegner überspielt Druck wiederholt', group: 'Gegnerische Wirkung' },
  { value: 'middle_opened_repeatedly', label: 'Gegner findet wiederholt die Mitte', group: 'Gegnerische Wirkung' },
  { value: 'outside_lane_exploited', label: 'Gegner nutzt Außenbahn / Weak Side', group: 'Gegnerische Wirkung' },
  { value: 'entries_too_easy', label: 'Gegner kommt zu leicht in die Zone', group: 'Gegnerische Wirkung' },
  { value: 'weak_side_exposed', label: 'Weak Side wird wiederholt offen gelassen', group: 'Gegnerische Wirkung' },
  { value: 'net_front_problem', label: 'Net Front wird wiederholt problematisch', group: 'Gegnerische Wirkung' },
  { value: 'exit_under_pressure_fails', label: 'Exit unter Druck wiederholt schwierig', group: 'Eigene Herausforderung' },
  { value: 'support_missing', label: 'Support fehlt', group: 'Eigene Herausforderung' },
  { value: 'turnovers_repeat', label: 'Turnover wiederholen sich', group: 'Eigene Herausforderung' },
  { value: 'tempo_mismatch', label: 'Tempo / Abstände passen nicht', group: 'Eigene Herausforderung' },
  { value: 'matchup_problem', label: 'Matchup erzeugt wiederholt Herausforderungen', group: 'Kontext' },
  { value: 'personnel_change', label: 'Personal / Reihe verändert', group: 'Kontext' },
  { value: 'game_state_shift', label: 'Spielkontext verändert', group: 'Kontext' },
  { value: 'special_teams_context', label: 'Special-Teams-Kontext', group: 'Kontext' },
  { value: 'other', label: 'Anderes', group: 'Sonstiges' },
  { value: 'no_clear_problem', label: 'Keine klare vorherige Herausforderung', group: 'Sonstiges' },
  { value: 'unclear', label: 'Unklar', group: 'Sonstiges' },
]

export const TRIGGER_TYPE_OPTIONS: TimelineOption[] = [
  { value: 'opponent_driven', label: 'Gegnerbedingt' },
  { value: 'own_structural_problem', label: 'Eigene wiederkehrende Herausforderung' },
  { value: 'personnel_driven', label: 'Personalbedingt' },
  { value: 'game_state_driven', label: 'Spielkontextbedingt' },
  { value: 'special_situation', label: 'Spezielle Situation' },
  { value: 'mixed', label: 'Gemischt' },
  { value: 'no_clear_trigger', label: 'Kein klarer Trigger' },
  { value: 'unclear', label: 'Unklar' },
]

export const EVIDENCE_OPTIONS: TimelineOption[] = [
  { value: 'problem_repeated_before', label: 'Herausforderung trat mehrfach vor der Veränderung auf' },
  { value: 'same_space', label: 'Veränderung betrifft genau den problematischen Raum' },
  { value: 'same_role', label: 'Veränderung betrifft genau die beteiligte Rolle / Spielerposition' },
  { value: 'timing_fits', label: 'Timing passt unmittelbar danach' },
  { value: 'reduces_open_option', label: 'Das neue Verhalten reduziert die zuvor offene Option' },
  { value: 'opponent_must_adapt', label: 'Gegner muss danach anders reagieren' },
  { value: 'problem_less_frequent', label: 'Dieselbe Interaktion tritt später seltener so auf' },
  {
    value: 'timing_only',
    label: 'Nur zeitlicher Zusammenhang',
    description: 'Die Herausforderung trat vorher auf und die Veränderung danach. Das allein beweist noch keine Ursache.',
  },
  { value: 'little_direct_evidence', label: 'Kaum direkte Beobachtungsgrundlage' },
  { value: 'unclear', label: 'Unklar' },
]

export const ALTERNATIVE_OPTIONS: TimelineOption[] = [
  { value: 'different_opponent_behavior', label: 'Anderes gegnerisches Verhalten' },
  { value: 'different_personnel', label: 'Andere Spieler / Reihe auf dem Eis' },
  { value: 'matchup', label: 'Matchup' },
  { value: 'game_state', label: 'Spielstand / Spielkontext' },
  { value: 'fatigue', label: 'Ermüdung' },
  { value: 'random_variation', label: 'Zufällige Variation' },
  { value: 'situational_solution', label: 'Situative Lösung einzelner Spieler' },
  { value: 'special_teams', label: 'Wechsel in Special Teams' },
  { value: 'none_clear', label: 'Keine klare Alternative' },
  { value: 'unclear', label: 'Unklar' },
]

export const PROBLEM_FIT_OPTIONS: TimelineOption[] = [
  { value: 'direct', label: 'Direkt' },
  { value: 'partial', label: 'Teilweise' },
  { value: 'indirect', label: 'Indirekt' },
  { value: 'weak', label: 'Kaum' },
  { value: 'no_functional_link', label: 'Keine ausreichende funktionale Verbindung erkennbar' },
  { value: 'unclear', label: 'Nicht sicher beurteilbar' },
]

export const LINK_STRENGTH_OPTIONS: TimelineOption[] = [
  {
    value: 'strong_link',
    label: 'Starker Zusammenhang',
    description: 'Mehrere Indizien passen inhaltlich und zeitlich zusammen.',
  },
  {
    value: 'plausible_link',
    label: 'Plausibler Zusammenhang',
    description: 'Die Erklärung passt gut, bleibt aber unsicher.',
  },
  {
    value: 'possible_link',
    label: 'Möglicher Zusammenhang',
    description: 'Es gibt Hinweise, aber mehrere Alternativen.',
  },
  {
    value: 'mostly_timing',
    label: 'Vor allem zeitlicher Zusammenhang',
    description: 'Etwas passiert vorher, etwas anderes danach.',
  },
  { value: 'weak_link', label: 'Schwacher Zusammenhang' },
  { value: 'insufficient_evidence', label: 'Nicht ausreichend beobachtet' },
  { value: 'unclear', label: 'Unklar' },
]

export function labelForOption(options: TimelineOption[], value?: string): string {
  if (!value) return '—'
  return options.find((opt) => opt.value === value)?.label || value
}

export function labelsForValues(options: TimelineOption[], values: string[]): string[] {
  return values.map((value) => labelForOption(options, value))
}

export function groupOptions(options: TimelineOption[]): Array<{ group: string; options: TimelineOption[] }> {
  const groups: Array<{ group: string; options: TimelineOption[] }> = []
  for (const option of options) {
    const group = option.group || 'Allgemein'
    const existing = groups.find((entry) => entry.group === group)
    if (existing) existing.options.push(option)
    else groups.push({ group, options: [option] })
  }
  return groups
}
