/** Route patterns: exact `/path` or prefix `/path/*`. */

export function matchRoute(pathname: string, pattern?: string): boolean {
  if (!pattern) return true
  const path = normalizePath(pathname)
  const rule = normalizePath(pattern)
  if (rule.endsWith('/*')) {
    const prefix = rule.slice(0, -2)
    return path === prefix || path.startsWith(`${prefix}/`)
  }
  return path === rule
}

export function isWildcardRoute(pattern?: string): boolean {
  return Boolean(pattern?.endsWith('/*'))
}

function normalizePath(value: string): string {
  if (!value) return '/'
  const trimmed = value.split('?')[0].split('#')[0]
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1)
  return trimmed || '/'
}
