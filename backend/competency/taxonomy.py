"""Load frozen competency taxonomy for API labels and ordering."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, TypedDict

from .validation import validate_taxonomy


class TaxonomyCompetency(TypedDict):
    id: str
    label: str


@lru_cache(maxsize=1)
def load_taxonomy_competencies() -> List[TaxonomyCompetency]:
    path = Path(__file__).resolve().parents[2] / "data/academy/competency/taxonomy.json"
    document = json.loads(path.read_text(encoding="utf-8"))
    validate_taxonomy(document)
    return [
        {"id": str(item["id"]), "label": str(item["label"])}
        for item in document.get("competencies", [])
    ]


def taxonomy_label_map() -> Dict[str, str]:
    return {item["id"]: item["label"] for item in load_taxonomy_competencies()}


def clear_taxonomy_cache() -> None:
    load_taxonomy_competencies.cache_clear()
