from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from .schemas import BridgeConnection, BridgeRequest
from .store import load_connections, save_connections, load_requests
from .permissions import create_request, approve_request, reject_request, execute_request
from .oauth import get_oauth_flow, is_mock_oauth

router = APIRouter(prefix="/bridge", tags=["bridge"])

@router.get("/oauth/google/start")
def start_google_oauth(user_id: str = "anonymous"):
    flow = get_oauth_flow()
    if not flow:
        # Mock mode, simulate redirecting back immediately
        return RedirectResponse(url=f"/bridge/oauth/google/callback?mock=true&state={user_id}")
    
    auth_url, state = flow.authorization_url(prompt='consent', access_type='offline')
    # Use state to carry user_id around temporarily (or use session)
    return RedirectResponse(url=auth_url)

@router.get("/oauth/google/callback")
def google_oauth_callback(request: Request):
    user_id = request.query_params.get("state", "anonymous")
    if request.query_params.get("mock") == "true" or is_mock_oauth():
        _record_connection(user_id, "gmail", ["mock_gmail_scope"])
        _record_connection(user_id, "drive", ["mock_drive_scope"])
        return {"status": "mock_connected", "message": "Close this window and return to Colony."}

    # Handle live OAuth callback
    flow = get_oauth_flow()
    flow.fetch_token(authorization_response=str(request.url))
    creds = flow.credentials
    
    from .store import load_tokens, save_tokens
    tokens = load_tokens()
    if user_id not in tokens:
        tokens[user_id] = {}
        
    tokens[user_id]["gmail"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes
    }
    tokens[user_id]["drive"] = tokens[user_id]["gmail"]  # simplify for now
    save_tokens(tokens)
    
    _record_connection(user_id, "gmail", creds.scopes)
    _record_connection(user_id, "drive", creds.scopes)
    
    return {"status": "connected", "message": "Connected. Close this window and return to Colony."}

def _record_connection(user_id: str, service: str, scopes: list[str]):
    connections = load_connections()
    user_conns = connections.get(user_id, [])
    # Remove existing for service
    user_conns = [c for c in user_conns if c.get("service") != service]
    
    conn = BridgeConnection(
        user_id=user_id,
        service=service,
        connected_at=datetime.now(timezone.utc),
        scopes=scopes,
        email=f"mock_{user_id}@example.com" if is_mock_oauth() else "live_user@gmail.com"
    )
    user_conns.append(conn.model_dump(mode='json'))
    connections[user_id] = user_conns
    save_connections(connections)

@router.get("/connections", response_model=list[BridgeConnection])
def list_connections(user_id: str = "anonymous"):
    connections = load_connections()
    return [BridgeConnection(**c) for c in connections.get(user_id, [])]

@router.delete("/connections/{service}")
def disconnect(service: str, user_id: str = "anonymous"):
    connections = load_connections()
    user_conns = connections.get(user_id, [])
    user_conns = [c for c in user_conns if c.get("service") != service]
    connections[user_id] = user_conns
    save_connections(connections)
    return {"status": "disconnected"}

@router.post("/requests", response_model=BridgeRequest)
def create_bridge_request(payload: dict):
    return create_request(payload)

@router.get("/requests", response_model=list[BridgeRequest])
def get_requests(user_id: str = "anonymous", status: Optional[str] = None):
    reqs = load_requests()
    user_reqs = reqs.get(user_id, [])
    if status:
        user_reqs = [r for r in user_reqs if r.get("status") == status]
    return [BridgeRequest(**r) for r in user_reqs]

@router.post("/requests/{req_id}/approve", response_model=BridgeRequest)
def approve_req(req_id: str, user_id: str = "anonymous"):
    return approve_request(user_id, req_id)

@router.post("/requests/{req_id}/reject", response_model=BridgeRequest)
def reject_req(req_id: str, user_id: str = "anonymous"):
    return reject_request(user_id, req_id)

@router.post("/requests/{req_id}/execute", response_model=BridgeRequest)
def execute_req(req_id: str, user_id: str = "anonymous"):
    return execute_request(user_id, req_id)
