import type { PlanId, User, Workspace } from '../billing/types';

const now = Date.now();
const isoDaysAgo = (days: number, hours = 0) => new Date(now - days * 864e5 - hours * 36e5).toISOString();

export const MOCK_USERS: User[] = [
  { id: 'admin_001', name: 'Developer', email: 'admin@colony.local', emailVerified: true, role: 'developer', planId: 'max', createdAt: isoDaysAgo(120), lastLoginAt: new Date(now - 18e5).toISOString(), status: 'active' },
  { id: 'usr_001', name: 'Maya Chen', email: 'maya@example.com', emailVerified: true, role: 'user', planId: 'pro', createdAt: isoDaysAgo(45), lastLoginAt: isoDaysAgo(0, 2), status: 'active' },
  { id: 'usr_002', name: 'Niran Wong', email: 'niran@example.com', emailVerified: true, role: 'admin', planId: 'max', createdAt: isoDaysAgo(38), lastLoginAt: isoDaysAgo(1), status: 'active' },
  { id: 'usr_003', name: 'Ava Patel', email: 'ava@example.com', emailVerified: true, role: 'user', planId: 'free', createdAt: isoDaysAgo(30), lastLoginAt: isoDaysAgo(0, 8), status: 'active' },
  { id: 'usr_004', name: 'Leo Tan', email: 'leo@example.com', emailVerified: true, role: 'user', planId: 'free', createdAt: isoDaysAgo(26), lastLoginAt: isoDaysAgo(8), status: 'suspended' },
  { id: 'usr_005', name: 'Sofia Rivera', email: 'sofia@example.com', emailVerified: true, role: 'user', planId: 'pro', createdAt: isoDaysAgo(22), lastLoginAt: isoDaysAgo(3), status: 'active' },
  { id: 'usr_006', name: 'Kenji Ito', email: 'kenji@example.com', emailVerified: true, role: 'user', planId: 'basic', createdAt: isoDaysAgo(19), lastLoginAt: isoDaysAgo(0, 5), status: 'active' },
  { id: 'usr_007', name: 'Elena Brooks', email: 'elena@example.com', emailVerified: true, role: 'user', planId: 'free', createdAt: isoDaysAgo(16), lastLoginAt: isoDaysAgo(12), status: 'active' },
  { id: 'usr_008', name: 'Omar Saleh', email: 'omar@example.com', emailVerified: true, role: 'user', planId: 'max', createdAt: isoDaysAgo(13), lastLoginAt: isoDaysAgo(2), status: 'active' },
  { id: 'usr_009', name: 'Grace Kim', email: 'grace@example.com', emailVerified: true, role: 'user', planId: 'pro', createdAt: isoDaysAgo(8), lastLoginAt: isoDaysAgo(0, 1), status: 'active' },
  { id: 'usr_010', name: 'Ben Carter', email: 'ben@example.com', emailVerified: true, role: 'user', planId: 'free', createdAt: isoDaysAgo(5), lastLoginAt: isoDaysAgo(1, 4), status: 'active' },
  { id: 'usr_011', name: 'Pim Arun', email: 'pim@example.com', emailVerified: true, role: 'user', planId: 'free', createdAt: isoDaysAgo(55), lastLoginAt: isoDaysAgo(42), status: 'deleted' },
];

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws_colony_internal',
    name: 'Colony Internal',
    ownerId: 'admin_001',
    members: [
      { userId: 'admin_001', role: 'owner' },
      { userId: 'usr_002', role: 'admin' },
    ],
    createdAt: isoDaysAgo(120),
  },
];

export function getMockUserById(userId: string) {
  return MOCK_USERS.find((user) => user.id === userId) ?? null;
}

export function getMockUserByEmail(email: string) {
  return MOCK_USERS.find((user) => user.email === email.toLowerCase()) ?? null;
}

export function planForLegacyAdminPlan(plan: string): PlanId {
  if (plan === 'enterprise' || plan === 'team') return 'max';
  if (plan === 'basic' || plan === 'pro' || plan === 'max' || plan === 'free') return plan;
  return 'free';
}
