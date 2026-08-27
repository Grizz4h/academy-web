"""Compatibility re-exports — prefer mail.send_transactional_mail."""

from mail import (  # noqa: F401
    MSG_TEST,
    MSG_WITHDRAWAL_CONFIRM_LINK,
    MSG_WITHDRAWAL_RECEIPT,
    mail_configured,
    send_transactional_mail,
    smtp_from_address,
)


def send_plain_email(*, to: str, subject: str, body: str):
    result = send_transactional_mail(
        recipient=to,
        subject=subject,
        text_body=body,
        message_type="legacy_plain",
    )
    return result.ok, result.error
