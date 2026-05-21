import type { AIRequestLog, FeatureEvent, FeatureName, SystemError } from './adminTypes';
import { ADMIN_AI_REQUESTS_KEY, ADMIN_ERRORS_KEY, ADMIN_FEATURE_EVENTS_KEY, loadAdminStore, saveAdminStore } from './adminMockData';
import { estimateAIRequestCost } from './adminMetrics';
import { logUsageEvent } from '../billing/usage';
import type { UsageFeature } from '../billing/types';

type TrackFeatureEventInput = {
  userId: string;
  feature: FeatureName;
  eventName: string;
  metadata?: Record<string, unknown>;
};

type TrackAIRequestInput = {
  userId: string;
  feature: FeatureName;
  model: string;
  promptTokens: number;
  completionTokens: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  latencyMs: number;
};

type TrackSystemErrorInput = {
  level: 'warning' | 'error' | 'critical';
  source: SystemError['source'];
  message: string;
  userId?: string;
};

// TODO: Send admin analytics to a backend database. Frontend localStorage is
// only for MVP demos and is not a secure analytics source.
export function trackFeatureEvent(event: TrackFeatureEventInput) {
  const store = loadAdminStore();
  const next: FeatureEvent = {
    id: `evt_${Date.now().toString(36)}`,
    ...event,
    createdAt: new Date().toISOString(),
  };
  writeList(ADMIN_FEATURE_EVENTS_KEY, [next, ...store.featureEvents]);
}

export function trackAIRequest(request: TrackAIRequestInput) {
  const store = loadAdminStore();
  const user = store.users.find((item) => item.id === request.userId);
  const estimatedCost = estimateAIRequestCost(request.model, request.promptTokens, request.completionTokens);
  const next: AIRequestLog = {
    id: `req_${Date.now().toString(36)}`,
    userId: request.userId,
    userEmail: user?.email ?? 'unknown@colony.local',
    feature: request.feature,
    model: request.model,
    promptTokens: request.promptTokens,
    completionTokens: request.completionTokens,
    totalTokens: request.promptTokens + request.completionTokens,
    estimatedCost,
    status: request.status,
    errorMessage: request.errorMessage,
    latencyMs: request.latencyMs,
    createdAt: new Date().toISOString(),
  };
  writeList(ADMIN_AI_REQUESTS_KEY, [next, ...store.aiRequests]);
  logUsageEvent({
    userId: request.userId,
    feature: adminFeatureToUsageFeature(request.feature),
    modelUsed: request.model,
    inputTokens: request.promptTokens,
    outputTokens: request.completionTokens,
    estimatedCostUsd: estimatedCost,
    status: request.status,
    errorMessage: request.errorMessage,
  });
}

export function trackSystemError(error: TrackSystemErrorInput) {
  const store = loadAdminStore();
  const user = error.userId ? store.users.find((item) => item.id === error.userId) : undefined;
  const next: SystemError = {
    id: `err_${Date.now().toString(36)}`,
    level: error.level,
    source: error.source,
    message: error.message,
    userId: error.userId,
    userEmail: user?.email,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  writeList(ADMIN_ERRORS_KEY, [next, ...store.systemErrors]);
}

export function replaceAdminStore(mutator: Parameters<typeof mutateAdminStore>[0]) {
  mutateAdminStore(mutator);
}

function mutateAdminStore(mutator: (store: ReturnType<typeof loadAdminStore>) => ReturnType<typeof loadAdminStore>) {
  const current = loadAdminStore();
  saveAdminStore(mutator(current));
}

function writeList<T>(key: string, value: T[]) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function adminFeatureToUsageFeature(feature: FeatureName): UsageFeature {
  if (feature === 'connected_workspace') return 'connector';
  if (feature === 'image_generation') return 'image';
  if (feature === 'video_generation') return 'video';
  if (feature === 'tts_generation') return 'tts';
  if (feature === 'custom_models') return 'ai_ant';
  if (feature === 'approval') return 'connector';
  if (feature === 'workflow') return 'workflow';
  return feature;
}
