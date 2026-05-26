/**
 * Boss Intake API client
 * Calls POST /enterprise/intake → returns AI-generated team
 */

export type IntakeRequest = {
  business_idea: string;
  target_customer: string;
  first_objective: string;
  user_id?: string;
};

export type AgentTemplate = {
  name: string;
  role: string;
  dept: string;
  first_task: string;
};

export type IntakeResponse = {
  project_id: string;
  project_title: string;
  business_type: string;
  team_rationale: string;
  agents: AgentTemplate[];
  source: 'openrouter' | 'fallback';
};

function getApiBase(): string | null {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const base = (configured || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
  return base || null;
}

export async function runBossIntake(request: IntakeRequest): Promise<IntakeResponse> {
  const apiBase = getApiBase();

  // ── Live backend ──────────────────────────────────────────────────────────
  if (apiBase) {
    const response = await fetch(`${apiBase}/enterprise/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, user_id: request.user_id ?? 'anonymous' }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Intake API error ${response.status}: ${detail}`);
    }
    return response.json() as Promise<IntakeResponse>;
  }

  // ── Client-side fallback (no backend running) ─────────────────────────────
  return clientFallbackIntake(request);
}

// ── Client-side fallback (mirrors backend logic) ──────────────────────────────

const FALLBACK_TEAMS: Record<string, AgentTemplate[]> = {
  ecommerce: [
    { name: 'AI Ant Director', role: 'CEO / Orchestrator — owns the operating plan', dept: 'Executive', first_task: '' },
    { name: 'Operations Manager', role: 'Coordinates tasks, handoffs, and deadlines', dept: 'Operations', first_task: 'Build fulfilment and shipping workflow' },
    { name: 'Marketing Lead', role: 'Growth strategy, ads, and content calendar', dept: 'Marketing', first_task: 'Draft 30-day launch content calendar across channels' },
    { name: 'Research Analyst', role: 'Market, competitor, and customer research', dept: 'Research', first_task: 'Map top 5 competitors: pricing, positioning, channels' },
    { name: 'Customer Success', role: 'Support, retention, and feedback loops', dept: 'Support', first_task: 'Write FAQ and first-contact support templates' },
    { name: 'Finance Analyst', role: 'Unit economics, pricing, and cash flow', dept: 'Finance', first_task: 'Build contribution margin model and break-even calculator' },
    { name: 'Quality Reviewer', role: 'Reviews all output before it ships or publishes', dept: 'Quality', first_task: 'Audit all customer-facing copy for clarity and brand voice' },
  ],
  saas: [
    { name: 'AI Ant Director', role: 'CEO / Orchestrator — product vision and execution', dept: 'Executive', first_task: '' },
    { name: 'Product Manager', role: 'Roadmap, specs, and user story writing', dept: 'Product', first_task: 'Write MVP feature spec and prioritised backlog' },
    { name: 'Growth Lead', role: 'Acquisition, activation, and retention loops', dept: 'Growth', first_task: 'Identify top acquisition channels and draft experiment backlog' },
    { name: 'Research Analyst', role: 'User research, competitor intel, and market sizing', dept: 'Research', first_task: 'Run 5-customer interview synthesis and competitor teardown' },
    { name: 'Content Strategist', role: 'SEO content, product marketing, and copy', dept: 'Marketing', first_task: 'Draft launch blog post and landing page copy' },
    { name: 'Finance Analyst', role: 'SaaS metrics, runway, and pricing model', dept: 'Finance', first_task: 'Build ARR projection with 3 pricing tier scenarios' },
    { name: 'Quality Reviewer', role: 'QA, brand consistency, and approval gating', dept: 'Quality', first_task: 'Review all outbound content and product copy' },
  ],
  agency: [
    { name: 'AI Ant Director', role: 'Managing Director — client strategy and oversight', dept: 'Executive', first_task: '' },
    { name: 'Project Manager', role: 'Coordinates client delivery and team workload', dept: 'Operations', first_task: 'Set up client onboarding workflow and timeline templates' },
    { name: 'Strategy Lead', role: 'Client strategy, proposals, and positioning', dept: 'Strategy', first_task: 'Draft agency capabilities deck and proposal template' },
    { name: 'Creative Lead', role: 'Conceptual direction, design, and creative output', dept: 'Creative', first_task: 'Define visual identity system and creative brief template' },
    { name: 'Content Writer', role: 'Copy, case studies, and content production', dept: 'Content', first_task: 'Write 3 client case study templates and agency bio' },
    { name: 'Biz Dev Agent', role: 'Lead gen, outreach, and pipeline management', dept: 'Sales', first_task: 'Build prospect list and draft outreach email sequence' },
    { name: 'Quality Reviewer', role: 'Reviews deliverables before client submission', dept: 'Quality', first_task: 'Create client approval checklist and QA process' },
  ],
  content: [
    { name: 'AI Ant Director', role: 'Editor-in-Chief — content strategy and growth', dept: 'Executive', first_task: '' },
    { name: 'Operations Manager', role: 'Publishing workflow, scheduling, and systems', dept: 'Operations', first_task: 'Build content pipeline from draft to published' },
    { name: 'Research Analyst', role: 'Topic research, trend spotting, and source curation', dept: 'Research', first_task: 'Identify top 20 topics by search demand and audience fit' },
    { name: 'Lead Writer', role: 'Long-form content, newsletters, and scripts', dept: 'Content', first_task: 'Write first 3 flagship pieces and email welcome sequence' },
    { name: 'Distribution Lead', role: 'SEO, social, repurposing, and audience growth', dept: 'Distribution', first_task: 'Build repurposing matrix: 1 post → 5 formats across channels' },
    { name: 'Monetisation Analyst', role: 'Revenue streams, sponsorships, and products', dept: 'Finance', first_task: 'Map monetisation options and draft first sponsorship pitch' },
    { name: 'Quality Reviewer', role: 'Fact-check, editorial standards, and brand voice', dept: 'Quality', first_task: 'Establish editorial style guide and review checklist' },
  ],
  general: [
    { name: 'AI Ant Director', role: 'CEO / Orchestrator — owns the goal and operating plan', dept: 'Executive', first_task: '' },
    { name: 'Operations Manager', role: 'Coordinates workstreams, timelines, and handoffs', dept: 'Operations', first_task: 'Break goal into tasks and assign agent responsibilities' },
    { name: 'Research Analyst', role: 'Gathers context, sources, and market intelligence', dept: 'Research', first_task: 'Collect relevant data, reports, and benchmark examples' },
    { name: 'Strategy Analyst', role: 'Synthesises research into decisions and priorities', dept: 'Strategy', first_task: 'Produce strategy brief: priorities, risks, and recommendations' },
    { name: 'Content Writer', role: 'Creates documents, plans, and deliverables', dept: 'Content', first_task: 'Draft the first key deliverable based on strategy brief' },
    { name: 'Finance Analyst', role: 'Budgets, projections, and financial modelling', dept: 'Finance', first_task: 'Build financial model or cost-benefit analysis' },
    { name: 'Quality Reviewer', role: 'Reviews output before it reaches you or ships', dept: 'Quality', first_task: 'Audit all deliverables for accuracy and completeness' },
  ],
};

function detectBusinessType(idea: string, customer: string, objective: string): string {
  const text = `${idea} ${customer} ${objective}`.toLowerCase();
  if (/store|shop|sell|coffee|product|retail|ecommerce|commerce|ร้าน|ขาย/.test(text)) return 'ecommerce';
  if (/saas|software|app|platform|subscription|tool|api|dashboard|b2b/.test(text)) return 'saas';
  if (/agency|freelance|client|design|consulting|studio/.test(text)) return 'agency';
  if (/newsletter|blog|creator|youtube|podcast|content|media/.test(text)) return 'content';
  return 'general';
}

function titleFromIdea(idea: string): string {
  const words = idea.trim().split(/\s+/).slice(0, 5);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function clientFallbackIntake(request: IntakeRequest): Promise<IntakeResponse> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 1400));
  const btype = detectBusinessType(request.business_idea, request.target_customer, request.first_objective);
  const baseAgents = FALLBACK_TEAMS[btype] ?? FALLBACK_TEAMS.general;
  const agents = baseAgents.map((a, i) => ({
    ...a,
    first_task: i === 0 ? request.first_objective : a.first_task,
  }));
  return {
    project_id: `enterprise-${Date.now()}`,
    project_title: titleFromIdea(request.business_idea),
    business_type: btype,
    team_rationale: `Team optimised for a ${btype} business targeting ${request.target_customer}.`,
    agents,
    source: 'fallback',
  };
}
