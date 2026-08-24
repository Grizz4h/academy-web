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
        <h3 className={styles.heading}>Meine bisherigen Antizipations-Beobachtungen</h3>
        <p className={styles.hero}>{profile.sourceReads} dokumentierte Situationen</p>
        <p className={styles.lead}>
          Diese Zusammenfassung zeigt, welche sichtbaren Hinweise, Alternativszenarien und Aktualisierungsauslöser
          in deinen bisherigen E4-Einträgen vorkamen. Sie bewertet weder dein Niveau noch deine Vorhersagegenauigkeit.
        </p>
      </section>

      {!profile.hasEnoughData && insufficientHint && (
        <p className={styles.hint}>{insufficientHint}</p>
      )}
      {profile.hasEnoughData && profile.enoughBecause === 'source_coverage' && (
        <p className={styles.hint}>Abdeckung: alle vier E4-Beobachtungsschritte sind in der Zusammenfassung vertreten.</p>
      )}

      <section className={styles.block}>
        <h3 className={styles.heading}>Häufig dokumentierte Hinweisarten</h3>
        <p className={styles.lead}>Häufig bedeutet nicht gut.</p>
        {frequent.length ? (
          <ul className={styles.list}>
            {frequent.map((item) => (
              <li key={item} className={styles.item}>{categoryLabel(item)}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.lead}>Noch keine Hinweis-Muster aus benannten oder gewichteten Hinweisen.</p>
        )}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Selten dokumentierte Hinweisarten</h3>
        <p className={styles.lead}>Selten bedeutet nicht schlecht.</p>
        {rare.length ? (
          <ul className={styles.list}>
            {rare.map((item) => (
              <li key={item} className={styles.item}>{categoryLabel(item)}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.lead}>Noch zu wenige Einträge, um selten dokumentierte Hinweise zu erkennen.</p>
        )}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Beibehalten und Ändern</h3>
        <p className={styles.line}>
          {describeDecisionFlexibility(profile.decisionPatterns.keepCount, profile.decisionPatterns.changeCount)}
        </p>
      </section>

      {branches.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Vorkommende Alternativszenarien</h3>
          <ul className={styles.list}>
            {branches.map((item) => (
              <li key={item} className={styles.item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {profile.updatePatterns.commonTriggers.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.heading}>Dokumentierte Aktualisierungsauslöser</h3>
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
