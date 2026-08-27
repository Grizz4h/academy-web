import os

_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _load_env_files() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(os.path.join(_ROOT_DIR, ".env"))
    load_dotenv(os.path.join(_ROOT_DIR, ".env.local"))


_load_env_files()

import json
import jwt
from datetime import datetime, timedelta
from fastapi import Header, HTTPException, Depends, Request
from auth_utils import hash_password, verify_password
from player_importer import PennyDelImporter
from del_data.season_utils import season_to_display, season_to_file_key
from del_data.team_mapping import TeamCatalogMapper
from del_data.roster_store import (
    get_team_roster_snapshot,
    upsert_team_roster_snapshot,
    migrate_legacy_team_players_to_season,
    roster_status_summary,
    load_roster_catalog,
)
from del_data.game_store import (
    list_games,
    get_game,
    upsert_games,
    games_status_summary,
    update_game_stats,
)
from del_data.schedule_importer import PennyDelScheduleImporter
from del_data.spieldetails_importer import PennyDelSpieldetailsImporter
# JWT config
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "academy")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
JWT_ALGO = "HS256"
JWT_EXP_DAYS = 7
_MIN_JWT_SECRET_LEN = 32


def _resolve_jwt_secret() -> str:
    """Require a real secret — never fall back to a hardcoded default."""
    secret = (os.environ.get("ACADEMY_JWT_SECRET") or "").strip()
    if not secret:
        raise RuntimeError(
            "ACADEMY_JWT_SECRET is missing. Set it in the server environment "
            "(.env / .env.local). Do not commit the value."
        )
    if secret == "dev-secret":
        raise RuntimeError(
            "ACADEMY_JWT_SECRET must not be the insecure default value 'dev-secret'."
        )
    if len(secret) < _MIN_JWT_SECRET_LEN:
        raise RuntimeError(
            f"ACADEMY_JWT_SECRET must be at least {_MIN_JWT_SECRET_LEN} characters."
        )
    return secret


JWT_SECRET = _resolve_jwt_secret()

IDENTITY_STORE_FILE = os.path.join(DATA_DIR, "identity_store.json")
ROOT_DATA_DIR_EARLY = os.path.abspath(os.path.join(DATA_DIR, ".."))
IDENTITY_BACKUP_ROOT = os.path.join(ROOT_DATA_DIR_EARLY, "backups")

from identity.context import (
    AuthContext,
    LEGACY_PASSWORD_PROVIDER,
    MANAGED_AUTH_PROVIDERS,
    SUPABASE_EMAIL_PROVIDER,
    SUPABASE_GOOGLE_PROVIDER,
)
from identity.store import configure_identity_store, normalize_subject
from identity.migrate import owners_match as _identity_owners_match
from security_guards import (
    is_admin_auth,
    is_creator_mode_auth,
    is_dev_access_auth,
    legacy_signup_allowed,
    rate_limit,
    client_ip,
)
from supabase_auth import (
    supabase_configured,
    verify_supabase_access_token,
)
from repositories import (
    ConflictError,
    DuplicateAuthLinkError,
    NotFoundError,
    configure_repositories,
    get_repos,
)
from entitlements.curriculum_filter import assert_session_module_access, filter_curriculum_for_user
from entitlements.feature_keys import validate_feature_key, validate_grant_source

_identity_store = configure_identity_store(IDENTITY_STORE_FILE)


def load_users():
    """Legacy credential bundle. Prefer get_repos().credentials for new code."""
    if not os.path.exists(USERS_FILE):
        print("[AUTH] USERS_FILE (not found):", USERS_FILE)
        return {"users": []}
    print("[AUTH] USERS_FILE =", USERS_FILE)
    return get_repos().credentials.load_bundle()


def save_users(data):
    get_repos().credentials.save_bundle(data)


def _display_name_for_username(username: str) -> str:
    users = load_users()
    key = normalize_subject(username)
    for row in users.get("users") or []:
        if normalize_subject(row.get("username") or "") == key:
            return row.get("username") or username
    return username


def _identity_repo():
    """Prefer repository wiring (JSON or Postgres). Fallback: legacy IdentityStore."""
    try:
        return get_repos().identity
    except RuntimeError:
        return _identity_store


def resolve_auth_context_from_legacy_sub(sub: str) -> AuthContext:
    """Map JWT sub (legacy username) → AuthContext via identity store. Never treats sub as rinq_user_id."""
    subject = normalize_subject(sub)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    display = _display_name_for_username(subject)
    # Must exist in users.json for legacy password auth
    users = load_users()
    if not any(normalize_subject(u.get("username") or "") == subject for u in users.get("users") or []):
        raise HTTPException(status_code=401, detail="Invalid token")
    return _identity_repo().ensure_legacy_identity(subject, display_name=display)


def _supabase_link_provider(claims: dict):
    """Map Supabase app_metadata → RinQ auth_link provider. Never uses email as subject."""
    app_meta = claims.get("app_metadata") if isinstance(claims.get("app_metadata"), dict) else {}
    provider = str((app_meta or {}).get("provider") or "").strip().lower()
    providers = (app_meta or {}).get("providers") or []
    if isinstance(providers, str):
        providers = [providers]
    providers_l = [str(p).lower() for p in providers]
    if provider == "google" or "google" in providers_l:
        return SUPABASE_GOOGLE_PROVIDER
    if provider == "email" or "email" in providers_l:
        return SUPABASE_EMAIL_PROVIDER
    return None


def resolve_auth_context_from_supabase_claims(claims: dict) -> AuthContext:
    """Map verified Supabase JWT → AuthContext. Creates identity on first login (no email merge)."""
    sub = str(claims.get("sub") or "").strip()
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    link_provider = _supabase_link_provider(claims)
    if not link_provider:
        raise HTTPException(status_code=401, detail="Unsupported sign-in method")
    # Stable subject = Supabase auth user id (JWT sub). Never email address.
    return _identity_repo().ensure_provider_identity(
        link_provider,
        sub,
        display_name=None,
    )


def get_current_user(authorization: str = Header(None)) -> AuthContext:
    """Authenticate legacy academy JWT or Supabase access token → AuthContext."""
    user = resolve_user_from_authorization(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def resolve_user_from_authorization(authorization: str | None) -> AuthContext | None:
    """Best-effort auth resolution; None when header missing or token invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    # 1) Legacy academy JWT (HS256 / ACADEMY_JWT_SECRET)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        sub = payload.get("sub")
        if sub and str(sub).strip():
            return resolve_auth_context_from_legacy_sub(str(sub).strip())
    except jwt.PyJWTError:
        pass
    except Exception:
        pass

    # 2) Supabase access token (JWKS / optional SUPABASE_JWT_SECRET)
    if supabase_configured():
        try:
            claims = verify_supabase_access_token(token)
            return resolve_auth_context_from_supabase_claims(claims)
        except HTTPException:
            return None
        except Exception:
            logging.warning("[SEC] supabase_auth_failed")
            return None

    return None


def _role_from_auth(user: AuthContext) -> str | None:
    record = _find_user_record(user)
    return (record or {}).get("role") if isinstance(record, dict) else None


def _raise_entitlement_denied(exc: PermissionError) -> None:
    detail = "Premium access required"
    msg = str(exc)
    if msg.startswith("entitlement_required:"):
        module = msg.split(":", 1)[1].strip()
        if module:
            detail = f"Premium access required for module {module}"
    raise HTTPException(status_code=403, detail=detail)


def _require_module_access(
    user: AuthContext,
    module_id: str | None,
    *,
    learning_area: str | None = None,
) -> None:
    from entitlements.access_service import AccessResource, require_access

    try:
        require_access(
            user,
            AccessResource(
                kind="module",
                module_id=module_id,
                learning_area=learning_area,
            ),
            role_from_record=_role_from_auth(user),
        )
    except PermissionError as exc:
        _raise_entitlement_denied(exc)


def _require_session_module_access(user: AuthContext, session: dict) -> None:
    try:
        assert_session_module_access(
            user,
            session,
            role_from_record=_role_from_auth(user),
        )
    except PermissionError as exc:
        _raise_entitlement_denied(exc)


def require_admin(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
) -> AuthContext:
    """Server-side admin gate for import/dev mutation endpoints."""
    rate_limit(request, "admin_api", limit=120, window_sec=60.0)
    users = load_users()
    key = normalize_subject(current_user.legacy_username or current_user.auth_subject)
    record = next(
        (u for u in users.get("users", []) if normalize_subject(u.get("username") or "") == key),
        None,
    )
    role = (record or {}).get("role") if isinstance(record, dict) else None
    if not is_admin_auth(current_user, role_from_record=role):
        # logging may not be configured yet at first import; use print fallback
        try:
            logging.warning(
                "[SEC] admin_denied subject=%s path=%s ip=%s",
                current_user.auth_subject,
                request.url.path,
                client_ip(request),
            )
        except Exception:
            print(f"[SEC] admin_denied subject={current_user.auth_subject}")
        raise HTTPException(status_code=403, detail="Admin required")
    return current_user


def require_dev_access(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
) -> AuthContext:
    """DevLab routes and progression preview — not admin import APIs."""
    rate_limit(request, "dev_api", limit=180, window_sec=60.0)
    users = load_users()
    key = normalize_subject(current_user.legacy_username or current_user.auth_subject)
    record = next(
        (u for u in users.get("users", []) if normalize_subject(u.get("username") or "") == key),
        None,
    )
    role = (record or {}).get("role") if isinstance(record, dict) else None
    if not is_dev_access_auth(current_user, role_from_record=role):
        raise HTTPException(status_code=403, detail="Dev access required")
    return current_user


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
from pydantic import BaseModel, Field, AliasChoices
from datetime import datetime

_log_handlers: list[logging.Handler] = [logging.StreamHandler()]
try:
    _log_handlers.insert(0, logging.FileHandler("backend.log", encoding="utf-8"))
except OSError as exc:
    # Service user may not own backend.log (e.g. root-owned) — don't crash startup.
    logging.basicConfig(level=logging.INFO, format="%(message)s", handlers=[logging.StreamHandler()])
    logging.getLogger(__name__).warning("backend.log unavailable (%s); stdout only", exc)
else:
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        handlers=_log_handlers,
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
    from db.health import build_health_payload

    payload, status_code = build_health_payload()
    from fastapi.responses import JSONResponse

    return JSONResponse(content=payload, status_code=status_code)

# Daten-Verzeichnis
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "academy")
SESSIONS_DIR = os.path.join(DATA_DIR, "sessions")
REWARDS_DIR = os.path.join(DATA_DIR, "rewards")
PROFILES_DIR = os.path.join(DATA_DIR, "profiles")
ENTITLEMENTS_FILE = os.path.join(DATA_DIR, "entitlement_grants.json")
ROOT_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ROSTERS_DIR = os.path.join(ROOT_DATA_DIR, "rosters")
GAMES_DIR = os.path.join(ROOT_DATA_DIR, "games")
PLAYERS_DIR = os.path.join(DATA_DIR, "players")
OBSERVATIONS_DIR = os.path.join(ROOT_DATA_DIR, "observations")
OBS_RUNS_DIR = os.path.join(OBSERVATIONS_DIR, "runs")
OBS_ENTRIES_DIR = os.path.join(OBSERVATIONS_DIR, "entries")
OBS_PLAYERS_DIR = os.path.join(OBSERVATIONS_DIR, "players")
SCENES_DIR = os.path.join(ROOT_DATA_DIR, "scenes")
SCENE_CODE_COUNTER_FILE = os.path.join(ROOT_DATA_DIR, "scene_code_counter.json")
PENNY_DEL_IMPORT_CONFIG_FILE = os.path.join(DATA_DIR, "penny_del_import_teams.json")

# Runtime repositories (JSON today; swap implementations in repositories.wiring later)
configure_repositories(
    get_identity_store=lambda: _identity_store,
    get_users_file=lambda: USERS_FILE,
    get_profiles_dir=lambda: PROFILES_DIR,
    get_rewards_dir=lambda: REWARDS_DIR,
    get_sessions_dir=lambda: SESSIONS_DIR,
    get_entitlements_file=lambda: ENTITLEMENTS_FILE,
)

# Pydantic Models
class SessionCreate(BaseModel):
    user: str
    module_id: str
    goal: str
    confidence: int  # 1-5
    observation_scope: Optional[str] = None
    game_info: Optional[dict] = None
    game_id: Optional[str] = None
    observed_team: Optional[str] = None
    observed_team_id: Optional[str] = None
    observed_team_name: Optional[str] = None
    focus: Optional[str] = None  # Module-specific focus area
    session_method: Optional[str] = None  # "live_watch" oder andere
    drill_id: Optional[str] = None  # Specific drill to use
    learning_area: Optional[str] = None
    lab_mode: Optional[str] = None
    lab_template_id: Optional[str] = None
    is_dummy: bool = Field(
        default=False,
        validation_alias=AliasChoices("is_dummy", "isDummy"),
    )
    dev_seed_version: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("dev_seed_version", "devSeedVersion"),
    )
    location_verification: Optional[dict] = None

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


_LOCATION_VERIFICATION_KEYS = (
    "checkedAt",
    "venueId",
    "gameId",
    "insideGeofence",
    "distanceMeters",
    "accuracyMeters",
    "verificationType",
    "reason",
    "devSimulated",
)


def _sanitize_location_verification(value):
    """Never persist exact user coordinates — only the presence result."""
    if not isinstance(value, dict):
        return None
    cleaned = {key: value[key] for key in _LOCATION_VERIFICATION_KEYS if key in value}
    if not cleaned.get("checkedAt") or not cleaned.get("venueId") or not cleaned.get("gameId"):
        return None
    cleaned.pop("latitude", None)
    cleaned.pop("longitude", None)
    cleaned.pop("lat", None)
    cleaned.pop("lng", None)
    return cleaned


OBSERVATION_SCOPE_LABELS = {
    "FULL_GAME": "Gesamtes Spiel",
    "P1": "1. Drittel",
    "P2": "2. Drittel",
    "P3": "3. Drittel",
    "LESSON": "Lektion",
}

SCENE_STATUS_NEW = "NEW"
SCENE_STATUS_PIPELINE = "PIPELINE"
SCENE_STATUS_ASSIGNED = "ASSIGNED"
SCENE_STATUSES = {SCENE_STATUS_NEW, SCENE_STATUS_PIPELINE, SCENE_STATUS_ASSIGNED}
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
    session_id: Optional[str] = None
    event_id: Optional[str] = None
    evaluated_at: str
    granted_pux: int = 0
    granted_xp: int = 0
    reward_events: List[dict] = Field(default_factory=list)
    unlocked_achievements: List[dict] = Field(default_factory=list)
    unlocked_masteries: List[dict] = Field(default_factory=list)
    unlocked_cosmetics: List[dict] = Field(default_factory=list)
    unlock_history: List[dict] = Field(default_factory=list)
    activity_events: List[dict] = Field(default_factory=list)
    bootstrap_completed_at: Optional[str] = None
    replace_derived: bool = False
    # Phase 2
    favorite_cosmetic_ids: Optional[List[str]] = None
    mark_cosmetics_seen: List[str] = Field(default_factory=list)
    pux_transactions: List[dict] = Field(default_factory=list)
    completed_collections: List[dict] = Field(default_factory=list)
    mastery_milestone_unlocks: List[dict] = Field(default_factory=list)
    progression_pux_granted: Optional[int] = None
    skip_idempotency: bool = False  # for favorites/seen-only patches with synthetic event ids
    processed_event_ids: List[str] = Field(default_factory=list)  # mark many idempotency keys in one apply
    challenge_progress: Optional[dict] = None
    challenge_rotation: Optional[dict] = None
    venue_visits: Optional[dict] = None


class ProgressionPreviewData(BaseModel):
    activity_events: List[dict] = Field(default_factory=list)
    session_doc: Optional[dict] = None
    reward_state_snapshot: Optional[dict] = None
    use_account_state: bool = False


class DevelopmentCosmeticCleanupData(BaseModel):
    """Test-account only — development_data_cleanup (Rev. B path A)."""
    reset_progression: bool = False


class SceneSourcePayload(BaseModel):
    type: Optional[str] = None
    session_id: Optional[str] = None
    drill_id: Optional[str] = None
    observation_id: Optional[str] = None


class SceneMarkerCreate(BaseModel):
    session_id: Optional[str] = None
    module_id: Optional[str] = None
    drill_id: Optional[str] = None
    drill_title: Optional[str] = None
    track_id: Optional[str] = None
    status: Optional[str] = None
    source: Optional[SceneSourcePayload] = None
    metadata_status: Optional[str] = None
    league: Optional[str] = None
    season: Optional[str] = None
    competition_phase: Optional[str] = None
    competition_phase_label: Optional[str] = None
    competition_unit_type: Optional[str] = None
    competition_unit_label: Optional[str] = None
    competition_unit_value: Optional[str] = None
    matchday: Optional[str] = None
    game_date: Optional[str] = None
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
    metadata_status: Optional[str] = None
    period: Optional[str] = None
    league: Optional[str] = None
    season: Optional[str] = None
    competition_phase: Optional[str] = None
    competition_phase_label: Optional[str] = None
    competition_unit_type: Optional[str] = None
    competition_unit_label: Optional[str] = None
    competition_unit_value: Optional[str] = None
    matchday: Optional[str] = None
    game_date: Optional[str] = None
    team_home: Optional[str] = None
    team_away: Optional[str] = None
    observed_team: Optional[str] = None
    observed_team_id: Optional[str] = None
    observed_team_name: Optional[str] = None
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
    return get_repos().sessions.build_storage_path(session_id, created_at)


def iter_session_files():
    yield from get_repos().sessions.iter_session_paths() or []


def find_session_file(session_id: str) -> Optional[str]:
    return get_repos().sessions.find_session_path(session_id)


def get_session_path_or_404(session_id: str) -> str:
    session_path = find_session_file(session_id)
    if not session_path:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_path


def _normalize_user_key(user) -> str:
    """Canonical file/owner key. AuthContext → rinq_user_id; strings stay normalized."""
    if isinstance(user, AuthContext):
        return user.rinq_user_id
    return (user or "guest").strip().lower()


def _owners_match(resource_user: str, auth) -> bool:
    if isinstance(auth, AuthContext):
        return _identity_owners_match(
            resource_user or "",
            auth.rinq_user_id,
            auth.legacy_username,
        )
    return _normalize_user_key(resource_user) == _normalize_user_key(auth)


def _session_owner_key(session: dict) -> str:
    return _normalize_user_key(session.get("user") or "")


def _require_session_owner(session_id: str, current_user) -> tuple:
    """Load session document; 404 if missing or not owned by current_user.

    Uses 404 (not 403) for non-owners so session IDs of other users are not confirmed.
    Optional filesystem path is returned for JSON backends; Postgres uses a synthetic marker.
    """
    try:
        session = get_repos().sessions.get_session_for_user(session_id, current_user)
        find_path = getattr(get_repos().sessions, "find_session_path", None)
        session_path = find_path(session_id) if callable(find_path) else None
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_path, session


def _persist_session(session: dict) -> dict:
    """Persist session document via SessionRepository (atomic write)."""
    return get_repos().sessions.save_session(session)


def _create_default_reward_state() -> dict:
    from repositories.json_reward import create_default_reward_state

    return create_default_reward_state()


def _load_reward_state(user) -> dict:
    return get_repos().rewards.get_reward_state(user)


def _save_reward_state(user, state: dict) -> None:
    get_repos().rewards.save_reward_state(user, state)


def _resolve_user_cased(user) -> str:
    if isinstance(user, AuthContext):
        return user.display_name or user.legacy_username or user.rinq_user_id
    users = load_users()
    user_obj = next((u for u in users["users"] if u["username"].strip().lower() == user.strip().lower()), None)
    return user_obj["username"] if user_obj else user


def _auth_owner_id(user) -> str:
    return user.rinq_user_id if isinstance(user, AuthContext) else _normalize_user_key(user)


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


def _iter_user_observation_profiles(user):
    for path in _iter_json_files(OBS_PLAYERS_DIR) or []:
        profile = load_json(path)
        if not _owners_match(profile.get("user", ""), user):
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
    season_key = season_to_file_key(season)
    file_name = f"{league_key}_{season_key}.json"
    file_path = os.path.join(ROSTERS_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Roster not found")
    return load_json(file_path)


def _team_catalog_mapper() -> TeamCatalogMapper:
    mapper = TeamCatalogMapper(os.path.join(DATA_DIR, "teams.json"))
    if os.path.exists(PENNY_DEL_IMPORT_CONFIG_FILE):
        try:
            raw = load_json(PENNY_DEL_IMPORT_CONFIG_FILE)
            for item in raw if isinstance(raw, list) else []:
                catalog_id = (item.get("catalog_id") or "").strip()
                slug = (item.get("slug") or "").strip().lower()
                if catalog_id and slug:
                    mapper.register_slug(slug, catalog_id)
                importer_id = slug.replace("-", "_") if slug else ""
                if catalog_id and importer_id:
                    mapper.register_slug(importer_id, catalog_id)
        except Exception as exc:
            print(f"[DEL] Team config mapping failed: {exc}")
    return mapper


def _resolve_catalog_team_id(team_id: str) -> str:
    mapper = _team_catalog_mapper()
    resolved = mapper.resolve(team_id=team_id) or mapper.resolve(slug=team_id)
    return resolved or team_id


def _merge_observation_stats(team_id: str, roster_players: List[dict]) -> List[dict]:
    """Attach observation_count/last_observed from global kader registry."""
    global_players = _load_team_players(team_id)
    merged = []
    for player in roster_players:
        player_id = player.get("player_id")
        global_row = global_players.get(player_id) or {}
        merged.append(
            {
                **player,
                "player_name": player.get("name") or player.get("player_name") or global_row.get("player_name"),
                "observation_count": int(global_row.get("observation_count") or 0),
                "last_observed": global_row.get("last_observed"),
                "summary": global_row.get("summary") or "",
                "active": True,
            }
        )
    return merged


def _find_latest_roster_season(league: str, team_id: str) -> Optional[dict]:
    if not os.path.exists(ROSTERS_DIR):
        return None
    latest = None
    for name in os.listdir(ROSTERS_DIR):
        if not name.endswith(".json"):
            continue
        if not name.lower().startswith(f"{league.lower()}_"):
            continue
        try:
            catalog = load_json(os.path.join(ROSTERS_DIR, name))
        except Exception:
            continue
        for team in catalog.get("teams") or []:
            if team.get("team_id") != team_id or not team.get("players"):
                continue
            season_label = catalog.get("season_label") or season_to_display(catalog.get("season") or "")
            candidate = {
                "season": season_label,
                "season_key": catalog.get("season"),
                "team": team,
            }
            if not latest or (candidate.get("season_key") or "") > (latest.get("season_key") or ""):
                latest = candidate
    return latest


def _iter_user_observation_entries(user):
    for path in _iter_json_files(OBS_ENTRIES_DIR) or []:
        entry = load_json(path)
        if not _owners_match(entry.get("user", ""), user):
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
def _merge_foundation_tracks(curriculum: dict) -> dict:
    """Prepend optional foundation tracks (e.g. T0) without editing the main curriculum dump."""
    foundation_dir = os.path.join(DATA_DIR, "foundation")
    if not os.path.isdir(foundation_dir):
        return curriculum
    tracks = list(curriculum.get("tracks") or [])
    existing_ids = {t.get("id") for t in tracks if isinstance(t, dict)}
    foundation_tracks = []
    try:
        for name in sorted(os.listdir(foundation_dir)):
            if not name.endswith(".json"):
                continue
            path = os.path.join(foundation_dir, name)
            try:
                payload = load_json(path) or {}
            except Exception:
                continue
            track = payload.get("track") if isinstance(payload, dict) else None
            if not isinstance(track, dict) or not track.get("id"):
                continue
            if track["id"] in existing_ids:
                continue
            foundation_tracks.append(track)
            existing_ids.add(track["id"])
    except Exception:
        return curriculum
    if not foundation_tracks:
        return curriculum
    return {**curriculum, "tracks": foundation_tracks + tracks}


@app.get("/api/curriculum")
async def get_curriculum(authorization: str | None = Header(None)):
    """Curriculum laden — premium drill configs filtered server-side by entitlement."""
    try:
        curriculum = load_json(os.path.join(DATA_DIR, "curriculum.json"))
        merged = _merge_foundation_tracks(curriculum)
        user = resolve_user_from_authorization(authorization)
        role = _role_from_auth(user) if user else None
        return filter_curriculum_for_user(merged, user, role_from_record=role)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Curriculum not found")

@app.get("/api/lab/content")
async def get_lab_content():
    """Lab-Inhalte laden (separat vom Academy-Curriculum)."""
    try:
        return load_json(os.path.join(DATA_DIR, "lab_content.json"))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Lab content not found")

def _normalize_team_season_key(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    value = str(raw).strip()
    if not value:
        return None
    # 2025/2026 -> 2025/26
    range_match = re.match(r'^(\d{4})\s*[\/\-]\s*(\d{2,4})$', value)
    if range_match:
        start = range_match.group(1)
        end = range_match.group(2)
        if len(end) == 4:
            end = end[-2:]
        return f"{start}/{end.zfill(2)}"
    return value


def _teams_payload_for_season(data: dict, season: Optional[str] = None) -> dict:
    """Support season-keyed catalogs while keeping a flat {league, season, teams} response."""
    seasons = data.get("seasons")
    if not isinstance(seasons, dict) or not seasons:
        return {
            "league": data.get("league"),
            "season": data.get("season") or data.get("default_season"),
            "teams": data.get("teams") or [],
        }

    requested = _normalize_team_season_key(season)
    default_season = data.get("default_season") or next(iter(seasons.keys()), None)
    season_key = requested if requested in seasons else default_season
    if season_key not in seasons:
        season_key = next(iter(seasons.keys()))
    return {
        "league": data.get("league"),
        "season": season_key,
        "default_season": default_season,
        "available_seasons": list(seasons.keys()),
        "teams": seasons.get(season_key) or [],
    }


@app.get("/api/teams")
async def get_teams(league: Optional[str] = None, season: Optional[str] = None):
    """Teams laden basierend auf Liga und optional Saison."""
    try:
        # Standardmäßig DEL Teams
        if not league or league == "DEL":
            data = load_json(os.path.join(DATA_DIR, "teams.json"))
        elif league == "Nationalmannschaften":
            data = load_json(os.path.join(DATA_DIR, "teams_national.json"))
        elif league == "NHL":
            data = load_json(os.path.join(DATA_DIR, "teams_nhl.json"))
        elif league == "DEL2":
            data = load_json(os.path.join(DATA_DIR, "teams_del2.json"))
        elif league == "CHL":
            data = load_json(os.path.join(DATA_DIR, "teams_chl.json"))
        elif league == "U20_DNL":
            data = load_json(os.path.join(DATA_DIR, "teams_u20_dnl.json"))
        elif league == "Testspiele":
            data = load_json(os.path.join(DATA_DIR, "teams_testspiele.json"))
        else:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")
        return _teams_payload_for_season(data, season)
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
async def create_observation_run(payload: ObservationRunCreate, current_user: AuthContext = Depends(get_current_user)):
    owner_id = current_user.rinq_user_id
    now_iso = datetime.now().isoformat()
    run_id = f"obs_{int(datetime.now().timestamp())}_{uuid4().hex[:6]}"

    enforce_max_text_length(payload.notes, "observation_run.notes")
    enforce_max_text_length(payload.player_notes, "observation_run.player_notes")
    enforce_max_text_length(payload.source, "observation_run.source")

    run = {
        "run_id": run_id,
        "user": owner_id,
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
async def get_observation_run(run_id: str, current_user: AuthContext = Depends(get_current_user)):
    run_path = _find_json_file_by_id(OBS_RUNS_DIR, run_id)
    if not run_path:
        raise HTTPException(status_code=404, detail="Observation run not found")

    run = load_json(run_path)
    if not _owners_match(run.get("user", ""), current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    return run


@app.post("/api/observations")
async def create_observation_entry(payload: ObservationEntryCreate, current_user: AuthContext = Depends(get_current_user)):
    run_path = _find_json_file_by_id(OBS_RUNS_DIR, payload.run_id)
    if not run_path:
        raise HTTPException(status_code=404, detail="Observation run not found")

    run = load_json(run_path)
    if not _owners_match(run.get("user", ""), current_user):
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
    current_user: AuthContext = Depends(get_current_user),
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
    current_user: AuthContext = Depends(get_current_user),
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
    current_user: AuthContext = Depends(get_current_user),
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
    current_user: AuthContext = Depends(get_current_user),
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
    current_user: AuthContext = Depends(get_current_user),
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
    current_user: AuthContext = Depends(get_current_user),
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
async def list_importable_teams(current_user: AuthContext = Depends(get_current_user)):
    """Gibt Liste der Teams aus Konfigurationsdatei zurück."""
    importer = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE)
    teams = importer.list_teams(enabled_only=False)
    return {
        "teams": [
            {
                "id": team.get("id"),
                "catalog_id": team.get("catalog_id") or team.get("id"),
                "slug": team.get("slug"),
                "name": team.get("team"),
                "league": team.get("league"),
                "url": team.get("url"),
                "overview_url": team.get("overview_url") or "",
                "kader_available": bool(team.get("kader_available", True)),
                "kader_note": team.get("kader_note") or "",
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
    season: Optional[str] = Query(default=None),
    league: Optional[str] = Query(default="DEL"),
    current_user: AuthContext = Depends(require_admin)
):
    """
    Importiert Spieler für ein Team (optional saisonbezogen).
    
    Upsert-Logik:
    - Neue Spieler: erstellen
    - Existierende Spieler: aktualisieren
    - Inaktive Spieler: active=false markieren (nicht löschen)
    - Season Snapshot: 1 Team + 1 Season = 1 canonical roster (andere Saisons bleiben)
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

    target_season = season or "2025/26"
    mapper = _team_catalog_mapper()
    team_cfg = next((team for team in configured_teams if team.get("id") == team_id), None)
    catalog_id = (team_cfg or {}).get("catalog_id") or mapper.resolve(team_id=team_id) or team_id
    team_name = (team_cfg or {}).get("team") or mapper.team_name(catalog_id) or team_id

    try:
        result = importer.import_team(team_id)

        if result.get("error"):
            status = 409 if result.get("kader_pending") else 502
            raise HTTPException(status_code=status, detail=result)

        active_players = _get_active_team_players(team_id)
        snapshot = upsert_team_roster_snapshot(
            ROSTERS_DIR,
            league=league or "DEL",
            season=target_season,
            team_id=catalog_id,
            team_name=team_name,
            players=active_players,
            source={
                "provider": "penny_del",
                "externalTeamId": team_id,
                "sourceUrl": result.get("url"),
                "importedAt": datetime.utcnow().isoformat() + "Z",
            },
        )
        result["season"] = season_to_display(target_season)
        result["catalog_team_id"] = catalog_id
        result["roster_quality"] = (snapshot.get("snapshot") or {}).get("quality")
        result["roster_warnings"] = (snapshot.get("snapshot") or {}).get("warnings") or []
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
async def import_all_players(
    season: Optional[str] = Query(default=None),
    league: Optional[str] = Query(default="DEL"),
    current_user: AuthContext = Depends(require_admin),
):
    importer = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE)
    target_season = season or "2025/26"
    mapper = _team_catalog_mapper()
    results = []
    for team in importer.list_teams(enabled_only=True):
        team_id = team.get("id") or ""
        try:
            result = importer.import_team(team_id)
            if result.get("error"):
                results.append(result)
                continue
            catalog_id = team.get("catalog_id") or mapper.resolve(team_id=team_id) or team_id
            team_name = team.get("team") or mapper.team_name(catalog_id) or team_id
            active_players = _get_active_team_players(team_id)
            snapshot = upsert_team_roster_snapshot(
                ROSTERS_DIR,
                league=league or "DEL",
                season=target_season,
                team_id=catalog_id,
                team_name=team_name,
                players=active_players,
                source={
                    "provider": "penny_del",
                    "externalTeamId": team_id,
                    "sourceUrl": result.get("url"),
                    "importedAt": datetime.utcnow().isoformat() + "Z",
                },
            )
            result["season"] = season_to_display(target_season)
            result["catalog_team_id"] = catalog_id
            result["roster_quality"] = (snapshot.get("snapshot") or {}).get("quality")
            results.append(result)
        except Exception as exc:
            results.append({"team_id": team_id, "error": str(exc)})
    if not results:
        raise HTTPException(status_code=400, detail={"error": "Keine aktivierten Teams in der Konfiguration"})
    return {"results": results, "total": len(results), "season": season_to_display(target_season)}


@app.get("/api/players/team/{team_id}")
async def get_team_players(
    team_id: str,
    season: Optional[str] = Query(default=None),
    league: Optional[str] = Query(default="DEL"),
    active_only: bool = Query(default=True),
    allow_fallback: bool = Query(default=False),
    current_user: AuthContext = Depends(get_current_user),
):
    """Gibt Spieler eines Teams zurück — optional saisonbezogen aus Roster Snapshot."""
    catalog_id = _resolve_catalog_team_id(team_id)

    if season:
        snapshot = get_team_roster_snapshot(ROSTERS_DIR, league or "DEL", season, catalog_id)
        fallback = None
        if not snapshot or not snapshot.get("players"):
            if allow_fallback:
                fallback = _find_latest_roster_season(league or "DEL", catalog_id)
                if fallback:
                    snapshot = fallback["team"]
            if not snapshot or not snapshot.get("players"):
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "roster_not_found",
                        "message": f"Für Saison {season_to_display(season)} ist noch kein Kader importiert.",
                        "team_id": catalog_id,
                        "season": season_to_display(season),
                    },
                )

        roster_players = snapshot.get("players") or []
        players_list = _merge_observation_stats(team_id, roster_players)
        if active_only:
            players_list = [p for p in players_list if p.get("active", True)]
        players_list.sort(key=lambda p: (p.get("number") or p.get("jersey_number") or 999))

        response = {
            "team_id": catalog_id,
            "season": season_to_display(season),
            "players": players_list,
            "total": len(players_list),
            "updated_at": (snapshot.get("snapshot") or {}).get("imported_at") or datetime.utcnow().isoformat() + "Z",
            "quality": (snapshot.get("snapshot") or {}).get("quality"),
            "warnings": (snapshot.get("snapshot") or {}).get("warnings") or [],
        }
        if fallback:
            response["fallback_season"] = fallback.get("season")
            response["fallback"] = True
        return response

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
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }


@app.post("/api/players/{player_id}/refresh-profile")
async def refresh_player_profile_placeholder(player_id: str, current_user: AuthContext = Depends(require_admin)):
    """Platzhalter für spätere KI-Profilaktualisierung (noch nicht implementiert)."""
    return {
        "player_id": player_id,
        "status": "not_implemented",
        "message": "Profil aktualisieren via OpenAI wird in einem späteren Schritt aktiviert.",
    }


# ---- DEL Data Hub (Rosters + Games) ----

@app.get("/api/games")
async def get_games(
    league: str = Query(default="DEL"),
    season: str = Query(...),
    team_id: Optional[str] = Query(default=None),
    phase_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    current_user: AuthContext = Depends(get_current_user),
):
    games = list_games(
        GAMES_DIR,
        league=league,
        season=season,
        team_id=_resolve_catalog_team_id(team_id) if team_id else None,
        phase_id=phase_id,
        status=status,
    )
    mapper = _team_catalog_mapper()
    for game in games:
        game["home_team_name"] = game.get("home_team_name") or mapper.team_name(game.get("home_team_id") or "")
        game["away_team_name"] = game.get("away_team_name") or mapper.team_name(game.get("away_team_id") or "")
    return {"games": games, "total": len(games), "season": season_to_display(season), "league": league}


@app.get("/api/games/{game_id:path}")
async def get_game_by_id(game_id: str, current_user: AuthContext = Depends(get_current_user)):
    game = get_game(GAMES_DIR, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    mapper = _team_catalog_mapper()
    game["home_team_name"] = game.get("home_team_name") or mapper.team_name(game.get("home_team_id") or "")
    game["away_team_name"] = game.get("away_team_name") or mapper.team_name(game.get("away_team_id") or "")
    return game


@app.post("/api/del-data/import-schedule")
async def import_del_schedule(
    season: str = Query(default="2025/26"),
    league: str = Query(default="DEL"),
    current_user: AuthContext = Depends(require_admin),
):
    mapper = _team_catalog_mapper()
    importer = PennyDelScheduleImporter(mapper)
    result = importer.import_season(season, league=league)
    if not result.get("games"):
        raise HTTPException(
            status_code=502,
            detail={
                "error": "schedule_import_failed",
                "errors": result.get("errors") or ["Keine Spiele gefunden"],
            },
        )
    upsert_result = upsert_games(
        GAMES_DIR,
        league=league,
        season=season,
        games=result["games"],
    )
    return {
        **result,
        **upsert_result,
        "season": season_to_display(season),
    }


@app.post("/api/del-data/migrate-rosters")
async def migrate_del_rosters(
    season: str = Query(default="2025/26"),
    league: str = Query(default="DEL"),
    current_user: AuthContext = Depends(require_admin),
):
    mapper = _team_catalog_mapper()
    return migrate_legacy_team_players_to_season(
        ROSTERS_DIR,
        PLAYERS_DIR,
        league=league,
        season=season,
        team_mapper=mapper,
        import_config_path=PENNY_DEL_IMPORT_CONFIG_FILE,
    )


@app.get("/api/del-data/status")
async def get_del_data_status(
    season: str = Query(default="2025/26"),
    league: str = Query(default="DEL"),
    current_user: AuthContext = Depends(get_current_user),
):
    roster_status = roster_status_summary(ROSTERS_DIR, league, season)
    games_status = games_status_summary(GAMES_DIR, league, season)
    importable = PennyDelImporter(PLAYERS_DIR, PENNY_DEL_IMPORT_CONFIG_FILE).list_teams(enabled_only=True)
    expected_teams = len(importable)
    return {
        "season": season_to_display(season),
        "league": league,
        "rosters": roster_status,
        "games": games_status,
        "expected_teams": expected_teams,
        "issues": [
            {
                "team_id": team.get("team_id"),
                "name": team.get("name"),
                "quality": team.get("quality"),
                "warnings": team.get("warnings") or [],
            }
            for team in roster_status.get("teams") or []
            if team.get("quality") not in (None, "plausible")
        ],
    }


def _build_game_stats_payload(fetch_result: dict) -> dict:
    return {
        "provider": "penny_del",
        "imported_at": fetch_result.get("imported_at"),
        "external_id": fetch_result.get("external_id"),
        "overview_url": fetch_result.get("overview_url"),
        "boxscore_url": fetch_result.get("boxscore_url"),
        "team": fetch_result.get("team_stats") or {},
        "players": fetch_result.get("player_stats") or [],
        "warnings": fetch_result.get("errors") or [],
    }


@app.post("/api/del-data/import-game-stats")
async def import_del_game_stats(
    game_id: str = Query(...),
    current_user: AuthContext = Depends(require_admin),
):
    game = get_game(GAMES_DIR, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    external_id = (game.get("source") or {}).get("external_id")
    if not external_id:
        raise HTTPException(
            status_code=422,
            detail={"error": "missing_external_id", "message": "Spiel hat keine PENNY spieldetails-ID"},
        )

    mapper = _team_catalog_mapper()
    importer = PennyDelSpieldetailsImporter(mapper)
    fetch_result = importer.fetch_game_stats(external_id)
    if not fetch_result.get("ok"):
        raise HTTPException(
            status_code=502,
            detail={
                "error": "game_stats_import_failed",
                "errors": fetch_result.get("errors") or ["Import fehlgeschlagen"],
            },
        )

    stats_payload = _build_game_stats_payload(fetch_result)
    updated = update_game_stats(GAMES_DIR, game_id, stats_payload)
    if not updated:
        raise HTTPException(status_code=500, detail="Stats konnten nicht gespeichert werden")

    mapper_names = mapper
    updated["home_team_name"] = updated.get("home_team_name") or mapper_names.team_name(updated.get("home_team_id") or "")
    updated["away_team_name"] = updated.get("away_team_name") or mapper_names.team_name(updated.get("away_team_id") or "")
    return {
        "ok": True,
        "game_id": game_id,
        "external_id": external_id,
        "stats_summary": {
            "team_metrics": len(stats_payload.get("team") or {}),
            "player_rows": sum(len(team.get("players") or []) for team in stats_payload.get("players") or []),
            "warnings": stats_payload.get("warnings") or [],
        },
        "game": updated,
    }


@app.post("/api/del-data/import-game-stats-batch")
async def import_del_game_stats_batch(
    season: str = Query(default="2025/26"),
    league: str = Query(default="DEL"),
    limit: int = Query(default=5, ge=1, le=25),
    skip_existing: bool = Query(default=True),
    current_user: AuthContext = Depends(require_admin),
):
    games = list_games(GAMES_DIR, league=league, season=season, status="final")
    if not games:
        games = [game for game in list_games(GAMES_DIR, league=league, season=season) if game.get("score")]

    mapper = _team_catalog_mapper()
    importer = PennyDelSpieldetailsImporter(mapper)
    batch = importer.import_games_batch(
        games,
        limit=limit,
        skip_existing=skip_existing,
    )

    saved = 0
    enriched_results = []
    for item in batch.get("results") or []:
        game_id = item.get("game_id") or ""
        catalog_game = get_game(GAMES_DIR, game_id) if game_id else None
        enriched = {**item}
        if catalog_game:
            enriched["home_team_name"] = catalog_game.get("home_team_name") or mapper.team_name(
                catalog_game.get("home_team_id") or ""
            )
            enriched["away_team_name"] = catalog_game.get("away_team_name") or mapper.team_name(
                catalog_game.get("away_team_id") or ""
            )
            enriched["date"] = catalog_game.get("date")
            enriched["matchday"] = catalog_game.get("matchday")
            enriched["score"] = catalog_game.get("score")

        if item.get("ok") and item.get("stats"):
            stats_payload = _build_game_stats_payload(item["stats"])
            enriched["stats_summary"] = {
                "team_metrics": len(stats_payload.get("team") or {}),
                "player_rows": sum(len(team.get("players") or []) for team in stats_payload.get("players") or []),
                "warnings": stats_payload.get("warnings") or [],
            }
            if update_game_stats(GAMES_DIR, game_id, stats_payload):
                saved += 1
                enriched["saved"] = True
            else:
                enriched["saved"] = False
                enriched["error"] = enriched.get("error") or "Speichern fehlgeschlagen"
        enriched_results.append(enriched)

    return {
        **batch,
        "results": enriched_results,
        "saved": saved,
        "season": season_to_display(season),
        "league": league,
        "candidates": len(games),
    }


@app.get("/api/sessions")
async def get_sessions(
    state: Optional[str] = None,
    current_user: AuthContext = Depends(get_current_user),
):
    """List sessions for the authenticated user only (ignores client-supplied user filters)."""
    sessions = get_repos().sessions.list_sessions_for_user(current_user, state=state)
    for session in sessions:
        if not session.get('created_by'):
            session['created_by'] = session.get('user', 'Unbekannt')
        if not session.get('learning_area'):
            session['learning_area'] = 'academy'
        session['observation_scope'] = _normalize_observation_scope(session.get('observation_scope'))
    return sessions

@app.post("/api/sessions")
async def create_session(session: SessionCreate, user: AuthContext = Depends(get_current_user)):
    """Neue Session erstellen (auth required). Ownership = rinq_user_id."""
    _require_module_access(
        user,
        session.module_id,
        learning_area=session.learning_area,
    )
    os.makedirs(SESSIONS_DIR, exist_ok=True)

    now = datetime.now()
    owner_id = user.rinq_user_id
    session_id = f"{owner_id}_{int(now.timestamp())}"

    # Lade Module-Drills aus Curriculum (inkl. Foundation-Tracks wie T0)
    curriculum = _merge_foundation_tracks(load_json(os.path.join(DATA_DIR, "curriculum.json")))
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

    is_lab_session = str(session.learning_area or "").strip().lower() == "lab"
    if session.module_id and not module_drills and not is_lab_session:
        raise HTTPException(
            status_code=400,
            detail=f"Kein Drill für Modul {session.module_id} gefunden"
            + (f" (drill_id={session.drill_id})" if session.drill_id else ""),
        )

    enforce_max_text_length(session.goal, "session.goal")
    enforce_max_text_length(session.focus, "session.focus")
    enforce_max_text_length(session.observed_team, "session.observed_team")
    enforce_max_text_length(session.game_info, "session.game_info")

    session_data = {
        "id": session_id,
        "user": owner_id,
        "created_by": owner_id,
        "display_name": user.display_name,
        "module_id": session.module_id,
        "goal": session.goal,
        "confidence": session.confidence,
        "focus": session.focus,  # Store focus area
        "session_method": session.session_method,  # Store session method
        "drill_id": session.drill_id,  # Store selected drill
        "learning_area": session.learning_area or "academy",
        "lab_mode": session.lab_mode,
        "lab_template_id": session.lab_template_id,
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
        "game_id": session.game_id,
        "observed_team": session.observed_team,
        "observed_team_id": session.observed_team_id,
        "observed_team_name": session.observed_team_name,
        "microfeedback": _empty_microfeedback_for_scope(session.observation_scope),
        # Persist explicitly so list/delete eligibility never depends on missing keys.
        "is_dummy": bool(session.is_dummy),
    }

    verification = _sanitize_location_verification(session.location_verification)
    if verification:
        session_data["location_verification"] = verification

    if session.dev_seed_version is not None:
        session_data["dev_seed_version"] = int(session.dev_seed_version)
    elif session.is_dummy:
        session_data["dev_seed_version"] = 1

    if session_data.get("learning_area") == "lab" and session_data.get("lab_mode") == "predict":
        session_data["prediction_entries"] = []
        session_data["open_prediction_id"] = None
        session_data["prediction_summary"] = None

    print(f"[AUTH] request by user={user} path=/api/sessions")
    return get_repos().sessions.create_session(session_data)

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, current_user: AuthContext = Depends(get_current_user)):
    """Session Details (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)
    if not session.get("learning_area"):
        session["learning_area"] = "academy"
    if session.get("learning_area") == "lab" and session.get("lab_mode") == "predict":
        if "prediction_entries" not in session:
            session["prediction_entries"] = []
        if "open_prediction_id" not in session:
            session["open_prediction_id"] = None
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
        _persist_session(session)
    _require_session_module_access(current_user, session)
    return session

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, updates: dict, current_user: AuthContext = Depends(get_current_user)):
    """Session aktualisieren (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

    enforce_max_text_length(updates, "updates")

    # Merge-Logik für microfeedback
    for key, value in updates.items():
        if key == "microfeedback":
            if "microfeedback" not in session:
                session["microfeedback"] = _empty_microfeedback_for_scope(session.get("observation_scope"))
            for phase, mf in value.items():
                if phase in session["microfeedback"]:
                    session["microfeedback"][phase].update(mf)
                else:
                    session["microfeedback"][phase] = mf
        elif key == "location_verification":
            cleaned = _sanitize_location_verification(value)
            if cleaned:
                session["location_verification"] = cleaned
        elif key in {"user", "created_by", "id"}:
            # Never allow client to reassign ownership or identity.
            continue
        else:
            session[key] = value

    _persist_session(session)
    return session

@app.post("/api/sessions/{session_id}/checkins")
async def save_checkin(session_id: str, checkin: CheckinData, request: Request, current_user: AuthContext = Depends(get_current_user)):
    """Checkin speichern (owner only)"""
    req_id = uuid4().hex[:8]
    phase_raw = checkin.phase
    phase_norm = checkin.phase.strip().upper()
    trace_id = request.headers.get("X-Trace-Id")
    trace_action = request.headers.get("X-Trace-Action")
    session_path, session = _require_session_owner(session_id, current_user)
    if phase_norm == "PRE":
        session["current_phase"] = _initial_phase_for_scope(session.get("observation_scope"))
        _persist_session(session)
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

    _persist_session(session)
    counts_after = Counter((c.get("phase") or "") for c in session.get("checkins", []))
    logging.info(f"[checkin:{req_id}] session={session_id} counts_after={dict(counts_after)}")
    return session

@app.post("/api/sessions/{session_id}/post")
async def complete_session(session_id: str, post: PostData, current_user: AuthContext = Depends(get_current_user)):
    """Session abschließen (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

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

    _persist_session(session)
    return session

@app.post("/api/sessions/{session_id}/abort")
async def abort_session(session_id: str, abort: AbortData, current_user: AuthContext = Depends(get_current_user)):
    """Session abbrechen (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

    enforce_max_text_length(abort.note, "abort.note")

    session["abort"] = {
        "reason": abort.reason,
        "note": abort.note,
        "aborted_at": datetime.now().isoformat()
    }
    session["state"] = "ABORTED"

    _persist_session(session)
    return session

@app.delete("/api/sessions/{session_id}/checkins/{checkin_index}")
async def delete_checkin(session_id: str, checkin_index: int, current_user: AuthContext = Depends(get_current_user)):
    """Checkin (Phase) löschen (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

    if checkin_index < 0 or checkin_index >= len(session.get("checkins", [])):
        raise HTTPException(status_code=400, detail="Invalid checkin index")

    session["checkins"].pop(checkin_index)
    _persist_session(session)
    return session

def _scene_session_id(scene: dict) -> Optional[str]:
    if not isinstance(scene, dict):
        return None
    top = scene.get("session_id")
    if isinstance(top, str) and top.strip():
        return top.strip()
    source = scene.get("source") or {}
    if isinstance(source, dict):
        nested = source.get("session_id")
        if isinstance(nested, str) and nested.strip():
            return nested.strip()
    return None


def _delete_scenes_linked_to_session(session_id: str) -> int:
    """Remove scenes that clearly belong to this session (top-level or source.session_id)."""
    deleted = 0
    for path in list(_iter_json_files(SCENES_DIR) or []):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if _scene_session_id(scene) != session_id:
            continue
        try:
            os.remove(path)
            deleted += 1
        except Exception:
            continue
    return deleted


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, current_user: AuthContext = Depends(get_current_user)):
    """Session löschen inkl. klar verknüpfter Szenen (owner only)."""
    _session_path, _session = _require_session_owner(session_id, current_user)
    try:
        deleted_scenes = _delete_scenes_linked_to_session(session_id)
        get_repos().sessions.delete_session_for_user(session_id, current_user)
        return {"status": "deleted", "id": session_id, "deleted_scenes": deleted_scenes}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {e}")

@app.put("/api/sessions/{session_id}/drafts")
async def save_drafts(session_id: str, drafts: dict, current_user: AuthContext = Depends(get_current_user)):
    """Draft-Eingaben speichern für Session Continuation (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

    enforce_max_text_length(drafts, "drafts")

    session["drafts"] = drafts
    _persist_session(session)
    return {"status": "saved"}

@app.put("/api/sessions/{session_id}/phase")
async def update_session_phase(session_id: str, phase_data: dict, current_user: AuthContext = Depends(get_current_user)):
    """Aktuelle Phase der Session aktualisieren (owner only)"""
    session_path, session = _require_session_owner(session_id, current_user)

    enforce_max_text_length(phase_data, "phase_data")

    if "phase" in phase_data:
        session["current_phase"] = _initial_phase_for_scope(session.get("observation_scope")) if phase_data["phase"] == "PRE" else phase_data["phase"]
    if "state" in phase_data:
        session["state"] = phase_data["state"]

    _persist_session(session)
    return session

@app.get("/api/sessions/{session_id}/download")
async def download_session(
    session_id: str,
    phase: Optional[str] = Query(None),
    current_user: AuthContext = Depends(get_current_user),
):
    """Session als komplette JSON herunterladen mit allen Fragen und Antworten (owner only)"""
    from fastapi.responses import StreamingResponse
    from io import BytesIO
    
    _session_path, session = _require_session_owner(session_id, current_user)
    _require_session_module_access(current_user, session)
    
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
        "learning_area": session.get("learning_area", "academy"),
        "lab_mode": session.get("lab_mode"),
        "lab_template_id": session.get("lab_template_id"),
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
async def add_microfeedback(
    session_id: str,
    data: MicroFeedbackData,
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Microfeedback für P1/P2/P3 speichern (Session-Block, nicht Checkin; owner only)"""
    valid_phases = {"P1", "P2", "P3"}
    phase = data.phase.strip().upper()
    if phase not in valid_phases:
        raise HTTPException(status_code=400, detail="Invalid phase for microfeedback")
    enforce_max_text_length(data.text, "microfeedback.text")
    session_path, session = _require_session_owner(session_id, current_user)
    if "microfeedback" not in session:
        session["microfeedback"] = {p: {"done": False, "text": ""} for p in valid_phases}
    session["microfeedback"][phase]["done"] = True
    session["microfeedback"][phase]["text"] = data.text
    session["microfeedback"][phase]["ts"] = datetime.now().isoformat()
    # Logging
    trace_id = request.headers.get("X-Trace-Id")
    trace_action = request.headers.get("X-Trace-Action")
    logging.info(f"[microfeedback] session={session_id} phase={phase} trace_id={trace_id} trace_action={trace_action} text_len={len(data.text)}")
    _persist_session(session)
    return {"status": "ok", "microfeedback": session["microfeedback"][phase]}


from reflection import generate_session_reflection


@app.post("/api/sessions/{session_id}/reflection")
async def create_session_reflection(
    session_id: str,
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Generate or return cached AI reflection for a completed session (owner only)."""
    session_path, session = _require_session_owner(session_id, current_user)
    _require_session_module_access(current_user, session)

    if session.get("state") != "COMPLETED":
        raise HTTPException(status_code=400, detail="Session must be COMPLETED")

    if session.get("is_dummy") is True:
        raise HTTPException(
            status_code=400,
            detail="DEV · KI-Reflexion deaktiviert für Dummy-Session",
        )

    existing = session.get("ai_reflection")
    if existing:
        return {"reflection": existing, "cached": True}

    # Cap OpenAI cost: per-user + coarse IP limit (cached hits above skip this)
    rate_limit(request, "reflection", limit=8, window_sec=3600.0, subject=current_user.rinq_user_id)
    rate_limit(request, "reflection_ip", limit=40, window_sec=3600.0)

    curriculum = _merge_foundation_tracks(
        load_json(os.path.join(DATA_DIR, "curriculum.json"))
    )
    lab_content = None
    try:
        lab_content = load_json(os.path.join(DATA_DIR, "lab_content.json"))
    except FileNotFoundError:
        lab_content = None
    reflection = generate_session_reflection(session, curriculum, lab_content)
    session["ai_reflection"] = reflection.model_dump()
    _persist_session(session)
    logging.info(
        "[reflection] session=%s model=%s prompt=%s cached=false",
        session_id,
        reflection.model,
        reflection.promptVersion,
    )
    return {"reflection": session["ai_reflection"], "cached": False}


@app.get("/api/rewards/state")
async def get_rewards_state(current_user: AuthContext = Depends(get_current_user)):
    state = _load_reward_state(current_user)
    return state


@app.post("/api/dev/progression/preview-grants")
async def preview_progression_grants(
    data: ProgressionPreviewData,
    current_user: AuthContext = Depends(require_dev_access),
):
    """Dry-run unified base grants on a cloned reward state (no persistence)."""
    import copy

    from progression.grants import compute_unified_base_grants
    from repositories.json_reward import create_default_reward_state, merge_reward_state

    if data.use_account_state:
        base = copy.deepcopy(_load_reward_state(current_user))
    elif data.reward_state_snapshot:
        base = copy.deepcopy(data.reward_state_snapshot)
    else:
        base = create_default_reward_state()

    state = merge_reward_state(base)
    evaluated_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    xp, pux, cosmetics, logs = compute_unified_base_grants(
        state,
        data.activity_events,
        session_doc=data.session_doc,
        evaluated_at=evaluated_at,
    )
    state["xp"] = int(state.get("xp") or 0) + int(xp)
    if "currency" not in state or not isinstance(state["currency"], dict):
        state["currency"] = {"PUX": 0}
    state["currency"]["PUX"] = int(state["currency"].get("PUX") or 0) + int(pux)
    return {
        "granted_xp": int(xp),
        "granted_pux": int(pux),
        "cosmetics": cosmetics,
        "logs": logs,
        "state_after": {
            "xp": int(state.get("xp") or 0),
            "currency": state.get("currency") or {"PUX": 0},
            "processedUnits": state.get("processedUnits") or {},
            "processedGrantKeys": state.get("processedGrantKeys") or {},
            "unlockedCosmetics": state.get("unlockedCosmetics") or {},
        },
    }


@app.post("/api/dev/progression/run-journey")
async def run_progression_journey(
    current_user: AuthContext = Depends(require_dev_access),
):
    """Run the 4-week standard journey in one server-side chain (dry-run)."""
    from progression.dev_journey import run_standard_journey

    return run_standard_journey()


@app.post("/api/dev/progression/cosmetic-cleanup")
async def development_cosmetic_cleanup(
    data: DevelopmentCosmeticCleanupData,
    current_user: AuthContext = Depends(require_dev_access),
):
    """Reset current account cosmetics to Soll starter seed (development_data_cleanup).

    Not a product migration. Test/dev accounts only (require_dev_access).
    """
    from progression.cosmetic_cleanup import (
        development_data_cleanup_profile,
        development_data_cleanup_reward_state,
    )

    state = _load_reward_state(current_user)
    cleaned = development_data_cleanup_reward_state(
        state,
        reset_progression=bool(data.reset_progression),
    )
    _save_reward_state(current_user, cleaned)

    profile = get_repos().profiles.get_profile(current_user) or {}
    if not isinstance(profile, dict):
        profile = {}
    development_data_cleanup_profile(profile)
    get_repos().profiles.save_profile(current_user, profile)

    return {
        "ok": True,
        "kind": cleaned.get("developmentDataCleanupKind"),
        "reset_progression": bool(data.reset_progression),
        "starter": {
            "avatarId": "avatar_chalk_01",
            "bannerId": "banner_neutral_01",
            "emblemId": "emblem_puck_01",
            "frameId": None,
            "profileTitleId": "prospect",
            "taglineId": "tagline_starter",
        },
    }


@app.post("/api/rewards/apply")
async def apply_rewards(data: RewardApplyData, current_user: AuthContext = Depends(get_current_user)):
    enforce_max_text_length(data.reward_events, "reward_events")
    enforce_max_text_length(data.unlocked_achievements, "unlocked_achievements")
    enforce_max_text_length(data.unlocked_masteries, "unlocked_masteries")
    enforce_max_text_length(data.unlocked_cosmetics, "unlocked_cosmetics")
    enforce_max_text_length(data.unlock_history, "unlock_history")
    # Activity events can be large on rebuild; only enforce when not replace_derived.
    if not data.replace_derived:
        enforce_max_text_length(data.activity_events, "activity_events")

    event_id = (data.event_id or "").strip() or None
    session_id = (data.session_id or "").strip() or None

    # Hard stop: dummy/dev sessions must never mutate reward state.
    session_doc = None
    if session_id:
        session_doc = get_repos().sessions.find_session_raw(session_id)
        if isinstance(session_doc, dict) and session_doc.get("is_dummy") is True:
            state = _load_reward_state(current_user)
            return {
                "state": state,
                "applied": False,
                "granted_pux": 0,
                "granted_xp": 0,
                "reward_events": [],
                "reason": "dummy_session",
            }

    # Load sessions BEFORE the reward-row lock to avoid pool deadlocks.
    rebuild_events = None
    rebuild_sessions_by_id = None
    if data.replace_derived:
        from progression.session_events import activity_events_from_sessions

        owned_sessions = get_repos().sessions.list_sessions_for_user(current_user)
        rebuild_events, rebuild_sessions_by_id = activity_events_from_sessions(
            owned_sessions,
            user_id=current_user.rinq_user_id,
        )
        logging.info(
            "[progression] preloaded rebuild sessions=%s events=%s user=%s",
            len(owned_sessions),
            len(rebuild_events),
            current_user.rinq_user_id,
        )
        if not rebuild_events:
            raise HTTPException(
                status_code=400,
                detail="rebuild_from_sessions_empty: keine Sessions für Unit-Rebuild",
            )

    def _mutator(state: dict):
        return _compute_reward_apply(
            state,
            data,
            event_id=event_id,
            session_id=session_id,
            session_doc=session_doc if isinstance(session_doc, dict) else None,
            user=current_user,
            rebuild_events=rebuild_events,
            rebuild_sessions_by_id=rebuild_sessions_by_id,
        )

    result = get_repos().rewards.apply_reward_delta(current_user, _mutator)
    if isinstance(result, dict) and result.get("applied") is False:
        reason = result.get("reason") or "apply_failed"
        if str(reason).startswith("rebuild_"):
            raise HTTPException(status_code=400, detail=str(reason))
    return result


def _compute_reward_apply(
    state: dict,
    data: RewardApplyData,
    *,
    event_id,
    session_id,
    session_doc=None,
    user: Optional["AuthContext"] = None,
    rebuild_events: Optional[list] = None,
    rebuild_sessions_by_id: Optional[dict] = None,
):
    """Business rules for rewards/apply. Called under RewardRepository lock."""
    from progression.config import progression_unified_pipeline_enabled
    from progression.grants import compute_unified_base_grants
    from progression.level_curve import apply_curve_migration

    apply_curve_migration(state)

    processed_events = state.get("processedEvents") or {}
    processed_sessions = state.get("processedSessions") or {}
    unified_pipeline = progression_unified_pipeline_enabled()
    server_granted_xp = 0
    server_granted_pux = 0
    server_cosmetics: list = []

    if event_id and event_id in processed_events and not data.replace_derived and not data.skip_idempotency:
        return None, {
            "state": state,
            "applied": False,
            "granted_pux": 0,
            "granted_xp": 0,
            "reward_events": [],
            "reason": "event_already_processed",
        }

    if session_id and session_id in processed_sessions and not event_id and not data.replace_derived:
        return None, {
            "state": state,
            "applied": False,
            "granted_pux": 0,
            "granted_xp": 0,
            "reward_events": [],
            "reason": "session_already_processed",
        }

    if data.replace_derived:
        # Dev rebuild: replace derived progression; keep purchased cosmetics + shop ledger events.
        preserved_cosmetics = {}
        for cosmetic_id, entry in (state.get("unlockedCosmetics") or {}).items():
            if isinstance(entry, dict) and (
                entry.get("earnKind") == "purchased" or entry.get("sourceType") == "pux_shop"
            ):
                preserved_cosmetics[cosmetic_id] = entry
        preserved_shop_events = {
            eid: rec
            for eid, rec in (state.get("processedEvents") or {}).items()
            if str(eid).startswith("pux_shop_purchase:")
        }
        preserved_txs = [
            tx
            for tx in (state.get("puxTransactions") or [])
            if isinstance(tx, dict) and tx.get("sourceType") == "pux_shop"
        ]
        state["xp"] = 0
        shop_spent = 0
        for tx in preserved_txs:
            shop_spent += int(tx.get("amount") or 0)
        state["_rebuild_shop_spend"] = shop_spent
        state["currency"] = {"PUX": 0}
        state["processedEvents"] = {**preserved_shop_events}
        state["unlockedCosmetics"] = preserved_cosmetics
        state["activityLog"] = []
        state["unlockHistory"] = []
        state["bootstrapCompletedAt"] = None
        state["completedCollections"] = {}
        state["masteryMilestoneUnlocks"] = {}
        state["puxTransactions"] = preserved_txs
        state["venueVisits"] = {}
        state["processedUnits"] = {}
        state["processedGrantKeys"] = {
            k: v
            for k, v in (state.get("processedGrantKeys") or {}).items()
            if str(k).startswith("pux_shop_purchase:")
        }
        state["unlockedAchievements"] = {}
        state["processedSessions"] = {}
        processed_events = state["processedEvents"]
        processed_sessions = state["processedSessions"]

    if unified_pipeline:
        grant_events = None
        sessions_by_id: dict = {}
        # replace_derived: use preloaded server sessions (never nested DB fetch under lock).
        if data.replace_derived:
            grant_events = list(rebuild_events or [])
            sessions_by_id = dict(rebuild_sessions_by_id or {})
            if not grant_events:
                return None, {
                    "state": state,
                    "applied": False,
                    "granted_pux": 0,
                    "granted_xp": 0,
                    "reward_events": [],
                    "reason": "rebuild_from_sessions_empty",
                }
        elif data.activity_events:
            grant_events = data.activity_events
            try:
                for raw_event in data.activity_events or []:
                    if not isinstance(raw_event, dict):
                        continue
                    sid = str(raw_event.get("sessionId") or "").strip()
                    if not sid or sid in sessions_by_id:
                        continue
                    found = get_repos().sessions.find_session_raw(sid)
                    if isinstance(found, dict):
                        sessions_by_id[sid] = found
            except Exception:
                logging.exception("[progression] session hydrate for activity_events failed")

        if grant_events:
            server_granted_xp, server_granted_pux, server_cosmetics, grant_logs = compute_unified_base_grants(
                state,
                grant_events,
                session_doc=session_doc,
                sessions_by_id=sessions_by_id,
                evaluated_at=data.evaluated_at,
            )
            for line in grant_logs:
                if line.startswith("skip:") or line.startswith("grant:"):
                    logging.info("[progression] %s", line)
            logging.info(
                "[progression] server_grants xp=%s pux=%s cosmetics=%s units=%s",
                server_granted_xp,
                server_granted_pux,
                len(server_cosmetics),
                len(state.get("processedUnits") or {}),
            )
            if data.replace_derived and int(server_granted_xp) < 100:
                return None, {
                    "state": state,
                    "applied": False,
                    "granted_pux": 0,
                    "granted_xp": 0,
                    "reward_events": [],
                    "reason": "rebuild_zero_xp",
                }

    client_granted_pux = int(data.granted_pux or 0)
    client_granted_xp = int(data.granted_xp or 0)
    # On replace_derived, unit XP comes only from server session rebuild.
    # Client PUX may still carry achievement grants; level rewards are applied below.
    if data.replace_derived:
        client_granted_xp = 0
    total_granted_pux = client_granted_pux + server_granted_pux
    total_granted_xp = client_granted_xp + server_granted_xp

    next_pux = int(state["currency"].get("PUX", 0)) + total_granted_pux
    if data.replace_derived:
        shop_spent = int(state.pop("_rebuild_shop_spend", 0) or 0)
        next_pux = max(0, next_pux - shop_spent)
    if next_pux < 0:
        return None, {
            "state": state,
            "applied": False,
            "granted_pux": 0,
            "granted_xp": 0,
            "reward_events": [],
            "reason": "insufficient_pux",
        }
    state["currency"]["PUX"] = next_pux
    state["xp"] = int(state.get("xp") or 0) + total_granted_xp

    if data.replace_derived:
        from progression.level_rewards import apply_level_rewards_for_xp

        level_pux, level_cosmetics = apply_level_rewards_for_xp(
            state, evaluated_at=data.evaluated_at
        )
        if level_pux:
            state["currency"]["PUX"] = int(state["currency"].get("PUX", 0)) + int(level_pux)
            total_granted_pux += int(level_pux)
        if level_cosmetics:
            server_cosmetics = list(server_cosmetics) + list(level_cosmetics)

    if session_id and session_id not in processed_sessions:
        state["processedSessions"][session_id] = {
            "sessionId": session_id,
            "grantedAt": data.evaluated_at,
            "pux": int(total_granted_pux if unified_pipeline else client_granted_pux),
        }

    if event_id:
        state["processedEvents"][event_id] = {
            "eventId": event_id,
            "processedAt": data.evaluated_at,
            "grantedXp": int(data.granted_xp or 0),
            "grantedPux": int(data.granted_pux or 0),
        }

    for extra_event_id in data.processed_event_ids or []:
        eid = str(extra_event_id or "").strip()
        if not eid:
            continue
        if eid in state["processedEvents"]:
            continue
        state["processedEvents"][eid] = {
            "eventId": eid,
            "processedAt": data.evaluated_at,
            "grantedXp": 0,
            "grantedPux": 0,
        }

    for achievement in data.unlocked_achievements:
        achievement_id = (achievement.get("id") or "").strip()
        if not achievement_id:
            continue
        if unified_pipeline:
            from progression.legacy import is_legacy_achievement_id

            if is_legacy_achievement_id(achievement_id):
                logging.info("[progression] skip:legacy_achievement:%s", achievement_id)
                continue
        if achievement_id in state["unlockedAchievements"] and not data.replace_derived:
            continue

        unlocked_at = achievement.get("unlockedAt") or data.evaluated_at
        entry = {
            "id": achievement_id,
            "unlockedAt": unlocked_at,
        }
        if achievement.get("sourceEventId"):
            entry["sourceEventId"] = achievement.get("sourceEventId")
        state["unlockedAchievements"][achievement_id] = entry

    for cosmetic in server_cosmetics:
        cosmetic_id = (cosmetic.get("cosmeticId") or cosmetic.get("id") or "").strip()
        if not cosmetic_id:
            continue
        from progression.cosmetic_aliases import canonical_cosmetic_id, owns_cosmetic

        cosmetic_id = canonical_cosmetic_id(cosmetic_id) or cosmetic_id
        if owns_cosmetic(state, cosmetic_id) and not data.replace_derived:
            continue
        state["unlockedCosmetics"][cosmetic_id] = {
            "cosmeticId": cosmetic_id,
            "unlockedAt": cosmetic.get("unlockedAt") or data.evaluated_at,
            "sourceType": cosmetic.get("sourceType") or "progression",
            "sourceId": cosmetic.get("sourceId"),
            "seenAt": cosmetic.get("seenAt"),
            "earnKind": cosmetic.get("earnKind") or "earned",
        }

    legacy_masteries = [] if unified_pipeline else (data.unlocked_masteries or [])
    for mastery in legacy_masteries:
        mastery_key = (mastery.get("key") or "").strip()
        if not mastery_key:
            continue
        if mastery_key in state["unlockedMasteries"]:
            continue

        state["unlockedMasteries"][mastery_key] = mastery

    if "unlockedCosmetics" not in state or not isinstance(state["unlockedCosmetics"], dict):
        state["unlockedCosmetics"] = {}
    for cosmetic in data.unlocked_cosmetics:
        cosmetic_id = (cosmetic.get("cosmeticId") or cosmetic.get("id") or "").strip()
        if not cosmetic_id:
            continue
        from progression.cosmetic_aliases import canonical_cosmetic_id, owns_cosmetic

        cosmetic_id = canonical_cosmetic_id(cosmetic_id) or cosmetic_id
        if owns_cosmetic(state, cosmetic_id) and not data.replace_derived:
            # Allow seenAt / metadata refresh on existing unlocks.
            existing = state["unlockedCosmetics"].get(cosmetic_id)
            if isinstance(existing, dict):
                if cosmetic.get("seenAt"):
                    existing["seenAt"] = cosmetic.get("seenAt")
                if cosmetic.get("earnKind"):
                    existing["earnKind"] = cosmetic.get("earnKind")
            continue
        state["unlockedCosmetics"][cosmetic_id] = {
            "cosmeticId": cosmetic_id,
            "unlockedAt": cosmetic.get("unlockedAt") or data.evaluated_at,
            "sourceType": cosmetic.get("sourceType") or "reward",
            "sourceId": cosmetic.get("sourceId"),
            "seenAt": cosmetic.get("seenAt"),
            "earnKind": cosmetic.get("earnKind"),
        }

    for cosmetic_id in data.mark_cosmetics_seen or []:
        cid = str(cosmetic_id or "").strip()
        if not cid:
            continue
        entry = (state.get("unlockedCosmetics") or {}).get(cid)
        if isinstance(entry, dict) and not entry.get("seenAt"):
            entry["seenAt"] = data.evaluated_at

    if data.favorite_cosmetic_ids is not None:
        state["favoriteCosmeticIds"] = [
            str(item).strip() for item in data.favorite_cosmetic_ids if str(item).strip()
        ]

    if data.pux_transactions:
        txs = list(state.get("puxTransactions") or [])
        existing_tx = {str(item.get("id")) for item in txs if isinstance(item, dict) and item.get("id")}
        for tx in data.pux_transactions:
            if not isinstance(tx, dict):
                continue
            tid = str(tx.get("id") or "").strip()
            if tid and tid in existing_tx:
                continue
            txs.append(tx)
            if tid:
                existing_tx.add(tid)
        state["puxTransactions"] = txs[-500:]

    if data.completed_collections:
        if "completedCollections" not in state or not isinstance(state["completedCollections"], dict):
            state["completedCollections"] = {}
        for entry in data.completed_collections:
            if not isinstance(entry, dict):
                continue
            cid = str(entry.get("collectionId") or entry.get("id") or "").strip()
            if not cid or cid in state["completedCollections"]:
                continue
            state["completedCollections"][cid] = {
                "collectionId": cid,
                "completedAt": entry.get("completedAt") or data.evaluated_at,
            }

    if data.mastery_milestone_unlocks:
        if "masteryMilestoneUnlocks" not in state or not isinstance(state["masteryMilestoneUnlocks"], dict):
            state["masteryMilestoneUnlocks"] = {}
        for entry in data.mastery_milestone_unlocks:
            if not isinstance(entry, dict):
                continue
            mid = str(entry.get("masteryId") or "").strip()
            threshold = entry.get("milestoneThreshold")
            if not mid or threshold is None:
                continue
            key = f"{mid}:{threshold}"
            if key in state["masteryMilestoneUnlocks"]:
                continue
            state["masteryMilestoneUnlocks"][key] = entry

    if data.progression_pux_granted is not None:
        state["progressionPuxGranted"] = int(data.progression_pux_granted)

    if data.challenge_progress is not None and isinstance(data.challenge_progress, dict):
        state["challengeProgress"] = data.challenge_progress

    if data.challenge_rotation is not None:
        state["challengeRotation"] = data.challenge_rotation

    if data.venue_visits is not None and isinstance(data.venue_visits, dict):
        state["venueVisits"] = data.venue_visits

    if data.activity_events:
        existing_ids = {
            str(item.get("id"))
            for item in (state.get("activityLog") or [])
            if isinstance(item, dict) and item.get("id")
        }
        activity_log = list(state.get("activityLog") or [])
        for event in data.activity_events:
            if not isinstance(event, dict):
                continue
            eid = str(event.get("id") or "").strip()
            if not eid or eid in existing_ids:
                # Still ensure processedEvents knows about historical events from bootstrap.
                if eid and eid not in state["processedEvents"]:
                    state["processedEvents"][eid] = {
                        "eventId": eid,
                        "processedAt": data.evaluated_at,
                        "grantedXp": 0,
                        "grantedPux": 0,
                    }
                continue
            activity_log.append(event)
            existing_ids.add(eid)
            if eid not in state["processedEvents"]:
                state["processedEvents"][eid] = {
                    "eventId": eid,
                    "processedAt": data.evaluated_at,
                    "grantedXp": 0,
                    "grantedPux": 0,
                }
        # Keep a bounded log for storage; evaluation prefers full rebuild from sources when needed.
        state["activityLog"] = activity_log[-2000:]

    if data.unlock_history:
        history = list(state.get("unlockHistory") or [])
        existing_history_ids = {
            str(item.get("id"))
            for item in history
            if isinstance(item, dict) and item.get("id")
        }
        for entry in data.unlock_history:
            if not isinstance(entry, dict):
                continue
            hid = str(entry.get("id") or "").strip()
            if hid and hid in existing_history_ids:
                continue
            history.append(entry)
            if hid:
                existing_history_ids.add(hid)
        state["unlockHistory"] = history[-100:]

    if data.bootstrap_completed_at:
        state["bootstrapCompletedAt"] = data.bootstrap_completed_at

    state["lastUpdatedAt"] = data.evaluated_at
    return state, {
        "state": state,
        "applied": True,
        "granted_pux": total_granted_pux,
        "granted_xp": total_granted_xp,
        "reward_events": data.reward_events,
        "server_granted_pux": server_granted_pux,
        "server_granted_xp": server_granted_xp,
    }


# ---- RingAbout Scene Marker ----

def _build_scene_path(scene_id: str, created_at: Optional[str]) -> str:
    dt = _parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return os.path.join(SCENES_DIR, year, month, f"{scene_id}.json")


def _empty_microfeedback_for_scope(scope: Optional[str]) -> dict:
    """Foundation lessons (LESSON) do not collect period microfeedback."""
    if _normalize_observation_scope(scope) == "LESSON":
        return {}
    return {
        "P1": {"done": False, "text": ""},
        "P2": {"done": False, "text": ""},
        "P3": {"done": False, "text": ""},
    }


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
    if normalized == "LESSON":
        return ["P1"]
    return ["P1", "P2", "P3"]


def _initial_phase_for_scope(scope: Optional[str]) -> str:
    return _active_periods_for_scope(scope)[0]


def _normalize_scene_status(status: Optional[str]) -> str:
    value = (status or "").strip().upper()
    if value in SCENE_STATUSES:
        return value
    return SCENE_STATUS_NEW


def _resolve_scene_status(
    *,
    explicit_status: Optional[str],
    episode_season: Optional[str],
    episode_number: Optional[str],
    previous_status: Optional[str] = None,
    episode_fields_touched: bool = False,
) -> str:
    """Episode assignment always wins; clearing an episode drops ASSIGNED to PIPELINE."""
    if episode_season and episode_number:
        return SCENE_STATUS_ASSIGNED
    if explicit_status is not None:
        return _normalize_scene_status(explicit_status)
    current = _normalize_scene_status(previous_status)
    if episode_fields_touched and current == SCENE_STATUS_ASSIGNED:
        return SCENE_STATUS_PIPELINE
    if current == SCENE_STATUS_ASSIGNED:
        # Episode codes missing but status was ASSIGNED (legacy / partial data)
        return SCENE_STATUS_PIPELINE
    return current


def _normalize_scene_metadata_status(status: Optional[str]) -> Optional[str]:
    value = (status or "").strip().lower()
    if value in ("incomplete", "complete"):
        return value
    return None


def _build_scene_source(payload: SceneMarkerCreate) -> dict:
    raw = payload.source.model_dump() if payload.source is not None else {}
    source_type = str(raw.get("type") or "").strip().lower()
    session_id = (payload.session_id or raw.get("session_id") or None)
    session_id = str(session_id).strip() if session_id else None
    drill_id = (payload.drill_id or raw.get("drill_id") or None)
    drill_id = str(drill_id).strip() if drill_id else None
    observation_id = raw.get("observation_id")
    observation_id = str(observation_id).strip() if observation_id else None

    if source_type not in ("manual", "drill"):
        source_type = "drill" if session_id else "manual"

    if source_type == "manual":
        return {
            "type": "manual",
            "session_id": None,
            "drill_id": None,
            "observation_id": observation_id,
        }

    return {
        "type": "drill",
        "session_id": session_id,
        "drill_id": drill_id,
        "observation_id": observation_id,
    }


def _infer_metadata_status(scene: dict, explicit: Optional[str] = None) -> str:
    normalized = _normalize_scene_metadata_status(explicit)
    if normalized:
        return normalized
    has_core = bool(
        (scene.get("game_time") or "").strip()
        and (scene.get("period") or "").strip()
        and (scene.get("team_home") or "").strip()
        and (scene.get("team_away") or "").strip()
        and (scene.get("note") or "").strip()
    )
    has_observed = bool(
        (scene.get("observed_team_name") or scene.get("observed_team") or "").strip()
    )
    has_competition = bool(
        (scene.get("league") or "").strip()
        and (scene.get("season") or "").strip()
    )
    if has_core and has_observed and has_competition:
        return "complete"
    return "incomplete"


def _ensure_scene_source(scene: dict) -> dict:
    existing = scene.get("source")
    if isinstance(existing, dict) and str(existing.get("type") or "").strip().lower() in ("manual", "drill"):
        source_type = str(existing.get("type")).strip().lower()
        if source_type == "manual":
            scene["source"] = {
                "type": "manual",
                "session_id": None,
                "drill_id": None,
                "observation_id": existing.get("observation_id") or None,
            }
        else:
            scene["source"] = {
                "type": "drill",
                "session_id": existing.get("session_id") or scene.get("session_id") or None,
                "drill_id": existing.get("drill_id") or scene.get("drill_id") or None,
                "observation_id": existing.get("observation_id") or None,
            }
        return scene

    if scene.get("session_id"):
        scene["source"] = {
            "type": "drill",
            "session_id": scene.get("session_id"),
            "drill_id": scene.get("drill_id"),
            "observation_id": None,
        }
    else:
        scene["source"] = {
            "type": "manual",
            "session_id": None,
            "drill_id": None,
            "observation_id": None,
        }
    return scene


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


def _find_episode_conflict(episode_season: str, episode_number: str, current_user, exclude_scene_id: Optional[str] = None) -> Optional[dict]:
    for path in _iter_json_files(SCENES_DIR):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if exclude_scene_id and scene.get("id") == exclude_scene_id:
            continue
        if not _owners_match(scene.get("user", ""), current_user):
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
async def create_scene(payload: SceneMarkerCreate, current_user: AuthContext = Depends(get_current_user)):
    if not is_creator_mode_auth(current_user, role_from_record=_role_from_auth(current_user)):
        raise HTTPException(status_code=403, detail="Scene capture is not enabled for this account")
    import re
    if not re.match(r"^\d{1,2}(:\d{1,2})?$", (payload.game_time or "").strip()):
        raise HTTPException(status_code=400, detail="game_time must be a valid time, e.g. 13:42 or 13")

    enforce_max_text_length(payload.note, "scene.note")
    enforce_max_text_length(payload.drill_title, "scene.drill_title")

    source = _build_scene_source(payload)
    session_id = source.get("session_id")
    drill_id = source.get("drill_id") if source.get("type") == "drill" else None
    module_id = (payload.module_id or "").strip() or None
    track_id = (payload.track_id or "").strip() or None

    if source["type"] == "drill" and not session_id:
        raise HTTPException(status_code=400, detail="session_id is required for drill scenes")
    if source["type"] == "manual":
        session_id = None
        drill_id = None
        module_id = None
        track_id = None

    owner_id = current_user.rinq_user_id
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
        "user": owner_id,
        "session_id": session_id,
        "module_id": module_id,
        "drill_id": drill_id,
        "drill_title": payload.drill_title if source["type"] == "drill" else None,
        "track_id": track_id,
        "source": source,
        "status": _resolve_scene_status(
            explicit_status=payload.status,
            episode_season=episode_season,
            episode_number=episode_number,
        ),
        "league": payload.league,
        "season": payload.season,
        "competition_phase": payload.competition_phase,
        "competition_phase_label": payload.competition_phase_label,
        "competition_unit_type": payload.competition_unit_type,
        "competition_unit_label": payload.competition_unit_label,
        "competition_unit_value": payload.competition_unit_value,
        "matchday": payload.matchday,
        "game_date": (payload.game_date or "").strip() or None,
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
    scene["metadata_status"] = _infer_metadata_status(scene, payload.metadata_status)

    scene_path = _build_scene_path(scene_id, now_iso)
    save_json(scene_path, scene)
    logging.info(f"[scene] created scene_id={scene_id} scene_code={scene_code} user={owner_id} source={source.get('type')} game_time={scene['game_time']}")
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
    source_type: Optional[str] = None,
    current_user: AuthContext = Depends(get_current_user),
):
    scenes = []
    source_type_norm = (source_type or "").strip().lower() or None
    with SCENE_CODE_LOCK:
        _ensure_legacy_scene_codes()
    for path in _iter_json_files(SCENES_DIR):
        try:
            scene = load_json(path)
        except Exception:
            continue
        if not _owners_match(scene.get("user", ""), current_user):
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
        _ensure_scene_source(scene)
        if source_type_norm and scene.get("source", {}).get("type") != source_type_norm:
            continue
        scene["status"] = scene_status
        scene["scene_code"] = _normalize_scene_code(scene.get("scene_code") or scene.get("internal_scene_id"))
        scene["episode_season"] = _scene_episode_season(scene)
        scene["episode_number"] = _scene_episode_number(scene)
        scene["season_code"] = scene["episode_season"]
        scene["episode_code"] = scene["episode_number"]
        if not scene.get("metadata_status"):
            scene["metadata_status"] = _infer_metadata_status(scene)
        scenes.append(scene)

    scenes.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    return {"scenes": scenes}


@app.delete("/api/scenes/{scene_id}")
async def delete_scene(scene_id: str, current_user: AuthContext = Depends(get_current_user)):
    scene_path = _find_scene_path_by_identifier(scene_id)
    if not scene_path:
        raise HTTPException(status_code=404, detail="Scene not found")
    scene = load_json(scene_path)
    if not _owners_match(scene.get("user", ""), current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    os.remove(scene_path)
    logging.info(f"[scene] deleted scene_id={scene_id} user={current_user.rinq_user_id}")
    return {"status": "deleted", "id": scene_id}


@app.put("/api/scenes/{scene_id}")
async def update_scene(scene_id: str, payload: SceneMarkerUpdate, current_user: AuthContext = Depends(get_current_user)):
    scene_path = _find_scene_path_by_identifier(scene_id)
    if not scene_path:
        raise HTTPException(status_code=404, detail="Scene not found")
    scene = load_json(scene_path)
    if not _owners_match(scene.get("user", ""), current_user):
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

    previous_status = scene.get("status")
    status_explicitly_set = payload.status is not None

    optional_text_fields = (
        "period",
        "league",
        "season",
        "competition_phase",
        "competition_phase_label",
        "competition_unit_type",
        "competition_unit_label",
        "competition_unit_value",
        "matchday",
        "game_date",
        "team_home",
        "team_away",
        "observed_team",
        "observed_team_id",
        "observed_team_name",
    )
    payload_fields = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))
    for field_name in optional_text_fields:
        if field_name in payload_fields:
            value = getattr(payload, field_name)
            if value is None:
                scene[field_name] = None
            else:
                cleaned = str(value).strip()
                scene[field_name] = cleaned or None

    if "observed_team" in payload_fields or "observed_team_name" in payload_fields:
        observed_name = scene.get("observed_team_name") or scene.get("observed_team")
        scene["observed_team_name"] = observed_name
        if not scene.get("observed_team") and observed_name:
            scene["observed_team"] = observed_name

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

    scene["status"] = _resolve_scene_status(
        explicit_status=payload.status if status_explicitly_set else None,
        episode_season=episode_season,
        episode_number=episode_number,
        previous_status=previous_status,
        episode_fields_touched=episode_fields_touched,
    )

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
    
    if "rating" in payload_fields:
        scene["rating"] = _normalize_scene_rating(payload.rating)
    
    # Update extensions if provided
    if payload.extensions is not None:
        scene["extensions"] = payload.extensions
    
    # Update extension_labels if provided
    if payload.extension_labels is not None:
        scene["extension_labels"] = payload.extension_labels

    if "metadata_status" in payload_fields:
        scene["metadata_status"] = _infer_metadata_status(scene, payload.metadata_status)
    else:
        scene["metadata_status"] = _infer_metadata_status(scene, scene.get("metadata_status"))

    # Preserve drill provenance: never invent fake session/drill IDs on update
    existing_source = scene.get("source") if isinstance(scene.get("source"), dict) else None
    if not existing_source:
        if scene.get("session_id"):
            scene["source"] = {
                "type": "drill",
                "session_id": scene.get("session_id"),
                "drill_id": scene.get("drill_id"),
                "observation_id": None,
            }
        else:
            scene["source"] = {
                "type": "manual",
                "session_id": None,
                "drill_id": None,
                "observation_id": None,
            }
    
    scene["updated_at"] = datetime.now().isoformat()
    save_json(scene_path, scene)
    logging.info(f"[scene] updated scene_id={scene_id} user={current_user}")
    return scene


# Auth Endpoints nach finaler app-Definition (jetzt immer registriert)
@app.get("/api/auth/registration")
async def registration_status():
    return {"allow_legacy_signup": legacy_signup_allowed()}


@app.post("/api/auth/signup")
async def signup(payload: dict, request: Request):
    rate_limit(request, "signup", limit=5, window_sec=60.0)
    if not legacy_signup_allowed():
        logging.warning("[SEC] signup_disabled ip=%s", client_ip(request))
        raise HTTPException(
            status_code=403,
            detail="Legacy signup is disabled. Use managed login when available.",
        )
    if not payload.get("age_confirmed"):
        raise HTTPException(
            status_code=400,
            detail="Age confirmation required (18+).",
        )
    username = payload["username"].strip().lower()
    password = payload["password"].strip()
    users = load_users()
    if any(u["username"].strip().lower() == username for u in users["users"]):
        raise HTTPException(status_code=400, detail="User exists")
    created_at = datetime.utcnow().isoformat()
    users["users"].append({
        "username": username,
        "password_hash": hash_password(password),
        "created_at": created_at,
        "role": "user"
    })
    save_users(users)
    ctx = _identity_repo().ensure_legacy_identity(username, display_name=username, created_at=created_at)
    logging.info("[AUTH] signup ok subject=%s rinq_user_id=%s", username, ctx.rinq_user_id)
    return {"ok": True}

@app.post("/api/auth/login")
async def login(payload: dict, request: Request):
    rate_limit(request, "login", limit=20, window_sec=60.0)
    username = payload["username"].strip().lower()
    password = payload["password"].strip()
    logging.info("[AUTH] login attempt subject=%s ip=%s", username, client_ip(request))
    users = load_users()
    user = next((u for u in users["users"] if u["username"].strip().lower() == username), None)
    if not user or not verify_password(password, user["password_hash"]):
        logging.warning("[SEC] login_failed subject=%s ip=%s", username, client_ip(request))
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_cased = user.get("username") or username
    ctx = _identity_repo().ensure_legacy_identity(
        username,
        display_name=user_cased,
        created_at=user.get("created_at"),
    )
    # Legacy JWT: sub remains normalized username — NOT rinq_user_id
    token = jwt.encode({
        "sub": username,
        "exp": (datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)).timestamp()
    }, JWT_SECRET, algorithm=JWT_ALGO)
    logging.info("[AUTH] login ok subject=%s rinq_user_id=%s", username, ctx.rinq_user_id)
    return {
        "token": token,
        "username": user_cased,
        "rinq_user_id": ctx.rinq_user_id,
        "user_id": ctx.rinq_user_id,
    }


# ---- Account / RINK ID profile ----
from fastapi.staticfiles import StaticFiles

UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
AVATAR_UPLOADS_DIR = os.path.join(UPLOADS_DIR, "avatars")
os.makedirs(PROFILES_DIR, exist_ok=True)
os.makedirs(AVATAR_UPLOADS_DIR, exist_ok=True)

ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_AVATAR_BYTES = 2 * 1024 * 1024


def _profile_path(user) -> str:
    return os.path.join(PROFILES_DIR, f"{_normalize_user_key(user)}.json")


def _legacy_profile_path(user) -> Optional[str]:
    if isinstance(user, AuthContext) and user.legacy_username:
        return os.path.join(PROFILES_DIR, f"{normalize_subject(user.legacy_username)}.json")
    return None


def _default_user_profile(username: str) -> dict:
    from repositories.json_profile import default_user_profile

    return default_user_profile(username)


def _needs_display_name_setup(user) -> bool:
    """True for new managed-auth users who have not yet chosen a profile display name.

    Legacy users and linked accounts (identity has legacy_username) are never prompted.
    """
    if not isinstance(user, AuthContext):
        return False
    if user.auth_provider not in MANAGED_AUTH_PROVIDERS:
        return False
    # Account-linking: Google/email login on a legacy-backed identity keeps the existing name.
    if user.legacy_username:
        return False
    path = _profile_path(user)
    if not os.path.exists(path):
        legacy = _legacy_profile_path(user)
        if legacy and os.path.exists(legacy):
            path = legacy
        else:
            return True
    try:
        stored = load_json(path) or {}
    except Exception:
        return True
    return not bool(stored.get("displayNameChosen"))


_DISPLAY_NAME_RE = re.compile(
    r"^[\w\s\-'.]+$",
    re.UNICODE,
)


def _validate_display_name(raw: str) -> str:
    """Normalize and validate a user-chosen display name (not a unique username)."""
    name = (raw or "").strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Anzeigename: mindestens 2 Zeichen.")
    if len(name) > 40:
        raise HTTPException(status_code=400, detail="Anzeigename ist zu lang (max. 40 Zeichen).")
    if "@" in name or "://" in name:
        raise HTTPException(status_code=400, detail="Anzeigename darf keine E-Mail oder URL sein.")
    if not _DISPLAY_NAME_RE.match(name):
        raise HTTPException(
            status_code=400,
            detail="Anzeigename: nur Buchstaben, Zahlen, Leerzeichen und - ' .",
        )
    # Collapse internal whitespace
    name = re.sub(r"\s+", " ", name)
    return name


def _load_user_profile(user) -> dict:
    if isinstance(user, AuthContext):
        return get_repos().profiles.get_profile(user)
    display_seed = _resolve_user_cased(user)
    # Rare non-AuthContext callers: build a transient context for the repo.
    transient = AuthContext(
        rinq_user_id=_normalize_user_key(user),
        auth_provider=LEGACY_PASSWORD_PROVIDER,
        auth_subject=_normalize_user_key(user),
        display_name=display_seed,
        legacy_username=_normalize_user_key(user),
    )
    return get_repos().profiles.get_profile(transient)


def _save_user_profile(user, profile: dict) -> dict:
    if isinstance(user, AuthContext):
        return get_repos().profiles.save_profile(user, profile)
    display_seed = _resolve_user_cased(user)
    transient = AuthContext(
        rinq_user_id=_normalize_user_key(user),
        auth_provider=LEGACY_PASSWORD_PROVIDER,
        auth_subject=_normalize_user_key(user),
        display_name=display_seed,
        legacy_username=_normalize_user_key(user),
    )
    return get_repos().profiles.save_profile(transient, profile)


def _find_user_record(user) -> Optional[dict]:
    if isinstance(user, AuthContext):
        key = normalize_subject(user.legacy_username or user.auth_subject)
    else:
        key = normalize_subject(str(user))
    return get_repos().credentials.get_by_username(key)


class ProfileUpdatePayload(BaseModel):
    displayName: Optional[str] = None
    avatar: Optional[dict] = None
    bannerId: Optional[str] = None
    frameId: Optional[str] = None
    emblem: Optional[dict] = None
    customEmblemId: Optional[str] = None
    customEmblems: Optional[list] = None
    profileTitle: Optional[str] = None
    jerseyNumber: Optional[int] = None
    favoriteLeague: Optional[str] = None
    favoriteTeamName: Optional[str] = None
    profileTagline: Optional[str] = None
    stickerIds: Optional[list] = None
    academyHelpLevel: Optional[str] = None
    terminologyMode: Optional[str] = None
    preferredAttackDirection: Optional[str] = None
    hockeyExperience: Optional[str] = None
    experiencePromptDismissed: Optional[bool] = None
    dashboardPreferences: Optional[dict] = None


class EntitlementGrantPayload(BaseModel):
    rinq_user_id: str
    feature_key: str
    source: str = "manual"
    expires_at: Optional[str] = None
    metadata: Optional[dict] = None


class EntitlementRevokePayload(BaseModel):
    rinq_user_id: str
    feature_key: str


@app.get("/api/me/entitlements")
async def get_my_entitlements(current_user: AuthContext = Depends(get_current_user)):
    """Active feature grants for the authenticated user (server source of truth)."""
    grants = get_repos().entitlements.get_active_entitlements(current_user.rinq_user_id)
    return {"rinq_user_id": current_user.rinq_user_id, "entitlements": grants}


def _require_postgres_billing() -> None:
    from db.settings import storage_backend

    if storage_backend() != "postgres":
        raise HTTPException(status_code=503, detail="Billing requires Postgres storage")


@app.get("/api/me/billing")
async def get_my_billing(current_user: AuthContext = Depends(get_current_user)):
    """Stripe plan snapshot + subscription rows (billing only — gates use entitlement_grants)."""
    _require_postgres_billing()
    from billing.persistence import get_billing_status

    try:
        status = get_billing_status(current_user.rinq_user_id)
    except Exception as exc:
        logging.exception("[billing] status read failed")
        raise HTTPException(status_code=500, detail="Billing status unavailable") from exc
    # Do not expose payment-intent / charge anchors to the client
    public_subs = []
    for row in status.get("subscriptions") or []:
        public_subs.append(
            {
                "external_subscription_id": row.get("external_subscription_id"),
                "status": row.get("status"),
                "price_id": row.get("price_id"),
                "external_customer_id": row.get("external_customer_id"),
                "current_period_start": row.get("current_period_start"),
                "current_period_end": row.get("current_period_end"),
                "cancel_at_period_end": row.get("cancel_at_period_end"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
                "contract_started_at": row.get("contract_started_at"),
            }
        )
    return {
        "rinq_user_id": current_user.rinq_user_id,
        "plan": status.get("plan"),
        "subscriptions": public_subs,
    }


@app.post("/api/billing/checkout")
async def billing_checkout(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Start Stripe Checkout for academy_premium — grant applied via verified webhook only."""
    _require_postgres_billing()
    rate_limit(request, "billing_checkout", limit=10, window_sec=3600.0)
    from billing import settings as billing_settings
    from billing.checkout import (
        ActiveSubscriptionError,
        AgeConfirmationRequired,
        create_checkout_session,
    )

    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}

    if not billing_settings.stripe_configured():
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    try:
        result = create_checkout_session(
            current_user,
            age_confirmed=bool(body.get("age_confirmed")),
        )
    except AgeConfirmationRequired as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ActiveSubscriptionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("[billing] checkout session failed")
        raise HTTPException(status_code=502, detail="Checkout unavailable") from exc
    return {"ok": True, **result}


@app.get("/api/billing/offer")
async def billing_offer(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Public price snapshot from Stripe Price API for pre-checkout disclosure."""
    _require_postgres_billing()
    rate_limit(request, "billing_offer", limit=60, window_sec=60.0)
    from billing import settings as billing_settings
    from billing.offer import get_premium_offer

    if not billing_settings.stripe_configured():
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    try:
        return {"ok": True, "offer": get_premium_offer()}
    except Exception as exc:
        logging.exception("[billing] offer lookup failed")
        raise HTTPException(status_code=502, detail="Offer unavailable") from exc


@app.post("/api/billing/withdrawal-request")
async def billing_withdrawal_request(
    payload: dict,
    request: Request,
    authorization: str = Header(None),
):
    """
    Consumer withdrawal declaration.
    Authenticated: process cancel/refund after UI confirm.
    Public: email match + confirm link (no Stripe IDs exposed).
    """
    rate_limit(request, "billing_withdrawal", limit=10, window_sec=3600.0)
    if not payload.get("confirmed"):
        raise HTTPException(status_code=400, detail="Confirmation required")
    from billing.withdrawal import (
        public_response,
        record_withdrawal_request,
        resolve_user_by_customer_email,
    )

    note = payload.get("note")
    if note is not None and not isinstance(note, str):
        raise HTTPException(status_code=400, detail="Invalid note")

    display_name = payload.get("display_name")
    contact_email = payload.get("contact_email")
    if display_name is not None and not isinstance(display_name, str):
        raise HTTPException(status_code=400, detail="Invalid display_name")
    if contact_email is not None and not isinstance(contact_email, str):
        raise HTTPException(status_code=400, detail="Invalid contact_email")

    user = resolve_user_from_authorization(authorization)
    require_email_confirm = False
    if user:
        rinq_user_id = user.rinq_user_id
        name = (display_name or "").strip() or user.display_name
        email = (contact_email or "").strip() or None
        if not name or not email or "@" not in email:
            raise HTTPException(
                status_code=400,
                detail="Name und E-Mail sind für den Widerruf erforderlich.",
            )
    else:
        name = (display_name or "").strip()
        email = (contact_email or "").strip().lower()
        if not name or not email or "@" not in email:
            raise HTTPException(
                status_code=400,
                detail="Name und E-Mail sind für den öffentlichen Widerruf erforderlich.",
            )
        rinq_user_id, resolved_email, err = resolve_user_by_customer_email(email)
        if err or not rinq_user_id:
            raise HTTPException(
                status_code=404,
                detail=err or "Kein Abonnement zu diesen Angaben gefunden.",
            )
        email = resolved_email or email
        require_email_confirm = True

    try:
        row = record_withdrawal_request(
            rinq_user_id=rinq_user_id,
            display_name=name if isinstance(name, str) else None,
            contact_email=email,
            note=note if isinstance(note, str) else None,
            require_email_confirm=require_email_confirm,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    logging.info(
        "[billing] withdrawal_request id=%s rinq_user_id=%s status=%s",
        row.get("id"),
        rinq_user_id,
        row.get("status"),
    )
    return {"ok": True, **public_response(row)}


@app.post("/api/billing/withdrawal-confirm")
async def billing_withdrawal_confirm(payload: dict, request: Request):
    """Confirm a public withdrawal via emailed token, then process refund."""
    rate_limit(request, "billing_withdrawal_confirm", limit=20, window_sec=3600.0)
    token = payload.get("token") if isinstance(payload, dict) else None
    if not isinstance(token, str) or not token.strip():
        raise HTTPException(status_code=400, detail="Token required")
    from billing.withdrawal import confirm_withdrawal_by_token, public_response

    try:
        row = confirm_withdrawal_by_token(token.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, **public_response(row)}


@app.post("/api/billing/portal")
async def billing_portal(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Stripe Customer Portal — manage subscription, payment method, invoices."""
    _require_postgres_billing()
    rate_limit(request, "billing_portal", limit=20, window_sec=3600.0)
    from billing import settings as billing_settings
    from billing.portal import create_portal_session

    if not billing_settings.stripe_configured():
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    try:
        result = create_portal_session(current_user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("[billing] portal session failed")
        raise HTTPException(status_code=502, detail="Portal unavailable") from exc
    return {"ok": True, **result}


@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook — signature verified; idempotent; syncs subscription → entitlement_grants."""
    _require_postgres_billing()
    rate_limit(request, "stripe_webhook", limit=600, window_sec=60.0)
    from billing.webhook import construct_stripe_event, handle_stripe_event

    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    try:
        event = construct_stripe_event(payload, signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logging.warning("[billing] webhook signature invalid")
        raise HTTPException(status_code=400, detail="Invalid webhook signature") from exc
    try:
        return handle_stripe_event(event)
    except Exception as exc:
        logging.exception("[billing] webhook handler failed id=%s", event.get("id"))
        raise HTTPException(status_code=500, detail="Webhook processing failed") from exc


@app.post("/api/admin/entitlements/grant")
async def admin_grant_entitlement(
    payload: EntitlementGrantPayload,
    current_user: AuthContext = Depends(require_admin),
):
    """Manual / beta / ops grants — admin only; never callable by normal users."""
    try:
        validate_feature_key(payload.feature_key)
        validate_grant_source(payload.source)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        grant = get_repos().entitlements.grant_entitlement(
            payload.rinq_user_id,
            payload.feature_key,
            source=payload.source,
            expires_at=payload.expires_at,
            metadata=payload.metadata,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("[entitlements] admin grant failed")
        raise HTTPException(status_code=500, detail="Grant failed") from exc
    return {"ok": True, "grant": grant}


@app.post("/api/admin/entitlements/revoke")
async def admin_revoke_entitlement(
    payload: EntitlementRevokePayload,
    current_user: AuthContext = Depends(require_admin),
):
    try:
        validate_feature_key(payload.feature_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        revoked = get_repos().entitlements.revoke_entitlement(
            payload.rinq_user_id,
            payload.feature_key,
        )
    except Exception as exc:
        logging.exception("[entitlements] admin revoke failed")
        raise HTTPException(status_code=500, detail="Revoke failed") from exc
    if not revoked:
        raise HTTPException(status_code=404, detail="No active grant to revoke")
    return {"ok": True, "revoked": True}


@app.post("/api/admin/mail/test")
async def admin_mail_test(
    payload: dict,
    request: Request,
    current_user: AuthContext = Depends(require_admin),
):
    """Send a transactional test mail to an explicit address (admin only)."""
    rate_limit(request, "admin_mail_test", limit=5, window_sec=3600.0)
    to = (payload or {}).get("to") if isinstance(payload, dict) else None
    if not isinstance(to, str) or "@" not in to.strip():
        raise HTTPException(status_code=400, detail="Field 'to' (email) required")
    from mail import MSG_TEST, build_test_mail_bodies, mail_configured, send_transactional_mail

    if not mail_configured():
        raise HTTPException(status_code=503, detail="SMTP not configured")
    text, html = build_test_mail_bodies()
    result = send_transactional_mail(
        recipient=to.strip(),
        subject="rInQ Tank — SMTP Test",
        text_body=text,
        html_body=html,
        message_type=MSG_TEST,
        reference_id="admin-mail-test",
    )
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.error or "Mail failed")
    return {"ok": True, "to": to.strip()}


@app.post("/api/admin/billing/withdrawal/{withdrawal_id}/retry-email")
async def admin_withdrawal_retry_email(
    withdrawal_id: str,
    current_user: AuthContext = Depends(require_admin),
):
    from billing.withdrawal import public_response, retry_withdrawal_email

    try:
        row = retry_withdrawal_email(withdrawal_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, **public_response(row)}


@app.post("/api/admin/billing/withdrawal/{withdrawal_id}/retry")
async def admin_withdrawal_retry(
    withdrawal_id: str,
    current_user: AuthContext = Depends(require_admin),
):
    """Resume withdrawal processing (cancel/refund/email) without creating a new request."""
    from billing.withdrawal import public_response, retry_withdrawal_processing

    try:
        row = retry_withdrawal_processing(withdrawal_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, **public_response(row)}


@app.get("/api/me")
async def get_me(current_user: AuthContext = Depends(get_current_user)):
    record = _find_user_record(current_user)
    profile = _load_user_profile(current_user)
    display = (profile or {}).get("displayName") or _resolve_user_cased(current_user)
    role = (record or {}).get("role")
    return {
        "username": _resolve_user_cased(current_user),
        "rinq_user_id": current_user.rinq_user_id,
        "user_id": current_user.rinq_user_id,
        "display_name": display,
        "auth_provider": current_user.auth_provider,
        "createdAt": (record or {}).get("created_at"),
        "role": role,
        "is_admin": is_admin_auth(current_user, role_from_record=role),
        "is_dev_access": is_dev_access_auth(current_user, role_from_record=role),
        "creator_mode": is_creator_mode_auth(current_user, role_from_record=role),
        "profile": profile,
        "needs_display_name": _needs_display_name_setup(current_user),
        "auth_providers": _identity_repo().list_providers_for_user(current_user.rinq_user_id),
        "google_linked": SUPABASE_GOOGLE_PROVIDER
        in _identity_repo().list_providers_for_user(current_user.rinq_user_id),
    }


@app.get("/api/me/profile")
async def get_my_profile(current_user: AuthContext = Depends(get_current_user)):
    return _load_user_profile(current_user)


class LinkGooglePayload(BaseModel):
    """Supabase access token from OAuth — verified server-side. Never trust client user ids."""

    access_token: str


@app.post("/api/me/auth/link/google")
async def link_google_account(
    payload: LinkGooglePayload,
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Link a verified Google/Supabase identity to the currently authenticated RinQ user.

    Requires an existing session (typically legacy). Does not merge by email.
    """
    rate_limit(request, "auth_link", limit=20, window_sec=60.0)
    if not supabase_configured():
        raise HTTPException(status_code=503, detail="Google Login ist nicht konfiguriert")

    token = (payload.access_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="access_token required")

    try:
        claims = verify_supabase_access_token(token)
    except Exception:
        logging.warning("[SEC] auth_link_google_token_invalid subject=%s", current_user.auth_subject)
        raise HTTPException(status_code=401, detail="Invalid Google token")

    sub = str(claims.get("sub") or "").strip()
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    app_meta = claims.get("app_metadata") if isinstance(claims.get("app_metadata"), dict) else {}
    provider = str((app_meta or {}).get("provider") or "").strip().lower()
    providers = (app_meta or {}).get("providers") or []
    if isinstance(providers, str):
        providers = [providers]
    is_google = provider == "google" or "google" in [str(p).lower() for p in providers]
    if not is_google:
        raise HTTPException(status_code=400, detail="Nur Google-Konten können verknüpft werden")

    try:
        link = _identity_repo().create_auth_link(
            current_user.rinq_user_id,
            SUPABASE_GOOGLE_PROVIDER,
            sub,
            allow_reclaim_orphan=True,
        )
    except (ValueError, DuplicateAuthLinkError, ConflictError) as exc:
        logging.warning(
            "[SEC] auth_link_google_conflict rinq=%s detail=%s",
            current_user.rinq_user_id,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=409,
            detail="Dieses Google-Konto ist bereits mit einem anderen RinQ-Account verknüpft.",
        )
    except (KeyError, NotFoundError):
        raise HTTPException(status_code=401, detail="Invalid session")

    logging.info(
        "[SEC] auth_link_google_ok rinq=%s provider=%s",
        current_user.rinq_user_id,
        SUPABASE_GOOGLE_PROVIDER,
    )
    return {
        "ok": True,
        "rinq_user_id": current_user.rinq_user_id,
        "provider": SUPABASE_GOOGLE_PROVIDER,
        "linked_at": link.get("linked_at"),
        "auth_providers": _identity_repo().list_providers_for_user(current_user.rinq_user_id),
        "google_linked": True,
    }


class UnlinkAuthPayload(BaseModel):
    provider: str


@app.delete("/api/me/auth/links/{provider}")
async def unlink_auth_provider(
    provider: str,
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Detach one login method. Refuses removing the last method."""
    rate_limit(request, "auth_unlink", limit=20, window_sec=60.0)
    key = (provider or "").strip()
    try:
        removed = _identity_repo().remove_auth_link(current_user.rinq_user_id, key)
    except (ValueError, ConflictError) as exc:
        if str(exc) == "cannot_unlink_last_login_method":
            raise HTTPException(
                status_code=400,
                detail="Die letzte Login-Methode kann nicht entfernt werden.",
            )
        raise HTTPException(status_code=400, detail="Trennen fehlgeschlagen")
    except (KeyError, NotFoundError):
        raise HTTPException(status_code=404, detail="Login-Methode nicht verknüpft")
    logging.info(
        "[SEC] auth_link_removed rinq=%s provider=%s",
        current_user.rinq_user_id,
        key,
    )
    providers = _identity_repo().list_providers_for_user(current_user.rinq_user_id)
    return {
        "ok": True,
        "removed_provider": removed.get("provider"),
        "auth_providers": providers,
        "google_linked": SUPABASE_GOOGLE_PROVIDER in providers,
    }


@app.get("/api/me/export")
async def export_my_data(
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Download a JSON export of the caller's own runtime data (no secrets)."""
    rate_limit(request, "account_export", limit=10, window_sec=60.0)
    from account_lifecycle import collect_export, export_filename
    from fastapi.responses import Response

    payload = collect_export(
        current_user,
        profiles_dir=PROFILES_DIR,
        rewards_dir=REWARDS_DIR,
        sessions_dir=SESSIONS_DIR,
        scenes_dir=SCENES_DIR,
        obs_runs_dir=OBS_RUNS_DIR,
        obs_entries_dir=OBS_ENTRIES_DIR,
        obs_players_dir=OBS_PLAYERS_DIR,
        avatars_dir=AVATAR_UPLOADS_DIR,
        identity_store=_identity_repo(),
    )
    body = json.dumps(payload, indent=2, ensure_ascii=False)
    logging.info("[SEC] account_export rinq=%s", current_user.rinq_user_id)
    return Response(
        content=body,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{export_filename()}"',
        },
    )


class DeleteAccountPayload(BaseModel):
    confirm: str
    password: Optional[str] = None


@app.post("/api/me/delete")
async def delete_my_account(
    payload: DeleteAccountPayload,
    request: Request,
    current_user: AuthContext = Depends(get_current_user),
):
    """Irreversible self-service account deletion."""
    rate_limit(request, "account_delete", limit=5, window_sec=60.0)
    logging.warning("[SEC] account_delete_requested rinq=%s", current_user.rinq_user_id)

    if (payload.confirm or "").strip() != "LÖSCHEN":
        raise HTTPException(
            status_code=400,
            detail='Bestätigung ungültig — bitte exakt „LÖSCHEN“ eingeben.',
        )

    # Reauth: legacy password when available
    if current_user.legacy_username or current_user.auth_provider == LEGACY_PASSWORD_PROVIDER:
        if not payload.password:
            raise HTTPException(status_code=400, detail="Passwort zur Bestätigung erforderlich.")
        record = _find_user_record(current_user)
        if not record or not verify_password(payload.password, record.get("password_hash") or ""):
            raise HTTPException(status_code=401, detail="Passwort falsch.")

    from account_lifecycle import delete_account as lifecycle_delete

    def _remove_legacy_row(username: str) -> bool:
        users = load_users()
        key = normalize_subject(username)
        before = len(users.get("users") or [])
        users["users"] = [
            u
            for u in users.get("users") or []
            if normalize_subject(u.get("username") or "") != key
        ]
        if len(users["users"]) == before:
            return False
        save_users(users)
        return True

    try:
        summary = lifecycle_delete(
            current_user,
            identity_store=_identity_repo(),
            profiles_dir=PROFILES_DIR,
            rewards_dir=REWARDS_DIR,
            sessions_dir=SESSIONS_DIR,
            scenes_dir=SCENES_DIR,
            obs_runs_dir=OBS_RUNS_DIR,
            obs_entries_dir=OBS_ENTRIES_DIR,
            obs_players_dir=OBS_PLAYERS_DIR,
            avatars_dir=AVATAR_UPLOADS_DIR,
            users_file=USERS_FILE,
            remove_legacy_user_row=_remove_legacy_row,
        )
    except RuntimeError as exc:
        msg = str(exc)
        if msg == "supabase_service_role_required":
            logging.error("[SEC] account_delete_failed rinq=%s reason=missing_service_role", current_user.rinq_user_id)
            raise HTTPException(
                status_code=503,
                detail="Account-Löschung benötigt serverseitig SUPABASE_SERVICE_ROLE_KEY.",
            )
        if msg == "supabase_cleanup_incomplete":
            logging.error("[SEC] account_delete_failed rinq=%s reason=supabase_cleanup", current_user.rinq_user_id)
            raise HTTPException(
                status_code=500,
                detail="Lokale Daten entfernt, Supabase-Cleanup unvollständig — Support prüfen.",
            )
        if msg == "stripe_cleanup_incomplete":
            logging.error("[SEC] account_delete_failed rinq=%s reason=stripe_cleanup", current_user.rinq_user_id)
            raise HTTPException(
                status_code=502,
                detail="Stripe-Cleanup fehlgeschlagen — Account nicht gelöscht. Bitte später erneut versuchen oder Support.",
            )
        logging.error("[SEC] account_delete_failed rinq=%s reason=%s", current_user.rinq_user_id, type(exc).__name__)
        raise HTTPException(status_code=500, detail="Account-Löschung fehlgeschlagen")
    except Exception:
        logging.exception("[SEC] account_delete_failed rinq=%s", current_user.rinq_user_id)
        raise HTTPException(status_code=500, detail="Account-Löschung fehlgeschlagen")

    logging.warning("[SEC] account_delete_completed rinq=%s", current_user.rinq_user_id)
    return {"ok": True, "deleted": summary}


@app.patch("/api/me/profile")
async def patch_my_profile(payload: ProfileUpdatePayload, current_user: AuthContext = Depends(get_current_user)):
    profile = _load_user_profile(current_user)
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

    if "displayName" in data and data["displayName"] is not None:
        name = _validate_display_name(str(data["displayName"]))
        profile["displayName"] = name
        profile["displayNameChosen"] = True

    if "avatar" in data and data["avatar"] is not None:
        avatar = data["avatar"]
        if not isinstance(avatar, dict) or avatar.get("type") not in ("catalog", "upload"):
            raise HTTPException(status_code=400, detail="Ungültige Avatar-Auswahl.")
        if avatar.get("type") == "catalog" and not avatar.get("avatarId"):
            raise HTTPException(status_code=400, detail="Avatar-ID fehlt.")
        if avatar.get("type") == "upload" and not avatar.get("uploadUrl"):
            raise HTTPException(status_code=400, detail="Upload-URL fehlt.")
        profile["avatar"] = {
            "type": avatar["type"],
            **({"avatarId": avatar.get("avatarId")} if avatar.get("type") == "catalog" else {}),
            **({"uploadUrl": avatar.get("uploadUrl")} if avatar.get("type") == "upload" else {}),
        }

    if "bannerId" in data:
        profile["bannerId"] = data["bannerId"]

    if "frameId" in data:
        frame_id = data["frameId"]
        if frame_id is not None:
            frame_id = str(frame_id).strip()
            if not frame_id:
                frame_id = None
        profile["frameId"] = frame_id

    if "emblem" in data:
        emblem = data["emblem"]
        if emblem is None:
            profile["emblem"] = None
        else:
            if not isinstance(emblem, dict) or emblem.get("type") not in ("catalog", "custom"):
                raise HTTPException(status_code=400, detail="Ungültige Emblem-Auswahl.")
            if emblem.get("type") == "catalog" and not emblem.get("emblemId"):
                raise HTTPException(status_code=400, detail="Emblem-ID fehlt.")
            if emblem.get("type") == "custom" and not emblem.get("customEmblemId"):
                raise HTTPException(status_code=400, detail="Custom-Emblem-ID fehlt.")
            profile["emblem"] = emblem

    if "customEmblemId" in data:
        profile["customEmblemId"] = data["customEmblemId"]

    if "customEmblems" in data and data["customEmblems"] is not None:
        if not isinstance(data["customEmblems"], list):
            raise HTTPException(status_code=400, detail="customEmblems muss eine Liste sein.")
        # Persist structure for a future editor; no runtime rendering required yet.
        profile["customEmblems"] = data["customEmblems"]

    if "profileTitle" in data:
        profile["profileTitle"] = data["profileTitle"]

    if "jerseyNumber" in data:
        jersey = data["jerseyNumber"]
        if jersey is None:
            profile["jerseyNumber"] = None
        else:
            try:
                jersey_int = int(jersey)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Jersey-Nummer ungültig.")
            if jersey_int < 0 or jersey_int > 99:
                raise HTTPException(status_code=400, detail="Jersey-Nummer muss zwischen 00 und 99 liegen.")
            profile["jerseyNumber"] = jersey_int

    if "favoriteLeague" in data:
        profile["favoriteLeague"] = (str(data["favoriteLeague"]).strip() or None) if data["favoriteLeague"] is not None else None
    if "favoriteTeamName" in data:
        profile["favoriteTeamName"] = (str(data["favoriteTeamName"]).strip() or None) if data["favoriteTeamName"] is not None else None

    if "profileTagline" in data:
        tagline = data["profileTagline"]
        if tagline is None:
            profile["profileTagline"] = None
        else:
            text = str(tagline).strip()
            if len(text) > 120:
                raise HTTPException(status_code=400, detail="Tagline ist zu lang (max. 120 Zeichen).")
            profile["profileTagline"] = text or None

    if "stickerIds" in data:
        raw_stickers = data["stickerIds"]
        if raw_stickers is None:
            profile["stickerIds"] = []
        elif not isinstance(raw_stickers, list):
            raise HTTPException(status_code=400, detail="stickerIds muss eine Liste sein.")
        else:
            cleaned = []
            for item in raw_stickers:
                value = str(item or "").strip()
                if value and value not in cleaned:
                    cleaned.append(value)
            profile["stickerIds"] = cleaned[:3]

    if "academyHelpLevel" in data and data["academyHelpLevel"] is not None:
        if data["academyHelpLevel"] not in ("discover", "guided", "learning"):
            raise HTTPException(status_code=400, detail="Ungültige Hilfestufe.")
        profile["academyHelpLevel"] = data["academyHelpLevel"]

    if "terminologyMode" in data and data["terminologyMode"] is not None:
        if data["terminologyMode"] not in ("direct", "explained"):
            raise HTTPException(status_code=400, detail="Ungültiger Fachbegriff-Modus.")
        profile["terminologyMode"] = data["terminologyMode"]

    if "preferredAttackDirection" in data and data["preferredAttackDirection"] is not None:
        if data["preferredAttackDirection"] not in ("left", "right", "auto"):
            raise HTTPException(status_code=400, detail="Ungültige Rink-Ausrichtung.")
        profile["preferredAttackDirection"] = data["preferredAttackDirection"]

    if "hockeyExperience" in data:
        exp = data["hockeyExperience"]
        if exp is None:
            profile["hockeyExperience"] = None
        elif exp not in ("beginner", "familiar", "advanced"):
            raise HTTPException(status_code=400, detail="Ungültiges Hockey-Erfahrungslevel.")
        else:
            profile["hockeyExperience"] = exp

    if "experiencePromptDismissed" in data and data["experiencePromptDismissed"] is not None:
        profile["experiencePromptDismissed"] = bool(data["experiencePromptDismissed"])

    if "dashboardPreferences" in data and data["dashboardPreferences"] is not None:
        if not isinstance(data["dashboardPreferences"], dict):
            raise HTTPException(status_code=400, detail="dashboardPreferences muss ein Objekt sein.")
        profile["dashboardPreferences"] = data["dashboardPreferences"]

    enforce_max_text_length(profile.get("displayName"), "profile.displayName")
    enforce_max_text_length(profile.get("profileTagline"), "profile.profileTagline")
    return _save_user_profile(current_user, profile)


class AvatarUploadPayload(BaseModel):
    filename: Optional[str] = None
    content_type: str
    data_base64: str


@app.post("/api/me/avatar")
async def upload_my_avatar(
    payload: AvatarUploadPayload,
    current_user: AuthContext = Depends(get_current_user),
):
    content_type = (payload.content_type or "").split(";")[0].strip().lower()
    extension = ALLOWED_AVATAR_CONTENT_TYPES.get(content_type)
    if not extension:
        raise HTTPException(status_code=400, detail="Nur JPEG, PNG, WebP oder GIF sind erlaubt.")

    import base64
    raw_b64 = (payload.data_base64 or "").strip()
    if "," in raw_b64 and raw_b64.lower().startswith("data:"):
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        raw = base64.b64decode(raw_b64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültige Bilddaten.")

    if not raw:
        raise HTTPException(status_code=400, detail="Leere Datei.")
    if len(raw) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Datei ist zu groß (max. 2 MB).")

    user_key = _normalize_user_key(current_user)
    filename = f"{user_key}_{uuid4().hex[:8]}{extension}"
    destination = os.path.join(AVATAR_UPLOADS_DIR, filename)
    with open(destination, "wb") as handle:
        handle.write(raw)

    upload_url = f"/uploads/avatars/{filename}"
    profile = _load_user_profile(current_user)
    profile["avatar"] = {"type": "upload", "uploadUrl": upload_url}
    saved = _save_user_profile(current_user, profile)
    return {"uploadUrl": upload_url, "profile": saved}


# Serve uploaded avatars (account assets; filename includes random suffix).
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.on_event("startup")
def _storage_startup_log() -> None:
    from db.settings import storage_backend

    logging.info("[storage] backend=%s", storage_backend())


@app.on_event("startup")
def _identity_startup_ensure() -> None:
    """Ensure legacy users have identity rows. Full file migration: `python -m identity.migrate_cli`."""
    if os.environ.get("ACADEMY_SKIP_IDENTITY_MIGRATION") == "1":
        return
    try:
        from identity.migrate import ensure_identities_for_users

        mapping = ensure_identities_for_users(_identity_repo(), USERS_FILE)
        logging.info("[identity] ensure_identities users=%s", len(mapping))
    except Exception:
        logging.exception("[identity] startup ensure failed")


@app.on_event("shutdown")
def _postgres_shutdown() -> None:
    try:
        from db.settings import storage_backend

        if storage_backend() != "postgres":
            return
        from db.pool import close_pool

        close_pool()
    except Exception:
        logging.exception("[db] shutdown pool close failed")


if __name__ == "__main__":
    import uvicorn
    # Bind loopback only — Nginx proxies from the public internet.
    uvicorn.run(app, host="127.0.0.1", port=8000)