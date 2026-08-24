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
) -> None:
    now = _utc_now()
    try:
        with transaction() as conn:
            conn.execute(
                """
                INSERT INTO subscriptions (
                  id, rinq_user_id, external_subscription_id, external_customer_id,
                  status, price_id, current_period_start, current_period_end,
                  cancel_at_period_end, created_at, updated_at, raw
                ) VALUES (
                  gen_random_uuid(), %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
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
                  raw = EXCLUDED.raw
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
                ),
            )
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
                       current_period_start, current_period_end, cancel_at_period_end, updated_at
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
                "updated_at": _iso(row.get("updated_at")),
            }
            for row in subs
        ],
    }


def try_record_webhook_event(
    *,
    webhook_event_id: str,
    event_type: Optional[str],
    rinq_user_id: Optional[str],
    payload: Optional[Dict[str, Any]],
) -> bool:
    """Return True when recorded (first time); False if duplicate."""
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
