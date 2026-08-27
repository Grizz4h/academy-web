import Card from '../components/Card'
import LegalPager from '../components/LegalPager'
import { RINQ_CONTACT_EMAIL, RINQ_PROVIDER } from '../content/legal'
import styles from './Impressum.module.css'

function ProviderBlock() {
  return (
    <address className={styles.address}>
      <span className={styles.strong}>{RINQ_PROVIDER.name}</span>
      <br />
      {RINQ_PROVIDER.careOf}
      <br />
      {RINQ_PROVIDER.street}
      <br />
      {RINQ_PROVIDER.cityLine}
      <br />
      {RINQ_PROVIDER.country}
    </address>
  )
}

export default function ImpressumPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Impressum</h1>
        <p className="ui-page-lead">
          Angaben zum Anbieter der digitalen Lernplattform rInQ Tank (Eishockeywissen,
          Spielbeobachtung und taktisches Verständnis).
        </p>
      </header>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Anbieter</h2>
        <p className={styles.lead}>
          <strong>Verantwortlicher Diensteanbieter nach § 5 DDG:</strong>
        </p>
        <ProviderBlock />
        <p className={styles.contactLine}>
          E-Mail:{' '}
          <a className={styles.mail} href={`mailto:${RINQ_CONTACT_EMAIL}`}>
            {RINQ_CONTACT_EMAIL}
          </a>
        </p>
      </Card>

      {/*
        TODO(launch-legal): Confirm whether § 18 Abs. 2 MStV (Verantwortlich für journalistisch-redaktionelle Inhalte)
        applies to rInQ Tank before public launch. Keep or remove this section after legal review.
      */}
      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Verantwortlich für Inhalte</h2>
        <p className={styles.body}>
          Angabe nach § 18 Abs. 2 MStV — rechtliche Notwendigkeit vor Launch noch zu prüfen:
        </p>
        <address className={styles.address}>
          <span className={styles.strong}>{RINQ_PROVIDER.name}</span>
          <br />
          {RINQ_PROVIDER.careOf}
          <br />
          {RINQ_PROVIDER.street}
          <br />
          {RINQ_PROVIDER.cityLine}
        </address>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Haftung für Inhalte</h2>
        <p className={styles.body}>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen
          Gesetzen verantwortlich. Eine Verpflichtung zur permanenten Überwachung übermittelter
          oder gespeicherter fremder Informationen besteht nicht. Bei Bekanntwerden konkreter
          Rechtsverletzungen entfernen wir entsprechende Inhalte unverzüglich.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Haftung für externe Links</h2>
        <p className={styles.body}>
          rInQ Tank kann Links zu externen Websites Dritter enthalten. Für deren Inhalte sind
          ausschließlich die jeweiligen Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung
          waren keine Rechtsverstöße erkennbar. Eine dauerhafte inhaltliche Kontrolle ist ohne
          konkrete Hinweise nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen entfernen
          wir derartige Links unverzüglich.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Urheberrecht</h2>
        <p className={styles.body}>
          Inhalte und Werke auf rInQ Tank, die von uns erstellt wurden, unterliegen — soweit
          jeweils rechtlich geschützt — dem Urheberrecht. Dazu können insbesondere gehören:
        </p>
        <ul className={styles.list}>
          <li>Texte und Lerninhalte</li>
          <li>Drill-Strukturen</li>
          <li>Illustrationen und Grafiken</li>
          <li>Animationen</li>
          <li>taktische Darstellungen</li>
          <li>selbst erstellte Videos bzw. Szenen</li>
          <li>Software-/UI-Inhalte und sonstige eigene Medien</li>
        </ul>
        <p className={styles.body}>
          Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen
          Rechteinhabers. Downloads und Kopien dieser Seite sind nur für den privaten,
          nicht kommerziellen Gebrauch gestattet, soweit gesetzlich zulässig.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">KI-Unterstützung</h2>
        <p className={styles.body}>
          Bei der Entwicklung und redaktionellen Bearbeitung einzelner Inhalte können
          KI-gestützte Werkzeuge eingesetzt werden. Inhalte werden vor Veröffentlichung
          bearbeitet und in die Lernstruktur von rInQ Tank integriert.
        </p>
      </Card>

      <LegalPager />
    </article>
  )
}
