
# ...existing code...

# ...existing code...
# ...existing code...
# ...alle anderen Endpunkte...

# ...existing code...
from fastapi import FastAPI, HTTPException, Request
from uuid import uuid4
from collections import Counter
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import logging
from typing import List, Optional
from pydantic import BaseModel
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

# Hilfsfunktionen
def load_json(file_path: str):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path: str, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

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
async def get_teams():
    """DEL Teams laden"""
    try:
        return load_json(os.path.join(DATA_DIR, "teams.json"))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Teams not found")

@app.get("/api/sessions")
async def get_sessions(user: Optional[str] = None, state: Optional[str] = None):
    """Sessions filtern"""
    sessions_dir = os.path.join(DATA_DIR, "sessions")
    if not os.path.exists(sessions_dir):
        return []

    sessions = []
    for file in os.listdir(sessions_dir):
        if file.endswith('.json'):
            session = load_json(os.path.join(sessions_dir, file))
            if user and session.get('user') != user:
                continue
            if state and session.get('state') != state:
                continue
            # Ensure created_by is set (fallback to user for old sessions)
            if not session.get('created_by'):
                session['created_by'] = session.get('user', 'Unbekannt')
            sessions.append(session)
    return sessions

@app.post("/api/sessions")
async def create_session(session: SessionCreate):
    """Neue Session erstellen"""
    sessions_dir = os.path.join(DATA_DIR, "sessions")
    os.makedirs(sessions_dir, exist_ok=True)

    session_id = f"{session.user}_{int(datetime.now().timestamp())}"

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

    session_data = {
        "id": session_id,
        "user": session.user,
        "created_by": session.user,  # Track who created the session
        "module_id": session.module_id,
        "goal": session.goal,
        "confidence": session.confidence,
        "focus": session.focus,  # Store focus area
        "session_method": session.session_method,  # Store session method
        "drill_id": session.drill_id,  # Store selected drill
        "state": "IN_PROGRESS",  # Start as in progress instead of PRE
        "current_phase": "PRE",  # Track current phase for continuation
        "created_at": datetime.now().isoformat(),
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


    save_json(os.path.join(sessions_dir, f"{session_id}.json"), session_data)
    return session_data

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Session Details"""
    try:
        return load_json(os.path.join(DATA_DIR, "sessions", f"{session_id}.json"))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, updates: dict):
    """Session aktualisieren"""
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")


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
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    counts_before = Counter((c.get("phase") or "") for c in session.get("checkins", []))


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
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

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
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

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
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    if checkin_index < 0 or checkin_index >= len(session.get("checkins", [])):
        raise HTTPException(status_code=400, detail="Invalid checkin index")

    session["checkins"].pop(checkin_index)
    save_json(session_path, session)
    return session

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Session löschen"""
    sessions_dir = os.path.join(DATA_DIR, "sessions")
    session_path = os.path.join(sessions_dir, f"{session_id}.json")
    if not os.path.exists(session_path):
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        os.remove(session_path)
        return {"status": "deleted", "id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {e}")

@app.put("/api/sessions/{session_id}/drafts")
async def save_drafts(session_id: str, drafts: dict):
    """Draft-Eingaben speichern für Session Continuation"""
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    session["drafts"] = drafts
    save_json(session_path, session)
    return {"status": "saved"}

@app.put("/api/sessions/{session_id}/phase")
async def update_session_phase(session_id: str, phase_data: dict):
    """Aktuelle Phase der Session aktualisieren"""
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    if "phase" in phase_data:
        session["current_phase"] = phase_data["phase"]
    if "state" in phase_data:
        session["state"] = phase_data["state"]

    save_json(session_path, session)
    return session

# Microfeedback-Endpoint muss nach app = FastAPI(...) deklariert werden

@app.post("/api/sessions/{session_id}/microfeedback")
async def add_microfeedback(session_id: str, data: MicroFeedbackData, request: Request):
    """Microfeedback für P1/P2/P3 speichern (Session-Block, nicht Checkin)"""
    valid_phases = {"P1", "P2", "P3"}
    phase = data.phase.strip().upper()
    if phase not in valid_phases:
        raise HTTPException(status_code=400, detail="Invalid phase for microfeedback")
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)