import { CrewRunResponse } from './crewTypes';

function getApiBase(): string | null {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const base = (configured || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
  return base || null;
}

export async function runColonyCrew(task: string): Promise<CrewRunResponse> {
  const apiBase = getApiBase();

  if (apiBase) {
    try {
      const response = await fetch(`${apiBase}/crew/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Crew API error ${response.status}: ${detail}`);
      }
      return response.json() as Promise<CrewRunResponse>;
    } catch (e) {
      console.warn("Crew API fetch failed, falling back to client-side mock:", e);
    }
  }

  return clientFallbackCrew(task);
}

async function clientFallbackCrew(task: string): Promise<CrewRunResponse> {
  await new Promise((r) => setTimeout(r, 2500));
  return {
    crew_id: `crew-${Date.now()}`,
    task,
    agents: [
      { id: 'agent-0', kind: 'research', name: 'Market Researcher', focus: 'Market trends and volume' },
      { id: 'agent-1', kind: 'research', name: 'Competitor Analyst', focus: 'Top 3 competitors' },
      { id: 'agent-2', kind: 'analyst', name: 'Strategic Analyst', focus: 'Synthesising priorities and risks' },
      { id: 'agent-3', kind: 'writer', name: 'Lead Writer', focus: 'Drafting the final report' },
      { id: 'agent-4', kind: 'reviewer', name: 'Quality Reviewer', focus: 'Checking tone and accuracy' },
    ],
    activity: [
      { agent_id: 'agent-0', step: 'Completed research', output_excerpt: 'Gathered 5 key data points.', timestamp: new Date().toISOString() },
      { agent_id: 'agent-1', step: 'Completed research', output_excerpt: 'Gathered 5 key data points.', timestamp: new Date().toISOString() },
    ],
    deliverable: {
      title: `Brief on ${task}`,
      content_md: `# Brief on ${task}\n\nClient-side mock deliverable due to fetch failure.`,
      word_count: 10,
      sources_cited: 0,
    },
    duration_seconds: 2.5,
    model_calls: 5,
    source: 'mock',
  };
}
