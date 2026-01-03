import json
import os
from datetime import datetime

SESSIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'academy', 'sessions')

os.makedirs(SESSIONS_DIR, exist_ok=True)

def create_session(user, module_id, goal, confidence, game_info=None):
    session_id = f"{user}_{module_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    session = {
        'id': session_id,
        'user': user,
        'module_id': module_id,
        'goal': goal,
        'confidence': confidence,
        'game_info': game_info or {},
        'state': 'active',
        'created_at': datetime.now().isoformat(),
        'checkins': [],
        'post': None
    }
    save_session(session)
    return session

def save_session(session):
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