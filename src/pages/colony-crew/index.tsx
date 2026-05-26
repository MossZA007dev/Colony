import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, ChevronRight, Loader2, Minus, Pause, Play, Send, Sparkles, Square, Users, X } from 'lucide-react';
import { CAPABILITY_LABELS, createAgentSkill, resolveModelForCapability, routeCapability, type AgentCapability, type AgentSkill, type ModelConfig, type ModelProvider } from '../../lib/aiOrchestration';

export type SwarmState = 'analyzing_goal' | 'matching_agents' | 'creating_agents' | 'assigning_tasks' | 'agents_working' | 'reviewing_outputs' | 'deliverable_ready';

const PROVIDER_LABELS: Record<ModelProvider, string> = { auto: 'Auto', colony: 'Colony', openai: 'OpenAI', gemini: 'Gemini', deepseek: 'DeepSeek', perplexity: 'Perplexity', anthropic: 'Anthropic', elevenlabs: 'ElevenLabs', runway: 'Runway', pika: 'Pika', custom: 'Custom' };

function skillsForCapabilities(capabilities: AgentCapability[]): AgentSkill[] { return Array.from(new Set(capabilities)).map((capability) => createAgentSkill(capability)); }
function resolveSkillModel(skill: AgentSkill, activeModel?: ModelConfig) { return activeModel?.capability === skill.capability ? resolveModelForCapability(skill.capability, activeModel) : resolveModelForCapability(skill.capability, { provider: skill.provider, modelName: skill.modelName, mode: skill.mode }); }
function SkillModelPills({ skills, activeModel, compact = false }: { skills?: AgentSkill[]; activeModel?: ModelConfig; compact?: boolean }) {
  if (!skills?.length) return null;
  return <div className={compact ? 'mt-1 flex flex-wrap gap-1' : 'flex flex-wrap gap-1.5'}>{skills.slice(0, compact ? 2 : 4).map((skill) => { const resolved = resolveSkillModel(skill, activeModel); return <span key={skill.id} className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-0.5 text-[9px] font-semibold text-white/42">{CAPABILITY_LABELS[skill.capability]} · {resolved.displayName}</span>; })}</div>;
}

export type AgentAvatarColor = 'green' | 'amber' | 'blue' | 'purple' | 'gray';

interface OrchAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  status: 'idle' | 'running' | 'waiting' | 'queued' | 'done' | 'error';
  position: { x: number; y: number };
  currentTask?: string;
}

interface OrchMessage {
  id: string;
  from: string;
  to?: string;
  content: string;
  timestamp: string;
  type: 'user' | 'task' | 'handoff' | 'result' | 'system';
}

export interface MatchedAgent {
  id: string;
  name: string;
  role: string;
  avatarInitial: string;
  avatarColor: AgentAvatarColor;
  status: 'running' | 'queued' | 'waiting' | 'done' | 'error';
  currentTask?: string;
  matchedBy: 'ai' | 'user';
  matchScore?: number;
}

export type CrewStatus = 'matching' | 'creating_agents' | 'running' | 'reviewing' | 'completed' | 'stopped';
export type CrewAgentStatus = 'candidate' | 'matched' | 'creating' | 'working' | 'waiting' | 'done';
export type CrewTaskStatus = 'todo' | 'running' | 'done';

export type CrewAgent = {
  id: string;
  name: string;
  role: string;
  description: string;
  status: CrewAgentStatus;
  avatar: string;
  task: string;
  progress: number;
};

export type CrewTask = {
  id: string;
  title: string;
  assignedAgentId: string;
  status: CrewTaskStatus;
};

export type CrewRun = {
  id: string;
  title: string;
  userPrompt: string;
  status: CrewStatus;
  agents: CrewAgent[];
  tasks: CrewTask[];
};



function titleFromGoal(goal: string): string {
  const clean = goal.replace(/[^\w\s-]/g, '').trim();
  return clean.split(/\s+/).slice(0, 4).join(' ') || 'New AI Project';
}

// ── analyzeAndMatchAgents ─────────────────────────────────────────────────────

export function analyzeAndMatchAgents(task: string): { agents: MatchedAgent[]; reason: string } {
  const t = task.toLowerCase();
  const selected: MatchedAgent[] = [];
  const colors: AgentAvatarColor[] = ['green', 'amber', 'blue', 'purple'];

  const needsResearch = /search|find|look|gather|collect|research|data|read|pdf|file|report|analyz/.test(t);
  const needsAnalysis = /analyz|insight|pattern|trend|compare|metric|summary|stat|report|process/.test(t);
  const needsWriting  = /write|draft|document|email|summary|format|compose|report|letter|proposal|creat/.test(t);
  const needsReview   = /review|check|qa|fact|verify|approve|proofread|quality|correct|audit/.test(t);
  const anyMatched    = needsResearch || needsAnalysis || needsWriting || needsReview;

  if (needsResearch || !anyMatched)
    selected.push({ id: 'oa-research', name: 'Research', role: 'Scout & gather information',
      avatarInitial: 'R', avatarColor: colors[0], status: 'queued', matchedBy: 'ai', matchScore: 92 });
  if (needsAnalysis || !anyMatched)
    selected.push({ id: 'oa-analyst', name: 'Analyst', role: 'Analyse & synthesise data',
      avatarInitial: 'A', avatarColor: colors[1], status: 'queued', matchedBy: 'ai', matchScore: 85 });
  if (needsWriting)
    selected.push({ id: 'oa-writer', name: 'Writer', role: 'Draft & format outputs',
      avatarInitial: 'W', avatarColor: colors[2], status: 'queued', matchedBy: 'ai', matchScore: 88 });
  if (needsReview)
    selected.push({ id: 'oa-reviewer', name: 'Reviewer', role: 'QA & fact-check',
      avatarInitial: 'Rv', avatarColor: colors[3], status: 'queued', matchedBy: 'ai', matchScore: 79 });

  const n = selected.length;
  return { agents: selected, reason: `AI matched ${n} agent${n !== 1 ? 's' : ''} to your task` };
}

export function crewAvatarForName(name: string): string {
  const n = (name ?? '').toLowerCase();
  if (/research/.test(n)) return '/assets/agents/9.png';
  if (/analyst|data|finance/.test(n)) return '/assets/agents/10.png';
  if (/writer|content|marketing/.test(n)) return '/assets/agents/11.png';
  if (/quality|checker|review/.test(n)) return '/assets/agents/12.png';
  return '/assets/agents/14.png';
}

export function buildDefaultCrewRun(prompt: string): CrewRun {
  const agents: CrewAgent[] = [
    { id: 'crew-research', name: 'Research Agent', role: 'Context scout', description: 'Gathers context and source material', status: 'matched', avatar: '/assets/agents/9.png', task: 'Research source material and gather context', progress: 0 },
    { id: 'crew-analyst', name: 'Analyst Agent', role: 'Insight analyst', description: 'Extracts patterns, risks, and key insights', status: 'matched', avatar: '/assets/agents/10.png', task: 'Extract patterns, risks, and key insights', progress: 0 },
    { id: 'crew-writer', name: 'Writer Agent', role: 'Draft builder', description: 'Creates the final answer or report draft', status: 'matched', avatar: '/assets/agents/11.png', task: 'Create the final answer or report draft', progress: 0 },
    { id: 'crew-reviewer', name: 'Reviewer Agent', role: 'Quality reviewer', description: 'Checks clarity, consistency, and missing details', status: 'matched', avatar: '/assets/agents/12.png', task: 'Check clarity, consistency, and missing details', progress: 0 },
  ];
  return {
    id: `crew-${Date.now()}`,
    title: titleFromGoal(prompt),
    userPrompt: prompt,
    status: 'matching',
    agents,
    tasks: [
      { id: 'ct-understand', title: 'Understand task', assignedAgentId: 'crew-research', status: 'running' },
      { id: 'ct-context', title: 'Gather context', assignedAgentId: 'crew-research', status: 'todo' },
      { id: 'ct-insights', title: 'Extract insights', assignedAgentId: 'crew-analyst', status: 'todo' },
      { id: 'ct-draft', title: 'Draft output', assignedAgentId: 'crew-writer', status: 'todo' },
      { id: 'ct-review', title: 'Review quality', assignedAgentId: 'crew-reviewer', status: 'todo' },
    ],
  };
}


// ── Colony Crew right-side panel ──────────────────────────────────────────────
// Slide-in execution viewer. Opens only when the user picked "Colony Crew" mode
// and submitted a task. Process lives here; final result returns to the chat.

export type CrewPhase = 'matching' | 'crew_ready' | 'running' | 'reviewing' | 'completed' | 'stopped';

export type CrewAgentKind = 'research' | 'analyst' | 'writer' | 'reviewer';

export interface CrewPanelAgent {
  id: string;
  name: string;
  shortId: string;
  kind: CrewAgentKind;
  role: string;
  avatar: string;
  status: 'matching' | 'matched' | 'working' | 'done';
  progress: number;
  currentTask: string;
  thinkingSummary: string;
  outputSoFar: string;
  toolsUsed: string[];
  skills: AgentSkill[];
  activeModel?: ModelConfig;
  // Structured mock workspace content — shaped so real data can plug in later.
  notes: string[];
  sources: { title: string; snippet: string }[];
  insights: string[];
  patterns: string[];
  draftSections: { title: string; body: string }[];
  checklist: { item: string; ok: boolean }[];
  instructionMessages: AgentInstructionMessage[];
}

export interface AgentInstructionMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  createdAt: string;
}

export interface CrewActivityEvent {
  id: string;
  text: string;
  ts: string;
}

export interface CrewControlMessage {
  id: string;
  senderType: 'user' | 'agent' | 'system';
  senderId?: string;
  senderName?: string;
  targetId?: string;
  targetName?: string;
  text: string;
  createdAt: string;
}

export interface ColonyCrewSession {
  task: string;
  phase: CrewPhase;
  stepIndex: number;
  agents: CrewPanelAgent[];
  activity: CrewActivityEvent[];
  control: CrewControlMessage[];
  paused: boolean;
  resultMsgId: string | null;
}

const CREW_CONTROL_TARGETS_EXTRA = [
  { id: 'crew', name: 'Full Crew' },
  { id: 'director', name: 'AI Ant / Director' },
];

type CrewControlIntent = 'stop' | 'pause' | 'resume' | 'update' | 'reassign' | 'refine';

export function parseCrewControl(text: string): { intent: CrewControlIntent; reassignTo?: string } {
  const t = text.trim().toLowerCase();
  if (/^\/stop\b/.test(t) || t === 'stop' || /\b(stop|halt|abort|cancel)\b/.test(t)) return { intent: 'stop' };
  if (/^\/pause\b/.test(t) || /\bpause\b/.test(t) || /\bhold on\b|\bwait up\b/.test(t)) return { intent: 'pause' };
  if (/^\/resume\b/.test(t) || /\b(resume|continue|carry on|keep going|proceed)\b/.test(t)) return { intent: 'resume' };
  if (/^\/update\b/.test(t) || /\b(update|status|progress|how('?s| is) it going)\b/.test(t)) return { intent: 'update' };
  if (/^\/reassign\b/.test(t) || /\breassign\b|hand (this |it )?(over|off)|give (this|it) to\b/.test(t)) {
    const m = t.match(/(research|analyst|writer|reviewer)/);
    return { intent: 'reassign', reassignTo: m?.[1] };
  }
  return { intent: 'refine' };
}

export const CREW_MATCHING_STEPS = [
  'Reading task intent…',
  'Detecting required skills…',
  'Searching available agents…',
  'Matching specialist agents…',
  'Assigning responsibilities…',
  'Crew ready.',
];

const CREW_AGENT_WORK_LABEL: Record<CrewAgentKind, string> = {
  research: 'Researching',
  analyst: 'Analyzing',
  writer: 'Drafting',
  reviewer: 'Reviewing',
};

function crewAgentStatusLabel(a: CrewPanelAgent): string {
  if (a.status === 'done') return 'Done';
  if (a.status === 'working') return CREW_AGENT_WORK_LABEL[a.kind];
  return 'Waiting';
}

export function buildColonyCrewAgents(): CrewPanelAgent[] {
  return [
    {
      id: 'cc-research', name: 'Research Agent', shortId: 'RA', kind: 'research', role: 'Context scout',
      avatar: '/assets/agents/9.png', status: 'matching', progress: 0,
      currentTask: 'Gathering sources and context',
      thinkingSummary: 'Identifying the most relevant information and grouping it for the analyst.',
      outputSoFar: 'Initial source notes and context summary',
      toolsUsed: ['Web search', 'File reader'],
      skills: skillsForCapabilities(['web_research', 'summarization']),
      activeModel: routeCapability('web_research'),
      notes: [
        'Scoped the request into 3 sub-topics to search in parallel.',
        'Prioritising recent and high-signal sources over volume.',
      ],
      sources: [
        { title: 'Primary context source', snippet: 'Baseline definitions and the current landscape relevant to the task.' },
        { title: 'Comparative reference', snippet: 'Adjacent examples used to frame trade-offs and options.' },
        { title: 'Supporting data point', snippet: 'A figure/quote that anchors the analyst’s evaluation.' },
      ],
      insights: [], patterns: [], draftSections: [], checklist: [], instructionMessages: [],
    },
    {
      id: 'cc-analyst', name: 'Analyst Agent', shortId: 'AN', kind: 'analyst', role: 'Insight analyst',
      avatar: '/assets/agents/10.png', status: 'matching', progress: 0,
      currentTask: 'Extracting insights and patterns',
      thinkingSummary: 'Looking for key themes, decision points, and risks across the gathered material.',
      outputSoFar: 'Key insights and structured observations',
      toolsUsed: ['Data analysis'],
      skills: skillsForCapabilities(['text_reasoning', 'data_analysis']),
      activeModel: routeCapability('data_analysis'),
      notes: ['Cross-checking research notes against the original task intent.'],
      sources: [],
      insights: [
        'The strongest signal points to a clear primary direction.',
        'Two factors carry most of the decision weight.',
        'One assumption needs validation before drafting.',
      ],
      patterns: [
        'Recurring theme across sources reinforces the main finding.',
        'Risk: a gap in coverage that the reviewer should flag.',
      ],
      draftSections: [], checklist: [], instructionMessages: [],
    },
    {
      id: 'cc-writer', name: 'Writer Agent', shortId: 'WR', kind: 'writer', role: 'Draft builder',
      avatar: '/assets/agents/11.png', status: 'matching', progress: 0,
      currentTask: 'Drafting the deliverable',
      thinkingSummary: 'Turning research and insights into a clear, readable report.',
      outputSoFar: 'Draft outline and first section',
      toolsUsed: ['Document builder'],
      skills: skillsForCapabilities(['text_reasoning', 'summarization']),
      activeModel: routeCapability('text_reasoning'),
      notes: ['Mirroring the structure expected in the final chat result.'],
      sources: [], insights: [], patterns: [],
      draftSections: [
        { title: 'Summary', body: 'One-paragraph framing of what the crew worked through and the outcome.' },
        { title: 'Key findings', body: 'Bulleted findings sourced from the analyst’s structured observations.' },
        { title: 'Recommended next steps', body: 'Actionable follow-ups for the user to review or approve.' },
      ],
      checklist: [], instructionMessages: [],
    },
    {
      id: 'cc-reviewer', name: 'Reviewer Agent', shortId: 'RV', kind: 'reviewer', role: 'Quality reviewer',
      avatar: '/assets/agents/12.png', status: 'matching', progress: 0,
      currentTask: 'Reviewing output quality',
      thinkingSummary: 'Checking for clarity, missing details, and consistency.',
      outputSoFar: 'Review checklist and flagged issues',
      toolsUsed: ['QA checklist'],
      skills: skillsForCapabilities(['quality_review', 'summarization']),
      activeModel: routeCapability('quality_review'),
      notes: ['Will not block completion for low-severity nits.'],
      sources: [], insights: [], patterns: [], draftSections: [],
      checklist: [
        { item: 'Answers the original task intent', ok: true },
        { item: 'Findings traceable to research', ok: true },
        { item: 'No unstated assumptions', ok: false },
        { item: 'Clear, consistent structure', ok: true },
      ],
      instructionMessages: [],
    },
  ];
}

export function buildColonyCrewResult(task: string): string {
  const t = task.trim().replace(/\s+/g, ' ');
  const short = t.length > 90 ? `${t.slice(0, 90)}…` : t;
  return [
    'Here’s the completed result from your Colony Crew:',
    '',
    'Summary',
    `The crew worked through "${short}" — research gathered the context, analysis surfaced the key factors, a draft was produced, and a reviewer checked it for clarity and consistency.`,
    '',
    'Key findings',
    '• The task was broken into research, analysis, drafting, and review so each part had a dedicated specialist.',
    '• The most decision-relevant points were prioritised before drafting the response.',
    '• The draft was reviewed for missing details, clarity, and internal consistency.',
    '',
    'Recommended next steps',
    '1. Review the draft output and adjust scope or emphasis if needed.',
    '2. Approve to turn this into a reusable deliverable or workflow.',
    '3. Re-run the crew with refined instructions for a deeper pass.',
  ].join('\n');
}

const CREW_PHASE_BADGE: Record<CrewPhase, { label: string; cls: string }> = {
  matching: { label: 'matching', cls: 'border-violet-400/40 bg-violet-500/15 text-violet-200' },
  crew_ready: { label: 'creating', cls: 'border-sky-400/40 bg-sky-500/15 text-sky-200' },
  running: { label: 'running', cls: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' },
  reviewing: { label: 'reviewing', cls: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
  completed: { label: 'completed', cls: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100' },
  stopped: { label: 'stopped', cls: 'border-white/20 bg-white/10 text-white/60' },
};



function CrewAgentAvatar({ src, size = 40 }: { src: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/15 bg-white p-1"
      style={{ width: size, height: size, backgroundColor: '#ffffff' }}
    >
      <img src={src} alt="" width={size - 10} height={size - 10} draggable={false} className="h-full w-full object-contain" />
    </div>
  );
}

const CREW_PHASE_SUBTITLE: Record<CrewPhase, string> = {
  matching: 'Matching specialist agents to your task',
  crew_ready: 'Crew assembled — starting work',
  running: 'Crew is executing the task',
  reviewing: 'Reviewing the crew output',
  completed: 'Result delivered to the chat',
  stopped: 'Crew stopped before completion',
};

const CREW_STATUS_PILL: Record<CrewPanelAgent['status'], string> = {
  matching: 'border-violet-400/30 bg-violet-500/15 text-violet-200',
  matched: 'border-sky-400/30 bg-sky-500/15 text-sky-200',
  working: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  done: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100',
};

export function CrewWorkspaceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-white/[0.07] bg-[#0a0d18] p-3.5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{title}</p>
      {children}
    </div>
  );
}

function CrewActiveWorkspace({ agent }: { agent: CrewPanelAgent }) {
  return (
    <div className="space-y-3">
      {/* Agent desk header */}
      <div className="relative overflow-hidden rounded-[14px] border border-white/[0.08] bg-gradient-to-b from-[#100c22] to-[#0a0d18] p-4">
        <div className="pointer-events-none absolute -top-8 right-0 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <CrewAgentAvatar src={agent.avatar} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-white">{agent.name}</p>
            <p className="truncate text-[11px] text-white/45">{agent.role}</p>
            <SkillModelPills skills={agent.skills} activeModel={agent.activeModel} compact />
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${CREW_STATUS_PILL[agent.status]}`}>
            {crewAgentStatusLabel(agent)}
          </span>
        </div>
        <div className="relative mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/40">
            <span>{agent.currentTask}</span>
            <span>{agent.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
              animate={{ width: `${agent.progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      </div>

      <CrewWorkspaceSection title="Skills & Models">
        <div className="space-y-2">
          {agent.skills.map((skill) => {
            const resolved = resolveSkillModel(skill, agent.activeModel);
            return (
              <div key={skill.id} className="rounded-[10px] border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-white/70">{skill.label}</span>
                  <span className="rounded-full border border-emerald-300/18 bg-emerald-400/[0.08] px-2 py-0.5 text-[9px] font-bold text-emerald-100">{resolved.providerMode === 'auto' ? 'Auto' : 'Manual'} {'->'} {resolved.displayName}</span>
                </div>
                <p className="mt-1 text-[10px] text-white/35">Provider: {PROVIDER_LABELS[resolved.provider]} · Fallback: {resolved.fallbackModelName ?? PROVIDER_LABELS[resolved.fallbackProvider ?? 'custom']} · Cost: {resolved.costTier}</p>
              </div>
            );
          })}
        </div>
        <button className="mt-3 rounded-[10px] border border-white/[0.09] px-3 py-2 text-[11px] font-bold text-white/45 transition hover:bg-white/[0.05] hover:text-white">Configure model</button>
      </CrewWorkspaceSection>

      <CrewWorkspaceSection title="Thinking summary">
        <p className="text-xs leading-relaxed text-white/70">{agent.thinkingSummary}</p>
      </CrewWorkspaceSection>

      {/* Kind-specific live work */}
      {agent.kind === 'research' && (
        <>
          <CrewWorkspaceSection title="Sources gathered">
            <div className="space-y-2.5">
              {agent.sources.map((s) => (
                <div key={s.title} className="border-l-2 border-violet-400/40 pl-3">
                  <p className="text-xs font-semibold text-white/85">{s.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">{s.snippet}</p>
                </div>
              ))}
            </div>
          </CrewWorkspaceSection>
          <CrewWorkspaceSection title="Research notes">
            <ul className="space-y-1.5">
              {agent.notes.map((n) => (
                <li key={n} className="flex gap-2 text-[11px] leading-relaxed text-white/60">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400/70" />{n}
                </li>
              ))}
            </ul>
          </CrewWorkspaceSection>
        </>
      )}

      {agent.kind === 'analyst' && (
        <>
          <CrewWorkspaceSection title="Extracted insights">
            <ul className="space-y-1.5">
              {agent.insights.map((n) => (
                <li key={n} className="flex gap-2 text-[11px] leading-relaxed text-white/65">
                  <Sparkles size={11} className="mt-0.5 shrink-0 text-violet-300" />{n}
                </li>
              ))}
            </ul>
          </CrewWorkspaceSection>
          <CrewWorkspaceSection title="Patterns & risks">
            <ul className="space-y-1.5">
              {agent.patterns.map((n) => (
                <li key={n} className="flex gap-2 text-[11px] leading-relaxed text-white/60">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400/70" />{n}
                </li>
              ))}
            </ul>
          </CrewWorkspaceSection>
        </>
      )}

      {agent.kind === 'writer' && (
        <CrewWorkspaceSection title="Draft in progress">
          <div className="space-y-2.5">
            {agent.draftSections.map((d) => (
              <div key={d.title} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-bold text-white/85">{d.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{d.body}</p>
              </div>
            ))}
          </div>
        </CrewWorkspaceSection>
      )}

      {agent.kind === 'reviewer' && (
        <CrewWorkspaceSection title="Review checklist">
          <div className="space-y-2">
            {agent.checklist.map((c) => (
              <div key={c.item} className="flex items-center gap-2 text-[11px]">
                {c.ok
                  ? <Check size={13} className="shrink-0 text-emerald-400" />
                  : <AlertTriangle size={12} className="shrink-0 text-amber-400" />}
                <span className={c.ok ? 'text-white/60' : 'text-amber-200/80'}>{c.item}</span>
              </div>
            ))}
          </div>
        </CrewWorkspaceSection>
      )}

      <CrewWorkspaceSection title="Output so far">
        <p className="text-xs leading-relaxed text-white/70">{agent.outputSoFar}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {agent.toolsUsed.map((tool) => (
            <span key={tool} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">{tool}</span>
          ))}
        </div>
      </CrewWorkspaceSection>

      {agent.instructionMessages.length > 0 && (
        <CrewWorkspaceSection title="Instructions & responses">
          <div className="space-y-2">
            {agent.instructionMessages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-[10px] px-2.5 py-1.5 text-[11px] leading-relaxed ${
                  m.sender === 'user' ? 'bg-violet-500/20 text-violet-50' : 'bg-white/[0.06] text-white/75'}`}>
                  {m.sender === 'agent' && <span className="mr-1 text-[9px] font-bold text-emerald-300/80">{agent.name}</span>}
                  <span>{m.text}</span>
                </div>
                <span className="mt-0.5 text-[8px] text-white/20">{m.createdAt}</span>
              </div>
            ))}
          </div>
        </CrewWorkspaceSection>
      )}
    </div>
  );
}

export function ColonyCrewPanel({ crew, selectedAgentId, onSelectAgent, onClose, onStop, onSend, onPause, onResume }: {
  crew: ColonyCrewSession;
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
  onClose: () => void;
  onStop: () => void;
  onSend: (targetId: string, text: string) => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const badge = CREW_PHASE_BADGE[crew.phase];
  const matching = crew.phase === 'matching';
  const activeAgent =
    crew.agents.find((a) => a.id === selectedAgentId) ??
    crew.agents.find((a) => a.status === 'working') ??
    crew.agents.find((a) => a.status !== 'done') ??
    crew.agents[0];
  const ended = crew.phase === 'completed' || crew.phase === 'stopped';
  const stopped = crew.phase === 'stopped';
  const [ctlInput, setCtlInput] = React.useState('');
  const sendCtl = () => { if (!ctlInput.trim() || stopped) return; onSend(activeAgent.id, ctlInput.trim()); setCtlInput(''); };
  const overall = crew.phase === 'completed' ? 100
    : crew.phase === 'stopped' ? 0
    : matching ? Math.round(((crew.stepIndex + 1) / CREW_MATCHING_STEPS.length) * 35)
    : Math.round(crew.agents.reduce((s, a) => s + a.progress, 0) / Math.max(crew.agents.length, 1));

  const statusDot: Record<CrewPanelAgent['status'], string> = {
    matching: 'bg-violet-400 animate-pulse',
    matched: 'bg-sky-400',
    working: 'bg-emerald-400 animate-pulse',
    done: 'bg-emerald-300',
  };
  const recentActivity = crew.activity.slice(-3).reverse();

  return (
    <motion.aside
      initial={{ x: 560, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 560, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed right-0 top-[56px] bottom-0 z-[60] flex w-[clamp(420px,32vw,520px)] flex-col border-l border-white/[0.09] bg-[#070912] shadow-[0_0_80px_rgba(0,0,0,0.6)]"
    >
      {/* ── Header ── */}
      <div className="relative shrink-0 overflow-hidden border-b border-white/[0.07] px-5 py-4">
        <div className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(120% 80% at 80% 0%, rgba(124,92,252,0.18), transparent 60%)' }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20">
                <Users size={13} className="text-violet-300" />
              </div>
              <p className="font-heading text-base font-extrabold text-white">Colony Crew</p>
              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
                {crew.phase !== 'completed' && crew.phase !== 'stopped' && <Loader2 size={9} className="animate-spin" />}
                {badge.label}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-white/45">{CREW_PHASE_SUBTITLE[crew.phase]}</p>
          </div>
          <button onClick={onClose} title="Close panel"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white">
            <X size={14} />
          </button>
        </div>
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
            animate={{ width: `${overall}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* ── Main workspace area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {matching ? (
          <div className="relative overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0a0d18] p-5">
            <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{ backgroundImage: 'linear-gradient(rgba(124,92,252,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(124,92,252,0.12) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
            <p className="relative mb-4 text-center text-xs font-semibold text-white/55">Assembling your specialist crew…</p>
            <div className="relative flex justify-center gap-3">
              {buildColonyCrewAgents().map((a, i) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 14, scale: 0.8 }}
                  animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
                  transition={{ delay: i * 0.18, y: { repeat: Infinity, duration: 2 + i * 0.3 } }}>
                  <CrewAgentAvatar src={a.avatar} size={46} />
                </motion.div>
              ))}
            </div>
            <div className="relative mt-5 space-y-1.5">
              {CREW_MATCHING_STEPS.map((step, i) => {
                const state = i < crew.stepIndex ? 'done' : i === crew.stepIndex ? 'active' : 'idle';
                return (
                  <div key={step} className="flex items-center gap-2 text-xs">
                    {state === 'done'
                      ? <Check size={13} className="text-emerald-400" />
                      : state === 'active'
                        ? <Loader2 size={13} className="animate-spin text-violet-300" />
                        : <span className="h-[13px] w-[13px] rounded-full border border-white/15" />}
                    <span className={state === 'idle' ? 'text-white/30' : state === 'active' ? 'text-white/85' : 'text-white/50'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeAgent.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}>
              <CrewActiveWorkspace agent={activeAgent} />
              {recentActivity.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Recent activity</p>
                  <div className="space-y-1.5">
                    {recentActivity.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2 text-[11px]">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400/60" />
                        <span className="flex-1 leading-relaxed text-white/45">{ev.text}</span>
                        <span className="shrink-0 text-white/20">{ev.ts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Crew Control: one clean input targeting the selected agent ── */}
      <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] bg-[#080a13] px-4 py-3">
        {!ended && (crew.paused ? (
          <button onClick={onResume} title="Resume"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200 hover:bg-emerald-400/[0.16]"><Play size={13} /></button>
        ) : (
          <button onClick={onPause} title="Pause"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-amber-400/30 bg-amber-400/[0.08] text-amber-200 hover:bg-amber-400/[0.16]"><Minus size={13} /></button>
        ))}
        {!ended && (
          <button onClick={onStop} title="Stop Crew"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-red-400/35 bg-red-500/[0.12] text-red-200 hover:bg-red-500/[0.22]"><Square size={12} /></button>
        )}
        <input
          value={ctlInput}
          onChange={(e) => setCtlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCtl(); } }}
          disabled={stopped}
          placeholder={stopped ? 'Crew stopped — start a new task from the chat' : crew.phase === 'completed' ? `Ask ${activeAgent.name} for a follow-up…` : `Message ${activeAgent.name}…`}
          className="min-w-0 flex-1 rounded-[10px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-violet-400/50 disabled:opacity-50" />
        <button onClick={sendCtl} disabled={!ctlInput.trim() || stopped}
          className="flex shrink-0 items-center gap-1 rounded-[10px] bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">
          <ArrowRight size={13} /> Send
        </button>
      </div>

      {/* ── Bottom agent strip ── */}
      <div className="shrink-0 border-t border-white/[0.07] bg-[#05060d] px-3 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {crew.agents.map((a) => {
            const active = activeAgent.id === a.id;
            return (
              <button key={a.id} onClick={() => onSelectAgent(a.id)}
                title={a.name}
                className={`group relative flex min-w-[96px] flex-1 flex-col items-center gap-1.5 rounded-[12px] border px-2.5 py-2.5 transition ${
                  active
                    ? 'border-violet-400/55 bg-violet-500/[0.12] shadow-[0_0_24px_rgba(124,92,252,0.25)]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]'}`}>
                <div className="relative">
                  <CrewAgentAvatar src={a.avatar} size={34} />
                  <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[#05060d] ${statusDot[a.status]}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide ${active ? 'text-white' : 'text-white/45'}`}>{a.shortId}</span>
                <span className={`text-[9px] ${active ? 'text-violet-200' : 'text-white/35'}`}>{crewAgentStatusLabel(a)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}


export function ColonyCrewReopenPill({ phase, onClick }: { phase: CrewPhase; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      onClick={onClick}
      className="fixed bottom-28 right-6 z-[55] flex items-center gap-2 rounded-full border border-violet-400/40 bg-[#120f24]/95 px-4 py-2.5 text-xs font-semibold text-violet-100 shadow-[0_10px_40px_rgba(124,92,252,0.3)] backdrop-blur transition hover:bg-[#1a1538]">
      {phase === 'completed' || phase === 'stopped'
        ? <Check size={13} className="text-emerald-400" />
        : <Loader2 size={13} className="animate-spin text-violet-300" />}
      Crew {phase === 'completed' ? 'done' : phase === 'stopped' ? 'stopped' : 'running'}
      <ChevronRight size={13} />
    </motion.button>
  );
}


export function ColonyCrewCard({ agents, matchReason, onOpenWorkspace, onStopAll, swarmState }: {
  agents: MatchedAgent[];
  matchReason: string;
  onOpenWorkspace: () => void;
  onStopAll: () => void;
  swarmState?: SwarmState;
}) {
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const status = !swarmState || swarmState === 'analyzing_goal' || swarmState === 'matching_agents' ? 'matching'
    : swarmState === 'creating_agents' || swarmState === 'assigning_tasks' ? 'ready'
    : swarmState === 'deliverable_ready' ? 'done'
    : 'running';
  const compactDone = agents.filter((a) => a.status === 'done').length;
  const compactProgress = status === 'matching' ? 22 : status === 'ready' ? 48 : status === 'done' ? 100 : Math.max(62, agents.length ? Math.round((compactDone / agents.length) * 100) : 62);
  const shownAgents = (agents.length ? agents : analyzeAndMatchAgents('').agents).slice(0, 4);
  const roleFor = (name: string, fallback: string) => {
    const n = name.toLowerCase();
    if (/research/.test(n)) return 'gathers context';
    if (/analyst|data/.test(n)) return 'extracts insights';
    if (/writer|content/.test(n)) return 'drafts output';
    if (/quality|checker|review/.test(n)) return 'checks quality';
    return fallback;
  };
  const steps = ['Understand task', 'Match agents', status === 'done' ? 'Ready for review' : 'Start execution'];
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-[20px] border border-violet-400/20 bg-[#0b1120] shadow-[0_22px_54px_rgba(0,0,0,0.46),0_0_0_1px_rgba(124,92,252,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-violet-500/18 ring-1 ring-violet-400/28 shadow-[0_0_22px_rgba(124,92,252,0.18)]">
            <Users size={16} className="text-violet-300" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-base font-extrabold leading-tight text-white">Colony Crew</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${status === 'done' || status === 'running' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-violet-400/25 bg-violet-400/10 text-violet-200'}`}>{status}</span>
            </div>
            <p className="mt-0.5 text-xs text-white/42">AI Ant is assembling a specialist crew for this task.</p>
          </div>
        </div>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald-300/75"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />{compactProgress}%</span>
      </div>
      <div className="px-4 py-4">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300 transition-all duration-700" style={{ width: `${compactProgress}%` }} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {shownAgents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2.5 rounded-[13px] border border-white/[0.07] bg-white/[0.03] p-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-white/[0.10] bg-[#f4f4f8]">
                <img src={crewAvatarForName(agent.name)} alt={agent.name} draggable={false} className="image-pixelated h-[82%] w-[82%] object-contain" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white/82">{agent.name.includes('Agent') ? agent.name : `${agent.name} Agent`}</p>
                <p className="truncate text-[10px] text-white/38">{roleFor(agent.name, agent.role)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-1.5">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 text-[11px] text-white/48">
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold ${index === 2 && status === 'matching' ? 'bg-white/[0.06] text-white/25' : 'bg-violet-500/20 text-violet-200'}`}>{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
        {summaryOpen && (
          <div className="mt-3 rounded-[13px] border border-white/[0.07] bg-black/15 p-3 text-xs leading-relaxed text-white/48">
            {matchReason || 'Matching specialist agents for your task.'} Agents are coordinating your task and will package the result for review.
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-4 py-3">
        <button onClick={onOpenWorkspace} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(124,92,252,0.32)] transition hover:bg-violet-500">Open Workspace</button>
        <button onClick={() => setSummaryOpen((open) => !open)} className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/50 transition hover:text-white/75">View summary</button>
        <button onClick={onStopAll} className="ml-auto rounded-[11px] border border-red-400/18 bg-red-400/[0.06] px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.11]">Stop crew</button>
      </div>
    </div>
  );
  const [phaseOverride, setPhaseOverride] = React.useState<'matching' | 'crew_ready' | 'running' | null>(null);

  const legacyCrewAvatarForName = (name: string): string => {
    const n = (name ?? '').toLowerCase();
    if (/director|ai ant|ceo|orchestrator/.test(n)) return '/assets/agents/7.png';
    if (/project manager|manager/.test(n)) return '/assets/agents/8.png';
    if (/research/.test(n)) return '/assets/agents/9.png';
    if (/analyst|data|finance/.test(n)) return '/assets/agents/10.png';
    if (/writer|content|marketing/.test(n)) return '/assets/agents/11.png';
    if (/quality|checker|review/.test(n)) return '/assets/agents/12.png';
    if (/operations|support/.test(n)) return '/assets/agents/13.png';
    return '/assets/agents/14.png';
  };

  const swarmToPhase = (s?: SwarmState): 'matching' | 'crew_ready' | 'running' => {
    if (!s || s === 'analyzing_goal' || s === 'matching_agents' || s === 'creating_agents') return 'matching';
    if (s === 'assigning_tasks') return 'crew_ready';
    return 'running';
  };

  const phase = phaseOverride ?? swarmToPhase(swarmState);

  const activeStepIdx = ({ analyzing_goal: 0, matching_agents: 1, creating_agents: 2, assigning_tasks: 3, agents_working: 4, reviewing_outputs: 4, deliverable_ready: 4 } as Record<SwarmState, number>)[swarmState ?? 'analyzing_goal'] ?? 0;

  const matchingSteps = [
    'Reading task intent',
    'Detecting required skills',
    'Searching available agents',
    'Assigning responsibilities',
    'Preparing crew workspace',
  ];

  const candidatePool = [
    'Research Agent', 'Analyst Agent', 'Writer Agent', 'Quality Checker',
    'Strategy Agent', 'Operations Agent', 'Data Agent', 'Review Agent',
  ];

  const done = agents.filter((a) => a.status === 'done').length;
  const progress = agents.length ? Math.round((done / agents.length) * 100) : 0;

  const agentRole = (name: string, fallback: string) => {
    const n = name.toLowerCase();
    if (/research/.test(n)) return 'Gather source material and context';
    if (/analyst|data/.test(n)) return 'Analyze patterns and extract insights';
    if (/writer|content/.test(n)) return 'Draft and structure the final output';
    if (/quality|checker/.test(n)) return 'Review accuracy and consistency';
    if (/manager|operations/.test(n)) return 'Coordinate agent workflow';
    if (/strategy/.test(n)) return 'Strategic planning and direction';
    return fallback;
  };

  const agentResponsibility = (name: string) => {
    const n = name.toLowerCase();
    if (/research/.test(n)) return 'Research input';
    if (/analyst|data/.test(n)) return 'Insight summary';
    if (/writer|content/.test(n)) return 'Deliverable draft';
    if (/quality|checker/.test(n)) return 'Final check';
    if (/manager|operations/.test(n)) return 'Coordination';
    if (/strategy/.test(n)) return 'Strategy';
    return 'Task execution';
  };

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-violet-400/22 bg-[#0b1120] shadow-[0_32px_72px_rgba(0,0,0,0.55),0_0_0_1px_rgba(124,92,252,0.07)]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-violet-500/18 ring-1 ring-violet-400/28">
            <Users size={16} className="text-violet-300" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/65">Colony Crew</p>
            <h3 className="font-heading text-base font-extrabold leading-tight text-white">
              {phase === 'matching' ? 'Matching the right AI agents' :
               phase === 'crew_ready' ? 'Crew ready' :
               'Colony Crew is working'}
            </h3>
          </div>
        </div>
        <div>
          {phase === 'running' && <span className="rounded-full border border-emerald-400/22 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-emerald-200">{progress}% done</span>}
          {phase === 'crew_ready' && <span className="rounded-full border border-violet-400/18 bg-violet-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-violet-200">{agents.length} agents matched</span>}
        </div>
      </div>

      {/* ── Subtitle ── */}
      <p className="border-b border-white/[0.05] px-5 py-2.5 text-xs text-white/38">
        {phase === 'matching' ? (matchReason || 'AI Ant is selecting the best specialists for this task') :
         phase === 'crew_ready' ? `AI Ant matched ${agents.length} agents for this task` :
         'Agents are coordinating your task in parallel'}
      </p>

      {/* ── STATE: matching ── */}
      {phase === 'matching' && (
        <div className="px-5 py-5">
          <div className="mb-5 space-y-2.5">
            {matchingSteps.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold transition-all duration-500 ${i < activeStepIdx ? 'bg-violet-500 text-white' : i === activeStepIdx ? 'bg-violet-500/25 text-violet-200 ring-1 ring-violet-400/50' : 'bg-white/[0.05] text-white/18'}`}>
                  {i < activeStepIdx ? '✓' : i + 1}
                </span>
                <span className={`text-xs font-semibold transition-all duration-500 ${i < activeStepIdx ? 'text-white/35 line-through decoration-white/20' : i === activeStepIdx ? 'text-white/90' : 'text-white/20'}`}>{label}</span>
                {i === activeStepIdx && <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />running</span>}
              </div>
            ))}
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Agent candidates</p>
          <div className="grid grid-cols-4 gap-2">
            {candidatePool.map((name, i) => {
              const isSelected = i < agents.length;
              return (
                <div key={name} className={`relative flex flex-col items-center gap-2 rounded-[16px] border p-3 transition-all duration-500 ${isSelected ? 'border-violet-400/32 bg-violet-500/[0.08] shadow-[0_0_18px_rgba(124,92,252,0.12)]' : 'border-white/[0.06] bg-white/[0.022]'}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border bg-[#f4f4f8] ${isSelected ? 'border-violet-300/35' : 'border-white/[0.08]'}`}>
                    <img src={crewAvatarForName(name)} alt={name} draggable={false} className="h-[82%] w-[82%] object-contain" style={{ imageRendering: 'pixelated' }} />
                  </span>
                  <span className="text-center text-[10px] font-semibold leading-tight text-white/52">{name}</span>
                  {isSelected && <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-violet-500 text-[8px] font-extrabold text-white shadow-[0_0_8px_rgba(124,92,252,0.5)]">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STATE: crew_ready ── */}
      {phase === 'crew_ready' && (
        <div className="px-5 py-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Your AI crew</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {agents.map((agent) => (
              <div key={agent.id} className="flex gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.028] p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-white/[0.10] bg-[#f4f4f8]">
                  <img src={crewAvatarForName(agent.name)} alt={agent.name} draggable={false} className="h-[82%] w-[82%] object-contain" style={{ imageRendering: 'pixelated' }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/85">{agent.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/42">{agentRole(agent.name, agent.role)}</p>
                  <span className="mt-2 inline-block rounded-full border border-violet-400/14 bg-violet-400/[0.06] px-2 py-0.5 text-[10px] font-semibold text-violet-200/60">{agentResponsibility(agent.name)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATE: running ── */}
      {phase === 'running' && (
        <div className="px-5 py-5">
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">Task progress</span>
              <span className="text-xs font-bold text-violet-200">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300 transition-all duration-700" style={{ width: `${Math.max(progress, 8)}%` }} />
            </div>
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Agent activity</p>
          <div className="space-y-2.5">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border bg-[#f4f4f8] ${agent.status === 'running' ? 'border-emerald-400/38' : 'border-white/[0.08]'}`}>
                  <img src={crewAvatarForName(agent.name)} alt={agent.name} draggable={false} className="h-[82%] w-[82%] object-contain" style={{ imageRendering: 'pixelated' }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/78">{agent.name}</span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.status === 'running' ? 'animate-pulse bg-emerald-300' : agent.status === 'done' ? 'bg-cyan-300' : 'bg-amber-300'}`} />
                    <span className={`text-[10px] font-semibold ${agent.status === 'running' ? 'text-emerald-300' : agent.status === 'done' ? 'text-white/30' : 'text-amber-200/55'}`}>
                      {agent.status === 'running' ? 'working' : agent.status === 'done' ? 'done' : 'waiting'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-white/36">
                    {agent.currentTask ?? (agent.status === 'done' ? 'Output ready — passed to next agent' : agent.status === 'running' ? 'Processing assigned task…' : 'In queue')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer buttons ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3.5">
        {phase === 'matching' && (
          <button onClick={onStopAll} className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/40 transition hover:text-white/65">Cancel</button>
        )}
        {phase === 'crew_ready' && (
          <>
            <button onClick={() => setPhaseOverride('running')} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(124,92,252,0.35)] transition hover:bg-violet-500">Start with this crew</button>
            <button className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/50 transition hover:text-white/75">Customize crew</button>
            <button onClick={onStopAll} className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/50 transition hover:text-white/75">Do it with AI Ant only</button>
          </>
        )}
        {phase === 'running' && (
          <>
            <button onClick={onOpenWorkspace} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(124,92,252,0.35)] transition hover:bg-violet-500">Open Workspace</button>
            <button className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/50 transition hover:text-white/75">View tasks</button>
            <button onClick={onStopAll} className="ml-auto rounded-[11px] border border-red-400/18 bg-red-400/[0.06] px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.11]">Stop crew</button>
          </>
        )}
      </div>
    </div>
  );
}


export function CrewWorkspace({ run, onBack, onStop }: { run: CrewRun; onBack: () => void; onStop: () => void }) {
  const [status, setStatus] = React.useState<CrewStatus>(run.status);
  const [message, setMessage] = React.useState('');
  const [showOutput, setShowOutput] = React.useState(false);
  const flow: CrewStatus[] = ['matching', 'creating_agents', 'running', 'reviewing', 'completed'];
  const statusIndex = Math.max(0, flow.indexOf(status));
  const displayTasks = run.tasks.map((task, index) => ({
    ...task,
    status: status === 'stopped' ? task.status : index < statusIndex ? 'done' as const : index === statusIndex ? 'running' as const : 'todo' as const,
  }));

  React.useEffect(() => {
    if (status === 'stopped' || status === 'completed') return;
    const current = flow.indexOf(status);
    const timer = window.setTimeout(() => setStatus(flow[Math.min(current + 1, flow.length - 1)]), current < 2 ? 1400 : 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const activeAgentIndex = Math.max(0, Math.min(run.agents.length - 1, statusIndex));
  const statusLabel: Record<CrewStatus, string> = {
    matching: 'Matching agents',
    creating_agents: 'Creating crew',
    running: 'Executing task',
    reviewing: 'Reviewing output',
    completed: 'Ready for review',
    stopped: 'Stopped',
  };
  const stop = () => { setStatus('stopped'); onStop(); };

  return (
    <div className="flex h-screen bg-[#060914] text-white">
      <section className="flex w-full flex-col border-r border-white/[0.08] bg-[#080d18] lg:w-[44%]">
        <header className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <button onClick={onBack} className="rounded-[10px] border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/58 transition hover:text-white">Back to AI Ant</button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/70">Colony Crew</p>
            <h1 className="truncate font-heading text-lg font-extrabold">{run.title}</h1>
          </div>
          <span className="ml-auto rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{statusLabel[status]}</span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/28">User request</p>
            <p className="mt-2 text-sm leading-relaxed text-white/72">{run.userPrompt}</p>
          </div>
          <div className="rounded-[18px] border border-violet-400/18 bg-violet-400/[0.06] p-4">
            <p className="text-sm font-bold text-violet-100">Agents are coordinating your task</p>
            <p className="mt-1 text-sm text-white/48">AI Ant is keeping this as a fast specialist task: gather context, extract insights, draft, and review.</p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/28">Task plan</p>
            <div className="space-y-2">
              {displayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-[12px] bg-black/16 px-3 py-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${task.status === 'done' ? 'bg-emerald-400 text-[#04110d]' : task.status === 'running' ? 'animate-pulse bg-violet-500 text-white' : 'bg-white/[0.07] text-white/25'}`}>{task.status === 'done' ? '✓' : '•'}</span>
                  <span className={`text-sm ${task.status === 'todo' ? 'text-white/32' : 'text-white/76'}`}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            {run.agents.map((agent, index) => (
              <div key={agent.id} className={`flex items-center gap-3 rounded-[14px] border p-3 ${index === activeAgentIndex && status !== 'completed' ? 'border-emerald-400/24 bg-emerald-400/[0.06]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[12px] bg-[#f4f4f8]">
                  <img src={agent.avatar} alt={agent.name} draggable={false} className="image-pixelated h-[82%] w-[82%] object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/82">{agent.name}</p>
                  <p className="truncate text-xs text-white/38">{agent.task}</p>
                </div>
              </div>
            ))}
          </div>
          {showOutput && <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm leading-relaxed text-white/68">Mock output: The crew prepared a concise answer with context, key insights, recommended next steps, and quality notes.</div>}
        </div>
        <div className="border-t border-white/[0.08] p-4">
          <div className="flex gap-2 rounded-[16px] border border-white/[0.08] bg-[#0b1220] p-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message the crew..." className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/25" />
            <button onClick={() => setMessage('')} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white">Send</button>
          </div>
        </div>
      </section>
      <section className="hidden min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_50%_20%,rgba(124,92,252,0.18),transparent_34%),#070b14] lg:flex">
        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className="font-heading text-lg font-extrabold">Colony Computer</p>
            <p className="text-xs text-white/35">{status === 'matching' ? 'Matching personnel...' : status === 'creating_agents' ? 'Creating crew...' : status === 'completed' ? 'Ready for review' : 'Executing task...'}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Running</span>
        </header>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
          {status === 'matching' && (
            <div className="grid grid-cols-4 gap-4">
              {run.agents.concat(run.agents.slice(0, 2)).map((agent, index) => (
                <motion.div key={`${agent.id}-${index}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12 }} className={`rounded-[18px] border p-4 text-center ${index < 4 ? 'border-violet-400/30 bg-violet-400/[0.08] shadow-[0_0_28px_rgba(124,92,252,0.14)]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                  <img src={agent.avatar} alt="" className="image-pixelated mx-auto h-14 w-14 rounded-[14px] bg-[#f4f4f8] p-1" />
                  <p className="mt-2 text-xs font-bold text-white/75">{agent.name}</p>
                </motion.div>
              ))}
            </div>
          )}
          {status === 'creating_agents' && (
            <motion.div initial={{ opacity: 0, scale: 0.92, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} className="w-[320px] rounded-[26px] border border-violet-400/25 bg-[#11182a] p-6 text-center shadow-[0_34px_90px_rgba(0,0,0,0.48)]">
              <img src={run.agents[activeAgentIndex]?.avatar} alt="" className="image-pixelated mx-auto h-24 w-24 rounded-[22px] bg-[#f4f4f8] p-2" />
              <h2 className="mt-4 font-heading text-xl font-extrabold">{run.agents[activeAgentIndex]?.name}</h2>
              <p className="mt-1 text-sm text-violet-200/70">{run.agents[activeAgentIndex]?.description}</p>
            </motion.div>
          )}
          {['running', 'reviewing', 'completed', 'stopped'].includes(status) && (
            <div className="w-full max-w-3xl">
              <div className="grid gap-3">
                {displayTasks.map((task) => (
                  <motion.div key={task.id} layout className={`flex items-center justify-between rounded-[18px] border px-4 py-3 ${task.status === 'done' ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : task.status === 'running' ? 'border-violet-400/24 bg-violet-400/[0.08]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                    <span className="text-sm font-semibold text-white/72">{task.title}</span>
                    <span className="text-xs font-bold capitalize text-white/38">{task.status}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {run.agents.map((agent, index) => (
                  <div key={agent.id} className={`rounded-[18px] border p-3 text-center ${index === activeAgentIndex && status !== 'completed' ? 'border-emerald-400/30 bg-emerald-400/[0.08]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                    <img src={agent.avatar} alt="" className="image-pixelated mx-auto h-14 w-14 rounded-[14px] bg-[#f4f4f8] p-1" />
                    <p className="mt-2 text-xs font-bold text-white/72">{agent.name}</p>
                    <p className="mt-1 text-[10px] text-white/35">{index === 0 ? 'Researching' : index === 1 ? 'Analyzing' : index === 2 ? 'Drafting' : 'Reviewing'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <footer className="flex items-center gap-2 border-t border-white/[0.08] p-4">
          <button onClick={stop} className="rounded-[12px] border border-red-400/20 bg-red-400/[0.07] px-4 py-2 text-xs font-bold text-red-300">Stop</button>
          <button onClick={() => setShowOutput((open) => !open)} className="rounded-[12px] bg-violet-600 px-4 py-2 text-xs font-bold text-white">View output</button>
          <button className="ml-auto rounded-[12px] border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/50">Continue in One-Man Enterprise</button>
        </footer>
      </section>
    </div>
  );
}
