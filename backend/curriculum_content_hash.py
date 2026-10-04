"""Deterministic Curriculum content identity (Tank-S3).

Hashes the merged Curriculum document (main curriculum.json + foundation tracks)
with canonical JSON serialization. Same content → same marker across restarts.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Tuple


CONTENT_HASH_ALGORITHM = "sha256"


def canonicalize_curriculum_payload(curriculum: Dict[str, Any]) -> bytes:
    """Stable UTF-8 bytes for hashing.

    - sort_keys=True so object key order does not affect the marker
    - separators compact + ensure_ascii=False so Unicode is stable as UTF-8
    """
    return json.dumps(
        curriculum,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def hash_curriculum_payload(curriculum: Dict[str, Any]) -> Tuple[str, str]:
    """Return (content_hash, algorithm).

    content_hash format: ``sha256:<hex>``
    """
    digest = hashlib.sha256(canonicalize_curriculum_payload(curriculum)).hexdigest()
    return f"{CONTENT_HASH_ALGORITHM}:{digest}", CONTENT_HASH_ALGORITHM


def curriculum_hash_metadata(curriculum: Dict[str, Any]) -> Dict[str, str]:
    content_hash, algorithm = hash_curriculum_payload(curriculum)
    return {
        "contentHash": content_hash,
        "contentHashAlgorithm": algorithm,
        "contentHashScope": "merged_curriculum",  # tracks (+ foundation merge)
    }
