import { PLANS } from './plans';
import type { BillingCycle, PlanId, Subscription, User } from './types';
import { MOCK_USERS } from '../mock/mockUsers';

const SUBSCRIPTIONS_KEY = 'colony_subscriptions_v1';
const MOCK_MODE = true;

const periodStart = new Date();
periodStart.setDate(1);
periodStart.setHours(0, 0, 0, 0);
const periodEnd = new Date(periodStart);
periodEnd.setMonth(periodEnd.getMonth() + 1);

function seedSubscriptions(): Subscription[] {
  return MOCK_USERS.map((user) => ({
    id: `sub_${user.id}`,
    userId: user.id,
    planId: user.planId,
    status: user.status === 'suspended' ? 'paused' : 'active',
    billingCycle: 'monthly',
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    providerCustomerId: user.planId === 'free' ? undefined : `cus_mock_${user.id}`,
    providerSubscriptionId: user.planId === 'free' ? undefined : `sub_mock_${user.id}`,
  }));
}

export function isBillingMockMode() {
  return MOCK_MODE;
}

export function loadSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_KEY);
    if (raw) return JSON.parse(raw) as Subscription[];
  } catch { /* ignore */ }
  const seeded = seedSubscriptions();
  saveSubscriptions(seeded);
  return seeded;
}

export function saveSubscriptions(subscriptions: Subscription[]) {
  try { localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions)); } catch { /* ignore */ }
}

export function getSubscription(userId: string) {
  return loadSubscriptions().find((subscription) => subscription.userId === userId) ?? null;
}

export function ensureSubscriptionForUser(user: Pick<User, 'id' | 'planId' | 'status'>, billingCycle: BillingCycle = 'monthly') {
  const subscriptions = loadSubscriptions();
  const existing = subscriptions.find((subscription) => subscription.userId === user.id);
  if (existing) return existing;
  const next: Subscription = {
    id: `sub_${user.id}`,
    userId: user.id,
    planId: user.planId,
    status: user.status === 'active' ? 'active' : 'paused',
    billingCycle,
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
  };
  saveSubscriptions([next, ...subscriptions]);
  return next;
}

export async function createCheckoutSession(planId: PlanId, billingCycle: BillingCycle, userId = 'admin_001') {
  // TODO(stripe): create a real checkout session server-side with Stripe secret keys.
  if (MOCK_MODE) {
    return { mode: 'mock' as const, checkoutUrl: null, message: `Dev mode: Stripe is not configured. ${PLANS[planId].name} ${billingCycle} checkout was not processed.`, planId, billingCycle, userId };
  }
  throw new Error('Stripe checkout is not configured.');
}

export async function createCustomerPortalSession(userId = 'admin_001') {
  // TODO(stripe): create Stripe Billing Portal session server-side.
  return { mode: 'mock' as const, portalUrl: null, message: 'Dev mode: customer portal is unavailable until Stripe is configured.', userId };
}

export async function handleStripeWebhook(event: { type: string; data?: unknown }) {
  // TODO(stripe): verify webhook signature server-side before mutating subscription data.
  return { received: true, supported: STRIPE_WEBHOOK_EVENTS.includes(event.type), eventType: event.type };
}

export async function syncSubscriptionFromStripe(userId: string) {
  // TODO(stripe): fetch Stripe subscription and upsert local/backend subscription.
  return getSubscription(userId);
}

export function cancelSubscription(userId: string) {
  const subscriptions = loadSubscriptions();
  const next = subscriptions.map((subscription) => subscription.userId === userId ? { ...subscription, status: 'canceled' as const } : subscription);
  saveSubscriptions(next);
  return next.find((subscription) => subscription.userId === userId) ?? null;
}

export function changePlan(userId: string, planId: PlanId, billingCycle?: BillingCycle) {
  const subscriptions = loadSubscriptions();
  const current = subscriptions.find((subscription) => subscription.userId === userId);
  const nextSubscription: Subscription = {
    ...(current ?? {
      id: `sub_${userId}`,
      userId,
      currentPeriodStart: periodStart.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    }),
    planId,
    billingCycle: billingCycle ?? current?.billingCycle ?? 'monthly',
    status: planId === 'free' ? 'active' : current?.status ?? 'active',
  };
  saveSubscriptions(current ? subscriptions.map((subscription) => subscription.userId === userId ? nextSubscription : subscription) : [nextSubscription, ...subscriptions]);
  return nextSubscription;
}

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];
