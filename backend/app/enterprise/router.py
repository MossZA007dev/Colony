from fastapi import APIRouter

from .intake import process_intake
from .schemas import IntakeRequest, IntakeResponse

router = APIRouter(prefix="/enterprise", tags=["enterprise"])


@router.post("/intake", response_model=IntakeResponse)
def run_boss_intake(payload: IntakeRequest) -> IntakeResponse:
    """
    Boss Intake — accepts 3 business context answers and returns a
    dynamically generated AI team composition.
    """
    return process_intake(payload)
