import type { CompareFieldOption } from './types'

export const DEFAULT_SPACE_PRIORITY_OPTIONS: CompareFieldOption[] = [
  { value: 'middle', label: 'Mitte' },
  { value: 'outside', label: 'Außen / Bande' },
  { value: 'weak_side', label: 'Weak Side' },
  { value: 'net_front', label: 'Net Front / Slot' },
  { value: 'high', label: 'Hoch / blaue Linie' },
  { value: 'depth', label: 'Tiefe / hinter dem Tor' },
  { value: 'blue_line', label: 'Blue Line / Übergang' },
  { value: 'multiple', label: 'Mehrere Räume gleichzeitig' },
  { value: 'not_relevant', label: 'Nicht relevant' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_PRESSURE_OPTIONS: CompareFieldOption[] = [
  { value: 'early_aggressive', label: 'Früh / aggressiv' },
  { value: 'controlled_pressure', label: 'Kontrollierter Druck' },
  { value: 'delayed_pressure', label: 'Verzögerter Druck' },
  { value: 'protect_space_first', label: 'Erst Raum sichern' },
  { value: 'little_pressure', label: 'Wenig Druck' },
  { value: 'changing', label: 'Wechselnd / uneinheitlich' },
  { value: 'not_relevant', label: 'Nicht relevant' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_POSITIONING_OPTIONS: CompareFieldOption[] = [
  { value: 'compact', label: 'Kompakt' },
  { value: 'wide', label: 'Breit' },
  { value: 'flat', label: 'Flach' },
  { value: 'layered', label: 'Gestaffelt' },
  { value: 'deep', label: 'Tief' },
  { value: 'high', label: 'Hoch' },
  { value: 'rotating', label: 'Rotierend / wechselnd' },
  { value: 'changing', label: 'Wechselnd / uneinheitlich' },
  { value: 'not_relevant', label: 'Nicht relevant' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_DECISION_OPTIONS: CompareFieldOption[] = [
  { value: 'control_first', label: 'Kontrolle zuerst' },
  { value: 'direct', label: 'Direkt' },
  { value: 'patient', label: 'Geduldig' },
  { value: 'aggressive', label: 'Aggressiv' },
  { value: 'simplifying', label: 'Vereinfachend' },
  { value: 'risk_accepting', label: 'Risikobereit' },
  { value: 'reactive', label: 'Reaktiv' },
  { value: 'changing', label: 'Wechselnd / uneinheitlich' },
  { value: 'not_relevant', label: 'Nicht relevant' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_CHANGE_MAGNITUDE_OPTIONS: CompareFieldOption[] = [
  { value: 'subtle', label: 'Subtil' },
  { value: 'clear', label: 'Klar' },
  { value: 'major', label: 'Deutlich / groß' },
  { value: 'too_variable', label: 'Zu wechselhaft' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_CONFIDENCE_OPTIONS: CompareFieldOption[] = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
]

export const DEFAULT_PRIMARY_CHANGE_OPTIONS: CompareFieldOption[] = [
  { value: 'spacePriority', label: 'Raumpriorität' },
  { value: 'pressureBehavior', label: 'Druck / Zugriff' },
  { value: 'positioning', label: 'Positionierung / Staffelung' },
  { value: 'decisionBehavior', label: 'Entscheidungsverhalten' },
  { value: 'other', label: 'Freie Beschreibung / anderes' },
  { value: 'no_clear_change', label: 'Keine klare relevante Veränderung' },
  { value: 'unclear', label: 'Unklar' },
]

export const DEFAULT_STATE_FIELDS = [
  {
    id: 'spacePriority',
    label: 'Raumpriorität',
    type: 'single_choice' as const,
    options: DEFAULT_SPACE_PRIORITY_OPTIONS,
  },
  {
    id: 'pressureBehavior',
    label: 'Druck / Zugriff',
    type: 'single_choice' as const,
    options: DEFAULT_PRESSURE_OPTIONS,
  },
  {
    id: 'positioning',
    label: 'Positionierung / Staffelung',
    type: 'single_choice' as const,
    options: DEFAULT_POSITIONING_OPTIONS,
  },
  {
    id: 'decisionBehavior',
    label: 'Entscheidungsverhalten',
    type: 'single_choice' as const,
    options: DEFAULT_DECISION_OPTIONS,
  },
  {
    id: 'description',
    label: 'Was ist für diesen Abschnitt typisch?',
    type: 'text' as const,
    maxChars: 500,
  },
]

export function labelForOption(options: CompareFieldOption[], value?: string): string {
  if (!value) return '—'
  return options.find((opt) => opt.value === value)?.label || value
}

export function compareStatusLabel(status: string): string {
  switch (status) {
    case 'same':
      return 'stabil'
    case 'changed':
      return 'verändert'
    case 'not_relevant':
      return 'nicht relevant'
    default:
      return 'unklar'
  }
}

export function compareStatusSymbol(status: string): string {
  switch (status) {
    case 'same':
      return '='
    case 'changed':
      return '→'
    default:
      return '?'
  }
}
