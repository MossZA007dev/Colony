"""
Boss Intake — takes 3 user answers and returns a dynamically generated AI team.

OpenRouter (primary) → keyword-based fallback when mock mode or no API key.
"""
import json
import ssl
import urllib.error
import urllib.request
from uuid import uuid4

from ..config import get_settings

try:
    import certifi
    _SSL_CONTEXT: ssl.SSLContext | None = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CONTEXT = None
from .schemas import AgentTemplate, IntakeRequest, IntakeResponse

# ── Business-type agent presets (fallback) ────────────────────────────────────

_PRESETS: dict[str, list[dict[str, str]]] = {
    "ecommerce": [
        {"name": "AI Ant Director", "role": "CEO / Orchestrator — owns the operating plan", "dept": "Executive", "first_task": "Define brand positioning and 30-day launch roadmap"},
        {"name": "Operations Manager", "role": "Coordinates tasks, handoffs, and deadlines", "dept": "Operations", "first_task": "Build fulfillment and shipping workflow"},
        {"name": "Marketing Lead", "role": "Growth strategy, ads, and content calendar", "dept": "Marketing", "first_task": "Draft 30-day launch content calendar across channels"},
        {"name": "Research Analyst", "role": "Market, competitor, and customer research", "dept": "Research", "first_task": "Map top 5 competitors: pricing, positioning, channels"},
        {"name": "Customer Success", "role": "Support, retention, and feedback loops", "dept": "Support", "first_task": "Write FAQ and first-contact support templates"},
        {"name": "Finance Analyst", "role": "Unit economics, pricing, and cash flow", "dept": "Finance", "first_task": "Build contribution margin model and break-even calculator"},
        {"name": "Quality Reviewer", "role": "Reviews all output before it ships or publishes", "dept": "Quality", "first_task": "Audit all customer-facing copy for clarity and brand voice"},
    ],
    "saas": [
        {"name": "AI Ant Director", "role": "CEO / Orchestrator — owns product vision and execution", "dept": "Executive", "first_task": "Define ICP, positioning statement, and 60-day GTM plan"},
        {"name": "Product Manager", "role": "Roadmap, specs, and user story writing", "dept": "Product", "first_task": "Write MVP feature spec and prioritized backlog"},
        {"name": "Growth Lead", "role": "Acquisition, activation, and retention loops", "dept": "Growth", "first_task": "Identify top acquisition channels and draft experiment backlog"},
        {"name": "Research Analyst", "role": "User research, competitor intel, and market sizing", "dept": "Research", "first_task": "Run 5-customer interview synthesis and competitor teardown"},
        {"name": "Content Strategist", "role": "SEO content, product marketing, and copy", "dept": "Marketing", "first_task": "Draft launch blog post and landing page copy"},
        {"name": "Finance Analyst", "role": "SaaS metrics, runway, and pricing model", "dept": "Finance", "first_task": "Build ARR projection model with 3 pricing tier scenarios"},
        {"name": "Quality Reviewer", "role": "QA, brand consistency, and approval gating", "dept": "Quality", "first_task": "Review all outbound content and product copy"},
    ],
    "agency": [
        {"name": "AI Ant Director", "role": "Managing Director — client strategy and oversight", "dept": "Executive", "first_task": "Define service packages and target client profile"},
        {"name": "Project Manager", "role": "Coordinates client delivery and team workload", "dept": "Operations", "first_task": "Set up client onboarding workflow and timeline templates"},
        {"name": "Strategy Lead", "role": "Client strategy, proposals, and positioning", "dept": "Strategy", "first_task": "Draft agency capabilities deck and proposal template"},
        {"name": "Creative Lead", "role": "Conceptual direction, design, and creative output", "dept": "Creative", "first_task": "Define visual identity system and creative brief template"},
        {"name": "Content Writer", "role": "Copy, case studies, and content production", "dept": "Content", "first_task": "Write 3 client case study templates and agency bio"},
        {"name": "Biz Dev Agent", "role": "Lead gen, outreach, and pipeline management", "dept": "Sales", "first_task": "Build prospect list and draft outreach email sequence"},
        {"name": "Quality Reviewer", "role": "Reviews deliverables before client submission", "dept": "Quality", "first_task": "Create client approval checklist and QA process"},
    ],
    "content": [
        {"name": "AI Ant Director", "role": "Editor-in-Chief — content strategy and growth", "dept": "Executive", "first_task": "Define content pillars, publishing cadence, and monetization plan"},
        {"name": "Operations Manager", "role": "Publishing workflow, scheduling, and systems", "dept": "Operations", "first_task": "Build content pipeline from draft to published"},
        {"name": "Research Analyst", "role": "Topic research, trend spotting, and source curation", "dept": "Research", "first_task": "Identify top 20 topics by search demand and audience fit"},
        {"name": "Lead Writer", "role": "Long-form content, newsletters, and scripts", "dept": "Content", "first_task": "Write first 3 flagship pieces and email welcome sequence"},
        {"name": "Distribution Lead", "role": "SEO, social, repurposing, and audience growth", "dept": "Distribution", "first_task": "Build repurposing matrix: 1 post → 5 formats across channels"},
        {"name": "Monetization Analyst", "role": "Revenue streams, sponsorships, and products", "dept": "Finance", "first_task": "Map monetization options and draft first sponsorship pitch"},
        {"name": "Quality Reviewer", "role": "Fact-check, editorial standards, and brand voice", "dept": "Quality", "first_task": "Establish editorial style guide and review checklist"},
    ],
    "general": [
        {"name": "AI Ant Director", "role": "CEO / Orchestrator — owns the goal and operating plan", "dept": "Executive", "first_task": "Define the core objective, scope, and 30-day plan"},
        {"name": "Operations Manager", "role": "Coordinates workstreams, timelines, and handoffs", "dept": "Operations", "first_task": "Break goal into tasks and assign agent responsibilities"},
        {"name": "Research Analyst", "role": "Gathers context, sources, and market intelligence", "dept": "Research", "first_task": "Collect relevant data, reports, and benchmark examples"},
        {"name": "Strategy Analyst", "role": "Synthesizes research into decisions and priorities", "dept": "Strategy", "first_task": "Produce strategy brief: priorities, risks, and recommendations"},
        {"name": "Content Writer", "role": "Creates documents, plans, and deliverables", "dept": "Content", "first_task": "Draft the first key deliverable based on strategy brief"},
        {"name": "Finance Analyst", "role": "Budgets, projections, and financial modeling", "dept": "Finance", "first_task": "Build financial model or cost-benefit analysis"},
        {"name": "Quality Reviewer", "role": "Reviews output before it reaches you or ships", "dept": "Quality", "first_task": "Audit all deliverables for accuracy and completeness"},
    ],
}


# ── Business-type detection ────────────────────────────────────────────────────

def _detect_business_type(idea: str, customer: str, objective: str) -> str:
    text = f"{idea} {customer} {objective}".lower()
    if any(w in text for w in ["store", "shop", "sell", "coffee", "product", "retail", "ecommerce", "commerce", "ร้าน", "ขาย"]):
        return "ecommerce"
    if any(w in text for w in ["saas", "software", "app", "platform", "subscription", "tool", "api", "dashboard", "b2b"]):
        return "saas"
    if any(w in text for w in ["agency", "freelance", "client", "design", "consulting", "studio", "service"]):
        return "agency"
    if any(w in text for w in ["newsletter", "blog", "creator", "youtube", "podcast", "content", "media", "writing"]):
        return "content"
    return "general"


def _project_title_from_idea(idea: str) -> str:
    words = idea.strip().split()[:5]
    return " ".join(words).title() if words else "New AI Enterprise"


# ── Fallback team generator ────────────────────────────────────────────────────

def _generate_team_fallback(request: IntakeRequest) -> IntakeResponse:
    btype = _detect_business_type(request.business_idea, request.target_customer, request.first_objective)
    raw_agents = _PRESETS.get(btype, _PRESETS["general"])

    # Personalise first_task for Director with the user's specific first objective
    agents = []
    for i, a in enumerate(raw_agents):
        task = a["first_task"]
        if i == 0:  # Director always gets the user's actual first objective
            task = request.first_objective
        agents.append(AgentTemplate(name=a["name"], role=a["role"], dept=a["dept"], first_task=task))

    return IntakeResponse(
        project_id=f"enterprise-{uuid4().hex[:12]}",
        project_title=_project_title_from_idea(request.business_idea),
        business_type=btype,
        team_rationale=f"This team is optimised for a {btype} business targeting {request.target_customer}.",
        agents=agents,
        source="fallback",
    )


# ── OpenRouter team generator ─────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are the AI Director inside Colony — an AI organisation platform for solopreneurs.

Your job: design the optimal 5-7 agent AI team for a specific business.

Each agent must have:
- name: specific, memorable (e.g. "Growth Hacker", "Brand Strategist") — never generic like "Agent 1"
- role: clear 1-line description of what they own
- dept: one word (Executive / Operations / Marketing / Research / Finance / Content / Strategy / Sales / Support / Quality / Growth / Product / Creative)
- first_task: concrete, specific to THIS business — not generic

Always include:
1. "AI Ant Director" (CEO / Orchestrator) — first in list
2. One Operations/PM role
3. One Quality Reviewer — last in list

Pick 2-4 additional agents that match this business best.

Respond ONLY with valid JSON. No markdown. No explanation.
JSON schema:
{
  "project_title": "3-5 word title for this project",
  "business_type": "ecommerce|saas|agency|content|marketplace|service|other",
  "team_rationale": "1-2 sentences: why this team composition for this business",
  "agents": [
    {"name": "...", "role": "...", "dept": "...", "first_task": "..."}
  ]
}"""


def _call_openrouter(api_key: str, model: str, user_message: str, timeout: float) -> dict:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://colony.app",
            "X-Title": "Colony Boss Intake",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout, context=_SSL_CONTEXT) as response:
        return json.loads(response.read().decode("utf-8"))


def _generate_team_openrouter(request: IntakeRequest, settings) -> IntakeResponse:
    user_message = (
        f"Business idea: {request.business_idea}\n"
        f"Target customer: {request.target_customer}\n"
        f"First objective: {request.first_objective}\n\n"
        "Generate the optimal AI team for this business."
    )

    try:
        raw = _call_openrouter(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_default_model,
            user_message=user_message,
            timeout=settings.openrouter_timeout_seconds,
        )
        content = raw["choices"][0]["message"]["content"]
        data = json.loads(content) if isinstance(content, str) else content
    except (urllib.error.HTTPError, urllib.error.URLError, KeyError, json.JSONDecodeError, OSError) as exc:
        # Network / parse error → fall back silently
        print(f"[colony.enterprise.intake] OpenRouter error: {exc!r} — using fallback")
        return _generate_team_fallback(request)

    try:
        agents = [
            AgentTemplate(
                name=a["name"],
                role=a["role"],
                dept=a["dept"],
                first_task=a.get("first_task", "Define responsibilities"),
            )
            for a in data.get("agents", [])
        ]
        if not agents:
            raise ValueError("No agents returned")
        return IntakeResponse(
            project_id=f"enterprise-{uuid4().hex[:12]}",
            project_title=data.get("project_title") or _project_title_from_idea(request.business_idea),
            business_type=data.get("business_type", "general"),
            team_rationale=data.get("team_rationale", "Team generated by AI Ant."),
            agents=agents,
            source="openrouter",
        )
    except (KeyError, ValueError, TypeError) as exc:
        print(f"[colony.enterprise.intake] Response parse error: {exc!r} — using fallback")
        return _generate_team_fallback(request)


# ── Public API ─────────────────────────────────────────────────────────────────

def process_intake(request: IntakeRequest) -> IntakeResponse:
    settings = get_settings()
    use_live = (
        not settings.ai_ant_mock_mode
        and bool(getattr(settings, "openrouter_api_key", None))
    )
    if use_live:
        return _generate_team_openrouter(request, settings)
    return _generate_team_fallback(request)
