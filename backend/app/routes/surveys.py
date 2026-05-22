from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter

from ..config import get_settings
from ..json_store import JsonStore
from ..schemas import SurveyListResponse, SurveySubmission, SurveySubmissionRequest

router = APIRouter(prefix="/surveys", tags=["surveys"])


def survey_store() -> JsonStore:
    return JsonStore(get_settings().data_dir / "surveys.json", {"submissions": []})


@router.post("", response_model=SurveySubmission)
def create_survey_submission(payload: SurveySubmissionRequest) -> SurveySubmission:
    store = survey_store()
    data = store.read()
    existing = next(
        (
            item for item in data.get("submissions", [])
            if item.get("user_id") == payload.user_id
        ),
        None,
    )
    if existing:
        return SurveySubmission(**existing)

    submission = SurveySubmission(
        id=f"survey_{uuid4().hex}",
        user_id=payload.user_id,
        answers=payload.answers,
        created_at=datetime.now(timezone.utc),
    )
    data["submissions"] = [submission.model_dump(mode="json"), *data.get("submissions", [])]
    store.write(data)
    return submission


@router.get("", response_model=SurveyListResponse)
def list_survey_submissions() -> SurveyListResponse:
    return SurveyListResponse(submissions=survey_store().read().get("submissions", []))


@router.get("/users/{user_id}/status")
def survey_submission_status(user_id: str) -> dict[str, bool]:
    submissions = survey_store().read().get("submissions", [])
    return {"submitted": any(item.get("user_id") == user_id for item in submissions)}
