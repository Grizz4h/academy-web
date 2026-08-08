import type { CSSProperties } from 'react'
import type { ProfileAsset, ProfileAssetKind } from '../../data/profile/types'
import styles from './ProfileAssetSelector.module.css'

type ProfileAssetSelectorProps = {
  type: ProfileAssetKind
  items: ProfileAsset[]
  selectedId?: string | null
  onSelect: (id: string) => void
  columns?: number
}

export default function ProfileAssetSelector({
  type,
  items,
  selectedId,
  onSelect,
  columns,
}: ProfileAssetSelectorProps) {
  const aspect = type === 'banner' ? 'banner' : type === 'emblem' ? 'emblem' : 'avatar'

  return (
    <div
      className={styles.grid}
      data-type={type}
      style={columns ? ({ ['--cols']: columns } as CSSProperties) : undefined}
      role="listbox"
      aria-label={`${type} auswählen`}
    >
      {items.map((item) => {
        const selected = item.id === selectedId
        const locked = !!item.locked
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={locked}
            className={`${styles.item} ${styles[aspect]} ${selected ? styles.selected : ''} ${locked ? styles.locked : ''}`}
            onClick={() => {
              if (!locked) onSelect(item.id)
            }}
            title={item.label}
          >
            <span className={styles.preview}>
              <img src={item.src} alt="" />
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
