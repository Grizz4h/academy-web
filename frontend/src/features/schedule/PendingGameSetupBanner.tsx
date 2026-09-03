import { TeamCrest } from '../../components/game/TeamCrest'
import { formatGameTimeLabel } from '../../components/game/gameCatalogUtils'
import { COMPETITION_CONFIGS } from '../../data/competitionConfig'
import { resolveGameTeamShortCode } from '../../data/teamShortCodes'
import { UiButton, UiSheet, UiSheetActions } from '../../components/ui'
import type { GameSetupPrefill } from './gameSetupPrefill'
import styles from './PendingGameSetupBanner.module.css'

type PendingGameSetupSheetProps = {
  open: boolean
  prefill: GameSetupPrefill
  focusLead?: string | null
  onConfirm: () => void
  onDismiss: () => void
}

export default function PendingGameSetupSheet({
  open,
  prefill,
  focusLead,
  onConfirm,
  onDismiss,
}: PendingGameSetupSheetProps) {
  const home = resolveGameTeamShortCode(prefill.teamHome, prefill.league, prefill.season)
  const away = resolveGameTeamShortCode(prefill.teamAway, prefill.league, prefill.season)
  const league = COMPETITION_CONFIGS[prefill.league]?.label || prefill.league.replace(/_/g, ' ')
  const time = formatGameTimeLabel(prefill.time, { omitSuffix: true, date: prefill.date })
  const matchday = prefill.competitionValue ? `Spieltag ${prefill.competitionValue}` : null
  const metaParts = [league, time || null, matchday, prefill.phaseLabel || null].filter(Boolean)

  return (
    <UiSheet
      open={open}
      onClose={onDismiss}
      title="Paarung vorausgewählt"
      meta={focusLead || 'Danach Modul wählen — Teams und Spieltag kommen mit.'}
      label="Vorausgewählte Paarung bestätigen"
    >
      <div className={styles.sheetBody}>
        <div className={styles.badge}>
          <TeamCrest name={prefill.teamHome} size="md" />
          <div className={styles.badgeCopy}>
            <p className={styles.badgeKicker}>Vorausgewählt</p>
            <p className={styles.badgePairing}>{home} – {away}</p>
            {metaParts.length > 0 ? (
              <p className={styles.badgeMeta}>{metaParts.join(' · ')}</p>
            ) : null}
          </div>
          <TeamCrest name={prefill.teamAway} size="md" />
        </div>
        <p className={styles.sheetLead}>
          Bestätigen und danach ein Modul starten.
        </p>
      </div>

      <UiSheetActions
        secondary={(
          <UiButton type="button" variant="ghost" size="sm" onClick={onDismiss}>
            Verwerfen
          </UiButton>
        )}
        primary={(
          <UiButton type="button" variant="primary" size="sm" onClick={onConfirm}>
            Bestätigen
          </UiButton>
        )}
      />
    </UiSheet>
  )
}
