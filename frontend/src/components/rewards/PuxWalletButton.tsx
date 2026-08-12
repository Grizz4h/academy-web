import { useEffect, useId, useRef, useState } from 'react'
import { DISPLAY_CURRENCY_LABEL, formatPux, useRewards } from '../../features/rewards'
import { AnchoredPopover, UiButtonLink } from '../ui'
import { selectNextShopTarget, selectRecentPuxActivity } from './puxWalletHelpers'
import styles from './PuxWalletButton.module.css'

function formatActivityDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function PuxWalletButton() {
  const { rewardState } = useRewards()
  const balance = rewardState.currency.PUX || 0
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const recentActivity = selectRecentPuxActivity(rewardState, 5)
  const nextShop = selectNextShopTarget(rewardState)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={`${DISPLAY_CURRENCY_LABEL}: ${balance}. Wallet öffnen`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((value) => !value)
        }}
      >
        {formatPux(balance)}
      </button>

      <AnchoredPopover
        ref={popoverRef}
        open={open}
        anchorRef={triggerRef}
        id={panelId}
        ariaLabel="PUX Wallet"
        className={styles.popup}
        preferredWidth={300}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.popupHeader}>
          <div className={styles.balanceBlock}>
            <p className={styles.balanceLabel}>{DISPLAY_CURRENCY_LABEL}</p>
            <p className={styles.balanceValue}>{balance.toLocaleString('de-DE')}</p>
          </div>
          <button
            type="button"
            className={styles.popupClose}
            aria-label="Schließen"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
            }}
          >
            ×
          </button>
        </div>

        <p className={styles.summary}>
          Belohnungswährung für Sessions, Achievements und den Locker-Shop. Trainieren, sammeln, ausgeben.
        </p>

        {recentActivity.length > 0 ? (
          <>
            <p className={styles.sectionLabel}>Zuletzt</p>
            <ul className={styles.activityList}>
              {recentActivity.map((line) => (
                <li key={line.id} className={styles.activityItem}>
                  <span className={styles.activityLabel}>
                    {line.label}
                    {line.occurredAt ? ` · ${formatActivityDate(line.occurredAt)}` : ''}
                  </span>
                  <span className={styles.activityAmount} data-direction={line.direction}>
                    {line.direction === 'in' ? '+' : '−'}
                    {line.amount}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.emptyHint}>
            Noch keine PUX-Bewegungen — starte eine Session oder schalte ein Achievement frei.
          </p>
        )}

        {nextShop && (
          <div className={styles.shopTeaser}>
            <p className={styles.shopTeaserTitle}>
              {nextShop.affordable ? 'Als Nächstes im Shop' : 'Nächstes Shop-Ziel'}
            </p>
            <p className={styles.shopTeaserMeta}>
              {nextShop.name} · {nextShop.pricePux} PUX
              {!nextShop.affordable && nextShop.missingPux > 0
                ? ` · noch ${nextShop.missingPux} fehlen`
                : ''}
            </p>
          </div>
        )}

        <div className={styles.actions}>
          <UiButtonLink
            to="/locker"
            variant="primary"
            size="sm"
            className={styles.actionLink}
            onClick={() => setOpen(false)}
          >
            Zum Locker
          </UiButtonLink>
          <UiButtonLink
            to="/progress"
            variant="secondary"
            size="sm"
            className={styles.actionLink}
            onClick={() => setOpen(false)}
          >
            Belohnungen
          </UiButtonLink>
        </div>
      </AnchoredPopover>
    </span>
  )
}
