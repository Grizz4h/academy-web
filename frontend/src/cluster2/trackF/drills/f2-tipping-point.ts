import type { Cluster2Drill } from '../../core/types'

export const f2TippingPointDrill: Cluster2Drill = {
  drillId: 'F2',
  title: 'F2 - Kipppunkt lokalisieren',
  trackId: 'F',
  clusterId: 2,
  modules: [
    {
      moduleId: 'f2_rink',
      type: 'clickable_rink',
      prompt: 'Markiere den Bereich, in dem die Situation kippt.',
      required: true,
      config: {
        mode: 'single',
      },
    },
    {
      moduleId: 'f2_reason_type',
      type: 'single_choice',
      prompt: 'Was ist der Hauptgrund?',
      required: true,
      config: {
        options: ['Druck', 'Abstand', 'fehlender Support'],
      },
    },
    {
      moduleId: 'f2_reason_note',
      type: 'text_note',
      prompt: 'Kurze Begruendung',
      required: true,
      config: {
        placeholder: 'z. B. Gegner kommt frei durch Mitte',
      },
    },
  ],
}