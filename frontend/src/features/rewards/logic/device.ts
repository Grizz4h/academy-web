import type { DeviceType } from '../types'

export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'

  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches

  return isMobileViewport || hasCoarsePointer ? 'mobile' : 'desktop'
}
