import { calculatePercentagePointDifference } from '../opportunityRate/rateLogic'
import type { EvidenceSampleSummary } from '../evidenceAssessment/types'
import type { EvidenceSynthesisCase } from './types'

function observed(
  aLabel: string,
  aCount: number,
  aTotal: number,
  bLabel: string,
  bCount: number,
  bTotal: number,
) {
  return {
    labelA: aLabel,
    countA: aCount,
    totalA: aTotal,
    rateA: aTotal > 0 ? aCount / aTotal : 0,
    labelB: bLabel,
    countB: bCount,
    totalB: bTotal,
    rateB: bTotal > 0 ? bCount / bTotal : 0,
  }
}

function sampleFromObserved(
  data: ReturnType<typeof observed>,
  extras: Partial<EvidenceSampleSummary> = {},
): EvidenceSampleSummary {
  return {
    sourceType: extras.sourceType || 'cohort_compare',
    sampleSize: (data.totalA || 0) + (data.totalB || 0),
    groupSizes: [data.totalA || 0, data.totalB || 0],
    groupLabels: [data.labelA || 'Gruppe A', data.labelB || 'Gruppe B'],
    targetCounts: [data.countA || 0, data.countB || 0],
    rates: [data.rateA || 0, data.rateB || 0],
    differencePercentagePoints: calculatePercentagePointDifference(data.rateA || 0, data.rateB || 0),
    ...extras,
  }
}

const supportObserved = observed('Mit Support', 6, 9, 'Ohne Support', 2, 8)
const thinObserved = observed('Gruppe A', 5, 9, 'Gruppe B', 4, 8)
const solidObserved = observed('Gruppe A', 12, 20, 'Gruppe B', 4, 20)

export const DEFAULT_SYNTHESIS_CASES: EvidenceSynthesisCase[] = [
  {
    id: 'support_exits',
    title: 'Support und kontrollierte Exits',
    question: 'Treten kontrollierte Exits häufiger auf, wenn Weak-Side-Support vorhanden ist?',
    observedData: supportObserved,
    evidenceInput: sampleFromObserved(supportObserved, {
      sourceType: 'conditional_compare',
      conditionLabel: 'Weak-Side-Support vorhanden',
      targetLabel: 'kontrollierter Exit',
      comparability: 'mostly_comparable',
      counterexampleCount: 2,
      matrix: {
        presentTarget: 6,
        presentOther: 3,
        absentTarget: 2,
        absentOther: 6,
        conditionUnclear: 0,
        outcomeUnclear: 0,
        presentOutcomeUnclear: 0,
        absentOutcomeUnclear: 0,
      },
    }),
    evidenceStrengthHint: 'reasonably_supported',
    limitations: [
      'Kleine Stichprobe',
      'Forecheckdruck war nicht immer gleich',
      'Zwei kontrollierte Exits ohne Support',
    ],
    counterEvidence: [
      '2 kontrollierte Exits gelangen ohne Support',
      'Kein klares Gegenbeispiel',
    ],
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'Stichprobe: 17 Exit-Versuche.',
      'Vergleichbarkeit: überwiegend vergleichbar.',
      'Gegenbeispiele: 2 kontrollierte Exits ohne Support.',
      'Mögliche weitere Dimension: Forecheckdruck war nicht immer gleich.',
    ],
    descriptiveOptions: [
      { value: 'fractions', label: '6 von 9 Exits mit Support waren kontrolliert, 2 von 8 ohne Support.' },
      { value: 'rates', label: 'Mit Support 67 %, ohne Support 25 % – in dieser Stichprobe.' },
    ],
    claimExamples: [
      { level: 'description', text: '6 von 9 Exits mit Support waren kontrolliert.' },
      { level: 'comparison', text: 'In dieser Stichprobe war die Controlled-Exit-Rate mit Support höher.' },
      { level: 'tendency', text: 'Die Beobachtungen geben einen Hinweis darauf, dass kontrollierte Exits bei vorhandenem Support häufiger auftreten.' },
      { level: 'generalization', text: 'Das Team erzielt mit Support grundsätzlich bessere Exits.' },
      { level: 'causal', text: 'Weak-Side-Support verursacht erfolgreiche Exits.' },
    ],
    ceilingFeedback: {
      description: 'Sauber deskriptiv. Der sichtbare Abstand darf zusätzlich als Vergleich oder vorsichtiger Hinweis formuliert werden.',
      comparison: 'Plausibel: Du bleibst bei der Stichprobe und behauptest keine Teamregel.',
      tendency: 'Level 3 ist hier plausibel: Die Differenz ist sichtbar, aber Stichprobe und Kontext reichen nicht für eine allgemeine Teamregel.',
      generalization: 'Eine allgemeine Teamregel braucht deutlich mehr und sauberer vergleichbare Beobachtungen.',
      causal: 'Ursache ist durch den beobachteten Zusammenhang nicht gedeckt.',
    },
  },
  {
    id: 'thin_overlap',
    title: 'Kleiner Abstand, widersprüchliche Basis',
    question: 'Unterscheidet sich die Zielereignis-Rate zwischen Gruppe A und Gruppe B klar?',
    observedData: thinObserved,
    evidenceInput: sampleFromObserved(thinObserved, {
      comparability: 'partly_comparable',
      counterexampleCount: 4,
    }),
    evidenceStrengthHint: 'weak',
    limitations: [
      'Kein klarer Unterschied',
      'Teilweise schlechte Vergleichbarkeit',
      'Mehrere Gegenbeispiele',
      'Kleine Stichprobe',
    ],
    counterEvidence: [
      'Mehrere Zielereignis-Fälle in beiden Gruppen',
      'Der Abstand beträgt nur wenige Prozentpunkte',
      'Kein klares Gegenbeispiel',
    ],
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'A: 5 / 9 · 56 %. B: 4 / 8 · 50 %.',
      'Mehrere Gegenbeispiele, Vergleichbarkeit nur teilweise.',
      'Nicht jedes Stichprobe braucht eine Tendenz.',
    ],
    descriptiveOptions: [
      { value: 'fractions', label: '5 von 9 in Gruppe A, 4 von 8 in Gruppe B.' },
      { value: 'close', label: 'Die Raten liegen nah beieinander (56 % und 50 %).' },
    ],
    claimExamples: [
      { level: 'description', text: 'Gruppe A: 5/9, Gruppe B: 4/8.' },
      { level: 'comparison', text: 'In dieser Stichprobe lag die Rate in Gruppe A geringfügig höher.' },
      { level: 'tendency', text: 'Es gibt einen Hinweis, dass Gruppe A häufiger das Zielereignis erreicht.' },
      { level: 'generalization', text: 'Gruppe A ist grundsätzlich stärker.' },
      { level: 'causal', text: 'Der Gruppenfaktor verursacht das bessere Ergebnis.' },
    ],
    ceilingFeedback: {
      description: 'Passt: Bei diesem Abstand reicht oft die Beschreibung.',
      comparison: 'Ein sehr vorsichtiger Vergleich ist noch vertretbar – mehr nicht.',
      tendency: 'Eine Tendenz überzieht hier leicht. Der Abstand ist klein und die Basis widersprüchlich.',
      generalization: 'Eine Generalisierung ist durch dieses Stichprobe nicht gedeckt.',
      causal: 'Ursache ist hier nicht gedeckt.',
    },
  },
  {
    id: 'clear_gap',
    title: 'Klarer Abstand, gleiche Gruppengröße',
    question: 'Tritt das Zielereignis in Gruppe A häufiger auf als in Gruppe B?',
    observedData: solidObserved,
    evidenceInput: sampleFromObserved(solidObserved, {
      comparability: 'very_comparable',
      counterexampleCount: 4,
    }),
    evidenceStrengthHint: 'reasonably_supported',
    limitations: [
      'Immer noch eine Stichprobe, keine Saisonregel',
      'Vier Zielereignis-Fälle in Gruppe B',
      'Keine Video- oder Kausalprüfung',
    ],
    counterEvidence: [
      '4 Zielereignis-Fälle in Gruppe B',
      'Kein klares Gegenbeispiel',
    ],
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'A: 12 / 20 · 60 %. B: 4 / 20 · 20 %.',
      'Gleich große Gruppen, vergleichsweise klare Differenz.',
      'Ursache bleibt trotzdem nicht gedeckt.',
    ],
    descriptiveOptions: [
      { value: 'fractions', label: '12 von 20 in Gruppe A, 4 von 20 in Gruppe B.' },
      { value: 'gap', label: 'In dieser Stichprobe 60 % gegenüber 20 %.' },
    ],
    claimExamples: [
      { level: 'description', text: '12 von 20 Ausgangssituationen in Gruppe A endeten als Zielereignis.' },
      { level: 'comparison', text: 'In dieser Stichprobe trat das Zielereignis in Gruppe A deutlich häufiger auf.' },
      { level: 'tendency', text: 'Die Beobachtungen geben einen Hinweis auf eine höhere Zielereignis-Rate in Gruppe A.' },
      { level: 'generalization', text: 'Gruppe A ist grundsätzlich besser.' },
      { level: 'causal', text: 'Faktor A verursacht das bessere Ergebnis.' },
    ],
    ceilingFeedback: {
      description: 'Korrekt, aber der Abstand darf auch als Vergleich oder Hinweis formuliert werden.',
      comparison: 'Plausibel und stichprobengebunden.',
      tendency: 'Ein vorsichtiger Hinweis ist hier vertretbar. Eine Ursache bleibt ungedeckt.',
      generalization: '„Grundsätzlich“ geht über diese eine Stichprobe hinaus.',
      causal: 'Auch bei klarem Abstand bleibt Ursache ungedeckt.',
    },
  },
]
