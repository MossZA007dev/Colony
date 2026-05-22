from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from ..config import get_settings
from ..json_store import JsonStore


def _store() -> JsonStore:
    return JsonStore(get_settings().data_dir / "ai_ant_conversations.json", {"conversations": []})


def create_conversation_id() -> str:
    return f"conv_{uuid4().hex}"


def create_message_id() -> str:
    return f"msg_{uuid4().hex}"


def append_exchange(
    *,
    conversation_id: str,
    user_id: str,
    project_id: str | None,
    user_message: str,
    assistant_response: dict[str, Any],
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    store = _store()
    data = store.read()
    conversations = data.get("conversations", [])
    existing = next((item for item in conversations if item.get("id") == conversation_id), None)
    if not existing:
        existing = {
            "id": conversation_id,
            "user_id": user_id,
            "project_id": project_id,
            "title": user_message[:64],
            "messages": [],
            "created_at": now,
            "updated_at": now,
        }
        conversations.insert(0, existing)

    existing["updated_at"] = now
    existing["messages"].extend(
        [
            {"role": "user", "content": user_message, "created_at": now},
            {"role": "assistant", "content": assistant_response.get("reply", ""), "metadata": assistant_response, "created_at": now},
        ]
    )
    store.write({"conversations": conversations})
