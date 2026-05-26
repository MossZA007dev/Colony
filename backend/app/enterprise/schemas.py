from pydantic import BaseModel, Field


class IntakeRequest(BaseModel):
    business_idea: str = Field(min_length=3, max_length=600)
    target_customer: str = Field(min_length=3, max_length=400)
    first_objective: str = Field(min_length=3, max_length=400)
    user_id: str = "anonymous"


class AgentTemplate(BaseModel):
    name: str
    role: str
    dept: str
    first_task: str


class IntakeResponse(BaseModel):
    project_id: str
    project_title: str
    business_type: str
    team_rationale: str
    agents: list[AgentTemplate]
    source: str  # "openrouter" | "fallback"
