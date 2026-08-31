"""Privacy-first operational admin queries. Callers must pass the admin guard."""
from __future__ import annotations
import os
from datetime import datetime
from typing import Any, Optional
from db.pool import connection, transaction
from repositories.wiring import get_repos


def _iso(value: Any) -> Optional[str]:
    return None if value is None else (value.isoformat() if isinstance(value, datetime) else str(value))


def _pg() -> bool:
    return get_repos().backend == "postgres"


def audit(admin_id: str, action: str, target: str, result: str) -> None:
    if not _pg(): return
    with transaction() as conn:
        conn.execute("INSERT INTO admin_audit_log (admin_user_id,action,target_reference,result) VALUES (%s::uuid,%s,%s,%s)", (admin_id, action, target[:200], result[:500]))


def overview():
    if not _pg():
        return {"storage":"json","users":None,"active_premium":None,"open_withdrawals":None,"manual_review":None,"failed_mails":None,"billing_issues":None}
    with connection() as conn:
        row=conn.execute("""SELECT
          (SELECT count(*) FROM app_users) users,
          (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing')) active_premium,
          (SELECT count(*) FROM withdrawal_requests WHERE status NOT IN ('completed','outside_window')) open_withdrawals,
          (SELECT count(*) FROM withdrawal_requests WHERE status='manual_review') manual_review,
          (SELECT count(*) FROM withdrawal_requests WHERE email_status IN ('failed','confirm_failed') OR refund_email_status='failed') failed_mails,
          (SELECT count(*) FROM subscriptions s LEFT JOIN entitlements e USING(rinq_user_id) WHERE s.status NOT IN ('active','trialing') OR e.status IS DISTINCT FROM s.status) billing_issues""").fetchone()
    return {"storage":"postgres",**dict(row)}


def search_users(query: str, limit: int=25):
    """Search identifiers only. Email is deliberately neither stored nor queried."""
    q=query.strip()
    if not q or not _pg(): return []
    like=f"%{q}%"
    with connection() as conn:
        rows=conn.execute("""SELECT u.rinq_user_id::text,u.created_at,u.status,u.legacy_username,p.display_name,
          e.external_customer_id,array_remove(array_agg(DISTINCT l.provider),NULL) providers,
          array_remove(array_agg(DISTINCT s.external_subscription_id),NULL) subscription_ids
          FROM app_users u LEFT JOIN profiles p USING(rinq_user_id)
          LEFT JOIN auth_links l USING(rinq_user_id) LEFT JOIN entitlements e USING(rinq_user_id)
          LEFT JOIN subscriptions s USING(rinq_user_id)
          WHERE u.rinq_user_id::text ILIKE %s OR COALESCE(u.legacy_username,'') ILIKE %s
             OR COALESCE(l.provider_subject,'') ILIKE %s OR COALESCE(e.external_customer_id,'') ILIKE %s
             OR COALESCE(s.external_subscription_id,'') ILIKE %s
          GROUP BY u.rinq_user_id,u.created_at,u.status,u.legacy_username,p.display_name,e.external_customer_id
          ORDER BY u.created_at DESC LIMIT %s""",(like,like,like,like,like,limit)).fetchall()
    return [{**dict(r),"created_at":_iso(r.get("created_at"))} for r in rows]


def user_detail(user_id: str):
    if not _pg(): return None
    with connection() as conn:
        user=conn.execute("SELECT u.rinq_user_id::text,u.created_at,u.status,u.legacy_username,p.display_name,p.updated_at profile_updated_at FROM app_users u LEFT JOIN profiles p USING(rinq_user_id) WHERE u.rinq_user_id=%s::uuid",(user_id,)).fetchone()
        if not user: return None
        links=conn.execute("SELECT provider,linked_at FROM auth_links WHERE rinq_user_id=%s::uuid ORDER BY linked_at",(user_id,)).fetchall()
        bills=conn.execute("SELECT external_subscription_id,external_customer_id,status,price_id,current_period_start,current_period_end,cancel_at_period_end,updated_at FROM subscriptions WHERE rinq_user_id=%s::uuid ORDER BY updated_at DESC",(user_id,)).fetchall()
        prog=conn.execute("SELECT count(*) total,count(*) FILTER(WHERE state='COMPLETED') completed,max(updated_at) last_save FROM sessions WHERE rinq_user_id=%s::uuid",(user_id,)).fetchone()
    account={**dict(user),"created_at":_iso(user.get("created_at")),"profile_updated_at":_iso(user.get("profile_updated_at")),"providers":[{"provider":r["provider"],"linked_at":_iso(r["linked_at"])} for r in links]}
    billing=[{**dict(r),"current_period_start":_iso(r.get("current_period_start")),"current_period_end":_iso(r.get("current_period_end")),"updated_at":_iso(r.get("updated_at"))} for r in bills]
    return {"account":account,"billing":billing,"progress":{**dict(prog),"last_save":_iso(prog.get("last_save"))}}


def withdrawals(status: Optional[str]=None,limit:int=100):
    if not _pg(): return []
    where,args=("WHERE status=%s",[status]) if status else ("",[])
    with connection() as conn:
        rows=conn.execute(f"""SELECT id::text,rinq_user_id::text,received_at,status,refund_status,email_status,
          refund_email_status,failure_reason,stripe_subscription_id,stripe_invoice_id,
          stripe_payment_intent_id,stripe_refund_id,premium_revoked_at,errors,
          (contact_email IS NOT NULL) contact_email_present
          FROM withdrawal_requests {where} ORDER BY received_at DESC LIMIT %s""",(*args,limit)).fetchall()
    return [{**dict(r),"received_at":_iso(r.get("received_at")),"premium_revoked_at":_iso(r.get("premium_revoked_at"))} for r in rows]


def billing_issues(limit:int=100):
    if not _pg(): return []
    with connection() as conn:
        rows=conn.execute("""SELECT s.rinq_user_id::text,s.external_subscription_id,s.external_customer_id,
          s.status stripe_status,s.price_id,s.current_period_end,s.updated_at,e.status local_status
          FROM subscriptions s LEFT JOIN entitlements e USING(rinq_user_id)
          WHERE s.status NOT IN ('active','trialing') OR e.status IS DISTINCT FROM s.status
          ORDER BY s.updated_at DESC LIMIT %s""",(limit,)).fetchall()
    return [{**dict(r),"current_period_end":_iso(r.get("current_period_end")),"updated_at":_iso(r.get("updated_at"))} for r in rows]


def operational_errors(limit:int=150):
    """Actionable cases only, with internal references and no contact email."""
    if not _pg(): return []
    with connection() as conn:
        rows=conn.execute("""SELECT * FROM (
          SELECT received_at occurred_at,'withdrawal' type,rinq_user_id::text,
                 id::text reference,status,COALESCE(failure_reason,'manual_review') cause
          FROM withdrawal_requests WHERE status='manual_review'
             OR refund_status IN ('failed','manual_review')
          UNION ALL
          SELECT received_at,'mail',rinq_user_id::text,id::text,
                 CASE WHEN email_status IN ('failed','confirm_failed') THEN email_status ELSE refund_email_status END,
                 COALESCE(failure_reason,'transactional_mail_failed')
          FROM withdrawal_requests WHERE email_status IN ('failed','confirm_failed') OR refund_email_status='failed'
          UNION ALL
          SELECT s.updated_at,'billing',s.rinq_user_id::text,s.external_subscription_id,
                 s.status,CASE WHEN e.status IS DISTINCT FROM s.status THEN 'local_stripe_status_mismatch' ELSE 'subscription_requires_attention' END
          FROM subscriptions s LEFT JOIN entitlements e USING(rinq_user_id)
          WHERE s.status IN ('past_due','incomplete','unpaid') OR e.status IS DISTINCT FROM s.status
        ) errors ORDER BY occurred_at DESC NULLS LAST LIMIT %s""",(limit,)).fetchall()
    return [{**dict(r),"occurred_at":_iso(r.get("occurred_at"))} for r in rows]


def audit_entries(limit:int=100):
    if not _pg(): return []
    with connection() as conn:
        rows=conn.execute("SELECT id::text,admin_user_id::text,action,target_reference,result,created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT %s",(limit,)).fetchall()
    return [{**dict(r),"created_at":_iso(r.get("created_at"))} for r in rows]


def system_status():
    from mail import mail_configured
    out={"app_version":os.getenv("APP_VERSION","1.0.0"),"git_commit":os.getenv("GIT_COMMIT") or os.getenv("SOURCE_COMMIT"),"environment":os.getenv("APP_ENV","unknown"),"storage":get_repos().backend,"smtp_configured":mail_configured(),"stripe_configured":bool(os.getenv("STRIPE_SECRET_KEY")),"database_reachable":None,"last_stripe_webhook":None,"last_transactional_mail":None,"failed_mails":None,"webhook_failure_history_available":False}
    if not _pg(): return out
    with connection() as conn:
        ok=conn.execute("SELECT 1 ok").fetchone()
        event=conn.execute("SELECT event_type,processed_at FROM processed_webhook_events ORDER BY processed_at DESC LIMIT 1").fetchone()
        mail=conn.execute("""SELECT GREATEST(max(email_sent_at),max(refund_email_sent_at)) last_mail,
          count(*) FILTER(WHERE email_status IN ('failed','confirm_failed') OR refund_email_status='failed') failed
          FROM withdrawal_requests""").fetchone()
    out["database_reachable"]=bool(ok)
    out["last_stripe_webhook"]={"event_type":event["event_type"],"at":_iso(event["processed_at"])} if event else None
    out["last_transactional_mail"]=_iso(mail.get("last_mail")) if mail else None
    out["failed_mails"]=int(mail.get("failed") or 0) if mail else 0
    return out
