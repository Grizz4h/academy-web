import json
import os
import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo


def _safe_slug(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[^a-zA-Z0-9_-]+", "_", s)
    s = re.sub(r"_+", "_", s)
    return s.strip("_") or "NA"


SESSIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'academy', 'sessions')
os.makedirs(SESSIONS_DIR, exist_ok=True)


def _parse_created_at(created_at: str | None) -> datetime:
    if created_at:
        try:
            return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(ZoneInfo("Europe/Berlin"))


def _build_session_path(session_id: str, created_at: str | None) -> str:
    dt = _parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return os.path.join(SESSIONS_DIR, year, month, f"{session_id}.json")


def _find_session_path(session_id: str) -> str | None:
    target = f"{session_id}.json"
    legacy_path = os.path.join(SESSIONS_DIR, target)
    if os.path.exists(legacy_path):
        return legacy_path

    matches = []
    for root, _, files in os.walk(SESSIONS_DIR):
        if target in files:
            matches.append(os.path.join(root, target))

    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]
    return max(matches, key=os.path.getmtime)


def create_session(payload: dict):
    user = _safe_slug(payload.get("user", "NA"))
    drill = _safe_slug(payload.get("drill_id") or payload.get("drill") or payload.get("module_id") or "NA")
    date_prefix = datetime.now(ZoneInfo("Europe/Berlin")).strftime("%Y%m%d")
    ts = int(time.time())
    session_id = f"{date_prefix}_{user}_{drill}_{ts}"

    session = {
        "id": session_id,
        "user": payload.get("user"),
        "module_id": payload.get("module_id"),
        "drill_id": payload.get("drill_id"),
        "goal": payload.get("goal"),
        "confidence": payload.get("confidence"),
        "created_at": datetime.now(ZoneInfo("Europe/Berlin")).isoformat(),
        "checkins": [],
        "post": None
    }
    if "game_info" in payload:
        session["game_info"] = payload["game_info"]
    save_session(session)
    return session


def save_session(session):
    path = _build_session_path(session['id'], session.get('created_at'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)


def load_session(session_id):
    path = _find_session_path(session_id)
    if path and os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def list_sessions(user=None):
    sessions = []
    for root, _, files in os.walk(SESSIONS_DIR):
        for filename in files:
            if not filename.endswith('.json'):
                continue
            with open(os.path.join(root, filename), 'r', encoding='utf-8') as f:
                session = json.load(f)
                if user is None or session.get('user') == user:
                    sessions.append(session)
    return sorted(sessions, key=lambda s: s.get('created_at', ''), reverse=True)


def add_checkin(session_id, phase, responses, feedback=None, next_task=None):
    session = load_session(session_id)
    if session:
        checkin = {
            'phase': phase,
            'timestamp': datetime.now().isoformat(),
            'responses': responses,
            'feedback': feedback,
            'next_task': next_task
        }
        session['checkins'].append(checkin)
        save_session(session)
        return True
    return False


def complete_session(session_id, summary=None, unclear=None, next_module=None, helpfulness=None):
    session = load_session(session_id)
    if session:
        session['state'] = 'done'
        session['post'] = {
            'summary': summary,
            'unclear': unclear,
            'next_module': next_module,
            'helpfulness': helpfulness,
            'completed_at': datetime.now().isoformat()
        }
        save_session(session)
        return True
    return False