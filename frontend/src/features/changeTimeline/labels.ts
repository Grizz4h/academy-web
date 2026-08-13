import type { TimelineOption } from './types'
import { DEFAULT_CHANGE_MAGNITUDE_OPTIONS } from '../beforeAfterCompare/labels'

export { DEFAULT_CHANGE_MAGNITUDE_OPTIONS }

export const RELATION_OPTIONS: TimelineOption[] = [
  {
    value: 'matches_baseline',
    label: 'Entspricht dem bisherigen Muster',
    description: 'Verhalten wirkt wie zuvor.',
  },
  {
    value: 'slight_deviation',
    label: 'Leichte Abweichung',
    description: 'Details verändern sich, Grundverhalten bleibt ähnlich.',
  },
  {
    value: 'clear_deviation',
    label: 'Klare Abweichung',
    description: 'Die Situation sieht deutlich anders aus.',
  },
  {
    value: 'new_behavior',
    label: 'Neues Verhalten',
    description: 'Eine neue, unterscheidbare Lösung erscheint.',
  },
  {
    value: 'mixed',
    label: 'Gemischt',
    description: 'Elemente von vorher und neu treten gleichzeitig auf.',
  },
  {
    value: 'unclear',
    label: 'Unklar',
  },
]

export const DIMENSION_OPTIONS: TimelineOption[] = [
  { value: 'space_priority', label: 'Raumpriorität' },
  { value: 'pressure_timing', label: 'Druck-Timing / Zugriff' },
  { value: 'positioning', label: 'Positionierung' },
  { value: 'depth', label: 'Tiefe' },
  { value: 'width', label: 'Breite' },
  { value: 'support', label: 'Support' },
  { value: 'decision_behavior', label: 'Entscheidungsverhalten' },
  { value: 'role_distribution', label: 'Rollenverteilung' },
  { value: 'puck_movement', label: 'Puckbewegung' },
  { value: 'other', label: 'Anderes' },
  { value: 'unclear', label: 'Unklar' },
]

export const STABILITY_OPTIONS: TimelineOption[] = [
  {
    value: 'persists_consistently',
    label: 'Bleibt stabil',
    description: 'Das neue Verhalten tritt danach durchgehend bzw. sehr konstant auf.',
  },
  {
    value: 'mostly_persists',
    label: 'Bleibt überwiegend',
    description: 'Es gibt kleinere Rückfälle, aber der neue Zustand dominiert.',
  },
  {
    value: 'alternates_with_old',
    label: 'Wechselt mit dem alten Muster',
    description: 'Alt und neu treten parallel auf.',
  },
  {
    value: 'returns_to_baseline',
    label: 'Rückkehr zur Baseline',
    description: 'Das Team kehrt sichtbar zum früheren Verhalten zurück.',
  },
  {
    value: 'single_deviation_only',
    label: 'Nur einzelne Abweichung',
    description: 'Es entstand kein stabiler neuer Zustand.',
  },
  { value: 'too_variable', label: 'Zu wechselhaft' },
  { value: 'unclear', label: 'Unklar' },
]

export const COMPARABILITY_OPTIONS: TimelineOption[] = [
  { value: 'yes', label: 'Ja' },
  { value: 'mostly', label: 'Größtenteils' },
  { value: 'partly', label: 'Nur teilweise' },
  { value: 'no', label: 'Nein' },
  { value: 'unclear', label: 'Unklar' },
]

export const ASSESSMENT_OPTIONS: TimelineOption[] = [
  {
    value: 'clear_new_state',
    label: 'Klarer neuer Zustand',
    description: 'Nach einem Zeitpunkt tritt ein neues Verhalten wiederholt und stabil auf.',
  },
  {
    value: 'likely_change',
    label: 'Wahrscheinliche Veränderung',
    description: 'Die Hinweise sind stark, aber nicht vollständig stabil.',
  },
  {
    value: 'possible_change',
    label: 'Mögliche Veränderung',
    description: 'Etwas scheint sich zu verschieben, Datenlage noch dünn.',
  },
  {
    value: 'temporary_deviation',
    label: 'Temporäre Abweichung',
    description: 'Neue Lösung tritt nur kurz auf.',
  },
  {
    value: 'single_outlier',
    label: 'Einzelner Ausreißer',
    description: 'Eine Szene sieht anders aus, danach Rückkehr.',
  },
  {
    value: 'alternating_behavior',
    label: 'Wechselndes Verhalten',
    description: 'Alt und neu wechseln sich ab.',
  },
  { value: 'insufficient_sample', label: 'Zu wenig Beobachtungen' },
  { value: 'unclear', label: 'Unklar' },
]

export const STABLE_DIMENSION_OPTIONS: TimelineOption[] = [
  { value: 'space_priority', label: 'Raumpriorität' },
  { value: 'pressure_idea', label: 'Druckidee' },
  { value: 'positioning', label: 'Positionierung' },
  { value: 'roles', label: 'Rollen' },
  { value: 'decision_principle', label: 'Entscheidungsprinzip' },
  { value: 'other', label: 'Anderes' },
  { value: 'nothing_clear', label: 'Nichts klar' },
  { value: 'unclear', label: 'Unklar' },
]

export const CHANGE_POINT_NONE_OPTIONS: TimelineOption[] = [
  { value: 'no_clear_change_point', label: 'Kein klarer Change Point' },
  { value: 'too_variable', label: 'Zu wechselhaft' },
  { value: 'unclear', label: 'Unklar' },
]

export function labelForOption(options: TimelineOption[], value?: string): string {
  if (!value) return '—'
  return options.find((opt) => opt.value === value)?.label || value
}

export function relationSymbol(relation?: string): string {
  switch (relation) {
    case 'matches_baseline':
      return '●'
    case 'slight_deviation':
      return '○'
    case 'clear_deviation':
    case 'new_behavior':
      return '◆'
    case 'mixed':
      return '◇'
    default:
      return '?'
  }
}

export function relationShortLabel(relation?: string): string {
  switch (relation) {
    case 'matches_baseline':
      return 'Baseline'
    case 'slight_deviation':
      return 'Leichte Abweichung'
    case 'clear_deviation':
      return 'Klare Abweichung'
    case 'new_behavior':
      return 'Neues Verhalten'
    case 'mixed':
      return 'Gemischt'
    default:
      return 'Unklar'
  }
}

export function isDeviationRelation(relation?: string): boolean {
  return relation === 'slight_deviation'
    || relation === 'clear_deviation'
    || relation === 'new_behavior'
    || relation === 'mixed'
}
