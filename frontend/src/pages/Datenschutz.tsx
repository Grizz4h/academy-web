import type { ReactNode } from 'react'
import Card from '../components/Card'
import LegalPager from '../components/LegalPager'
import { RINQ_CONTACT_EMAIL, RINQ_PROVIDER } from '../content/legal'
import styles from './Datenschutz.module.css'

function Todo({ children }: { children: ReactNode }) {
  return (
    <p className={styles.todo} role="note">
      <strong>TODO DATENSCHUTZPRÜFUNG:</strong> {children}
    </p>
  )
}

function ContactEmail() {
  if (RINQ_CONTACT_EMAIL) {
    return (
      <a className={styles.mail} href={`mailto:${RINQ_CONTACT_EMAIL}`}>
        {RINQ_CONTACT_EMAIL}
      </a>
    )
  }
  // TODO(launch-legal): Set RINQ_CONTACT_EMAIL in content/legal.ts
  return <span className={styles.todoInline}>[TODO: rInQ-Kontaktadresse noch festlegen]</span>
}

function ProviderLines() {
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

export default function DatenschutzPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Datenschutzerklärung</h1>
        <p className="ui-page-lead">
          Informationen zur Verarbeitung personenbezogener Daten bei Nutzung der Lernplattform
          rInQ Tank. Stand der technischen Beschreibung: August 2026 (aus dem aktuellen
          Anwendungscode und der Deployment-Dokumentation).
        </p>
      </header>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">1. Verantwortlicher</h2>
        <p className={styles.body}>
          Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung
          (DSGVO) ist:
        </p>
        <ProviderLines />
        <p className={styles.body}>
          E-Mail: <ContactEmail />
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">2. Hosting und Serverzugriff</h2>
        <p className={styles.body}>
          Die Anwendung rInQ Tank (Web-Frontend und API) wird auf einem Server der{' '}
          <strong>Hetzner Online GmbH</strong>, Industriestr. 25, 91710 Gunzenhausen, Deutschland,
          betrieben. Die Domainverwaltung (DNS) erfolgt über IONOS; IONOS ist damit nicht der
          Webhoster der Anwendung.
        </p>
        <p className={styles.body}>
          Beim Aufruf der Website und der API können technisch notwendige Verbindungsdaten
          verarbeitet werden, insbesondere:
        </p>
        <ul className={styles.list}>
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit der Anfrage</li>
          <li>aufgerufene Ressource / URL-Pfad</li>
          <li>HTTP-Statuscode</li>
          <li>Browser- bzw. Clientinformationen, soweit sie serverseitig übermittelt werden (z.&nbsp;B. User-Agent)</li>
          <li>weitere technisch notwendige Protokolldaten der Webserver- und Anwendungsschicht</li>
        </ul>
        <p className={styles.body}>
          Zweck: Bereitstellung und Absicherung der Website und API, Fehleranalyse und
          Missbrauchserkennung.
        </p>
        <p className={styles.body}>
          Rechtsgrundlage (vorläufig): Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
          sicherem und stabilem Betrieb).
        </p>
        <Todo>
          Konkrete Speicherdauer der Nginx-/System- und Anwendungsprotokolle ist im Projekt nicht
          verbindlich dokumentiert und vor Launch festzulegen.
        </Todo>
        <Todo>
          Region des Hetzner-Servers und Auftragsverarbeitungsvertrag (AVV) mit Hetzner vor Launch
          prüfen bzw. dokumentieren.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">3. Benutzerkonto und Authentifizierung</h2>
        <p className={styles.body}>
          Für die Nutzung personalisierter Funktionen (Lernfortschritt, Profil, ggf. Premium)
          ist ein Benutzerkonto erforderlich. rInQ speichert eine interne Benutzerkennung
          (<code>rinq_user_id</code>) und verknüpfte Anmeldemethoden. Die E-Mail-Adresse wird in
          der rInQ-Anwendungsdatenbank <strong>nicht</strong> als Identitätsmerkmal gespeichert.
        </p>
        <p className={styles.body}>Je nach Anmeldeweg können insbesondere folgende Daten verarbeitet werden:</p>
        <ul className={styles.list}>
          <li>interne Benutzer-ID (<code>rinq_user_id</code>)</li>
          <li>Anbieter der Anmeldung und Anbieter-Benutzerkennung (<code>provider</code> / <code>provider_subject</code>)</li>
          <li>Anzeigename (selbst gewählt bzw. aus Legacy-Benutzername abgeleitet)</li>
          <li>Profilangaben (z.&nbsp;B. Avatar, Banner, Emblem, Titel, Tagline, Präferenzen)</li>
          <li>bei Legacy-Anmeldung: Benutzername und Passwort-Hash (bcrypt)</li>
          <li>Zeitpunkt der Kontoanlage / Verknüpfung</li>
        </ul>
        <p className={styles.body}>
          Zweck: Vertragliche bzw. vorvertragliche Bereitstellung des Benutzerkontos und der
          Lernplattform (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
        <p className={styles.body}>
          Authentifizierung für Managed Auth erfolgt über <strong>Supabase Auth</strong> (JWT-Prüfung
          serverseitig). Legacy-Sessions nutzen ein von rInQ ausgestelltes JWT im Browser
          (LocalStorage, Authorization-Header — keine Auth-Cookies der Anwendung).
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">4. Anmeldung mit Google</h2>
        <p className={styles.body}>
          Sofern Sie „Mit Google anmelden“ nutzen, erfolgt die Authentifizierung über Supabase
          Auth und den Identitätsanbieter Google. rInQ speichert die stabile Supabase-/Google-
          Benutzerkennung (<code>provider_subject</code>), nicht die E-Mail-Adresse als
          Primärschlüssel. Die E-Mail-Adresse wird beim Identitätsanbieter (Supabase/Google)
          verarbeitet; in rInQ selbst ist sie nicht als Profilfeld vorgesehen.
        </p>
        <p className={styles.body}>
          Zweck: Anmeldung und Kontoverwaltung (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
        <Todo>
          In den Google-/Supabase-Konsolen prüfen, welche Claims (z.&nbsp;B. Name) tatsächlich
          freigegeben und ggf. kurzzeitig im Token sichtbar sind; rInQ legt den Anzeigenamen
          über ein eigenes Onboarding fest und speichert keine E-Mail im Profil.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">5. Anmeldung per E-Mail (OTP / Magic Link)</h2>
        <p className={styles.body}>
          Bei der passwortlosen E-Mail-Anmeldung sendet <strong>Supabase Auth</strong> einen
          Einmalcode bzw. Magic Link an Ihre E-Mail-Adresse. rInQ leitet den Versand nicht selbst
          und speichert die E-Mail nicht im eigenen Profilschema. Verknüpft wird die von Supabase
          vergebene Benutzerkennung.
        </p>
        <p className={styles.body}>
          Zweck: Anmeldung (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
        <Todo>
          AVV/DPA mit Supabase sowie Speicherort (Region) der Auth-Daten vor Launch dokumentieren.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">6. Apple-Anmeldung</h2>
        <p className={styles.body}>
          „Sign in with Apple“ ist in der aktuellen rInQ-Anwendung <strong>nicht</strong>
          implementiert. Entsprechende Verarbeitungen finden derzeit nicht statt.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">7. Lernfortschritt und Nutzereingaben</h2>
        <p className={styles.body}>
          Zur Bereitstellung der Lernplattform speichert rInQ Ihren individuellen Lernfortschritt
          und zugehörige Eingaben, insbesondere:
        </p>
        <ul className={styles.list}>
          <li>Sessions (Module/Drills, Fortschritt, Entwürfe/Drafts, Check-ins, Antworten)</li>
          <li>gewählte Antwortoptionen und Freitextfelder innerhalb von Drills (technisch begrenzt)</li>
          <li>Ziele, Fokusangaben und Session-Metadaten (z.&nbsp;B. Spiel-/Teamkontext, soweit erfasst)</li>
          <li>Szenennotizen und Bewertungen (Szenenpool)</li>
          <li>Beobachtungsläufe und zugehörige Notizen (Observation)</li>
          <li>XP, PUX, freigeschaltete Cosmetics und zugehörige Aktivitäts-/Belohnungsdaten</li>
          <li>optional gespeicherte KI-Reflexion zur Session (siehe Abschnitt KI)</li>
        </ul>
        <p className={styles.body}>
          Zweck: Bereitstellung der Lernplattform, Speicherung des individuellen Lernfortschritts
          und Fortsetzung begonnener Lerninhalte (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
        <Todo>
          Konkrete Aufbewahrungsfristen für Sessions, Entwürfe, Aktivitätsprotokolle und
          Szenen/Beobachtungen während bestehender Accounts sind technisch noch nicht
          verbindlich definiert (Löschung mit Konto: siehe Abschnitt Konto löschen).
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">8. KI-gestützte Session-Reflexion</h2>
        <p className={styles.body}>
          Optional kann zu einer abgeschlossenen Session eine KI-Reflexion angefordert werden.
          Dabei übermittelt das Backend ausgewählte Session- und Drill-Inhalte (u.&nbsp;a.
          Beobachtungen, Antwortinhalte einschließlich Freitext, Team-/Spielkontext, soweit in
          der Session vorhanden) an die <strong>OpenAI API</strong>. Account-Kennungen und
          E-Mail-Adressen werden für diesen Aufruf nicht als Identifikatoren mitgeschickt;
          bestimmte Kontoschlüssel werden vor dem Versand entfernt. Die API-Antwort kann in der
          Session gespeichert werden (<code>ai_reflection</code>). Der Aufruf erfolgt mit
          <code>store=False</code> gegenüber der OpenAI API (kein Provider-Store-Flag in unserem
          Code).
        </p>
        <p className={styles.body}>
          Zweck: optionale didaktische Reflexion zur Session (Art. 6 Abs. 1 lit. b DSGVO, soweit
          Bestandteil der Plattformnutzung; andernfalls Einwilligung — Zuordnung vor Launch prüfen).
        </p>
        <Todo>
          Rechtsgrundlage für KI-Übermittlung (Vertrag vs. Einwilligung), Drittlandtransfer
          (USA/OpenAI), AVV sowie Speicher-/Löschpraxis bei OpenAI vor Launch rechtlich klären.
          Keine pauschalen Aussagen zu Modelltraining treffen, solange nicht aus aktuellen
          OpenAI-Bedingungen eindeutig belegt.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">9. Zahlungen und Abonnements</h2>
        <p className={styles.body}>
          Für kostenpflichtige Zugänge (Premium) wird <strong>Stripe</strong> genutzt (Checkout und
          Kundenportal). Kartendaten werden über Stripe Checkout verarbeitet und von rInQ nicht
          als vollständige Karten- oder Bankdaten gespeichert. In rInQ können insbesondere
          gespeichert werden:
        </p>
        <ul className={styles.list}>
          <li>Stripe-Kunden- und Abonnement-IDs</li>
          <li>Abo-Status, Preis-/Tarifkennungen, Laufzeitangaben, Kündigungsstatus</li>
          <li>Entitlements / Zugriffsrechte (z.&nbsp;B. Premium-Feature)</li>
          <li>technische Webhook-Ereignis-IDs zur Verarbeitung</li>
          <li>ggf. Rohdaten des Stripe-Abonnement-Objekts in der Billing-Persistenz</li>
        </ul>
        <p className={styles.body}>
          PayPal ist derzeit nicht angebunden. Apple Pay / Google Pay sind im Anwendungscode nicht
          eigens implementiert; ob Stripe Checkout im Dashboard entsprechende Wallets freigeschaltet
          hat, ist unabhängig davon zu prüfen.
        </p>
        <p className={styles.body}>
          Zweck: Vertragsabwicklung und Zugangssteuerung (Art. 6 Abs. 1 lit. b DSGVO); ggf.
          Aufbewahrung von Rechnungs-/Buchhaltungsdaten nach Art. 6 Abs. 1 lit. c DSGVO.
        </p>
        <Todo>
          Aufbewahrungsfristen für Billing-/Buchhaltungsdaten und Umgang mit Stripe-Kunden nach
          Kontolöschung (Stripe-seitig vs. lokale Löschung) vor Launch festlegen.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">10. Cookies und lokale Speicherung</h2>
        <p className={styles.body}>
          Die Anwendung setzt nach aktuellem Code <strong>keine eigenen Auth-Cookies</strong>.
          Sitzungs- und Authentifizierungsdaten werden im Browser vor allem über{' '}
          <strong>LocalStorage</strong> (u.&nbsp;a. API-Token, Anzeigename, Benutzer-ID, Session-
          Entwürfe, Tutorial-Status) und teilweise <strong>SessionStorage</strong> (u.&nbsp;a.
          Venue-Präsenz-Cache) verarbeitet. Supabase Auth persistiert seine Session ebenfalls im
          Browser-Storage.
        </p>
        <p className={styles.body}>
          Zweck: technisch notwendige Bereitstellung von Login, Entwürfen und Bedienstatus
          (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO — Zuordnung vor Launch finalisieren).
        </p>
        <p className={styles.body}>
          Marketing-Tracking-Cookies werden derzeit nicht eingesetzt (siehe Analytics).
        </p>
        <Todo>
          Exacte Supabase-Storage-Keys und etwaige Cookies während des OAuth-Redirects bei Google
          im Browser einmal live dokumentieren.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">11. Analytics und Tracking</h2>
        <p className={styles.body}>
          In der aktuellen Codebasis sind keine Marketing- oder Produkt-Analytics-Dienste
          (z.&nbsp;B. Google Analytics, Plausible, PostHog, Meta Pixel) und kein Error-Monitoring
          wie Sentry eingebunden. Es findet daher derzeit kein entsprechendes Tracking statt.
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">12. Schriftarten (Google Fonts)</h2>
        <p className={styles.body}>
          Die Website lädt Schriftarten über die Server von Google Fonts (
          <code>fonts.googleapis.com</code> / <code>fonts.gstatic.com</code>). Dabei kann Ihr
          Browser technisch notwendige Verbindungsdaten (insbesondere IP-Adresse) an Google
          übermitteln.
        </p>
        <p className={styles.body}>
          Zweck: einheitliche Darstellung der Benutzeroberfläche.
        </p>
        <Todo>
          Rechtsgrundlage und ggf. Selbsthosting der Fonts vor Launch prüfen (Datenschutzrisiko
          Drittland / Google).
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">13. Server- und Sicherheitsprotokolle</h2>
        <p className={styles.body}>
          Zur Absicherung können Anwendungsprotokolle u.&nbsp;a. IP-Adresse, Pfad, Ereignistyp und
          interne Benutzerkennungen enthalten (Security-/Auth-Logs). Geheimnisse und Tokens sollen
          dabei nicht protokolliert werden.
        </p>
        <Todo>
          Inhalt und Speicherdauer von Nginx-Access-Logs und Journal-/Backend-Logs verbindlich
          festlegen und hier nachziehen.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">14. Kontaktaufnahme</h2>
        <p className={styles.body}>
          Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Daten
          (mindestens E-Mail-Adresse und Inhalt der Nachricht) zur Bearbeitung der Anfrage.
        </p>
        <p className={styles.body}>
          Kontakt: <ContactEmail />
        </p>
        <Todo>
          Ob die Mailbox über einen externen E-Mail-Dienstleister betrieben wird, ist noch zu
          dokumentieren, sobald die rInQ-Adresse feststeht.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">15. Empfänger / Auftragsverarbeiter</h2>
        <p className={styles.body}>
          Soweit für den Betrieb erforderlich, können personenbezogene Daten an folgende Kategorien
          von Empfängern gelangen (nur soweit der jeweilige Dienst tatsächlich genutzt wird):
        </p>
        <ul className={styles.list}>
          <li>Hetzner Online GmbH — Hosting</li>
          <li>Supabase — Authentifizierung (und ggf. Datenbank, wenn Postgres-Backend aktiv)</li>
          <li>Google — Identitätsanbieter bei Google-Login; Fonts-CDN</li>
          <li>Stripe — Zahlungsabwicklung und Abonnements</li>
          <li>OpenAI — optionale Session-Reflexion</li>
          <li>Let’s Encrypt — TLS-Zertifikate (Domainvalidierung)</li>
        </ul>
        <Todo>
          AV-Verträge und Übermittlungsgrundlagen (inkl. Drittländer) für alle genannten Anbieter
          vor Launch prüfen und ergänzen.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">16. Speicherdauer</h2>
        <p className={styles.body}>
          Kontodaten und Lernfortschritt werden grundsätzlich verarbeitet, solange Ihr
          Benutzerkonto besteht bzw. bis Sie das Konto löschen oder eine kürzere technische
          Löschung erfolgt. Für Zahlungs- und Buchhaltungsdaten können gesetzliche
          Aufbewahrungspflichten längere Fristen verlangen.
        </p>
        <Todo>
          Konkrete Fristen je Datenkategorie (Sessions, Logs, Billing, KI-Reflexionen, Backups)
          vor Launch festlegen — derzeit nicht aus dem Code ableitbar.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">17. Löschung des Benutzerkontos</h2>
        <p className={styles.body}>
          Über die Kontoeinstellungen können Sie einen Datenexport anfordern und Ihr Konto
          löschen. Bei der Löschung werden nach aktuellem Stand der Self-Service-Funktion
          insbesondere Profil-, Belohnungs-, Session-, Szenen- und Beobachtungsdaten sowie
          Identitätsverknüpfungen entfernt; bei Managed Auth wird der zugehörige Supabase-Auth-
          Nutzer gelöscht, sofern der Service-Key konfiguriert ist.
        </p>
        <p className={styles.body}>
          Nicht automatisch vollständig geklärt bzw. möglicherweise weiterhin vorhanden:
          Sicherungskopien/Backups, Stripe-Kundendaten beim Zahlungsanbieter, technische
          Webhook-Idempotenz-Einträge.
        </p>
        <Todo>
          End-to-End-Löschung unter produktivem Postgres + Stripe + Supabase vor Launch testen und
          diese Erklärung an das tatsächliche Ergebnis anpassen. Keine absolute Sofortlöschung
          aller Spuren (Backups/Buchhaltung) versprechen.
        </Todo>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">18. Rechte betroffener Personen</h2>
        <p className={styles.body}>
          Sie haben nach Maßgabe der DSGVO insbesondere folgende Rechte:
        </p>
        <ul className={styles.list}>
          <li>Auskunft (Art. 15)</li>
          <li>Berichtigung (Art. 16)</li>
          <li>Löschung (Art. 17)</li>
          <li>Einschränkung der Verarbeitung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f (Art. 21)</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3)</li>
          <li>Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77)</li>
        </ul>
        <p className={styles.body}>
          Zur Ausübung Ihrer Rechte wenden Sie sich an: <ContactEmail />
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">19. Änderungen</h2>
        <p className={styles.body}>
          Wir passen diese Datenschutzerklärung an, wenn sich die technischen oder rechtlichen
          Rahmenbedingungen ändern. Die jeweils aktuelle Fassung ist unter dieser URL abrufbar.
        </p>
      </Card>

      <LegalPager />
    </article>
  )
}
