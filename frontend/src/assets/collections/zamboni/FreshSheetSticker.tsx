import { ZamboniMark } from './ZamboniMark'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function FreshSheetSticker({ decorative = true, className, title = 'Fresh Sheet' }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      <rect x="8" y="8" width="80" height="80" rx="16" fill="#0B0F15" stroke="#00E5FF" strokeWidth="3" />
      <ellipse cx="48" cy="58" rx="28" ry="16" fill="#00E5FF" opacity="0.16" />
      <path d="M22 60 C36 52 56 52 74 58" fill="none" stroke="#E6F6FF" strokeWidth="4" opacity="0.45" />
      <g transform="translate(4,22) scale(0.36)">
        <ZamboniMark />
      </g>
    </svg>
  )
}
