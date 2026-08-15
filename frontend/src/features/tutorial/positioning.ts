const COMPACT_MAX_HEIGHT = 200
const PAGE_BAND_HEIGHT = 168
const GAP = 12

export function getNavInset(): number {
  if (typeof document === 'undefined') return 72
  const nav = document.querySelector<HTMLElement>('[data-top-nav="true"]')
  if (!nav) return 72
  const bottom = nav.getBoundingClientRect().bottom
  return Math.max(56, Math.ceil(bottom) + GAP)
}

export function getTutorialAnchorRect(el: HTMLElement): DOMRect {
  const raw = el.getBoundingClientRect()
  const navInset = getNavInset()
  const viewTop = navInset
  const viewBottom = window.innerHeight - GAP
  const left = Math.max(GAP, raw.left)
  const right = Math.min(window.innerWidth - GAP, raw.right)
  const width = Math.max(48, right - left)

  // Only crop true page-sized wrappers. Never slice a rink or card in half.
  if (raw.height > window.innerHeight * 0.85) {
    const top = Math.max(raw.top, viewTop)
    const height = Math.min(PAGE_BAND_HEIGHT, Math.max(64, viewBottom - top))
    return new DOMRect(left, top, width, height)
  }

  return new DOMRect(raw.left, raw.top, raw.width, raw.height)
}

export function isCompactTarget(rect: DOMRect): boolean {
  return rect.height <= COMPACT_MAX_HEIGHT && rect.width < window.innerWidth * 0.92
}

/** Keep the sheet off real bottom CTAs like Lektion starten / Session abschließen. */
export function shouldLiftMobileSheet(rect: DOMRect): boolean {
  return rect.bottom > window.innerHeight * 0.5
}

export function getFloatingPadding(navInset = getNavInset()) {
  return {
    top: navInset,
    bottom: 16,
    left: 16,
    right: 16,
  }
}
