import type { OperatorState } from '../../pages/bridge/state/operatorTypes';

export type BridgeSessionStatus =
  | 'setup'
  | 'running'
  | 'waiting_approval'
  | 'paused'
  | 'completed'
  | 'failed';

export interface BridgeActivityEvent {
  id: string;
  time: string;
  label: string;
  status: 'complete' | 'active' | 'warning' | 'waiting';
}

export interface BridgeSession {
  id: string;
  title: string;
  taskPrompt: string;
  scenarioId: string;
  sourceConversationId?: string;
  status: BridgeSessionStatus;
  operatorState: OperatorState;
  activityLog: BridgeActivityEvent[];
  deliverableIds: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'colony.bridge.sessions.v1';

function safeRead(): BridgeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is BridgeSession => Boolean(s && typeof s.id === 'string'));
  } catch {
    return [];
  }
}

function safeWrite(sessions: BridgeSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

export function loadBridgeSessions(): BridgeSession[] {
  return safeRead().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveBridgeSessions(sessions: BridgeSession[]): void {
  safeWrite(sessions);
}

export function findBridgeSession(id: string | null | undefined): BridgeSession | undefined {
  if (!id) return undefined;
  return safeRead().find((s) => s.id === id);
}

export function upsertBridgeSession(session: BridgeSession): BridgeSession[] {
  const existing = safeRead();
  const next = [
    { ...session, updatedAt: Date.now() },
    ...existing.filter((s) => s.id !== session.id),
  ];
  safeWrite(next);
  return next;
}

export function deleteBridgeSession(id: string): BridgeSession[] {
  const next = safeRead().filter((s) => s.id !== id);
  safeWrite(next);
  return next;
}

export function operatorStateToSessionStatus(state: OperatorState): BridgeSessionStatus {
  if (state === 'completed') return 'completed';
  if (state === 'failed' || state === 'blocked') return 'failed';
  if (state === 'paused') return 'paused';
  if (state === 'approval_required') return 'waiting_approval';
  if (
    state === 'idle' ||
    state === 'analyzing' ||
    state === 'requirements_detected' ||
    state === 'capability_check' ||
    state === 'plan_ready'
  ) {
    return 'setup';
  }
  return 'running';
}

export function sessionStatusLabel(status: BridgeSessionStatus): string {
  switch (status) {
    case 'setup': return 'Setup';
    case 'running': return 'Running';
    case 'waiting_approval': return 'Approval required';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'failed': return 'Interrupted';
    default: return status;
  }
}
