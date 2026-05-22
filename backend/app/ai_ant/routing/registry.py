from dataclasses import dataclass

from ..schemas import AiAntIntent
from ..subscription import Plan, plan_allows_model


@dataclass(frozen=True)
class ModelRoute:
    model: str
    source: str
    estimated_cost_per_1k_tokens_usd: float


MODEL_RATES: dict[str, float] = {
    "colony-fast-reply": 0.0005,
    "colony-mock-router-v1": 0.0010,
    "colony-planner-router": 0.0020,
    "colony-work-product-router": 0.0025,
    "colony-safe-action-router": 0.0030,
}


def select_model(intent: AiAntIntent, requested_mode: str, default_model: str, plan: Plan) -> ModelRoute:
    preferred = _preferred_model(intent, requested_mode, default_model)
    if plan_allows_model(plan, preferred):
        return ModelRoute(model=preferred, source="manual" if requested_mode != "auto" else "rule", estimated_cost_per_1k_tokens_usd=MODEL_RATES.get(preferred, 0.0010))

    fallback = _first_allowed_model(plan, default_model)
    return ModelRoute(model=fallback, source="plan_fallback", estimated_cost_per_1k_tokens_usd=MODEL_RATES.get(fallback, 0.0010))


def estimate_cost_usd(route: ModelRoute, input_tokens: int, output_tokens: int) -> float:
    return ((input_tokens + output_tokens) / 1000) * route.estimated_cost_per_1k_tokens_usd


def _preferred_model(intent: AiAntIntent, requested_mode: str, default_model: str) -> str:
    if requested_mode in {"fast", "low_cost"}:
        return "colony-fast-reply"
    if requested_mode == "best_quality" and intent in {"chat", "answer_question", "summarize_project", "search_knowledge"}:
        return "colony-mock-router-v1"
    if intent in {"create_workflow", "create_agent_team", "create_project", "edit_workflow"}:
        return "colony-planner-router"
    if intent in {"external_action", "run_workflow"}:
        return "colony-safe-action-router"
    if intent in {"generate_deliverable", "analyze_file"}:
        return "colony-work-product-router"
    return default_model


def _first_allowed_model(plan: Plan, default_model: str) -> str:
    if default_model in plan.allowed_models:
        return default_model
    for model in ("colony-fast-reply", "colony-mock-router-v1"):
        if model in plan.allowed_models:
            return model
    return next(iter(plan.allowed_models))
