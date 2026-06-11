from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Protocol


@dataclass
class ExternalPlayerRef:
    provider: str
    external_id: str
    url: str | None = None


class ObservationProviderClient(Protocol):
    provider_name: str

    async def fetch_player_profile(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        ...

    async def fetch_player_stats(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        ...

    async def refresh_player(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        ...


class SummaryGenerator(Protocol):
    async def generate_summary(self, player_payload: Dict[str, Any]) -> Dict[str, Any]:
        ...


class NotImplementedProviderClient:
    provider_name = "not_implemented"

    async def fetch_player_profile(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        return {
            "status": "not_implemented",
            "provider": self.provider_name,
            "external_ref": external_ref.__dict__,
        }

    async def fetch_player_stats(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        return {
            "status": "not_implemented",
            "provider": self.provider_name,
            "external_ref": external_ref.__dict__,
        }

    async def refresh_player(self, external_ref: ExternalPlayerRef) -> Dict[str, Any]:
        return {
            "status": "not_implemented",
            "provider": self.provider_name,
            "external_ref": external_ref.__dict__,
        }


class NotImplementedSummaryGenerator:
    async def generate_summary(self, player_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "not_implemented",
            "payload_preview": {
                "player_id": player_payload.get("player_id"),
                "observation_count": player_payload.get("observation_count"),
            },
        }
