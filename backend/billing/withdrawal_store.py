"""Postgres persistence for withdrawal_requests (source of truth)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from repositories.errors import StorageError

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def _row_to_dict(row: Dict[str, Any]) -> Dict[str, Any]:
    errors = row.get("errors")
    if not isinstance(errors, list):
        errors = []
    return {
        "id": str(row["id"]),
        "rinq_user_id": str(row["rinq_user_id"]) if row.get("rinq_user_id") else None,
        "display_name": row.get("display_name"),
        "contact_email": row.get("contact_email"),
        "note": row.get("note"),
        "status": row.get("status"),
        "email_status": row.get("email_status"),
        "refund_status": row.get("refund_status"),
        "external_customer_id": row.get("stripe_customer_id"),
        "external_subscription_id": row.get("stripe_subscription_id"),
        "stripe_customer_id": row.get("stripe_customer_id"),
        "stripe_subscription_id": row.get("stripe_subscription_id"),
        "stripe_checkout_session_id": row.get("stripe_checkout_session_id"),
        "stripe_invoice_id": row.get("stripe_invoice_id"),
        "stripe_payment_intent_id": row.get("stripe_payment_intent_id"),
        "stripe_charge_id": row.get("stripe_charge_id"),
        "stripe_refund_id": row.get("stripe_refund_id"),
        "confirm_token": row.get("confirm_token"),
        "contract_start_at": _iso(row.get("contract_start_at")),
        "received_at": _iso(row.get("received_at")),
        "confirmed_at": _iso(row.get("confirmed_at")),
        "refund_requested_at": _iso(row.get("refund_requested_at")),
        "refund_completed_at": _iso(row.get("refund_completed_at")),
        "premium_revoked_at": _iso(row.get("premium_revoked_at")),
        "email_sent_at": _iso(row.get("email_sent_at")),
        "refund_email_status": row.get("refund_email_status") or "pending",
        "refund_email_sent_at": _iso(row.get("refund_email_sent_at")),
        "failure_reason": row.get("failure_reason"),
        "errors": errors,
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def insert_withdrawal(fields: Dict[str, Any]) -> Dict[str, Any]:
    now = _utc_now()
    try:
        with transaction() as conn:
            row = conn.execute(
                """
                INSERT INTO withdrawal_requests (
                  id, rinq_user_id, display_name, contact_email, note,
                  status, email_status, refund_status,
                  stripe_customer_id, stripe_subscription_id,
                  stripe_checkout_session_id, stripe_invoice_id,
                  stripe_payment_intent_id, stripe_charge_id,
                  confirm_token, contract_start_at, received_at,
                  created_at, updated_at, errors
                ) VALUES (
                  COALESCE(%s::uuid, gen_random_uuid()),
                  %s::uuid, %s, %s, %s,
                  %s, %s, %s,
                  %s, %s, %s, %s, %s, %s,
                  %s, %s, %s,
                  %s, %s, %s
                )
                RETURNING *
                """,
                (
                    fields.get("id"),
                    fields.get("rinq_user_id"),
                    fields.get("display_name"),
                    fields["contact_email"],
                    fields.get("note"),
                    fields.get("status") or "received",
                    fields.get("email_status") or "pending",
                    fields.get("refund_status") or "pending",
                    fields.get("stripe_customer_id"),
                    fields.get("stripe_subscription_id"),
                    fields.get("stripe_checkout_session_id"),
                    fields.get("stripe_invoice_id"),
                    fields.get("stripe_payment_intent_id"),
                    fields.get("stripe_charge_id"),
                    fields.get("confirm_token"),
                    fields.get("contract_start_at"),
                    fields.get("received_at") or now,
                    now,
                    now,
                    Jsonb(fields.get("errors") or []),
                ),
            ).fetchone()
            return _row_to_dict(dict(row))
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def get_withdrawal(row_id: str) -> Optional[Dict[str, Any]]:
    try:
        with connection() as conn:
            row = conn.execute(
                "SELECT * FROM withdrawal_requests WHERE id = %s::uuid",
                (row_id,),
            ).fetchone()
            return _row_to_dict(dict(row)) if row else None
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def get_withdrawal_by_confirm_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        with connection() as conn:
            row = conn.execute(
                "SELECT * FROM withdrawal_requests WHERE confirm_token = %s",
                (token,),
            ).fetchone()
            return _row_to_dict(dict(row)) if row else None
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def list_withdrawals_for_user(rinq_user_id: str) -> List[Dict[str, Any]]:
    """Withdrawals owned by rinq_user_id (for account export)."""
    try:
        with connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM withdrawal_requests
                WHERE rinq_user_id = %s::uuid
                ORDER BY received_at DESC
                """,
                (rinq_user_id,),
            ).fetchall()
            return [_row_to_dict(dict(r)) for r in rows]
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def find_active_for_subscription(subscription_id: str) -> Optional[Dict[str, Any]]:
    try:
        with connection() as conn:
            row = conn.execute(
                """
                SELECT * FROM withdrawal_requests
                WHERE stripe_subscription_id = %s
                  AND status NOT IN ('completed', 'outside_window')
                ORDER BY received_at DESC
                LIMIT 1
                """,
                (subscription_id,),
            ).fetchone()
            return _row_to_dict(dict(row)) if row else None
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def update_withdrawal(row_id: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not patch:
        return get_withdrawal(row_id)
    allowed = {
        "status",
        "email_status",
        "refund_status",
        "stripe_refund_id",
        "stripe_invoice_id",
        "stripe_payment_intent_id",
        "stripe_charge_id",
        "stripe_checkout_session_id",
        "confirm_token",
        "confirmed_at",
        "refund_requested_at",
        "refund_completed_at",
        "premium_revoked_at",
        "email_sent_at",
        "refund_email_status",
        "refund_email_sent_at",
        "failure_reason",
        "errors",
        "display_name",
        "contact_email",
        "note",
    }
    cols = []
    vals: List[Any] = []
    for key, value in patch.items():
        if key not in allowed:
            continue
        cols.append(f"{key} = %s")
        if key == "errors":
            vals.append(Jsonb(value if isinstance(value, list) else []))
        else:
            vals.append(value)
    if not cols:
        return get_withdrawal(row_id)
    cols.append("updated_at = %s")
    vals.append(_utc_now())
    vals.append(row_id)
    try:
        with transaction() as conn:
            row = conn.execute(
                f"""
                UPDATE withdrawal_requests
                SET {', '.join(cols)}
                WHERE id = %s::uuid
                RETURNING *
                """,
                tuple(vals),
            ).fetchone()
            return _row_to_dict(dict(row)) if row else None
    except Exception as exc:
        raise StorageError(str(exc)) from exc
