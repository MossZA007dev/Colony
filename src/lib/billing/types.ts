export type PlanId = 'free' | 'basic' | 'pro' | 'max';
export type BillingCycle = 'monthly' | 'yearly';
export type UserRole = 'user' | 'admin' | 'developer';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
export type LimitValue = number | 'unlimited';

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  planId: PlanId;
  createdAt: string;
  lastLoginAt?: string;
  status: UserStatus;
};

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
};

export type WorkspaceMember = {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
};

export type Subscription = {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
};

export type FeatureKey =
  | 'ai_ant'
  | 'colony_crew'
  | 'one_man_enterprise'
  | 'automation'
  | 'workflow_builder'
  | 'connected_workspace'
  | 'image_generation'
  | 'video_generation'
  | 'tts_generation'
  | 'custom_models'
  | 'admin_dashboard';

export type UsageFeature =
  | 'ai_ant'
  | 'colony_crew'
  | 'one_man_enterprise'
  | 'automation'
  | 'workflow'
  | 'image'
  | 'video'
  | 'tts'
  | 'connector';

export type UsageMetric =
  | 'aiAntMessages'
  | 'projects'
  | 'crewRuns'
  | 'workflowRuns'
  | 'enterpriseWorkspaces'
  | 'storageMb'
  | 'imageGenerations'
  | 'videoGenerations'
  | 'ttsGenerations'
  | 'connectorActions';

export type PlanEntitlements = {
  aiAntMessages: LimitValue;
  projects: LimitValue;
  crewRuns: LimitValue;
  workflowRuns: LimitValue;
  enterpriseWorkspaces: LimitValue;
  storageMb: LimitValue;
  imageGenerations: LimitValue;
  videoGenerations: LimitValue;
  ttsGenerations: LimitValue;
  connectorActions: LimitValue;
  modelRouting: 'basic' | 'standard' | 'advanced';
  customModels: boolean;
  teamCollaboration: boolean;
  adminDashboard: boolean;
  priorityExecution: 'standard' | 'priority' | 'highest';
};

export type MonthlyUsage = {
  userId: string;
  period: string;
  aiAntMessages: number;
  crewRuns: number;
  workflowRuns: number;
  enterpriseRuns: number;
  imageGenerations: number;
  videoGenerations: number;
  ttsGenerations: number;
  connectorActions: number;
  storageMb: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

export type UsageEvent = {
  id: string;
  userId: string;
  feature: UsageFeature;
  modelUsed?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
};

export type AdminAuditLog = {
  id: string;
  adminUserId: string;
  action: string;
  targetId?: string;
  createdAt: string;
};

export type RateLimitRule = {
  feature: UsageFeature;
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
};
