import type { Cluster2Drill } from '../../core/types'

export const f3FirstPassOptionDrill: Cluster2Drill = {
  drillId: 'F3',
  title: 'F3 - Erste Passoption im Raum',
  trackId: 'F',
  clusterId: 2,
  modules: [
    {
      moduleId: 'f3_rink',
      type: 'clickable_rink',
      prompt: 'Markiere den Zielraum der ersten sinnvollen Passoption.',
      required: true,
      config: {
        mode: 'single',
      },
    },
    {
      moduleId: 'f3_option_quality',
      type: 'single_choice',
      prompt: 'Wie war diese Option?',
      required: true,
      config: {
        options: ['klar', 'unter Druck', 'Notloesung'],
      },
    },
    {
      moduleId: 'f3_option_note',
      type: 'text_note',
      prompt: 'Kurze Begruendung',
      required: true,
      config: {
        placeholder: 'z. B. Winger eng gedeckt',
      },
    },
  ],
}