# Colony — Claude Code Guidelines

Behavioral guidelines for working on this codebase.
Karpathy principles (§1–4) apply to all tasks. Colony conventions (§5–8) are project-specific.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Frontend Conventions

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion

### File placement
- New **page-level components** → `src/pages/<feature>/ComponentName.tsx`
  - e.g. `src/pages/ai-ant/AIRoutingCard.tsx`, `src/pages/colony-bridge/BridgeConnections.tsx`
- New **reusable UI** shared across pages → `src/components/<category>/ComponentName.tsx`
- New **library/logic** (no JSX) → `src/lib/<feature>/featureName.ts`
- Do NOT add new top-level components inside `src/App.tsx` — it is already too large.
  Extract into the correct folder and import back.

### Imports
- Import types and constants from `src/lib/aiOrchestration.ts` (e.g. `RoutingDecision`, `CAPABILITY_LABELS`, `EXPENSIVE_CAPABILITIES`).
- Use named exports, not default exports, for all new components.

### Styling
- Use Tailwind utility classes. Match opacity notation already in the file (e.g. `text-white/52`, `bg-white/[0.03]`).
- Don't switch between Tailwind and inline `style={}` unless the file already mixes both.

### Type-checking
- Run `npx tsc --noEmit` after every structural change. Zero errors is required before finishing.

---

## 6. Backend Conventions

**Stack:** Python + FastAPI + Pydantic Settings + `json_store.py` for persistence

### Module structure
Each feature is a self-contained package:
```
backend/app/<feature>/
    __init__.py     ← exports the FastAPI router
    router.py       ← route handlers
    schemas.py      ← Pydantic request/response models
    <logic>.py      ← business logic, no FastAPI imports
```

Register the router in `backend/app/main.py` — don't create standalone FastAPI apps.

### AI provider
- **Primary:** OpenRouter (`openrouter_api_key` in Settings, base `https://openrouter.ai/api/v1`)
- **Fallback:** OpenAI (`openai_api_key` in Settings)
- Always check `settings.openrouter_api_key` first. Never hardcode provider order in a new module — follow the pattern in `backend/app/ai_ant/orchestrator.py`.

### Persistence
- Use `JsonStore` from `backend/app/json_store.py` for local/mock data.
- All data files live in `backend/backend/data/*.json`.
- Never read/write JSON files directly — always go through `JsonStore`.

### Settings
- All config goes through `get_settings()` from `backend/app/config.py` (Pydantic `BaseSettings`).
- Never `os.environ.get()` directly in route handlers or business logic.

---

## 7. Git & Push Conventions

- TypeScript must compile (`npx tsc --noEmit`) before committing.
- Commit messages: `<type>: <summary>` — types: `feat`, `fix`, `refactor`, `docs`, `chore`.
- End commit messages with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Never commit: `.env`, `.env.*`, `settings.local.json`, `*.pyc`, `__pycache__/`.
  These are already in `.gitignore` — verify before staging new file types.
- Remote: `https://github.com/fishinglol/ColonyBridge.git` (branch: `main`)

---

## 8. These Guidelines Are Working If

- Diffs contain only lines that trace to the request — no drive-by formatting.
- New components appear in `src/pages/<feature>/` or `src/components/`, not in `App.tsx`.
- `npx tsc --noEmit` passes after every change.
- Clarifying questions come **before** implementation, not after mistakes.
- Backend features follow the `router / schemas / logic` module pattern.
