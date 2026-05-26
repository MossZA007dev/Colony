import json
from pathlib import Path

DATA_DIR = Path("backend/data")
TOKENS_FILE = DATA_DIR / "bridge_tokens.json"
REQUESTS_FILE = DATA_DIR / "bridge_requests.json"
CONNECTIONS_FILE = DATA_DIR / "bridge_connections.json"

def _ensure_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_tokens() -> dict[str, dict]:
    if not TOKENS_FILE.exists():
        return {}
    with open(TOKENS_FILE, "r") as f:
        return json.load(f)

def save_tokens(tokens: dict[str, dict]):
    _ensure_dir()
    with open(TOKENS_FILE, "w") as f:
        json.dump(tokens, f, indent=2)

def load_requests() -> dict[str, dict]:
    if not REQUESTS_FILE.exists():
        return {}
    with open(REQUESTS_FILE, "r") as f:
        return json.load(f)

def save_requests(requests: dict[str, dict]):
    _ensure_dir()
    with open(REQUESTS_FILE, "w") as f:
        json.dump(requests, f, indent=2)

def load_connections() -> dict[str, list[dict]]:
    if not CONNECTIONS_FILE.exists():
        return {}
    with open(CONNECTIONS_FILE, "r") as f:
        return json.load(f)

def save_connections(connections: dict[str, list[dict]]):
    _ensure_dir()
    with open(CONNECTIONS_FILE, "w") as f:
        json.dump(connections, f, indent=2)
