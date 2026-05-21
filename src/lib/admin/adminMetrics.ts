import type { AdminPlan, AdminSettings, AdminStore, AIRequestLog, FeatureName } from './adminTypes';
import { getPlanEntitlements } from '../billing/entitlements';

export const MODEL_COSTS: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'gpt-4.1': { inputPer1M: 2, outputPer1M: 8 },
  'gpt-4.1-mini': { inputPer1M: 0.4, outputPer1M: 1.6 },
  'mock-model': { inputPer1M: 0.25, outputPer1M: 1 },
};

export function estimateAIRequestCost(model: string, promptTokens: number, completionTokens: number) {
  const pricing = MODEL_COSTS[model] ?? MODEL_COSTS['mock-model'];
  return (promptTokens / 1_000_000) * pricing.inputPer1M + (completionTokens / 1_000_000) * pricing.outputPer1M;
}

export function formatCompactNumber(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number) {
  return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isThisMonth(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function calculateAdminMetrics(store: AdminStore) {
  const totalUsers = store.users.filter((user) => user.status !== 'deleted').length;
  const activeUsersToday = store.users.filter((user) => user.status === 'active' && isToday(user.lastLoginAt)).length;
  const monthlyActiveUsers = store.users.filter((user) => user.status === 'active' && isThisMonth(user.lastLoginAt)).length;
  const totalAIRequests = store.aiRequests.length;
  const failedRequests = store.aiRequests.filter((request) => request.status === 'failed').length;
  const successfulRequests = totalAIRequests - failedRequests;
  const totalPromptTokens = sum(store.aiRequests, (request) => request.promptTokens);
  const totalCompletionTokens = sum(store.aiRequests, (request) => request.completionTokens);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const estimatedCost = sum(store.aiRequests, (request) => request.estimatedCost);
  const activeProjects = sum(store.users.filter((user) => user.status === 'active'), (user) => user.totalProjects);
  const errorRate = totalAIRequests ? (failedRequests / totalAIRequests) * 100 : 0;
  const planDistribution = ['free', 'basic', 'pro', 'max'].map((plan) => ({
    key: plan,
    label: plan,
    count: store.users.filter((user) => user.status !== 'deleted' && user.plan === plan).length,
  }));
  const subscriptionStatusDistribution = ['active', 'trialing', 'past_due', 'canceled', 'paused'].map((status) => ({
    key: status,
    label: status,
    count: store.users.filter((user) => user.subscriptionStatus === status).length,
  }));

  return {
    totalUsers,
    activeUsersToday,
    monthlyActiveUsers,
    totalAIRequests,
    successfulRequests,
    failedRequests,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    estimatedCost,
    activeProjects,
    errorRate,
    avgTokensPerRequest: totalAIRequests ? Math.round(totalTokens / totalAIRequests) : 0,
    avgCostPerUser: totalUsers ? estimatedCost / totalUsers : 0,
    planDistribution,
    subscriptionStatusDistribution,
  };
}

export function usageByFeature(requests: AIRequestLog[]) {
  return groupUsage(requests, (request) => request.feature);
}

export function usageByModel(requests: AIRequestLog[]) {
  return groupUsage(requests, (request) => request.model);
}

export function usageByUser(requests: AIRequestLog[]) {
  const map = new Map<string, { label: string; requests: number; tokens: number; cost: number }>();
  requests.forEach((request) => {
    const key = request.userId;
    const current = map.get(key) ?? { label: request.userEmail, requests: 0, tokens: 0, cost: 0 };
    current.requests += 1;
    current.tokens += request.totalTokens;
    current.cost += request.estimatedCost;
    map.set(key, current);
  });
  return [...map.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.tokens - a.tokens);
}

export function featureEventSummary(store: AdminStore) {
  const eventsByFeature = new Map<FeatureName, { events: number; users: Set<string> }>();
  store.featureEvents.forEach((event) => {
    const current = eventsByFeature.get(event.feature) ?? { events: 0, users: new Set<string>() };
    current.events += 1;
    current.users.add(event.userId);
    eventsByFeature.set(event.feature, current);
  });

  const approvalRequested = store.approvalEvents.length;
  const approvalApproved = store.approvalEvents.filter((event) => event.status === 'approved').length;
  const approvalRejected = store.approvalEvents.filter((event) => event.status === 'rejected').length;

  return {
    cards: [...eventsByFeature.entries()].map(([feature, value]) => ({
      feature,
      eventCount: value.events,
      activeUsers: value.users.size,
    })),
    colonyCrewRuns: store.featureEvents.filter((event) => event.feature === 'colony_crew' && event.eventName.includes('run')).length,
    oneManEnterpriseWorkspaces: store.featureEvents.filter((event) => event.feature === 'one_man_enterprise').length,
    deviceActionsRequested: store.approvalEvents.filter((event) => event.actionType.startsWith('device')).length,
    deviceActionsApproved: store.approvalEvents.filter((event) => event.actionType.startsWith('device') && event.status === 'approved').length,
    deviceActionsRejected: store.approvalEvents.filter((event) => event.actionType.startsWith('device') && event.status === 'rejected').length,
    approvalRate: approvalRequested ? (approvalApproved / approvalRequested) * 100 : 0,
    rejectionRate: approvalRequested ? (approvalRejected / approvalRequested) * 100 : 0,
  };
}

export function calculateAdminWarnings(store: AdminStore) {
  const metrics = calculateAdminMetrics(store);
  const settings = store.settings;
  const nearLimitUsers = store.users.filter((user) => {
    const limit = tokenLimitForPlan(user.plan, settings);
    return limit > 0 && user.usagePercent >= 80;
  });
  const overLimitUsers = store.users.filter((user) => user.usagePercent >= 100);
  const costByFeature = usageByFeature(store.aiRequests);
  const topCostFeature = costByFeature[0];
  const failedLastDay = store.aiRequests.filter((request) => request.status === 'failed' && Date.now() - new Date(request.createdAt).getTime() < 864e5).length;
  const connectorPermissionFailures = store.systemErrors.filter((error) => /connector|permission/i.test(error.message) && !error.resolved).length;
  const failedPayments = store.users.filter((user) => user.subscriptionStatus === 'past_due').length;
  const highCostUsers = usageByUser(store.aiRequests).filter((row) => row.cost >= 10).length;

  return [
    nearLimitUsers.length ? `${nearLimitUsers.length} users used more than 80% of a monthly plan limit.` : '',
    overLimitUsers.length ? `${overLimitUsers.length} users are above 100% of a monthly plan limit.` : '',
    topCostFeature && metrics.estimatedCost > 0 ? `${topCostFeature.label} accounts for ${Math.round((topCostFeature.cost / metrics.estimatedCost) * 100)}% of estimated AI cost.` : '',
    highCostUsers ? `${highCostUsers} users are above the high-cost review threshold this month.` : '',
    failedPayments ? `${failedPayments} subscriptions are past due. Review billing recovery.` : '',
    failedLastDay >= 3 ? `${failedLastDay} failed AI requests in the last 24h.` : '',
    connectorPermissionFailures ? `${connectorPermissionFailures} connector permission failures need review.` : '',
    metrics.errorRate >= 5 ? `Error rate is ${metrics.errorRate.toFixed(1)}%. Review logs.` : '',
  ].filter(Boolean);
}

function groupUsage(requests: AIRequestLog[], getKey: (request: AIRequestLog) => string) {
  const map = new Map<string, { label: string; requests: number; promptTokens: number; completionTokens: number; tokens: number; cost: number }>();
  requests.forEach((request) => {
    const key = getKey(request);
    const current = map.get(key) ?? { label: key, requests: 0, promptTokens: 0, completionTokens: 0, tokens: 0, cost: 0 };
    current.requests += 1;
    current.promptTokens += request.promptTokens;
    current.completionTokens += request.completionTokens;
    current.tokens += request.totalTokens;
    current.cost += request.estimatedCost;
    map.set(key, current);
  });
  return [...map.entries()].map(([key, value]) => ({ key, ...value })).sort((a, b) => b.tokens - a.tokens);
}

function tokenLimitForPlan(plan: AdminPlan, settings: AdminSettings) {
  const messages = getPlanEntitlements(plan).aiAntMessages;
  if (typeof messages === 'number') return messages;
  if (plan === 'free') return settings.freeUserTokenLimit;
  if (plan === 'pro') return settings.proUserTokenLimit;
  if (plan === 'basic') return settings.proUserTokenLimit / 2;
  return 0;
}

function sum<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}
