import json
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials

from .config import get_settings


class FirebaseNotConfigured(RuntimeError):
    pass


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    settings = get_settings()
    if firebase_admin._apps:
        return firebase_admin.get_app()

    if settings.firebase_service_account_json:
        cert = credentials.Certificate(json.loads(settings.firebase_service_account_json))
    elif settings.firebase_service_account_file:
        cert = credentials.Certificate(settings.firebase_service_account_file)
    else:
        raise FirebaseNotConfigured(
            "Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_FILE."
        )

    options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
    return firebase_admin.initialize_app(cert, options)


def create_email_user(email: str, password: str) -> auth.UserRecord:
    get_firebase_app()
    return auth.create_user(email=email, password=password, email_verified=False)


def build_email_verification_link(email: str) -> str:
    settings = get_settings()
    get_firebase_app()
    action_code_settings = auth.ActionCodeSettings(url=settings.firebase_continue_url)
    return auth.generate_email_verification_link(email, action_code_settings)


def get_user_by_email(email: str) -> auth.UserRecord:
    get_firebase_app()
    return auth.get_user_by_email(email)
