"""
AI provider — OpenRouter (primary, OpenAI-compatible chat completions).
OpenAI kept as legacy fallback only.
"""
import json
import ssl
import urllib.error
import urllib.request
from dataclasses import dataclass

from ..config import Settings

# macOS Python often lacks system CA certs. Try to use certifi's bundle if available.
try:
    import certifi
    _SSL_CONTEXT: ssl.SSLContext | None = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CONTEXT = None

OPENROUTER_BASE = "https://openrouter.ai/api/v1"

_SYSTEM_PROMPT = (
    "You are AI Ant inside Colony — an AI operating system for solopreneurs. "
    "Reply helpfully and concisely. Always reply in the same language the user writes in. "
    "If the request involves external sending, publishing, deleting, payments, or irreversible changes, "
    "explain that approval is required and do not claim the action was executed."
)


@dataclass(frozen=True)
class ProviderResult:
    text: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class ProviderError(RuntimeError):
    pass


# ── OpenRouter (primary) ──────────────────────────────────────────────────────

def generate_openrouter_reply(
    *, settings: Settings, message: str, intent: str, model_hint: str
) -> ProviderResult:
    if not settings.openrouter_api_key:
        raise ProviderError("OPENROUTER_API_KEY is not configured.")

    model = model_hint if "/" in model_hint else settings.openrouter_default_model
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"[Intent: {intent}]\n{message}"},
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    request = urllib.request.Request(
        f"{OPENROUTER_BASE}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://colony.app",
            "X-Title": "Colony AI Ant",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.openrouter_timeout_seconds, context=_SSL_CONTEXT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ProviderError(f"OpenRouter request failed: {exc.code} {detail}") from exc
    except OSError as exc:
        raise ProviderError(f"OpenRouter request failed: {exc}") from exc

    try:
        text = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise ProviderError(f"Unexpected OpenRouter response shape: {exc}") from exc

    usage = data.get("usage") or {}
    return ProviderResult(
        text=text or "I could not generate a response.",
        model=data.get("model", model),
        input_tokens=_int_or_none(usage.get("prompt_tokens")),
        output_tokens=_int_or_none(usage.get("completion_tokens")),
    )


# ── Legacy OpenAI fallback (kept for reference, not used by default) ──────────

def generate_openai_reply(
    *, settings: Settings, message: str, intent: str, model_hint: str
) -> ProviderResult:
    """Legacy OpenAI Responses API — only used if OPENROUTER_API_KEY is absent."""
    if not settings.openai_api_key:
        raise ProviderError("OPENAI_API_KEY is not configured.")

    model = settings.openai_default_model
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"[Intent: {intent}]\n{message}"},
        ],
        "max_tokens": 1024,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.openai_timeout_seconds, context=_SSL_CONTEXT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ProviderError(f"OpenAI request failed: {exc.code} {detail}") from exc
    except OSError as exc:
        raise ProviderError(f"OpenAI request failed: {exc}") from exc

    try:
        text = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise ProviderError(f"Unexpected OpenAI response shape: {exc}") from exc

    usage = data.get("usage") or {}
    return ProviderResult(
        text=text or "I could not generate a response.",
        model=model,
        input_tokens=_int_or_none(usage.get("prompt_tokens")),
        output_tokens=_int_or_none(usage.get("completion_tokens")),
    )


def _int_or_none(value: object) -> int | None:
    return value if isinstance(value, int) else None
