import { ZamboniMark } from './ZamboniMark'

type ArtProps = {
  decorative?: boolean
  className?: string
  title?: string
}

export function ZamboniEmblem({ decorative = true, className, title = 'Ice Crew' }: ArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      <circle cx="48" cy="48" r="44" fill="#0B0F15" stroke="#FF007A" strokeWidth="4" />
      <circle cx="48" cy="48" r="36" fill="none" stroke="#00E5FF" strokeWidth="1.4" opacity="0.55" />
      <g transform="translate(-10,16) scale(0.48)">
        <ZamboniMark />
      </g>
    </svg>
  )
}
