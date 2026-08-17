import { VENUE_CATALOG } from '../../data/venues'
import type { VenueVisit } from '../../data/venues/types'
import styles from './ArenaPassportList.module.css'

export default function ArenaPassportList({ visits = {} }: { visits?: Record<string, VenueVisit> }) {
  const rows = VENUE_CATALOG.filter((venue) => venue.enabled)
  const done = rows.filter((venue) => (visits[venue.id]?.verifiedGameIds || []).length > 0).length
  return (
    <div className={styles.wrap}>
      <p className={styles.count}>
        {done} / {rows.length}
      </p>
      <ul className={styles.list}>
        {rows.map((venue) => {
          const visit = visits[venue.id]
          const checked = Boolean(visit?.verifiedGameIds?.length)
          return (
            <li key={venue.id} data-done={checked ? 'true' : 'false'}>
              <span>{checked ? '✓' : '□'}</span>
              <strong>{venue.name}</strong>
              {venue.dataQuality === 'missing' || venue.dataQuality === 'suspicious' ? (
                <em>Koordinaten fehlen</em>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
