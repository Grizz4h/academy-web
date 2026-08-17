import type { ConditionTemplate } from './types'

export const CONDITION_TEMPLATES: ConditionTemplate[] = [
  {
    id: 'weak_side_exit',
    title: 'Weak-Side Support → Exit',
    description: 'Gelingt ein kontrollierter Exit häufiger, wenn Weak-Side-Support vorhanden ist?',
    opportunityLabel: 'Exit-Versuche',
    conditionLabel: 'Weak-Side-Support vorhanden',
    targetEventLabel: 'kontrollierter Exit',
  },
  {
    id: 'forecheck_exit',
    title: 'Forecheckdruck → Exit',
    description: 'Gelingt ein kontrollierter Exit häufiger oder seltener, wenn starker Forecheckdruck vorhanden ist?',
    opportunityLabel: 'Exit-Versuche',
    conditionLabel: 'starker Forecheckdruck',
    targetEventLabel: 'kontrollierter Exit',
  },
  {
    id: 'support_entry',
    title: 'Support → Entry',
    description: 'Tritt ein kontrollierter Entry häufiger auf, wenn eine zweite Support-Ebene vorhanden ist?',
    opportunityLabel: 'Entry-Versuche',
    conditionLabel: 'zweite Support-Ebene vorhanden',
    targetEventLabel: 'kontrollierter Entry',
  },
  {
    id: 'gap_entry_stop',
    title: 'Defensive Gap → Entry Stop',
    description: 'Wird ein Entry häufiger früh gestoppt, wenn der Defender vor der Blue Line einen engen Gap hält?',
    opportunityLabel: 'gegnerische Entry-Versuche',
    conditionLabel: 'enger Gap vor der Blue Line',
    targetEventLabel: 'früher Entry-Stop',
  },
  {
    id: 'traffic_shot',
    title: 'Net-Front Traffic → Shot Through',
    description: 'Erreicht ein Abschluss häufiger das Tor, wenn Net-Front-Traffic vorhanden ist?',
    opportunityLabel: 'Abschlussversuche',
    conditionLabel: 'Net-Front-Traffic vorhanden',
    targetEventLabel: 'Shot through to the net',
  },
  {
    id: 'f1_turnover',
    title: 'Early F1 Pressure → Turnover',
    description: 'Entsteht häufiger ein Turnover, wenn F1 früh Druck erzeugt?',
    opportunityLabel: 'gegnerische Puckführungs-Situationen',
    conditionLabel: 'F1 erzeugt frühen Druck',
    targetEventLabel: 'Turnover',
  },
]
