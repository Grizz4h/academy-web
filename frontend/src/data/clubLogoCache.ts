const CACHE_NAME = 'rinq-club-logos-v1'
const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const memory = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

function persistKey(logicalSrc: string): string {
  return `https://club-logo.cache${logicalSrc}`
}

/** Sync hit from this tab — avoids Kürzel-flash on remount. */
export function peekClubLogoObjectUrl(logicalSrc: string | null | undefined): string | null {
  const key = String(logicalSrc || '').trim()
  if (!key) return null
  return memory.get(key) ?? null
}

async function readPersisted(logicalSrc: string): Promise<Blob | null> {
  try {
    if (typeof caches === 'undefined') return null
    const cache = await caches.open(CACHE_NAME)
    const hit = await cache.match(persistKey(logicalSrc))
    if (!hit) return null
    const cachedAt = Number(hit.headers.get('X-Cached-At') || 0)
    if (cachedAt && Date.now() - cachedAt > PERSIST_MAX_AGE_MS) {
      await cache.delete(persistKey(logicalSrc))
      return null
    }
    return hit.blob()
  } catch {
    return null
  }
}

async function writePersisted(logicalSrc: string, blob: Blob): Promise<void> {
  try {
    if (typeof caches === 'undefined') return
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      persistKey(logicalSrc),
      new Response(blob, {
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
          'X-Cached-At': String(Date.now()),
        },
      }),
    )
  } catch {
    // Private mode / quota — memory cache still works.
  }
}

export function getOrLoadClubLogo(
  logicalSrc: string,
  loader: () => Promise<Blob>,
): Promise<string> {
  const key = logicalSrc.trim()
  const hit = memory.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending

  const promise = (async () => {
    const persisted = await readPersisted(key)
    const blob = persisted ?? await loader()
    if (!persisted) await writePersisted(key, blob)
    const objectUrl = URL.createObjectURL(blob)
    const previous = memory.get(key)
    memory.set(key, objectUrl)
    if (previous && previous !== objectUrl) URL.revokeObjectURL(previous)
    return objectUrl
  })()

  inflight.set(key, promise)
  return promise.finally(() => {
    inflight.delete(key)
  })
}

/** Drop memory + Cache Storage (logout / auth reset). */
export async function clearClubLogoCache(): Promise<void> {
  for (const url of memory.values()) URL.revokeObjectURL(url)
  memory.clear()
  inflight.clear()
  try {
    if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME)
  } catch {
    // ignore
  }
}
