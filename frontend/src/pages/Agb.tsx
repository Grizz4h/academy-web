import { Link } from 'react-router-dom'
import Card from '../components/Card'
import LegalDraftBanner from '../components/LegalDraftBanner'
import LegalPager from '../components/LegalPager'
import { RINQ_CONTACT_EMAIL, RINQ_PROVIDER } from '../content/legal'
import { AGB_STAND, LEGAL_PUBLIC_PATHS } from '../content/legalMeta'
import styles from './Impressum.module.css'

export default function AgbPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className={`ui-page-title ${styles.heading}`}>Allgemeine Geschäftsbedingungen für rInQ Tank</h1>
        <p className="ui-page-lead">Stand: {AGB_STAND}</p>
      </header>

      <LegalDraftBanner />

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 1 Anbieter und Geltungsbereich</h2>
        <p className={styles.body}>Anbieter der Plattform rInQ Tank ist:</p>
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
          Diese AGB gelten für die Nutzung der digitalen Lernplattform rInQ Tank und für dort
          abgeschlossene kostenpflichtige Abonnements.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 2 Gegenstand von rInQ Tank</h2>
        <p className={styles.body}>
          rInQ Tank ist eine digitale Lernplattform zur Vermittlung und Vertiefung von
          Eishockeywissen, Spielbeobachtung und taktischem Verständnis.
        </p>
        <p className={styles.body}>Die Plattform kann insbesondere enthalten:</p>
        <ul className={styles.list}>
          <li>Lerntracks und Lernmodule</li>
          <li>Beobachtungsdrills und Reflexionsaufgaben</li>
          <li>taktische Darstellungen und Animationen</li>
          <li>individuell gespeicherten Lernfortschritt</li>
          <li>Kompetenz- bzw. Fortschrittsdarstellungen</li>
          <li>KI-gestützte Feedback- und Reflexionsfunktionen</li>
        </ul>
        <p className={styles.body}>
          rInQ Tank ist keine staatlich oder verbandlich anerkannte Trainerqualifikation und
          ersetzt keine offizielle Trainerlizenz (insbesondere keine DEB-Lizenz).
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 3 Registrierung und Benutzerkonto</h2>
        <ul className={styles.list}>
          <li>Die Nutzung kostenpflichtiger Funktionen setzt ein Benutzerkonto voraus.</li>
          <li>Nutzer müssen bei der Registrierung korrekte Angaben machen.</li>
          <li>Login-Zugänge dürfen nicht unbefugt an Dritte weitergegeben werden.</li>
          <li>Nutzer sind für die Sicherung ihres Zugangs verantwortlich.</li>
          <li>Missbrauch oder Sicherheitsprobleme sollen an {RINQ_CONTACT_EMAIL} gemeldet werden.</li>
        </ul>
        <p className={styles.body}>
          Die Anmeldung erfolgt über Managed Auth (Google und/oder E-Mail-OTP) und ggf. über
          einen Legacy-Zugang. Es werden keine eigenen Passwortregeln für Managed Auth
          behauptet.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 4 Mindestalter</h2>
        <p className={styles.todo} role="note">
          TODO LEGAL REVIEW: 18+-Regel vor Paid Launch kurz juristisch prüfen.
        </p>
        <p className={styles.body}>
          Der Abschluss eines kostenpflichtigen Abonnements ist ausschließlich Personen gestattet,
          die das 18. Lebensjahr vollendet haben.
        </p>
        <p className={styles.body}>
          Vor Weiterleitung zu Stripe wird diese Altersvoraussetzung in der Bestellübersicht erneut
          bestätigt (Checkbox). Es werden keine Geburtsdaten erhoben.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 5 Kostenlose und kostenpflichtige Inhalte</h2>
        <p className={styles.body}>
          Track 0 (Foundation, Modul T0) und Modul A1 sind kostenlos zugänglich. Weiterführende
          Akademie-Inhalte ab A2 können ein kostenpflichtiges Abonnement („rInQ Premium“ /
          Feature <code>academy_premium</code>) voraussetzen.
        </p>
        <p className={styles.body}>
          Der konkrete Umfang der kostenpflichtigen Leistungen ergibt sich aus der zum Zeitpunkt
          des Vertragsschlusses dargestellten Angebotsbeschreibung.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 6 Vertragsschluss</h2>
        <ol className={styles.list}>
          <li>Der Nutzer wählt das angebotene Premium-Abonnement in rInQ Tank.</li>
          <li>
            Vor Weiterleitung zu Stripe werden wesentliche Vertragsinformationen und Links zu AGB,
            Widerruf und Datenschutz angezeigt.
          </li>
          <li>Die Zahlungsabwicklung erfolgt über Stripe Checkout.</li>
          <li>
            Der Vertrag kommt mit erfolgreichem Abschluss des Stripe-Checkout-Prozesses zustande.
            Die Freischaltung von Premium erfolgt serverseitig nach bestätigtem
            Stripe-Webhook-Ereignis (bei Subscription-Status active/trialing), nicht allein durch
            den Rückkehr-Link aus dem Checkout.
          </li>
        </ol>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 7 Preise und Zahlung</h2>
        <p className={styles.body}>
          Preis und Abrechnungsintervall ergeben sich aus dem in Stripe hinterlegten
          Preisobjekt (<code>STRIPE_PRICE_ID</code>) und werden dem Nutzer vor dem Checkout
          angezeigt, soweit technisch verfügbar.
        </p>
        <p className={styles.todo} role="note">
          TODO VERTRAGSPRÜFUNG: Konkrete Euro-Beträge und Intervall (monatlich/jährlich) stehen
          nicht hart im Anwendungscode und müssen mit dem Live-/Test-Price in Stripe
          übereinstimmen.
        </p>
        <ul className={styles.list}>
          <li>Angezeigte Verbraucherpreise verstehen sich als Endpreise, soweit zutreffend.</li>
          <li>Zahlungsabwicklung erfolgt über Stripe; angebotene Zahlungsmethoden zeigt der Checkout.</li>
          <li>
            rInQ Tank speichert keine vollständigen Kartendaten; die Kartenverarbeitung erfolgt bei
            Stripe.
          </li>
        </ul>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 8 Abonnement, Laufzeit und Verlängerung</h2>
        <p className={styles.body}>
          Es handelt sich um ein wiederkehrendes Abonnement über Stripe (ein konfiguriertes
          Recurring-Price). Laufzeit und Verlängerungsintervall entsprechen dem in Stripe
          hinterlegten Preis.
        </p>
        <p className={styles.todo} role="note">
          TODO VERTRAGSPRÜFUNG: Ob monatlich, jährlich oder beides angeboten wird, ergibt sich
          ausschließlich aus dem Stripe-Price — im Code ist nur eine Price-ID verdrahtet.
        </p>
        <p className={styles.body}>
          Soweit Stripe das Abonnement automatisch verlängert, verlängert es sich um denselben
          Abrechnungszeitraum, sofern es nicht rechtzeitig gekündigt wird.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 9 Kündigung</h2>
        <p className={styles.body}>
          Die Kündigung erfolgt über die Online-Funktion „Vertrag kündigen“ bzw. das Stripe
          Customer Portal. Soweit das Stripe-Modell „Cancel at period end“ verwendet wird,
          bleibt der Premium-Zugang bis zum Ende des bereits bezahlten Abrechnungszeitraums
          bestehen.
        </p>
        <p className={styles.body}>
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.kuendigen}>
            Vertrag kündigen
          </Link>
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 10 Bereitstellung der digitalen Leistung</h2>
        <p className={styles.body}>
          Nach erfolgreichem Vertragsschluss und bestätigter Zahlung wird der kostenpflichtige
          Zugriff dem Benutzerkonto zugeordnet (Entitlement <code>academy_premium</code>). Die
          Freischaltung erfolgt nach Verarbeitung des Stripe-Webhooks. Kurze technische
          Verzögerungen sind möglich; eine Sofortgarantie allein durch den Browser-Rückkehr-Link
          besteht nicht.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 11 Lernfortschritt</h2>
        <p className={styles.body}>
          rInQ kann unter anderem speichern: absolvierte Lerninhalte, Session-/Drill-Ergebnisse,
          Beobachtungen und Antworten, Reflexionen sowie Fortschritts- und Belohnungswerte (z. B.
          XP/PUX), soweit die jeweilige Funktion dies vorsieht. Einzelheiten zur
          Datenverarbeitung enthält die{' '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.datenschutz}>
            Datenschutzerklärung
          </Link>
          .
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 12 KI-gestützte Funktionen</h2>
        <p className={styles.body}>
          rInQ Tank kann KI-gestützte Funktionen zur Auswertung, Strukturierung oder Reflexion
          von Nutzereingaben einsetzen. Solche Ausgaben dienen als unterstützende Lernfunktion.
          Sie können fehlerhaft, unvollständig oder situationsabhängig sein und stellen keine
          verbindliche fachliche Entscheidung dar. Sie ersetzen insbesondere keine offizielle
          Trainerausbildung, keine medizinische Beratung und keine individuelle professionelle
          Betreuung.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 13 Weiterentwicklung der Plattform und Lerninhalte</h2>
        <p className={styles.body}>
          rInQ Tank ist eine fortlaufend weiterentwickelte digitale Plattform. Inhalte,
          Darstellungen, Übungen, Funktionen und Lernstrukturen dürfen angepasst, verbessert oder
          ersetzt werden, sofern dadurch der vertraglich geschuldete Gesamtcharakter und der
          wesentliche Nutzen der gebuchten Leistung nicht unangemessen beeinträchtigt werden.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 14 Technische Verfügbarkeit</h2>
        <p className={styles.body}>
          Es besteht kein Anspruch auf eine unterbrechungsfreie Verfügbarkeit von 100 %.
          Vorübergehende Einschränkungen können insbesondere durch Wartung, Updates, technische
          Störungen, Sicherheitsmaßnahmen oder Ausfälle externer Dienstleister entstehen.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 15 Nutzungsrechte und Schutz der Inhalte</h2>
        <p className={styles.body}>
          rInQ-Inhalte dürfen für die persönliche Nutzung im Rahmen der Plattform verwendet
          werden. Soweit nicht gesetzlich erlaubt oder ausdrücklich genehmigt, untersagt sind
          insbesondere systematische Vervielfältigung, Weiterverbreitung, öffentliche
          Bereitstellung, kommerzielle Weiterverwertung, massenhafter Export sowie die Weitergabe
          geschützter Lernmaterialien.
        </p>
        <p className={styles.body}>
          Soweit rechtlich geschützt, betrifft dies insbesondere Lerntexte, Drill-Strukturen und
          redaktionelle Zusammenstellungen, Grafiken, Illustrationen, Animationen, taktische
          Szenen, Videos sowie Software-/UI-Inhalte. Nicht jedes einzelne Element ist damit
          automatisch als urheberrechtlich geschützt behauptet.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 16 Account-Sharing und Missbrauch</h2>
        <p className={styles.body}>
          Ein persönliches Abonnement ist grundsätzlich für die Nutzung durch den jeweiligen
          Accountinhaber vorgesehen. Untersagt sind insbesondere Weiterverkauf des Zugangs,
          automatisierter Missbrauch, Manipulation von Zugriffsbeschränkungen, Umgehung der
          Paywall sowie Angriffe auf Plattform oder Infrastruktur.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 17 Sperrung von Accounts</h2>
        <p className={styles.body}>
          Bei erheblichen oder wiederholten Verstößen gegen diese AGB kann der Zugang
          vorübergehend oder dauerhaft eingeschränkt werden. Die Maßnahme soll verhältnismäßig
          sein. Bezahlte Accounts werden nicht willkürlich ohne Anlass gelöscht.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 18 Haftung</h2>
        <p className={styles.todo} role="note">
          TODO JURISTISCHE HAFTUNGSPRÜFUNG
        </p>
        <p className={styles.body}>
          Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei
          Verletzung von Leben, Körper oder Gesundheit und soweit eine zwingende gesetzliche
          Haftung besteht. Im Übrigen ist die Haftung — soweit gesetzlich zulässig —
          zurückhaltend und verhältnismäßig auszugestalten; dieser Absatz ersetzt keine
          vollständige Individualklausel und ist vor Launch zu prüfen.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 19 Datenschutz</h2>
        <p className={styles.body}>
          Für die Verarbeitung personenbezogener Daten gilt die gesonderte{' '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.datenschutz}>
            Datenschutzerklärung
          </Link>
          .
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 20 Widerrufsrecht</h2>
        <p className={styles.body}>
          Verbrauchern kann bei Fernabsatzverträgen ein gesetzliches Widerrufsrecht zustehen.
          Einzelheiten enthält die separate{' '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.widerruf}>
            Widerrufsbelehrung
          </Link>
          . Es wird hier nicht pauschal behauptet, dass das Widerrufsrecht mit Beginn der
          Freischaltung erlischt.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">§ 21 Schlussbestimmungen</h2>
        <p className={styles.todo} role="note">
          TODO JURISTISCHE SCHLUSSPRÜFUNG
        </p>
        <p className={styles.body}>
          Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
          Bestimmungen unberührt. Es wird keine fragwürdige Gerichtsstands- oder
          Rechtswahlklausel zulasten von Verbrauchern formuliert; zwingende Verbraucherrechte
          bleiben unberührt.
        </p>
      </Card>

      <LegalPager />
    </article>
  )
}
