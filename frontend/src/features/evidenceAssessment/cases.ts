import { calculatePercentagePointDifference } from '../opportunityRate/rateLogic'
import type { EvidenceCaseDefinition, EvidenceSampleSummary } from './types'

function cohortSample(
  aTarget: number,
  aTotal: number,
  bTarget: number,
  bTotal: number,
  labels: [string, string] = ['Gruppe A', 'Gruppe B'],
): EvidenceSampleSummary {
  const rateA = aTotal > 0 ? aTarget / aTotal : 0
  const rateB = bTotal > 0 ? bTarget / bTotal : 0
  return {
    sourceType: 'cohort_compare',
    sampleSize: aTotal + bTotal,
    groupSizes: [aTotal, bTotal],
    groupLabels: labels,
    targetCounts: [aTarget, bTarget],
    rates: [rateA, rateB],
    differencePercentagePoints: calculatePercentagePointDifference(rateA, rateB),
  }
}

export const DEFAULT_EVIDENCE_CASES: EvidenceCaseDefinition[] = [
  {
    id: 'thin_sample',
    title: 'Großer Unterschied, winziges Stichprobe',
    statement: 'Kontrollierte Exits gelingen mit Weak-Side-Support deutlich häufiger.',
    intendedLearningFocus: 'sample',
    sample: cohortSample(2, 3, 0, 2, ['Mit Support', 'Ohne Support']),
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'Nur fünf Ausgangssituationen insgesamt. Gruppe B hat zwei Fälle.',
    ],
    statements: [
      {
        id: 'a',
        text: 'In dieser Stichprobe trat das Zielereignis mit Support häufiger auf – die Basis ist aber sehr klein.',
        tone: 'sample_bound',
      },
      {
        id: 'b',
        text: 'Mit Support ist das Team grundsätzlich besser im Exit.',
        tone: 'overclaim',
      },
      {
        id: 'c',
        text: 'Der Unterschied beweist, dass Support kontrollierte Exits verursacht.',
        tone: 'causal',
      },
      {
        id: 'd',
        text: 'Es gibt keinen Unterschied.',
        tone: 'denial',
      },
    ],
    supportedStatementId: 'a',
    feedback: {
      strongly_supported: 'Der Unterschied ist groß, aber nur fünf Ausgangssituationen reichen, damit einzelne Situationen die Rate stark verändern. Eine vorsichtigere Einordnung wäre sinnvoll.',
      reasonably_supported: 'Der Unterschied ist sichtbar, die Stichprobe bleibt aber sehr dünn. „Ordentlich gestützt“ überzieht die Basis leicht.',
      suggestive: 'Passt: Der Unterschied ist sichtbar, die Stichprobe bleibt aber sehr dünn.',
      weak: 'Vorsichtig und nachvollziehbar – bei fünf Fällen trägt die Zahl wenig.',
      insufficient: 'Nachvollziehbar: Für eine belastbare Aussage ist die Basis zu klein.',
      unclear: 'Unklar ist ehrlich, wenn dir die dünne Basis keine Richtung gibt.',
    },
  },
  {
    id: 'small_difference',
    title: 'Größeres Stichprobe, kleiner Unterschied',
    statement: 'Gruppe A hat eine höhere Zielereignis-Rate als Gruppe B.',
    intendedLearningFocus: 'difference',
    sample: cohortSample(11, 20, 10, 20, ['Gruppe A', 'Gruppe B']),
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'Beide Gruppen sind gleich groß. Der Abstand beträgt wenige Prozentpunkte.',
    ],
    statements: [
      {
        id: 'a',
        text: 'In dieser Stichprobe lagen die Raten nur wenige Prozentpunkte auseinander.',
        tone: 'sample_bound',
      },
      {
        id: 'b',
        text: 'Gruppe A ist klar überlegen.',
        tone: 'overclaim',
      },
      {
        id: 'c',
        text: 'Das größere Stichprobe beweist, dass Gruppe A das Ergebnis verursacht.',
        tone: 'causal',
      },
      {
        id: 'd',
        text: 'Es gibt keinen Unterschied.',
        tone: 'denial',
      },
    ],
    supportedStatementId: 'a',
    feedback: {
      strongly_supported: 'Viele Beobachtungen erzeugen nicht automatisch einen interessanten Unterschied. Der Abstand bleibt klein.',
      reasonably_supported: 'Die Basis ist größer, der Unterschied aber gering. Eine zurückhaltendere Gesamteinordnung passt besser.',
      suggestive: 'Ein kleiner Abstand kann ein Hinweis sein – mehr nicht.',
      weak: 'Passt: Viele Fälle, aber wenig Differenz.',
      insufficient: 'Nachvollziehbar, wenn dir fünf Prozentpunkte zu wenig sind.',
      unclear: 'Unklar ist vertretbar, wenn der Abstand für dich nicht lesbar ist.',
    },
  },
  {
    id: 'poor_comparability',
    title: 'Deutlicher Unterschied, schlechte Vergleichbarkeit',
    statement: 'Mit Support gelingen kontrollierte Exits häufiger.',
    intendedLearningFocus: 'comparability',
    sample: {
      ...cohortSample(7, 10, 2, 9, ['Mit Support', 'Ohne Support']),
      sourceType: 'conditional_compare',
      conditionLabel: 'Weak-Side-Support vorhanden',
      targetLabel: 'kontrollierter Exit',
      counterexampleCount: 2,
      matrix: {
        presentTarget: 7,
        presentOther: 3,
        absentTarget: 2,
        absentOther: 7,
        conditionUnclear: 0,
        outcomeUnclear: 0,
        presentOutcomeUnclear: 0,
        absentOutcomeUnclear: 0,
      },
    },
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'Mit Support: meist geringer Forecheckdruck.',
      'Ohne Support: meist hoher Forecheckdruck.',
      'Die Gruppen unterscheiden sich in mehr als einer relevanten Dimension.',
    ],
    statements: [
      {
        id: 'a',
        text: 'In dieser Stichprobe trat das Zielereignis mit Support häufiger auf; die Situationen waren aber möglicherweise nicht vergleichbar.',
        tone: 'sample_bound',
      },
      {
        id: 'b',
        text: 'Support macht Exits erfolgreicher.',
        tone: 'overclaim',
      },
      {
        id: 'c',
        text: 'Support verursacht bessere Breakouts.',
        tone: 'causal',
      },
      {
        id: 'd',
        text: 'Es gibt keinen Unterschied.',
        tone: 'denial',
      },
    ],
    supportedStatementId: 'a',
    feedback: {
      strongly_supported: 'Der Unterschied ist sichtbar, aber die Gruppen unterscheiden sich auch im Druck. Das schwächt, wie weit die Aussage trägt.',
      reasonably_supported: 'Der Abstand ist da – die schlechte Vergleichbarkeit begrenzt, wie fest du dich darauf stützen kannst.',
      suggestive: 'Passt: Ein Muster ist sichtbar, aber eine zweite Dimension läuft mit.',
      weak: 'Nachvollziehbar, wenn dir die vermischten Bedingungen die Aussage nehmen.',
      insufficient: 'Nachvollziehbar: Ohne vergleichbare Situationen trägt der Unterschied wenig.',
      unclear: 'Unklar ist ehrlich, wenn du Support und Druck nicht trennen kannst.',
    },
  },
  {
    id: 'solid_picture',
    title: 'Konsistentes Stichprobenbild',
    statement: 'In Gruppe A trat das Zielereignis häufiger auf als in Gruppe B.',
    intendedLearningFocus: 'difference',
    sample: {
      ...cohortSample(12, 20, 4, 20, ['Vergleichsgruppe A', 'Vergleichsgruppe B']),
      counterexampleCount: 4,
    },
    contextNotes: [
      'Übungsfall – kein echtes Spiel.',
      'Gleich große Vergleichsgruppen, klarer Abstand, Ausgangssituation und Ergebnis sind gleich definiert.',
      'Trotzdem: nur Stichprobe, keine Kausalität. Auch die höchste Kategorie bleibt auf die Stichprobe begrenzt.',
    ],
    statements: [
      {
        id: 'a',
        text: 'In dieser Stichprobe trat das Zielereignis in Vergleichsgruppe A deutlich häufiger auf.',
        tone: 'sample_bound',
      },
      {
        id: 'b',
        text: 'Gruppe A ist grundsätzlich besser.',
        tone: 'overclaim',
      },
      {
        id: 'c',
        text: 'Der Unterschied beweist, dass Faktor A das Ergebnis verursacht.',
        tone: 'causal',
      },
      {
        id: 'd',
        text: 'Es gibt keinen Unterschied.',
        tone: 'denial',
      },
    ],
    supportedStatementId: 'a',
    feedback: {
      strongly_supported: 'Das Stichprobenbild ist konsistent. „Konsistentes Bild innerhalb dieser Stichprobe“ bleibt trotzdem keine Ursache und keine wissenschaftliche Sicherheit.',
      reasonably_supported: 'Passt: Die Basis ist vergleichsweise sauber, die Aussage bleibt ein deskriptiver Hinweis in dieser Stichprobe.',
      suggestive: 'Zurückhaltend – bei diesem Bild wäre auch „deskriptiver Hinweis“ oder „konsistentes Stichprobenbild“ vertretbar.',
      weak: 'Sehr vorsichtig. Der Abstand ist in der Stichprobe deutlich, die Basis aber immer noch klein.',
      insufficient: 'Für „nicht beurteilbar“ ist das Bild ungewöhnlich vorsichtig – die Aussage bleibt trotzdem nur eine Stichprobe.',
      unclear: '„Nicht beurteilbar“ ist möglich, wenn dir eine Dimension fehlt. Die Zahlen allein entscheiden das nicht.',
    },
  },
]
