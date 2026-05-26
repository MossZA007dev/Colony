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


class WaitlistSignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: str = Field(min_length=1, max_length=80)
    task: str = Field(min_length=1, max_length=1200)
    willing_to_test: bool


class WaitlistSignupResponse(BaseModel):
    id: str
    email: EmailStr
    count: int
    already_joined: bool = False


class WaitlistCountResponse(BaseModel):
    count: int
