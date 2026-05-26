from datetime import datetime, timezone
from uuid import uuid4
from .schemas import BridgeRequest
from .store import load_requests, save_requests
from .oauth import is_mock_oauth

def create_request(payload: dict) -> BridgeRequest:
    reqs = load_requests()
    req_id = f"req-{uuid4().hex[:12]}"
    new_req = BridgeRequest(
        id=req_id,
        user_id=payload.get("user_id", "anonymous"),
        service=payload.get("service"),
        action=payload.get("action"),
        params=payload.get("params", {}),
        risk=payload.get("risk", "medium"),
        reason=payload.get("reason", "Requested by agent"),
        requesting_agent_id=payload.get("requesting_agent_id"),
        status="pending",
        created_at=datetime.now(timezone.utc),
        source="mock" if is_mock_oauth() else "live"
    )
    user_reqs = reqs.get(new_req.user_id, [])
    user_reqs.append(new_req.model_dump(mode='json'))
    reqs[new_req.user_id] = user_reqs
    save_requests(reqs)
    return new_req

def approve_request(user_id: str, req_id: str) -> BridgeRequest:
    return _update_status(user_id, req_id, "approved")

def reject_request(user_id: str, req_id: str) -> BridgeRequest:
    return _update_status(user_id, req_id, "rejected")

def execute_request(user_id: str, req_id: str) -> BridgeRequest:
    req = _get_request(user_id, req_id)
    if req.status != "approved":
        raise ValueError(f"Request {req_id} is not approved.")
        
    from .connectors.gmail import execute_gmail_action
    
    try:
        if req.service == "gmail":
            from .connectors.gmail import execute_gmail_action
            result = execute_gmail_action(user_id, req.action, req.params)
        elif req.service == "drive":
            from .connectors.drive import execute_drive_action
            result = execute_drive_action(user_id, req.action, req.params)
        else:
            raise NotImplementedError(f"Service {req.service} not implemented yet")
            
        return _update_status(user_id, req_id, "executed", result=result)
    except Exception as e:
        return _update_status(user_id, req_id, "failed", error=str(e))

def _get_request(user_id: str, req_id: str) -> BridgeRequest:
    reqs = load_requests()
    for r in reqs.get(user_id, []):
        if r["id"] == req_id:
            return BridgeRequest(**r)
    raise ValueError("Request not found")

def _update_status(user_id: str, req_id: str, status: str, result=None, error=None) -> BridgeRequest:
    reqs = load_requests()
    user_reqs = reqs.get(user_id, [])
    
    target = None
    for i, r in enumerate(user_reqs):
        if r["id"] == req_id:
            target = r
            break
            
    if not target:
        raise ValueError("Request not found")
        
    target["status"] = status
    if status in ["approved", "rejected"]:
        target["decided_at"] = datetime.now(timezone.utc).isoformat()
    if status in ["executed", "failed"]:
        target["executed_at"] = datetime.now(timezone.utc).isoformat()
    if result:
        target["result"] = result
    if error:
        target["error"] = error
        
    save_requests(reqs)
    return BridgeRequest(**target)
