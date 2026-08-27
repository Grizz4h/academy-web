"""Persist Stripe subscription + plan snapshot rows (001 tables)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from repositories.errors import StorageError


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def upsert_plan_entitlement(
    *,
    rinq_user_id: str,
    external_customer_id: Optional[str],
    plan_code: Optional[str],
    status: str,
    current_period_end: Optional[datetime],
) -> None:
    """Legacy entitlements table — billing snapshot per user (not product gates)."""
    now = _utc_now()
    try:
        with transaction() as conn:
            conn.execute(
                """
                INSERT INTO entitlements (
                  rinq_user_id, plan_code, status, external_customer_id,
                  current_period_end, updated_at
                ) VALUES (%s::uuid, %s, %s, %s, %s, %s)
                ON CONFLICT (rinq_user_id) DO UPDATE SET
                  plan_code = EXCLUDED.plan_code,
                  status = EXCLUDED.status,
                  external_customer_id = COALESCE(EXCLUDED.external_customer_id, entitlements.external_customer_id),
                  current_period_end = EXCLUDED.current_period_end,
                  updated_at = EXCLUDED.updated_at
                """,
                (
                    rinq_user_id,
                    plan_code,
                    status,
                    external_customer_id,
                    current_period_end,
                    now,
                ),
            )
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def upsert_subscription_row(
    *,
    rinq_user_id: str,
    external_subscription_id: str,
    external_customer_id: Optional[str],
    status: str,
    price_id: Optional[str],
    current_period_start: Optional[datetime],
    current_period_end: Optional[datetime],
    cancel_at_period_end: bool,
    raw: Dict[str, Any],
    checkout_session_id: Optional[str] = None,
    initial_invoice_id: Optional[str] = None,
    initial_payment_intent_id: Optional[str] = None,
    initial_charge_id: Optional[str] = None,
    contract_started_at: Optional[datetime] = None,
) -> None:
    now = _utc_now()
    try:
        with transaction() as conn:
            conn.execute(
                """
                INSERT INTO subscriptions (
                  id, rinq_user_id, external_subscription_id, external_customer_id,
                  status, price_id, current_period_start, current_period_end,
                  cancel_at_period_end, created_at, updated_at, raw,
                  checkout_session_id, initial_invoice_id, initial_payment_intent_id,
                  initial_charge_id, contract_started_at
                ) VALUES (
                  gen_random_uuid(), %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s
                )
                ON CONFLICT (external_subscription_id) DO UPDATE SET
                  rinq_user_id = EXCLUDED.rinq_user_id,
                  external_customer_id = EXCLUDED.external_customer_id,
                  status = EXCLUDED.status,
                  price_id = EXCLUDED.price_id,
                  current_period_start = EXCLUDED.current_period_start,
                  current_period_end = EXCLUDED.current_period_end,
                  cancel_at_period_end = EXCLUDED.cancel_at_period_end,
                  updated_at = EXCLUDED.updated_at,
                  raw = EXCLUDED.raw,
                  checkout_session_id = COALESCE(
                    EXCLUDED.checkout_session_id, subscriptions.checkout_session_id
                  ),
                  initial_invoice_id = COALESCE(
                    EXCLUDED.initial_invoice_id, subscriptions.initial_invoice_id
                  ),
                  initial_payment_intent_id = COALESCE(
                    EXCLUDED.initial_payment_intent_id, subscriptions.initial_payment_intent_id
                  ),
                  initial_charge_id = COALESCE(
                    EXCLUDED.initial_charge_id, subscriptions.initial_charge_id
                  ),
                  contract_started_at = COALESCE(
                    EXCLUDED.contract_started_at, subscriptions.contract_started_at
                  )
                """,
                (
                    rinq_user_id,
                    external_subscription_id,
                    external_customer_id,
                    status,
                    price_id,
                    current_period_start,
                    current_period_end,
                    cancel_at_period_end,
                    now,
                    now,
                    Jsonb(raw),
                    checkout_session_id,
                    initial_invoice_id,
                    initial_payment_intent_id,
                    initial_charge_id,
                    contract_started_at,
                ),
            )
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def set_subscription_payment_refs(
    *,
    external_subscription_id: str,
    checkout_session_id: Optional[str] = None,
    initial_invoice_id: Optional[str] = None,
    initial_payment_intent_id: Optional[str] = None,
    initial_charge_id: Optional[str] = None,
    contract_started_at: Optional[datetime] = None,
) -> bool:
    """Set payment anchors only when currently NULL (never overwrite a known initial payment)."""
    now = _utc_now()
    try:
        with transaction() as conn:
            cur = conn.execute(
                """
                UPDATE subscriptions SET
                  checkout_session_id = COALESCE(checkout_session_id, %s),
                  initial_invoice_id = COALESCE(initial_invoice_id, %s),
                  initial_payment_intent_id = COALESCE(initial_payment_intent_id, %s),
                  initial_charge_id = COALESCE(initial_charge_id, %s),
                  contract_started_at = COALESCE(contract_started_at, %s),
                  updated_at = %s
                WHERE external_subscription_id = %s
                """,
                (
                    checkout_session_id,
                    initial_invoice_id,
                    initial_payment_intent_id,
                    initial_charge_id,
                    contract_started_at,
                    now,
                    external_subscription_id,
                ),
            )
            return cur.rowcount > 0
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def get_subscription_by_external_id(external_subscription_id: str) -> Optional[Dict[str, Any]]:
    try:
        with connection() as conn:
            row = conn.execute(
                """
                SELECT external_subscription_id, rinq_user_id, status, price_id,
                       external_customer_id, current_period_start, current_period_end,
                       cancel_at_period_end, created_at, updated_at,
                       checkout_session_id, initial_invoice_id, initial_payment_intent_id,
                       initial_charge_id, contract_started_at, raw
                FROM subscriptions
                WHERE external_subscription_id = %s
                """,
                (external_subscription_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "external_subscription_id": row.get("external_subscription_id"),
                "rinq_user_id": str(row["rinq_user_id"]) if row.get("rinq_user_id") else None,
                "status": row.get("status"),
                "price_id": row.get("price_id"),
                "external_customer_id": row.get("external_customer_id"),
                "current_period_start": _iso(row.get("current_period_start")),
                "current_period_end": _iso(row.get("current_period_end")),
                "cancel_at_period_end": bool(row.get("cancel_at_period_end")),
                "created_at": _iso(row.get("created_at")),
                "updated_at": _iso(row.get("updated_at")),
                "checkout_session_id": row.get("checkout_session_id"),
                "initial_invoice_id": row.get("initial_invoice_id"),
                "initial_payment_intent_id": row.get("initial_payment_intent_id"),
                "initial_charge_id": row.get("initial_charge_id"),
                "contract_started_at": _iso(row.get("contract_started_at")),
                "raw": row.get("raw") if isinstance(row.get("raw"), dict) else {},
            }
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def get_billing_status(rinq_user_id: str) -> Dict[str, Any]:
    try:
        with connection() as conn:
            plan = conn.execute(
                """
                SELECT plan_code, status, external_customer_id, current_period_end, updated_at
                FROM entitlements WHERE rinq_user_id = %s::uuid
                """,
                (rinq_user_id,),
            ).fetchone()
            subs = conn.execute(
                """
                SELECT external_subscription_id, status, price_id, external_customer_id,
                       current_period_start, current_period_end, cancel_at_period_end,
                       created_at, updated_at,
                       checkout_session_id, initial_invoice_id, initial_payment_intent_id,
                       initial_charge_id, contract_started_at
                FROM subscriptions
                WHERE rinq_user_id = %s::uuid
                ORDER BY updated_at DESC
                LIMIT 5
                """,
                (rinq_user_id,),
            ).fetchall()
    except Exception as exc:
        raise StorageError(str(exc)) from exc

    return {
        "plan": None
        if not plan
        else {
            "plan_code": plan.get("plan_code"),
            "status": plan.get("status"),
            "external_customer_id": plan.get("external_customer_id"),
            "current_period_end": _iso(plan.get("current_period_end")),
            "updated_at": _iso(plan.get("updated_at")),
        },
        "subscriptions": [
            {
                "external_subscription_id": row.get("external_subscription_id"),
                "status": row.get("status"),
                "price_id": row.get("price_id"),
                "external_customer_id": row.get("external_customer_id"),
                "current_period_start": _iso(row.get("current_period_start")),
                "current_period_end": _iso(row.get("current_period_end")),
                "cancel_at_period_end": bool(row.get("cancel_at_period_end")),
                "created_at": _iso(row.get("created_at")),
                "updated_at": _iso(row.get("updated_at")),
                "checkout_session_id": row.get("checkout_session_id"),
                "initial_invoice_id": row.get("initial_invoice_id"),
                "initial_payment_intent_id": row.get("initial_payment_intent_id"),
                "initial_charge_id": row.get("initial_charge_id"),
                "contract_started_at": _iso(row.get("contract_started_at")),
            }
            for row in subs
        ],
    }


def webhook_event_seen(webhook_event_id: str) -> bool:
    """True if this Stripe event id was already processed successfully."""
    if not webhook_event_id:
        return False
    try:
        with connection() as conn:
            row = conn.execute(
                """
                SELECT 1 FROM processed_webhook_events
                WHERE webhook_event_id = %s
                LIMIT 1
                """,
                (webhook_event_id,),
            ).fetchone()
            return bool(row)
    except Exception as exc:
        raise StorageError(str(exc)) from exc


def try_record_webhook_event(
    *,
    webhook_event_id: str,
    event_type: Optional[str],
    rinq_user_id: Optional[str],
    payload: Optional[Dict[str, Any]],
) -> bool:
    """Return True when recorded (first time); False if duplicate.

    Call **after** successful sync so Stripe retries still re-run on mid-handler failure.
    """
    now = _utc_now()
    try:
        with transaction() as conn:
            cur = conn.execute(
                """
                INSERT INTO processed_webhook_events (
                  webhook_event_id, provider, event_type, processed_at,
                  rinq_user_id, payload
                ) VALUES (%s, 'stripe', %s, %s, %s::uuid, %s)
                ON CONFLICT (webhook_event_id) DO NOTHING
                """,
                (
                    webhook_event_id,
                    event_type,
                    now,
                    rinq_user_id,
                    Jsonb(payload or {}),
                ),
            )
            return cur.rowcount > 0
    except Exception as exc:
        raise StorageError(str(exc)) from exc
