// Billing storage, plan limits, feature comparison, addon catalog.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.

import { getPlanEntitlements } from './plans';
import type { PlanId as BillingPlanId } from './types';
import type {
  AddonItem,
  ColonyBillingState,
  FeatureRow,
  PlanTier,
} from '../types/billingTypes';

export const BILLING_LS_KEY = 'colony_billing_v1';

export const PLAN_LIMITS: Record<PlanTier, {
  antMessages: number;
  workflowRuns: number;
  crewRuns: number;
  agentCredits: number;
  projects: number;
  activeWorkflows: number;
  seats: number;
  storageGb: number;
  monthlyPrice: number;
  yearlyPrice: number;
}> = {
  free:  { antMessages: 20,  workflowRuns: 20,   crewRuns: 5,   agentCredits: 300,   projects: 3,  activeWorkflows: 3,  seats: 1, storageGb: 1,   monthlyPrice: 0,  yearlyPrice: 0  },
  basic: { antMessages: 200, workflowRuns: 100,  crewRuns: 50,  agentCredits: 2000,  projects: 10, activeWorkflows: 10, seats: 1, storageGb: 5,   monthlyPrice: 9,  yearlyPrice: 7  },
  pro:   { antMessages: -1,  workflowRuns: 500,  crewRuns: 500, agentCredits: 10000, projects: -1, activeWorkflows: 25, seats: 1, storageGb: 20,  monthlyPrice: 19, yearlyPrice: 15 },
  max:   { antMessages: -1,  workflowRuns: 2000, crewRuns: -1,  agentCredits: 50000, projects: -1, activeWorkflows: -1, seats: 5, storageGb: 100, monthlyPrice: 49, yearlyPrice: 39 },
};

export const FEATURE_TABLE: FeatureRow[] = [
  { group: 'AI Ant',               label: 'Messages / month',        free: '20',            basic: '200',       pro: 'Unlimited',  max: 'Unlimited', highlight: true },
  { group: 'AI Ant',               label: 'File uploads in chat',    free: false,           basic: true,        pro: true,         max: true },
  { group: 'AI Ant',               label: 'Long-form output',        free: false,           basic: true,        pro: true,         max: true },
  { group: 'Projects & Workflows', label: 'Projects',                free: '3',             basic: '10',        pro: 'Unlimited',  max: 'Unlimited', highlight: true },
  { group: 'Projects & Workflows', label: 'Active workflows',        free: '3',             basic: '10',        pro: '25',         max: 'Unlimited' },
  { group: 'Projects & Workflows', label: 'Workflow runs / month',   free: '20',            basic: '100',       pro: '500',        max: '2,000',     highlight: true },
  { group: 'Projects & Workflows', label: 'Scheduled triggers',      free: false,           basic: true,        pro: true,         max: true },
  { group: 'Projects & Workflows', label: 'Template remix',          free: false,           basic: true,        pro: true,         max: true },
  { group: 'AI Team (Crew)',       label: 'Crew runs / month',       free: '5',             basic: '50',        pro: '500',        max: 'Unlimited', highlight: true },
  { group: 'AI Team (Crew)',       label: 'Agent credits / month',   free: '300',           basic: '2,000',     pro: '10,000',     max: '50,000',    highlight: true },
  { group: 'AI Team (Crew)',       label: 'Priority AI models',      free: false,           basic: false,       pro: true,         max: true },
  { group: 'AI Team (Crew)',       label: 'Safety & approval gates', free: true,            basic: true,        pro: true,         max: true },
  { group: 'Storage & Exports',   label: 'Storage',                  free: '1 GB',          basic: '5 GB',      pro: '20 GB',      max: '100 GB',    highlight: true },
  { group: 'Storage & Exports',   label: 'Deliverable exports',      free: 'Basic formats', basic: 'Standard',  pro: 'All',        max: 'All' },
  { group: 'Storage & Exports',   label: 'Version history',          free: false,           basic: false,       pro: true,         max: true },
  { group: 'Collaboration',       label: 'User seats',               free: '1',             basic: '1',         pro: '1',          max: '5',         highlight: true },
  { group: 'Collaboration',       label: 'Team permissions',         free: false,           basic: false,       pro: false,        max: true },
  { group: 'Collaboration',       label: 'Audit log',                free: false,           basic: false,       pro: true,         max: true },
  { group: 'Support',             label: 'Support tier',             free: 'Community',     basic: 'Email',     pro: 'Priority',   max: 'Dedicated' },
  { group: 'Support',             label: 'SLA guarantee',            free: false,           basic: false,       pro: false,        max: true },
];

export function formatLimit(value: number | string, suffix = '') {
  if (value === 'unlimited') return 'Unlimited';
  if (typeof value === 'string') return value;
  return suffix ? `${value.toLocaleString()} ${suffix}` : value.toLocaleString();
}

export function buildBillingFeatureTable(): FeatureRow[] {
  const row = (group: string, label: string, metric: keyof ReturnType<typeof getPlanEntitlements>, suffix = '', highlight = false): FeatureRow => {
    const valueFor = (planId: BillingPlanId) => {
      const value = getPlanEntitlements(planId)[metric];
      if (typeof value === 'boolean') return value;
      return formatLimit(value, suffix);
    };
    return {
      group,
      label,
      free: valueFor('free'),
      basic: valueFor('basic'),
      pro: valueFor('pro'),
      max: valueFor('max'),
      highlight,
    };
  };
  return [
    row('AI Ant', 'Messages / month', 'aiAntMessages', '', true),
    row('Projects & Workflows', 'Projects', 'projects', '', true),
    row('Projects & Workflows', 'Workflow runs / month', 'workflowRuns', '', true),
    row('AI Team (Crew)', 'Crew runs / month', 'crewRuns', '', true),
    row('One-Man Enterprise', 'Enterprise workspaces', 'enterpriseWorkspaces', '', true),
    row('Media', 'Image generations', 'imageGenerations'),
    row('Media', 'Video generations', 'videoGenerations'),
    row('Media', 'TTS generations', 'ttsGenerations'),
    row('Colony Bridge', 'Connector actions', 'connectorActions'),
    row('Storage & Exports', 'Storage', 'storageMb', 'MB', true),
    row('Models', 'Custom models', 'customModels'),
    row('Collaboration', 'Team collaboration', 'teamCollaboration'),
    row('Internal', 'Admin dashboard entitlement', 'adminDashboard'),
    row('Execution', 'Priority execution', 'priorityExecution'),
  ];
}

export const ADDON_CATALOG: AddonItem[] = [
  { id: 'crew-pack',    name: 'Crew Run Pack',      description: '+500 crew runs per month',             price: 10, unit: '/mo',      emoji: '⚡', requiredPlan: ['basic', 'pro', 'max'] },
  { id: 'credit-pack',  name: 'Agent Credits Pack', description: '+10,000 agent credits per month',      price: 8,  unit: '/mo',      emoji: '🪙', requiredPlan: ['basic', 'pro', 'max'] },
  { id: 'storage-pack', name: 'Storage Expansion',  description: '+50 GB storage',                       price: 5,  unit: '/mo',      emoji: '💾', requiredPlan: ['basic', 'pro', 'max'] },
  { id: 'seat',         name: 'Extra Team Seat',    description: 'Add 1 collaborator to your workspace', price: 12, unit: '/seat/mo', emoji: '👤', requiredPlan: ['pro', 'max'] },
];

export function loadBillingState(): ColonyBillingState {
  try {
    const raw = localStorage.getItem(BILLING_LS_KEY);
    if (raw) return JSON.parse(raw) as ColonyBillingState;
  } catch { /* ignore */ }
  return { plan: 'free', interval: 'monthly', addonCrewPacks: 0, addonCreditPacks: 0, addonStoragePacks: 0, addonSeatPacks: 0, cardLast4: null, nextRenewal: null };
}

export function saveBillingState(s: ColonyBillingState) {
  try { localStorage.setItem(BILLING_LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
