from dataclasses import dataclass

from .schemas import AiAntIntent


@dataclass(frozen=True)
class IntentDecision:
    intent: AiAntIntent
    confidence: float
    reason: str
    needs_approval: bool = False


def classify_intent(message: str) -> IntentDecision:
    text = message.lower()

    if any(word in text for word in ["send", "publish", "post", "email", "share", "delete", "remove", "overwrite", "payment", "transfer"]):
        return IntentDecision(
            intent="external_action",
            confidence=0.92,
            reason="The request may affect external systems or irreversible data.",
            needs_approval=True,
        )
    if any(word in text for word in ["workflow", "automate", "automation", "daily", "weekly", "monthly", "schedule", "recurring", "repeat"]):
        return IntentDecision("create_workflow", 0.9, "The request describes a repeatable process or automation.")
    if any(word in text for word in ["agent team", "ai team", "agents", "crew", "specialist", "ทีม"]):
        return IntentDecision("create_agent_team", 0.87, "The request needs multiple roles or specialist agents.")
    if any(word in text for word in ["project", "workspace", "โปรเจกต์", "โปรเจค"]):
        return IntentDecision("create_project", 0.82, "The request is project/workspace shaped.")
    if any(word in text for word in ["report", "summary", "brief", "deck", "presentation", "deliverable", "รายงาน", "สรุป"]):
        return IntentDecision("generate_deliverable", 0.82, "The request asks for a reviewable output.")
    if any(word in text for word in ["file", "pdf", "csv", "sheet", "spreadsheet", "screenshot", "upload", "ไฟล์"]):
        return IntentDecision("analyze_file", 0.78, "The request references files or structured inputs.")
    if any(word in text for word in ["price", "plan", "billing", "subscription", "quota", "usage", "แพ็กเกจ"]):
        return IntentDecision("billing_question", 0.76, "The request is about plan, billing, or usage.")
    if "?" in message or any(word in text for word in ["what", "how", "why", "ช่วยอธิบาย", "คืออะไร"]):
        return IntentDecision("answer_question", 0.74, "The request is an information question.")
    return IntentDecision("chat", 0.68, "No tool or workspace action is required.")
