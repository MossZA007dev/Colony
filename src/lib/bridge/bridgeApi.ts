import { BridgeConnection, BridgeRequest, BridgeService, BridgeRiskLevel } from './bridgeTypes';

function getApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
}

export async function fetchBridgeConnections(userId: string = 'anonymous'): Promise<BridgeConnection[]> {
  const res = await fetch(`${getApiBase()}/bridge/connections?user_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch connections');
  return res.json();
}

export async function disconnectBridgeService(service: BridgeService, userId: string = 'anonymous'): Promise<void> {
  const res = await fetch(`${getApiBase()}/bridge/connections/${service}?user_id=${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to disconnect');
}

export function getBridgeOAuthUrl(userId: string = 'anonymous'): string {
  return `${getApiBase()}/bridge/oauth/google/start?user_id=${userId}`;
}

export async function createBridgeRequest(payload: {
  service: BridgeService;
  action: string;
  params: Record<string, any>;
  risk: BridgeRiskLevel;
  reason: string;
  requesting_agent_id?: string;
  user_id?: string;
}): Promise<BridgeRequest> {
  const res = await fetch(`${getApiBase()}/bridge/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'anonymous', ...payload })
  });
  if (!res.ok) throw new Error('Failed to create request');
  return res.json();
}

export async function fetchBridgeRequests(userId: string = 'anonymous', status?: string): Promise<BridgeRequest[]> {
  let url = `${getApiBase()}/bridge/requests?user_id=${userId}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

export async function approveBridgeRequest(reqId: string, userId: string = 'anonymous'): Promise<BridgeRequest> {
  const res = await fetch(`${getApiBase()}/bridge/requests/${reqId}/approve?user_id=${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json();
}

export async function rejectBridgeRequest(reqId: string, userId: string = 'anonymous'): Promise<BridgeRequest> {
  const res = await fetch(`${getApiBase()}/bridge/requests/${reqId}/reject?user_id=${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}

export async function executeBridgeRequest(reqId: string, userId: string = 'anonymous'): Promise<BridgeRequest> {
  const res = await fetch(`${getApiBase()}/bridge/requests/${reqId}/execute?user_id=${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to execute');
  return res.json();
}
