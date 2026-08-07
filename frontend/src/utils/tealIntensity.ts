/**
 * Shared teal/cyan intensity used by Dashboard drill accents and Stats team tiles.
 * Color family matches DrillPriorityCards (Recommended Next / Most Trained).
 */

export type TealRgb = { r: number; g: number; b: number };

/** Dashboard accent ramp (levels 0–3), identical to DrillPriorityCards.module.css. */
export const TEAL_ACCENT_LEVELS: readonly TealRgb[] = [
  { r: 60, g: 95, b: 120 }, // low energy / unexplored
  { r: 81, g: 145, b: 162 }, // soft cyan
  { r: 95, g: 185, b: 220 }, // electric blue
  { r: 95, g: 235, b: 225 }, // bright turquoise
] as const;

export const TEAL_INTENSITY_MAX = 10;

/**
 * Dashboard Recommended Next / Most Trained accent level.
 * Mapping must stay unchanged so Dashboard visuals do not shift.
 */
export function getDrillAccentLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count >= 2 && count <= 3) return 2;
  return 3;
}

/** Stats analysis intensity: 0 = neutral, 1–10 = teal strength, >10 caps at 10. */
export function getAnalysisIntensity(count: number): number {
  if (count <= 0) return 0;
  return Math.min(count, TEAL_INTENSITY_MAX);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(a: TealRgb, b: TealRgb, t: number): TealRgb {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

/**
 * Maps intensity 0–10 onto the dashboard teal ramp (levels 0→3).
 * Uses the existing four stop colors — no extra hardcoded palette.
 */
export function getTealRgbForIntensity(intensity: number): TealRgb {
  const levels = TEAL_ACCENT_LEVELS;
  if (intensity <= 0) return levels[0];

  const capped = Math.min(intensity, TEAL_INTENSITY_MAX);
  const position = (capped / TEAL_INTENSITY_MAX) * (levels.length - 1);
  const index = Math.floor(position);
  const next = Math.min(index + 1, levels.length - 1);
  const frac = position - index;
  return mixRgb(levels[index], levels[next], frac);
}

export function rgba(rgb: TealRgb, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export type TealTileSurfaceStyle = {
  background: string;
  borderColor: string;
  color: string;
};

/**
 * Full-tile teal wash for Stats team cards.
 * count 0 → null (caller keeps neutral card chrome)
 * count 1–10 → rising turquoise intensity from the shared ramp
 */
export function getTealTileSurfaceStyle(count: number): TealTileSurfaceStyle | null {
  const intensity = getAnalysisIntensity(count);
  if (intensity === 0) return null;

  const t = intensity / TEAL_INTENSITY_MAX;
  const rgb = getTealRgbForIntensity(intensity);

  // Subtle at low counts, clearly turquoise at the top — text stays light/readable.
  const bgAlpha = 0.07 + t * 0.22;
  const borderAlpha = 0.28 + t * 0.52;
  const textLift = 0.86 + t * 0.12;

  return {
    background: rgba(rgb, bgAlpha),
    borderColor: rgba(rgb, borderAlpha),
    color: `rgba(232, 246, 250, ${textLift})`,
  };
}
