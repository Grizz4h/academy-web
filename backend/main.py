from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="Academy API", version="1.0.0")

# CORS für Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daten-Verzeichnis
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "academy")

# Pydantic Models
class SessionCreate(BaseModel):
    user: str
    module_id: str
    goal: str
    confidence: int  # 1-5
    game_info: Optional[dict] = None
    focus: Optional[str] = None  # Module-specific focus area
    session_method: Optional[str] = None  # "live_watch" oder andere
    drill_id: Optional[str] = None  # Specific drill to use

class CheckinData(BaseModel):
    phase: str  # PRE, P1, P2, P3
    answers: dict
    feedback: Optional[str] = None
    next_task: Optional[str] = None

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
        return load_json(os.path.join(DATA_DIR, "curriculum.json"))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Curriculum not found")

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
        "module_id": session.module_id,
        "goal": session.goal,
        "confidence": session.confidence,
        "focus": session.focus,  # Store focus area
        "session_method": session.session_method,  # Store session method
        "drill_id": session.drill_id,  # Store selected drill
        "state": "PRE",
        "created_at": datetime.now().isoformat(),
        "drills": module_drills,
        "progress": {
            "current_drill_index": 0,
            "completed_drills": []
        },
        "checkins": [],
        "post": None,
        "game_info": session.game_info
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

    # Updates anwenden
    for key, value in updates.items():
        session[key] = value

    save_json(session_path, session)
    return session

@app.post("/api/sessions/{session_id}/checkins")
async def save_checkin(session_id: str, checkin: CheckinData):
    """Checkin speichern"""
    session_path = os.path.join(DATA_DIR, "sessions", f"{session_id}.json")
    try:
        session = load_json(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    checkin_data = {
        "phase": checkin.phase,
        "answers": checkin.answers,
        "feedback": checkin.feedback,
        "next_task": checkin.next_task,
        "timestamp": datetime.now().isoformat()
    }
    session["checkins"].append(checkin_data)

    # Phase aktualisieren
    if checkin.phase == "PRE":
        session["state"] = "P1"
    elif checkin.phase == "P1":
        session["state"] = "P2"
    elif checkin.phase == "P2":
        session["state"] = "P3"
    elif checkin.phase == "P3":
        session["state"] = "POST"

    save_json(session_path, session)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)