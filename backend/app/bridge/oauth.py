import os
from typing import Optional

def is_mock_oauth() -> bool:
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    return not (client_id and client_secret)

def get_oauth_flow():
    if is_mock_oauth():
        return None
    
    import google_auth_oauthlib.flow
    client_config = {
        "web": {
            "client_id": os.environ.get("GOOGLE_OAUTH_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    scopes = [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.compose",
        "openid",
        "https://www.googleapis.com/auth/userinfo.email"
    ]
    
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config,
        scopes=scopes,
        redirect_uri=os.environ.get("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8000/bridge/oauth/google/callback")
    )
    return flow

def get_user_credentials(user_id: str, service: str):
    from .store import load_tokens
    import google.oauth2.credentials
    
    tokens = load_tokens()
    user_tokens = tokens.get(user_id, {})
    token_info = user_tokens.get(service)
    if not token_info:
        return None
    
    return google.oauth2.credentials.Credentials(
        token=token_info.get("token"),
        refresh_token=token_info.get("refresh_token"),
        token_uri=token_info.get("token_uri"),
        client_id=token_info.get("client_id"),
        client_secret=token_info.get("client_secret"),
        scopes=token_info.get("scopes")
    )
