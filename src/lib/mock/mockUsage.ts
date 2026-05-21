import { estimateAIRequestCost } from '../admin/adminMetrics';
import { MOCK_USERS } from './mockUsers';
import type { UsageEvent, UsageFeature } from '../billing/types';

const now = Date.now();
const isoDaysAgo = (days: number, hours = 0) => new Date(now - days * 864e5 - hours * 36e5).toISOString();
const features: UsageFeature[] = ['ai_ant', 'colony_crew', 'one_man_enterprise', 'automation', 'workflow', 'image', 'video', 'tts', 'connector'];
const models = ['gpt-4.1-mini', 'gpt-4.1', 'mock-model', 'gemini-2.5-flash'];

export const MOCK_USAGE_EVENTS: UsageEvent[] = Array.from({ length: 72 }, (_, index) => {
  const user = MOCK_USERS[index % (MOCK_USERS.length - 1)];
  const feature = features[index % features.length];
  const inputTokens = 500 + ((index * 379) % 16_000);
  const outputTokens = 280 + ((index * 251) % 9_000);
  const modelUsed = models[index % models.length];
  const failed = index % 13 === 0;
  return {
    id: `usage_seed_${String(index + 1).padStart(3, '0')}`,
    userId: user.id,
    feature,
    modelUsed,
    provider: modelUsed.startsWith('gemini') ? 'gemini' : modelUsed === 'mock-model' ? 'colony' : 'openai',
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateAIRequestCost(modelUsed, inputTokens, outputTokens),
    status: failed ? 'failed' : 'success',
    errorMessage: failed ? 'Model request timed out before completion.' : undefined,
    createdAt: isoDaysAgo(index % 28, index % 12),
  };
});
