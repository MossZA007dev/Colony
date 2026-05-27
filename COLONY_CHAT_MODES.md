# Colony — Chat Modes Blueprint

**Audience**: AI coder / engineer continuing the build
**Stack**: React + TS (Vite) frontend · FastAPI (Python) backend · OpenRouter API · Firebase (auth) · JSON files (state, will migrate later)

---

## Quick Matrix

| Mode | Runtime | Backend status | Frontend status | LLM provider | What it needs next |
|---|---|---|---|---|---|
| **Chat** | Sync, 1 call | ✅ done | ✅ done | OpenRouter | Streaming + multi-turn context |
| **Auto** | Sync, routes | ✅ done (routes Chat only) | ⚠️ partial | OpenRouter | Wire project/crew/workflow paths to backend |
| **Colony Crew** | Sync, one-shot | ❌ none | ⚠️ mock animation | OpenRouter | Build `/crew/run` endpoint |
| **One-man Enterprise** | Async, continuous | ⚠️ intake only | ⚠️ canvas done | OpenRouter | Agent runner + artifact pipeline + state polling |
| **Automation (Workflow)** | Trigger-based | ❌ none | ⚠️ mock proposal | OpenRouter | Workflow draft + run engine |
| **Colony Bridge** | Permission-gated | ❌ none | ⚠️ mock UI | n/a (tool calls) | Phased: Email → Files → Browser → Messaging |

---

## Common Infrastructure

### Environment
```bash
# backend/.env
AI_ANT_MOCK_MODE=false
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat-v3-0324:free
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Shared modules
- `backend/app/ai_ant/providers.py` — `generate_openrouter_reply()` (already done)
- `backend/app/config.py` — settings (already done)
- `backend/app/ai_ant/memory.py` — conversation storage (JSON files, ok for MVP)

### Auth scoping
All endpoints accept `user_id` (email-based). Conversations / workspaces / crews keyed by `user_id`.

### Frontend → Backend pattern
```typescript
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
await fetch(`${apiBase}/<endpoint>`, { method: 'POST', body: JSON.stringify({ ... }) });
```

---

# Mode 1 — Chat

**Purpose**: 1:1 conversation with AI Ant. No agents, no workspace.

**Runtime**: Sync, single LLM call per message

**Status**: ✅ Done — works end-to-end with OpenRouter

### Backend
- **Endpoint**: `POST /ai-ant/messages`
- **File**: [backend/app/ai_ant/router.py](backend/app/ai_ant/router.py), [backend/app/ai_ant/orchestrator.py](backend/app/ai_ant/orchestrator.py)
- **Request**:
  ```json
  {
    "conversation_id": "string|null",
    "user_id": "user@example.com",
    "message": "string",
    "mode": "auto|chat|colony_crew|one_man_enterprise|automation|connected_workspace",
    "context": {}
  }
  ```
- **Response**:
  ```json
  {
    "conversation_id": "...",
    "message_id": "...",
    "reply": "AI response text",
    "intent": "chat|create_project|create_workflow|...",
    "status": "completed|approval_required|draft_created",
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "confidence": 0.85,
    "actions": [],
    "artifacts": [],
    "approval_required": false,
    "usage": { "input_tokens": 100, "output_tokens": 200, "estimated_cost_usd": 0.0001 }
  }
  ```

### System prompt (in `providers.py`)
> You are AI Ant inside Colony — an AI operating system for solopreneurs. Reply helpfully and concisely. Always reply in the same language the user writes in. If the request involves external sending, publishing, deleting, payments, or irreversible changes, explain that approval is required and do not claim the action was executed.

### Next steps to improve
1. **Streaming** — switch to SSE: backend yields chunks, frontend renders progressively
2. **Multi-turn context** — currently each message is stateless. Load last N messages from `memory.py` before each call
3. **Per-user model preference** — let users pick GPT-4 / Claude / DeepSeek per conversation

---

# Mode 2 — Auto (Mode Router)

**Purpose**: User doesn't pick a mode. AI Ant decides whether to chat, build a project, launch a crew, or trigger a workflow.

**Runtime**: Sync routing decision + executes chosen mode

**Status**: ⚠️ Partial — routes to Chat. Other branches still mock UI.

### How it works today
```
User prompt
   ↓
classifyExecutionIntent() (frontend, keyword-based)
   ↓
Branches:
  - simple_chat / operator_task → calls backend Chat ✅
  - project_like → opens mock project card ❌
  - colony_crew → opens mock crew panel ❌
  - one_man_enterprise → opens BossIntake ✅ (works)
  - workflow → opens mock workflow proposal ❌
  - device_action → opens mock permission UI ❌
```

### Backend (new endpoint to add)
- **Endpoint**: `POST /ai-ant/route`
- **Purpose**: Move intent classification from frontend keyword matching to LLM-powered routing
- **Request**:
  ```json
  { "user_id": "...", "message": "user prompt", "available_modes": ["chat","crew","enterprise","workflow","bridge"] }
  ```
- **Response**:
  ```json
  {
    "mode": "crew",
    "confidence": 0.87,
    "reason": "User asked for a multi-disciplinary research project",
    "suggested_params": { "agent_count": 4, "task_summary": "..." }
  }
  ```

### System prompt
> You are the Colony Router. Given a user request, decide which execution mode fits best.
> Rules:
> - `chat` — explanations, questions, casual talk
> - `crew` — one-time multi-agent task (research, content, analysis)
> - `enterprise` — ongoing business with multiple roles
> - `workflow` — repeating/scheduled task ("daily", "every week", "when X happens")
> - `bridge` — touches external tools (email, browser, files, messaging)
> Respond with JSON: `{mode, confidence, reason, suggested_params}`

### Next steps
1. Build `/ai-ant/route` endpoint
2. Replace frontend `classifyExecutionIntent()` with backend call
3. Each branch must call its proper backend (see modes 3-6 below)

---

# Mode 3 — Colony Crew

**Purpose**: One-shot multi-agent task. User describes goal, system spawns 3-5 agents that collaborate ONCE and produce a final deliverable.

**Runtime**: **Sync, one-shot** — single API call returns final result (per user spec)

**Status**: ❌ All frontend mock (setTimeout animation)

### Backend (to build)
- **File**: `backend/app/crew/router.py`, `backend/app/crew/runner.py`, `backend/app/crew/schemas.py`
- **Endpoint**: `POST /crew/run`
- **Request**:
  ```json
  {
    "user_id": "...",
    "task": "Research the EV market and write a brief",
    "preferred_agent_count": 4
  }
  ```
- **Response**:
  ```json
  {
    "crew_id": "crew-xxx",
    "task": "...",
    "agents": [
      { "id": "a1", "kind": "research", "name": "Research Lead", "summary": "..." }
    ],
    "activity": [
      { "agent_id": "a1", "step": "Searched 12 sources", "output_excerpt": "..." }
    ],
    "deliverable": {
      "title": "EV Market Brief",
      "content_md": "## Executive Summary...",
      "format": "markdown"
    },
    "duration_seconds": 22,
    "model_calls": 5
  }
  ```

### Internal flow inside `/crew/run`
```
1. Plan: LLM call #1 → decide 3-5 agent roles for this task
2. Parallel research: each "research" agent → LLM call (async.gather)
3. Synthesis: LLM call → combine research into analysis
4. Draft: LLM call → write the deliverable
5. QC: LLM call → review and polish
6. Return all artifacts in one response
```

Total: ~5-8 OpenRouter calls per `/crew/run`. Use `asyncio` for parallel phase.

### System prompts (one per role)
**Crew Planner**:
> Given a task, output JSON: `{agents: [{kind: research|analyst|writer|reviewer, name, focus}]}`. Pick 3-5 agents max.

**Research agent**:
> You are a Research Agent. Focus: {focus}. Find facts, sources, and key signals. Output: 5-10 bullet points with evidence.

**Analyst**:
> You are an Analyst. Synthesize the research below into priorities, risks, and recommendations.

**Writer**:
> You are a Writer. Turn the analysis below into a polished {format} document.

**Reviewer**:
> You are a Quality Reviewer. Find inaccuracies, missing info, or weak claims. Suggest improvements.

### Frontend integration
- Replace `launchColonyCrew()` setTimeout chain with:
  ```typescript
  const response = await fetch('/crew/run', { ... });
  // Show progress optimistically (fake intermediate steps while waiting ~20s)
  // Display response.deliverable when done
  ```

---

# Mode 4 — One-man Enterprise

**Purpose**: Solopreneur runs an ongoing AI organisation. Multiple agents in roles, communicating via graph network, working continuously, producing deliverables over days/weeks.

**Runtime**: **Async, continuous** — agents triggered by events (user prompts, schedules, other agents' outputs)

**Status**: ⚠️ Boss Intake done (sync). Workspace canvas done (frontend). Agent execution still mock animation.

### Architecture — Graph Network Communication

Each agent is a node. Each connection is a typed edge carrying an **artifact**:

```
[Research] ──source_pack──→ [Analyst] ──strategy_brief──→ [Writer]
                                                            ↓ draft
                                                         [Quality]
                                                            ↓ approval_request
                                                          [User]
```

When agent A produces an artifact, the system walks all outgoing edges and triggers connected agents.

### Backend (to build)

**Endpoints**:
- `POST /enterprise/intake` ✅ already done
- `POST /enterprise/workspaces` — create workspace from intake result
- `GET /enterprise/workspaces/{id}` — fetch full state
- `POST /enterprise/workspaces/{id}/agents/{agent_id}/trigger` — user manually triggers an agent
- `POST /enterprise/workspaces/{id}/messages` — user posts message in a channel; if @mentions an agent, triggers it
- `GET /enterprise/workspaces/{id}/state?since=<timestamp>` — poll for updates (long-poll or SSE)
- `POST /enterprise/workspaces/{id}/decisions/{id}/resolve` — user approves/rejects a pending decision

**Files to create**:
```
backend/app/enterprise/
├── workspace.py       ← Workspace CRUD
├── runner.py          ← Agent execution loop
├── artifacts.py       ← Artifact pipeline (graph traversal)
├── decisions.py       ← Decision queue management
└── state.py           ← State persistence (Firestore or JSON)
```

### Agent runtime (Hybrid model)

When triggered, an agent:
1. Loads context: its role, its task, all incoming artifacts since last run, channel chat history
2. Calls OpenRouter → produces output
3. Determines output type (artifact, message, decision_request)
4. Walks outgoing connections → enqueues next agents
5. Persists state

**Recommended infrastructure**:
- Simple version: FastAPI BackgroundTasks (works for MVP, single-process)
- Production: Redis Queue or Celery, separate worker process
- Frontend polls `/state?since=<ts>` every 3-5s for now (upgrade to SSE later)

### Artifact schema
```python
class Artifact(BaseModel):
    id: str
    workspace_id: str
    type: Literal["source_pack","strategy_brief","financial_model","draft","review_report","decision_request","message"]
    from_agent_id: str
    to_agent_id: str | None  # None = broadcast to all connected
    content: str  # markdown for text, JSON string for structured
    metadata: dict  # word_count, sources, confidence, etc.
    status: Literal["pending","delivered","consumed","rejected"]
    created_at: datetime
```

### System prompts (one template per agent role)
Template:
```
You are {agent.name}, a {agent.role} in {workspace.project_title}.
Department: {agent.dept}
Current task: {agent.current_task}

Incoming artifacts from teammates:
{format_artifacts(incoming)}

Recent channel chat (last 10 messages):
{format_chat(channel_history)}

Your job: produce ONE of the following output types:
1. artifact — finished work product to hand to: {downstream_agents}
2. message — chat reply to teammates or user
3. decision_request — pause and ask user to approve before proceeding

Respond with JSON: {type, content, recipient_agent_id?, requires_approval?}
```

### Frontend integration
- Update `EnterpriseWorkspace.tsx` to:
  - On mount → `GET /enterprise/workspaces/{id}`
  - Set up polling loop → `GET /state?since=<lastTs>` every 4s
  - User clicks "Run" on agent → `POST /agents/{id}/trigger`
  - User sends chat message → `POST /messages`
  - When decision_request appears → show modal, on approve → `POST /decisions/{id}/resolve`

---

# Mode 5 — Automation (Workflow)

**Purpose**: Repeating/scheduled tasks. "Every Monday 9am, summarise sales from CSV → email me."

**Runtime**: Trigger-based (cron, webhook, manual)

**Status**: ❌ All mock. Frontend shows a workflow proposal card but it's not stored or executable.

### Backend (to build)

**Files**:
```
backend/app/workflows/
├── router.py
├── drafter.py     ← LLM call to draft workflow from prompt
├── runner.py      ← Execute a workflow run
├── scheduler.py   ← APScheduler or simple cron loop
└── schemas.py
```

**Endpoints**:
- `POST /workflows/draft` — generate draft from user prompt
  - Request: `{user_id, prompt}`
  - Response: `{workflow: {name, trigger, steps, output_destination, approval_rules}}`
- `POST /workflows` — save draft as workflow
- `GET /workflows?user_id=...` — list user's workflows
- `POST /workflows/{id}/run` — manual trigger
- `GET /workflows/{id}/runs` — execution history
- `POST /workflows/{id}/enable` / `/disable`

**Schema**:
```python
class WorkflowStep(BaseModel):
    id: str
    type: Literal["llm_call","fetch_data","transform","send","approval_gate"]
    config: dict
    on_failure: Literal["stop","skip","retry"]

class Workflow(BaseModel):
    id: str
    user_id: str
    name: str
    trigger: Trigger  # cron / webhook / manual
    steps: list[WorkflowStep]
    enabled: bool
    last_run_at: datetime | None
```

### System prompt (drafter)
> You are a Workflow Drafter. Given a user's natural-language description, output a JSON workflow with: name, trigger (cron expression or "manual"), steps (each step has type and config), and approval_rules (steps that need human approval before execution).

### Recommended scheduler
- Use **APScheduler** (Python) in same FastAPI process for MVP
- Each enabled workflow registers a job
- On trigger → calls `runner.run_workflow(id)` → executes steps sequentially

---

# Mode 6 — Colony Bridge

**Purpose**: Let AI Ant act in the real world — send emails, read files, browse web, message customers.

**Runtime**: Permission-gated tool execution

**Status**: ❌ All mock. UI shows permission dialogs but no real integrations.

### Recommended phased rollout

Since the user hasn't decided on priority, here's my recommended order (lowest risk → highest value):

**Phase 1 — Files (Google Drive)** [easiest, MCP exists]
- User auths Google OAuth → access Drive
- Agents can: read PDFs/Sheets, create docs, search files
- Use Anthropic's Drive MCP server pattern (already in your `mcp__claude_ai_Google_Drive__*` tools)

**Phase 2 — Email (Gmail)** [high utility]
- User auths Google OAuth → access Gmail
- Agents can: read inbox, draft replies, send (with approval)
- Use Anthropic's Gmail MCP server pattern

**Phase 3 — Browser automation** [highest value, complex]
- Headless Playwright running in backend
- Agents request "open URL X, click Y, extract Z"
- Always requires approval before destructive actions

**Phase 4 — Messaging (LINE/WhatsApp)** [needs business accounts]
- LINE Messaging API (need official LINE Business Account)
- WhatsApp Business API (Meta, more friction)

### Backend pattern (same for all integrations)

```
backend/app/bridge/
├── router.py
├── permissions.py     ← Permission grants/revokes
├── connectors/
│   ├── gmail.py
│   ├── drive.py
│   ├── browser.py
│   └── line.py
└── schemas.py
```

**Endpoints**:
- `POST /bridge/connect/{service}` — OAuth flow start
- `GET /bridge/connections` — list connected services
- `POST /bridge/requests` — agent requests an action
  - Request: `{user_id, service, action, params, requesting_agent_id, risk_level}`
  - Response: `{request_id, status: "pending_approval"}`
- `POST /bridge/requests/{id}/approve` — user approves
- `POST /bridge/requests/{id}/execute` — actually performs the action
- `GET /bridge/requests?user_id=...` — request history

### System prompt (when agents use bridge)
> You may request real-world actions via Colony Bridge. Available tools: {list_of_connected_services}.
> CRITICAL: All actions require user approval before execution.
> When requesting: explain WHY in 1 sentence, list ALL data that will be sent/received, set risk_level (low/medium/high).
> NEVER claim an action was executed unless you receive a confirmation event.

---

## Recommended Build Order

**Week 1** — Core conversational AI working
1. ✅ Chat (done)
2. Auto router endpoint (`/ai-ant/route`)
3. Multi-turn context in Chat

**Week 2** — Colony Crew (one-shot multi-agent)
4. Build `/crew/run` with planner → research → analyst → writer → QC
5. Connect frontend `launchColonyCrew()` to real backend
6. Show optimistic progress while waiting

**Week 3** — One-man Enterprise runtime
7. Workspace CRUD endpoints
8. Agent runner (BackgroundTasks)
9. Artifact pipeline + graph traversal
10. Frontend polling

**Week 4** — Decision Queue + Automation
11. Decision queue endpoints + UI
12. Workflow drafter + simple cron runner

**Week 5+** — Colony Bridge (one connector at a time)
13. Files (Google Drive) — start here
14. Email (Gmail)
15. Browser automation
16. Messaging (last)

---

## Key Decisions Locked-in (from user)

| Question | Answer |
|---|---|
| Crew runtime | Sync, one-shot (single API call returns final result) |
| Enterprise runtime | Async, continuous (hybrid: sync trigger + background polling) |
| Multi-agent comms | Graph network (artifacts flow along connections) |
| Bridge priority | TBD — recommend Files → Email → Browser → Messaging |

---

## Open Questions to Resolve Before Building

1. **State storage** — Continue JSON files (`backend/data/*.json`), or migrate to Firestore? Firestore needed for multi-instance scaling, but JSON is fine for MVP.
2. **Streaming** — Worth implementing SSE for Chat now, or batch is enough for v1?
3. **Cost limits** — Already have plan-based quotas in `usage.py`. Should Crew runs deduct from same pool as Chat?
4. **Workspace persistence** — Right now Enterprise workspace state lives in browser `localStorage`. Need to move to backend before async agent runtime makes sense.

---

## File Index (where to put new code)

```
backend/app/
├── ai_ant/              ✅ Chat + Auto (extend with /route)
├── enterprise/          ⚠️ Intake done, add: workspace, runner, artifacts, decisions
├── crew/                ❌ NEW — entire module
├── workflows/           ❌ NEW — entire module
└── bridge/              ❌ NEW — start with connectors/drive.py + connectors/gmail.py

src/
├── lib/enterprise/      ⚠️ intakeApi.ts done, add: workspaceApi.ts, agentApi.ts
├── lib/crew/            ❌ NEW
├── lib/workflows/       ❌ NEW
├── lib/bridge/          ❌ NEW
└── pages/
    ├── one-man-enterprse/ ⚠️ canvas done, wire to backend
    ├── colony-crew/        ⚠️ mock UI exists, wire to /crew/run
    └── colony-bridge/      ⚠️ mock UI exists, wire to /bridge/*
```
