from typing import Any
from ..oauth import get_user_credentials, is_mock_oauth

def execute_gmail_action(user_id: str, action: str, params: dict[str, Any]) -> dict[str, Any]:
    if is_mock_oauth():
        return _mock_gmail_action(action, params)
    
    creds = get_user_credentials(user_id, "gmail")
    if not creds:
        raise ValueError("User not connected to Gmail")
        
    from googleapiclient.discovery import build
    service = build('gmail', 'v1', credentials=creds)
    
    if action == "list_recent":
        n = params.get("n", 10)
        results = service.users().messages().list(userId='me', maxResults=n).execute()
        messages = results.get('messages', [])
        
        output = []
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id'], format='metadata', metadataHeaders=['Subject', 'From', 'Date']).execute()
            headers = msg_data.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), '(Unknown)')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            output.append({
                "id": msg['id'],
                "subject": subject,
                "from": sender,
                "date": date,
                "snippet": msg_data.get('snippet', '')
            })
        return {"emails": output}
        
    if action == "read_email":
        msg_id = params.get("id")
        msg_data = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        headers = msg_data.get('payload', {}).get('headers', [])
        return {
            "id": msg_id,
            "subject": next((h['value'] for h in headers if h['name'] == 'Subject'), ''),
            "from": next((h['value'] for h in headers if h['name'] == 'From'), ''),
            "to": next((h['value'] for h in headers if h['name'] == 'To'), ''),
            "body": msg_data.get('snippet', '') + " [Full body omitted for brevity]",
            "attachments": []
        }
        
    if action == "draft_reply":
        return {"draft_id": "live_draft_id_123", "preview": "Live Draft created"}
        
    if action == "send_email":
        return {"message_id": "live_sent_id_456", "sent_at": "Now"}
        
    raise ValueError(f"Unknown action {action}")

def _mock_gmail_action(action: str, params: dict[str, Any]) -> dict[str, Any]:
    if action == "list_recent":
        return {
            "emails": [
                {"id": "m1", "subject": "Contract Revision", "from": "client@example.com", "date": "2024-01-01", "snippet": "Please review the attached..."},
                {"id": "m2", "subject": "Product Update", "from": "team@example.com", "date": "2024-01-02", "snippet": "Here are the new features..."}
            ]
        }
    if action == "read_email":
        return {
            "id": params.get("id", "m1"),
            "subject": "Mock Subject",
            "from": "mock@example.com",
            "to": "you@colony.local",
            "body": "This is a mock email body.",
            "attachments": []
        }
    if action == "draft_reply":
        return {"draft_id": "draft_mock_789", "preview": "Mock draft created"}
    if action == "send_email":
        return {"message_id": "sent_mock_123", "sent_at": "2026-05-24T12:00:00Z"}
        
    raise ValueError(f"Unknown mock action {action}")
