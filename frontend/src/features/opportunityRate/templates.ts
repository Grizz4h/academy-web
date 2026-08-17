import type { RateDefinition, RateTemplate } from './types'

function outcomes(
  items: Array<{ id: string; label: string; description?: string }>,
): RateDefinition['outcomes'] {
  return items
}

export const RATE_TEMPLATES: RateTemplate[] = [
  {
    id: 'entries',
    title: 'Zone Entries',
    description: 'Von allen Entry-Versuchen: Wie viele waren kontrolliert?',
    definition: {
      templateId: 'entries',
      opportunityLabel: 'gegnerische Zone-Entry-Versuche',
      targetEventLabel: 'kontrollierter Entry mit Puckbesitz',
      outcomes: outcomes([
        { id: 'controlled', label: 'Kontrollierter Entry' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'turnover', label: 'Turnover' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled',
    },
  },
  {
    id: 'exits',
    title: 'Breakouts / Exits',
    description: 'Von allen Exit-Versuchen: Wie viele gelangen kontrolliert?',
    definition: {
      templateId: 'exits',
      opportunityLabel: 'Exit-Versuche',
      targetEventLabel: 'kontrollierter Exit',
      outcomes: outcomes([
        { id: 'controlled_exit', label: 'Kontrollierter Exit' },
        { id: 'clear', label: 'Clear' },
        { id: 'turnover', label: 'Turnover' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled_exit',
    },
  },
  {
    id: 'pp_entries',
    title: 'Powerplay Entries',
    description: 'Von allen PP-Entry-Versuchen: Wie viele führten zu kontrolliertem Zonenbesitz?',
    definition: {
      templateId: 'pp_entries',
      opportunityLabel: 'Powerplay-Entry-Versuche',
      targetEventLabel: 'kontrollierter Zonenbesitz',
      outcomes: outcomes([
        { id: 'controlled_possession', label: 'Kontrollierter Zonenbesitz' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'failed', label: 'Gescheitert / Turnover' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'controlled_possession',
    },
  },
  {
    id: 'entry_stops',
    title: 'Defensive Entry Stops',
    description: 'Von allen gegnerischen Entry-Versuchen: Wie oft wurde der Entry früh gestoppt?',
    definition: {
      templateId: 'entry_stops',
      opportunityLabel: 'gegnerische Entry-Versuche',
      targetEventLabel: 'früher Entry-Stop',
      outcomes: outcomes([
        { id: 'early_stop', label: 'Früher Stop' },
        { id: 'late_stop', label: 'Später Stop / tiefer' },
        { id: 'entry_allowed', label: 'Entry zugelassen' },
        { id: 'unclear', label: 'Unklar' },
      ]),
      targetOutcomeId: 'early_stop',
    },
  },
]

export const RATE_TEMPLATE_BY_ID: Record<string, RateTemplate> = Object.fromEntries(
  RATE_TEMPLATES.map((item) => [item.id, item]),
)
