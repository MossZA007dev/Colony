import { canUseFeature, checkUsageLimit } from '../billing/entitlements';
import { getSubscription } from '../billing/subscriptions';
import type { FeatureKey, RateLimitRule, UsageFeature } from '../billing/types';
import { getMonthlyUsage, loadUsageEvents, logUsageEvent, usageMetricForFeature } from '../billing/usage';
import { MOCK_USERS } from '../mock/mockUsers';

export class AIRequestGuardError extends Error {
  code: 'auth_required' | 'user_not_found' | 'subscription_inactive' | 'feature_locked' | 'usage_limit' | 'rate_limit';
  upgradeRequired: boolean;

  constructor(code: AIRequestGuardError['code'], message: string, upgradeRequired = false) {
    super(message);
    this.name = 'AIRequestGuardError';
    this.code = code;
    this.upgradeRequired = upgradeRequired;
  }
}

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  { feature: 'ai_ant', maxRequestsPerMinute: 20, maxRequestsPerDay: 500 },
  { feature: 'colony_crew', maxRequestsPerMinute: 5, maxRequestsPerDay: 80 },
  { feature: 'workflow', maxRequestsPerMinute: 10, maxRequestsPerDay: 150 },
  { feature: 'automation', maxRequestsPerMinute: 10, maxRequestsPerDay: 150 },
  { feature: 'image', maxRequestsPerMinute: 8, maxRequestsPerDay: 100 },
  { feature: 'video', maxRequestsPerMinute: 3, maxRequestsPerDay: 40 },
  { feature: 'tts', maxRequestsPerMinute: 12, maxRequestsPerDay: 200 },
  { feature: 'connector', maxRequestsPerMinute: 20, maxRequestsPerDay: 400 },
  { feature: 'one_man_enterprise', maxRequestsPerMinute: 3, maxRequestsPerDay: 20 },
];

const FEATURE_MAP: Record<UsageFeature, FeatureKey> = {
  ai_ant: 'ai_ant',
  colony_crew: 'colony_crew',
  one_man_enterprise: 'one_man_enterprise',
  automation: 'automation',
  workflow: 'workflow_builder',
  image: 'image_generation',
  video: 'video_generation',
  tts: 'tts_generation',
  connector: 'connected_workspace',
};

export async function guardAIRequest({
  userId,
  feature,
  estimatedTokens = 0,
  estimatedCostUsd = 0,
}: {
  userId?: string | null;
  feature: UsageFeature;
  estimatedTokens?: number;
  estimatedCostUsd?: number;
}) {
  if (!userId) throw new AIRequestGuardError('auth_required', 'Sign in is required before running AI features.');
  const user = MOCK_USERS.find((item) => item.id === userId);
  if (!user) throw new AIRequestGuardError('user_not_found', 'User was not found.');

  const subscription = getSubscription(userId);
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    throw new AIRequestGuardError('subscription_inactive', 'Your subscription is not active. Update billing to continue.', true);
  }

  const featureKey = FEATURE_MAP[feature];
  if (!canUseFeature(user, featureKey)) {
    throw new AIRequestGuardError('feature_locked', 'This feature is not included in the current plan.', true);
  }

  const monthlyUsage = getMonthlyUsage(userId);
  const metric = usageMetricForFeature(feature);
  const used = monthlyUsageValue(monthlyUsage, metric);
  const limitCheck = checkUsageLimit(user, metric, used);
  if (!limitCheck.allowed) {
    throw new AIRequestGuardError('usage_limit', 'Monthly usage limit reached. Upgrade to continue.', true);
  }

  const rateLimit = checkRateLimit(userId, feature);
  if (!rateLimit.allowed) {
    throw new AIRequestGuardError('rate_limit', 'Rate limit reached. Please wait before running this again.');
  }

  return { allowed: true as const, user, subscription, monthlyUsage, estimatedTokens, estimatedCostUsd };
}

function monthlyUsageValue(monthlyUsage: ReturnType<typeof getMonthlyUsage>, metric: ReturnType<typeof usageMetricForFeature>) {
  if (metric === 'projects') return 0;
  if (metric === 'enterpriseWorkspaces') return monthlyUsage.enterpriseRuns;
  return monthlyUsage[metric];
}

export function completeAIRequest(input: {
  userId: string;
  feature: UsageFeature;
  provider?: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}) {
  return logUsageEvent(input);
}

function checkRateLimit(userId: string, feature: UsageFeature) {
  const rule = RATE_LIMIT_RULES.find((item) => item.feature === feature);
  if (!rule) return { allowed: true };
  const now = Date.now();
  const events = loadUsageEvents().filter((event) => event.userId === userId && event.feature === feature);
  const perMinute = events.filter((event) => now - new Date(event.createdAt).getTime() < 60_000).length;
  const perDay = events.filter((event) => now - new Date(event.createdAt).getTime() < 864e5).length;
  return { allowed: perMinute < rule.maxRequestsPerMinute && perDay < rule.maxRequestsPerDay, perMinute, perDay, rule };
}
