"""Central transactional mail service (SMTP via env)."""

from __future__ import annotations

import logging
import os
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any, Optional, Tuple

logger = logging.getLogger(__name__)

# Message types for logging / future templates
MSG_WITHDRAWAL_RECEIPT = "withdrawal_receipt"
MSG_WITHDRAWAL_REFUND = "withdrawal_refund"
MSG_WITHDRAWAL_CONFIRM_LINK = "withdrawal_confirm_link"
MSG_CONTRACT_CONFIRMATION = "contract_confirmation"  # TODO VERTRAGSBESTÄTIGUNG
MSG_TEST = "test"

SUBJECT_WITHDRAWAL_RECEIPT = "Bestätigung deines Widerrufs – rInQ Tank"
SUBJECT_WITHDRAWAL_REFUND = "Erstattung zu deinem Widerruf – rInQ Tank"


@dataclass(frozen=True)
class MailResult:
    ok: bool
    error: Optional[str] = None


def mail_configured() -> bool:
    return bool((os.environ.get("ACADEMY_SMTP_HOST") or "").strip())


def smtp_from_address() -> str:
    return (os.environ.get("ACADEMY_SMTP_FROM") or "kontakt@rinq-tank.de").strip()


def _smtp_settings() -> Tuple[str, int, str, str, bool, bool]:
    host = (os.environ.get("ACADEMY_SMTP_HOST") or "").strip()
    port = int((os.environ.get("ACADEMY_SMTP_PORT") or "587").strip() or "587")
    user = (os.environ.get("ACADEMY_SMTP_USER") or "").strip()
    password = (os.environ.get("ACADEMY_SMTP_PASSWORD") or "").strip()
    # Prefer ACADEMY_SMTP_SECURE; keep ACADEMY_SMTP_TLS as alias
    secure_raw = (
        os.environ.get("ACADEMY_SMTP_SECURE")
        or os.environ.get("ACADEMY_SMTP_TLS")
        or ""
    ).strip().lower()
    # Port 465 → implicit SSL
    use_ssl = port == 465 or secure_raw in ("ssl", "smtps")
    # STARTTLS: explicit true/starttls, or default on for submission port 587
    if use_ssl:
        use_starttls = False
    elif secure_raw in ("0", "false", "no", "off"):
        use_starttls = False
    elif secure_raw in ("1", "true", "yes", "on", "starttls"):
        use_starttls = True
    else:
        use_starttls = port == 587
    return host, port, user, password, use_starttls, use_ssl


def send_transactional_mail(
    *,
    recipient: str,
    subject: str,
    text_body: str,
    message_type: str,
    html_body: Optional[str] = None,
    reference_id: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> MailResult:
    """
    Send a transactional email via SMTP. Never log secrets or full payment data.
    """
    to = (recipient or "").strip()
    if not to or "@" not in to:
        return MailResult(False, "invalid recipient")

    host, port, user, password, use_starttls, use_ssl = _smtp_settings()
    if not host:
        return MailResult(
            False,
            "ACADEMY_SMTP_HOST not configured (TODO PAID LAUNCH BLOCKER: SMTP)",
        )

    from_addr = smtp_from_address()
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr(("rInQ Tank", from_addr))
    msg["To"] = to
    msg["Reply-To"] = reply_to or from_addr
    if reference_id:
        msg["X-rInQ-Reference"] = str(reference_id)[:120]
        msg["X-rInQ-Message-Type"] = str(message_type)[:80]
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=30) as smtp:
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=30) as smtp:
                if use_starttls:
                    smtp.starttls()
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        logger.info(
            "[mail] sent type=%s ref=%s to_domain=%s",
            message_type,
            reference_id,
            to.split("@")[-1],
        )
        return MailResult(True, None)
    except Exception as exc:
        logger.exception(
            "[mail] send failed type=%s ref=%s step=smtp",
            message_type,
            reference_id,
        )
        return MailResult(False, str(exc))


# ---------------------------------------------------------------------------
# Templates (keep legal claims minimal — no marketing)
# ---------------------------------------------------------------------------

def _greeting(display_name: Optional[str]) -> str:
    name = (display_name or "").strip()
    if not name or name.lower() in {"undefined", "null", "none", "n/a"}:
        return "Hallo,"
    return f"Hallo {name},"


def _html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def format_berlin_date_time(received_at: Any) -> Tuple[str, str]:
    """Server-side Europe/Berlin date + time from UTC timestamp."""
    from datetime import datetime, timezone
    from zoneinfo import ZoneInfo

    dt: Optional[datetime] = None
    if isinstance(received_at, datetime):
        dt = received_at if received_at.tzinfo else received_at.replace(tzinfo=timezone.utc)
    elif received_at:
        try:
            dt = datetime.fromisoformat(str(received_at).replace("Z", "+00:00"))
        except ValueError:
            dt = None
    if dt is None:
        dt = datetime.now(timezone.utc)
    local = dt.astimezone(ZoneInfo("Europe/Berlin"))
    date_s = local.strftime("%d.%m.%Y")
    time_s = local.strftime("%H:%M Uhr")
    return date_s, time_s


def withdrawal_friendly_refs(withdrawal_id: str) -> Tuple[str, str]:
    """Internal refs — no Stripe IDs. (contract_reference, withdrawal_reference)."""
    short = (withdrawal_id or "").replace("-", "")[:8].upper() or "XXXXXXXX"
    return f"VT-{short}", f"WR-{short}"


_SIGNATURE_TEXT = "\n".join(
    [
        "Viele Grüße",
        "rInQ Tank",
        "",
        "Christoph Rabhansl",
        "c/o MDC Management#4062",
        "Welserstraße 3",
        "87463 Dietmannsried",
    ]
)

_SIGNATURE_HTML = """\
<p>Viele Grüße<br/>
rInQ Tank</p>
<p>
Christoph Rabhansl<br/>
c/o MDC Management#4062<br/>
Welserstraße 3<br/>
87463 Dietmannsried
</p>
"""


def build_withdrawal_receipt_bodies(
    *,
    display_name: Optional[str],
    received_at: Any,
    withdrawal_id: str,
    product_label: str = "rInQ Tank Premium",
) -> Tuple[str, str]:
    """Eingangsbestätigung — no claim that refund already completed."""
    greet = _greeting(display_name)
    date_s, time_s = format_berlin_date_time(received_at)
    contract_ref, withdrawal_ref = withdrawal_friendly_refs(withdrawal_id)
    text = "\n".join(
        [
            greet,
            "",
            "wir bestätigen den Eingang deines Widerrufs für dein rInQ-Tank-Abonnement.",
            "",
            "Eingang des Widerrufs:",
            f"{date_s} um {time_s}",
            "",
            "Vertrag:",
            product_label,
            "",
            "Vertragsreferenz:",
            contract_ref,
            "",
            f"Dein Widerruf wurde unter der Referenz {withdrawal_ref} erfasst.",
            "",
            "Die weitere Rückabwicklung wird entsprechend bearbeitet. Sofern eine Erstattung",
            "erfolgt, wird diese über die beim Kauf verwendete Zahlungsmethode abgewickelt.",
            "",
            "Bei Fragen zu deinem Widerruf erreichst du uns unter kontakt@rinq-tank.de.",
            "",
            _SIGNATURE_TEXT,
        ]
    )
    g_html = _html_escape(greet)
    text_html = f"""\
<p>{g_html}</p>
<p>wir bestätigen den Eingang deines Widerrufs für dein rInQ-Tank-Abonnement.</p>
<p>
  <strong>Eingang des Widerrufs:</strong><br/>
  {_html_escape(date_s)} um {_html_escape(time_s)}
</p>
<p>
  <strong>Vertrag:</strong><br/>
  {_html_escape(product_label)}
</p>
<p>
  <strong>Vertragsreferenz:</strong><br/>
  {_html_escape(contract_ref)}
</p>
<p>Dein Widerruf wurde unter der Referenz <strong>{_html_escape(withdrawal_ref)}</strong> erfasst.</p>
<p>Die weitere Rückabwicklung wird entsprechend bearbeitet. Sofern eine Erstattung
erfolgt, wird diese über die beim Kauf verwendete Zahlungsmethode abgewickelt.</p>
<p>Bei Fragen zu deinem Widerruf erreichst du uns unter
<strong><a href="mailto:kontakt@rinq-tank.de">kontakt@rinq-tank.de</a></strong>.</p>
{_SIGNATURE_HTML}
"""
    return text, text_html


def build_withdrawal_refund_bodies(
    *,
    display_name: Optional[str],
    withdrawal_id: str,
    product_label: str = "rInQ Tank Premium",
) -> Tuple[str, str]:
    """Erstattungsbestätigung — only after Stripe refund succeeded."""
    greet = _greeting(display_name)
    contract_ref, withdrawal_ref = withdrawal_friendly_refs(withdrawal_id)
    text = "\n".join(
        [
            greet,
            "",
            "zu deinem Widerruf für rInQ Tank Premium wurde eine Erstattung ausgelöst.",
            "",
            f"Vertrag: {product_label}",
            f"Vertragsreferenz: {contract_ref}",
            f"Widerrufsreferenz: {withdrawal_ref}",
            "",
            "Die Erstattung erfolgt über die beim Kauf verwendete Zahlungsmethode.",
            "Die Gutschrift kann je nach Zahlungsdienstleister einige Werktage dauern.",
            "",
            "Bei Fragen erreichst du uns unter kontakt@rinq-tank.de.",
            "",
            _SIGNATURE_TEXT,
        ]
    )
    html = f"""\
<p>{_html_escape(greet)}</p>
<p>zu deinem Widerruf für rInQ Tank Premium wurde eine Erstattung ausgelöst.</p>
<p>
  <strong>Vertrag:</strong> {_html_escape(product_label)}<br/>
  <strong>Vertragsreferenz:</strong> {_html_escape(contract_ref)}<br/>
  <strong>Widerrufsreferenz:</strong> {_html_escape(withdrawal_ref)}
</p>
<p>Die Erstattung erfolgt über die beim Kauf verwendete Zahlungsmethode.
Die Gutschrift kann je nach Zahlungsdienstleister einige Werktage dauern.</p>
<p>Bei Fragen erreichst du uns unter
<strong><a href="mailto:kontakt@rinq-tank.de">kontakt@rinq-tank.de</a></strong>.</p>
{_SIGNATURE_HTML}
"""
    return text, html


def build_withdrawal_confirm_link_bodies(*, confirm_url: str, reference_id: str) -> Tuple[str, str]:
    _, withdrawal_ref = withdrawal_friendly_refs(reference_id)
    text = "\n".join(
        [
            "Hallo,",
            "",
            "Bitte bestätige deinen Widerruf über diesen Link:",
            confirm_url,
            "",
            f"Referenz: {withdrawal_ref}",
            "Wenn du keinen Widerruf angefordert hast, ignoriere diese E-Mail.",
            "Kontakt: kontakt@rinq-tank.de",
            "",
            _SIGNATURE_TEXT,
        ]
    )
    html = f"""\
<p>Hallo,</p>
<p>Bitte bestätige deinen Widerruf über diesen Link:</p>
<p><a href="{_html_escape(confirm_url)}">{_html_escape(confirm_url)}</a></p>
<p>Referenz: {_html_escape(withdrawal_ref)}</p>
<p>Wenn du keinen Widerruf angefordert hast, ignoriere diese E-Mail.</p>
<p>Kontakt: <a href="mailto:kontakt@rinq-tank.de">kontakt@rinq-tank.de</a></p>
{_SIGNATURE_HTML}
"""
    return text, html


def build_test_mail_bodies() -> Tuple[str, str]:
    text = (
        "Dies ist eine Testmail von rInQ Tank (SMTP).\n"
        "Umlaute: äöüß ÄÖÜ\n"
        "Absender sollte kontakt@rinq-tank.de sein.\n"
    )
    html = (
        "<p>Dies ist eine <strong>Testmail</strong> von rInQ Tank (SMTP).</p>"
        "<p>Umlaute: äöüß ÄÖÜ</p>"
        "<p>Absender sollte kontakt@rinq-tank.de sein.</p>"
    )
    return text, html


# TODO VERTRAGSBESTÄTIGUNG — stub only; do not send until content/trigger are final.
def build_contract_confirmation_bodies_placeholder() -> Tuple[str, str]:
    text = "TODO VERTRAGSBESTÄTIGUNG — Inhalt noch nicht freigegeben."
    html = f"<p>{text}</p>"
    return text, html
