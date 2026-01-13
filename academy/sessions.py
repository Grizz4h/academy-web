import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo
def _safe_slug(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[^a-zA-Z0-9_-]+", "_", s)
    s = re.sub(r"_+", "_", s)
    return s.strip("_") or "NA"
import json
import os
from datetime import datetime

SESSIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'academy', 'sessions')

os.makedirs(SESSIONS_DIR, exist_ok=True)

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
    # Speichere immer unter session['id']
    path = os.path.join(SESSIONS_DIR, f"{session['id']}.json")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

def load_session(session_id):
    path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def list_sessions(user=None):
    sessions = []
    for filename in os.listdir(SESSIONS_DIR):
        if filename.endswith('.json'):
            with open(os.path.join(SESSIONS_DIR, filename), 'r', encoding='utf-8') as f:
                session = json.load(f)
                if user is None or session['user'] == user:
                    sessions.append(session)
    return sorted(sessions, key=lambda s: s['created_at'], reverse=True)

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