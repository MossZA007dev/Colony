import { PLAN_ENTITLEMENTS, PLAN_ORDER } from './plans';
import type { FeatureKey, PlanId, UsageMetric, User } from './types';

const FEATURE_TO_ENTITLEMENT: Record<FeatureKey, keyof typeof PLAN_ENTITLEMENTS.free> = {
  ai_ant: 'aiAntMessages',
  colony_crew: 'crewRuns',
  one_man_enterprise: 'enterpriseWorkspaces',
  automation: 'workflowRuns',
  workflow_builder: 'workflowRuns',
  connected_workspace: 'connectorActions',
  image_generation: 'imageGenerations',
  video_generation: 'videoGenerations',
  tts_generation: 'ttsGenerations',
  custom_models: 'customModels',
  admin_dashboard: 'adminDashboard',
};

export function getPlanEntitlements(planId: PlanId) {
  return PLAN_ENTITLEMENTS[planId] ?? PLAN_ENTITLEMENTS.free;
}

export function canUseFeature(user: Pick<User, 'role' | 'planId' | 'status'>, feature: FeatureKey) {
  if (user.status !== 'active') return false;
  if (feature === 'admin_dashboard') return user.role === 'admin' || user.role === 'developer';
  const entitlements = getPlanEntitlements(user.planId);
  const key = FEATURE_TO_ENTITLEMENT[feature];
  const value = entitlements[key];
  if (typeof value === 'boolean') return value;
  if (value === 'unlimited') return true;
  return typeof value === 'number' ? value > 0 : Boolean(value);
}

export function getLimit(user: Pick<User, 'planId'>, metric: UsageMetric) {
  return getPlanEntitlements(user.planId)[metric];
}

export function checkUsageLimit(user: Pick<User, 'planId'>, metric: UsageMetric, used: number, increment = 1) {
  const limit = getLimit(user, metric);
  if (limit === 'unlimited') return { allowed: true, limit, used, remaining: 'unlimited' as const, percentUsed: 0 };
  const nextUsed = used + increment;
  return {
    allowed: nextUsed <= limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    percentUsed: limit > 0 ? Math.round((used / limit) * 100) : 100,
  };
}

export function isUpgradeRequired(user: Pick<User, 'role' | 'planId' | 'status'>, feature: FeatureKey) {
  return !canUseFeature(user, feature);
}

export function requirePlan(user: Pick<User, 'planId'>, requiredPlan: PlanId) {
  return PLAN_ORDER.indexOf(user.planId) >= PLAN_ORDER.indexOf(requiredPlan);
}

export function metricForFeature(feature: FeatureKey): UsageMetric {
  const key = FEATURE_TO_ENTITLEMENT[feature];
  if (key === 'customModels' || key === 'adminDashboard' || key === 'modelRouting' || key === 'teamCollaboration' || key === 'priorityExecution') {
    return 'aiAntMessages';
  }
  return key as UsageMetric;
}
