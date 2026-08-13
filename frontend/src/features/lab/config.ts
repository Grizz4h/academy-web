import type { LabModuleConfig, PredictionTemplate } from './types'
import {
  PREDICTION_CUE_OPTIONS,
  PREDICTION_READ_ASSESSMENT_OPTIONS,
  PRESSURE_RESOLUTION_OPTIONS,
  PRESSURE_SOURCE_OPTIONS,
  PRESSURE_WINDOW_OPTIONS,
  PUCK_CARRIER_SOLUTION_GROUPS,
  PUCK_CARRIER_SOLUTION_OPTIONS,
  SUPPORT_STATE_OPTIONS,
} from './taxonomies'

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
export const PRED_PRESSURE_CARRIER_SOLUTION = 'pressure_carrier_solution'

const pressureCarrierSolutionTemplate: PredictionTemplate = {
  id: PRED_PRESSURE_CARRIER_SOLUTION,
  categoryId: 'pressure_solution',
  title: 'Wie löst der Puckführer den Druck?',
  shortTitle: 'Drucklösung',
  description:
    'Lies Druck, Support und Raum, bevor der Puckführer entscheidet – und sage seine wahrscheinlichste Lösung voraus.',
  learningGoal:
    'Reale Optionen unter Druck früh erkennen und daraus eine begründete Vorhersage ableiten.',
  relatedAcademyDrills: ['B2_D1', 'B2_D2'],
  perspective: 'selected_team',
  perspectiveHint:
    'Beobachte einen Puckführer des ausgewählten Teams, der erkennbar unter Druck gerät und noch einen kurzen Entscheidungsmoment besitzt.',
  situationTrigger:
    'Suche eine Situation, in der ein Puckführer erkennbar unter Druck gerät und noch mindestens einen kurzen Entscheidungsmoment besitzt.',
  situationGuide: [
    'Defender bekommt im Breakout Druck',
    'Puckführer wird an der Bande angelaufen',
    'Center erhält Puck mit Gegner im Rücken',
    'Spieler erreicht Blue Line unter Druck',
    'Puckführer wird nach Turnover sofort attackiert',
    'Spieler erhält Pass und muss vor Zugriff reagieren',
    'Retrieval unter Forecheckdruck',
  ],
  observationGuide: {
    suitableSituations: [
      'Defender bekommt beim Breakout Forecheckdruck',
      'Puckführer wird an der Bande geschlossen',
      'Center nimmt Pass unter Druck an',
      'Spieler nähert sich unter Druck einer Blue Line',
      'Retrieval mit Gegner direkt im Rücken',
      'Turnover → sofortiger gegnerischer Zugriff',
    ],
    unsuitableSituations: [
      'völlig freier Puckführer',
      'bereits laufender Zweikampf ohne echte Wahl',
      'Loose Puck / 50/50 ohne klare Kontrolle',
      'sofortiger Körperkontakt ohne Entscheidungsmöglichkeit',
      'bereits verlorener Puck',
      'abgeschlossene Aktion',
    ],
    whenToPredict: [
      'Predicte die Entscheidung, bevor sie sichtbar wird.',
      'Lies zuerst Optionen – nicht den späteren Erfolg.',
    ],
    howToDecide: [
      'Lies Druckquelle, Zeitfenster und Support, bevor du eine Lösung vorhersagst.',
      'Begründe die Prediction mit einem sichtbaren Hinweis, nicht nur mit dem späteren Outcome.',
    ],
    ignore: [
      'Ob die Entscheidung später gut oder schlecht war',
      'Ob der Pass ankommt oder die Aktion erfolgreich endet',
      'Welche Lösung du selbst gewählt hättest',
    ],
  },
  coreHints: [
    'Predicte die Entscheidung, bevor sie sichtbar wird.',
    'Lies zuerst Optionen – nicht den späteren Erfolg.',
  ],
  observationStartLabel: 'Drucksituation einordnen',
  observationStartPrompt:
    'Suche eine Situation, in der ein Puckführer erkennbar unter Druck gerät und noch mindestens einen kurzen Entscheidungsmoment besitzt.',
  nextSituationLabel: '+ Nächste Drucksituation',
  lockLabel: 'Prediction festlegen',
  lockedStatusLabel: 'Prediction gespeichert',
  captureGameClock: true,
  recommendedPredictions: 5,
  contextFields: [
    {
      id: 'pressureSource',
      prompt: 'Woher kommt der Hauptdruck?',
      required: true,
      options: PRESSURE_SOURCE_OPTIONS,
    },
    {
      id: 'pressureWindow',
      prompt: 'Wie viel Zeit scheint dem Puckführer zu bleiben?',
      required: true,
      options: PRESSURE_WINDOW_OPTIONS,
    },
    {
      id: 'supportState',
      prompt: 'Wie sieht der Support aus?',
      required: true,
      options: SUPPORT_STATE_OPTIONS,
    },
  ],
  predictionPrompt: 'Was wird der Puckführer tun?',
  predictionOptions: PUCK_CARRIER_SOLUTION_OPTIONS,
  optionGroups: PUCK_CARRIER_SOLUTION_GROUPS,
  cueField: {
    id: 'predictionCue',
    prompt: 'Welcher Hinweis war für deine Vorhersage am wichtigsten?',
    required: true,
    maxSelect: 2,
    options: PREDICTION_CUE_OPTIONS,
  },
  confidence: {
    enabled: true,
    question: 'Wie sicher bist du dir?',
    options: [
      { value: 'low', label: 'niedrig' },
      { value: 'medium', label: 'mittel' },
      { value: 'high', label: 'hoch' },
    ],
  },
  resolution: {
    actualOutcomePrompt: 'Was hat der Puckführer tatsächlich gemacht?',
    actualOutcomeOptions: PUCK_CARRIER_SOLUTION_OPTIONS,
    evaluationPrompt: 'Prediction vs Reality',
    evaluationOptions: [
      { value: 'correct', label: 'exakt getroffen' },
      { value: 'incorrect', label: 'anders gelöst' },
      { value: 'unjudgeable', label: 'nicht auswertbar' },
    ],
    autoEvaluateExactMatches: true,
    compareMode: 'exact',
    hideManualEvaluation: true,
    unjudgeableActualValues: ['unclear'],
    outcomeField: {
      id: 'pressureResolution',
      prompt: 'Wurde der unmittelbare Druck dadurch gelöst?',
      required: false,
      options: PRESSURE_RESOLUTION_OPTIONS,
    },
    reflectionField: {
      id: 'readAssessment',
      prompt: 'Was hast du vor der Entscheidung übersehen oder richtig gelesen?',
      required: false,
      maxSelect: 2,
      options: PREDICTION_READ_ASSESSMENT_OPTIONS,
    },
    alternativeSolutionField: {
      id: 'alternativeSolution',
      prompt: 'Welche andere Lösung war ebenfalls realistisch?',
      required: false,
      options: PUCK_CARRIER_SOLUTION_OPTIONS,
    },
  },
  note: {
    enabled: true,
    label: 'Kurze Notiz',
    placeholder: 'Optional: ein Satz zur Situation',
    maxChars: 240,
  },
  minimumResolvedPredictions: 3,
  activeFocus: {
    title: 'Active Focus',
    text: 'Achte beim nächsten Puckführer schon vor der Aktion auf Körperstellung, Support und Pressure Angle.',
  },
  reflectionGuidance: [
    'Prüfe, ob die Prediction auf sichtbaren Hinweisen wie Support, Druckwinkel, Körperstellung oder Raum basiert.',
    'Unterscheide Prediction Accuracy von Qualität oder Erfolg der tatsächlichen Aktion.',
    'Weise darauf hin, wenn aus dem späteren Outcome rückwirkend auf die Qualität der Prediction geschlossen wird.',
    'Hilf dem Nutzer zu erkennen, welche Pre-Decision-Cues er häufiger beachten sollte.',
    'Behaupte nicht, welche Entscheidung objektiv richtig gewesen wäre, wenn die Session dafür keine ausreichenden Informationen liefert.',
  ],
}

export const predictionTemplates: PredictionTemplate[] = [
  pressureCarrierSolutionTemplate,
  {
    id: PRED_TRANSITION_AFTER_POSSESSION_GAIN,
    categoryId: 'transition',
    title: 'Was folgt nach dem Puckgewinn?',
    shortTitle: 'Puckgewinn',
    description:
      'Beobachte kontrollierte Puckgewinne des ausgewählten Teams und sage voraus, welche erste Priorität in den nächsten zwei bis drei Sekunden sichtbar wird.',
    learningGoal:
      'Die erste erkennbare Priorität nach einem kontrollierten Puckgewinn vorhersagen – nicht den späteren Angriffserfolg.',
    relatedAcademyDrills: ['B2_D4'],
    perspective: 'selected_team',
    perspectiveHint:
      'Beobachte immer einen Puckgewinn des ausgewählten Teams. Wenn Augsburg als beobachtetes Team ausgewählt ist, gibst du deine Vorhersage in dem Moment ab, in dem Augsburg den Puck erkennbar gewinnt oder kontrolliert übernimmt.',
    situationTrigger: 'Kontrollierter Puckgewinn des ausgewählten Teams',
    observationStartLabel: 'Prediction abgeben',
    observationStartPrompt: 'Warte auf einen kontrollierten Puckgewinn des ausgewählten Teams.',
    nextSituationLabel: '+ Nächste Situation',
    lockLabel: 'Prediction festlegen',
    lockedStatusLabel: 'Prediction gespeichert',
    captureGameClock: true,
    recommendedPredictions: 5,
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
    coreHints: [
      'Predicte die Entscheidung, bevor sie sichtbar wird.',
      'Bewerte die erste Priorität, nicht den späteren Erfolg.',
    ],
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
      compareMode: 'manual',
      unjudgeableActualValues: ['nicht_beurteilbar'],
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
