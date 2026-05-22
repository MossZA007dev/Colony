from datetime import datetime, timezone
from typing import Any

from ..config import get_settings
from ..json_store import JsonStore


def _store() -> JsonStore:
    return JsonStore(get_settings().data_dir / "ai_ant_usage.json", {"records": []})


def current_usage_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def get_monthly_usage(user_id: str) -> dict[str, float | int]:
    month = current_usage_month()
    records = _store().read().get("records", [])
    matching = [
        item for item in records
        if item.get("user_id") == user_id and str(item.get("created_at", "")).startswith(month)
    ]
    return {
        "tokens": sum(int(item.get("tokens_in", 0)) + int(item.get("tokens_out", 0)) for item in matching),
        "cost_usd": round(sum(float(item.get("cost_usd", 0.0)) for item in matching), 6),
    }


def can_spend(
    *,
    current_usage: dict[str, float | int],
    estimated_tokens: int,
    estimated_cost_usd: float,
    monthly_token_limit: int,
    monthly_cost_limit_usd: float,
) -> bool:
    return (
        int(current_usage["tokens"]) + estimated_tokens <= monthly_token_limit
        and float(current_usage["cost_usd"]) + estimated_cost_usd <= monthly_cost_limit_usd
    )


def record_usage(
    *,
    user_id: str,
    conversation_id: str,
    message_id: str,
    model: str,
    intent: str,
    route_source: str,
    confidence: float,
    tokens_in: int,
    tokens_out: int,
    cost_usd: float,
    metadata: dict[str, Any] | None = None,
) -> None:
    store = _store()
    data = store.read()
    records = data.get("records", [])
    if any(item.get("message_id") == message_id for item in records):
        return
    records.insert(
        0,
        {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "model": model,
            "intent": intent,
            "route_source": route_source,
            "confidence": confidence,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "cost_usd": round(cost_usd, 6),
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    store.write({"records": records})
