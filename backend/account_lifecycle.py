"""Account lifecycle: export + full delete for a rinq_user_id (Phase 3G)."""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from typing import Any, Callable, Dict, Iterable, List, Optional

import httpx

from identity.context import (
    AuthContext,
    MANAGED_AUTH_PROVIDERS,
)
from identity.migrate import owners_match

logger = logging.getLogger(__name__)

PROVIDER_LABELS = {
    "legacy_password": "Legacy Password",
    "supabase_google": "Google",
    "supabase_email": "Email OTP",
}


def provider_label(provider: str) -> str:
    return PROVIDER_LABELS.get(provider, provider)


def supabase_service_role_configured() -> bool:
    return bool((os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip())


def _iter_json_files(root: str) -> Iterable[str]:
    if not root or not os.path.isdir(root):
        return []
    for dirpath, _, files in os.walk(root):
        for name in files:
            if name.endswith(".json") and not name.startswith("."):
                yield os.path.join(dirpath, name)


def _safe_load(path: str) -> Optional[Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _unlink(path: str) -> bool:
    try:
        if os.path.isfile(path):
            os.remove(path)
            return True
    except OSError as exc:
        logger.warning("[SEC] account_delete_file_failed path=%s err=%s", path, type(exc).__name__)
    return False


def _try_repos():
    try:
        from repositories.wiring import get_repos

        return get_repos()
    except RuntimeError:
        return None


def _redact_billing_for_export(billing: Dict[str, Any]) -> Dict[str, Any]:
    """Billing snapshot without payment anchors / raw Stripe blobs."""
    plan = billing.get("plan") or None
    plan_out = None
    if isinstance(plan, dict):
        plan_out = {
            "plan_code": plan.get("plan_code"),
            "status": plan.get("status"),
            "current_period_end": plan.get("current_period_end"),
            "updated_at": plan.get("updated_at"),
            "has_stripe_customer": bool(plan.get("external_customer_id")),
        }
    subs_out: List[Dict[str, Any]] = []
    for row in billing.get("subscriptions") or []:
        if not isinstance(row, dict):
            continue
        subs_out.append(
            {
                "status": row.get("status"),
                "price_id": row.get("price_id"),
                "current_period_start": row.get("current_period_start"),
                "current_period_end": row.get("current_period_end"),
                "cancel_at_period_end": row.get("cancel_at_period_end"),
                "contract_started_at": row.get("contract_started_at"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
                "has_stripe_customer": bool(row.get("external_customer_id")),
                "has_subscription_ref": bool(row.get("external_subscription_id")),
            }
        )
    return {"plan": plan_out, "subscriptions": subs_out}


def _redact_withdrawal_for_export(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("id"),
        "status": row.get("status"),
        "email_status": row.get("email_status"),
        "refund_status": row.get("refund_status"),
        "contact_email": row.get("contact_email"),
        "note": row.get("note"),
        "received_at": row.get("received_at"),
        "confirmed_at": row.get("confirmed_at"),
        "refund_completed_at": row.get("refund_completed_at"),
        "premium_revoked_at": row.get("premium_revoked_at"),
        "email_sent_at": row.get("email_sent_at"),
        "contract_start_at": row.get("contract_start_at"),
        "failure_reason": row.get("failure_reason"),
        # Stripe payment ids intentionally omitted from self-service export
    }


def _load_postgres_userdata(user: AuthContext) -> Dict[str, Any]:
    """Load profile/rewards/sessions/grants/billing from Postgres when that is SoT."""
    from db.pool import connection
    from repositories.pg_mapping import merge_profile_row, merge_reward_row, merge_session_row

    rid = user.rinq_user_id
    out: Dict[str, Any] = {
        "profile": None,
        "rewards": None,
        "sessions": [],
        "entitlement_grants": [],
        "billing": None,
        "withdrawals": [],
    }
    with connection() as conn:
        prow = conn.execute(
            """
            SELECT rinq_user_id::text, display_name, display_name_chosen,
                   payload, updated_at
            FROM profiles WHERE rinq_user_id = %s::uuid
            """,
            (rid,),
        ).fetchone()
        if prow:
            out["profile"] = merge_profile_row(prow)

        rrow = conn.execute(
            """
            SELECT rinq_user_id::text, xp, pux, progression_pux_granted,
                   payload, bootstrap_completed_at, last_updated_at
            FROM reward_states WHERE rinq_user_id = %s::uuid
            """,
            (rid,),
        ).fetchone()
        if rrow:
            from repositories.json_reward import merge_reward_state

            out["rewards"] = merge_reward_state(merge_reward_row(rrow))

        srows = conn.execute(
            """
            SELECT session_id, rinq_user_id, state, module_id, drill_id,
                   observation_scope, learning_area, lab_mode, session_method,
                   focus, observed_team, is_dummy, current_phase,
                   created_at, updated_at, completed_at, payload
            FROM sessions
            WHERE rinq_user_id = %s::uuid
            ORDER BY created_at DESC
            """,
            (rid,),
        ).fetchall()
        out["sessions"] = [merge_session_row(r) for r in srows]

    repos = _try_repos()
    if repos is not None:
        grants = repos.entitlements.list_user_entitlements(rid)
        out["entitlement_grants"] = [
            {
                "feature_key": g.get("feature_key"),
                "status": g.get("status"),
                "source": g.get("source"),
                "granted_at": g.get("created_at"),
                "updated_at": g.get("updated_at"),
                "expires_at": g.get("expires_at"),
            }
            for g in grants
            if isinstance(g, dict)
        ]

    try:
        from billing.persistence import get_billing_status

        out["billing"] = _redact_billing_for_export(get_billing_status(rid))
    except Exception as exc:
        logger.warning("[SEC] account_export_billing_failed err=%s", type(exc).__name__)

    try:
        from billing.withdrawal_store import list_withdrawals_for_user

        out["withdrawals"] = [
            _redact_withdrawal_for_export(w) for w in list_withdrawals_for_user(rid)
        ]
    except Exception as exc:
        logger.warning("[SEC] account_export_withdrawals_failed err=%s", type(exc).__name__)

    return out


def collect_export(
    user: AuthContext,
    *,
    profiles_dir: str,
    rewards_dir: str,
    sessions_dir: str,
    scenes_dir: str,
    obs_runs_dir: str,
    obs_entries_dir: str,
    obs_players_dir: str,
    avatars_dir: str,
    identity_store: Any,
) -> Dict[str, Any]:
    """Build a JSON-serializable export for the authenticated user only."""
    rid = user.rinq_user_id
    legacy = user.legacy_username

    def owned(resource_user: str) -> bool:
        return owners_match(resource_user or "", user.rinq_user_id, user.legacy_username)

    profile = None
    profile_path = os.path.join(profiles_dir, f"{rid}.json")
    if os.path.isfile(profile_path):
        profile = _safe_load(profile_path)
    elif legacy:
        legacy_profile = os.path.join(profiles_dir, f"{legacy}.json")
        if os.path.isfile(legacy_profile):
            profile = _safe_load(legacy_profile)

    rewards = None
    reward_path = os.path.join(rewards_dir, f"{rid}.json")
    if os.path.isfile(reward_path):
        rewards = _safe_load(reward_path)
    elif legacy:
        legacy_reward = os.path.join(rewards_dir, f"{legacy}.json")
        if os.path.isfile(legacy_reward):
            rewards = _safe_load(legacy_reward)

    sessions: List[Any] = []
    for path in _iter_json_files(sessions_dir):
        data = _safe_load(path)
        if not isinstance(data, dict):
            continue
        if owned(str(data.get("user") or "")) or owned(str(data.get("created_by") or "")):
            sessions.append(data)

    scenes: List[Any] = []
    for path in _iter_json_files(scenes_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            scenes.append(data)

    observations = {"runs": [], "entries": [], "player_profiles": []}
    for path in _iter_json_files(obs_runs_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["runs"].append(data)
    for path in _iter_json_files(obs_entries_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["entries"].append(data)
    for path in _iter_json_files(obs_players_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["player_profiles"].append(data)

    avatars: List[str] = []
    if os.path.isdir(avatars_dir):
        prefix = f"{rid}_"
        legacy_prefix = f"{legacy}_" if legacy else None
        for name in os.listdir(avatars_dir):
            if name.startswith(prefix) or (legacy_prefix and name.startswith(legacy_prefix)):
                avatars.append(name)

    list_links = getattr(identity_store, "list_links_for_user", None) or getattr(
        identity_store, "list_auth_links_for_user", None
    )
    links = list_links(rid) if callable(list_links) else []
    auth_providers = [
        {
            "provider": link.get("provider"),
            "label": provider_label(str(link.get("provider") or "")),
            "linked_at": link.get("linked_at"),
            # Never export provider_subject (Supabase UUID)
        }
        for link in links
    ]

    storage_backend = "json"
    entitlement_grants: List[Dict[str, Any]] = []
    billing = None
    withdrawals: List[Dict[str, Any]] = []

    repos = _try_repos()
    if repos is not None and getattr(repos, "backend", None) == "postgres":
        storage_backend = "postgres"
        pg = _load_postgres_userdata(user)
        if pg.get("profile") is not None:
            profile = pg["profile"]
        if pg.get("rewards") is not None:
            rewards = pg["rewards"]
        if pg.get("sessions"):
            sessions = pg["sessions"]
        entitlement_grants = pg.get("entitlement_grants") or []
        billing = pg.get("billing")
        withdrawals = pg.get("withdrawals") or []

    return {
        "export_version": 2,
        "exported_at": date.today().isoformat(),
        "storage_backend": storage_backend,
        "rinq_user_id": rid,
        "display_name": user.display_name,
        "auth_providers": auth_providers,
        "profile": profile,
        "rewards": rewards,
        "sessions": sessions,
        "scenes": scenes,
        "observations": observations,
        "avatar_files": avatars,
        "entitlement_grants": entitlement_grants,
        "billing": billing,
        "withdrawals": withdrawals,
        "settings": {
            "auth_provider_active": user.auth_provider,
            "legacy_username": legacy,
        },
    }


def export_filename() -> str:
    return f"rinq-user-export-{date.today().isoformat()}.json"


def delete_supabase_auth_user(supabase_user_id: str) -> None:
    """Admin API delete. Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server only)."""
    base = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not base or not key:
        raise RuntimeError("supabase_service_role_not_configured")
    url = f"{base}/auth/v1/admin/users/{supabase_user_id}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }
    with httpx.Client(timeout=30.0) as client:
        res = client.delete(url, headers=headers)
    if res.status_code in (200, 204, 404):
        return
    raise RuntimeError(f"supabase_admin_delete_failed status={res.status_code}")


def delete_account(
    user: AuthContext,
    *,
    identity_store: Any,
    profiles_dir: str,
    rewards_dir: str,
    sessions_dir: str,
    scenes_dir: str,
    obs_runs_dir: str,
    obs_entries_dir: str,
    obs_players_dir: str,
    avatars_dir: str,
    users_file: str,
    remove_legacy_user_row: Callable[[str], bool],
) -> Dict[str, Any]:
    """Full account deletion cascade. Returns a summary (no secrets)."""
    rid = user.rinq_user_id
    list_links = getattr(identity_store, "list_links_for_user", None) or getattr(
        identity_store, "list_auth_links_for_user", None
    )
    links = list_links(rid) if callable(list_links) else []
    managed_subjects = [
        str(link.get("provider_subject") or "")
        for link in links
        if link.get("provider") in MANAGED_AUTH_PROVIDERS and link.get("provider_subject")
    ]
    if managed_subjects and not supabase_service_role_configured():
        raise RuntimeError("supabase_service_role_required")

    deleted: Dict[str, Any] = {
        "profiles": 0,
        "rewards": 0,
        "sessions": 0,
        "scenes": 0,
        "observation_runs": 0,
        "observation_entries": 0,
        "observation_profiles": 0,
        "avatars": 0,
        "legacy_user_row": False,
        "auth_links": 0,
        "supabase_users": 0,
        "supabase_errors": [],
        "stripe": None,
        "competency_events": 0,
        "competency_states": 0,
    }

    def owned(resource_user: str) -> bool:
        return owners_match(resource_user or "", user.rinq_user_id, user.legacy_username)

    # --- Stripe (before dropping local billing rows via CASCADE) ---
    from billing.account_cleanup import detach_stripe_billing_for_user

    deleted["stripe"] = detach_stripe_billing_for_user(rid)

    # --- local userdata (JSON leftovers; PG CASCADE handles relational rows) ---
    for path in (
        os.path.join(profiles_dir, f"{rid}.json"),
        os.path.join(profiles_dir, f"{user.legacy_username}.json") if user.legacy_username else "",
    ):
        if path and _unlink(path):
            deleted["profiles"] += 1

    for path in (
        os.path.join(rewards_dir, f"{rid}.json"),
        os.path.join(rewards_dir, f"{user.legacy_username}.json") if user.legacy_username else "",
    ):
        if path and _unlink(path):
            deleted["rewards"] += 1

    for path in list(_iter_json_files(sessions_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and (
            owned(str(data.get("user") or "")) or owned(str(data.get("created_by") or ""))
        ):
            if _unlink(path):
                deleted["sessions"] += 1

    for path in list(_iter_json_files(scenes_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["scenes"] += 1

    for path in list(_iter_json_files(obs_runs_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_runs"] += 1

    for path in list(_iter_json_files(obs_entries_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_entries"] += 1

    for path in list(_iter_json_files(obs_players_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_profiles"] += 1

    if os.path.isdir(avatars_dir):
        prefix = f"{rid}_"
        legacy_prefix = f"{user.legacy_username}_" if user.legacy_username else None
        for name in list(os.listdir(avatars_dir)):
            if name.startswith(prefix) or (legacy_prefix and name.startswith(legacy_prefix)):
                if _unlink(os.path.join(avatars_dir, name)):
                    deleted["avatars"] += 1

    if user.legacy_username:
        deleted["legacy_user_row"] = bool(remove_legacy_user_row(user.legacy_username))

    # --- managed auth (before dropping auth_links / identity) ---
    for subject in managed_subjects:
        try:
            delete_supabase_auth_user(subject)
            deleted["supabase_users"] += 1
        except Exception as exc:
            msg = type(exc).__name__
            deleted["supabase_errors"].append(msg)
            logger.error(
                "[SEC] account_delete_supabase_failed rinq=%s err=%s",
                rid,
                msg,
            )

    if deleted["supabase_errors"]:
        raise RuntimeError("supabase_cleanup_incomplete")

    # --- identity (all links) → PG CASCADE for app userdata ---
    repos = _try_repos()
    if repos is not None:
        deleted["competency_events"] = repos.competency_events.delete_for_user(user)
        deleted["competency_states"] = repos.competency_states.delete_for_user(user)

    snapshot = identity_store.delete_identity_cascade(rid)
    deleted["auth_links"] = len(snapshot.get("auth_links") or [])

    return deleted
