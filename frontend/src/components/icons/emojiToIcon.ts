import type { RinQIconName } from './types'

/** Migration map: legacy emoji string → branded icon name. */
export const EMOJI_TO_RINQ_ICON: Record<string, RinQIconName> = {
  '👀': 'observe',
  '🧠': 'learn',
  '💡': 'terms',
  '🎯': 'mission',
  '🏆': 'trophy',
  '🎬': 'scene',
  '🎉': 'celebrate',
  '🔄': 'continue',
  '🗑': 'delete',
  '🗑️': 'delete',
  '🛒': 'shop',
  '⚡': 'bolt',
  '🧭': 'compass',
  '🧩': 'puzzle',
  '🛠': 'tools',
  '🛠️': 'tools',
  '🏟️': 'arena',
  '🏠': 'home',
  '🎟️': 'ticket',
  '🧊': 'ice',
  '🤖': 'ai',
  '🔒': 'lock',
  '🎨': 'palette',
  '🪙': 'coin',
  '🗂️': 'folder',
  '🎞️': 'film',
  '📖': 'book',
  '🚌': 'bus',
  '⚙️': 'gear',
  '🧲': 'magnet',
  '✓': 'check',
  '✏': 'edit',
  '✏️': 'edit',
  '✕': 'close',
  '👁️': 'eye',
  '👁️‍🗨️': 'eyeOff',
  '★': 'star',
  '☆': 'starOutline',
  '✦': 'star',
}

export function resolveIconFromEmoji(value: string): RinQIconName | null {
  const trimmed = (value || '').trim()
  return EMOJI_TO_RINQ_ICON[trimmed] ?? null
}
