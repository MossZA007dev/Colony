// Workspace storage, repair, work-item normalization, and chat-title helpers.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.

import React from 'react';
import { Building2, MessageSquare, Network, Users, Workflow } from 'lucide-react';
import type {
  AppDeliverable,
  WorkspaceChat,
  WorkspaceDeliverableItem,
  WorkspaceProject,
} from '../types/appTypes';
import type { WorkItemStatus, WorkItemType } from '../work/workItems';

// ── Visual metadata for Recent Work entries ──────────────────────────────────

export const WORK_STATUS_LABELS: Record<WorkItemStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  setup: 'Setup',
  assembling: 'Assembling',
  running: 'Running',
  waiting_approval: 'Approval required',
  scheduled: 'Scheduled',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
};

export const WORK_TYPE_META: Record<WorkItemType, { label: string; icon: React.ElementType; tone: string }> = {
  chat: { label: 'CHAT', icon: MessageSquare, tone: 'text-white/45' },
  bridge: { label: 'BRIDGE', icon: Network, tone: 'text-violet-200/80' },
  crew: { label: 'CREW', icon: Users, tone: 'text-fuchsia-200/78' },
  automation: { label: 'AUTOMATION', icon: Workflow, tone: 'text-emerald-200/78' },
  enterprise: { label: 'ENTERPRISE', icon: Building2, tone: 'text-sky-200/78' },
};

// ── Work-item normalization ──────────────────────────────────────────────────

export function normalizeWorkItemType(value: unknown): WorkItemType | undefined {
  return value === 'chat' || value === 'bridge' || value === 'crew' || value === 'automation' || value === 'enterprise'
    ? value
    : undefined;
}

export function normalizeWorkItemStatus(value: unknown): WorkItemStatus | undefined {
  return value === 'draft' || value === 'active' || value === 'setup' || value === 'assembling' || value === 'running'
    || value === 'waiting_approval' || value === 'scheduled' || value === 'paused' || value === 'completed' || value === 'failed'
    ? value
    : undefined;
}

export function resolveWorkItemType(item: Pick<WorkspaceChat, 'workType'>): WorkItemType {
  return item.workType ?? 'chat';
}

export function resolveChatWorkStatus(chat: WorkspaceChat): WorkItemStatus | undefined {
  if (chat.workStatus) return chat.workStatus;
  if (resolveWorkItemType(chat) === 'chat' && chat.title === 'New chat' && chat.messages.length === 0) return 'draft';
  return undefined;
}

export function isEmptyDraftStandaloneChat(chat: WorkspaceChat | null | undefined) {
  return Boolean(
    chat
    && resolveWorkItemType(chat) === 'chat'
    && chat.title === 'New chat'
    && chat.messages.length === 0
    && !chat.userRenamed
  );
}

export function sourceConversationForFeature(chat: WorkspaceChat | null | undefined) {
  if (!chat || isEmptyDraftStandaloneChat(chat) || resolveWorkItemType(chat) !== 'chat') return undefined;
  return chat.id;
}

// ── Seed data and storage keys ───────────────────────────────────────────────

export const WS_CHATS_KEY = 'colony.workspace.chats.v1';
export const WS_PROJECTS_KEY = 'colony.workspace.projects.v1';
export const APP_DELIVERABLES_KEY = 'colony.app.deliverables.v1';

export const SEED_WS_PROJECTS: WorkspaceProject[] = [
  {
    id: 'wsp-sales',
    name: 'Daily Sales Report',
    goal: 'Analyze sales, detect changes, and produce a business report.',
    description: 'Sales analysis workspace',
    type: 'enterprise',
    status: 'running',
    agentCount: 5, workflowCount: 1, taskCount: 6, deliverableCount: 3, approvalCount: 1,
    progress: 44,
    lastActivity: 'Research Agent summarized new sales changes.',
    nextAction: 'Approve report export.',
    createdAt: Date.now() - 864e5 * 6, updatedAt: Date.now() - 36e5,
  },
  {
    id: 'wsp-launch',
    name: 'Market Launch Project',
    goal: 'Research competitors and prepare a 30-day marketing plan.',
    description: 'Go-to-market workspace',
    type: 'crew',
    status: 'needs_approval',
    agentCount: 4, workflowCount: 0, taskCount: 4, deliverableCount: 2, approvalCount: 2,
    progress: 72,
    lastActivity: 'Brand Strategist finalized competitor analysis.',
    nextAction: 'Review and approve marketing plan.',
    createdAt: Date.now() - 864e5 * 3, updatedAt: Date.now() - 72e5,
  },
  {
    id: 'wsp-content',
    name: 'Content Pipeline',
    goal: 'Turn ideas into weekly posts, drafts, and review-ready assets.',
    description: 'Creative content workflow',
    type: 'workflow',
    status: 'waiting',
    agentCount: 2, workflowCount: 1, taskCount: 3, deliverableCount: 5, approvalCount: 0,
    progress: 60,
    lastActivity: 'Workflow paused — waiting for next Monday trigger.',
    nextAction: 'Wait for scheduled run or resume manually.',
    createdAt: Date.now() - 864e5 * 10, updatedAt: Date.now() - 864e5,
  },
];

export const SEED_WS_CHATS: WorkspaceChat[] = [
  { id: 'wsc-1', projectId: null, title: 'Summarize this quarter', mode: 'simple_chat', messages: [], createdAt: Date.now() - 36e5, updatedAt: Date.now() - 36e5 },
  { id: 'wsc-2', projectId: 'wsp-sales', title: 'Build the sales report team', mode: 'ai_team_task', messages: [], createdAt: Date.now() - 72e5, updatedAt: Date.now() - 50e5 },
  { id: 'wsc-seed-crew', projectId: 'wsp-launch', title: 'Launch strategy report', mode: 'ai_team_task', messages: [], workType: 'crew', workStatus: 'completed', sessionId: 'crew-run-001', createdAt: Date.now() - 9e6, updatedAt: Date.now() - 9e6 },
  { id: 'wsc-seed-automation', projectId: 'wsp-content', title: 'Weekly sales summary', mode: 'workflow_task', messages: [], workType: 'automation', workStatus: 'scheduled', sessionId: 'wf-weekly-sales', createdAt: Date.now() - 12e6, updatedAt: Date.now() - 12e6 },
  { id: 'wsc-seed-enterprise', projectId: 'wsp-sales', title: 'Online store operations', mode: 'one_man_enterprise', messages: [], workType: 'enterprise', workStatus: 'active', sessionId: 'enterprise-online-store', createdAt: Date.now() - 16e6, updatedAt: Date.now() - 16e6 },
];

export const SEED_WS_DELIVERABLES: WorkspaceDeliverableItem[] = [
  { id: 'wsd-1', projectId: 'wsp-sales', title: 'Daily Sales Summary', type: 'Report', status: 'Needs review', ownerAgent: 'Report Writer', preview: 'Revenue, cost, margin, and recommended actions.', updatedAt: Date.now() - 18e5 },
  { id: 'wsd-2', projectId: 'wsp-launch', title: '30-day Marketing Plan', type: 'Marketing plan', status: 'Approved', ownerAgent: 'Brand Strategist', preview: 'Action calendar, channels, content ideas, metrics.', updatedAt: Date.now() - 9e6 },
];

export const SEED_APP_DELIVERABLES: AppDeliverable[] = [
  {
    id: 'del-seed-1',
    title: 'Daily Sales Summary',
    description: 'Cleaned sales summary with revenue, cost, margin, and recommended actions.',
    type: 'report',
    status: 'needs_review',
    ownerAgent: 'Report Writer',
    projectId: 'wsp-sales',
    projectName: 'Daily Sales Report',
    sourceChatId: 'wsc-2',
    createdAt: new Date(Date.now() - 18e5).toISOString(),
    updatedAt: new Date(Date.now() - 18e5).toISOString(),
    version: 2,
    content: 'Revenue: $42,800 · Cost: $28,600 · Margin: 33% · Top platform: Grab Food (38%). Recommended actions: increase promotional budget for Line MAN and renegotiate delivery fee tier.',
    sourcePrompt: 'Build the sales report team for daily sales data',
  },
  {
    id: 'del-seed-2',
    title: 'Competitor Comparison',
    description: 'Positioning gaps, pricing notes, and launch opportunities identified from market research.',
    type: 'research',
    status: 'draft',
    ownerAgent: 'Research Agent',
    sourceChatId: 'wsc-1',
    createdAt: new Date(Date.now() - 72e5).toISOString(),
    updatedAt: new Date(Date.now() - 72e5).toISOString(),
    version: 3,
    content: 'Competitor A: leads on price. Competitor B: strong brand. Mid-market segment underserved. Recommend positioning at quality/service intersection with 15–20% premium over Competitor A.',
    sourcePrompt: 'Summarize this quarter — competitive landscape',
  },
  {
    id: 'del-seed-3',
    title: '30-day Marketing Plan',
    description: 'Action calendar, channels, content ideas, and success metrics for the product launch.',
    type: 'plan',
    status: 'approved',
    ownerAgent: 'Brand Strategist',
    projectId: 'wsp-launch',
    projectName: 'Market Launch',
    sourceCrewRunId: 'crew-run-001',
    createdAt: new Date(Date.now() - 9e6).toISOString(),
    updatedAt: new Date(Date.now() - 9e6).toISOString(),
    version: 1,
    content: 'Week 1: brand awareness campaign. Week 2: influencer seeding. Week 3–4: paid acquisition + retargeting. KPIs: 5,000 impressions, 200 signups, CPL < $8.',
    sourcePrompt: 'Create a 30-day marketing plan for the product launch',
  },
  {
    id: 'del-seed-4',
    title: 'Q2 Content Strategy',
    description: 'Weekly content pillars, topic clusters, and publishing schedule across all channels.',
    type: 'strategy',
    status: 'export_ready',
    ownerAgent: 'Content Planner Agent',
    projectId: 'wsp-content',
    projectName: 'Content Workflow',
    sourceWorkflowId: 'wf-content-q2',
    createdAt: new Date(Date.now() - 5e6).toISOString(),
    updatedAt: new Date(Date.now() - 5e6).toISOString(),
    version: 2,
    content: 'Pillar 1: Product education (40%). Pillar 2: Case studies (30%). Pillar 3: Community (30%). Schedule: 3×/week blog, 5×/week social, 1×/week newsletter.',
    sourcePrompt: 'Build Q2 content strategy with publishing calendar',
  },
];

// ── Storage helpers ──────────────────────────────────────────────────────────

export function loadAppDeliverables(): AppDeliverable[] {
  try {
    const raw = localStorage.getItem(APP_DELIVERABLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppDeliverable[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_APP_DELIVERABLES;
}

export function saveAppDeliverables(items: AppDeliverable[]) {
  try { localStorage.setItem(APP_DELIVERABLES_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function repairWorkspaceChats(items: WorkspaceChat[]): WorkspaceChat[] {
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  const seenFeatureKeys = new Set<string>();
  const recentFeatureByTitle = new Map<string, WorkspaceChat>();
  const kept: WorkspaceChat[] = [];
  const enterpriseItems: WorkspaceChat[] = [];

  for (const item of sorted) {
    const type = resolveWorkItemType(item);
    if (type !== 'chat') {
      const key = `${type}:${item.sessionId ?? item.sourceConversationId ?? item.title.toLowerCase()}`;
      const titleKey = `${type}:${item.title.trim().toLowerCase()}`;
      const recentSameTitle = recentFeatureByTitle.get(titleKey);
      const sameLaunchWindow = recentSameTitle
        ? Math.abs(item.createdAt - recentSameTitle.createdAt) < 5 * 60 * 1000 || Math.abs(item.updatedAt - recentSameTitle.updatedAt) < 5 * 60 * 1000
        : false;
      if (sameLaunchWindow) continue;
      if (seenFeatureKeys.has(key)) continue;
      seenFeatureKeys.add(key);
      const normalized = type === 'enterprise' && item.workStatus === 'setup' && item.enterpriseWorkspace
        ? { ...item, workStatus: 'running' as WorkItemStatus }
        : item;
      kept.push(normalized);
      recentFeatureByTitle.set(titleKey, normalized);
      if (type === 'enterprise') enterpriseItems.push(normalized);
      continue;
    }
    kept.push(item);
  }

  const enterpriseTitles = new Map(enterpriseItems.map((item) => [item.title.trim().toLowerCase(), item]));
  return kept
    .filter((item) => {
      if (resolveWorkItemType(item) !== 'chat') return true;
      const enterprise = enterpriseTitles.get(item.title.trim().toLowerCase());
      if (!enterprise) return true;
      const closeInTime = Math.abs(item.createdAt - enterprise.createdAt) < 5 * 60 * 1000 || Math.abs(item.updatedAt - enterprise.updatedAt) < 5 * 60 * 1000;
      return !(item.workStatus === 'active' && !item.userRenamed && closeInTime);
    })
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.updatedAt - a.updatedAt);
}

export function loadWorkspaceChats(): WorkspaceChat[] {
  try {
    const raw = localStorage.getItem(WS_CHATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkspaceChat>[];
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((chat, index) => {
          const now = Date.now();
          return {
            id: typeof chat.id === 'string' ? chat.id : `wsc-migrated-${now}-${index}`,
            projectId: chat.projectId ?? null,
            title: typeof chat.title === 'string' && chat.title.trim() ? chat.title : 'New chat',
            mode: chat.mode ?? 'simple_chat',
            messages: Array.isArray(chat.messages) ? chat.messages : [],
            isPinned: chat.isPinned,
            isArchived: chat.isArchived,
            userRenamed: chat.userRenamed,
            workType: normalizeWorkItemType(chat.workType),
            workStatus: normalizeWorkItemStatus(chat.workStatus),
            sourceConversationId: typeof chat.sourceConversationId === 'string' ? chat.sourceConversationId : undefined,
            sessionId: typeof chat.sessionId === 'string' ? chat.sessionId : undefined,
            enterpriseWorkspace: chat.enterpriseWorkspace,
            createdAt: typeof chat.createdAt === 'number' ? chat.createdAt : now,
            updatedAt: typeof chat.updatedAt === 'number' ? chat.updatedAt : (typeof chat.createdAt === 'number' ? chat.createdAt : now),
          };
        });
        return repairWorkspaceChats(normalized);
      }
    }
  } catch { /* ignore */ }
  return SEED_WS_CHATS;
}

export function loadWorkspaceProjects(): WorkspaceProject[] {
  try {
    const raw = localStorage.getItem(WS_PROJECTS_KEY);
    if (raw) return JSON.parse(raw) as WorkspaceProject[];
  } catch { /* ignore */ }
  return SEED_WS_PROJECTS;
}

// ── Chat title generator ─────────────────────────────────────────────────────

export function generateChatTitle(message: string): string {
  const stopWords = new Set(['can', 'you', 'please', 'help', 'me', 'the', 'this', 'that', 'with', 'for', 'and', 'a', 'an', 'to', 'my', 'our', 'i', 'want', 'need']);
  const words = message
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !stopWords.has(word.toLowerCase()))
    .slice(0, 5);
  const source = words.length ? words : message.replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 5);
  const title = source.join(' ').trim();
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : 'New chat';
}
