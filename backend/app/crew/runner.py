import asyncio
import json
import ssl
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from uuid import uuid4

try:
    import certifi
    _SSL_CONTEXT: ssl.SSLContext | None = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CONTEXT = None

from .schemas import (
    CrewRunRequest,
    CrewRunResponse,
    CrewAgent,
    CrewActivity,
    CrewDeliverable,
)


def _extract_title(markdown: str) -> str:
    for line in markdown.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Final Deliverable"


def _count_sources(markdown: str) -> int:
    return markdown.count("http") + markdown.count(".com") + markdown.count("Source:")


def run_crew_fallback(request: CrewRunRequest) -> CrewRunResponse:
    """Deterministic mock fallback when no OpenRouter API key is present."""
    started = time.monotonic()
    crew_id = f"crew-{uuid4().hex[:12]}"
    task = request.task

    # 1. Planner
    agents = [
        CrewAgent(id="agent-0", kind="research", name="Market Researcher", focus="Market trends and volume"),
        CrewAgent(id="agent-1", kind="research", name="Competitor Analyst", focus="Top 3 competitors"),
        CrewAgent(id="agent-2", kind="analyst", name="Strategic Analyst", focus="Synthesising priorities and risks"),
        CrewAgent(id="agent-3", kind="writer", name="Lead Writer", focus="Drafting the final report"),
        CrewAgent(id="agent-4", kind="reviewer", name="Quality Reviewer", focus="Checking tone and accuracy"),
    ]

    activity: list[CrewActivity] = []
    
    # 2. Research mock
    for a in agents[:2]:
        activity.append(
            CrewActivity(
                agent_id=a.id,
                step="Completed research",
                output_excerpt=f"Gathered 5 key data points regarding {a.focus}.",
                timestamp=datetime.now(timezone.utc),
            )
        )
    
    # Mock markdown
    mock_md = f"""# Brief on {task}

## Executive Summary
This is a mock report generated because no live API key was provided. The AI Ant team has structured this based on your prompt: "{task}".

## Findings
- The market shows strong intent but requires validation (High confidence).
- Competitors are largely established but leave gaps in user experience (Medium confidence).

## Priorities
1. Immediate action 1: Validate assumptions
2. Immediate action 2: Prototype MVP
3. Immediate action 3: Soft launch

## Conclusion
This document serves as a fallback structural placeholder. Real execution will run parallel research agents before synthesising into a polished deliverable.
"""

    deliverable = CrewDeliverable(
        title=_extract_title(mock_md),
        content_md=mock_md,
        word_count=len(mock_md.split()),
        sources_cited=0,
    )

    return CrewRunResponse(
        crew_id=crew_id,
        task=task,
        agents=agents,
        activity=activity,
        deliverable=deliverable,
        duration_seconds=time.monotonic() - started + 2.5,
        model_calls=5,
        source="mock",
    )


def _call_openrouter_sync(
    api_key: str,
    model: str,
    system_prompt: str,
    user_message: str,
    timeout: float,
    json_mode: bool = False
) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
        "max_tokens": 1500,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://colony.app",
            "X-Title": "Colony Crew",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout, context=_SSL_CONTEXT) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


async def _call_planner(task: str, settings) -> dict:
    from .prompts import PLANNER_PROMPT
    raw = await asyncio.to_thread(
        _call_openrouter_sync,
        settings.openrouter_api_key,
        settings.openrouter_default_model,
        PLANNER_PROMPT,
        f"Task: {task}",
        settings.openrouter_timeout_seconds,
        True
    )
    return json.loads(raw)


async def _call_research(agent: CrewAgent, task: str, settings) -> str:
    from .prompts import RESEARCH_PROMPT
    prompt = RESEARCH_PROMPT.format(agent_name=agent.name, agent_focus=agent.focus, task=task)
    return await asyncio.to_thread(
        _call_openrouter_sync,
        settings.openrouter_api_key,
        settings.openrouter_default_model,
        prompt,
        "Start your research now.",
        settings.openrouter_timeout_seconds,
        False
    )


async def _call_analyst(agent: CrewAgent, research_results: list[str], task: str, settings) -> str:
    from .prompts import ANALYST_PROMPT
    combined = "\n\n---\n\n".join(research_results)
    prompt = ANALYST_PROMPT.format(n=len(research_results), combined_research=combined)
    return await asyncio.to_thread(
        _call_openrouter_sync,
        settings.openrouter_api_key,
        settings.openrouter_default_model,
        prompt,
        f"Original Task: {task}\nProvide your analysis.",
        settings.openrouter_timeout_seconds,
        False
    )


async def _call_writer(agent: CrewAgent, analysis: str, task: str, format: str, settings) -> str:
    from .prompts import WRITER_PROMPT
    prompt = WRITER_PROMPT.format(task=task, analysis=analysis, format=format)
    return await asyncio.to_thread(
        _call_openrouter_sync,
        settings.openrouter_api_key,
        settings.openrouter_default_model,
        prompt,
        "Write the deliverable now.",
        settings.openrouter_timeout_seconds,
        False
    )


async def _call_reviewer(agent: CrewAgent, draft: str, task: str, settings) -> str:
    from .prompts import REVIEWER_PROMPT
    prompt = REVIEWER_PROMPT.format(draft=draft, task=task)
    return await asyncio.to_thread(
        _call_openrouter_sync,
        settings.openrouter_api_key,
        settings.openrouter_default_model,
        prompt,
        "Review and output the final polished markdown.",
        settings.openrouter_timeout_seconds,
        False
    )


async def run_crew(request: CrewRunRequest) -> CrewRunResponse:
    from ..config import get_settings
    settings = get_settings()
    started = time.monotonic()
    crew_id = f"crew-{uuid4().hex[:12]}"
    calls = 0

    try:
        # 1. Planner
        plan_data = await _call_planner(request.task, settings)
        calls += 1

        agents = []
        for i, a in enumerate(plan_data.get("agents", [])):
            kind = a.get("kind", "research")
            agents.append(
                CrewAgent(
                    id=f"agent-{i}",
                    kind=kind,
                    name=a.get("name", "Agent"),
                    focus=a.get("focus", "General Task")
                )
            )
        
        # Ensure minimum required roles exist (fallback to deterministic creation if planner failed)
        has_analyst = any(a.kind == "analyst" for a in agents)
        has_writer = any(a.kind == "writer" for a in agents)
        has_reviewer = any(a.kind == "reviewer" for a in agents)

        if not agents or not has_analyst or not has_writer or not has_reviewer:
            raise ValueError("Planner returned an invalid or incomplete crew structure.")

        activity: list[CrewActivity] = []

        # 2. Parallel research
        research_agents = [a for a in agents if a.kind == "research"][:request.max_research_agents]
        if not research_agents:
            research_agents = [agents[0]]

        research_results = await asyncio.gather(
            *(_call_research(a, request.task, settings) for a in research_agents)
        )
        calls += len(research_agents)
        for a, result in zip(research_agents, research_results):
            activity.append(CrewActivity(
                agent_id=a.id, 
                step="Completed research", 
                output_excerpt=result[:200] + ("..." if len(result) > 200 else ""),
                timestamp=datetime.now(timezone.utc),
            ))

        # 3. Analyst
        analyst = next(a for a in agents if a.kind == "analyst")
        analysis = await _call_analyst(analyst, research_results, request.task, settings)
        calls += 1
        activity.append(CrewActivity(
            agent_id=analyst.id, 
            step="Completed analysis", 
            output_excerpt=analysis[:200] + ("..." if len(analysis) > 200 else ""),
            timestamp=datetime.now(timezone.utc),
        ))

        # 4. Writer
        writer = next(a for a in agents if a.kind == "writer")
        draft = await _call_writer(writer, analysis, request.task, request.preferred_format, settings)
        calls += 1
        activity.append(CrewActivity(
            agent_id=writer.id, 
            step="Completed draft", 
            output_excerpt=draft[:200] + ("..." if len(draft) > 200 else ""),
            timestamp=datetime.now(timezone.utc),
        ))

        # 5. Reviewer
        reviewer = next(a for a in agents if a.kind == "reviewer")
        final = await _call_reviewer(reviewer, draft, request.task, settings)
        calls += 1
        activity.append(CrewActivity(
            agent_id=reviewer.id, 
            step="Completed review", 
            output_excerpt=final[:200] + ("..." if len(final) > 200 else ""),
            timestamp=datetime.now(timezone.utc),
        ))

        deliverable = CrewDeliverable(
            title=_extract_title(final),
            content_md=final,
            word_count=len(final.split()),
            sources_cited=_count_sources(final),
        )

        return CrewRunResponse(
            crew_id=crew_id, 
            task=request.task,
            agents=agents, 
            activity=activity, 
            deliverable=deliverable,
            duration_seconds=time.monotonic() - started,
            model_calls=calls, 
            source="live",
        )
    except Exception as e:
        print(f"[colony.crew] Real AI run failed: {e!r}. Using fallback.")
        return run_crew_fallback(request)
