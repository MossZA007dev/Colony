export type UserRole = 'user' | 'admin' | 'developer';
import type { PlanId, SubscriptionStatus } from '../billing/types';

export type AdminPlan = PlanId;
export type AdminUserStatus = 'active' | 'suspended' | 'deleted';
export type FeatureName =
  | 'ai_ant'
  | 'colony_crew'
  | 'one_man_enterprise'
  | 'connected_workspace'
  | 'workflow'
  | 'image_generation'
  | 'video_generation'
  | 'tts_generation'
  | 'custom_models'
  | 'approval';

export type AdminTab = 'overview' | 'users' | 'usage' | 'features' | 'logs' | 'settings';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: AdminPlan;
  subscriptionStatus: SubscriptionStatus;
  usagePercent: number;
  status: AdminUserStatus;
  createdAt: string;
  lastLoginAt: string;
  totalChats: number;
  totalProjects: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIRequestLog {
  id: string;
  userId: string;
  userEmail: string;
  feature: FeatureName;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  latencyMs: number;
  createdAt: string;
}

export interface FeatureEvent {
  id: string;
  userId: string;
  feature: FeatureName;
  eventName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SystemError {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: 'auth' | 'ai_request' | 'colony_crew' | 'device' | 'workflow' | 'database' | 'frontend';
  message: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  resolved: boolean;
}

export interface ApprovalEvent {
  id: string;
  userId: string;
  userEmail: string;
  actionType: 'device_read' | 'device_write' | 'send_message' | 'export_file' | 'connect_account' | 'publish_content';
  status: 'pending' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface AdminSettings {
  safetyModeDefault: boolean;
  defaultUserPlan: 'free' | 'pro';
  freeUserTokenLimit: number;
  proUserTokenLimit: number;
  colonyCrewEnabled: boolean;
  deviceActionsEnabled: boolean;
  requireApprovalForHighRisk: boolean;
  maintenanceMode: boolean;
}

export interface AdminStore {
  users: AdminUser[];
  aiRequests: AIRequestLog[];
  featureEvents: FeatureEvent[];
  systemErrors: SystemError[];
  approvalEvents: ApprovalEvent[];
  settings: AdminSettings;
}

export const FEATURE_LABELS: Record<FeatureName, string> = {
  ai_ant: 'AI Ant',
  colony_crew: 'Colony Crew',
  one_man_enterprise: 'One-Man Enterprise',
  connected_workspace: 'Colony Bridge',
  workflow: 'Workflow',
  image_generation: 'Image Generation',
  video_generation: 'Video Generation',
  tts_generation: 'TTS Generation',
  custom_models: 'Custom Models',
  approval: 'Approval',
};
