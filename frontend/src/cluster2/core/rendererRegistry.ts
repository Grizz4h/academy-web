import type { Cluster2ModuleType, Cluster2RendererComponent } from './types'
import { ClickableRinkRenderer } from '../renderers/clickable-rink/ClickableRinkRenderer'
import { SingleChoiceRenderer } from '../renderers/single-choice/SingleChoiceRenderer'
import { TextNoteRenderer } from '../renderers/text-note/TextNoteRenderer'

export const rendererRegistry: Record<Cluster2ModuleType, Cluster2RendererComponent> = {
  clickable_rink: ClickableRinkRenderer,
  single_choice: SingleChoiceRenderer,
  text_note: TextNoteRenderer,
}