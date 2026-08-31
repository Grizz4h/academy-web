import { OFF_THE_RINK_SUBTITLE, OFF_THE_RINK_TITLE } from './types'

export type OffTheRinkDocumentMeta = {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article'
}

const META: Array<{
  attr: 'name' | 'property'
  key: string
  field: keyof OffTheRinkDocumentMeta | 'imageFallback'
}> = [
  { attr: 'name', key: 'description', field: 'description' },
  { attr: 'property', key: 'og:title', field: 'title' },
  { attr: 'property', key: 'og:description', field: 'description' },
  { attr: 'property', key: 'og:url', field: 'url' },
  { attr: 'property', key: 'og:type', field: 'type' },
  { attr: 'property', key: 'og:image', field: 'imageFallback' },
  { attr: 'name', key: 'twitter:title', field: 'title' },
  { attr: 'name', key: 'twitter:description', field: 'description' },
  { attr: 'name', key: 'twitter:image', field: 'imageFallback' },
]

function readMeta(attr: 'name' | 'property', key: string): HTMLMetaElement | null {
  return document.querySelector(`meta[${attr}="${key}"]`)
}

/** Updates existing index.html tags for this page only; restores on cleanup. */
export function applyOffTheRinkDocumentMeta(meta: OffTheRinkDocumentMeta): () => void {
  if (typeof document === 'undefined') return () => {}

  const previousTitle = document.title
  document.title = meta.title

  const fallbackImage =
    meta.image ||
    `${typeof window !== 'undefined' ? window.location.origin : ''}/RINK_TANK_LOGO_v2.png`

  const restorers: Array<() => void> = []

  for (const item of META) {
    const el = readMeta(item.attr, item.key)
    if (!el) continue
    const previous = el.getAttribute('content')
    const value =
      item.field === 'imageFallback'
        ? fallbackImage
        : item.field === 'type'
          ? (meta.type ?? 'website')
          : String(meta[item.field] ?? '')
    el.setAttribute('content', value)
    restorers.push(() => {
      if (previous == null) el.removeAttribute('content')
      else el.setAttribute('content', previous)
    })
  }

  return () => {
    document.title = previousTitle
    restorers.forEach((restore) => restore())
  }
}

export function hubDocumentMeta(url: string): OffTheRinkDocumentMeta {
  return {
    title: `${OFF_THE_RINK_TITLE} · rInQ Tank`,
    description: OFF_THE_RINK_SUBTITLE,
    url,
    type: 'website',
  }
}

export function columnDocumentMeta(
  title: string,
  description: string,
  url: string,
  image?: string,
): OffTheRinkDocumentMeta {
  return {
    title: `${title} · ${OFF_THE_RINK_TITLE}`,
    description,
    url,
    image,
    type: 'article',
  }
}
