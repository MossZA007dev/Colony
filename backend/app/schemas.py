from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignupResponse(BaseModel):
    uid: str
    email: EmailStr
    email_verified: bool
    verification_required: bool
    verification_method: str
    verification_link: str | None = None


class AuthErrorResponse(BaseModel):
    detail: str


class SurveySubmissionRequest(BaseModel):
    user_id: str = Field(min_length=1)
    answers: dict[str, Any]


class SurveySubmission(BaseModel):
    id: str
    user_id: str
    answers: dict[str, Any]
    created_at: datetime


class SurveyListResponse(BaseModel):
    submissions: list[SurveySubmission]
