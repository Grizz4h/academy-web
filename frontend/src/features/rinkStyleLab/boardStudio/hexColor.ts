/**
 * Shared `#RRGGBB` validation / normalization (S269 / S271).
 * Defense in depth for Tank + Player Visual fills — not arbitrary CSS.
 */

const HEX_RRGGBB = /^#([0-9A-Fa-f]{6})$/;

/**
 * Accept only `#RRGGBB` (optional surrounding whitespace).
 * Normalizes to uppercase `#RRGGBB`. Invalid → undefined.
 */
export function normalizeHexRrggbb(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  const match = HEX_RRGGBB.exec(trimmed);
  if (!match) {
    return undefined;
  }
  return `#${match[1]!.toUpperCase()}`;
}
