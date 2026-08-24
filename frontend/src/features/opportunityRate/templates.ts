import type { RateDefinition, RateTemplate } from './types'

function outcomes(
  items: Array<{ id: string; label: string; description?: string }>,
): RateDefinition['outcomes'] {
  return items
}

export const RATE_TEMPLATES: RateTemplate[] = [
  {
    id: 'entries',
    title: 'Zoneneintritte',
    description: 'Von allen Zoneneintritts-Versuchen: Wie viele waren kontrolliert?',
    definition: {
      templateId: 'entries',
      opportunityLabel: 'Versuche, die gegnerische Zone zu betreten',
      targetEventLabel: 'kontrollierter Zoneneintritt mit Puckbesitz',
      situationStart: 'Angreifendes Team trägt den Puck über oder an die blaue Linie der Angriffszone.',
      situationEnd: 'Puckbesitz in der Zone, Dump/Chip, Turnover oder Abbruch des Versuchs ist erkennbar.',
      inclusionRules: 'Jeder klare Eintrittsversuch zählt, unabhängig vom Ergebnis.',
      exclusionRules: 'Kein Versuch (Puck bereits in Zone); reiner Linienwechsel ohne Eintrittsabsicht; nicht erkennbar.',
      otherOutcomesNote: 'Puck tief spielen / Chip und Turnover sind andere eindeutige Ergebnisse, kein Zielereignis.',
      unclearOutcomeNote: 'Ergebnis nicht sicher klassifizierbar (Bild/Winkel) — separat, nicht als Misserfolg.',
      boundaryExamples: 'Puck springt an der blauen Linie — wenn Eintrittsversuch erkennbar, einschließen; sonst ausschließen.',
      outcomes: outcomes([
        { id: 'controlled', label: 'Kontrollierter Zoneneintritt' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'turnover', label: 'Puckverlust' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled',
    },
  },
  {
    id: 'exits',
    title: 'Zonenaustritte',
    description: 'Von allen Zonenaustritts-Versuchen: Wie viele gelangen kontrolliert?',
    definition: {
      templateId: 'exits',
      opportunityLabel: 'Versuche, die eigene Zone zu verlassen',
      targetEventLabel: 'kontrollierter Zonenaustritt',
      situationStart: 'Verteidigendes Team startet einen erkennbaren Austrittsversuch aus der eigenen Zone.',
      situationEnd: 'Kontrollierter Austritt, Clear, Puckverlust oder Abbruch ist erkennbar.',
      inclusionRules: 'Jeder klare Austrittsversuch zählt, unabhängig vom Ergebnis.',
      exclusionRules: 'Kein Austrittsversuch; Puck bereits außerhalb; Situation nicht erkennbar.',
      otherOutcomesNote: 'Clear und Puckverlust sind andere eindeutige Ergebnisse.',
      unclearOutcomeNote: 'Ergebnis nicht sicher klassifizierbar — separat ausweisen.',
      boundaryExamples: 'Soft dump hinter die blaue Linie ohne Kontrolle: Clear, nicht kontrollierter Austritt.',
      outcomes: outcomes([
        { id: 'controlled_exit', label: 'Kontrollierter Zonenaustritt' },
        { id: 'clear', label: 'Clear' },
        { id: 'turnover', label: 'Puckverlust' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled_exit',
    },
  },
  {
    id: 'pp_entries',
    title: 'Überzahl-Zoneneintritte',
    description: 'Von allen Überzahl-Zoneneintritts-Versuchen: Wie viele führten zu kontrolliertem Zonenbesitz?',
    definition: {
      templateId: 'pp_entries',
      opportunityLabel: 'Überzahl-Versuche, die Angriffszone zu betreten',
      targetEventLabel: 'kontrollierter Zonenbesitz',
      situationStart: 'Überzahl-Team beginnt einen erkennbaren Eintrittsversuch.',
      situationEnd: 'Kontrollierter Besitz, Dump/Chip, Scheitern/Turnover oder Abbruch.',
      inclusionRules: 'Nur während erkennbarer Überzahl; jeder klare Eintrittsversuch.',
      exclusionRules: 'Keine Überzahl; kein Eintrittsversuch; nicht erkennbar.',
      otherOutcomesNote: 'Puck tief spielen / Chip und gescheiterter Versuch sind andere eindeutige Ergebnisse.',
      unclearOutcomeNote: 'Ergebnis nicht sicher klassifizierbar — separat, nicht als Misserfolg.',
      boundaryExamples: 'Eintritt gelingt, Besitz geht sofort verloren: je nach Definition oft nicht „kontrollierter Zonenbesitz“.',
      outcomes: outcomes([
        { id: 'controlled_possession', label: 'Kontrollierter Zonenbesitz' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'failed', label: 'Gescheitert / Puckverlust' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled_possession',
    },
  },
  {
    id: 'entry_stops',
    title: 'Defensive Verhinderung eines Zoneneintritts',
    description: 'Von allen gegnerischen Zoneneintritts-Versuchen: Wie oft wurde der Eintritt früh gestoppt?',
    definition: {
      templateId: 'entry_stops',
      opportunityLabel: 'gegnerische Zoneneintritts-Versuche',
      targetEventLabel: 'früher Stop des Zoneneintritts',
      situationStart: 'Gegner startet einen erkennbaren Eintrittsversuch gegen das beobachtete Team.',
      situationEnd: 'Früher Stop, später Stop, zugelassener Eintritt oder Abbruch erkennbar.',
      inclusionRules: 'Jeder klare gegnerische Eintrittsversuch zählt.',
      exclusionRules: 'Kein Eintrittsversuch; eigenes Team im Angriff; nicht erkennbar.',
      otherOutcomesNote: 'Später Stop und zugelassener Eintritt sind andere eindeutige Ergebnisse.',
      unclearOutcomeNote: 'Ergebnis nicht sicher klassifizierbar — separat ausweisen.',
      boundaryExamples: 'Druck an der blauen Linie ohne klaren Stop: eher unklar oder später Stop — vorher festlegen.',
      outcomes: outcomes([
        { id: 'early_stop', label: 'Früher Stop' },
        { id: 'late_stop', label: 'Später Stop / tiefer' },
        { id: 'entry_allowed', label: 'Zoneneintritt zugelassen' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'early_stop',
    },
  },
]

export const RATE_TEMPLATE_BY_ID: Record<string, RateTemplate> = Object.fromEntries(
  RATE_TEMPLATES.map((item) => [item.id, item]),
)
