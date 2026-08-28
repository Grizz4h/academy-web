"""Evidence map catalog derived from frozen drill profiles."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

from .models import CompetencyId, DrillCompetencyProfile


@dataclass(frozen=True)
class EvidenceMapEntry:
    drill_id: str
    track: str
    letter: str
    competency_id: str
    evidence_weight: float
    evidence_level: int
    max_strength: float


@dataclass
class EvidenceMapCatalog:
    """Per-competency available evidence sources from enabled drill profiles."""

    entries: Dict[Tuple[str, str], EvidenceMapEntry]
    drills: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    tracks: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    letters: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))

    @classmethod
    def from_profiles(cls, profiles: List[DrillCompetencyProfile]) -> "EvidenceMapCatalog":
        catalog = cls(entries={})
        for profile in profiles:
            if not profile.evidence.enabled:
                continue
            drill_id = profile.drillId
            track = drill_id.split("_")[0]
            letter = drill_id[0]
            level = int(profile.evidence.level)
            max_strength = float(profile.evidence.maxStrength)
            for comp_key, weight in profile.evidence.weights.items():
                if weight <= 0:
                    continue
                competency_id = str(comp_key)
                catalog.entries[(drill_id, competency_id)] = EvidenceMapEntry(
                    drill_id=drill_id,
                    track=track,
                    letter=letter,
                    competency_id=competency_id,
                    evidence_weight=float(weight),
                    evidence_level=level,
                    max_strength=max_strength,
                )
                catalog.drills[competency_id].add(drill_id)
                catalog.tracks[competency_id].add(track)
                catalog.letters[competency_id].add(letter)
        return catalog

    def get(self, drill_id: str, competency_id: str) -> Optional[EvidenceMapEntry]:
        return self.entries.get((drill_id, str(competency_id)))

    def is_e4_training_only(self, drill_id: str) -> bool:
        return drill_id.upper().startswith("E4_")
