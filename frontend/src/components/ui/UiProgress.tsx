type UiProgressProps = {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  complete?: boolean
  className?: string
  label?: string
}

/** Shared progress track. `value` 0–max (default 100). */
export function UiProgress({ value, max = 100, size = 'md', complete = false, className, label }: UiProgressProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  const sizeClass = size === 'sm' ? 'ui-progress--sm' : size === 'lg' ? 'ui-progress--lg' : ''
  const isComplete = complete || (max > 0 && value >= max)
  return (
    <div
      className={['ui-progress', sizeClass, isComplete && 'is-complete', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <div className="ui-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
