import type { PredictionOption } from './types'

export type PuckCarrierSolution =
  | 'short_pass'
  | 'middle_pass'
  | 'wall_pass'
  | 'reverse'
  | 'carry'
  | 'chip_space'
  | 'dump'
  | 'clear'
  | 'protect_hold'
  | 'reset'
  | 'risky_pass'
  | 'turnover'
  | 'other'
  | 'unclear'

export type PressureSource =
  | 'front'
  | 'side'
  | 'behind'
  | 'multiple'
  | 'closing_lane'
  | 'unclear'

export type PressureWindow =
  | 'time_available'
  | 'limited_time'
  | 'immediate_pressure'
  | 'unclear'

export type SupportState =
  | 'multiple_options'
  | 'one_clear_option'
  | 'distant_support'
  | 'isolated'
  | 'unclear'

export type PredictionCue =
  | 'body_orientation'
  | 'head_scan'
  | 'stick_puck_position'
  | 'support_position'
  | 'pressure_angle'
  | 'open_space'
  | 'speed'
  | 'distance_to_pressure'
  | 'previous_behavior'
  | 'other'
  | 'gut_feeling'
  | 'unclear'

export type PressureResolution =
  | 'cleanly_resolved'
  | 'temporarily_resolved'
  | 'pressure_continues'
  | 'possession_lost'
  | 'unclear'

export type PredictionReadAssessment =
  | 'support_read'
  | 'pressure_angle_read'
  | 'body_orientation_read'
  | 'open_space_read'
  | 'speed_read'
  | 'missed_option'
  | 'underestimated_pressure'
  | 'overestimated_support'
  | 'misread_body'
  | 'unpredictable'
  | 'unclear'

export const PUCK_CARRIER_SOLUTION_OPTIONS: PredictionOption[] = [
  {
    value: 'short_pass',
    label: 'Kurzer Pass',
    shortLabel: 'Kurzer Pass',
    description: 'Schnelle nahe Anspielstation nutzen.',
  },
  {
    value: 'middle_pass',
    label: 'Pass in die Mitte',
    shortLabel: 'Pass Mitte',
    description: 'Zentrale Lösung / Middle Support suchen.',
  },
  {
    value: 'wall_pass',
    label: 'Pass an die Bande',
    shortLabel: 'Pass Bande',
    description: 'Wall-/Side-Option nutzen.',
  },
  {
    value: 'reverse',
    label: 'Reverse / zurück',
    shortLabel: 'Reverse',
    description: 'Richtung wechseln oder auf hintere Unterstützung zurückspielen.',
  },
  {
    value: 'carry',
    label: 'Puck tragen',
    shortLabel: 'Carry',
    description: 'Mit Kontrolle selbst aus dem Druck skaten.',
  },
  {
    value: 'chip_space',
    label: 'Chip / Raum spielen',
    shortLabel: 'Chip',
    description: 'Puck kontrolliert in freien Raum legen.',
  },
  {
    value: 'dump',
    label: 'Dump / tief',
    shortLabel: 'Dump',
    description: 'Puck bewusst tief spielen.',
  },
  {
    value: 'clear',
    label: 'Clear / Befreiung',
    shortLabel: 'Clear',
    description: 'Druck durch Herausspielen aus der Gefahrenzone lösen.',
  },
  {
    value: 'protect_hold',
    label: 'Puck schützen / halten',
    shortLabel: 'Puck schützen',
    description: 'Körper/Puck benutzen, um Zeit zu gewinnen.',
  },
  {
    value: 'reset',
    label: 'Reset',
    shortLabel: 'Reset',
    description: 'Situation bewusst neu aufbauen statt vorwärts zu erzwingen.',
  },
  {
    value: 'risky_pass',
    label: 'Riskanter Pass durch Druck',
    shortLabel: 'Riskanter Pass',
    description: 'Versucht eine enge / zugestellte Passlinie.',
  },
  {
    value: 'turnover',
    label: 'Puckverlust',
    shortLabel: 'Puckverlust',
    description: 'Prognose: Druck kann nicht sauber gelöst werden.',
  },
  {
    value: 'other',
    label: 'Andere Lösung',
    shortLabel: 'Andere Lösung',
  },
  {
    value: 'unclear',
    label: 'Unklar',
    shortLabel: 'Unklar',
  },
]

export const PUCK_CARRIER_SOLUTION_GROUPS = [
  {
    id: 'controlled',
    label: 'Kontrollierte Lösungen',
    optionValues: [
      'short_pass',
      'middle_pass',
      'wall_pass',
      'reverse',
      'carry',
      'chip_space',
      'dump',
      'clear',
      'protect_hold',
      'reset',
      'risky_pass',
    ],
  },
  {
    id: 'uncontrolled',
    label: 'Keine kontrollierte Lösung',
    optionValues: ['turnover', 'other', 'unclear'],
  },
]

export const PRESSURE_SOURCE_OPTIONS: PredictionOption[] = [
  { value: 'front', label: 'frontal' },
  { value: 'side', label: 'seitlich' },
  { value: 'behind', label: 'von hinten' },
  { value: 'multiple', label: 'von mehreren Seiten' },
  { value: 'closing_lane', label: 'Pass-/Laufweg wird geschlossen' },
  { value: 'unclear', label: 'unklar' },
]

export const PRESSURE_WINDOW_OPTIONS: PredictionOption[] = [
  {
    value: 'time_available',
    label: 'Zeit vorhanden',
    description: 'Mehrere Optionen scheinen noch realistisch.',
  },
  {
    value: 'limited_time',
    label: 'Wenig Zeit',
    description: 'Entscheidung muss schnell kommen.',
  },
  {
    value: 'immediate_pressure',
    label: 'Sofortiger Druck',
    description: 'Nur sehr kleines Entscheidungsfenster.',
  },
  { value: 'unclear', label: 'Unklar' },
]

export const SUPPORT_STATE_OPTIONS: PredictionOption[] = [
  { value: 'multiple_options', label: 'mehrere klare Optionen' },
  { value: 'one_clear_option', label: 'eine klare Option' },
  { value: 'distant_support', label: 'Support vorhanden, aber weit/unter Druck' },
  { value: 'isolated', label: 'weitgehend isoliert' },
  { value: 'unclear', label: 'unklar' },
]

export const PREDICTION_CUE_OPTIONS: PredictionOption[] = [
  { value: 'body_orientation', label: 'Körperstellung' },
  { value: 'head_scan', label: 'Blick / Scan' },
  { value: 'stick_puck_position', label: 'Puck-/Schlägerposition' },
  { value: 'support_position', label: 'Position des Supports' },
  { value: 'pressure_angle', label: 'Winkel des Gegners' },
  { value: 'open_space', label: 'freier Raum' },
  { value: 'speed', label: 'Tempo' },
  { value: 'distance_to_pressure', label: 'Abstand zum Druck' },
  { value: 'previous_behavior', label: 'vorheriges Verhalten des Spielers/Teams' },
  { value: 'other', label: 'anderer Hinweis' },
  { value: 'gut_feeling', label: 'Bauchgefühl' },
  { value: 'unclear', label: 'unklar' },
]

export const PRESSURE_RESOLUTION_OPTIONS: PredictionOption[] = [
  { value: 'cleanly_resolved', label: 'sauber gelöst' },
  { value: 'temporarily_resolved', label: 'zunächst gelöst' },
  { value: 'pressure_continues', label: 'Druck bleibt bestehen' },
  { value: 'possession_lost', label: 'Puckbesitz verloren' },
  { value: 'unclear', label: 'unklar' },
]

export const PREDICTION_READ_ASSESSMENT_OPTIONS: PredictionOption[] = [
  { value: 'support_read', label: 'Support richtig gelesen' },
  { value: 'pressure_angle_read', label: 'Druckwinkel richtig gelesen' },
  { value: 'body_orientation_read', label: 'Körperstellung richtig gelesen' },
  { value: 'open_space_read', label: 'freien Raum richtig gelesen' },
  { value: 'speed_read', label: 'Tempo richtig gelesen' },
  { value: 'missed_option', label: 'zusätzliche Option übersehen' },
  { value: 'underestimated_pressure', label: 'Gegnerdruck unterschätzt' },
  { value: 'overestimated_support', label: 'Support überschätzt' },
  { value: 'misread_body', label: 'Körperstellung falsch interpretiert' },
  { value: 'unpredictable', label: 'Entscheidung war für mich nicht vorhersehbar' },
  { value: 'unclear', label: 'unklar' },
]
