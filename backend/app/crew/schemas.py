from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

AgentKind = Literal["research", "analyst", "writer", "reviewer"]

class CrewRunRequest(BaseModel):
    user_id: str = "anonymous"
    task: str = Field(min_length=5, max_length=2000)
    preferred_format: Literal["markdown", "brief", "report"] = "markdown"
    max_research_agents: int = 3

class CrewAgent(BaseModel):
    id: str
    kind: AgentKind
    name: str
    focus: str

class CrewActivity(BaseModel):
    agent_id: str
    step: str
    output_excerpt: str
    timestamp: datetime

class CrewDeliverable(BaseModel):
    title: str
    content_md: str
    word_count: int
    sources_cited: int

class CrewRunResponse(BaseModel):
    crew_id: str
    task: str
    agents: list[CrewAgent]
    activity: list[CrewActivity]
    deliverable: CrewDeliverable
    duration_seconds: float
    model_calls: int
    source: Literal["live", "mock"]
