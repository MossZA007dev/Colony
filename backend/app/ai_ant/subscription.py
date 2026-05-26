from dataclasses import dataclass

from ..config import get_settings
from ..json_store import JsonStore
from .schemas import AiAntIntent


@dataclass(frozen=True)
class Plan:
    id: str
    name: str
    allowed_intents: set[AiAntIntent]
    allowed_models: set[str]
    monthly_token_limit: int
    monthly_cost_limit_usd: float
    auto_approval_threshold_usd: float


CHAT_INTENTS: set[AiAntIntent] = {
    "chat",
    "answer_question",
    "billing_question",
    "search_knowledge",
    "summarize_project",
}

WORKSPACE_INTENTS: set[AiAntIntent] = {
    "create_project",
    "create_agent_team",
    "create_workflow",
    "edit_workflow",
    "generate_deliverable",
    "analyze_file",
}

ACTION_INTENTS: set[AiAntIntent] = {
    "run_workflow",
    "external_action",
}

PLANS: dict[str, Plan] = {
    "free": Plan(
        id="free",
        name="Free",
        allowed_intents=CHAT_INTENTS,
        allowed_models={"colony-fast-reply", "colony-mock-router-v1"},
        monthly_token_limit=20_000,
        monthly_cost_limit_usd=0.50,
        auto_approval_threshold_usd=0.01,
    ),
    "pro": Plan(
        id="pro",
        name="Pro",
        allowed_intents=CHAT_INTENTS | WORKSPACE_INTENTS,
        allowed_models={
            "colony-fast-reply",
            "colony-mock-router-v1",
            "colony-planner-router",
            "colony-work-product-router",
        },
        monthly_token_limit=250_000,
        monthly_cost_limit_usd=10.00,
        auto_approval_threshold_usd=0.03,
    ),
    "max": Plan(
        id="max",
        name="Max",
        allowed_intents=CHAT_INTENTS | WORKSPACE_INTENTS | ACTION_INTENTS,
        allowed_models={
            "colony-fast-reply",
            "colony-mock-router-v1",
            "colony-planner-router",
            "colony-work-product-router",
            "colony-safe-action-router",
        },
        # $79/mo Max plan — truly unlimited, no quotas, no caps
        monthly_token_limit=10_000_000_000,
        monthly_cost_limit_usd=1_000_000.00,
        auto_approval_threshold_usd=1_000.00,
    ),
}


def _store() -> JsonStore:
    return JsonStore(get_settings().data_dir / "ai_ant_subscriptions.json", {"subscriptions": []})


def get_user_plan(user_id: str) -> Plan:
    subscriptions = _store().read().get("subscriptions", [])
    subscription = next((item for item in subscriptions if item.get("user_id") == user_id), None)
    plan_id = str(subscription.get("plan_id", "free")) if subscription else "free"
    return PLANS.get(plan_id, PLANS["free"])


def plan_allows_intent(plan: Plan, intent: AiAntIntent) -> bool:
    return intent in plan.allowed_intents


def plan_allows_model(plan: Plan, model: str) -> bool:
    return model in plan.allowed_models
