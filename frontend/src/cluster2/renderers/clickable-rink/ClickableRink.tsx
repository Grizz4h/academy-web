import './ClickableRink.css'

const ZONES = [
  { id: 'dz-left', label: 'DZ L', x: 20, y: 20, width: 170, height: 110 },
  { id: 'dz-center', label: 'DZ C', x: 20, y: 130, width: 170, height: 140 },
  { id: 'dz-right', label: 'DZ R', x: 20, y: 270, width: 170, height: 110 },
  { id: 'nz-left', label: 'NZ L', x: 190, y: 20, width: 170, height: 110 },
  { id: 'nz-center', label: 'NZ C', x: 190, y: 130, width: 170, height: 140 },
  { id: 'nz-right', label: 'NZ R', x: 190, y: 270, width: 170, height: 110 },
  { id: 'oz-left', label: 'OZ L', x: 360, y: 20, width: 170, height: 110 },
  { id: 'oz-center', label: 'OZ C', x: 360, y: 130, width: 170, height: 140 },
  { id: 'oz-right', label: 'OZ R', x: 360, y: 270, width: 170, height: 110 },
] as const

export type ClickableRinkMode = 'single' | 'multiple'

interface ClickableRinkProps {
  mode: ClickableRinkMode
  selectedZones: string[]
  onChange: (value: { selectedZones: string[] }) => void
}

export function ClickableRink({ mode, selectedZones, onChange }: ClickableRinkProps) {
  const handleZoneClick = (zoneId: string) => {
    const isSelected = selectedZones.includes(zoneId)

    if (mode === 'single') {
      onChange({ selectedZones: isSelected ? [] : [zoneId] })
      return
    }

    const nextZones = isSelected
      ? selectedZones.filter((zone) => zone !== zoneId)
      : [...selectedZones, zoneId]

    onChange({ selectedZones: nextZones })
  }

  return (
    <div className="cluster2-rink">
      <svg className="cluster2-rink__surface" viewBox="0 0 550 400" role="img" aria-label="Klickbare Eisfläche mit 9 Zonen">
        <rect className="cluster2-rink__frame" x="10" y="10" width="520" height="380" rx="48" ry="48" />
        <line className="cluster2-rink__line--blue" x1="190" y1="20" x2="190" y2="380" />
        <line className="cluster2-rink__line--red" x1="275" y1="20" x2="275" y2="380" />
        <line className="cluster2-rink__line--blue" x1="360" y1="20" x2="360" y2="380" />

        {ZONES.map((zone) => {
          const selected = selectedZones.includes(zone.id)
          return (
            <g key={zone.id} onClick={() => handleZoneClick(zone.id)}>
              <rect
                className={selected ? 'cluster2-rink__zone cluster2-rink__zone--selected' : 'cluster2-rink__zone'}
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx="18"
                ry="18"
              />
              <text className="cluster2-rink__label" x={zone.x + zone.width / 2} y={zone.y + zone.height / 2 + 5}>
                {zone.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="cluster2-rink__legend">
        <span>{mode === 'single' ? 'Modus: eine Zone auswählen' : 'Modus: mehrere Zonen toggeln'}</span>
        <span>Auswahl: {selectedZones.length > 0 ? selectedZones.join(', ') : 'keine'}</span>
      </div>
    </div>
  )
}