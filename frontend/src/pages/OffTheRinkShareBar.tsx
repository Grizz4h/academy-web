import { useState, type ReactNode } from 'react'
import {
  UiActionRow,
  UiButton,
  buttonClassName,
  type UiButtonSize,
  type UiButtonVariant,
} from '../components/ui'
import { shareOrCopy, type SharePayload } from '../utils/share'
import styles from './OffTheRink.module.css'

function MailLink({
  href,
  variant,
  size,
  children,
}: {
  href: string
  variant?: UiButtonVariant
  size?: UiButtonSize
  children: ReactNode
}) {
  return (
    <a className={buttonClassName({ variant, size })} href={href}>
      {children}
    </a>
  )
}

export function OffTheRinkShareBar({
  share,
  mailto,
}: {
  share: SharePayload
  mailto: string
}) {
  const [note, setNote] = useState('')

  return (
    <div className={styles.shareBar}>
      <UiActionRow>
        <UiButton
          type="button"
          onClick={async () => {
            try {
              const result = await shareOrCopy(share)
              setNote(result === 'shared' ? 'Geteilt.' : 'Link kopiert.')
            } catch {
              // user cancelled native share
            }
          }}
        >
          Teilen
        </UiButton>
        <MailLink href={mailto}>An Christoph schreiben</MailLink>
      </UiActionRow>
      {note ? (
        <p className={styles.shareNote} role="status">
          {note}
        </p>
      ) : null}
    </div>
  )
}
