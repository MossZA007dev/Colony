from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


AiAntIntent = Literal[
    "chat",
    "answer_question",
    "summarize_project",
    "create_project",
    "create_agent_team",
    "create_workflow",
    "edit_workflow",
    "generate_deliverable",
    "analyze_file",
    "search_knowledge",
    "run_workflow",
    "external_action",
    "billing_question",
    "unknown",
]

AiAntStatus = Literal["completed", "approval_required", "draft_created"]
AiAntActionType = Literal[
    "create_project_draft",
    "create_agent_team_draft",
    "create_workflow_draft",
    "generate_deliverable_draft",
    "request_approval",
]


class AiAntMessageRequest(BaseModel):
    conversation_id: str | None = None
    project_id: str | None = None
    user_id: str = Field(default="anonymous", min_length=1)
    message: str = Field(min_length=1, max_length=8000)
    mode: str = "normal"
    context: dict[str, Any] = Field(default_factory=dict)


class AiAntAction(BaseModel):
    type: AiAntActionType
    requires_approval: bool
    payload: dict[str, Any] = Field(default_factory=dict)


class AiAntArtifact(BaseModel):
    type: str
    id: str
    title: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AiAntUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float


class AiAntMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str
    intent: AiAntIntent
    status: AiAntStatus
    model: str
    confidence: float
    actions: list[AiAntAction] = Field(default_factory=list)
    artifacts: list[AiAntArtifact] = Field(default_factory=list)
    approval_required: bool = False
    usage: AiAntUsage
    plan_id: str | None = None
    plan_name: str | None = None
    route_source: str | None = None
    created_at: datetime
