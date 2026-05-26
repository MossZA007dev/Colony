from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel

Service = Literal["gmail", "drive"]
RiskLevel = Literal["low", "medium", "high"]
RequestStatus = Literal["pending", "approved", "rejected", "executed", "failed"]

class BridgeConnection(BaseModel):
    user_id: str
    service: Service
    connected_at: datetime
    scopes: list[str]
    email: str | None = None

class BridgeRequest(BaseModel):
    id: str
    user_id: str
    service: Service
    action: str
    params: dict[str, Any]
    risk: RiskLevel
    reason: str
    requesting_agent_id: str | None = None
    status: RequestStatus
    created_at: datetime
    decided_at: datetime | None = None
    executed_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
    source: Literal["live", "mock"] = "live"
