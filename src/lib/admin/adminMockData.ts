import type { AdminSettings, AdminStore, AdminUser, AIRequestLog, ApprovalEvent, FeatureEvent, FeatureName, SystemError } from './adminTypes';
import { estimateAIRequestCost } from './adminMetrics';
import { MOCK_USERS } from '../mock/mockUsers';
import { MOCK_USAGE_EVENTS } from '../mock/mockUsage';
import { currentUsagePeriod, emptyMonthlyUsage, loadMonthlyUsage, saveMonthlyUsage, USAGE_EVENTS_KEY } from '../billing/usage';
import type { MonthlyUsage } from '../billing/types';

export const ADMIN_USERS_KEY = 'colony_admin_users';
export const ADMIN_AI_REQUESTS_KEY = 'colony_admin_ai_requests';
export const ADMIN_FEATURE_EVENTS_KEY = 'colony_admin_feature_events';
export const ADMIN_ERRORS_KEY = 'colony_admin_system_errors';
export const ADMIN_APPROVALS_KEY = 'colony_admin_approvals';
export const ADMIN_SETTINGS_KEY = 'colony_admin_settings';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  safetyModeDefault: true,
  defaultUserPlan: 'free',
  freeUserTokenLimit: 200_000,
  proUserTokenLimit: 2_000_000,
  colonyCrewEnabled: true,
  deviceActionsEnabled: true,
  requireApprovalForHighRisk: true,
  maintenanceMode: false,
};

const now = Date.now();
const isoDaysAgo = (days: number, hours = 0) => new Date(now - days * 864e5 - hours * 36e5).toISOString();

export const MOCK_ADMIN_USERS: AdminUser[] = MOCK_USERS.map((user, index) => {
  const userEvents = MOCK_USAGE_EVENTS.filter((event) => event.userId === user.id);
  const totalTokens = userEvents.reduce((total, event) => total + (event.inputTokens ?? 0) + (event.outputTokens ?? 0), 0);
  const estimatedCost = userEvents.reduce((total, event) => total + (event.estimatedCostUsd ?? 0), 0);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.planId,
    subscriptionStatus: user.status === 'suspended' ? 'paused' : 'active',
    usagePercent: index % 5 === 0 ? 86 : index % 7 === 0 ? 104 : 28 + (index * 9) % 55,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? user.createdAt,
    totalChats: 8 + ((index * 7) % 82),
    totalProjects: Math.max(0, (index * 3) % 15),
    totalTokens,
    estimatedCost,
  };
});

const features: FeatureName[] = ['ai_ant', 'colony_crew', 'one_man_enterprise', 'connected_workspace', 'workflow', 'image_generation', 'video_generation', 'tts_generation', 'custom_models', 'approval'];
const models = ['gpt-4.1-mini', 'gpt-4.1', 'mock-model'];

export const MOCK_AI_REQUESTS: AIRequestLog[] = MOCK_USAGE_EVENTS.map((event, index) => {
  const user = MOCK_ADMIN_USERS.find((item) => item.id === event.userId) ?? MOCK_ADMIN_USERS[0];
  const feature = usageToAdminFeature(event.feature);
  const model = event.modelUsed ?? models[index % models.length];
  const promptTokens = event.inputTokens ?? 0;
  const completionTokens = event.outputTokens ?? 0;
  const estimatedCost = event.estimatedCostUsd ?? estimateAIRequestCost(model, promptTokens, completionTokens);
  return {
    id: `req_${String(index + 1).padStart(3, '0')}`,
    userId: user.id,
    userEmail: user.email,
    feature,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCost,
    status: event.status,
    errorMessage: event.errorMessage,
    latencyMs: 620 + ((index * 97) % 7_500),
    createdAt: event.createdAt,
  };
});

const eventNames: Record<FeatureName, string[]> = {
  ai_ant: ['message_sent', 'chat_created', 'file_analyzed'],
  colony_crew: ['run_started', 'run_completed', 'agent_assigned'],
  one_man_enterprise: ['workspace_created', 'project_generated', 'org_chart_created'],
  connected_workspace: ['action_requested', 'action_approved', 'screen_read'],
  workflow: ['workflow_created', 'workflow_run', 'workflow_exported'],
  image_generation: ['image_generated', 'image_edited', 'image_exported'],
  video_generation: ['video_generated', 'clip_rendered', 'video_exported'],
  tts_generation: ['voice_generated', 'audio_exported', 'voice_selected'],
  custom_models: ['model_added', 'model_routed', 'model_tested'],
  approval: ['approval_requested', 'approval_completed', 'approval_rejected'],
};

export const MOCK_FEATURE_EVENTS: FeatureEvent[] = Array.from({ length: 44 }, (_, index) => {
  const feature = features[index % features.length];
  const user = MOCK_ADMIN_USERS[(index + 1) % (MOCK_ADMIN_USERS.length - 1)];
  return {
    id: `evt_${String(index + 1).padStart(3, '0')}`,
    userId: user.id,
    feature,
    eventName: eventNames[feature][index % eventNames[feature].length],
    metadata: feature === 'colony_crew' ? { agents: 3 + (index % 4), completed: index % 5 !== 0 } : { source: 'mock' },
    createdAt: isoDaysAgo(index % 21, index % 10),
  };
});

export const MOCK_SYSTEM_ERRORS: SystemError[] = [
  { id: 'err_001', level: 'critical', source: 'ai_request', message: 'AI request queue exceeded timeout threshold.', userId: 'usr_001', userEmail: 'maya@example.com', createdAt: isoDaysAgo(0, 1), resolved: false },
  { id: 'err_002', level: 'error', source: 'device', message: 'Device action failed after approval because target app changed state.', userId: 'usr_006', userEmail: 'kenji@example.com', createdAt: isoDaysAgo(0, 4), resolved: false },
  { id: 'err_003', level: 'warning', source: 'auth', message: 'Repeated failed sign-in attempts detected.', userId: 'usr_004', userEmail: 'leo@example.com', createdAt: isoDaysAgo(1), resolved: true },
  { id: 'err_004', level: 'error', source: 'colony_crew', message: 'Crew run stopped with unresolved writer agent state.', userId: 'usr_008', userEmail: 'omar@example.com', createdAt: isoDaysAgo(2), resolved: false },
  { id: 'err_005', level: 'info', source: 'frontend', message: 'Recovered from stale workspace cache.', userId: 'usr_003', userEmail: 'ava@example.com', createdAt: isoDaysAgo(3), resolved: true },
  { id: 'err_006', level: 'warning', source: 'workflow', message: 'Workflow generated with missing connector permission.', userId: 'usr_005', userEmail: 'sofia@example.com', createdAt: isoDaysAgo(4), resolved: false },
  { id: 'err_007', level: 'error', source: 'database', message: 'Mock persistence write failed in localStorage quota fallback.', createdAt: isoDaysAgo(5), resolved: true },
  { id: 'err_008', level: 'warning', source: 'device', message: 'High-risk action required manual approval.', userId: 'usr_009', userEmail: 'grace@example.com', createdAt: isoDaysAgo(6), resolved: true },
  { id: 'err_009', level: 'error', source: 'ai_request', message: 'Completion response failed validation schema.', userId: 'usr_002', userEmail: 'niran@example.com', createdAt: isoDaysAgo(7), resolved: false },
  { id: 'err_010', level: 'critical', source: 'frontend', message: 'Admin metrics render recovered after invalid mock record.', createdAt: isoDaysAgo(8), resolved: true },
];

export const MOCK_APPROVAL_EVENTS: ApprovalEvent[] = Array.from({ length: 16 }, (_, index) => {
  const user = MOCK_ADMIN_USERS[(index + 2) % (MOCK_ADMIN_USERS.length - 1)];
  const actionTypes: ApprovalEvent['actionType'][] = ['device_read', 'device_write', 'send_message', 'export_file', 'connect_account', 'publish_content'];
  const statuses: ApprovalEvent['status'][] = ['approved', 'approved', 'pending', 'rejected'];
  const riskLevels: ApprovalEvent['riskLevel'][] = ['low', 'medium', 'high'];
  return {
    id: `app_${String(index + 1).padStart(3, '0')}`,
    userId: user.id,
    userEmail: user.email,
    actionType: actionTypes[index % actionTypes.length],
    status: statuses[index % statuses.length],
    riskLevel: riskLevels[index % riskLevels.length],
    createdAt: isoDaysAgo(index % 13, index % 8),
  };
});

export function loadAdminStore(): AdminStore {
  ensureSharedUsageSeeds();
  return {
    users: loadList(ADMIN_USERS_KEY, MOCK_ADMIN_USERS),
    aiRequests: loadList(ADMIN_AI_REQUESTS_KEY, MOCK_AI_REQUESTS),
    featureEvents: loadList(ADMIN_FEATURE_EVENTS_KEY, MOCK_FEATURE_EVENTS),
    systemErrors: loadList(ADMIN_ERRORS_KEY, MOCK_SYSTEM_ERRORS),
    approvalEvents: loadList(ADMIN_APPROVALS_KEY, MOCK_APPROVAL_EVENTS),
    settings: loadValue(ADMIN_SETTINGS_KEY, DEFAULT_ADMIN_SETTINGS),
  };
}

export function saveAdminStore(store: AdminStore) {
  saveValue(ADMIN_USERS_KEY, store.users);
  saveValue(ADMIN_AI_REQUESTS_KEY, store.aiRequests);
  saveValue(ADMIN_FEATURE_EVENTS_KEY, store.featureEvents);
  saveValue(ADMIN_ERRORS_KEY, store.systemErrors);
  saveValue(ADMIN_APPROVALS_KEY, store.approvalEvents);
  saveValue(ADMIN_SETTINGS_KEY, store.settings);
}

function loadList<T>(key: string, fallback: T[]): T[] {
  return loadValue<T[]>(key, fallback);
}

function loadValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  saveValue(key, fallback);
  return fallback;
}

function saveValue<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function usageToAdminFeature(feature: (typeof MOCK_USAGE_EVENTS)[number]['feature']): FeatureName {
  if (feature === 'automation') return 'workflow';
  if (feature === 'image') return 'image_generation';
  if (feature === 'video') return 'video_generation';
  if (feature === 'tts') return 'tts_generation';
  if (feature === 'connector') return 'connected_workspace';
  return feature;
}

function ensureSharedUsageSeeds() {
  try {
    if (!localStorage.getItem(USAGE_EVENTS_KEY)) {
      localStorage.setItem(USAGE_EVENTS_KEY, JSON.stringify(MOCK_USAGE_EVENTS));
    }
  } catch { /* ignore */ }
  if (loadMonthlyUsage().length) return;
  const period = currentUsagePeriod();
  const usageByUser = new Map<string, MonthlyUsage>();
  MOCK_USAGE_EVENTS.filter((event) => event.status === 'success').forEach((event) => {
    const current = usageByUser.get(event.userId) ?? emptyMonthlyUsage(event.userId, period);
    current.inputTokens += event.inputTokens ?? 0;
    current.outputTokens += event.outputTokens ?? 0;
    current.estimatedCostUsd += event.estimatedCostUsd ?? 0;
    if (event.feature === 'ai_ant') current.aiAntMessages += 1;
    if (event.feature === 'colony_crew') current.crewRuns += 1;
    if (event.feature === 'one_man_enterprise') current.enterpriseRuns += 1;
    if (event.feature === 'automation' || event.feature === 'workflow') current.workflowRuns += 1;
    if (event.feature === 'image') current.imageGenerations += 1;
    if (event.feature === 'video') current.videoGenerations += 1;
    if (event.feature === 'tts') current.ttsGenerations += 1;
    if (event.feature === 'connector') current.connectorActions += 1;
    usageByUser.set(event.userId, current);
  });
  saveMonthlyUsage([...usageByUser.values()]);
}
