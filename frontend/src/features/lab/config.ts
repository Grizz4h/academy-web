import type { LabModuleConfig, PredictionTemplate } from './types'

export const labModules: LabModuleConfig[] = [
  {
    id: 'predict',
    label: 'Predict',
    description: 'Spielsituationen lesen und die nächste Aktion vorhersagen.',
    enabled: true,
  },
  {
    id: 'compare',
    label: 'Compare',
    description: 'Situationen, Teams oder Spielphasen vergleichen.',
    enabled: false,
  },
  {
    id: 'hypothesis',
    label: 'Hypothesis',
    description: 'Taktische Annahmen mit Beobachtungen prüfen.',
    enabled: false,
  },
  {
    id: 'reconstruction',
    label: 'Reconstruction',
    description: 'Spielstrukturen aus der Erinnerung rekonstruieren.',
    enabled: false,
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Live-Eindruck und spätere Erkenntnis vergleichen.',
    enabled: false,
  },
]

export const PRED_TRANSITION_AFTER_POSSESSION_GAIN = 'pred_transition_after_possession_gain'

export const predictionTemplates: PredictionTemplate[] = [
  {
    id: PRED_TRANSITION_AFTER_POSSESSION_GAIN,
    categoryId: 'transition',
    title: 'Was folgt nach dem Puckgewinn?',
    description:
      'Beobachte kontrollierte Puckgewinne des ausgewählten Teams und sage voraus, welche erste Priorität in den nächsten zwei bis drei Sekunden sichtbar wird.',
    relatedAcademyDrills: ['B2_D4'],
    perspective: 'selected_team',
    perspectiveHint:
      'Beobachte immer einen Puckgewinn des ausgewählten Teams. Wenn Augsburg als beobachtetes Team ausgewählt ist, gibst du deine Vorhersage in dem Moment ab, in dem Augsburg den Puck erkennbar gewinnt oder kontrolliert übernimmt.',
    situationTrigger: 'Kontrollierter Puckgewinn des ausgewählten Teams',
    observationGuide: {
      suitableSituations: [
        'Abgefangener Pass mit anschließender Kontrolle',
        'Gewonnenes Duell',
        'Eroberter freier Puck',
        'Stick Check mit kontrollierter Übernahme',
        'Block oder Rebound mit klarer Besitzübernahme',
      ],
      unsuitableSituations: [
        'Bloße Puckberührung ohne Kontrolle',
        'Wild springender Puck',
        'Unklares Gerangel ohne Besitzwechsel',
        'Reine Klärung ohne echte Anschlussmöglichkeit',
        'Situation, in der das Team den Puck nie klar kontrolliert',
      ],
      whenToPredict: [
        'Direkt im Moment der kontrollierten Besitzübernahme',
        'Vor der nächsten klaren Teamaktion innerhalb von zwei bis drei Sekunden',
      ],
      howToDecide: [
        'Entscheide anhand der ersten erkennbaren Priorität und nicht anhand des späteren Ergebnisses',
        'Wähle nur eine dominante Vorhersage',
      ],
    },
    predictionPrompt: 'Welche erste Priorität erwartest du nach diesem Puckgewinn?',
    predictionOptions: [
      {
        value: 'tempo',
        label: 'Tempo aufnehmen',
        description: 'Das Team versucht sofort, gegnerische Unordnung und freien Raum nach vorne zu nutzen.',
      },
      {
        value: 'kontrolle',
        label: 'Kontrolle sichern',
        description: 'Das Team stabilisiert zunächst Puckbesitz und eigene Ordnung.',
      },
      {
        value: 'vereinfachen',
        label: 'Vereinfachen',
        description: 'Das Team reduziert zunächst Risiko und spielt eine einfache oder sichernde Lösung.',
      },
      {
        value: 'keine_klare_aktion',
        label: 'Keine klare Anschlussaktion',
        description: 'Es entsteht weder eine erkennbare Beschleunigung noch eine kontrollierte Stabilisierung.',
      },
    ],
    confidence: {
      enabled: true,
      question: 'Wie sicher bist du?',
      options: [
        { value: 'low', label: 'Unsicher' },
        { value: 'medium', label: 'Eher sicher' },
        { value: 'high', label: 'Sehr sicher' },
      ],
    },
    resolution: {
      actualOutcomePrompt: 'Was ist tatsächlich passiert?',
      actualOutcomeOptions: [
        { value: 'tempo', label: 'Tempo aufgenommen' },
        { value: 'kontrolle', label: 'Kontrolle gesichert' },
        { value: 'vereinfachen', label: 'Vereinfacht' },
        { value: 'keine_klare_aktion', label: 'Keine klare Anschlussaktion' },
        { value: 'nicht_beurteilbar', label: 'Nicht beurteilbar' },
      ],
      evaluationPrompt: 'Wie gut passte deine Vorhersage?',
      evaluationOptions: [
        { value: 'correct', label: 'eingetroffen' },
        { value: 'partial', label: 'teilweise eingetroffen' },
        { value: 'incorrect', label: 'nicht eingetroffen' },
        { value: 'unjudgeable', label: 'nicht beurteilbar' },
      ],
      autoEvaluateExactMatches: true,
    },
    missedCue: {
      enabled: true,
      prompt: 'Welches Signal hast du übersehen oder anders gewichtet?',
      options: [
        { value: 'puck_position', label: 'Puckposition' },
        { value: 'pressure_angle', label: 'Druckwinkel des Gegners' },
        { value: 'support_position', label: 'Position der Unterstützung' },
        { value: 'open_space', label: 'Freier Raum' },
        { value: 'player_orientation', label: 'Körper- und Schlägerorientierung' },
        { value: 'team_structure', label: 'Teamstruktur' },
        { value: 'other', label: 'Anderes Signal' },
      ],
    },
    note: {
      enabled: true,
      label: 'Notiz (optional)',
      placeholder: 'Kurze Beobachtung zur Situation',
      maxChars: 240,
    },
    minimumResolvedPredictions: 3,
    activeFocus: {
      title: 'Active Focus',
      text: 'Beobachte im weiteren Spiel, ob die gewählte Entscheidungslogik bestehen bleibt oder sich mit Druckhöhe und Spielsituation verändert.',
    },
  },
]

export function getPredictionTemplateById(templateId?: string | null): PredictionTemplate | undefined {
  if (!templateId) return undefined
  return predictionTemplates.find((template) => template.id === templateId)
}
