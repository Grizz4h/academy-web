import os
import json
import jwt
from datetime import datetime, timedelta
from fastapi import Header, HTTPException, Depends
from auth_utils import hash_password, verify_password
# JWT config
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "academy")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
JWT_SECRET = os.environ.get("ACADEMY_JWT_SECRET", "dev-secret")
JWT_ALGO = "HS256"
JWT_EXP_DAYS = 7

def load_users():
    if not os.path.exists(USERS_FILE):
        print("[AUTH] USERS_FILE (not found):", USERS_FILE)
        return {"users": []}
    print("[AUTH] USERS_FILE =", USERS_FILE)
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(data):
    tmp = USERS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, USERS_FILE)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload["sub"]
    except:
        raise HTTPException(status_code=401)
# --- AUTH ENDPOINTS ---
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi import Request



# ...existing code...

# ...existing code...
# ...existing code...
# ...alle anderen Endpunkte...

# ...existing code...
from fastapi import FastAPI, HTTPException, Request, Query
from uuid import uuid4
from collections import Counter
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import logging
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler("backend.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

app = FastAPI(title="Academy API", version="1.0.0")

MAX_TEXT_LEN = 1500


def enforce_max_text_length(value: Any, path: str = "payload") -> None:
    if isinstance(value, str):
        if len(value) > MAX_TEXT_LEN:
            raise HTTPException(
                status_code=400,
                detail=f"Text too long at {path}: max {MAX_TEXT_LEN} characters",
            )
        return

    if isinstance(value, dict):
        for key, nested_value in value.items():
            nested_path = f"{path}.{key}"
            enforce_max_text_length(nested_value, nested_path)
        return

    if isinstance(value, list):
        for index, nested_value in enumerate(value):
            nested_path = f"{path}[{index}]"
            enforce_max_text_length(nested_value, nested_path)
        return

# CORS für Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173", "http://localhost:5175", "http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Daten-Verzeichnis
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "academy")
SESSIONS_DIR = os.path.join(DATA_DIR, "sessions")
REWARDS_DIR = os.path.join(DATA_DIR, "rewards")

# Pydantic Models
class SessionCreate(BaseModel):
    user: str
    module_id: str
    goal: str
    confidence: int  # 1-5
    game_info: Optional[dict] = None
    observed_team: Optional[str] = None
    focus: Optional[str] = None  # Module-specific focus area
    session_method: Optional[str] = None  # "live_watch" oder andere
    drill_id: Optional[str] = None  # Specific drill to use

class MicroFeedbackData(BaseModel):
    phase: str  # P1, P2, P3
    text: str
class CheckinData(BaseModel):
    phase: str  # PRE, P1, P2, P3
    answers: dict
    feedback: Optional[str] = None  # Nur POST
    next_task: Optional[str] = None  # Nur POST

class PostData(BaseModel):
    summary: str
    unclear: Optional[str] = None
    next_module: Optional[str] = None
    helpfulness: int  # 1-5

class AbortData(BaseModel):
    reason: str  # "time", "wrong_game", "no_motivation", "bad_session", "other"
    note: Optional[str] = None


class RewardApplyData(BaseModel):
    session_id: str
    evaluated_at: str
    granted_pux: int = 0
    reward_events: List[dict] = Field(default_factory=list)
    unlocked_achievements: List[dict] = Field(default_factory=list)
    unlocked_masteries: List[dict] = Field(default_factory=list)

# Hilfsfunktionen
def load_json(file_path: str):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path: str, data):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _parse_created_at(created_at: Optional[str]) -> datetime:
    if created_at:
        try:
            return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now()


def build_session_storage_path(session_id: str, created_at: Optional[str]) -> str:
    dt = _parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return os.path.join(SESSIONS_DIR, year, month, f"{session_id}.json")


def iter_session_files():
    if not os.path.exists(SESSIONS_DIR):
        return
    for root, _, files in os.walk(SESSIONS_DIR):
        for file in files:
            if file.endswith('.json'):
                yield os.path.join(root, file)


def find_session_file(session_id: str) -> Optional[str]:
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


def get_session_path_or_404(session_id: str) -> str:
    session_path = find_session_file(session_id)
    if not session_path:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_path


def _normalize_user_key(user: str) -> str:
    return (user or "guest").strip().lower()


def _reward_state_path(user: str) -> str:
    user_key = _normalize_user_key(user)
    return os.path.join(REWARDS_DIR, f"{user_key}.json")


def _create_default_reward_state() -> dict:
    return {
        "currency": {"PUX": 0},
        "unlockedAchievements": {},
        "unlockedMasteries": {},
        "processedSessions": {},
        "lastUpdatedAt": None,
    }


def _load_reward_state(user: str) -> dict:
    path = _reward_state_path(user)
    if not os.path.exists(path):
        return _create_default_reward_state()

    state = load_json(path)
    base = _create_default_reward_state()
    merged = {
        **base,
        **state,
        "currency": {**base["currency"], **(state.get("currency") or {})},
        "unlockedAchievements": state.get("unlockedAchievements") or {},
        "unlockedMasteries": state.get("unlockedMasteries") or {},
        "processedSessions": state.get("processedSessions") or {},
    }
    return merged


def _save_reward_state(user: str, state: dict) -> None:
    save_json(_reward_state_path(user), state)

# API Endpunkte
@app.get("/api/curriculum")
async def get_curriculum():
    """Curriculum laden"""
    try:
        curriculum = load_json(os.path.join(DATA_DIR, "curriculum.json"))
        return curriculum
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Curriculum not found")

@app.get("/api/teams")
async def get_teams(league: Optional[str] = None):
    """Teams laden basierend auf Liga"""
    try:
        # Standardmäßig DEL Teams
        if not league or league == "DEL":
            return load_json(os.path.join(DATA_DIR, "teams.json"))
        elif league == "Nationalmannschaften":
            return load_json(os.path.join(DATA_DIR, "teams_national.json"))
        elif league in ["NHL", "CHL", "U20_DNL"]:
            # Diese Leagues haben keine Backend-Teams, Frontend nutzt teamsByLeague
            return {"teams": []}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Teams not found")

@app.get("/api/sessions")
async def get_sessions(user: Optional[str] = None, state: Optional[str] = None):
    """Sessions filtern"""
    if not os.path.exists(SESSIONS_DIR):
        return []

    sessions = []
    for session_path in iter_session_files():
        session = load_json(session_path)
        if user and session.get('user') != user:
            continue
        if state and session.get('state') != state:
            continue
        if not session.get('created_by'):
            session['created_by'] = session.get('user', 'Unbekannt')
        sessions.append(session)
    return sessions

@app.post("/api/sessions")
async def create_session(session: SessionCreate, user=Depends(get_current_user)):
    # Username wie in users.json (korrekt groß) verwenden
    users = load_users()
    user_obj = next((u for u in users["users"] if u["username"].strip().lower() == user.strip().lower()), None)
    user_cased = user_obj["username"] if user_obj else user
    """Neue Session erstellen (auth required)"""
    os.makedirs(SESSIONS_DIR, exist_ok=True)

    now = datetime.now()
    session_id = f"{user_cased}_{int(now.timestamp())}"

    # Lade Module-Drills aus Curriculum
    curriculum = load_json(os.path.join(DATA_DIR, "curriculum.json"))
    module_drills = []
    for track in curriculum.get("tracks", []):
        for module in track.get("modules", []):
            if module["id"] == session.module_id:
                if session.drill_id:
                    # Wenn drill_id spezifiziert, nur diesen Drill laden
                    for drill in module.get("drills", []):
                        if drill["id"] == session.drill_id:
                            module_drills = [drill]
                            break
                else:
                    # Sonst alle Drills des Moduls
                    module_drills = module.get("drills", [])
                break
        if module_drills:
            break

    enforce_max_text_length(session.goal, "session.goal")
    enforce_max_text_length(session.focus, "session.focus")
    enforce_max_text_length(session.observed_team, "session.observed_team")
    enforce_max_text_length(session.game_info, "session.game_info")

    session_data = {
        "id": session_id,
        "user": user_cased,
        "created_by": user_cased,  # Track who created the session
        "module_id": session.module_id,
        "goal": session.goal,
        "confidence": session.confidence,
        "focus": session.focus,  # Store focus area
        "session_method": session.session_method,  # Store session method
        "drill_id": session.drill_id,  # Store selected drill
        "state": "IN_PROGRESS",  # Start as in progress instead of PRE
        "current_phase": "PRE",  # Track current phase for continuation
        "created_at": now.isoformat(),
        "drills": module_drills,
        "progress": {
            "current_drill_index": 0,
            "completed_drills": []
        },
        "checkins": [],
        "drafts": {},  # Store draft answers for continuation
        "post": None,
        "game_info": session.game_info,
        "observed_team": session.observed_team,
        "microfeedback": {
            "P1": {"done": False, "text": ""},
            "P2": {"done": False, "text": ""},
            "P3": {"done": False, "text": ""}
        }
    }

    print(f"[AUTH] request by user={user} path=/api/sessions")
    session_path = build_session_storage_path(session_id, session_data.get("created_at"))
    save_json(session_path, session_data)
    return session_data

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Session Details"""
    session_path = get_session_path_or_404(session_id)
    return load_json(session_path)

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, updates: dict):
    """Session aktualisieren"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)


    enforce_max_text_length(updates, "updates")

    # Merge-Logik für microfeedback
    for key, value in updates.items():
        if key == "microfeedback":
            if "microfeedback" not in session:
                session["microfeedback"] = {"P1": {"done": False, "text": ""}, "P2": {"done": False, "text": ""}, "P3": {"done": False, "text": ""}}
            for phase, mf in value.items():
                if phase in session["microfeedback"]:
                    session["microfeedback"][phase].update(mf)
                else:
                    session["microfeedback"][phase] = mf
        else:
            session[key] = value

    save_json(session_path, session)
    return session

@app.post("/api/sessions/{session_id}/checkins")
async def save_checkin(session_id: str, checkin: CheckinData, request: Request):
    """Checkin speichern"""
    req_id = uuid4().hex[:8]
    phase_raw = checkin.phase
    phase_norm = checkin.phase.strip().upper()
    trace_id = request.headers.get("X-Trace-Id")
    trace_action = request.headers.get("X-Trace-Action")
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)
    counts_before = Counter((c.get("phase") or "") for c in session.get("checkins", []))

    enforce_max_text_length(checkin.answers, "checkin.answers")
    enforce_max_text_length(checkin.feedback, "checkin.feedback")
    enforce_max_text_length(checkin.next_task, "checkin.next_task")


    # --- DEDUP checkins: keep newest per phase ---
    dedup = {}
    for c in session.get("checkins", []):
        ph = (c.get("phase") or "").strip()
        ts = c.get("timestamp") or ""
        if ph not in dedup or ts > (dedup[ph].get("timestamp") or ""):
            dedup[ph] = c
    session["checkins"] = list(dedup.values())

    # Check ob für diese Phase schon ein Checkin existiert (nach Cleanup)
    existing = None
    for c in session["checkins"]:
        if c["phase"] == checkin.phase:
            existing = c
            break
    action = "update" if existing else "append"
    logging.info(f"[checkin:{req_id}] session={session_id} phase_raw={phase_raw!r} phase_norm={phase_norm!r} action={action} trace_id={trace_id} trace_action={trace_action} counts_before={dict(counts_before)}")

    # Feedback und next_task nur im POST speichern!
    is_post = checkin.phase == "POST"

    if existing:
        existing["answers"] = checkin.answers
        if is_post:
            if checkin.feedback is not None:
                existing["feedback"] = checkin.feedback
            if checkin.next_task is not None:
                existing["next_task"] = checkin.next_task
        else:
            existing.pop("feedback", None)
            existing.pop("next_task", None)
        # Entferne jegliche micro/mini feedback Felder
        existing.pop("mini_feedback", None)
        existing.pop("micro_feedback", None)
        existing.pop("microfeedback_done", None)
        existing["timestamp"] = datetime.now().isoformat()
    else:
        checkin_data = {
            "phase": checkin.phase,
            "answers": checkin.answers,
            "timestamp": datetime.now().isoformat()
        }
        if is_post:
            if checkin.feedback is not None:
                checkin_data["feedback"] = checkin.feedback
            if checkin.next_task is not None:
                checkin_data["next_task"] = checkin.next_task
        # Entferne jegliche micro/mini feedback Felder
        session["checkins"].append(checkin_data)

    # Phase nur aktualisieren wenn es ein echter Checkin ist (nicht nur Speicherung)
    # Für Continuation wird die Phase separat über die phase-Route aktualisiert

    save_json(session_path, session)
    counts_after = Counter((c.get("phase") or "") for c in session.get("checkins", []))
    logging.info(f"[checkin:{req_id}] session={session_id} counts_after={dict(counts_after)}")
    return session

@app.post("/api/sessions/{session_id}/post")
async def complete_session(session_id: str, post: PostData):
    """Session abschließen"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)

    enforce_max_text_length(post.summary, "post.summary")
    enforce_max_text_length(post.unclear, "post.unclear")
    enforce_max_text_length(post.next_module, "post.next_module")

    session["post"] = {
        "summary": post.summary,
        "unclear": post.unclear,
        "next_module": post.next_module,
        "helpfulness": post.helpfulness,
        "completed_at": datetime.now().isoformat()
    }
    session["state"] = "COMPLETED"

    save_json(session_path, session)
    return session

@app.post("/api/sessions/{session_id}/abort")
async def abort_session(session_id: str, abort: AbortData):
    """Session abbrechen"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)

    enforce_max_text_length(abort.note, "abort.note")

    session["abort"] = {
        "reason": abort.reason,
        "note": abort.note,
        "aborted_at": datetime.now().isoformat()
    }
    session["state"] = "ABORTED"

    save_json(session_path, session)
    return session

@app.delete("/api/sessions/{session_id}/checkins/{checkin_index}")
async def delete_checkin(session_id: str, checkin_index: int):
    """Checkin (Phase) löschen"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)

    if checkin_index < 0 or checkin_index >= len(session.get("checkins", [])):
        raise HTTPException(status_code=400, detail="Invalid checkin index")

    session["checkins"].pop(checkin_index)
    save_json(session_path, session)
    return session

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Session löschen"""
    session_path = get_session_path_or_404(session_id)
    try:
        os.remove(session_path)
        return {"status": "deleted", "id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {e}")

@app.put("/api/sessions/{session_id}/drafts")
async def save_drafts(session_id: str, drafts: dict):
    """Draft-Eingaben speichern für Session Continuation"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)

    enforce_max_text_length(drafts, "drafts")

    session["drafts"] = drafts
    save_json(session_path, session)
    return {"status": "saved"}

@app.put("/api/sessions/{session_id}/phase")
async def update_session_phase(session_id: str, phase_data: dict):
    """Aktuelle Phase der Session aktualisieren"""
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)

    enforce_max_text_length(phase_data, "phase_data")

    if "phase" in phase_data:
        session["current_phase"] = phase_data["phase"]
    if "state" in phase_data:
        session["state"] = phase_data["state"]

    save_json(session_path, session)
    return session

@app.get("/api/sessions/{session_id}/download")
async def download_session(session_id: str, phase: Optional[str] = Query(None)):
    """Session als komplette JSON herunterladen mit allen Fragen und Antworten"""
    from fastapi.responses import StreamingResponse
    from io import BytesIO
    
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)
    
    phase_norm = phase.strip().upper() if phase else None
    if phase_norm:
        valid_phases = {"P1", "P2", "P3"}
        if phase_norm not in valid_phases:
            raise HTTPException(status_code=400, detail="Invalid phase for download")

    # Struktur für Download vorbereiten
    export = {
        "session_id": session.get("id"),
        "user": session.get("user"),
        "module_id": session.get("module_id"),
        "drill_id": session.get("drill_id"),
        "goal": session.get("goal"),
        "confidence": session.get("confidence"),
        "session_method": session.get("session_method"),
        "focus": session.get("focus"),
        "created_at": session.get("created_at"),
        "state": session.get("state"),
        "game_info": session.get("game_info"),
        "drills": session.get("drills", []),
        "checkins_with_questions": []
    }
    if phase_norm:
        export["export_phase"] = phase_norm
    
    # Alle Drills durchgehen und Config mit Antworten verbinden
    all_questions = {}
    for drill in session.get("drills", []):
        config = drill.get("config", {})
        questions = config.get("questions", [])
        for question in questions:
            all_questions[question.get("key")] = question
    
    # Checkins mit Fragen anreichern
    checkins_source = session.get("checkins", [])
    if phase_norm:
        checkins_source = [
            c for c in checkins_source
            if (c.get("phase") or "").strip().upper() == phase_norm
        ]

    for checkin in checkins_source:
        phase = checkin.get("phase")
        answers = checkin.get("answers", {})
        
        checkin_export = {
            "phase": phase,
            "timestamp": checkin.get("timestamp"),
            "questions_and_answers": []
        }
        
        # Für jede Antwort die entsprechende Frage finden und hinzufügen
        for answer_key, answer_value in answers.items():
            if answer_key in all_questions:
                question = all_questions[answer_key]
                checkin_export["questions_and_answers"].append({
                    "question_key": answer_key,
                    "question_label": question.get("label"),
                    "question_type": question.get("type"),
                    "answer": answer_value
                })
        
        # V4 Meta-Scan: Export complete answers structure (includes meta object)
        # For renderers without traditional questions, include raw answers
        if not checkin_export["questions_and_answers"] and answers:
            checkin_export["raw_answers"] = answers
        
        # Feedback und next_task hinzufügen wenn vorhanden (für POST)
        if checkin.get("feedback"):
            checkin_export["feedback"] = checkin.get("feedback")
        if checkin.get("next_task"):
            checkin_export["next_task"] = checkin.get("next_task")
        
        export["checkins_with_questions"].append(checkin_export)
    
    # Microfeedback hinzufügen
    if session.get("microfeedback"):
        if phase_norm:
            phase_feedback = session["microfeedback"].get(phase_norm)
            if phase_feedback:
                export["microfeedback"] = {phase_norm: phase_feedback}
        else:
            export["microfeedback"] = session.get("microfeedback")
    
    # Post-Daten hinzufügen wenn vorhanden
    if session.get("post") and not phase_norm:
        export["post"] = session.get("post")
    
    # JSON in BytesIO schreiben
    json_bytes = json.dumps(export, indent=2, ensure_ascii=False).encode('utf-8')
    buffer = BytesIO(json_bytes)
    
    # Als Download zurückgeben
    filename = f"session_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    return StreamingResponse(
        iter([json_bytes]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Microfeedback-Endpoint muss nach app = FastAPI(...) deklariert werden

@app.post("/api/sessions/{session_id}/microfeedback")
async def add_microfeedback(session_id: str, data: MicroFeedbackData, request: Request):
    """Microfeedback für P1/P2/P3 speichern (Session-Block, nicht Checkin)"""
    valid_phases = {"P1", "P2", "P3"}
    phase = data.phase.strip().upper()
    if phase not in valid_phases:
        raise HTTPException(status_code=400, detail="Invalid phase for microfeedback")
    enforce_max_text_length(data.text, "microfeedback.text")
    session_path = get_session_path_or_404(session_id)
    session = load_json(session_path)
    if "microfeedback" not in session:
        session["microfeedback"] = {p: {"done": False, "text": ""} for p in valid_phases}
    session["microfeedback"][phase]["done"] = True
    session["microfeedback"][phase]["text"] = data.text
    session["microfeedback"][phase]["ts"] = datetime.now().isoformat()
    # Logging
    trace_id = request.headers.get("X-Trace-Id")
    trace_action = request.headers.get("X-Trace-Action")
    logging.info(f"[microfeedback] session={session_id} phase={phase} trace_id={trace_id} trace_action={trace_action} text_len={len(data.text)}")
    save_json(session_path, session)
    return {"status": "ok", "microfeedback": session["microfeedback"][phase]}


@app.get("/api/rewards/state")
async def get_rewards_state(current_user: str = Depends(get_current_user)):
    state = _load_reward_state(current_user)
    return state


@app.post("/api/rewards/apply")
async def apply_rewards(data: RewardApplyData, current_user: str = Depends(get_current_user)):
    state = _load_reward_state(current_user)

    enforce_max_text_length(data.reward_events, "reward_events")
    enforce_max_text_length(data.unlocked_achievements, "unlocked_achievements")
    enforce_max_text_length(data.unlocked_masteries, "unlocked_masteries")

    processed_sessions = state.get("processedSessions") or {}
    if data.session_id in processed_sessions:
        return {
            "state": state,
            "applied": False,
            "granted_pux": 0,
            "reward_events": [],
        }

    state["currency"]["PUX"] = int(state["currency"].get("PUX", 0)) + int(data.granted_pux or 0)
    state["processedSessions"][data.session_id] = {
        "sessionId": data.session_id,
        "grantedAt": data.evaluated_at,
        "pux": int(data.granted_pux or 0),
    }

    for achievement in data.unlocked_achievements:
        achievement_id = (achievement.get("id") or "").strip()
        if not achievement_id:
            continue
        if achievement_id in state["unlockedAchievements"]:
            continue

        unlocked_at = achievement.get("unlockedAt") or data.evaluated_at
        state["unlockedAchievements"][achievement_id] = {
            "id": achievement_id,
            "unlockedAt": unlocked_at,
        }

    for mastery in data.unlocked_masteries:
        mastery_key = (mastery.get("key") or "").strip()
        if not mastery_key:
            continue
        if mastery_key in state["unlockedMasteries"]:
            continue

        state["unlockedMasteries"][mastery_key] = mastery

    state["lastUpdatedAt"] = data.evaluated_at
    _save_reward_state(current_user, state)

    return {
        "state": state,
        "applied": True,
        "granted_pux": int(data.granted_pux or 0),
        "reward_events": data.reward_events,
    }


# Auth Endpoints nach finaler app-Definition (jetzt immer registriert)
@app.post("/api/auth/signup")
async def signup(payload: dict):
    username = payload["username"].strip().lower()
    password = payload["password"].strip()
    users = load_users()
    if any(u["username"].strip().lower() == username for u in users["users"]):
        raise HTTPException(status_code=400, detail="User exists")
    users["users"].append({
        "username": username,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow().isoformat(),
        "role": "user"
    })
    save_users(users)
    print(f"[AUTH] signup ok user={username}")
    return {"ok": True}

@app.post("/api/auth/login")
async def login(payload: dict):
    username = payload["username"].strip().lower()
    password = payload["password"].strip()
    print(f"[AUTH] login attempt user={username} pw_len={len(password)}")
    users = load_users()
    user = next((u for u in users["users"] if u["username"].strip().lower() == username), None)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({
        "sub": username,
        "exp": (datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)).timestamp()
    }, JWT_SECRET, algorithm=JWT_ALGO)
    print(f"[AUTH] login ok user={username}")
    return {"token": token, "username": username}

# ============ PLAYER OBSERVATIONS ============

OBSERVATIONS_DIR = os.path.join(DATA_DIR, "observations")

def _ensure_observations_dir():
    os.makedirs(OBSERVATIONS_DIR, exist_ok=True)

def _build_observation_storage_path(user: str, player: str, created_at: Optional[str] = None) -> str:
    """Speicherbasis: data/observations/{user}/{player}/observations.json"""
    if created_at is None:
        created_at = datetime.utcnow().isoformat()
    dt = _parse_created_at(created_at)
    user_key = _normalize_user_key(user)
    player_key = (player or "unknown").strip().lower().replace(" ", "_")
    folder = os.path.join(OBSERVATIONS_DIR, user_key, player_key)
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, "observations.json")

@app.post("/api/observations")
async def create_observation(payload: dict, request: Request):
    """Neue Player Observation speichern"""
    user = get_current_user(request.headers.get("authorization"))
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    required = ["player", "position", "observations"]
    for key in required:
        if key not in payload:
            raise HTTPException(status_code=400, detail=f"Missing required field: {key}")
    
    player = payload.get("player", "").strip()
    if not player:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    observation_record = {
        "player": player,
        "position": payload["position"],
        "session_id": payload.get("session_id", ""),
        "game_context": payload.get("game_context", ""),
        "observations": payload["observations"],
        "notes": payload.get("notes", ""),
        "timestamp": datetime.utcnow().timestamp(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    path = _build_observation_storage_path(user, player)
    observations = []
    if os.path.exists(path):
        observations = load_json(path)
    if not isinstance(observations, list):
        observations = []
    
    observations.append(observation_record)
    save_json(path, observations)
    
    print(f"[OBSERVATION] saved player={player} user={user} ts={observation_record['timestamp']}")
    return {"ok": True, "observation": observation_record}

@app.get("/api/observations")
async def get_observations(player: Optional[str] = None, request: Request = None):
    """Alle Observations eines Users abrufen (optional gefiltert nach Player)"""
    user = get_current_user(request.headers.get("authorization")) if request else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    all_obs = []
    user_key = _normalize_user_key(user)
    user_obs_dir = os.path.join(OBSERVATIONS_DIR, user_key)
    
    if not os.path.exists(user_obs_dir):
        return {"observations": []}
    
    player_key = (player or "").strip().lower().replace(" ", "_") if player else None
    
    for player_folder in os.listdir(user_obs_dir):
        if player_key and player_folder != player_key:
            continue
        
        player_obs_file = os.path.join(user_obs_dir, player_folder, "observations.json")
        if os.path.exists(player_obs_file):
            obs_list = load_json(player_obs_file)
            if isinstance(obs_list, list):
                all_obs.extend(obs_list)
    
    return {"observations": all_obs}

@app.get("/api/observations/aggregated")
async def get_aggregated_observations(player: Optional[str] = None, request: Request = None):
    """Aggregierte Statistiken pro Spieler"""
    user = get_current_user(request.headers.get("authorization")) if request else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_key = _normalize_user_key(user)
    user_obs_dir = os.path.join(OBSERVATIONS_DIR, user_key)
    
    if not os.path.exists(user_obs_dir):
        return {"players": {}}
    
    aggregated = {}
    
    for player_folder in os.listdir(user_obs_dir):
        player_obs_file = os.path.join(user_obs_dir, player_folder, "observations.json")
        if not os.path.exists(player_obs_file):
            continue
        
        obs_list = load_json(player_obs_file)
        if not isinstance(obs_list, list) or not obs_list:
            continue
        
        # Aggregation pro Spieler
        player_data = {
            "total_observations": len(obs_list),
            "support_behavior": {"active": 0, "passive": 0, "none": 0},
            "support_position": {"low": 0, "mid": 0, "high": 0},
            "decision_speed": {"fast": 0, "delayed": 0, "risky": 0},
            "pressure_response": {"stable": 0, "turnover": 0, "panic": 0},
            "off_puck_movement": {"active": 0, "static": 0, "drifting": 0}
        }
        
        for obs in obs_list:
            obs_data = obs.get("observations", {})
            for key, value in obs_data.items():
                if key in player_data and value in player_data[key]:
                    player_data[key][value] += 1
        
        player_name = obs_list[0].get("player", player_folder)
        aggregated[player_name] = player_data
    
    if player:
        player_data = aggregated.get(player)
        if not player_data:
            raise HTTPException(status_code=404, detail=f"No observations for player: {player}")
        return {"player": player, "data": player_data}
    
    return {"players": aggregated}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)