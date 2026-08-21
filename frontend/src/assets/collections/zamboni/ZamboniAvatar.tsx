import { ZamboniMark } from './ZamboniMark'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function ZamboniAvatar({ decorative = true, className, title = 'RT-81' }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      <rect width="128" height="128" rx="16" fill="#0B0F15" />
      <circle cx="64" cy="64" r="52" fill="none" stroke="#00E5FF" strokeWidth="2.4" opacity="0.55" />
      <circle cx="64" cy="72" r="34" fill="#00E5FF" opacity="0.08" />
      <g transform="translate(-8,18) scale(0.6)">
        <ZamboniMark />
      </g>
    </svg>
  )
}
