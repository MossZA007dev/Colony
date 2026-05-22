from fastapi import APIRouter, HTTPException, status
from firebase_admin import auth

from ..config import get_settings
from ..firebase import FirebaseNotConfigured, build_email_verification_link, create_email_user, get_user_by_email
from ..schemas import SignupRequest, SignupResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=SignupResponse,
    responses={409: {"description": "Email already exists"}, 503: {"description": "Firebase is not configured"}},
)
def signup(payload: SignupRequest) -> SignupResponse:
    """
    Create a Firebase email/password user and generate Firebase's email verification link.

    Firebase verifies real inbox ownership through an action link. It does not provide a native
    6-digit email verification code from the Admin SDK.
    """
    settings = get_settings()
    email = payload.email.lower()
    try:
        user = create_email_user(email=email, password=payload.password)
        verification_link = build_email_verification_link(email)
    except FirebaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except auth.EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.") from exc
    except auth.FirebaseError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return SignupResponse(
        uid=user.uid,
        email=user.email,
        email_verified=bool(user.email_verified),
        verification_required=True,
        verification_method="firebase_email_link",
        verification_link=verification_link if settings.auth_return_verification_link else None,
    )


@router.get("/email-status/{email}")
def email_status(email: str) -> dict[str, bool | str]:
    try:
        user = get_user_by_email(email.lower())
    except FirebaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except auth.UserNotFoundError:
        return {"exists": False, "email_verified": False}
    return {"exists": True, "email_verified": bool(user.email_verified), "uid": user.uid}
