import os
import json
import jwt
from datetime import datetime, timedelta
from fastapi import Header, HTTPException, Depends
from auth_utils import hash_password, verify_password
from player_importer import PennyDelImporter
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
import re
from threading import Lock
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
PLAYERS_DIR = os.path.join(DATA_DIR, "players")
OBSERVATIONS_DIR = os.path.join(ROOT_DATA_DIR, "observations")
OBS_RUNS_DIR = os.path.join(OBSERVATIONS_DIR, "runs")
OBS_ENTRIES_DIR = os.path.join(OBSERVATIONS_DIR, "entries")
OBS_PLAYERS_DIR = os.path.join(OBSERVATIONS_DIR, "players")
SCENES_DIR = os.path.join(ROOT_DATA_DIR, "scenes")
SCENE_CODE_COUNTER_FILE = os.path.join(ROOT_DATA_DIR, "scene_code_counter.json")
PENNY_DEL_IMPORT_CONFIG_FILE = os.path.join(DATA_DIR, "penny_del_import_teams.json")

# Pydantic Models
class SessionCreate(BaseModel):
    user: str
    module_id: str
    goal: str
    confidence: int  # 1-5
    observation_scope: Optional[str] = None
    game_info: Optional[dict] = None
    observed_team: Optional[str] = None
    observed_team_id: Optional[str] = None
    observed_team_name: Optional[str] = None
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


OBSERVATION_SCOPE_LABELS = {
    "FULL_GAME": "Gesamtes Spiel",
    "P1": "1. Drittel",
    "P2": "2. Drittel",
    "P3": "3. Drittel",
}

SCENE_STATUS_NEW = "NEW"
SCENE_STATUS_ASSIGNED = "ASSIGNED"
SCENE_CODE_PREFIX = "SC"
SCENE_CODE_WIDTH = 3
SCENE_CODE_LEGACY_FLOOR = 16
SCENE_CODE_LOCK = Lock()


def _normalize_scene_rating(value):
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1 or value > 5:
        raise HTTPException(status_code=400, detail="rating must be null or an integer from 1 to 5")
    return value


class RewardApplyData(BaseModel):
    session_id: str
    evaluated_at: str
    granted_pux: int = 0
    reward_events: List[dict] = Field(default_factory=list)
    unlocked_achievements: List[dict] = Field(default_factory=list)
    unlocked_masteries: List[dict] = Field(default_factory=list)


class SceneMarkerCreate(BaseModel):
    session_id: str
    module_id: str
    drill_id: Optional[str] = None
    drill_title: Optional[str] = None
    track_id: Optional[str] = None
    status: Optional[str] = None
    league: Optional[str] = None
    season: Optional[str] = None
    competition_phase: Optional[str] = None
    competition_phase_label: Optional[str] = None
    competition_unit_type: Optional[str] = None
    competition_unit_label: Optional[str] = None
    competition_unit_value: Optional[str] = None
    matchday: Optional[str] = None
    team_home: Optional[str] = None
    team_away: Optional[str] = None
    observed_team: Optional[str] = None
    observed_team_id: Optional[str] = None
    observed_team_name: Optional[str] = None
    period: Optional[str] = None
    episode_season: Optional[str] = None
    episode_number: Optional[str] = None
    season_code: Optional[str] = None
    episode_code: Optional[str] = None
    overwrite_episode: Optional[bool] = None
    game_time: str
    note: Optional[str] = None
    rating: Optional[int] = None
    extensions: Optional[dict] = None
    extension_labels: Optional[dict] = None


class SceneMarkerUpdate(BaseModel):
    game_time: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None
    episode_season: Optional[str] = None
    episode_number: Optional[str] = None
    season_code: Optional[str] = None
    episode_code: Optional[str] = None
    overwrite_episode: Optional[bool] = None
    rating: Optional[int] = None
    extensions: Optional[dict] = None
    extension_labels: Optional[dict] = None


class ObservationRunCreate(BaseModel):
    league: str
    season: str
    team_id: str
    team_name: str
    player_id: str
    player_name: str
    player_number: Optional[int] = None
    player_position: str
    player_birth_year: Optional[int] = None
    player_notes: Optional[str] = ""
    drill_id: Optional[str] = None
    drill_name: Optional[str] = None
    source: Optional[dict] = None
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
    source: Optional[dict] = None
    note: Optional[str] = ""


class ObservationProfileUpdate(BaseModel):
    player_birth_year: Optional[int] = None
    notes: Optional[str] = None
    summary: Optional[dict] = None
    source_catalog: Optional[List[dict]] = None


class KaderPlayer(BaseModel):
    """Player aus Kaderimport"""
    player_name: str
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    birthplace: Optional[str] = None
    shoots_or_catches: Optional[str] = None
    team: str  # z.B. "ERC Ingolstadt"
    league: str  # z.B. "PENNY DEL"
    source: str  # z.B. "PENNY DEL"
    active: bool = True


class PlayerProfile(BaseModel):
    """Player-Profil aus Kaderimport"""
    player_id: str
    player_name: str
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    birthplace: Optional[str] = None
    shoots_or_catches: Optional[str] = None
    team: str
    league: str
    source: str
    active: bool
    observation_count: int = 0
    summary: str = ""
    last_observed: Optional[str] = None
    created_at: Optional[str] = None

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


def _safe_key(value: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "_", (value or "").strip().lower())


def _build_profile_id(user: str, league: str, player_id: str) -> str:
    return f"profile_{_safe_key(user)}_{_safe_key(league)}_{_safe_key(player_id)}"


def _default_source() -> dict:
    return {
        "source_type": "self_observation",
        "provider": "manual",
        "label": "Eigene Beobachtung",
        "url": "",
        "external_id": "",
        "metadata": {},
        "captured_at": None,
    }


def _normalize_source(raw_source: Optional[dict]) -> dict:
    source = raw_source or {}
    default = _default_source()
    source_type = (source.get("source_type") or "self_observation").strip().lower()
    provider = (source.get("provider") or ("manual" if source_type == "self_observation" else "external")).strip().lower()

    return {
        "source_type": source_type,
        "provider": provider,
        "label": (source.get("label") or default["label"]).strip(),
        "url": (source.get("url") or "").strip(),
        "external_id": (source.get("external_id") or "").strip(),
        "metadata": source.get("metadata") or {},
        "captured_at": source.get("captured_at") or datetime.now().isoformat(),
    }


def _default_summary() -> dict:
    return {
        "text": "",
        "status": "placeholder",
        "updated_at": None,
        "generator": "manual_placeholder",
    }


def _default_integrations() -> dict:
    return {
        "providers": {
            "elite_prospects": {"enabled": False, "status": "not_configured"},
            "instat": {"enabled": False, "status": "not_configured"},
            "wyscout": {"enabled": False, "status": "not_configured"},
            "nhl_video": {"enabled": False, "status": "not_configured"},
            "del_video": {"enabled": False, "status": "not_configured"},
        },
        "planned_capabilities": [
            "load_external_player_data",
            "refresh_statistics",
            "sync_player_information",
            "generate_automatic_summary",
        ],
    }


def _iter_user_observation_profiles(user: str):
    user_norm = _normalize_user_key(user)
    for path in _iter_json_files(OBS_PLAYERS_DIR) or []:
        profile = load_json(path)
        if _normalize_user_key(profile.get("user", "")) != user_norm:
            continue
        yield profile


def _find_observation_profile(user: str, player_id: str, league: Optional[str] = None) -> Optional[dict]:
    matches = []
    for profile in _iter_user_observation_profiles(user):
        if profile.get("player_id") != player_id:
            continue
        if league and profile.get("league") != league:
            continue
        matches.append(profile)

    if not matches:
        return None
    return max(matches, key=lambda item: item.get("updated_at", item.get("created_at", "")))


def _ensure_profile_storage(user: str, run: dict) -> dict:
    profile = _find_observation_profile(user, run.get("player_id"), run.get("league"))
    now_iso = datetime.now().isoformat()

    if profile:
        profile_path = _find_json_file_by_id(OBS_PLAYERS_DIR, profile.get("profile_id"))
    else:
        profile_id = _build_profile_id(user, run.get("league", ""), run.get("player_id", ""))
        profile_path = None
        profile = {
            "profile_id": profile_id,
            "user": run.get("user"),
            "player_id": run.get("player_id"),
            "player_name": run.get("player_name"),
            "team_id": run.get("team_id"),
            "team_name": run.get("team_name"),
            "league": run.get("league"),
            "season": run.get("season"),
            "player_position": run.get("player_position"),
            "player_birth_year": run.get("player_birth_year"),
            "notes": run.get("player_notes") or "",
            "created_at": now_iso,
            "updated_at": now_iso,
            "summary": _default_summary(),
            "source_catalog": [],
            "history": {
                "first_observation": None,
                "last_observation": None,
                "observation_session_count": 0,
                "observation_entry_count": 0,
                "runs": [],
                "observations": [],
                "note_timeline": [],
            },
            "integrations": _default_integrations(),
        }

    profile["player_name"] = run.get("player_name") or profile.get("player_name")
    profile["team_id"] = run.get("team_id") or profile.get("team_id")
    profile["team_name"] = run.get("team_name") or profile.get("team_name")
    profile["season"] = run.get("season") or profile.get("season")
    profile["player_position"] = run.get("player_position") or profile.get("player_position")
    profile["updated_at"] = now_iso
    if run.get("player_birth_year"):
        profile["player_birth_year"] = run.get("player_birth_year")
    if run.get("player_notes"):
        profile["notes"] = run.get("player_notes")

    profile.setdefault("summary", _default_summary())
    profile.setdefault("source_catalog", [])
    profile.setdefault("history", {
        "first_observation": None,
        "last_observation": None,
        "observation_session_count": 0,
        "observation_entry_count": 0,
        "runs": [],
        "observations": [],
        "note_timeline": [],
    })
    profile.setdefault("integrations", _default_integrations())

    source = _normalize_source(run.get("source"))
    if not any(
        (s.get("source_type") == source.get("source_type") and s.get("label") == source.get("label") and s.get("external_id") == source.get("external_id"))
        for s in profile.get("source_catalog", [])
    ):
        profile["source_catalog"].append(source)

    history = profile["history"]
    history.setdefault("runs", [])
    history.setdefault("observations", [])
    history.setdefault("note_timeline", [])

    if not any(r.get("run_id") == run.get("run_id") for r in history["runs"]):
        history["runs"].append(
            {
                "run_id": run.get("run_id"),
                "created_at": run.get("created_at"),
                "league": run.get("league"),
                "season": run.get("season"),
                "team_id": run.get("team_id"),
                "team_name": run.get("team_name"),
                "drill_id": run.get("drill_id"),
                "drill_name": run.get("drill_name"),
                "run_note": run.get("notes") or "",
                "source": source,
            }
        )

    history["observation_session_count"] = len(history["runs"])
    observed_timestamps = [r.get("created_at") for r in history["runs"] if r.get("created_at")]
    if observed_timestamps:
        history["first_observation"] = min(observed_timestamps)
        history["last_observation"] = max(observed_timestamps)

    if run.get("notes"):
        history["note_timeline"].append(
            {
                "created_at": run.get("created_at"),
                "run_id": run.get("run_id"),
                "entry_id": None,
                "note": run.get("notes"),
                "source": source,
            }
        )

    if not profile_path:
        profile_path = _build_observation_storage_path(OBS_PLAYERS_DIR, profile["profile_id"], profile.get("created_at"))
    save_json(profile_path, profile)
    return profile


def _append_observation_to_profile(user: str, run: dict, entry: dict) -> None:
    profile = _ensure_profile_storage(user, run)
    profile_path = _find_json_file_by_id(OBS_PLAYERS_DIR, profile.get("profile_id"))
    if not profile_path:
        return

    source = _normalize_source(entry.get("source"))
    history = profile.setdefault("history", {})
    history.setdefault("observations", [])
    history.setdefault("note_timeline", [])

    history["observations"].append(
        {
            "entry_id": entry.get("entry_id"),
            "run_id": entry.get("run_id"),
            "created_at": entry.get("created_at"),
            "drill_id": run.get("drill_id"),
            "drill_name": run.get("drill_name"),
            "game": {
                "league": run.get("league"),
                "season": run.get("season"),
                "team_name": run.get("team_name"),
            },
            "note": entry.get("note") or "",
            "source": source,
        }
    )
    history["observation_entry_count"] = len(history["observations"])

    timestamps = [item.get("created_at") for item in history["observations"] if item.get("created_at")]
    run_times = [item.get("created_at") for item in history.get("runs", []) if item.get("created_at")]
    combined = [*timestamps, *run_times]
    if combined:
        history["first_observation"] = min(combined)
        history["last_observation"] = max(combined)

    if entry.get("note"):
        history["note_timeline"].append(
            {
                "created_at": entry.get("created_at"),
                "run_id": entry.get("run_id"),
                "entry_id": entry.get("entry_id"),
                "note": entry.get("note"),
                "source": source,
            }
        )

    if not any(
        (s.get("source_type") == source.get("source_type") and s.get("label") == source.get("label") and s.get("external_id") == source.get("external_id"))
        for s in profile.get("source_catalog", [])
    ):
        profile.setdefault("source_catalog", []).append(source)

    profile["updated_at"] = datetime.now().isoformat()
    save_json(profile_path, profile)


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


def _load_team_players(team_id: str) -> dict:
    """Lädt alle Spieler eines Teams aus players_dir."""
    players_file = os.path.join(PLAYERS_DIR, f"{team_id}_players.json")
    if os.path.exists(players_file):
        try:
            with open(players_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {p.get('player_id'): p for p in data.get('players', [])}
        except Exception as e:
            print(f"[Players] Fehler beim Laden von {players_file}: {e}")
    return {}


def _get_active_team_players(team_id: str) -> List[dict]:
    """Gibt aktive Spieler eines Teams zurück."""
    players = _load_team_players(team_id)
    return [p for p in players.values() if p.get('active', True)]


def _touch_player_observation(team_id: str, player_id: str, observed_at: Optional[str]) -> None:
    """Aktualisiert observation_count/last_observed für importierte Spieler."""
    players_file = os.path.join(PLAYERS_DIR, f"{team_id}_players.json")
    if not os.path.exists(players_file):
        return

    try:
        data = load_json(players_file)
    except Exception:
        return

    players = data.get("players") or []
    changed = False
    for player in players:
        if player.get("player_id") != player_id:
            continue
        player["observation_count"] = int(player.get("observation_count") or 0) + 1
        player["last_observed"] = observed_at or datetime.now().isoformat()
        changed = True
        break

    if not changed:
        return

    data["updated_at"] = datetime.utcnow().isoformat() + "Z"
    save_json(players_file, data)


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
    enforce_max_text_length(payload.player_notes, "observation_run.player_notes")
    enforce_max_text_length(payload.source, "observation_run.source")

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
        "player_birth_year": payload.player_birth_year,
        "player_notes": payload.player_notes or "",
        "drill_id": payload.drill_id,
        "drill_name": payload.drill_name,
        "source": _normalize_source(payload.source),
        "created_at": now_iso,
        "notes": payload.notes or "",
        "status": "active",
    }

    run_path = _build_observation_storage_path(OBS_RUNS_DIR, run_id, now_iso)
    save_json(run_path, run)
    _ensure_profile_storage(current_user, run)
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
    enforce_max_text_length(payload.source, "observation_entry.source")

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
        "drill_id": run.get("drill_id"),
        "drill_name": run.get("drill_name"),
        "source": _normalize_source(payload.source or run.get("source")),
        "dimensions": payload.dimensions.model_dump(),
        "note": payload.note or "",
    }

    entry_path = _build_observation_storage_path(OBS_ENTRIES_DIR, entry_id, now_iso)
    save_json(entry_path, entry)
    _append_observation_to_profile(current_user, run, entry)
    _touch_player_observation(run.get("team_id", ""), run.get("player_id", ""), now_iso)
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
    profiles = list(_iter_user_observation_profiles(current_user))
    profile_by_key = {
        (p.get("league"), p.get("player_id")): p for p in profiles
    }

    for player in players:
        profile = profile_by_key.get((player.get("league"), player.get("player_id")))
        if not profile:
            continue
        history = profile.get("history") or {}
        player["first_observation"] = history.get("first_observation")
        player["last_observation"] = history.get("last_observation") or player.get("last_observation")
        player["observation_session_count"] = history.get("observation_session_count", 0)
        player["observation_entry_count"] = history.get("observation_entry_count", player.get("observation_count", 0))
        player["summary"] = profile.get("summary") or _default_summary()

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
    profile = _find_observation_profile(current_user, player_id, league)
    if profile and player:
        history = profile.get("history") or {}
        player["first_observation"] = history.get("first_observation")
        player["last_observation"] = history.get("last_observation") or player.get("last_observation")
        player["observation_session_count"] = history.get("observation_session_count", 0)
        player["observation_entry_count"] = history.get("observation_entry_count", player.get("observation_count", 0))
        player["summary"] = profile.get("summary") or _default_summary()

    entries.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return {"player": player, "observations": entries, "profile": profile}


@app.get("/api/observation-profiles")
async def get_observation_profiles(
    league: Optional[str] = None,
    season: Optional[str] = None,
    team_id: Optional[str] = None,
    player_id: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    profiles = []
    for profile in _iter_user_observation_profiles(current_user):
        if league and profile.get("league") != league:
            continue
        if season and profile.get("season") != season:
            continue
        if team_id and profile.get("team_id") != team_id:
            continue
        if player_id and profile.get("player_id") != player_id:
            continue
        profiles.append(profile)

    profiles.sort(key=lambda item: item.get("updated_at", item.get("created_at", "")), reverse=True)
    return {"profiles": profiles}


@app.get("/api/observation-profiles/{player_id}")
async def get_observation_profile(
    player_id: str,
    league: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    profile = _find_observation_profile(current_user, player_id, league)
    if not profile:
        raise HTTPException(status_code=404, detail="Observation profile not found")
    return profile


@app.patch("/api/observation-profiles/{player_id}")
async def patch_observation_profile(
    player_id: str,
    payload: ObservationProfileUpdate,
    league: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    profile = _find_observation_profile(current_user, player_id, league)
    if not profile:
        raise HTTPException(status_code=404, detail="Observation profile not found")

    profile_path = _find_json_file_by_id(OBS_PLAYERS_DIR, profile.get("profile_id"))
    if not profile_path:
        raise HTTPException(status_code=404, detail="Observation profile file missing")

    if payload.notes is not None:
        enforce_max_text_length(payload.notes, "observation_profile.notes")
        profile["notes"] = payload.notes

    if payload.player_birth_year is not None:
        profile["player_birth_year"] = payload.player_birth_year

    if payload.summary is not None:
        enforce_max_text_length(payload.summary, "observation_profile.summary")
        merged_summary = {**_default_summary(), **(profile.get("summary") or {}), **payload.summary}
        merged_summary["updated_at"] = datetime.now().isoformat()
        profile["summary"] = merged_summary

    if payload.source_catalog is not None:
        enforce_max_text_length(payload.source_catalog, "observation_profile.source_catalog")
        profile["source_catalog"] = [_normalize_source(item) for item in payload.source_catalog]

    profile["updated_at"] = datetime.now().isoformat()
    save_json(profile_path, profile)
    return profile


# ---- Kaderimport Endpoints ----

@app.get("/api/players/importable-teams")
async def list_importable_teams(current_user: str = Depends(get_current_user)):
    """Gibt Liste der Teams aus Konfigurationsdatei zurück."""
    importer = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE)
    teams = importer.list_teams(enabled_only=False)
    return {
        "teams": [
            {
                "id": team.get("id"),
                "slug": team.get("slug"),
                "name": team.get("team"),
                "league": team.get("league"),
                "url": team.get("url"),
                "enabled": bool(team.get("enabled")),
                "status": "supported" if team.get("enabled") else "planned",
            }
            for team in teams
        ],
        "note": "Teams werden aus data/academy/penny_del_import_teams.json geladen",
    }


@app.post("/api/players/import")
async def import_players(
    team_id: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """
    Importiert Spieler für ein Team.
    
    Unterstützte Teams kommen aus der Konfigurationsdatei.
    
    Upsert-Logik:
    - Neue Spieler: erstellen
    - Existierende Spieler: aktualisieren
    - Inaktive Spieler: active=false markieren (nicht löschen)
    """
    importer = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE)
    configured_teams = importer.list_teams(enabled_only=False)
    if not configured_teams:
        raise HTTPException(status_code=500, detail={"error": "Keine Team-Konfiguration gefunden"})

    if not team_id:
        first_enabled = next((team for team in configured_teams if team.get("enabled")), configured_teams[0])
        team_id = first_enabled.get("id")

    valid_teams = [team.get("id") for team in configured_teams]
    if team_id not in valid_teams:
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Team '{team_id}' wird noch nicht unterstützt",
                "supported_teams": valid_teams,
            },
        )

    try:
        result = importer.import_team(team_id)

        if result.get("error"):
            raise HTTPException(status_code=502, detail=result)

        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Import] Fehler beim Import: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "team_id": team_id,
            },
        )


@app.post("/api/players/import-all")
async def import_all_players(current_user: str = Depends(get_current_user)):
    importer = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE)
    results = importer.import_all_enabled()
    if not results:
        raise HTTPException(status_code=400, detail={"error": "Keine aktivierten Teams in der Konfiguration"})
    return {"results": results, "total": len(results)}


@app.get("/api/players/team/{team_id}")
async def get_team_players(team_id: str, active_only: bool = True, current_user: str = Depends(get_current_user)):
    """Gibt alle Spieler eines Teams zurück."""
    players = _load_team_players(team_id)

    if active_only:
        players_list = [p for p in players.values() if p.get('active', True)]
    else:
        players_list = list(players.values())

    players_list.sort(key=lambda p: (p.get('jersey_number') or 999))

    return {
        "team_id": team_id,
        "players": players_list,
        "total": len(players_list),
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/api/players/{player_id}/refresh-profile")
async def refresh_player_profile_placeholder(player_id: str, current_user: str = Depends(get_current_user)):
    """Platzhalter für spätere KI-Profilaktualisierung (noch nicht implementiert)."""
    return {
        "player_id": player_id,
        "status": "not_implemented",
        "message": "Profil aktualisieren via OpenAI wird in einem späteren Schritt aktiviert.",
    }



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
        session['observation_scope'] = _normalize_observation_scope(session.get('observation_scope'))
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
        "observation_scope": _normalize_observation_scope(session.observation_scope),
        "state": "IN_PROGRESS",  # Start as in progress instead of PRE
        "current_phase": _initial_phase_for_scope(session.observation_scope),
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
        "observed_team_id": session.observed_team_id,
        "observed_team_name": session.observed_team_name,
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
    session = load_json(session_path)
    scope = _normalize_observation_scope(session.get("observation_scope"))
    active_periods = _active_periods_for_scope(scope)
    current_phase = (session.get("current_phase") or "").strip().upper()
    should_save = False

    session["observation_scope"] = scope

    if current_phase == "PRE" or not current_phase:
        session["current_phase"] = _initial_phase_for_scope(scope)
        should_save = True
    elif current_phase in {"P1", "P2", "P3"} and current_phase not in set(active_periods):
        if not session.get("checkins"):
            session["current_phase"] = _initial_phase_for_scope(scope)
            should_save = True

    if should_save:
        save_json(session_path, session)
    return session

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
    if phase_norm == "PRE":
        session["current_phase"] = _initial_phase_for_scope(session.get("observation_scope"))
        save_json(session_path, session)
        return session

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
        session["current_phase"] = _initial_phase_for_scope(session.get("observation_scope")) if phase_data["phase"] == "PRE" else phase_data["phase"]
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


# ---- RingAbout Scene Marker ----

def _build_scene_path(scene_id: str, created_at: Optional[str]) -> str:
    dt = _parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return os.path.join(SCENES_DIR, year, month, f"{scene_id}.json")


def _normalize_observation_scope(scope: Optional[str]) -> str:
    value = (scope or "").strip().upper()
    if value in OBSERVATION_SCOPE_LABELS:
        return value
    return "FULL_GAME"


def _active_periods_for_scope(scope: Optional[str]) -> List[str]:
    normalized = _normalize_observation_scope(scope)
    if normalized == "P1":
        return ["P1"]
    if normalized == "P2":
        return ["P2"]
    if normalized == "P3":
        return ["P3"]
    return ["P1", "P2", "P3"]


def _initial_phase_for_scope(scope: Optional[str]) -> str:
    return _active_periods_for_scope(scope)[0]


def _normalize_scene_status(status: Optional[str]) -> str:
    value = (status or "").strip().upper()
    if value == SCENE_STATUS_ASSIGNED:
        return SCENE_STATUS_ASSIGNED
    return SCENE_STATUS_NEW


def _normalize_episode_season(episode_season: Optional[str]) -> Optional[str]:
    return _normalize_episode_code_part(episode_season, 2, "episode_season")


def _normalize_episode_number(episode_number: Optional[str]) -> Optional[str]:
    return _normalize_episode_code_part(episode_number, 3, "episode_number")


def _normalize_episode_code_part(value: Optional[str], width: int, field_name: str, *, strict: bool = False) -> Optional[str]:
    value = (value or "").strip()
    if not value:
        return None

    digits = value if value.isdigit() else re.sub(r"\D", "", value)
    if not digits:
        raise HTTPException(status_code=400, detail=f"{field_name} must contain digits")
    if strict and not value.isdigit():
        raise HTTPException(status_code=400, detail=f"{field_name} must contain digits only")
    if len(digits) > width:
        raise HTTPException(status_code=400, detail=f"{field_name} must be at most {width} digits")
    return digits.zfill(width)


def _normalize_episode_season_input(episode_season: Optional[str]) -> Optional[str]:
    return _normalize_episode_code_part(episode_season, 2, "episode_season", strict=True)


def _normalize_episode_number_input(episode_number: Optional[str]) -> Optional[str]:
    return _normalize_episode_code_part(episode_number, 3, "episode_number", strict=True)


def _scene_episode_season(scene: dict) -> Optional[str]:
    return _normalize_episode_season(scene.get("episode_season") or scene.get("season_code"))


def _scene_episode_number(scene: dict) -> Optional[str]:
    return _normalize_episode_number(scene.get("episode_number") or scene.get("episode_code"))


def _scene_track_key(scene: dict) -> str:
    track_id = (scene.get("track_id") or "").strip()
    if track_id:
        return track_id
    module_id = (scene.get("module_id") or "").strip()
    return module_id.split("_")[0] if module_id else ""


def _find_episode_conflict(episode_season: str, episode_number: str, current_user: str, exclude_scene_id: Optional[str] = None) -> Optional[dict]:
    user_key = _normalize_user_key(current_user)
    for path in _iter_json_files(SCENES_DIR):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if exclude_scene_id and scene.get("id") == exclude_scene_id:
            continue
        if _normalize_user_key(scene.get("user", "")) != user_key:
            continue
        if _scene_episode_season(scene) != episode_season:
            continue
        if _scene_episode_number(scene) != episode_number:
            continue
        return scene
    return None



def _normalize_scene_code(value: Optional[str]) -> Optional[str]:
    value = (value or "").strip().upper()
    if not value:
        return None
    match = re.fullmatch(r"SC(\d+)", value)
    if not match:
        return None
    number = int(match.group(1))
    if number < 1:
        return None
    return f"{SCENE_CODE_PREFIX}{number:0{SCENE_CODE_WIDTH}d}"


def _scene_code_number(scene: dict) -> Optional[int]:
    scene_code = _normalize_scene_code(scene.get("scene_code") or scene.get("internal_scene_id"))
    if not scene_code:
        return None
    return int(scene_code[len(SCENE_CODE_PREFIX):])


def _load_scene_code_counter() -> int:
    if not os.path.exists(SCENE_CODE_COUNTER_FILE):
        return SCENE_CODE_LEGACY_FLOOR
    try:
        data = load_json(SCENE_CODE_COUNTER_FILE)
    except Exception:
        return SCENE_CODE_LEGACY_FLOOR
    value = data.get("last_number")
    return value if isinstance(value, int) and value > 0 else SCENE_CODE_LEGACY_FLOOR


def _save_scene_code_counter(last_number: int) -> None:
    save_json(SCENE_CODE_COUNTER_FILE, {
        "prefix": SCENE_CODE_PREFIX,
        "last_number": last_number,
        "updated_at": datetime.now().isoformat(),
    })


def _ensure_legacy_scene_codes() -> int:
    paths = list(_iter_json_files(SCENES_DIR) or [])
    scenes_with_paths = []
    used_numbers = set()

    for path in paths:
        try:
            scene = load_json(path)
        except Exception:
            continue
        number = _scene_code_number(scene)
        if number is not None:
            scene_code = f"{SCENE_CODE_PREFIX}{number:0{SCENE_CODE_WIDTH}d}"
            if scene.get("scene_code") != scene_code:
                scene["scene_code"] = scene_code
                save_json(path, scene)
            used_numbers.add(number)
        scenes_with_paths.append((path, scene))

    legacy_candidate = 1
    for path, scene in sorted(scenes_with_paths, key=lambda item: (item[1].get("created_at", ""), item[1].get("id", ""))):
        if _scene_code_number(scene) is not None:
            continue
        while legacy_candidate in used_numbers:
            legacy_candidate += 1
        scene_code = f"{SCENE_CODE_PREFIX}{legacy_candidate:0{SCENE_CODE_WIDTH}d}"
        scene["scene_code"] = scene_code
        save_json(path, scene)
        used_numbers.add(legacy_candidate)
        legacy_candidate += 1

    highest_existing = max(used_numbers, default=0)
    last_number = max(_load_scene_code_counter(), highest_existing, SCENE_CODE_LEGACY_FLOOR)
    if last_number != _load_scene_code_counter() or not os.path.exists(SCENE_CODE_COUNTER_FILE):
        _save_scene_code_counter(last_number)
    return last_number


def _allocate_scene_code() -> str:
    with SCENE_CODE_LOCK:
        highest_number = _ensure_legacy_scene_codes()
        next_number = highest_number + 1
        _save_scene_code_counter(next_number)
        return f"{SCENE_CODE_PREFIX}{next_number:0{SCENE_CODE_WIDTH}d}"


def _find_scene_path_by_identifier(identifier: str) -> Optional[str]:
    scene_path = _find_json_file_by_id(SCENES_DIR, identifier)
    if scene_path:
        return scene_path

    scene_code = _normalize_scene_code(identifier)
    if not scene_code:
        return None

    for path in _iter_json_files(SCENES_DIR):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if _normalize_scene_code(scene.get("scene_code") or scene.get("internal_scene_id")) == scene_code:
            return path
    return None


@app.post("/api/scenes")
async def create_scene(payload: SceneMarkerCreate, current_user: str = Depends(get_current_user)):
    import re
    if not re.match(r"^\d{1,2}(:\d{1,2})?$", (payload.game_time or "").strip()):
        raise HTTPException(status_code=400, detail="game_time must be a valid time, e.g. 13:42 or 13")

    enforce_max_text_length(payload.note, "scene.note")
    enforce_max_text_length(payload.drill_title, "scene.drill_title")

    user_cased = _resolve_user_cased(current_user)
    now_iso = datetime.now().isoformat()
    scene_id = f"scene_{int(datetime.now().timestamp())}_{uuid4().hex[:6]}"
    episode_season = _normalize_episode_season_input(payload.season_code or payload.episode_season)
    episode_number = _normalize_episode_number_input(payload.episode_code or payload.episode_number)

    if episode_season and episode_number:
        conflict = _find_episode_conflict(episode_season, episode_number, current_user)
        if conflict and not payload.overwrite_episode:
            conflict_label = conflict.get("drill_title") or conflict.get("drill_id") or conflict.get("id")
            raise HTTPException(
                status_code=409,
                detail={
                    "message": f"Episode {episode_season} / {episode_number} ist bereits vergeben.",
                    "conflict_scene_id": conflict.get("id"),
                    "conflict_scene_label": conflict_label,
                },
            )

    scene_code = _allocate_scene_code()

    scene = {
        "id": scene_id,
        "scene_code": scene_code,
        "user": user_cased,
        "session_id": payload.session_id,
        "module_id": payload.module_id,
        "drill_id": payload.drill_id,
        "drill_title": payload.drill_title,
        "track_id": payload.track_id,
        "status": _normalize_scene_status(payload.status),
        "league": payload.league,
        "season": payload.season,
        "competition_phase": payload.competition_phase,
        "competition_phase_label": payload.competition_phase_label,
        "competition_unit_type": payload.competition_unit_type,
        "competition_unit_label": payload.competition_unit_label,
        "competition_unit_value": payload.competition_unit_value,
        "matchday": payload.matchday,
        "team_home": payload.team_home,
        "team_away": payload.team_away,
        "observed_team": payload.observed_team,
        "observed_team_id": payload.observed_team_id,
        "observed_team_name": payload.observed_team_name or payload.observed_team,
        "period": payload.period,
        "episode_season": episode_season,
        "episode_number": episode_number,
        "season_code": episode_season,
        "episode_code": episode_number,
        "game_time": payload.game_time.strip(),
        "note": (payload.note or "").strip(),
        "rating": _normalize_scene_rating(payload.rating),
        "extensions": payload.extensions or {},
        "extension_labels": payload.extension_labels or {},
        "created_at": now_iso,
    }

    scene_path = _build_scene_path(scene_id, now_iso)
    save_json(scene_path, scene)
    logging.info(f"[scene] created scene_id={scene_id} scene_code={scene_code} user={user_cased} game_time={scene['game_time']}")
    return scene


@app.get("/api/scenes")
async def get_scenes(
    league: Optional[str] = None,
    season: Optional[str] = None,
    team: Optional[str] = None,
    status: Optional[str] = None,
    track_id: Optional[str] = None,
    drill_id: Optional[str] = None,
    competition_phase: Optional[str] = None,
    competition_unit_type: Optional[str] = None,
    competition_unit_value: Optional[str] = None,
    episode_season: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    user_norm = _normalize_user_key(current_user)
    scenes = []
    with SCENE_CODE_LOCK:
        _ensure_legacy_scene_codes()
    for path in _iter_json_files(SCENES_DIR):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if _normalize_user_key(scene.get("user", "")) != user_norm:
            continue
        if league and scene.get("league") != league:
            continue
        if season and scene.get("season") != season:
            continue
        if team:
            team_norm = team.strip().lower()
            home_match = (scene.get("team_home") or "").strip().lower() == team_norm
            away_match = (scene.get("team_away") or "").strip().lower() == team_norm
            obs_match = ((scene.get("observed_team_name") or scene.get("observed_team") or "").strip().lower() == team_norm)
            if not (home_match or away_match or obs_match):
                continue
        scene_status = _normalize_scene_status(scene.get("status"))
        if status and scene_status != _normalize_scene_status(status):
            continue
        if track_id and _scene_track_key(scene) != track_id:
            continue
        if drill_id and scene.get("drill_id") != drill_id:
            continue
        if competition_phase and scene.get("competition_phase") != competition_phase:
            continue
        if competition_unit_type and scene.get("competition_unit_type") != competition_unit_type:
            continue
        if competition_unit_value and str(scene.get("competition_unit_value") or "") != str(competition_unit_value):
            continue
        if episode_season and _scene_episode_season(scene) != _normalize_episode_season(episode_season):
            continue
        scene["status"] = scene_status
        scene["scene_code"] = _normalize_scene_code(scene.get("scene_code") or scene.get("internal_scene_id"))
        scene["episode_season"] = _scene_episode_season(scene)
        scene["episode_number"] = _scene_episode_number(scene)
        scene["season_code"] = scene["episode_season"]
        scene["episode_code"] = scene["episode_number"]
        scenes.append(scene)

    scenes.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    return {"scenes": scenes}


@app.delete("/api/scenes/{scene_id}")
async def delete_scene(scene_id: str, current_user: str = Depends(get_current_user)):
    scene_path = _find_scene_path_by_identifier(scene_id)
    if not scene_path:
        raise HTTPException(status_code=404, detail="Scene not found")
    scene = load_json(scene_path)
    if _normalize_user_key(scene.get("user", "")) != _normalize_user_key(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    os.remove(scene_path)
    logging.info(f"[scene] deleted scene_id={scene_id} user={current_user}")
    return {"status": "deleted", "id": scene_id}


@app.put("/api/scenes/{scene_id}")
async def update_scene(scene_id: str, payload: SceneMarkerUpdate, current_user: str = Depends(get_current_user)):
    scene_path = _find_scene_path_by_identifier(scene_id)
    if not scene_path:
        raise HTTPException(status_code=404, detail="Scene not found")
    scene = load_json(scene_path)
    if _normalize_user_key(scene.get("user", "")) != _normalize_user_key(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Update game_time if provided
    if payload.game_time is not None:
        import re
        trimmed = payload.game_time.strip()
        if not re.match(r"^\d{1,2}(:\d{1,2})?$", trimmed):
            raise HTTPException(status_code=400, detail="game_time must be a valid time, e.g. 13:42 or 13")
        scene["game_time"] = trimmed
    
    # Update note if provided
    if payload.note is not None:
        enforce_max_text_length(payload.note, "scene.note")
        scene["note"] = payload.note.strip()

    if payload.status is not None:
        scene["status"] = _normalize_scene_status(payload.status)

    episode_season = _scene_episode_season(scene)
    episode_number = _scene_episode_number(scene)
    episode_fields_touched = False

    requested_episode_season = payload.season_code if payload.season_code is not None else payload.episode_season
    requested_episode_number = payload.episode_code if payload.episode_code is not None else payload.episode_number

    if requested_episode_season is not None:
        episode_season = _normalize_episode_season_input(requested_episode_season)
        scene["episode_season"] = episode_season
        scene["season_code"] = episode_season
        episode_fields_touched = True

    if requested_episode_number is not None:
        episode_number = _normalize_episode_number_input(requested_episode_number)
        scene["episode_number"] = episode_number
        scene["episode_code"] = episode_number
        episode_fields_touched = True

    if episode_season and episode_number:
        scene["status"] = SCENE_STATUS_ASSIGNED
    elif episode_fields_touched and payload.status is None:
        scene["status"] = SCENE_STATUS_NEW

    if episode_fields_touched and episode_season and episode_number:
        conflict = _find_episode_conflict(episode_season, episode_number, current_user, exclude_scene_id=scene_id)
        if conflict and not payload.overwrite_episode:
            conflict_label = conflict.get("drill_title") or conflict.get("drill_id") or conflict.get("id")
            raise HTTPException(
                status_code=409,
                detail={
                    "message": f"Episode {episode_season} / {episode_number} ist bereits vergeben.",
                    "conflict_scene_id": conflict.get("id"),
                    "conflict_scene_label": conflict_label,
                },
            )
    
    payload_fields = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))
    if "rating" in payload_fields:
        scene["rating"] = _normalize_scene_rating(payload.rating)
    
    # Update extensions if provided
    if payload.extensions is not None:
        scene["extensions"] = payload.extensions
    
    # Update extension_labels if provided
    if payload.extension_labels is not None:
        scene["extension_labels"] = payload.extension_labels
    
    scene["updated_at"] = datetime.now().isoformat()
    save_json(scene_path, scene)
    logging.info(f"[scene] updated scene_id={scene_id} user={current_user}")
    return scene


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