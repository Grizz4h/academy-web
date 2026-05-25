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
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://188.34.196.189:5173",
        "http://188.34.196.189:5174",
        "http://188.34.196.189:5175",
    ],  # Frontend URLs
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
ROOT_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ROSTERS_DIR = os.path.join(ROOT_DATA_DIR, "rosters")
OBSERVATIONS_DIR = os.path.join(ROOT_DATA_DIR, "observations")
OBS_RUNS_DIR = os.path.join(OBSERVATIONS_DIR, "runs")
OBS_ENTRIES_DIR = os.path.join(OBSERVATIONS_DIR, "entries")

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


class ObservationRunCreate(BaseModel):
    league: str
    season: str
    team_id: str
    team_name: str
    player_id: str
    player_name: str
    player_number: Optional[int] = None
    player_position: str
    notes: Optional[str] = ""


class ObservationDimensions(BaseModel):
    support_behavior: str
    support_position: str
    decision_speed: str
    pressure_response: str
    off_puck_movement: str


class ObservationEntryCreate(BaseModel):
    run_id: str
    dimensions: ObservationDimensions
    note: Optional[str] = ""

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


def _resolve_user_cased(user: str) -> str:
    users = load_users()
    user_obj = next((u for u in users["users"] if u["username"].strip().lower() == user.strip().lower()), None)
    return user_obj["username"] if user_obj else user


def _build_observation_storage_path(base_dir: str, item_id: str, created_at: Optional[str]) -> str:
    dt = _parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return os.path.join(base_dir, year, month, f"{item_id}.json")


def _iter_json_files(base_dir: str):
    if not os.path.exists(base_dir):
        return
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".json"):
                yield os.path.join(root, file)


def _find_json_file_by_id(base_dir: str, item_id: str) -> Optional[str]:
    target = f"{item_id}.json"
    for root, _, files in os.walk(base_dir):
        if target in files:
            return os.path.join(root, target)
    return None


def _load_roster_file(league: str, season: str) -> dict:
    league_key = (league or "").strip().lower()
    season_key = (season or "").strip().lower()
    file_name = f"{league_key}_{season_key}.json"
    file_path = os.path.join(ROSTERS_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Roster not found")
    return load_json(file_path)


def _iter_user_observation_entries(user: str):
    user_norm = _normalize_user_key(user)
    for path in _iter_json_files(OBS_ENTRIES_DIR) or []:
        entry = load_json(path)
        if _normalize_user_key(entry.get("user", "")) != user_norm:
            continue
        yield entry


def _dimension_counts(entries: List[dict]) -> dict:
    dimensions = [
        "support_behavior",
        "support_position",
        "decision_speed",
        "pressure_response",
        "off_puck_movement",
    ]
    stats = {}

    for key in dimensions:
        counts = Counter((entry.get("dimensions") or {}).get(key) for entry in entries if (entry.get("dimensions") or {}).get(key))
        if counts:
            mode = counts.most_common(1)[0][0]
            stats[key] = {**dict(counts), "mode": mode}
        else:
            stats[key] = {"mode": None}
    return stats


def _aggregate_players(entries: List[dict]) -> List[dict]:
    grouped = {}
    for entry in entries:
        player_id = entry.get("player_id")
        if not player_id:
            continue
        grouped.setdefault(player_id, []).append(entry)

    players = []
    for player_id, player_entries in grouped.items():
        latest = max(player_entries, key=lambda item: item.get("created_at", ""))
        players.append(
            {
                "player_id": player_id,
                "player_name": latest.get("player_name"),
                "team_id": latest.get("team_id"),
                "team_name": latest.get("team_name"),
                "league": latest.get("league"),
                "season": latest.get("season"),
                "player_position": latest.get("player_position"),
                "observation_count": len(player_entries),
                "last_observation": latest.get("created_at"),
                "dimension_stats": _dimension_counts(player_entries),
            }
        )

    players.sort(key=lambda item: item.get("observation_count", 0), reverse=True)
    return players

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


@app.get("/api/rosters")
async def get_rosters():
    rosters = []
    if not os.path.exists(ROSTERS_DIR):
        return {"rosters": rosters}

    for name in sorted(os.listdir(ROSTERS_DIR)):
        if not name.endswith(".json"):
            continue
        file_path = os.path.join(ROSTERS_DIR, name)
        try:
            data = load_json(file_path)
            rosters.append(
                {
                    "league": data.get("league"),
                    "season": data.get("season"),
                    "teams": len(data.get("teams", [])),
                    "file": name,
                }
            )
        except Exception:
            continue
    return {"rosters": rosters}


@app.get("/api/rosters/{league}/{season}")
async def get_roster_for_league(league: str, season: str):
    return _load_roster_file(league, season)


@app.post("/api/observation-runs")
async def create_observation_run(payload: ObservationRunCreate, current_user: str = Depends(get_current_user)):
    user_cased = _resolve_user_cased(current_user)
    now_iso = datetime.now().isoformat()
    run_id = f"obs_{int(datetime.now().timestamp())}_{uuid4().hex[:6]}"

    enforce_max_text_length(payload.notes, "observation_run.notes")

    run = {
        "run_id": run_id,
        "user": user_cased,
        "league": payload.league,
        "season": payload.season,
        "team_id": payload.team_id,
        "team_name": payload.team_name,
        "player_id": payload.player_id,
        "player_name": payload.player_name,
        "player_number": payload.player_number,
        "player_position": payload.player_position,
        "created_at": now_iso,
        "notes": payload.notes or "",
        "status": "active",
    }

    run_path = _build_observation_storage_path(OBS_RUNS_DIR, run_id, now_iso)
    save_json(run_path, run)
    return run


@app.get("/api/observation-runs/{run_id}")
async def get_observation_run(run_id: str, current_user: str = Depends(get_current_user)):
    run_path = _find_json_file_by_id(OBS_RUNS_DIR, run_id)
    if not run_path:
        raise HTTPException(status_code=404, detail="Observation run not found")

    run = load_json(run_path)
    if _normalize_user_key(run.get("user", "")) != _normalize_user_key(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    return run


@app.post("/api/observations")
async def create_observation_entry(payload: ObservationEntryCreate, current_user: str = Depends(get_current_user)):
    run_path = _find_json_file_by_id(OBS_RUNS_DIR, payload.run_id)
    if not run_path:
        raise HTTPException(status_code=404, detail="Observation run not found")

    run = load_json(run_path)
    if _normalize_user_key(run.get("user", "")) != _normalize_user_key(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    now_iso = datetime.now().isoformat()
    entry_id = f"entry_{int(datetime.now().timestamp())}_{uuid4().hex[:6]}"

    enforce_max_text_length(payload.note, "observation_entry.note")

    entry = {
        "entry_id": entry_id,
        "run_id": run.get("run_id"),
        "user": run.get("user"),
        "league": run.get("league"),
        "season": run.get("season"),
        "team_id": run.get("team_id"),
        "team_name": run.get("team_name"),
        "player_id": run.get("player_id"),
        "player_name": run.get("player_name"),
        "player_position": run.get("player_position"),
        "created_at": now_iso,
        "dimensions": payload.dimensions.model_dump(),
        "note": payload.note or "",
    }

    entry_path = _build_observation_storage_path(OBS_ENTRIES_DIR, entry_id, now_iso)
    save_json(entry_path, entry)
    return entry


@app.get("/api/observations")
async def get_observation_entries(
    run_id: Optional[str] = None,
    league: Optional[str] = None,
    season: Optional[str] = None,
    team_id: Optional[str] = None,
    player_id: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    entries = []
    for entry in _iter_user_observation_entries(current_user):
        if run_id and entry.get("run_id") != run_id:
            continue
        if league and entry.get("league") != league:
            continue
        if season and entry.get("season") != season:
            continue
        if team_id and entry.get("team_id") != team_id:
            continue
        if player_id and entry.get("player_id") != player_id:
            continue
        entries.append(entry)

    entries.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return {"observations": entries}


@app.get("/api/observation-stats")
async def get_observation_stats(
    league: Optional[str] = None,
    season: Optional[str] = None,
    team_id: Optional[str] = None,
    player_id: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    entries = []
    for entry in _iter_user_observation_entries(current_user):
        if league and entry.get("league") != league:
            continue
        if season and entry.get("season") != season:
            continue
        if team_id and entry.get("team_id") != team_id:
            continue
        if player_id and entry.get("player_id") != player_id:
            continue
        entries.append(entry)

    players = _aggregate_players(entries)
    return {"players": players}


@app.get("/api/observation-stats/player/{player_id}")
async def get_observation_stats_player(
    player_id: str,
    league: Optional[str] = None,
    season: Optional[str] = None,
    team_id: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    entries = []
    for entry in _iter_user_observation_entries(current_user):
        if entry.get("player_id") != player_id:
            continue
        if league and entry.get("league") != league:
            continue
        if season and entry.get("season") != season:
            continue
        if team_id and entry.get("team_id") != team_id:
            continue
        entries.append(entry)

    if not entries:
        raise HTTPException(status_code=404, detail="No observations for player")

    aggregated = _aggregate_players(entries)
    player = aggregated[0] if aggregated else None
    entries.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return {"player": player, "observations": entries}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)