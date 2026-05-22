from .schemas import AiAntIntent


def route_model(intent: AiAntIntent, requested_mode: str, default_model: str) -> str:
    if requested_mode == "fast":
        return "colony-fast-reply"
    if intent in {"create_workflow", "create_agent_team", "create_project"}:
        return "colony-planner-router"
    if intent in {"external_action", "run_workflow"}:
        return "colony-safe-action-router"
    if intent in {"generate_deliverable", "analyze_file"}:
        return "colony-work-product-router"
    return default_model
