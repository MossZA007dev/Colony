from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..json_store import JsonStore
from ..schemas import WaitlistCountResponse, WaitlistSignupRequest, WaitlistSignupResponse

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


def waitlist_store() -> JsonStore:
    return JsonStore(get_settings().data_dir / "waitlist.json", {"entries": []})


@router.get("/count", response_model=WaitlistCountResponse)
def get_waitlist_count() -> WaitlistCountResponse:
    entries = waitlist_store().read().get("entries", [])
    return WaitlistCountResponse(count=len(entries))


@router.post("", response_model=WaitlistSignupResponse)
def create_waitlist_signup(payload: WaitlistSignupRequest) -> WaitlistSignupResponse:
    if not payload.willing_to_test:
        raise HTTPException(status_code=400, detail="Please confirm willingness to test the early prototype.")

    store = waitlist_store()
    data = store.read()
    entries = data.get("entries", [])
    clean_email = payload.email.lower()
    existing = next((item for item in entries if item.get("email", "").lower() == clean_email), None)

    if existing:
        return WaitlistSignupResponse(
            id=existing["id"],
            email=existing["email"],
            count=len(entries),
            already_joined=True,
        )

    entry = {
        "id": f"waitlist_{uuid4().hex}",
        "name": payload.name.strip(),
        "email": clean_email,
        "role": payload.role.strip(),
        "task": payload.task.strip(),
        "willing_to_test": payload.willing_to_test,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    data["entries"] = [entry, *entries]
    store.write(data)
    return WaitlistSignupResponse(
        id=entry["id"],
        email=entry["email"],
        count=len(data["entries"]),
        already_joined=False,
    )
