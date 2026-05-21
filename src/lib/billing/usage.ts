import { estimateAIRequestCost } from '../admin/adminMetrics';
import type { MonthlyUsage, UsageEvent, UsageFeature, UsageMetric } from './types';

export const USAGE_EVENTS_KEY = 'colony_usage_events_v1';
export const MONTHLY_USAGE_KEY = 'colony_monthly_usage_v1';

export function currentUsagePeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function emptyMonthlyUsage(userId: string, period = currentUsagePeriod()): MonthlyUsage {
  return {
    userId,
    period,
    aiAntMessages: 0,
    crewRuns: 0,
    workflowRuns: 0,
    enterpriseRuns: 0,
    imageGenerations: 0,
    videoGenerations: 0,
    ttsGenerations: 0,
    connectorActions: 0,
    storageMb: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };
}

export function loadUsageEvents(): UsageEvent[] {
  try {
    const raw = localStorage.getItem(USAGE_EVENTS_KEY);
    if (raw) return JSON.parse(raw) as UsageEvent[];
  } catch { /* ignore */ }
  return [];
}

export function saveUsageEvents(events: UsageEvent[]) {
  try { localStorage.setItem(USAGE_EVENTS_KEY, JSON.stringify(events)); } catch { /* ignore */ }
}

export function loadMonthlyUsage(): MonthlyUsage[] {
  try {
    const raw = localStorage.getItem(MONTHLY_USAGE_KEY);
    if (raw) return JSON.parse(raw) as MonthlyUsage[];
  } catch { /* ignore */ }
  return [];
}

export function saveMonthlyUsage(usage: MonthlyUsage[]) {
  try { localStorage.setItem(MONTHLY_USAGE_KEY, JSON.stringify(usage)); } catch { /* ignore */ }
}

export function getMonthlyUsage(userId: string, period = currentUsagePeriod()) {
  return loadMonthlyUsage().find((usage) => usage.userId === userId && usage.period === period) ?? emptyMonthlyUsage(userId, period);
}

export function usageMetricForFeature(feature: UsageFeature): UsageMetric {
  switch (feature) {
    case 'ai_ant': return 'aiAntMessages';
    case 'colony_crew': return 'crewRuns';
    case 'one_man_enterprise': return 'enterpriseWorkspaces';
    case 'automation':
    case 'workflow': return 'workflowRuns';
    case 'image': return 'imageGenerations';
    case 'video': return 'videoGenerations';
    case 'tts': return 'ttsGenerations';
    case 'connector': return 'connectorActions';
    default: return 'aiAntMessages';
  }
}

export function usageFeatureToAdminFeature(feature: UsageFeature) {
  if (feature === 'automation') return 'workflow';
  if (feature === 'image' || feature === 'video' || feature === 'tts' || feature === 'connector') return 'workflow';
  return feature;
}

export function logUsageEvent(input: Omit<UsageEvent, 'id' | 'createdAt'> & { createdAt?: string }) {
  const next: UsageEvent = {
    id: `usage_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };
  saveUsageEvents([next, ...loadUsageEvents()]);
  if (next.status === 'success') incrementMonthlyUsage(next);
  return next;
}

export function logMockAIUsage(input: {
  userId: string;
  feature: UsageFeature;
  modelUsed?: string;
  provider?: string;
  inputTokens: number;
  outputTokens: number;
  status?: 'success' | 'failed';
  errorMessage?: string;
}) {
  const estimatedCostUsd = estimateAIRequestCost(input.modelUsed ?? 'mock-model', input.inputTokens, input.outputTokens);
  return logUsageEvent({ ...input, status: input.status ?? 'success', estimatedCostUsd });
}

function incrementMonthlyUsage(event: UsageEvent) {
  const period = currentUsagePeriod(new Date(event.createdAt));
  const all = loadMonthlyUsage();
  const current = all.find((usage) => usage.userId === event.userId && usage.period === period) ?? emptyMonthlyUsage(event.userId, period);
  const next: MonthlyUsage = {
    ...current,
    inputTokens: current.inputTokens + (event.inputTokens ?? 0),
    outputTokens: current.outputTokens + (event.outputTokens ?? 0),
    estimatedCostUsd: current.estimatedCostUsd + (event.estimatedCostUsd ?? 0),
  };
  switch (event.feature) {
    case 'ai_ant': next.aiAntMessages += 1; break;
    case 'colony_crew': next.crewRuns += 1; break;
    case 'one_man_enterprise': next.enterpriseRuns += 1; break;
    case 'automation':
    case 'workflow': next.workflowRuns += 1; break;
    case 'image': next.imageGenerations += 1; break;
    case 'video': next.videoGenerations += 1; break;
    case 'tts': next.ttsGenerations += 1; break;
    case 'connector': next.connectorActions += 1; break;
  }
  saveMonthlyUsage(all.some((usage) => usage.userId === next.userId && usage.period === next.period)
    ? all.map((usage) => usage.userId === next.userId && usage.period === next.period ? next : usage)
    : [next, ...all]);
}
