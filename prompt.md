# Colony — Build Handoff Prompt

> **For the AI picking this up**: Read this top-to-bottom before writing any code. You are continuing a partly-built product. Everything you need (existing patterns, conventions, file paths, decisions) is here. Do NOT re-derive — copy the patterns.

---

## 0 · Who you are and what to do

You are a senior full-stack engineer joining the Colony project. Your job: build **Colony Crew** (Phase A) and **Colony Bridge** (Phase B). Do NOT touch Automation/Workflow — the user will handle that later.

**Skip these unless explicitly asked:**
- Refactoring `src/App.tsx` (26k+ lines, fragile, monolithic — work around it)
- Auth system changes
- Adding new top-level deps without confirming

---

## 1 · Project context (read once, keep in your head)

**What Colony is**: AI operating system for solopreneurs. User picks a mode (Chat / Auto / Colony Crew / One-man Enterprise / Automation / Colony Bridge), describes a goal, and AI agents handle it.

**Repo**: https://github.com/fishinglol/ColonyBridge — main branch
**Tech stack**:
- Frontend: React 18 + TypeScript + Vite (port 3000)
- Backend: FastAPI (Python 3.10+) at `/backend` (port 8000)
- AI provider: **OpenRouter** (NEVER use OpenAI directly — already migrated)
- State: Firestore (logged-in users) + localStorage (anon fallback) + JSON files (backend MVP)
- Auth: Firebase Auth (`firebaseAuth.currentUser?.uid`)

**Run locally**:
```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload
# Terminal 2
npm run dev
```

---

## 2 · What's already done (don't rebuild)

| Feature | Status | Files |
|---|---|---|
| Chat (sync, real AI) | ✅ Done | `backend/app/ai_ant/*` |
| Auto routing → Chat | ✅ Done | `src/App.tsx` (existing classifier) |
| Boss Intake (3 Q → AI team) | ✅ Done | `backend/app/enterprise/intake.py`, `src/pages/one-man-enterprse/BossIntake.tsx` |
| Enterprise workspace (canvas UI) | ✅ Done | `src/pages/one-man-enterprse/EnterpriseWorkspace.tsx` |
| Workspace persistence (Firestore + localStorage offline-first) | ✅ Done | `src/lib/enterprise/workspaceRepo.ts` |
| OpenRouter provider | ✅ Done | `backend/app/ai_ant/providers.py::generate_openrouter_reply` |

| Feature | Status | What's needed |
|---|---|---|
| Colony Crew | ❌ Mock animation only | **YOU BUILD THIS** (Phase A) |
| Colony Bridge | ❌ Mock permission UI only | **YOU BUILD THIS** (Phase B) |
| Enterprise agent runtime | ❌ Mock simulation | Not your scope |
| Automation/Workflow | ❌ Mock template | Not your scope |

---

## 3 · Patterns to follow (copy these, don't invent new ones)

### 3.1 — OpenRouter call (Python)
**Pattern file**: [backend/app/enterprise/intake.py](backend/app/enterprise/intake.py) lines 90-130 (`_call_openrouter`)

Always use:
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Auth header: `Authorization: Bearer {settings.openrouter_api_key}`
- Extra headers: `HTTP-Referer: https://colony.app`, `X-Title: Colony <feature>`
- Use `urllib.request` (no extra deps — match existing style)
- Wrap errors in `ProviderError`, fall back to deterministic logic

### 3.2 — FastAPI router (Python)
**Pattern file**: [backend/app/enterprise/router.py](backend/app/enterprise/router.py)

- One router per feature: `APIRouter(prefix="/<feature>", tags=["<feature>"])`
- Register in `backend/app/main.py::create_app` with `app.include_router(...)`
- All requests have `user_id: str = "anonymous"` in Pydantic schema

### 3.3 — Frontend API client (TS)
**Pattern file**: [src/lib/enterprise/intakeApi.ts](src/lib/enterprise/intakeApi.ts)

- One file per feature under `src/lib/<feature>/`
- Read base URL: `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'`
- Always provide client-side fallback for when backend is unreachable (so dev demo works)

### 3.4 — React feature component (TSX)
**Pattern file**: [src/pages/one-man-enterprse/BossIntake.tsx](src/pages/one-man-enterprse/BossIntake.tsx)

- Functional component, hooks, no class components
- Framer Motion for transitions (`motion.div` with `initial/animate/exit`)
- Tailwind only — no CSS modules (one exception: legacy `.css` files already there)
- Lucide React for icons

### 3.5 — Settings & env
**Pattern file**: [backend/app/config.py](backend/app/config.py)

Add new env vars as `Settings` fields. Document in [backend/.env.example](backend/.env.example).

---

# PHASE A — Colony Crew

> **Build this first.** Self-contained, no OAuth, can demo to user same day.

## A.1 — What it is

User describes a one-time task ("Research the EV market and write a brief"). System spawns 3-5 specialist AI agents that collaborate **once**, then return a final deliverable. No persistence, no continuous work, no canvas.

**Key decision (locked-in)**: Synchronous, single-shot. One `POST /crew/run` returns the entire result (~20-30s). Internally runs 5-8 LLM calls. NO async, NO polling, NO background workers.

## A.2 — Architecture

```
   User prompt
        │
        ▼
┌────────────────────────────────────────────┐
│   POST /crew/run  (one request, ~25s)      │
│                                            │
│   1. PLANNER (1 LLM call)                  │
│       └─ Decides which 3-5 agents to spawn │
│          based on task                     │
│                                            │
│   2. RESEARCH PHASE (parallel, 2-4 calls)  │
│       ├─ Research agent A                  │
│       ├─ Research agent B                  │
│       └─ Research agent C                  │
│       (asyncio.gather)                     │
│                                            │
│   3. ANALYST (1 LLM call)                  │
│       └─ Synthesises research              │
│                                            │
│   4. WRITER (1 LLM call)                   │
│       └─ Produces final deliverable        │
│                                            │
│   5. REVIEWER (1 LLM call)                 │
│       └─ Polishes + flags issues           │
│                                            │
│   Returns: { crew_id, agents, activity,    │
│             deliverable }                  │
└────────────────────────────────────────────┘
        │
        ▼
   Frontend shows deliverable
```

## A.3 — Backend files to create

```
backend/app/crew/
├── __init__.py
├── schemas.py        ← Pydantic models
├── prompts.py        ← System prompts for each role
├── runner.py         ← Orchestrates planner → research → analyst → writer → reviewer
└── router.py         ← FastAPI route: POST /crew/run
```

Register in `backend/app/main.py`:
```python
from .crew.router import router as crew_router
app.include_router(crew_router)
```

## A.4 — Schemas (`backend/app/crew/schemas.py`)

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

AgentKind = Literal["research", "analyst", "writer", "reviewer"]

class CrewRunRequest(BaseModel):
    user_id: str = "anonymous"
    task: str = Field(min_length=5, max_length=2000)
    preferred_format: Literal["markdown", "brief", "report"] = "markdown"
    max_research_agents: int = 3

class CrewAgent(BaseModel):
    id: str
    kind: AgentKind
    name: str          # e.g. "Market Research Lead"
    focus: str         # e.g. "EV adoption trends in SEA"

class CrewActivity(BaseModel):
    agent_id: str
    step: str          # e.g. "Searched 12 sources"
    output_excerpt: str
    timestamp: datetime

class CrewDeliverable(BaseModel):
    title: str
    content_md: str    # markdown body
    word_count: int
    sources_cited: int

class CrewRunResponse(BaseModel):
    crew_id: str
    task: str
    agents: list[CrewAgent]
    activity: list[CrewActivity]
    deliverable: CrewDeliverable
    duration_seconds: float
    model_calls: int
    source: Literal["openrouter", "fallback"]
```

## A.5 — System prompts (`backend/app/crew/prompts.py`)

### Planner
```
You are the Crew Planner inside Colony. Given a user task, design the optimal 3-5 agent crew.

Output JSON only:
{
  "agents": [
    {"kind": "research", "name": "<descriptive>", "focus": "<what they research>"},
    ...
  ]
}

Rules:
- 1-3 research agents (each with distinct focus)
- 1 analyst
- 1 writer
- 1 reviewer
- Total: 4-6 agents
- Make agent names specific to the task domain
```

### Research agent (one per parallel call)
```
You are {agent.name}, a research specialist focused on: {agent.focus}.

Task context: {task}

Output 5-10 evidence-backed bullet points. Each bullet should:
- State a fact or finding
- Reference a source (URL or document if known)
- Note your confidence (high/medium/low)

Do NOT speculate. Do NOT write prose. Bullets only.
```

### Analyst
```
You are an Analyst. Below are research findings from {n} agents.

{combined_research}

Synthesise into:
1. Top 3 priorities (most actionable)
2. Top 3 risks
3. 2-3 strategic recommendations

Output: markdown with H2 headers.
```

### Writer
```
You are a Writer. Turn the analysis below into a polished {format} document.

Original task: {task}
Analysis: {analysis}

Output a complete, ready-to-share deliverable in markdown.
Include:
- Title (H1)
- Executive summary (3-5 sentences)
- Body with H2 sections
- Conclusion with concrete next steps

Aim for 400-800 words.
```

### Reviewer
```
You are a Quality Reviewer. Below is a draft deliverable.

{draft}

Your job:
1. Fix factual issues or weak claims
2. Improve clarity and structure
3. Ensure the deliverable directly answers the original task: {task}

Output the polished version (markdown). Do NOT add commentary.
```

## A.6 — Runner logic (`backend/app/crew/runner.py`)

```python
import asyncio
import json
import time
from uuid import uuid4

# Note: existing OpenRouter call is sync (urllib).
# For asyncio.gather to actually parallelise, wrap calls with
# asyncio.to_thread(call_openrouter_sync, ...) OR migrate to httpx async.
# Recommend httpx async for cleaner code (add to requirements.txt).

async def run_crew(request: CrewRunRequest) -> CrewRunResponse:
    started = time.monotonic()
    crew_id = f"crew-{uuid4().hex[:12]}"
    calls = 0

    # 1. Planner
    plan = await _call_planner(request.task)
    calls += 1

    agents = [CrewAgent(id=f"agent-{i}", **a) for i, a in enumerate(plan["agents"])]
    activity: list[CrewActivity] = []

    # 2. Parallel research
    research_agents = [a for a in agents if a.kind == "research"]
    research_results = await asyncio.gather(
        *(_call_research(a, request.task) for a in research_agents)
    )
    calls += len(research_agents)
    for a, result in zip(research_agents, research_results):
        activity.append(CrewActivity(
            agent_id=a.id, step="Completed research", output_excerpt=result[:200],
            timestamp=datetime.utcnow(),
        ))

    # 3. Analyst
    analyst = next(a for a in agents if a.kind == "analyst")
    analysis = await _call_analyst(analyst, research_results, request.task)
    calls += 1

    # 4. Writer
    writer = next(a for a in agents if a.kind == "writer")
    draft = await _call_writer(writer, analysis, request.task, request.preferred_format)
    calls += 1

    # 5. Reviewer
    reviewer = next(a for a in agents if a.kind == "reviewer")
    final = await _call_reviewer(reviewer, draft, request.task)
    calls += 1

    deliverable = CrewDeliverable(
        title=_extract_title(final),
        content_md=final,
        word_count=len(final.split()),
        sources_cited=_count_sources(final),
    )

    return CrewRunResponse(
        crew_id=crew_id, task=request.task,
        agents=agents, activity=activity, deliverable=deliverable,
        duration_seconds=time.monotonic() - started,
        model_calls=calls, source="openrouter",
    )
```

**Fallback (no API key)**: Generate a deterministic mock response with realistic-looking content from a template based on `task` keywords. Match the existing fallback pattern in `enterprise/intake.py`.

## A.7 — Router (`backend/app/crew/router.py`)

```python
from fastapi import APIRouter
from .runner import run_crew, run_crew_fallback
from .schemas import CrewRunRequest, CrewRunResponse
from ..config import get_settings

router = APIRouter(prefix="/crew", tags=["crew"])

@router.post("/run", response_model=CrewRunResponse)
async def run_endpoint(payload: CrewRunRequest) -> CrewRunResponse:
    settings = get_settings()
    use_live = not settings.ai_ant_mock_mode and bool(settings.openrouter_api_key)
    if use_live:
        return await run_crew(payload)
    return run_crew_fallback(payload)
```

## A.8 — Frontend integration

**Files to create**:
```
src/lib/crew/
└── crewApi.ts        ← API client + fallback
```

**Files to modify**:
- `src/App.tsx` — find `launchColonyCrew` (line ~24577). Replace its setTimeout-based animation with real `POST /crew/run` call. Show optimistic intermediate steps (fake "agent thinking" updates every 4s) while awaiting the real response.

**UX requirements**:
- User must see progress within 1 second (otherwise feels frozen)
- Show planned agents BEFORE research completes (display from `agents` array as soon as planner returns)
- Stream activity log as it happens if possible — otherwise show all at once on completion
- Final deliverable opens in a dedicated panel/modal with markdown rendering

## A.9 — Acceptance criteria for Phase A

- [ ] `POST /crew/run` with `{task: "Research EV market"}` returns 200 in < 35s
- [ ] Response includes ≥ 4 agents, ≥ 4 activity events, deliverable with word_count > 200
- [ ] `model_calls` field shows ≥ 5
- [ ] Fallback works when `OPENROUTER_API_KEY` is empty (returns deterministic mock)
- [ ] Frontend: clicking Colony Crew mode → typing task → seeing animated progress → seeing real deliverable
- [ ] `npx tsc --noEmit` passes
- [ ] No regression in Chat / Boss Intake

---

# PHASE B — Colony Bridge

> **Build this second.** Needs OAuth — more setup. Start with Google services only.

## B.1 — What it is

AI agents can request real-world actions (read a file, send an email). System asks user for permission, executes, returns result. **Every action requires explicit user approval** — no autonomous execution.

**Scope for v1 (do this)**: Google Drive + Gmail.
**Out of scope (do later)**: Browser automation, LINE/WhatsApp, file uploads.

## B.2 — Architecture

```
   Agent: "I need to read user's recent emails"
            │
            ▼
   POST /bridge/requests
   { service: "gmail", action: "list_recent", params: {n: 10}, risk: "low" }
            │
            ▼
   Server stores pending request, returns request_id
            │
            ▼
   Frontend polls /bridge/requests?status=pending
            │
            ▼
   User sees approval modal → clicks Approve
            │
            ▼
   POST /bridge/requests/{id}/approve
            │
            ▼
   POST /bridge/requests/{id}/execute
            │
            ▼
   Backend calls Gmail API (with user's OAuth token)
            │
            ▼
   Returns result to original agent / shows in UI
```

## B.3 — Backend files to create

```
backend/app/bridge/
├── __init__.py
├── schemas.py              ← Pydantic models
├── router.py               ← FastAPI routes
├── oauth.py                ← Google OAuth flow
├── permissions.py          ← Permission store (request lifecycle)
├── store.py                ← JSON file storage (data/bridge_*.json)
└── connectors/
    ├── __init__.py
    ├── gmail.py            ← Gmail API wrapper
    └── drive.py            ← Drive API wrapper
```

**New dependencies** (add to `backend/requirements.txt`):
```
google-auth==2.x
google-auth-oauthlib==1.x
google-api-python-client==2.x   # already installed via firebase-admin transitive
```

## B.4 — Endpoints

```
POST   /bridge/oauth/google/start           → returns Google OAuth URL
GET    /bridge/oauth/google/callback        → handles redirect, stores token
GET    /bridge/connections?user_id=         → list user's connected services
DELETE /bridge/connections/{service}        → disconnect

POST   /bridge/requests                     → agent creates an action request
GET    /bridge/requests?user_id=&status=    → list requests (poll for pending)
POST   /bridge/requests/{id}/approve        → user approves (only)
POST   /bridge/requests/{id}/reject         → user rejects
POST   /bridge/requests/{id}/execute        → actually run after approval
```

## B.5 — Schemas (`backend/app/bridge/schemas.py`)

```python
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel

Service = Literal["gmail", "drive"]
RiskLevel = Literal["low", "medium", "high"]
RequestStatus = Literal["pending", "approved", "rejected", "executed", "failed"]

class BridgeConnection(BaseModel):
    user_id: str
    service: Service
    connected_at: datetime
    scopes: list[str]
    email: str | None = None   # of the connected Google account

class BridgeRequest(BaseModel):
    id: str
    user_id: str
    service: Service
    action: str                # e.g. "list_recent_emails"
    params: dict[str, Any]
    risk: RiskLevel
    reason: str                # one-sentence WHY from the requesting agent
    requesting_agent_id: str | None = None
    status: RequestStatus
    created_at: datetime
    decided_at: datetime | None = None
    executed_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
```

## B.6 — OAuth flow (`backend/app/bridge/oauth.py`)

Use Google OAuth 2.0 web server flow. Scopes for v1:
- Drive: `https://www.googleapis.com/auth/drive.readonly`, `https://www.googleapis.com/auth/drive.file`
- Gmail: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.compose`

Add to `.env`:
```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/bridge/oauth/google/callback
```

Store user tokens in `backend/data/bridge_tokens.json` (encrypted in production, plain for MVP).

## B.7 — Connector actions to implement (minimum viable)

### Gmail (`connectors/gmail.py`)
| Action | Params | Risk | Returns |
|---|---|---|---|
| `list_recent` | `{n: int}` | low | list of `{from, subject, snippet, date, id}` |
| `read_email` | `{id: str}` | low | `{from, to, subject, body, attachments}` |
| `draft_reply` | `{thread_id, body}` | medium | `{draft_id, preview}` |
| `send_email` | `{to, subject, body}` | **high** | `{message_id, sent_at}` |

### Drive (`connectors/drive.py`)
| Action | Params | Risk | Returns |
|---|---|---|---|
| `list_recent` | `{n: int, mime?: str}` | low | list of `{id, name, mime, modified}` |
| `read_file` | `{id: str}` | low | `{content, mime}` (text-based files) |
| `search` | `{query: str}` | low | matching files |
| `create_doc` | `{name, content}` | medium | `{id, url}` |

## B.8 — Frontend files to create

```
src/lib/bridge/
├── bridgeApi.ts          ← API client
└── bridgeTypes.ts        ← shared types

src/pages/colony-bridge/
└── BridgeConnections.tsx ← OAuth connect UI + connected services list

src/components/bridge/
├── PermissionModal.tsx   ← shown when agent requests an action
└── RequestHistory.tsx    ← user's bridge request log
```

**Files to modify**:
- `src/pages/colony-bridge/index.tsx` — already has mock device action UI. Wire the mock buttons to real `bridgeApi` calls.
- `src/App.tsx` — find existing `startDeviceAction` (line ~unknown, grep for it). Replace its mock setTimeout flow with real bridge polling.

## B.9 — Permission modal UX

When a bridge request is pending, show a modal with:
- **Title**: "Colony Bridge wants permission"
- **Service icon + name**: "Gmail · Read recent emails"
- **Requesting agent** (if any): "Research Agent in 'Coffee Brand' workspace"
- **Reason** (1 sentence from agent): "I need to scan for customer feedback emails"
- **Risk badge**: 🟢 Low / 🟡 Medium / 🔴 High
- **What will happen**: bullet list of data accessed
- **Buttons**: Approve once · Approve for this workspace · Reject

For HIGH risk (send_email, delete, etc.): require typing "approve" to confirm.

## B.10 — Acceptance criteria for Phase B

- [ ] User can click "Connect Gmail" → Google OAuth → back to Colony with Gmail showing as connected
- [ ] Agent (or test button) can request "list_recent emails" → permission modal appears
- [ ] On approve → emails appear in UI within 3s
- [ ] Disconnect Gmail → token deleted, requests for Gmail fail with clear error
- [ ] HIGH risk actions (send_email) require typing "approve"
- [ ] All requests visible in request history with status
- [ ] `npx tsc --noEmit` passes
- [ ] No regression in other modes

---

## 4 · Build order & checkpoints

### Day 1 — Crew scaffolding
- Create `backend/app/crew/{__init__.py, schemas.py, prompts.py, router.py}`
- Implement runner with **fallback only** (no LLM calls yet)
- Wire route, test with curl: `curl -X POST localhost:8000/crew/run -d '{"task":"Test"}' -H 'Content-Type: application/json'`
- ✓ Checkpoint: returns valid response shape

### Day 2 — Crew real AI
- Implement `_call_planner`, `_call_research`, `_call_analyst`, `_call_writer`, `_call_reviewer`
- Test with real `OPENROUTER_API_KEY` set
- ✓ Checkpoint: full crew run < 35s, deliverable looks human

### Day 3 — Crew frontend
- Create `src/lib/crew/crewApi.ts`
- Wire `launchColonyCrew` in App.tsx to real call
- Polish loading UX with optimistic progress
- ✓ Checkpoint: full E2E from user click to deliverable display

### Day 4 — Bridge OAuth + Gmail
- Create `backend/app/bridge/*` files
- Implement Google OAuth flow + token storage
- Implement Gmail `list_recent` + `read_email`
- ✓ Checkpoint: user can connect Gmail and list inbox via curl

### Day 5 — Bridge Drive + permission UI
- Implement Drive `list_recent` + `read_file` + `search`
- Build PermissionModal component
- Wire to existing `startDeviceAction` in App.tsx
- ✓ Checkpoint: end-to-end flow works in browser

### Day 6 — Polish + edge cases
- HIGH-risk confirmation flow
- Disconnect / revoke
- Error states (expired token, API quota)
- Update `COLONY_CHAT_MODES.md` status table
- ✓ Checkpoint: ready for user testing

---

## 5 · Decisions already locked-in (don't re-debate)

| Decision | Choice | Why |
|---|---|---|
| Crew runtime | Sync, one-shot | User: "AI Crew ทำงานแค่ครั้งเดียวเหมือนกับ AI เอเจ้นทั่วไป" |
| Enterprise runtime | Async, continuous | User: "one-man enterprise ทำงานแบบต่อเนื่อง" |
| Agent comms | Graph network | User: "use arc network for communication" |
| AI provider | OpenRouter only | User explicit |
| Bridge first connectors | Drive + Gmail | Lowest risk + MCP precedent exists |
| State storage (workspaces) | Firestore + localStorage offline-first | Already implemented |
| State storage (crew/bridge MVP) | JSON files in `backend/data/` | Match existing pattern |
| Streaming | Batch responses for v1 | Defer SSE until users complain |
| Cost pool | Separate (TBD) | Not your scope — leave token tracking as-is |

---

## 6 · Don't do these

- ❌ Don't refactor `src/App.tsx`. It's 26k lines. Surgical edits only.
- ❌ Don't add a new state library (Redux, Zustand, etc.). Existing `useState` + `localStorage` + `workspaceRepo` pattern is the convention.
- ❌ Don't migrate JSON file storage to Firestore for crew/bridge. MVP only — file storage is fine.
- ❌ Don't add tests yet. There are none — match the existing repo (manual testing for now).
- ❌ Don't reformat or lint existing files. PR diff should be additive where possible.
- ❌ Don't import from `pages/one-man-enterprse/oneManEnterprise.tsx` types unless you have to — App.tsx redefines its own. Use enterprise types only inside the `pages/one-man-enterprse/` folder.

---

## 7 · How to verify before saying "done"

```bash
# 1. Type check
npx tsc --noEmit
# Expect: EXIT:0, no errors

# 2. Backend imports
cd backend && python3 -c "from app.main import app; print('OK')"

# 3. Crew smoke test
curl -X POST http://localhost:8000/crew/run \
  -H "Content-Type: application/json" \
  -d '{"task":"Brief on competitive coffee brands"}' | python3 -m json.tool

# 4. Bridge smoke test (after OAuth setup)
curl http://localhost:8000/bridge/oauth/google/start
# Open URL in browser, complete flow
curl "http://localhost:8000/bridge/connections?user_id=test@example.com"

# 5. Frontend E2E (manual)
# - Open localhost:3000
# - Select Colony Crew → type task → see deliverable
# - Select Colony Bridge → connect Gmail → see inbox
```

---

## 8 · When you finish each phase

```bash
# Commit per phase, not per file
git add -A
git commit -m "feat(crew): implement Colony Crew with planner/research/analyst/writer/reviewer pipeline

- Backend: POST /crew/run (sync, ~25s, 5+ LLM calls)
- Frontend: replace mock launchColonyCrew with real API
- Fallback: deterministic mock when no API key

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

Update **THIS FILE** at the bottom with what you completed + any new locked-in decisions.

---

## 9 · Repo state snapshot (when this was written)

- Last commit: `9e08d5f feat: migrate enterprise workspace persistence from localStorage to Firestore`
- Branch: `main`
- Working: Chat, Auto chat, Boss Intake, Enterprise canvas (visual only)
- Not working: Crew, Bridge, Workflow, Enterprise agent execution
- Backend: FastAPI running on port 8000
- Frontend: Vite running on port 3000
- AI: OpenRouter (mock fallback if no key)
- Storage: Firestore for workspaces, JSON files for everything else

---

## Completed by handoff AI (update this section as you go)

<!-- AI: write what you finished here -->

- [ ] Phase A — Colony Crew backend
- [ ] Phase A — Colony Crew frontend integration
- [ ] Phase B — Colony Bridge OAuth + Gmail
- [ ] Phase B — Colony Bridge Drive + permission UI
- [ ] Phase B — Polish & error states

---

**End of prompt. Read sections 0-3 again if you're unsure where to start. Begin with Phase A, section A.3 — create the file scaffold first.**
