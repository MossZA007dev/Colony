import type { BridgeSession } from '../bridge/bridgeSessionStore';
import { sessionStatusLabel } from '../bridge/bridgeSessionStore';

export type WorkItemType = 'chat' | 'bridge' | 'crew' | 'automation' | 'enterprise';
export type WorkItemStatus =
  | 'draft'
  | 'active'
  | 'setup'
  | 'assembling'
  | 'running'
  | 'waiting_approval'
  | 'scheduled'
  | 'paused'
  | 'completed'
  | 'failed';

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  status?: WorkItemStatus | string;
  updatedAt: number;
  sourceConversationId?: string;
  sessionId?: string;
  isPinned?: boolean;
  source: 'chat' | 'bridge';
}

export interface ChatLikeForWork {
  id: string;
  title: string;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  workType?: WorkItemType;
  workStatus?: WorkItemStatus;
  sourceConversationId?: string;
  sessionId?: string;
  messages?: unknown[];
}

export function chatToWorkItem(chat: ChatLikeForWork): WorkItem {
  const type = chat.workType ?? 'chat';
  return {
    id: chat.id,
    title: chat.title || 'Untitled chat',
    type,
    status: chat.workStatus ?? (type === 'chat' && chat.title === 'New chat' && (!chat.messages || chat.messages.length === 0) ? 'draft' : undefined),
    updatedAt: chat.updatedAt,
    sourceConversationId: chat.sourceConversationId,
    sessionId: chat.sessionId,
    isPinned: Boolean(chat.isPinned),
    source: 'chat',
  };
}

export function sessionToWorkItem(session: BridgeSession): WorkItem {
  return {
    id: session.id,
    title: session.title || session.taskPrompt || 'Bridge task',
    type: 'bridge',
    status: sessionStatusLabel(session.status),
    updatedAt: session.updatedAt,
    sourceConversationId: session.sourceConversationId,
    sessionId: session.id,
    source: 'bridge',
  };
}

export function buildWorkItems(args: {
  chats: ChatLikeForWork[];
  bridgeSessions: BridgeSession[];
}): WorkItem[] {
  const chatItems = args.chats
    .filter((c) => !c.isArchived)
    .map(chatToWorkItem);
  const bridgeItems = args.bridgeSessions.map(sessionToWorkItem);
  const all = [...chatItems, ...bridgeItems];
  // Pinned first, then most recently updated.
  return all.sort((a, b) => {
    const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinDiff !== 0) return pinDiff;
    return b.updatedAt - a.updatedAt;
  });
}

export const WORK_ITEM_TYPE_LABEL: Record<WorkItemType, string> = {
  chat: 'Chat',
  bridge: 'Bridge',
  crew: 'Crew',
  automation: 'Automation',
  enterprise: 'Enterprise',
};

export const WORK_ITEM_TYPE_TONE: Record<WorkItemType, string> = {
  chat: 'text-white/45',
  bridge: 'text-violet-200/85',
  crew: 'text-emerald-200/85',
  automation: 'text-sky-200/85',
  enterprise: 'text-amber-200/85',
};
