import json
import urllib.error
import urllib.request
from dataclasses import dataclass

from ..config import Settings


@dataclass(frozen=True)
class ProviderResult:
    text: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class ProviderError(RuntimeError):
    pass


def generate_openai_reply(*, settings: Settings, message: str, intent: str, model_hint: str) -> ProviderResult:
    if not settings.openai_api_key:
        raise ProviderError("OPENAI_API_KEY is not configured.")

    model = _openai_model_for_route(settings, model_hint)
    payload = {
        "model": model,
        "instructions": (
            "You are AI Ant inside Colony. Reply helpfully and concisely. "
            "If the request involves external sending, publishing, deleting, payments, or irreversible changes, "
            "explain that approval is required and do not claim the action was executed."
        ),
        "input": f"Intent: {intent}\nUser request: {message}",
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.openai_timeout_seconds) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ProviderError(f"OpenAI request failed: {exc.code} {detail}") from exc
    except OSError as exc:
        raise ProviderError(f"OpenAI request failed: {exc}") from exc

    text = _extract_response_text(data)
    usage = data.get("usage") if isinstance(data.get("usage"), dict) else {}
    return ProviderResult(
        text=text or "I could not generate a response from the configured OpenAI model.",
        model=model,
        input_tokens=_int_or_none(usage.get("input_tokens")),
        output_tokens=_int_or_none(usage.get("output_tokens")),
    )


def _openai_model_for_route(settings: Settings, model_hint: str) -> str:
    return settings.openai_default_model


def _extract_response_text(data: dict) -> str:
    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks: list[str] = []
    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "\n".join(chunks).strip()


def _int_or_none(value: object) -> int | None:
    return value if isinstance(value, int) else None
