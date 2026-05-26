import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, Check, Loader2, Plus, X } from 'lucide-react';
import { ProviderLogo } from '../../components/model/ProviderLogo';
import {
  createAgentSkill,
  routeCapability,
  type AgentCapability,
  type AgentSkill,
  type ModelConfig,
} from '../../lib/aiOrchestration';

export interface EnterpriseAgent { id: string; code?: string; name: string; role: string; dept: string; avatar?: string; taskSummary?: string }
export type EnterpriseProjectStatus = 'planning' | 'creating_team' | 'running' | 'waiting_approval' | 'completed';
export type EnterpriseAgentStatus = 'idle' | 'thinking' | 'working' | 'waiting' | 'done' | 'blocked';
export type EnterpriseTaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type EnterpriseMessageType = 'handoff' | 'update' | 'question' | 'result' | 'approval_request';
export type EnterpriseDeliverableStatus = 'draft' | 'review_ready' | 'approved' | 'exported';
export type EnterpriseApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AgentNodePosition = { x: number; y: number };
export type AgentConnectionStatus = 'normal' | 'active' | 'completed' | 'blocked';
export type AgentConnectionType = 'reports_to' | 'handoff' | 'collaboration' | 'review';

export type EnterpriseWorkspaceAgent = EnterpriseAgent & {
  avatar: string;
  code: string;
  description: string;
  parentAgentId?: string;
  status: EnterpriseAgentStatus;
  position: AgentNodePosition;
  currentTask?: string;
  progress: number;
  thoughtsSummary: string;
  output: string;
  tools: string[];
  dependencies: string[];
  agentSkills?: AgentSkill[];
  activeModel?: ModelConfig;
};

export type AgentConnection = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  label?: string;
  type: AgentConnectionType;
  status: AgentConnectionStatus;
  animated?: boolean;
  lastHandoff?: string;
};

export type EnterpriseWorkspaceChannel = {
  id: string;
  name: string;
  type: 'system' | 'agent' | 'team' | 'department';
  agentId?: string;
  departmentId?: string;
  archived?: boolean;
};

export type EnterpriseDepartmentColor = 'purple' | 'cyan' | 'mint' | 'amber' | 'blue' | 'pink' | 'gray';

export interface EnterpriseDepartment {
  id: string;
  name: string;
  color: EnterpriseDepartmentColor;
  agentIds: string[];
  channelId: string;
  bounds: { x: number; y: number; width: number; height: number };
  manuallyPositioned?: boolean;
  description?: string;
}

export const ENTERPRISE_DEPARTMENT_COLOR_MAP: Record<EnterpriseDepartmentColor, { dot: string; ring: string; bg: string; border: string; text: string }> = {
  purple: { dot: 'bg-violet-400', ring: 'ring-violet-400/40', bg: 'bg-violet-500/[0.06]', border: 'border-violet-400/30', text: 'text-violet-200' },
  cyan:   { dot: 'bg-cyan-400',   ring: 'ring-cyan-400/40',   bg: 'bg-cyan-500/[0.06]',   border: 'border-cyan-400/30',   text: 'text-cyan-200' },
  mint:   { dot: 'bg-emerald-400',ring: 'ring-emerald-400/40',bg: 'bg-emerald-500/[0.06]',border: 'border-emerald-400/30',text: 'text-emerald-200' },
  amber:  { dot: 'bg-amber-400',  ring: 'ring-amber-400/40',  bg: 'bg-amber-500/[0.06]',  border: 'border-amber-400/30',  text: 'text-amber-200' },
  blue:   { dot: 'bg-sky-400',    ring: 'ring-sky-400/40',    bg: 'bg-sky-500/[0.06]',    border: 'border-sky-400/30',    text: 'text-sky-200' },
  pink:   { dot: 'bg-pink-400',   ring: 'ring-pink-400/40',   bg: 'bg-pink-500/[0.06]',   border: 'border-pink-400/30',   text: 'text-pink-200' },
  gray:   { dot: 'bg-white/40',   ring: 'ring-white/30',      bg: 'bg-white/[0.04]',      border: 'border-white/20',      text: 'text-white/70' },
};

export const ENTERPRISE_DEPARTMENT_COLORS: EnterpriseDepartmentColor[] = ['purple', 'cyan', 'mint', 'amber', 'blue', 'pink', 'gray'];

export type EnterpriseWorkspaceTask = {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string;
  status: EnterpriseTaskStatus;
  progress: number;
  dependsOn?: string[];
};

export type EnterpriseWorkspaceMessage = {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  content: string;
  timestamp: string;
  type: EnterpriseMessageType;
};

export type EnterpriseWorkspaceDeliverable = {
  id: string;
  title: string;
  type: 'report' | 'plan' | 'summary' | 'spreadsheet' | 'workflow' | 'other';
  status: EnterpriseDeliverableStatus;
  content: string;
};

export type EnterpriseWorkspaceApproval = {
  id: string;
  title: string;
  description: string;
  requestedByAgentId: string;
  status: EnterpriseApprovalStatus;
};

export type EnterpriseWorkspaceProject = {
  id: string;
  name: string;
  goal: string;
  mode: 'one_man_enterprise' | 'auto' | 'chat';
  status: EnterpriseProjectStatus;
  agents: EnterpriseWorkspaceAgent[];
  tasks: EnterpriseWorkspaceTask[];
  messages: EnterpriseWorkspaceMessage[];
  deliverables: EnterpriseWorkspaceDeliverable[];
  approvals: EnterpriseWorkspaceApproval[];
  connections: AgentConnection[];
};

export type EnterpriseSetupStep = { id: string; label: string; description: string; status: 'pending' | 'active' | 'done' };
export interface OneManEnterpriseSetup {
  projectId: string;
  goal: string;
  projectTitle: string;
  overallProgress: number;
  status: 'initializing' | 'building' | 'ready';
  steps: EnterpriseSetupStep[];
  agents: EnterpriseWorkspaceAgent[];
  revealCount: number;
  startedAt: string;
  completedAt?: string;
}

export const ENTERPRISE_AGENT_AVATARS = {
  director: '/assets/agents/7.png',
  manager: '/assets/agents/8.png',
  research: '/assets/agents/9.png',
  analyst: '/assets/agents/10.png',
  writer: '/assets/agents/11.png',
  quality: '/assets/agents/12.png',
  operations: '/assets/agents/13.png',
  strategy: '/assets/agents/14.png',
} as const;

export const ENTERPRISE_SETUP_STORAGE_KEY = 'colony.one_man_enterprise.setup.v1';
export const WORKSPACE_MEMBERS_STORAGE_KEY = 'colony.workspace.members.v1';

export const ENTERPRISE_SETUP_BLUEPRINT: Array<{ label: string; description: string }> = [
  { label: 'Understanding business goal', description: 'Analyzing your one-person business goal' },
  { label: 'Defining operating structure', description: 'Designing an AI operating structure' },
  { label: 'Creating core roles', description: 'Creating specialist roles' },
  { label: 'Matching models to agents', description: 'Selecting the best model for each role' },
  { label: 'Assigning first responsibilities', description: 'Assigning responsibilities' },
  { label: 'Preparing the workspace', description: 'Preparing the workspace' },
  { label: 'Enterprise ready', description: 'Your AI enterprise is ready' },
];

const ENTERPRISE_PRESETS: Record<string, EnterpriseAgent[]> = {
  'Solo SaaS company': [
    { id: 'e1', name: 'AI Ant Director', role: 'CEO / Orchestrator', dept: 'Executive' },
    { id: 'e2', name: 'Operations Manager', role: 'Coordinates execution', dept: 'Operations' },
    { id: 'e3', name: 'Product Strategist', role: 'Roadmap & specs', dept: 'Product' },
    { id: 'e4', name: 'Research Lead', role: 'Market & user research', dept: 'Research' },
    { id: 'e5', name: 'Marketing Lead', role: 'Growth & content', dept: 'Marketing' },
    { id: 'e6', name: 'Automation Engineer', role: 'Workflows & tooling', dept: 'Engineering' },
    { id: 'e7', name: 'Finance Analyst', role: 'Revenue & runway', dept: 'Finance' },
    { id: 'e8', name: 'Customer Support Agent', role: 'Inbox & triage', dept: 'Support' },
  ],
};

function titleFromGoal(goal: string): string {
  const clean = goal.replace(/[^\w\s-]/g, '').trim();
  if (/sales|revenue|profit/i.test(clean)) return 'Daily Sales Report';
  if (/marketing|competitor|startup|product/i.test(clean)) return 'Market Launch Project';
  if (/store|shop|commerce/i.test(clean)) return 'Online Store Launch';
  if (/weekly|reporting|workflow/i.test(clean)) return 'Weekly Reporting Workflow';
  return clean.split(/\s+/).slice(0, 4).join(' ') || 'New AI Project';
}

export function inferCapabilitiesFromText(...parts: Array<string | string[] | undefined>): AgentCapability[] {
  const text = parts.flatMap((part) => Array.isArray(part) ? part : [part]).filter(Boolean).join(' ').toLowerCase();
  const caps = new Set<AgentCapability>();
  if (/research|source|web|competitor|market|search/.test(text)) caps.add('web_research');
  if (/summar|brief|writer|report|content|draft|caption|script/.test(text)) caps.add('summarization');
  if (/analyst|analysis|data|metric|sales|finance|spreadsheet|insight/.test(text)) caps.add('data_analysis');
  if (/write|reason|strategy|manager|director|plan|product|support/.test(text)) caps.add('text_reasoning');
  if (/review|quality|checker|approval|fact/.test(text)) caps.add('quality_review');
  return caps.size ? Array.from(caps) : ['text_reasoning'];
}

export function skillsForCapabilities(capabilities: AgentCapability[]): AgentSkill[] {
  return Array.from(new Set(capabilities)).map((capability) => createAgentSkill(capability));
}

export function defaultActiveModel(skills?: AgentSkill[]): ModelConfig | undefined {
  return skills?.[0] ? routeCapability(skills[0].capability, { provider: skills[0].provider, modelName: skills[0].modelName }) : undefined;
}

export function enterpriseAvatarForAgent(agent: EnterpriseAgent): string {
  if (agent.avatar) return agent.avatar;
  const text = `${agent.name} ${agent.role} ${agent.dept}`.toLowerCase();
  if (/director|ai ant|ceo|orchestrator/.test(text)) return ENTERPRISE_AGENT_AVATARS.director;
  if (/project manager|manager|operations/.test(text)) return ENTERPRISE_AGENT_AVATARS.manager;
  if (/research|market|source/.test(text)) return ENTERPRISE_AGENT_AVATARS.research;
  if (/analyst|data|finance/.test(text)) return ENTERPRISE_AGENT_AVATARS.analyst;
  if (/writer|content|marketing/.test(text)) return ENTERPRISE_AGENT_AVATARS.writer;
  if (/quality|checker|review|support|approval/.test(text)) return ENTERPRISE_AGENT_AVATARS.quality;
  if (/strategy|product/.test(text)) return ENTERPRISE_AGENT_AVATARS.strategy;
  return ENTERPRISE_AGENT_AVATARS.operations;
}

export function enterpriseCodeForAgent(agent: EnterpriseAgent): string {
  if (agent.code) return agent.code;
  const text = `${agent.name} ${agent.role} ${agent.dept}`.toLowerCase();
  if (/director|ai ant|ceo|orchestrator/.test(text)) return 'DR';
  if (/project manager|manager|operations/.test(text)) return 'PM';
  if (/research|market|source/.test(text)) return 'RA';
  if (/analyst|data|finance|strategy/.test(text)) return 'AN';
  if (/writer|content|marketing/.test(text)) return 'WR';
  if (/quality|checker|review|support|approval/.test(text)) return 'QC';
  return agent.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AG';
}

export function buildEnterpriseWorkspaceAgents(goal: string, sourceAgents?: EnterpriseAgent[]): EnterpriseWorkspaceAgent[] {
  const baseAgents = sourceAgents && sourceAgents.length > 0 ? sourceAgents : [
    { id: 'e1', code: 'DR', name: 'AI Ant Director', role: 'Operator / Executive director', dept: 'Direction', avatar: ENTERPRISE_AGENT_AVATARS.director },
    { id: 'e2', code: 'PM', name: 'Project Manager', role: 'Plans work and coordinates agents', dept: 'Operations', avatar: ENTERPRISE_AGENT_AVATARS.manager },
    { id: 'e3', code: 'RA', name: 'Research Agent', role: 'Collects market and source context', dept: 'Research', avatar: ENTERPRISE_AGENT_AVATARS.research },
    { id: 'e4', code: 'AN', name: 'Analyst Agent', role: 'Synthesizes findings into decisions', dept: 'Strategy', avatar: ENTERPRISE_AGENT_AVATARS.analyst },
    { id: 'e5', code: 'WR', name: 'Writer Agent', role: 'Creates the final deliverable', dept: 'Content', avatar: ENTERPRISE_AGENT_AVATARS.writer },
    { id: 'e6', code: 'QC', name: 'Quality Checker', role: 'Reviews output and approval risk', dept: 'Quality', avatar: ENTERPRISE_AGENT_AVATARS.quality },
  ];
  const director = baseAgents.find((agent) => /director|ant/i.test(agent.name)) ?? baseAgents[0];
  const manager = baseAgents.find((agent) => /manager|operations/i.test(agent.name)) ?? baseAgents[1] ?? director;
  const agentByKeyword = (keyword: RegExp, fallbackIndex: number) => baseAgents.find((agent) => keyword.test(`${agent.name} ${agent.role} ${agent.dept}`)) ?? baseAgents[fallbackIndex] ?? manager;
  const research = agentByKeyword(/research|market|source/i, 2);
  const analyst = agentByKeyword(/analyst|strategy|finance|data/i, 3);
  const writer = agentByKeyword(/writer|content|marketing|product/i, 4);
  const quality = agentByKeyword(/quality|support|checker|review|approval/i, 5);
  const ordered = Array.from(new Map([director, manager, research, analyst, writer, quality, ...baseAgents].map((agent) => [agent.id, agent])).values()).slice(0, 8);

  const defaultPositions: AgentNodePosition[] = [
    { x: 348, y: 20 },
    { x: 348, y: 150 },
    { x: 40, y: 300 },
    { x: 260, y: 300 },
    { x: 480, y: 300 },
    { x: 700, y: 300 },
    { x: 150, y: 430 },
    { x: 590, y: 430 },
  ];

  return ordered.map((agent, index) => {
    const isDirector = agent.id === director.id;
    const isManager = agent.id === manager.id;
    const parentAgentId = isDirector ? undefined : isManager ? director.id : manager.id;
    const progress = [48, 42, 66, 38, 24, 18, 12, 10][index] ?? 10;
    const status: EnterpriseAgentStatus = index === 0 ? 'thinking' : index <= 3 ? 'working' : index === 4 ? 'waiting' : 'idle';
    const taskSummary = agent.taskSummary
      ?? (isDirector ? 'Directing the operating plan'
        : isManager ? 'Turning the goal into parallel workstreams'
        : `Working on ${agent.dept.toLowerCase()} responsibilities`);
    const agentSkills = skillsForCapabilities(inferCapabilitiesFromText(agent.name, agent.role, agent.dept, taskSummary));
    return {
      ...agent,
      code: enterpriseCodeForAgent(agent),
      avatar: enterpriseAvatarForAgent(agent),
      parentAgentId,
      status,
      position: defaultPositions[index] ?? { x: 80 + (index % 4) * 220, y: 300 + Math.floor(index / 4) * 130 },
      progress,
      description: isDirector ? 'Owns the goal, decides execution mode, and keeps approvals visible.' : agent.role,
      currentTask: taskSummary,
      taskSummary,
      thoughtsSummary: isDirector
        ? `Goal is broad enough for a small AI organization. Keep the user focused on decisions and deliverables for "${titleFromGoal(goal)}".`
        : `Focus on the ${agent.dept.toLowerCase()} lane, summarize progress, and hand off only structured output.`,
      output: isDirector ? 'Operating brief and decision checkpoints' : `${agent.dept} summary for the final workspace deliverable`,
      tools: isDirector ? ['Project memory', 'Approval guard'] : isManager ? ['Task board', 'Workspace panel'] : ['Knowledge base', 'Draft editor'],
      dependencies: parentAgentId ? [parentAgentId] : [],
      agentSkills,
      activeModel: defaultActiveModel(agentSkills),
    };
  });
}

export function buildEnterpriseSetup(goal: string, sourceAgents?: EnterpriseAgent[]): OneManEnterpriseSetup {
  return {
    projectId: `enterprise-${Date.now()}`,
    goal,
    projectTitle: titleFromGoal(goal),
    overallProgress: 0,
    status: 'initializing',
    steps: ENTERPRISE_SETUP_BLUEPRINT.map((s, i) => ({
      id: `ess-${i}`, label: s.label, description: s.description, status: i === 0 ? 'active' : 'pending',
    })),
    agents: buildEnterpriseWorkspaceAgents(goal, sourceAgents).map((agent) => ({ ...agent, status: 'idle', progress: 0 })),
    revealCount: 0,
    startedAt: new Date().toISOString(),
  };
}

export function buildEnterpriseConnections(agents: EnterpriseWorkspaceAgent[]): AgentConnection[] {
  return agents
    .filter((agent) => agent.parentAgentId)
    .map((agent, index) => ({
      id: `conn-${agent.parentAgentId}-${agent.id}`,
      fromAgentId: agent.parentAgentId!,
      toAgentId: agent.id,
      label: index === 0 ? 'Operating plan' : /Quality|Checker/i.test(agent.name) ? 'Review flow' : 'Handoff',
      type: index === 0 ? 'reports_to' : /Quality|Checker/i.test(agent.name) ? 'review' : 'handoff',
      status: index === 2 ? 'active' : index === 4 ? 'completed' : 'normal',
      animated: index <= 3,
      lastHandoff: 'Just now',
    }));
}

export function buildEnterpriseWorkspaceProject(goal: string, sourceAgents?: EnterpriseAgent[]): EnterpriseWorkspaceProject {
  const agents = buildEnterpriseWorkspaceAgents(goal, sourceAgents);
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const findId = (keyword: RegExp, fallback: string) => agents.find((agent) => keyword.test(`${agent.name} ${agent.role} ${agent.dept}`))?.id ?? fallback;
  const director = agents.find((agent) => !agent.parentAgentId) ?? agents[0];
  const manager = agents.find((agent) => agent.parentAgentId === director?.id) ?? agents[1] ?? director;
  const managerId = manager.id;
  const researchId = findId(/research|source/i, managerId);
  const analystId = findId(/analyst|strategy|finance|data/i, managerId);
  const writerId = findId(/writer|content|marketing|product/i, managerId);
  const qualityId = findId(/quality|checker|review|support/i, managerId);
  return {
    id: `enterprise-${Date.now()}`,
    name: titleFromGoal(goal),
    goal,
    mode: 'one_man_enterprise',
    status: 'running',
    agents,
    tasks: [
      { id: 'et-1', title: 'Clarify operating goal', description: 'Define what this AI organization needs to produce first.', assignedAgentId: director.id, status: 'done', progress: 100 },
      { id: 'et-2', title: 'Create operating structure', description: 'Assign departments, owners, responsibilities, and handoffs.', assignedAgentId: managerId, status: 'in_progress', progress: 62, dependsOn: ['et-1'] },
      { id: 'et-3', title: 'Collect market/project context', description: 'Gather assumptions, audience, competitors, and source material.', assignedAgentId: researchId, status: 'in_progress', progress: 58, dependsOn: ['et-2'] },
      { id: 'et-4', title: 'Synthesize strategy', description: 'Turn research into priorities, risks, and a practical plan.', assignedAgentId: analystId, status: 'todo', progress: 22, dependsOn: ['et-3'] },
      { id: 'et-5', title: 'Draft first deliverable', description: 'Package the output as a plan the user can review and export.', assignedAgentId: writerId, status: 'todo', progress: 12, dependsOn: ['et-4'] },
      { id: 'et-6', title: 'Review before AI acts', description: 'Check quality and pause before external sends or tool actions.', assignedAgentId: qualityId, status: 'review', progress: 8, dependsOn: ['et-5'] },
    ],
    messages: [
      { id: 'em-1', fromAgentId: director.id, toAgentId: managerId, content: 'Goal accepted. Build a company-style operating structure, not a node workflow.', timestamp: now, type: 'handoff' },
      { id: 'em-2', fromAgentId: managerId, toAgentId: researchId, content: 'Start with market and project context. Return only summarized findings.', timestamp: now, type: 'update' },
      { id: 'em-3', fromAgentId: researchId, toAgentId: analystId, content: 'Market data collected. Early signal: positioning and first offer need definition.', timestamp: now, type: 'handoff' },
      { id: 'em-4', fromAgentId: analystId, toAgentId: writerId, content: 'Insights ready for the first operating plan draft.', timestamp: now, type: 'result' },
      { id: 'em-5', fromAgentId: qualityId, toAgentId: director.id, content: 'Draft will need approval before exporting or connecting external tools.', timestamp: now, type: 'approval_request' },
    ],
    deliverables: [
      { id: 'ed-1', title: `${titleFromGoal(goal)} Operating Plan`, type: 'plan', status: 'draft', content: 'Purpose, departments, agent responsibilities, first 30-day execution plan.' },
      { id: 'ed-2', title: 'AI Organization Map', type: 'summary', status: 'review_ready', content: 'Hierarchy, reporting lines, agent roles, and approval checkpoints.' },
    ],
    approvals: [
      { id: 'ea-1', title: 'Connect external tools', description: 'Pause before connecting apps, cloud drives, or publishing deliverables.', requestedByAgentId: qualityId, status: 'pending' },
    ],
    connections: buildEnterpriseConnections(agents),
  };
}

export function useOneManEnterpriseStartup({
  onWorkspaceReady,
}: {
  onWorkspaceReady: (project: EnterpriseWorkspaceProject) => void;
}) {
  const [enterpriseSetup, setEnterpriseSetup] = React.useState<OneManEnterpriseSetup | null>(() => {
    try {
      const raw = localStorage.getItem(ENTERPRISE_SETUP_STORAGE_KEY);
      return raw ? JSON.parse(raw) as OneManEnterpriseSetup : null;
    } catch {
      return null;
    }
  });
  const enterpriseTimersRef = React.useRef<number[]>([]);
  const enterpriseRestoredRef = React.useRef(false);

  const clearEnterpriseTimers = React.useCallback(() => {
    enterpriseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    enterpriseTimersRef.current = [];
  }, []);

  React.useEffect(() => () => clearEnterpriseTimers(), [clearEnterpriseTimers]);

  React.useEffect(() => {
    try {
      if (enterpriseSetup) localStorage.setItem(ENTERPRISE_SETUP_STORAGE_KEY, JSON.stringify(enterpriseSetup));
      else localStorage.removeItem(ENTERPRISE_SETUP_STORAGE_KEY);
    } catch {
      /* Local setup persistence only. */
    }
  }, [enterpriseSetup]);

  const launchEnterpriseSetup = React.useCallback((goal: string, sourceAgents?: EnterpriseAgent[]) => {
    clearEnterpriseTimers();
    setEnterpriseSetup(buildEnterpriseSetup(goal, sourceAgents));
    const total = ENTERPRISE_SETUP_BLUEPRINT.length;
    for (let i = 0; i < total; i++) {
      enterpriseTimersRef.current.push(window.setTimeout(() => {
        const last = i === total - 1;
        setEnterpriseSetup((previous) => previous ? {
          ...previous,
          status: last ? 'ready' : 'building',
          overallProgress: Math.round(((i + 1) / total) * 100),
          revealCount: Math.min(previous.agents.length, i + 1),
          completedAt: last ? new Date().toISOString() : previous.completedAt,
          agents: previous.agents.map((agent, index) => {
            if (index > i) return agent;
            const targetProgress = last ? [100, 92, 86, 72, 64, 58, 44, 38][index] ?? 38 : Math.min(88, 18 + (i + 1) * 12 - index * 5);
            const status: EnterpriseAgentStatus = last && index < 2 ? 'done' : index === i ? 'thinking' : index < i ? 'working' : 'idle';
            return { ...agent, status, progress: Math.max(agent.progress, targetProgress) };
          }),
          steps: previous.steps.map((step, index) => ({
            ...step,
            status: index < i + 1 ? (last && index === total - 1 ? 'done' : index <= i ? 'done' : step.status)
              : index === i + 1 ? 'active' : 'pending',
          })),
        } : previous);
      }, (i + 1) * 900));
    }
  }, [clearEnterpriseTimers]);

  React.useEffect(() => {
    if (enterpriseRestoredRef.current || !enterpriseSetup || enterpriseSetup.status === 'ready') return;
    enterpriseRestoredRef.current = true;
    launchEnterpriseSetup(enterpriseSetup.goal, enterpriseSetup.agents);
  }, [enterpriseSetup, launchEnterpriseSetup]);

  const openEnterpriseWorkspace = React.useCallback(() => {
    clearEnterpriseTimers();
    setEnterpriseSetup((previous) => {
      if (previous) {
        onWorkspaceReady({
          ...buildEnterpriseWorkspaceProject(previous.goal, previous.agents),
          id: previous.projectId,
          name: previous.projectTitle,
        });
      }
      return null;
    });
  }, [clearEnterpriseTimers, onWorkspaceReady]);

  return {
    enterpriseSetup,
    setEnterpriseSetup,
    launchEnterpriseSetup,
    openEnterpriseWorkspace,
    clearEnterpriseTimers,
  };
}

const ENTERPRISE_MODEL_PICKS: Array<{
  match: RegExp;
  selected: { provider: string; name: string; capability: string };
  candidates: Array<{ provider: string; name: string }>;
}> = [
  { match: /director|ceo|orchestrator|ant/i,
    selected: { provider: 'deepseek', name: 'DeepSeek V3', capability: 'Text Reasoning' },
    candidates: [{ provider: 'deepseek', name: 'DeepSeek V3' }, { provider: 'gemini', name: 'Gemini 2.5 Flash' }, { provider: 'openai', name: 'GPT-4.1 Mini' }] },
  { match: /project manager|manager|operations/i,
    selected: { provider: 'deepseek', name: 'DeepSeek V3', capability: 'Coordination' },
    candidates: [{ provider: 'deepseek', name: 'DeepSeek V3' }, { provider: 'gemini', name: 'Gemini 2.5 Flash' }, { provider: 'openai', name: 'GPT-4.1 Mini' }] },
  { match: /research|market|source/i,
    selected: { provider: 'perplexity', name: 'Perplexity Sonar', capability: 'Web Research' },
    candidates: [{ provider: 'perplexity', name: 'Perplexity Sonar' }, { provider: 'gemini', name: 'Gemini 2.5 Flash' }, { provider: 'deepseek', name: 'DeepSeek V3' }] },
  { match: /analyst|strategy|finance|data/i,
    selected: { provider: 'gemini', name: 'Gemini 2.5 Flash', capability: 'Summarization' },
    candidates: [{ provider: 'gemini', name: 'Gemini 2.5 Flash' }, { provider: 'openai', name: 'GPT-4.1 Mini' }, { provider: 'deepseek', name: 'DeepSeek V3' }] },
  { match: /writer|content|marketing|product/i,
    selected: { provider: 'deepseek', name: 'DeepSeek V3', capability: 'Drafting' },
    candidates: [{ provider: 'deepseek', name: 'DeepSeek V3' }, { provider: 'anthropic', name: 'Claude Haiku' }, { provider: 'openai', name: 'GPT-4.1 Mini' }] },
  { match: /quality|checker|review|support/i,
    selected: { provider: 'gemini', name: 'Gemini 2.5 Flash', capability: 'Quality Review' },
    candidates: [{ provider: 'gemini', name: 'Gemini 2.5 Flash' }, { provider: 'anthropic', name: 'Claude Haiku' }, { provider: 'deepseek', name: 'DeepSeek V3' }] },
];

function pickEnterpriseModel(agent: { name: string; role: string; dept?: string }) {
  const hay = `${agent.name} ${agent.role} ${agent.dept ?? ''}`;
  return ENTERPRISE_MODEL_PICKS.find((p) => p.match.test(hay)) ?? ENTERPRISE_MODEL_PICKS[0];
}

export function EnterpriseSetupPanel({ setup, onOpenWorkspace, onCancel }: {
  setup: OneManEnterpriseSetup;
  onOpenWorkspace: () => void;
  onCancel: () => void;
}) {
  const ready = setup.status === 'ready';
  const activeStep = setup.steps.find((s) => s.status === 'active') ?? setup.steps[setup.steps.length - 1];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05060d]/85 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#0a0d18] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative shrink-0 border-b border-white/[0.07] px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20"><Building2 size={15} className="text-violet-300" /></div>
            <p className="font-heading text-lg font-extrabold text-white">{ready ? 'Your AI enterprise is ready' : 'Building your AI enterprise'}</p>
          </div>
          <p className="mt-1.5 text-sm text-white/45">{ready ? `${setup.projectTitle} - ${setup.agents.length} agents, structure and responsibilities set.` : activeStep?.description}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
              animate={{ width: `${setup.overallProgress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        <div className="relative grid flex-1 gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Setup steps</p>
            <div className="space-y-2">
              {setup.steps.map((s) => (
                <div key={s.id} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs transition ${
                  s.status === 'active' ? 'border-violet-400/40 bg-violet-500/[0.10] text-white shadow-[0_0_20px_rgba(124,92,252,0.18)]'
                    : s.status === 'done' ? 'border-white/[0.06] bg-white/[0.02] text-white/50'
                    : 'border-white/[0.05] text-white/30'}`}>
                  {s.status === 'done' ? <Check size={13} className="text-emerald-400" />
                    : s.status === 'active' ? <Loader2 size={13} className="animate-spin text-violet-300" />
                    : <span className="h-[13px] w-[13px] rounded-full border border-white/15" />}
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Core roles</p>
            <div className="space-y-2">
              <AnimatePresence>
                {setup.agents.slice(0, setup.revealCount).map((a) => (
                  <motion.div key={a.id}
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28 }}
                    className="flex items-center gap-2.5 rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden"
                      style={{
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(15, 23, 42, 0.08)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                        padding: 2,
                      }}>
                      <img src={a.avatar} alt={a.name} draggable={false} className="h-full w-full object-contain" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-white/85">{a.name}</p>
                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-white/45">{a.code}</span>
                      </div>
                      <p className="truncate text-[10px] text-white/40">{a.role}</p>
                      <p className="mt-1 truncate text-[10px] text-white/28">{a.taskSummary ?? a.currentTask}</p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300" style={{ width: `${a.progress}%` }} />
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${a.status === 'done' ? 'bg-emerald-400/10 text-emerald-200' : a.status === 'thinking' ? 'bg-violet-400/10 text-violet-200' : a.status === 'working' ? 'bg-cyan-400/10 text-cyan-200' : 'bg-white/[0.06] text-white/35'}`}>{a.status}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {setup.revealCount === 0 && <p className="py-6 text-center text-[11px] text-white/25">Assembling the team...</p>}
            </div>
          </div>

          {setup.revealCount > 0 && (
            <div className="md:col-span-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Matching models to agents</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <AnimatePresence>
                  {setup.agents.slice(0, setup.revealCount).map((a) => {
                    const pick = pickEnterpriseModel(a);
                    return (
                      <motion.div key={`mm-${a.id}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden"
                            style={{
                              borderRadius: 6,
                              backgroundColor: '#ffffff',
                              border: '1px solid rgba(15, 23, 42, 0.08)',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                              padding: 2,
                            }}>
                            <img src={a.avatar} alt="" className="h-full w-full object-contain" />
                          </span>
                          <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/80">{a.name}</p>
                          <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-white/40">{pick.selected.capability}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pick.candidates.map((c, idx) => {
                            const isSelected = c.provider === pick.selected.provider && c.name === pick.selected.name;
                            return (
                              <motion.div key={`${c.provider}-${c.name}`}
                                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.18 + 0.05 }}
                                className={`flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[10px] font-semibold transition ${
                                  isSelected
                                    ? 'border-violet-400/55 bg-violet-400/[0.10] text-white shadow-[0_0_16px_rgba(124,92,252,0.30)]'
                                    : 'border-white/[0.08] bg-white/[0.02] text-white/40'}`}>
                                <ProviderLogo provider={c.provider} size="xs" />
                                <span className="max-w-[100px] truncate">{c.name}</span>
                                {isSelected && <Check size={10} className="text-emerald-300" />}
                              </motion.div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[10px] text-white/40">
                          <span className="text-white/55">Selected:</span> <span className="text-violet-200">{pick.selected.name}</span>
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
          <button onClick={onCancel} className="rounded-[10px] border border-white/[0.12] px-4 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Cancel</button>
          <button onClick={onOpenWorkspace} disabled={!ready}
            className="flex items-center gap-1.5 rounded-[10px] bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">
            {ready ? <>Continue to Workspace <ArrowRight size={14} /></> : 'Preparing...'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function OneManEnterprisePanel({ onClose, onStart }: { onClose: () => void; onStart: (agents: EnterpriseAgent[]) => void }) {
  const [stage, setStage] = useState<'prompt' | 'org'>('prompt');
  const [kind, setKind] = useState('Solo SaaS company');
  const [agents, setAgents] = useState<EnterpriseAgent[]>([]);

  const generate = () => {
    setAgents(ENTERPRISE_PRESETS[kind] ?? ENTERPRISE_PRESETS['Solo SaaS company']);
    setStage('org');
  };
  const addAgent = () => setAgents((a) => [...a, { id: `e-${Date.now()}`, name: 'New Agent', role: 'Define responsibility', dept: 'General' }]);
  const removeAgent = (id: string) => setAgents((a) => a.filter((x) => x.id !== id));
  const rename = (id: string, name: string) => setAgents((a) => a.map((x) => x.id === id ? { ...x, name } : x));

  return (
    <div className="fixed inset-0 z-[210] flex flex-col bg-[#070710]/95 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-violet-300" />
          <h2 className="font-heading text-lg font-extrabold text-white">One-man Enterprise</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white"><X className="h-5 w-5" /></button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {stage === 'prompt' ? (
          <div className="mx-auto max-w-xl pt-10 text-center">
            <h3 className="font-heading text-2xl font-extrabold text-white">What kind of one-man enterprise do you want to build?</h3>
            <p className="mt-2 text-sm text-white/45">AI Ant will generate an editable AI organization - not automation nodes.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {['Solo SaaS company', 'Content agency', 'Online store', 'Research studio', 'Marketing agency', 'Startup launch team'].map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${kind === k ? 'border-violet-500/50 bg-violet-500/15 text-white' : 'border-white/[0.1] text-white/60 hover:bg-white/[0.05]'}`}>{k}</button>
              ))}
            </div>
            <button onClick={generate} className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-500">Generate my AI organization</button>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-xl font-extrabold text-white">{kind}</h3>
                <p className="text-sm text-white/45">Edit your AI org. Add, rename, or remove agents before they start working.</p>
              </div>
              <button onClick={addAgent} className="flex items-center gap-1.5 rounded-lg border border-white/[0.14] px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/[0.06]"><Plus className="h-3.5 w-3.5" /> Add agent</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((a) => (
                <div key={a.id} className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-white/[0.10] bg-white/[0.06]">
                        <img src={enterpriseAvatarForAgent(a)} alt={a.name} draggable={false} className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">{a.dept}</span>
                        <span className="ml-1.5 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-white/38">{enterpriseCodeForAgent(a)}</span>
                      </span>
                    </div>
                    <button onClick={() => removeAgent(a.id)} className="text-white/30 transition hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <input value={a.name} onChange={(e) => rename(a.id, e.target.value)} className="mt-3 w-full bg-transparent font-heading text-sm font-extrabold text-white outline-none" />
                  <p className="mt-1 text-xs text-white/45">{a.role}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/30">{a.taskSummary ?? `Own the ${a.dept.toLowerCase()} lane for this enterprise.`}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setStage('prompt')} className="rounded-xl border border-white/[0.16] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06]">Back</button>
              <button onClick={() => onStart(agents)} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500">Start working</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EnterpriseOrgPreviewPanel({ project, onOpenWorkspace }: { project: EnterpriseWorkspaceProject; onOpenWorkspace: () => void }) {
  const director = project.agents.find((agent) => !agent.parentAgentId) ?? project.agents[0];
  const children = project.agents.filter((agent) => agent.parentAgentId === director?.id);
  const remaining = project.agents.filter((agent) => agent.parentAgentId && agent.parentAgentId !== director?.id);
  const statusTone: Record<EnterpriseAgentStatus, string> = {
    idle: 'bg-white/[0.06] text-white/38',
    thinking: 'bg-violet-400/10 text-violet-200',
    working: 'bg-emerald-400/10 text-emerald-200',
    waiting: 'bg-amber-400/10 text-amber-200',
    done: 'bg-white/[0.06] text-white/35',
    blocked: 'bg-red-400/10 text-red-200',
  };
  const overallProgress = Math.round(project.agents.reduce((sum, agent) => sum + agent.progress, 0) / Math.max(1, project.agents.length));
  const renderAgent = (agent: EnterpriseWorkspaceAgent, compact = false) => (
    <div key={agent.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.035] p-3 transition hover:border-white/[0.14] hover:bg-white/[0.05]">
      <div className="flex items-start gap-2.5">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-white/[0.12] bg-[#f4f4f8]">
          <img src={agent.avatar} alt={agent.name} draggable={false} className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white/86">{agent.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/42"><span className="text-violet-200/70">{agent.code}</span> - {agent.role}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusTone[agent.status]}`}>{agent.status}</span>
          </div>
        </div>
      </div>
      {!compact && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/38">{agent.taskSummary ?? agent.currentTask}</p>}
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300 transition-[width] duration-500" style={{ width: `${agent.progress}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-white/28">{agent.progress}%</p>
    </div>
  );

  return (
    <aside className="hidden w-[340px] shrink-0 border-l border-white/[0.07] bg-[#0a101d]/92 p-4 text-white xl:flex xl:flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/60">Organization preview</p>
          <h3 className="mt-1 font-heading text-base font-extrabold text-white/90">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/38">{project.goal}</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-bold text-emerald-200">{project.status}</span>
      </div>

      <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Overall progress</p>
          <span className="text-xs font-bold text-white/70">{overallProgress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        {director && renderAgent(director)}
        {children.length > 0 && (
          <div className="ml-4 mt-3 border-l border-violet-300/15 pl-3">
            {children.map((agent) => (
              <div key={agent.id} className="mb-3">
                {renderAgent(agent, true)}
              </div>
            ))}
          </div>
        )}
        {remaining.length > 0 && (
          <div className="ml-8 mt-1 border-l border-emerald-300/10 pl-3">
            {remaining.map((agent) => (
              <div key={agent.id} className="mb-3">
                {renderAgent(agent, true)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Live handoffs</p>
          <div className="mt-3 space-y-2">
            {project.messages.slice(-3).map((message) => {
              const from = project.agents.find((agent) => agent.id === message.fromAgentId)?.name ?? 'Agent';
              const to = project.agents.find((agent) => agent.id === message.toAgentId)?.name ?? 'AI Ant';
              return (
                <p key={message.id} className="text-[11px] leading-relaxed text-white/45">
                  <span className="text-violet-200/75">{from}</span> - <span className="text-emerald-200/70">{to}</span>: {message.content}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.07] pt-4">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            ['Agents', project.agents.length],
            ['Tasks', project.tasks.length],
            ['Approvals', project.approvals.filter((item) => item.status === 'pending').length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[12px] bg-white/[0.035] p-2 text-center">
              <p className="text-sm font-bold text-white/82">{value}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/25">{label}</p>
            </div>
          ))}
        </div>
        <button onClick={onOpenWorkspace} className="w-full rounded-[12px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500">Open Workspace</button>
      </div>
    </aside>
  );
}
