"""Central module → access tier mapping (manifest §9). No per-drill keys."""

from __future__ import annotations

from typing import FrozenSet, Optional

from .feature_keys import ACADEMY_PREMIUM

# Free per security manifest: Track 0 + A1
FREE_MODULE_IDS: FrozenSet[str] = frozenset({"T0", "A1"})

# Premium: A2+ (aligned with curriculum module ids; D4 deprecated/inactive excluded)
PREMIUM_MODULE_IDS: FrozenSet[str] = frozenset(
    {
        "A2",
        "A3",
        "B1",
        "B2",
        "B3",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
        "E1",
        "E2",
        "E3",
    }
)

ALL_KNOWN_MODULE_IDS: FrozenSet[str] = FREE_MODULE_IDS | PREMIUM_MODULE_IDS


def is_lab_learning_area(learning_area: Optional[str]) -> bool:
    return (learning_area or "").strip().lower() == "lab"


def resolve_academy_module_id(module_id: Optional[str]) -> str:
    """Map session/drill ids to academy module id (e.g. A2_D1 → A2)."""
    key = normalize_module_id(module_id)
    if not key:
        return key
    if key in ALL_KNOWN_MODULE_IDS:
        return key
    if "_" in key:
        prefix = key.split("_", 1)[0]
        if prefix in ALL_KNOWN_MODULE_IDS:
            return prefix
    return key


def normalize_module_id(raw: Optional[str]) -> str:
    return (raw or "").strip().upper()


def module_requires_premium(module_id: Optional[str]) -> bool:
    key = resolve_academy_module_id(module_id)
    if not key:
        return True
    if key in FREE_MODULE_IDS:
        return False
    if key in PREMIUM_MODULE_IDS:
        return True
    # Unknown modules: deny premium bypass (safe default until catalogued)
    return True


def required_feature_for_module(
    module_id: Optional[str],
    *,
    learning_area: Optional[str] = None,
) -> Optional[str]:
    """None = free module; otherwise feature_key required."""
    if is_lab_learning_area(learning_area):
        return None
    if not module_requires_premium(module_id):
        return None
    return ACADEMY_PREMIUM
