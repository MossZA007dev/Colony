// Colony Crew / Orchestration types.
// Extracted from src/App.tsx as part of Phase 1 of the file split refactor.
// Definitions are byte-for-byte the originals so behavior stays identical.

import type { AgentSkill, ModelConfig } from '../aiOrchestration';

export type OrchestrationMode = 'chat' | 'agent-selection' | 'agent-running';
export type OrchestrationView = 'chat' | 'graph';
export type AgentAvatarColor = 'green' | 'amber' | 'blue' | 'purple' | 'gray';

export interface OrchAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  status: 'idle' | 'running' | 'waiting' | 'queued' | 'done' | 'error';
  position: { x: number; y: number };
  currentTask?: string;
}

export interface OrchMessage {
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

export type CrewPhase = 'matching' | 'crew_ready' | 'running' | 'reviewing' | 'completed' | 'stopped';

export type CrewAgentKind = 'research' | 'analyst' | 'writer' | 'reviewer';

export interface AgentInstructionMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  createdAt: string;
}

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

export type CrewControlIntent = 'stop' | 'pause' | 'resume' | 'update' | 'reassign' | 'refine';
