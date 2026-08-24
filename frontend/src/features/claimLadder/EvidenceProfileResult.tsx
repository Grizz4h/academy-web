import { formatRatePercent } from '../opportunityRate/rateLogic'
import { evidenceStrengthOptions } from '../evidenceAssessment/evidenceLogic'
import { claimLevelLabel } from './claimLogic'
import type { EvidenceProfile } from './types'
import styles from './EvidenceProfileResult.module.css'

type Props = {
  profile: EvidenceProfile
  compact?: boolean
}

export function EvidenceProfileResult({ profile, compact = false }: Props) {
  const evidenceLabel = evidenceStrengthOptions().find((item) => item.value === profile.evidenceStrength)?.label
  const groups = profile.sampleSummary.groups || []

  if (compact) {
    const a = groups[0]
    const b = groups[1]
    return (
      <div className={styles.preview} aria-label="Aussagenprofil Vorschau">
        <div>{profile.sampleSummary.total} Beobachtungen</div>
        {a && b && (
          <div>
            {formatRatePercent(a.rate)} % ↔ {formatRatePercent(b.rate)} %
          </div>
        )}
        <div>Tragfähigkeit: {evidenceLabel || profile.evidenceStrength}</div>
        <div>Aussagestufe: {claimLevelLabel(profile.maxClaimLevel)}</div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Aussagenprofil</h3>
      <span className={styles.badge}>Höchstens vertretbare Aussage · {claimLevelLabel(profile.maxClaimLevel)}</span>
      <div className={styles.block}>
        <div className={styles.label}>Frage</div>
        <p className={styles.value}>{profile.question}</p>
      </div>
      <div className={styles.block}>
        <div className={styles.label}>Stichprobe</div>
        <p className={styles.value}>{profile.sampleSummary.total} Ausgangssituationen</p>
      </div>
      {groups.map((group) => (
        <div key={group.label} className={styles.block}>
          <div className={styles.label}>{group.label}</div>
          <p className={styles.value}>
            {group.targetCount} / {group.total} · {formatRatePercent(group.rate)} %
          </p>
        </div>
      ))}
      <div className={styles.block}>
        <div className={styles.label}>Tragfähigkeit der Beobachtungsgrundlage</div>
        <p className={styles.value}>{evidenceLabel || profile.evidenceStrength}</p>
      </div>
      <div className={styles.block}>
        <div className={styles.label}>Aussagestufe</div>
        <p className={styles.value}>{claimLevelLabel(profile.maxClaimLevel)}</p>
      </div>
      {profile.primaryLimitation && (
        <div className={styles.block}>
          <div className={styles.label}>Wichtigste Begrenzung</div>
          <p className={styles.value}>{profile.primaryLimitation}</p>
        </div>
      )}
      {profile.counterEvidence && profile.counterEvidence.length > 0 && (
        <div className={styles.block}>
          <div className={styles.label}>Gegenfälle</div>
          <p className={styles.value}>{profile.counterEvidence.join(' ')}</p>
        </div>
      )}
      {profile.descriptiveNote && (
        <div className={styles.block}>
          <div className={styles.label}>Deskriptiv</div>
          <p className={styles.value}>{profile.descriptiveNote}</p>
        </div>
      )}
      <div className={styles.block}>
        <div className={styles.label}>Deine Aussage</div>
        <p className={styles.value}>{profile.finalClaim}</p>
      </div>
      <div className={styles.block}>
        <div className={styles.label}>Beim nächsten Mal prüfen</div>
        <p className={styles.next}>{profile.nextObservationTest}</p>
      </div>
      {profile.falsificationCondition && (
        <div className={styles.block}>
          <div className={styles.label}>Würde die Aussage zurücknehmen, wenn</div>
          <p className={styles.value}>{profile.falsificationCondition}</p>
        </div>
      )}
    </div>
  )
}
