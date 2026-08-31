# Admin-Bereich

Der operative Admin-Bereich liegt unter `/admin` und ist nicht in Header oder Footer verlinkt. Er verwendet den normalen rInQ-Login. Jeder `/api/admin/...`-Endpunkt autorisiert serverseitig die stabile `rinq_user_id` aus dem verifizierten Auth-Kontext.

## Einrichtung

1. Mit dem eigenen rInQ-Account anmelden.
2. Die interne ID auf der Account-Seite oder aus `GET /api/me` (`rinq_user_id`) ermitteln.
3. In Production setzen: `RINQ_ADMIN_USER_IDS=uuid1,uuid2`.
4. `backend/migrations/005_admin_audit_log.sql` anwenden.
5. Anwendung neu starten und `https://rinq-tank.de/admin` öffnen.

Keine echte ID committen. Eine leere Allowlist gewährt niemandem Zugriff. ENV-Änderungen werden nach einem App-Neustart wirksam.

## Umfang

Vorhanden sind Übersicht, gezielte Nutzersuche, Account-/Billing-/Fortschrittsdiagnose, serverseitiger Stripe-Premium-Resync, Widerrufsübersicht mit idempotenten Retries, Billing-Inkonsistenzen und Systemstatus. Sensible Aktionen verwenden POST und werden in `admin_audit_log` protokolliert.

Bewusst nicht enthalten sind freie Refunds, direkte DB-Bearbeitung, Impersonation, Progress-Reset, Sperren/Löschen, offener Testmailversand, Stripe-Subscription-Editor und Secrets. Das aktuelle Webhook-Schema persistiert nur erfolgreich verarbeitete Events; ein verlässlicher letzter fehlgeschlagener Webhook kann daher noch nicht angezeigt werden.

## Datenschutzarmer Support

Die Nutzersuche verarbeitet keine Login-E-Mail und speichert keine zusätzliche Kontaktadresse. Suchbar sind ausschließlich interne User-ID, Legacy-Login-ID, Stripe Customer/Subscription ID und ein flüchtiger Support-Code.

Ein eingeloggter Nutzer kann unter **Account → Support** einen zufälligen Code erzeugen. Der Code:

- gilt 30 Minuten,
- liegt nur im Arbeitsspeicher des einzelnen Backendprozesses,
- wird bei einem neuen Code für denselben Nutzer ungültig,
- verschwindet bei Ablauf oder Backendneustart,
- enthält weder User-ID, E-Mail noch Name.

Die Fehler-Inbox verknüpft operative Fälle ausschließlich über interne IDs und technische Referenzen. Kontakt-E-Mails aus rechtlich notwendigen Widerrufsvorgängen werden in Übersichtslisten nicht ausgegeben. Im Audit Log stehen Admin-ID, Aktion, technische Zielreferenz, Zeitpunkt und Ergebnis; Support-Codes selbst werden nicht protokolliert.
