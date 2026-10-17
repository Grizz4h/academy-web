import type { FoundationRinkRegionId } from './types'

export type IceHalf = 'top' | 'bottom'

/** Map a tapped ice half to the region id used by evaluate/feedback. */
export function regionForIceHalf(
  half: IceHalf,
  weakSideBand: IceHalf,
): 'weak_side' | 'puck_side' {
  return half === weakSideBand ? 'weak_side' : 'puck_side'
}

/** Visible weak-side fill — only after selection / correct highlight, never as a spoiler. */
export function shouldShowWeakSideOverlay(
  selectedRegion: FoundationRinkRegionId | null | undefined,
  highlightRegions: readonly FoundationRinkRegionId[],
): boolean {
  return selectedRegion === 'weak_side' || highlightRegions.includes('weak_side')
}

/**
 * Invisible half-ice hitboxes exist whenever the step asks for weak_side,
 * independent of overlay visibility.
 */
export function shouldRenderWeakSideHitboxes(
  interactiveRegions: readonly FoundationRinkRegionId[],
  opts: { disabled?: boolean; hasHandler?: boolean } = {},
): boolean {
  if (opts.disabled) return false
  if (opts.hasHandler === false) return false
  return interactiveRegions.includes('weak_side')
}

/**
 * Weak-side steps expose both halves (correct + puck side) and skip zone distractors
 * so zone rects cannot swallow half-ice taps.
 */
export function buildIdentifyInteractiveRegions(
  correctRegions: readonly FoundationRinkRegionId[] | undefined,
  showMarkers: readonly FoundationRinkRegionId[] | undefined,
  learningTapRegions: readonly FoundationRinkRegionId[],
): FoundationRinkRegionId[] {
  const correct = correctRegions || []
  const markers = showMarkers || []
  if (correct.includes('weak_side')) {
    return Array.from(new Set<FoundationRinkRegionId>(['weak_side', 'puck_side', ...markers]))
  }
  return Array.from(new Set<FoundationRinkRegionId>([...correct, ...markers, ...learningTapRegions]))
}

export function isWeakSideAnswerCorrect(selected: FoundationRinkRegionId): boolean {
  return selected === 'weak_side'
}
