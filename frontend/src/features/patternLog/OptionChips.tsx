import type { PatternLogOption } from './types'

type OptionChipsProps<T extends string> = {
  name: string
  options: PatternLogOption<T>[]
  value?: string
  selectedValues?: string[]
  onChange: (next: T | T[]) => void
  multi?: boolean
}

export function OptionChips<T extends string>({
  name,
  options,
  value,
  onChange,
  multi = false,
  selectedValues,
}: OptionChipsProps<T>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {options.map((opt) => {
        const checked = multi
          ? (selectedValues || []).includes(opt.value)
          : value === opt.value
        return (
          <label
            key={`${name}-${opt.value}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              minHeight: '44px',
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              border: checked ? '1px solid rgba(45,212,191,0.55)' : '1px solid rgba(148,163,184,0.22)',
              background: checked ? 'rgba(20,184,166,0.14)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
            }}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => {
                if (!multi) {
                  onChange(opt.value)
                  return
                }
                const current = selectedValues || []
                const next = current.includes(opt.value)
                  ? current.filter((item) => item !== opt.value)
                  : [...current, opt.value]
                onChange(next as T[])
              }}
              style={{ marginTop: '0.2rem', width: '1.05rem', height: '1.05rem', flexShrink: 0 }}
            />
            <span style={{ display: 'grid', gap: '0.15rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 650, color: '#f1f5f9', lineHeight: 1.25 }}>
                {opt.label}
              </span>
              {opt.description && (
                <span style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.65)', lineHeight: 1.35 }}>
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}
