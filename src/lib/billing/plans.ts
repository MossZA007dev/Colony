import type { BillingCycle, PlanEntitlements, PlanId } from './types';

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyPriceUsd: number;
  yearlyDiscountPercent: number;
  description: string;
  recommended?: boolean;
  features: string[];
};

export const PLAN_ORDER: PlanId[] = ['free', 'basic', 'pro', 'max'];

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPriceUsd: 0,
    yearlyDiscountPercent: 20,
    description: 'Start with AI Ant and small projects.',
    features: ['200 AI Ant messages', '2 projects', '5 crew runs', '100 MB storage'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    monthlyPriceUsd: 12,
    yearlyDiscountPercent: 20,
    description: 'More room for solo workflows and early automation.',
    features: ['2,000 AI Ant messages', '10 projects', '50 crew runs', '1 GB storage'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceUsd: 29,
    yearlyDiscountPercent: 20,
    description: 'Advanced AI routing and larger operating capacity.',
    recommended: true,
    features: ['Unlimited AI Ant messages', 'Unlimited projects', '500 crew runs', 'Priority execution'],
  },
  max: {
    id: 'max',
    name: 'Max',
    monthlyPriceUsd: 79,
    yearlyDiscountPercent: 20,
    description: 'Highest limits, collaboration, custom models, and internal-grade controls.',
    features: ['Unlimited runs', 'Custom models', 'Team collaboration', 'Admin dashboard entitlement'],
  },
};

export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  free: {
    aiAntMessages: 200,
    projects: 2,
    crewRuns: 5,
    workflowRuns: 3,
    enterpriseWorkspaces: 1,
    storageMb: 100,
    imageGenerations: 5,
    videoGenerations: 0,
    ttsGenerations: 10,
    connectorActions: 20,
    modelRouting: 'basic',
    customModels: false,
    teamCollaboration: false,
    adminDashboard: false,
    priorityExecution: 'standard',
  },
  basic: {
    aiAntMessages: 2000,
    projects: 10,
    crewRuns: 50,
    workflowRuns: 50,
    enterpriseWorkspaces: 3,
    storageMb: 1000,
    imageGenerations: 50,
    videoGenerations: 5,
    ttsGenerations: 100,
    connectorActions: 250,
    modelRouting: 'standard',
    customModels: false,
    teamCollaboration: false,
    adminDashboard: false,
    priorityExecution: 'standard',
  },
  pro: {
    aiAntMessages: 'unlimited',
    projects: 'unlimited',
    crewRuns: 500,
    workflowRuns: 500,
    enterpriseWorkspaces: 'unlimited',
    storageMb: 10000,
    imageGenerations: 500,
    videoGenerations: 50,
    ttsGenerations: 1000,
    connectorActions: 2500,
    modelRouting: 'advanced',
    customModels: false,
    teamCollaboration: false,
    adminDashboard: false,
    priorityExecution: 'priority',
  },
  max: {
    aiAntMessages: 'unlimited',
    projects: 'unlimited',
    crewRuns: 'unlimited',
    workflowRuns: 'unlimited',
    enterpriseWorkspaces: 'unlimited',
    storageMb: 100000,
    imageGenerations: 'unlimited',
    videoGenerations: 'unlimited',
    ttsGenerations: 'unlimited',
    connectorActions: 'unlimited',
    modelRouting: 'advanced',
    customModels: true,
    teamCollaboration: true,
    adminDashboard: true,
    priorityExecution: 'highest',
  },
};

export function getPlanPrice(planId: PlanId, cycle: BillingCycle) {
  const monthly = PLANS[planId].monthlyPriceUsd;
  if (cycle === 'monthly') return monthly;
  return Math.round(monthly * (1 - PLANS[planId].yearlyDiscountPercent / 100) * 100) / 100;
}

export function getAnnualSavings(planId: PlanId) {
  const monthly = PLANS[planId].monthlyPriceUsd;
  return Math.round(monthly * 12 * (PLANS[planId].yearlyDiscountPercent / 100));
}
