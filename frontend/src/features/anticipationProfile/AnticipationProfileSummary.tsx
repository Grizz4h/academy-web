import { cueCategoryLabel } from '../anticipationRead/readLogic'
import { describeDecisionFlexibility, describeNextFocus } from './profileLogic'
import type { AnticipationProfile } from './types'
import styles from './AnticipationProfileSummary.module.css'

type Props = {
  profile: AnticipationProfile
  insufficientHint?: string
  categoryLabel?: (category: string) => string
}

export function AnticipationProfileSummary({
  profile,
  insufficientHint,
  categoryLabel = cueCategoryLabel,
}: Props) {
  const frequent = profile.cuePatterns.frequentlyUsed
  const rare = profile.cuePatterns.rarelyUsed
  const branches = profile.branchPatterns.commonBranches
  const nextFocus = describeNextFocus(rare, categoryLabel)

  return (
    <div className={styles.stack}>
      <section className={styles.block}>
        <h3 className={styles.heading}>Dein Anticipation Profile</h3>
        <p className={styles.hero}>{profile.sourceReads} Reads</p>
        <p className={styles.lead}>Deine bisherigen Reads zeigen folgendes Muster. Kein Score, kein Level.</p>
      </section>

      {!profile.hasEnoughData && insufficientHint && (
        <p className={styles.hint}>{insufficientHint}</p>
      )}

      <section className={styles.block}>
        <h3 className={styles.heading}>Deine häufigsten Hinweise</h3>
        {frequent.length ? (
          <ul className={styles.list}>
            {frequent.map((item) => (
              <li key={item} className={styles.item}>{categoryLabel(item)}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.lead}>Noch keine Cue-Muster aus gewichteten oder benannten Hinweisen.</p>
        )}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Wenig genutzt</h3>
        {rare.length ? (
          <ul className={styles.list}>
            {rare.map((item) => (
              <li key={item} className={styles.item}>{categoryLabel(item)}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.lead}>Noch zu wenige Reads, um selten genutzte Hinweise zu erkennen.</p>
        )}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Dein Entscheidungsverhalten</h3>
        <p className={styles.line}>
          {describeDecisionFlexibility(profile.decisionPatterns.keepCount, profile.decisionPatterns.changeCount)}
        </p>
      </section>

      {branches.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Häufige Branches</h3>
          <ul className={styles.list}>
            {branches.map((item) => (
              <li key={item} className={styles.item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {profile.updatePatterns.commonTriggers.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Häufige Update-Auslöser</h3>
          <ul className={styles.list}>
            {profile.updatePatterns.commonTriggers.map((item) => (
              <li key={item} className={styles.item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.block}>
        <h3 className={styles.heading}>Dein nächster Fokus</h3>
        <p className={styles.line}>{nextFocus}</p>
      </section>
    </div>
  )
}
