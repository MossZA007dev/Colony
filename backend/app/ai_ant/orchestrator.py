from datetime import datetime, timezone
from uuid import uuid4

from ..config import get_settings
from .intent_classifier import IntentDecision, classify_intent
from .memory import append_exchange, create_conversation_id, create_message_id
from .providers import ProviderError, generate_openai_reply, generate_openrouter_reply
from .routing.registry import estimate_cost_usd, select_model
from .schemas import AiAntAction, AiAntArtifact, AiAntIntent, AiAntMessageRequest, AiAntMessageResponse, AiAntUsage
from .subscription import get_user_plan, plan_allows_intent
from .usage import can_spend, get_monthly_usage, record_usage


def handle_ai_ant_message(payload: AiAntMessageRequest) -> AiAntMessageResponse:
    settings = get_settings()
    plan = get_user_plan(payload.user_id)
    conversation_id = payload.conversation_id or create_conversation_id()
    message_id = create_message_id()
    precheck_usage = _estimate_usage(payload.message, reply_seed="quota precheck", estimated_cost_usd=0.0)
    monthly_usage = get_monthly_usage(payload.user_id)
    if not can_spend(
        current_usage=monthly_usage,
        estimated_tokens=precheck_usage.input_tokens,
        estimated_cost_usd=0.0,
        monthly_token_limit=plan.monthly_token_limit,
        monthly_cost_limit_usd=plan.monthly_cost_limit_usd,
    ):
        response = _blocked_response(
            conversation_id=conversation_id,
            message_id=message_id,
            payload=payload,
            reply=f"Your {plan.name} plan has reached its AI Ant monthly usage limit. Upgrade your plan or wait for the next usage period to continue.",
            usage=precheck_usage,
            plan_id=plan.id,
            plan_name=plan.name,
        )
        _append_response(payload, conversation_id, response)
        return response

    decision = classify_intent(payload.message)
    if not plan_allows_intent(plan, decision.intent):
        response = _blocked_response(
            conversation_id=conversation_id,
            message_id=message_id,
            payload=payload,
            reply=f"This request looks like {decision.intent.replace('_', ' ')}, which is not available on the {plan.name} plan. Upgrade to continue with this AI Ant capability.",
            usage=precheck_usage,
            intent=decision.intent,
            confidence=decision.confidence,
            plan_id=plan.id,
            plan_name=plan.name,
        )
        _append_response(payload, conversation_id, response)
        return response

    route = select_model(decision.intent, payload.mode, settings.ai_ant_default_model, plan)
    actions = _actions_for_intent(decision, payload.message)
    artifacts = _artifacts_for_actions(actions)
    usage = _estimate_usage(
        payload.message,
        reply_seed=decision.reason,
        estimated_cost_usd=estimate_cost_usd(route, precheck_usage.input_tokens, precheck_usage.output_tokens),
    )
    if not can_spend(
        current_usage=monthly_usage,
        estimated_tokens=usage.input_tokens + usage.output_tokens,
        estimated_cost_usd=usage.estimated_cost_usd,
        monthly_token_limit=plan.monthly_token_limit,
        monthly_cost_limit_usd=plan.monthly_cost_limit_usd,
    ):
        response = _blocked_response(
            conversation_id=conversation_id,
            message_id=message_id,
            payload=payload,
            reply=f"This AI Ant request would exceed your {plan.name} plan usage limit. Try a shorter prompt or upgrade your plan.",
            usage=usage,
            intent=decision.intent,
            confidence=decision.confidence,
            plan_id=plan.id,
            plan_name=plan.name,
        )
        _append_response(payload, conversation_id, response)
        return response

    approval_required = decision.needs_approval or usage.estimated_cost_usd > plan.auto_approval_threshold_usd
    if usage.estimated_cost_usd > plan.auto_approval_threshold_usd:
        actions = [
            AiAntAction(
                type="request_approval",
                requires_approval=True,
                payload={
                    "risk": "medium",
                    "reason": "Estimated AI Ant cost is above this plan's auto-approval threshold.",
                    "estimated_cost_usd": usage.estimated_cost_usd,
                    "plan": plan.id,
                },
            ),
            *actions,
        ]
    reply = _reply_for_intent(decision, payload.message, bool(actions))
    response_model = route.model
    if not settings.ai_ant_mock_mode and not approval_required:
        try:
            # OpenRouter is primary — falls back to OpenAI if no OpenRouter key
            if settings.openrouter_api_key:
                provider_result = generate_openrouter_reply(
                    settings=settings,
                    message=payload.message,
                    intent=decision.intent,
                    model_hint=route.model,
                )
            else:
                provider_result = generate_openai_reply(
                    settings=settings,
                    message=payload.message,
                    intent=decision.intent,
                    model_hint=route.model,
                )
            reply = provider_result.text
            response_model = provider_result.model
            usage = AiAntUsage(
                input_tokens=provider_result.input_tokens or usage.input_tokens,
                output_tokens=provider_result.output_tokens or usage.output_tokens,
                estimated_cost_usd=usage.estimated_cost_usd,
            )
        except ProviderError as exc:
            reply = f"{reply}\n\n[Provider error: {exc}]"
    response = AiAntMessageResponse(
        conversation_id=conversation_id,
        message_id=message_id,
        reply=reply,
        intent=decision.intent,
        status="approval_required" if approval_required else "draft_created" if artifacts else "completed",
        model=response_model,
        confidence=decision.confidence,
        actions=actions,
        artifacts=artifacts,
        approval_required=approval_required,
        usage=usage,
        plan_id=plan.id,
        plan_name=plan.name,
        route_source=route.source,
        created_at=datetime.now(timezone.utc),
    )
    record_usage(
        user_id=payload.user_id,
        conversation_id=conversation_id,
        message_id=message_id,
        model=response_model,
        intent=decision.intent,
        route_source=route.source,
        confidence=decision.confidence,
        tokens_in=usage.input_tokens,
        tokens_out=usage.output_tokens,
        cost_usd=usage.estimated_cost_usd,
        metadata={"plan": plan.id, "mode": payload.mode, "approval_required": approval_required},
    )
    _append_response(payload, conversation_id, response)
    return response


def _append_response(payload: AiAntMessageRequest, conversation_id: str, response: AiAntMessageResponse) -> None:
    append_exchange(
        conversation_id=conversation_id,
        user_id=payload.user_id,
        project_id=payload.project_id,
        user_message=payload.message,
        assistant_response=response.model_dump(mode="json"),
    )


def _blocked_response(
    *,
    conversation_id: str,
    message_id: str,
    payload: AiAntMessageRequest,
    reply: str,
    usage: AiAntUsage,
    intent: AiAntIntent = "billing_question",
    confidence: float = 0.98,
    plan_id: str | None = None,
    plan_name: str | None = None,
) -> AiAntMessageResponse:
    return AiAntMessageResponse(
        conversation_id=conversation_id,
        message_id=message_id,
        reply=reply,
        intent=intent,
        status="completed",
        model="colony-plan-gate",
        confidence=confidence,
        actions=[],
        artifacts=[],
        approval_required=False,
        usage=usage,
        plan_id=plan_id,
        plan_name=plan_name,
        route_source="plan_gate",
        created_at=datetime.now(timezone.utc),
    )


def _actions_for_intent(decision: IntentDecision, message: str) -> list[AiAntAction]:
    if decision.intent == "create_workflow":
        return [
            AiAntAction(
                type="create_workflow_draft",
                requires_approval=False,
                payload={
                    "name": _title_from_message(message, "Workflow"),
                    "trigger": _workflow_trigger(message),
                    "steps": _workflow_steps(message),
                    "approval": "Require approval before sending, publishing, deleting, or writing to external tools.",
                },
            )
        ]
    if decision.intent == "create_agent_team":
        return [
            AiAntAction(
                type="create_agent_team_draft",
                requires_approval=False,
                payload={
                    "name": _title_from_message(message, "AI Team"),
                    "agents": [
                        {"name": "Research Ant", "role": "Researcher"},
                        {"name": "Analysis Ant", "role": "Analyst"},
                        {"name": "Writer Ant", "role": "Drafts final output"},
                        {"name": "Guard Ant", "role": "Reviews risk and approval"},
                    ],
                },
            )
        ]
    if decision.intent == "create_project":
        return [
            AiAntAction(
                type="create_project_draft",
                requires_approval=False,
                payload={"name": _title_from_message(message, "Project"), "goal": message},
            )
        ]
    if decision.intent == "generate_deliverable":
        return [
            AiAntAction(
                type="generate_deliverable_draft",
                requires_approval=False,
                payload={"title": _title_from_message(message, "Deliverable"), "format": "brief"},
            )
        ]
    if decision.intent == "external_action":
        return [
            AiAntAction(
                type="request_approval",
                requires_approval=True,
                payload={
                    "risk": "high",
                    "reason": "External or irreversible actions must be approved before execution.",
                    "requested_action": message,
                },
            )
        ]
    return []


def _artifacts_for_actions(actions: list[AiAntAction]) -> list[AiAntArtifact]:
    artifacts: list[AiAntArtifact] = []
    for action in actions:
        if action.type == "request_approval":
            continue
        payload = action.payload
        artifacts.append(
            AiAntArtifact(
                type=action.type.replace("_draft", ""),
                id=f"art_{uuid4().hex}",
                title=str(payload.get("name") or payload.get("title") or "AI Ant draft"),
                payload=payload,
            )
        )
    return artifacts


def _reply_for_intent(decision: IntentDecision, message: str, has_action: bool) -> str:
    if decision.intent == "external_action":
        return "ผมเข้าใจงานนี้ แต่เป็น action ที่อาจส่งออก แก้ไข หรือลบข้อมูลภายนอก ผมจะหยุดไว้ที่ขั้น approval ก่อน ยังไม่ execute จริง"
    if decision.intent == "create_workflow":
        return "ผมตีความว่านี่เป็นงานแบบ workflow จึงสร้าง draft ที่มี trigger, steps, output และ approval rule ให้ก่อน ยังไม่รัน automation จริง"
    if decision.intent == "create_agent_team":
        return "งานนี้เหมาะกับทีม AI หลายบทบาท ผมสร้าง team draft ให้ตรวจทานก่อน แล้วค่อยให้คุณอนุมัติหรือปรับ role ได้"
    if decision.intent == "create_project":
        return "ผมสร้าง project draft จากเป้าหมายนี้ให้ก่อน เพื่อใช้เป็น context กลางของ AI Ant และทีม agent"
    if decision.intent == "generate_deliverable":
        return "ผมจะจัดคำขอนี้เป็น deliverable draft เพื่อให้คุณตรวจ แก้ และ approve ก่อนนำไปใช้จริง"
    if decision.intent == "billing_question":
        return "คำถามนี้เกี่ยวกับ plan, quota หรือ billing เดี๋ยว AI Ant ควรดึงข้อมูล subscription จาก backend ก่อนตอบแบบ production"
    if decision.intent == "analyze_file":
        return "ผมเห็นว่างานนี้เกี่ยวกับไฟล์หรือข้อมูล แนว production ควรอัปโหลดไฟล์เข้า backend แล้วให้ AI Ant วิเคราะห์จาก context ที่ backend อนุญาต"
    if decision.intent == "answer_question":
        return "ผมตอบได้จาก context ปัจจุบัน ถ้าคำถามเกี่ยวกับ project จริง backend ควรดึง project context และ chat history มาประกอบคำตอบ"
    if has_action:
        return "ผมสร้าง draft ให้ตรวจทานก่อน โดยยังไม่ทำ action จริง"
    return f"รับทราบครับ ผมจะช่วยคิดและจัดโครงให้จากข้อความนี้: {message}"


def _estimate_usage(message: str, reply_seed: str, estimated_cost_usd: float) -> AiAntUsage:
    input_tokens = max(64, round(len(message) / 3))
    output_tokens = max(96, round((len(reply_seed) + 180) / 3))
    return AiAntUsage(input_tokens=input_tokens, output_tokens=output_tokens, estimated_cost_usd=round(estimated_cost_usd, 6))


def _title_from_message(message: str, fallback: str) -> str:
    words = " ".join(message.strip().split())
    if not words:
        return fallback
    return words[:54] + ("..." if len(words) > 54 else "")


def _workflow_trigger(message: str) -> str:
    text = message.lower()
    if "daily" in text or "ทุกวัน" in text:
        return "daily_schedule"
    if "weekly" in text or "ทุกสัปดาห์" in text:
        return "weekly_schedule"
    if "monthly" in text or "ทุกเดือน" in text:
        return "monthly_schedule"
    return "manual"


def _workflow_steps(message: str) -> list[str]:
    if any(word in message.lower() for word in ["sales", "ยอดขาย", "revenue"]):
        return ["Load sales source", "Clean and validate rows", "Analyze trend and anomalies", "Draft report", "Ask for approval", "Save deliverable"]
    return ["Collect input", "Validate context", "Run AI processing step", "Review result", "Ask for approval when needed", "Create output"]
