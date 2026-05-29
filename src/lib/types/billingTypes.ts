// Billing, plan, usage, and entitlement types.
// Extracted from src/App.tsx as part of Phase 1 of the file split refactor.
// Definitions are byte-for-byte the originals so behavior stays identical.

export type PlanTier = 'free' | 'basic' | 'pro' | 'max';

export type BillingInterval = 'monthly' | 'yearly';

export type UpgradeReason =
  | 'run-limit'
  | 'credits'
  | 'pro-feature'
  | 'team-feature'
  | 'connector'
  | 'cost-warning'
  | 'project-limit';

export type UpgradeModalState = {
  toPlan: PlanTier;
  reason: UpgradeReason;
  featureName?: string;
  requiredCredits?: number;
  estimatedCredits?: number;
};

export type CostEstimate = {
  credits: number;
  tokens: number;
  estimatedCostUSD: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
  breakdown: Array<{ label: string; credits: number }>;
  exceedsPlan: boolean;
  nearLimit: boolean;
};

export type Invoice = {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
};

export type PlanDef = {
  id: PlanTier;
  name: string;
  price: string;
  priceYearly: string;
  priceDesc: string;
  workflowRunsLimit: number;
  creditsLimit: number;
  projectLimit: number;
  activeWorkflowLimit: number;
  seats: number;
  features: string[];
  cta: string;
  recommended?: boolean;
  accentColor?: string;
};

export type UsageEvent = {
  id: string;
  timestamp: string;
  workflowName: string;
  actionType: string;
  agentsUsed: number;
  creditsUsed: number;
  tokensUsed: number;
  status: 'Completed' | 'Failed' | 'Cancelled';
};

export type UsageState = {
  currentPlan: PlanTier;
  workflowRunsUsed: number;
  agentCreditsUsed: number;
  tokenUsageThisMonth: number;
  estimatedCost: number;
  resetDate: string;
  usageEvents: UsageEvent[];
};

export interface ColonyBillingState {
  plan: PlanTier;
  interval: BillingInterval;
  addonCrewPacks: number;
  addonCreditPacks: number;
  addonStoragePacks: number;
  addonSeatPacks: number;
  cardLast4: string | null;
  nextRenewal: string | null;
}

export interface FeatureRow {
  group: string;
  label: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
  max: string | boolean;
  highlight?: boolean;
}

export interface AddonItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  emoji: string;
  requiredPlan: PlanTier[];
}
