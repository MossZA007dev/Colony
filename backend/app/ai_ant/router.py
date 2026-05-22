from fastapi import APIRouter

from .orchestrator import handle_ai_ant_message
from .schemas import AiAntMessageRequest, AiAntMessageResponse

router = APIRouter(prefix="/ai-ant", tags=["ai-ant"])


@router.post("/messages", response_model=AiAntMessageResponse)
def create_ai_ant_message(payload: AiAntMessageRequest) -> AiAntMessageResponse:
    return handle_ai_ant_message(payload)
