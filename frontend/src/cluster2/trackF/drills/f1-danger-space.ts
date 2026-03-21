import type { Cluster2Drill } from '../../core/types'

export const f1DangerSpaceDrill: Cluster2Drill = {
  drillId: 'F1',
  title: 'F1 - Gefahrenraum erkennen',
  trackId: 'F',
  clusterId: 2,
  modules: [
    {
      moduleId: 'f1_rink',
      type: 'clickable_rink',
      prompt: 'Markiere den gefaehrlichsten Raum in dieser Situation.',
      required: true,
      config: {
        mode: 'single',
      },
    },
    {
      moduleId: 'f1_space_state',
      type: 'single_choice',
      prompt: 'Wie wirkt dieser Raum?',
      required: true,
      config: {
        options: ['offen', 'halb gedeckt', 'geschlossen'],
      },
    },
    {
      moduleId: 'f1_reason',
      type: 'text_note',
      prompt: 'Kurze Begruendung',
      required: true,
      config: {
        placeholder: 'z. B. Slot nicht besetzt',
      },
    },
  ],
}