import { Link } from 'react-router-dom'
import Card from '../components/Card'
import LegalDraftBanner from '../components/LegalDraftBanner'
import LegalPager from '../components/LegalPager'
import { RINQ_CONTACT_EMAIL, RINQ_PROVIDER } from '../content/legal'
import { LEGAL_PUBLIC_PATHS, WIDERRUF_STAND } from '../content/legalMeta'
import styles from './Impressum.module.css'

export default function WiderrufPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className={`ui-page-title ${styles.heading}`}>Widerrufsbelehrung</h1>
        <p className="ui-page-lead">Stand: {WIDERRUF_STAND}</p>
      </header>

      <LegalDraftBanner />

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Widerrufsrecht</h2>
        <p className={styles.body}>
          Verbrauchern steht bei Fernabsatzverträgen grundsätzlich ein gesetzliches
          Widerrufsrecht von 14 Tagen zu, soweit gesetzlich anwendbar.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Widerrufsfrist</h2>
        <p className={styles.body}>
          Die Frist beträgt 14 Tage ab dem Tag des Vertragsschlusses, soweit die gesetzlichen
          Voraussetzungen vorliegen.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Ausübung des Widerrufs</h2>
        <p className={styles.body}>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung
          (z. B. per E-Mail oder über die elektronische Widerrufsfunktion) über Ihren Entschluss,
          diesen Vertrag zu widerrufen, informieren:
        </p>
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
          <br />
          E-Mail:{' '}
          <a className={styles.mail} href={`mailto:${RINQ_CONTACT_EMAIL}`}>
            {RINQ_CONTACT_EMAIL}
          </a>
        </address>
        <p className={styles.body}>
          Elektronische Funktion:{' '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.widerrufAntrag}>
            Vertrag widerrufen
          </Link>
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Folgen des Widerrufs</h2>
        <p className={styles.body}>
          Wenn Sie diesen Vertrag widerrufen, erstatten wir Ihnen alle Zahlungen, die wir von
          Ihnen erhalten haben, unverzüglich und spätestens binnen 14 Tagen ab dem Tag, an dem
          die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist — soweit
          gesetzlich geschuldet.
        </p>
        <p className={styles.body}>
          Operativ zum aktuellen Launch: Bei wirksamem Widerruf innerhalb der Frist beenden wir das
          Abonnement, entziehen den Premiumzugang und erstatten den gezahlten Betrag vollständig
          zurück. Einen anteiligen Wertersatz für bereits genutzte Tage verlangen wir derzeit nicht.
        </p>
        <p className={styles.todo} role="note">
          TODO LEGAL REVIEW: konkrete Widerrufsbelehrung und Einordnung des rInQ-Abos vor Paid
          Launch anwaltlich prüfen.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Digitale Leistungen / Sofortfreischaltung</h2>
        <p className={styles.body}>
          Premium wird nach erfolgreichem Kauf in der Regel sofort freigeschaltet. Zum aktuellen
          Launch verlangen wir keine Erklärung zum Verzicht auf das Widerrufsrecht. Die
          14-tägige Widerrufsfrist bleibt operativ vorgesehen, soweit gesetzlich anwendbar.
        </p>
        <p className={styles.todo} role="note">
          TODO LEGAL REVIEW: Sofortfreischaltung digitaler Leistungen und Widerrufsfolgen vor Paid
          Launch anwaltlich prüfen.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Muster-Widerrufsformular</h2>
        <p className={styles.body}>
          (Wenn Sie den Vertrag widerrufen wollen, können Sie dieses Formular ausfüllen und
          zurücksenden.)
        </p>
        <p className={styles.body}>
          An {RINQ_PROVIDER.name}, {RINQ_PROVIDER.careOf}, {RINQ_PROVIDER.street},{' '}
          {RINQ_PROVIDER.cityLine}, {RINQ_CONTACT_EMAIL}:
        </p>
        <p className={styles.body}>
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den
          Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)
        </p>
        <ul className={styles.list}>
          <li>Bestellt am (*)/erhalten am (*)</li>
          <li>Name des/der Verbraucher(s)</li>
          <li>Anschrift des/der Verbraucher(s)</li>
          <li>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</li>
          <li>Datum</li>
        </ul>
        <p className={styles.body}>(*) Unzutreffendes streichen.</p>
      </Card>

      <LegalPager />
    </article>
  )
}
