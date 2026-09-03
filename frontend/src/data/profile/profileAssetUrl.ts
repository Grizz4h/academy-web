/**
 * Profile SVGs under /public/profile are not content-hashed.
 * Nginx previously applied `immutable` even to 404s; browsers then kept
 * broken-image responses for days. Bump this when assets appear/change so
 * clients bypass a poisoned cache without clearing site data.
 */
export const PROFILE_ASSET_CACHE_BUST = '20260904c'

/** Ensure `src` carries a stable cache-bust query (preserves existing `?v=`). */
export function withProfileAssetCacheBust(src: string): string {
  if (!src || src.includes('://') || src.startsWith('data:')) return src
  const q = src.indexOf('?')
  const path = q >= 0 ? src.slice(0, q) : src
  const params = new URLSearchParams(q >= 0 ? src.slice(q + 1) : '')
  if (!params.has('v')) params.set('v', PROFILE_ASSET_CACHE_BUST)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
