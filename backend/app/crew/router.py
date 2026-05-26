from fastapi import APIRouter

from ..config import get_settings
from .runner import run_crew, run_crew_fallback
from .schemas import CrewRunRequest, CrewRunResponse

router = APIRouter(prefix="/crew", tags=["crew"])


@router.post("/run", response_model=CrewRunResponse)
async def run_endpoint(payload: CrewRunRequest) -> CrewRunResponse:
    settings = get_settings()
    use_live = not settings.ai_ant_mock_mode and bool(settings.openrouter_api_key)
    if use_live:
        return await run_crew(payload)
    return run_crew_fallback(payload)
