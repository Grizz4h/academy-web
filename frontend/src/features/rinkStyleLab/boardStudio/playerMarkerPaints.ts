/**
 * Vendored from Board Studio — see ../SOURCE.md.
 */

/**
 * Rendering-only paints for the compound Player marker (S082).
 * Derived shades are not persisted — they come from authored PlayerColor.
 */

import type { PlayerRenderAppearance } from "./playerRenderAppearance.ts";
import { STYLE_LAB_STICK_COLOR } from "../globalPlayerDisplay.ts";

export interface PlayerMarkerPaints {
  jersey: string;
  jerseyDark: string;
  jerseyLight: string;
  outline: string;
  trim: string;
  helmet: string;
  helmetVisor: string;
  helmetHighlight: string;
  stick: string;
  stickOutline: string;
  /** Goalie pad face — light for ice contrast (render-only). */
  padFill: string;
  /** Goalie blocker face — slightly darker than pads. */
  blockerFill: string;
  labelFill: string;
  selectionHalo: string;
}

/** Near-black outline for readability on bright ice. */
const MARKER_OUTLINE = "#152033";
/** Style Lab stick fill — cool mid gray (geometry unchanged). */
const STICK_FILL = STYLE_LAB_STICK_COLOR;
const SELECTION_HALO = "#111111";
const TRIM_LIGHT = "rgba(255, 255, 255, 0.55)";
const HIGHLIGHT = "rgba(255, 255, 255, 0.45)";
/** Neutral goalie pad face — readable at full-rink scale. */
const PAD_FILL = "#e8eef4";
const BLOCKER_FILL = "#d5dde6";

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) {
    return null;
  }
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** factor &lt; 1 darkens, &gt; 1 lightens. Falls back to input if not hex. */
export function adjustHexTone(hex: string, factor: number): string {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }
  return toHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

/**
 * Map shared Player appearance → marker paints.
 * Jersey uses authored fill; secondary tones are render-only.
 */
export function derivePlayerMarkerPaints(
  appearance: PlayerRenderAppearance,
): PlayerMarkerPaints {
  const jersey = appearance.fill;
  return {
    jersey,
    jerseyDark: adjustHexTone(jersey, 0.72),
    jerseyLight: adjustHexTone(jersey, 1.18),
    outline: MARKER_OUTLINE,
    trim: TRIM_LIGHT,
    helmet: jersey,
    helmetVisor: adjustHexTone(jersey, 0.55),
    helmetHighlight: HIGHLIGHT,
    stick: STICK_FILL,
    stickOutline: adjustHexTone(STICK_FILL, 0.72),
    padFill: PAD_FILL,
    blockerFill: BLOCKER_FILL,
    labelFill: appearance.labelFill,
    selectionHalo: SELECTION_HALO,
  };
}
