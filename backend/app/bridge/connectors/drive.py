from typing import Any
from ..oauth import get_user_credentials, is_mock_oauth

def execute_drive_action(user_id: str, action: str, params: dict[str, Any]) -> dict[str, Any]:
    if is_mock_oauth():
        return _mock_drive_action(action, params)
        
    creds = get_user_credentials(user_id, "drive")
    if not creds:
        raise ValueError("User not connected to Google Drive")
        
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=creds)
    
    if action == "list_recent":
        n = params.get("n", 10)
        results = service.files().list(
            pageSize=n, 
            fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
            orderBy="modifiedTime desc"
        ).execute()
        return {"files": results.get('files', [])}
        
    if action == "read_file":
        file_id = params.get("id")
        file_data = service.files().get(fileId=file_id, fields="id, name, mimeType").execute()
        return {
            "id": file_id,
            "name": file_data.get('name'),
            "type": file_data.get('mimeType'),
            "content": "Live File content omitted for demo brevity"
        }
        
    if action == "search":
        q = params.get("query", "")
        results = service.files().list(
            q=f"name contains '{q}'",
            pageSize=10, 
            fields="files(id, name, mimeType, modifiedTime)"
        ).execute()
        return {"files": results.get('files', [])}
        
    if action == "create_doc":
        title = params.get("title", "Untitled Document")
        file_metadata = {
            'name': title,
            'mimeType': 'application/vnd.google-apps.document'
        }
        file = service.files().create(body=file_metadata, fields='id').execute()
        return {"id": file.get('id'), "title": title}
        
    raise ValueError(f"Unknown Drive action {action}")

def _mock_drive_action(action: str, params: dict[str, Any]) -> dict[str, Any]:
    if action == "list_recent":
        return {
            "files": [
                {"id": "d1", "name": "Q3 Planning.pdf", "mimeType": "application/pdf", "modifiedTime": "2024-01-01"},
                {"id": "d2", "name": "Marketing Assets", "mimeType": "application/vnd.google-apps.folder", "modifiedTime": "2024-01-02"}
            ]
        }
    if action == "read_file":
        return {
            "id": params.get("id", "d1"),
            "name": "Mock Document",
            "type": "text/plain",
            "content": "This is mock document content from Google Drive."
        }
    if action == "search":
        return {
            "files": [
                {"id": "d3", "name": f"Search result for {params.get('query')}", "mimeType": "document", "modifiedTime": "2024-01-03"}
            ]
        }
    if action == "create_doc":
        return {"id": "mock_new_doc_id", "title": params.get("title", "Mock Title")}
        
    raise ValueError(f"Unknown mock Drive action {action}")
