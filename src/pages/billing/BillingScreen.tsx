import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowLeft, Check, ChevronDown, CreditCard, Database, Download, FileText, MessageSquare, Minus, Plus, Sparkles, TrendingUp, Users, Workflow, X, Zap } from 'lucide-react';
import { getAnnualSavings, getPlanPrice, PLAN_ORDER, PLANS as BILLING_PLANS } from '../../lib/billing/plans';
import { changePlan, createCheckoutSession, createCustomerPortalSession, ensureSubscriptionForUser, getSubscription, isBillingMockMode } from '../../lib/billing/subscriptions';
import { currentUsagePeriod, getMonthlyUsage } from '../../lib/billing/usage';
import { getLimit, getPlanEntitlements } from '../../lib/billing/entitlements';
import { ADDON_CATALOG, FEATURE_TABLE, PLAN_LIMITS, buildBillingFeatureTable, formatLimit, loadBillingState, saveBillingState } from '../../lib/billing/billingCatalog';
import { MOCK_INVOICES } from '../../lib/data/runSeedData';
import { MOCK_USERS } from '../../lib/mock/mockUsers';
import { resolveBackendUserId } from '../../lib/profile/profileApi';
import type { PlanId as BillingPlanId } from '../../lib/billing/types';
import type { AddonItem, BillingInterval, ColonyBillingState, FeatureRow, PlanTier, UsageState } from '../../lib/types/billingTypes';
import type { UserProfile } from '../../lib/types/appTypes';

export function BillingScreen({
  onBack,
  profile,
  usageState,
  setUsageState,
}: {
  onBack: () => void;
  profile: UserProfile;
  usageState: UsageState;
  setUsageState: (s: UsageState) => void;
}) {
  const userId = resolveBackendUserId(profile);
  const backendUser = MOCK_USERS.find((user) => user.id === userId) ?? MOCK_USERS[0];
  const initialSubscription = ensureSubscriptionForUser(backendUser);
  const [billing, setBillingRaw] = useState<ColonyBillingState>(loadBillingState);
  const [tab, setTab] = useState<'overview' | 'plans' | 'addons' | 'invoices'>('overview');
  const [confirmPlan, setConfirmPlan] = useState<PlanTier | null>(null);
  const [billingNotice, setBillingNotice] = useState('');

  const setBilling = (s: ColonyBillingState) => { setBillingRaw(s); saveBillingState(s); };

  const subscription = getSubscription(userId) ?? initialSubscription;
  const planId = subscription.planId as PlanTier;
  const entitlements = getPlanEntitlements(planId);
  const monthlyUsage = getMonthlyUsage(userId);
  const limits = {
    antMessages: entitlements.aiAntMessages === 'unlimited' ? -1 : entitlements.aiAntMessages,
    workflowRuns: entitlements.workflowRuns === 'unlimited' ? -1 : entitlements.workflowRuns,
    crewRuns: entitlements.crewRuns === 'unlimited' ? -1 : entitlements.crewRuns,
    agentCredits: entitlements.aiAntMessages === 'unlimited' ? 50000 : entitlements.aiAntMessages,
    projects: entitlements.projects === 'unlimited' ? -1 : entitlements.projects,
    activeWorkflows: entitlements.workflowRuns === 'unlimited' ? -1 : entitlements.workflowRuns,
    seats: entitlements.teamCollaboration ? 5 : 1,
    storageGb: entitlements.storageMb === 'unlimited' ? -1 : Math.round(entitlements.storageMb / 1000),
    monthlyPrice: BILLING_PLANS[planId].monthlyPriceUsd,
    yearlyPrice: getPlanPrice(planId, 'yearly'),
  };
  const planDef = { ...BILLING_PLANS[planId], name: BILLING_PLANS[planId].name, id: planId, features: BILLING_PLANS[planId].features };

  const TIERS = PLAN_ORDER as PlanTier[];
  const tierIdx = TIERS.indexOf(planId);

  const pct = (used: number, limit: number) => limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const planAccent: Record<PlanTier, string> = {
    free:  'border-white/[0.12] bg-white/[0.03]',
    basic: 'border-blue-400/25 bg-blue-400/[0.05]',
    pro:   'border-violet-400/35 bg-violet-400/[0.07]',
    max:   'border-amber-400/30 bg-amber-400/[0.06]',
  };
  const planNameColor: Record<PlanTier, string> = {
    free:  'text-white/50',
    basic: 'text-blue-300',
    pro:   'text-violet-300',
    max:   'text-amber-300',
  };

  const planBtnStyle = (id: PlanTier) => {
    if (id === planId) return 'cursor-default border border-white/[0.12] text-muted';
    const tIdx = TIERS.indexOf(id);
    if (id === 'pro') return 'bg-accent text-white hover:bg-accent/85';
    return tIdx > tierIdx
      ? 'border border-white/[0.18] text-ink hover:bg-white/[0.06]'
      : 'border border-white/[0.10] text-muted hover:bg-white/[0.04]';
  };

  const barColor = (p: number) => p >= 95 ? 'bg-rose-500' : p >= 80 ? 'bg-amber-400' : 'bg-accent';

  const confirmUpgrade = async (target: PlanTier) => {
    const checkout = await createCheckoutSession(target, billing.interval, userId);
    if (checkout.mode === 'mock') setBillingNotice(checkout.message);
    changePlan(userId, target, billing.interval);
    const s: ColonyBillingState = { ...billing, plan: target };
    setBilling(s);
    setUsageState({ ...usageState, currentPlan: target });
    setConfirmPlan(null);
  };

  const dynamicFeatureTable = buildBillingFeatureTable();
  const featureGroups = [...new Set(dynamicFeatureTable.map((r) => r.group))];
  const addonTotal = billing.addonCrewPacks * 10 + billing.addonCreditPacks * 8 + billing.addonStoragePacks * 5 + billing.addonSeatPacks * 12;

  const PLAN_AUDIENCE: Record<PlanTier, string> = {
    free:  'For exploring Colony',
    basic: 'For solo builders',
    pro:   'For growing AI workflows',
    max:   'For serious operators & teams',
  };

  const STATUS_META: Record<string, { label: string; cls: string }> = {
    active:   { label: 'Active',   cls: 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300' },
    trialing: { label: 'Trial',    cls: 'border-blue-400/30 bg-blue-400/[0.08] text-blue-300' },
    past_due: { label: 'Past due', cls: 'border-amber-400/30 bg-amber-400/[0.08] text-amber-300' },
    canceled: { label: 'Canceled', cls: 'border-rose-400/30 bg-rose-400/[0.08] text-rose-300' },
    paused:   { label: 'Paused',   cls: 'border-white/20 bg-white/[0.05] text-white/45' },
  };
  const subStatusMeta = STATUS_META[subscription.status] ?? STATUS_META.active;
  const periodEndDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  const healthOf = (p: number) =>
    p >= 90 ? { text: 'Critical', cls: 'text-rose-400' }
    : p >= 70 ? { text: 'High', cls: 'text-amber-400' }
    : p >= 40 ? { text: 'Moderate', cls: 'text-sky-300' }
    : { text: 'Healthy', cls: 'text-emerald-400' };

  const usageItems: { key: string; label: string; used: number; limit: number; unit: string; icon: React.ReactNode; upgradeHint: string | null }[] = [
    { key: 'ant',      label: 'AI Ant messages', used: monthlyUsage.aiAntMessages,                    limit: limits.antMessages,  unit: 'messages', icon: <MessageSquare className="h-4 w-4 text-accent" />,       upgradeHint: planId === 'free' ? 'Basic includes 2,000 messages/mo' : planId === 'basic' ? 'Pro includes unlimited messages' : null },
    { key: 'workflow', label: 'Workflow runs',   used: monthlyUsage.workflowRuns,                     limit: limits.workflowRuns, unit: 'runs',     icon: <Workflow className="h-4 w-4 text-cyan-400" />,          upgradeHint: planId === 'free' ? 'Basic includes 50 runs/mo' : planId === 'basic' ? 'Pro includes 500 runs/mo' : null },
    { key: 'crew',     label: 'Crew runs',       used: monthlyUsage.crewRuns,                         limit: limits.crewRuns,     unit: 'runs',     icon: <Users className="h-4 w-4 text-violet-400" />,           upgradeHint: planId === 'free' ? 'Basic includes 50 crew runs/mo' : planId === 'basic' ? 'Pro includes 500 runs/mo' : null },
    { key: 'storage',  label: 'Storage used',    used: Math.round(monthlyUsage.storageMb / 100) / 10, limit: limits.storageGb,    unit: 'GB',       icon: <Database className="h-4 w-4 text-emerald-400" />,       upgradeHint: planId === 'free' ? 'Basic includes 1 GB storage' : null },
  ];

  const usagePcts = usageItems.map(({ used, limit }) => limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100)));
  const maxUsagePct = usagePcts.length > 0 ? Math.max(...usagePcts) : 0;

  const recommendation: { title: string; reason: string; cta: string; action: () => void } | null = (() => {
    if (planId === 'max') return null;
    const nextTier = TIERS[tierIdx + 1] as PlanTier;
    if (maxUsagePct >= 70) {
      return { title: `${BILLING_PLANS[nextTier].name} is recommended for your usage`, reason: `You're using ${maxUsagePct}% of a key limit. At this pace, you may hit your plan ceiling soon.`, cta: `Upgrade to ${BILLING_PLANS[nextTier].name}`, action: () => setConfirmPlan(nextTier) };
    }
    if (planId === 'free') {
      return { title: 'Unlock more with Basic — $12/mo', reason: 'Get 2,000 AI Ant messages, 50 workflow runs, 10 projects, and 1 GB storage.', cta: 'Upgrade to Basic', action: () => setConfirmPlan('basic') };
    }
    return null;
  })();

  const recentEvents = usageState.usageEvents.slice(0, 5);
  const totalPaidThisYear = MOCK_INVOICES.filter((inv) => inv.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount.replace('$', '')), 0);

  return (
    <div className="min-h-screen bg-background text-ink">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.07] bg-surface/80 px-5 py-3.5 backdrop-blur-xl md:px-8">
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition hover:bg-white/[0.06] hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-white/15">/</span>
        <h1 className="font-heading text-lg font-extrabold">Billing & Plans</h1>
        {isBillingMockMode() && (
          <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">Mock</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${subStatusMeta.cls}`}>{subStatusMeta.label}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${planAccent[planId]} ${planNameColor[planId]}`}>{planDef.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[57px] z-10 border-b border-white/[0.07] bg-background/95 px-5 backdrop-blur-xl md:px-8">
        <nav className="flex gap-1">
          {(['overview', 'plans', 'addons', 'invoices'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-3 text-[13px] font-semibold capitalize transition ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t === 'addons' ? 'Add-ons' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-8">

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* Hero subscription card */}
            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${planAccent[planId]}`}>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${subStatusMeta.cls}`}>{subStatusMeta.label}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${planNameColor[planId]}`}>{planDef.name} Plan</span>
                  </div>
                  <p className="mt-2 font-heading text-3xl font-extrabold">
                    {limits.monthlyPrice === 0 ? 'Free forever' : `$${billing.interval === 'yearly' ? limits.yearlyPrice : limits.monthlyPrice}`}
                    {limits.monthlyPrice > 0 && <span className="text-base font-normal text-muted">/mo</span>}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    {limits.monthlyPrice > 0 ? `Billed ${subscription.billingCycle} · ` : ''}Renews {periodEndDate}
                  </p>
                  {maxUsagePct > 0 && (
                    <div className="mt-4 max-w-xs">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted">Plan health</span>
                        <span className={healthOf(maxUsagePct).cls}>{healthOf(maxUsagePct).text}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.07]">
                        <div className={`h-1.5 rounded-full transition-all ${barColor(maxUsagePct)}`} style={{ width: `${maxUsagePct}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{maxUsagePct}% of peak limit used</p>
                    </div>
                  )}
                  {billingNotice && <p className="mt-3 max-w-xl rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100/80">{billingNotice}</p>}
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                  {planId !== 'max' && (
                    <button onClick={() => setTab('plans')} className="rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent/85">
                      Upgrade plan
                    </button>
                  )}
                  {planId !== 'free' && (
                    <button onClick={() => setTab('plans')} className="rounded-xl border border-white/[0.14] px-4 py-2 text-[13px] font-semibold text-muted transition hover:bg-white/[0.06]">
                      Manage plan
                    </button>
                  )}
                  <button onClick={async () => setBillingNotice((await createCustomerPortalSession(userId)).message)} className="rounded-xl border border-white/[0.14] px-4 py-2 text-[13px] font-semibold text-muted transition hover:bg-white/[0.06]">
                    Customer portal
                  </button>
                </div>
              </div>
            </div>

            {/* Usage cards */}
            <div>
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-muted">Usage this month</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {usageItems.map(({ key, label, used, limit, unit, icon, upgradeHint }, i) => {
                  const p = usagePcts[i];
                  const unlimited = limit === -1;
                  const health = healthOf(p);
                  return (
                    <div key={key} className={`rounded-[18px] border p-5 ${!unlimited && p >= 80 ? 'border-amber-400/20 bg-amber-400/[0.03]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="text-[13px] font-semibold">{label}</span>
                        </div>
                        {!unlimited && p > 0 && <span className={`text-[11px] font-semibold ${health.cls}`}>{health.text}</span>}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold">{unlimited ? '∞' : used.toLocaleString()}</span>
                          {!unlimited && <span className="text-[12px] text-muted">/ {limit.toLocaleString()} {unit}</span>}
                          {unlimited && <span className="text-[12px] text-muted">Unlimited</span>}
                        </div>
                        {!unlimited && (
                          <>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.07]">
                              <div className={`h-1.5 rounded-full transition-all ${barColor(p)}`} style={{ width: `${p}%` }} />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-muted">{p}% used · Resets {periodEndDate}</span>
                              {p >= 80 && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />}
                            </div>
                          </>
                        )}
                        {upgradeHint && (
                          <p className="mt-2 flex items-center gap-1 text-[11px] text-accent/70">
                            <TrendingUp className="h-3 w-3 shrink-0" />{upgradeHint}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendation panel */}
            {recommendation && (
              <div className="flex flex-col gap-4 rounded-[18px] border border-accent/25 bg-accent/[0.05] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-[13px] font-bold">{recommendation.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{recommendation.reason}</p>
                  </div>
                </div>
                <button onClick={recommendation.action} className="shrink-0 rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent/85">
                  {recommendation.cta}
                </button>
              </div>
            )}

            {/* Billing meta row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted" />
                  <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Payment</p>
                </div>
                {billing.cardLast4 ? (
                  <p className="text-sm font-semibold">•••• •••• •••• {billing.cardLast4}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted">No card on file</p>
                    <button className="mt-2.5 rounded-lg border border-white/[0.18] px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-white/[0.06]">
                      Add card
                    </button>
                  </>
                )}
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted" />
                  <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Events this month</p>
                </div>
                <p className="text-2xl font-extrabold">{(monthlyUsage.aiAntMessages + monthlyUsage.workflowRuns + monthlyUsage.crewRuns + monthlyUsage.enterpriseRuns).toLocaleString()}</p>
                <p className="mt-0.5 text-[12px] text-muted">{currentUsagePeriod()} period</p>
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted" />
                  <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Est. cost</p>
                </div>
                <p className="text-2xl font-extrabold">${monthlyUsage.estimatedCostUsd.toFixed(2)}</p>
                <p className="mt-0.5 text-[12px] text-muted">this billing period</p>
              </div>
            </div>

            {/* Recent activity */}
            {recentEvents.length > 0 && (
              <div>
                <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-muted">Recent activity</h2>
                <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] divide-y divide-white/[0.05]">
                  {recentEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${ev.status === 'Completed' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="truncate text-[13px] font-semibold">{ev.workflowName ?? ev.actionType ?? 'Event'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[12px] text-muted">{ev.creditsUsed ? `${ev.creditsUsed} credits` : ''}</span>
                        <span className="text-[12px] text-muted">{new Date(ev.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Plans ── */}
        {tab === 'plans' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-extrabold">Choose a plan</h2>
                <p className="mt-0.5 text-[13px] text-muted">All plans include Colony's core AI Ant assistant.</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.03] p-1">
                <button
                  onClick={() => setBilling({ ...billing, interval: 'monthly' })}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${billing.interval === 'monthly' ? 'bg-accent text-white' : 'text-muted'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling({ ...billing, interval: 'yearly' })}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${billing.interval === 'yearly' ? 'bg-accent text-white' : 'text-muted'}`}
                >
                  Yearly{' '}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${billing.interval === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    -20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {TIERS.map((tierId) => {
                const p = BILLING_PLANS[tierId];
                const price = getPlanPrice(tierId, billing.interval);
                const yearlySavings = getAnnualSavings(p.id);
                const isCurrent = p.id === planId;
                const tIdx = TIERS.indexOf(p.id);
                const isUpgrade = tIdx > tierIdx;
                return (
                  <div key={p.id} className={`relative flex flex-col rounded-[20px] border p-5 transition ${isCurrent ? planAccent[p.id] + ' ring-1 ring-accent/25' : p.recommended ? 'border-accent/30 bg-accent/[0.05]' : 'border-white/[0.08] bg-white/[0.025]'}`}>
                    {p.recommended && !isCurrent && (
                      <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Recommended</span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-5 rounded-full border border-white/[0.18] bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">Current</span>
                    )}
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${planNameColor[p.id]}`}>{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{PLAN_AUDIENCE[p.id]}</p>
                    <div className="mt-3">
                      {price === 0 ? (
                        <span className="text-3xl font-extrabold">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold">${price}</span>
                          <span className="text-sm text-muted">/mo</span>
                        </>
                      )}
                      {billing.interval === 'monthly' && p.monthlyPriceUsd > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted/70">Switch to yearly → save ${yearlySavings}/yr</p>
                      )}
                      {billing.interval === 'yearly' && p.monthlyPriceUsd > 0 && (
                        <p className="mt-0.5 text-[11px] text-emerald-400">Saves ${yearlySavings}/yr vs monthly</p>
                      )}
                    </div>
                    <p className="mt-3 text-[12px] text-muted">{p.description}</p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {p.features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-muted">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={isCurrent}
                      onClick={() => { if (!isCurrent) setConfirmPlan(p.id); }}
                      className={`mt-5 rounded-xl py-2.5 text-[13px] font-bold transition ${planBtnStyle(p.id)}`}
                    >
                      {isCurrent ? 'Current plan' : isUpgrade ? `Upgrade to ${p.name}` : `Downgrade to ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Feature comparison table */}
            <div className="overflow-x-auto rounded-[20px] border border-white/[0.07]">
              <table className="w-full min-w-[600px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="py-3.5 pl-5 pr-4 text-left text-[12px] font-bold text-muted">Feature</th>
                    {TIERS.map((tier) => {
                      const p = BILLING_PLANS[tier];
                      const isRec = p.recommended && tier !== planId;
                      return (
                        <th key={p.id} className={`px-3 py-3.5 text-center text-[12px] font-bold ${tier === planId ? planNameColor[tier] : isRec ? 'text-accent' : 'text-muted'}`}>
                          {p.name}{tier === planId ? ' ✓' : ''}
                          {isRec && <span className="ml-1 rounded-full bg-accent/15 px-1 py-0.5 text-[9px] text-accent">★</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {featureGroups.map((group) => (
                    <React.Fragment key={group}>
                      <tr className="border-b border-white/[0.05] bg-white/[0.015]">
                        <td colSpan={5} className="py-2 pl-5 text-[11px] font-bold uppercase tracking-widest text-white/35">{group}</td>
                      </tr>
                      {dynamicFeatureTable.filter((r) => r.group === group).map((row) => (
                        <tr key={row.label} className={`border-b border-white/[0.04] transition hover:bg-white/[0.02] ${row.highlight ? 'bg-white/[0.01]' : ''}`}>
                          <td className={`py-3 pl-5 pr-4 ${row.highlight ? 'font-semibold text-ink' : 'text-muted'}`}>{row.label}</td>
                          {(['free', 'basic', 'pro', 'max'] as PlanTier[]).map((tier) => {
                            const val = row[tier];
                            const active = tier === planId;
                            const isRec = BILLING_PLANS[tier].recommended && tier !== planId;
                            return (
                              <td key={tier} className={`px-3 py-3 text-center ${active ? 'bg-accent/[0.04]' : isRec ? 'bg-accent/[0.012]' : ''}`}>
                                {typeof val === 'boolean'
                                  ? (val
                                    ? <Check className="mx-auto h-4 w-4 text-accent" />
                                    : <Minus className="mx-auto h-3.5 w-3.5 text-white/15" />)
                                  : <span className={active ? planNameColor[planId] : isRec ? 'text-accent/80' : 'text-muted'}>{val as string}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Add-ons ── */}
        {tab === 'addons' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-xl font-extrabold">Add-ons</h2>
              <p className="mt-1 text-[13px] text-muted">Extend your plan with extra capacity. Billed monthly alongside your plan.</p>
            </div>

            {planId === 'free' && (
              <div className="rounded-[16px] border border-amber-400/20 bg-amber-400/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-semibold text-amber-200">Add-ons require a paid plan</p>
                </div>
                <p className="mt-1.5 text-[13px] text-muted">Upgrade to Basic or above to unlock add-ons.</p>
                <button onClick={() => setTab('plans')} className="mt-3 rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent/85">
                  View plans
                </button>
              </div>
            )}

            {/* Active add-ons chips */}
            {planId !== 'free' && addonTotal > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[12px] font-semibold text-muted">Active add-ons:</span>
                {billing.addonCrewPacks > 0 && <span className="rounded-full border border-violet-400/25 bg-violet-400/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">{billing.addonCrewPacks}× Crew Pack</span>}
                {billing.addonCreditPacks > 0 && <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">{billing.addonCreditPacks}× Credit Pack</span>}
                {billing.addonStoragePacks > 0 && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">{billing.addonStoragePacks}× Storage</span>}
                {billing.addonSeatPacks > 0 && <span className="rounded-full border border-sky-400/25 bg-sky-400/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">{billing.addonSeatPacks}× Extra Seat</span>}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {ADDON_CATALOG.map((addon) => {
                const available = addon.requiredPlan.includes(planId);
                const qty =
                  addon.id === 'crew-pack'    ? billing.addonCrewPacks :
                  addon.id === 'credit-pack'  ? billing.addonCreditPacks :
                  addon.id === 'storage-pack' ? billing.addonStoragePacks :
                  billing.addonSeatPacks;
                const setQty = (n: number) => {
                  const next = { ...billing };
                  const v = Math.max(0, n);
                  if (addon.id === 'crew-pack')         next.addonCrewPacks = v;
                  else if (addon.id === 'credit-pack')  next.addonCreditPacks = v;
                  else if (addon.id === 'storage-pack') next.addonStoragePacks = v;
                  else                                  next.addonSeatPacks = v;
                  setBilling(next);
                };
                const reqPlanName = addon.requiredPlan[0].charAt(0).toUpperCase() + addon.requiredPlan[0].slice(1);
                return (
                  <div key={addon.id} className={`rounded-[18px] border p-5 transition ${available ? 'border-white/[0.09] bg-white/[0.025]' : 'border-white/[0.05] bg-white/[0.015]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="mt-0.5 text-xl leading-none shrink-0">{addon.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{addon.name}</p>
                            {!available && <span className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/35">Locked</span>}
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted">{addon.description}</p>
                          {!available && <p className="mt-0.5 text-[11px] text-muted/60">For: {reqPlanName}+ plan</p>}
                          <p className="mt-2 text-[13px] font-bold">${addon.price}<span className="font-normal text-muted text-[12px]"> {addon.unit}</span></p>
                        </div>
                      </div>
                      {available ? (
                        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-2 py-1">
                          <button onClick={() => setQty(qty - 1)} disabled={qty === 0} className="rounded p-1 text-muted transition hover:text-ink disabled:opacity-30">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-[13px] font-bold">{qty}</span>
                          <button onClick={() => setQty(qty + 1)} className="rounded p-1 text-muted transition hover:text-ink">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setTab('plans')} className="shrink-0 rounded-lg border border-white/[0.14] px-2.5 py-1.5 text-[11px] font-semibold text-muted transition hover:bg-white/[0.06]">
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {planId !== 'free' && (
              <div className="flex flex-col gap-4 rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Combined billing total</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    ${limits.monthlyPrice + addonTotal}<span className="text-sm font-normal text-muted">/mo</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">{planDef.name} plan (${limits.monthlyPrice}/mo) + ${addonTotal}/mo add-ons</p>
                </div>
                <button className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-accent/85">
                  Confirm add-ons
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Invoices ── */}
        {tab === 'invoices' && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-extrabold">Invoice history</h2>

            {/* Summary row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Total paid this year</p>
                <p className="mt-1.5 text-2xl font-extrabold">${totalPaidThisYear.toFixed(2)}</p>
                <p className="mt-0.5 text-[12px] text-muted">{MOCK_INVOICES.filter((i) => i.status === 'Paid').length} invoices paid</p>
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Next billing date</p>
                <p className="mt-1.5 text-2xl font-extrabold">{periodEndDate}</p>
                <p className="mt-0.5 text-[12px] text-muted">Auto-renews {subscription.billingCycle}</p>
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Billing plan</p>
                <p className={`mt-1.5 text-2xl font-extrabold ${planNameColor[planId]}`}>{planDef.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">${limits.monthlyPrice}/mo · {subscription.billingCycle}</p>
              </div>
            </div>

            {MOCK_INVOICES.length === 0 ? (
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-8 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-sm text-muted">No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[18px] border border-white/[0.07]">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                      <th className="py-3 pl-5 text-left text-[12px] font-bold text-muted">Invoice</th>
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-muted">Date</th>
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-muted">Plan</th>
                      <th className="px-4 py-3 text-right text-[12px] font-bold text-muted">Amount</th>
                      <th className="px-4 py-3 text-right text-[12px] font-bold text-muted">Status</th>
                      <th className="px-4 py-3 pr-5 text-right text-[12px] font-bold text-muted">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                        <td className="py-3.5 pl-5 font-mono text-[12px] text-muted">{inv.id}</td>
                        <td className="px-4 py-3.5 text-muted">{inv.date}</td>
                        <td className="px-4 py-3.5 font-medium">{inv.plan}</td>
                        <td className="px-4 py-3.5 text-right font-semibold">{inv.amount}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${inv.status === 'Paid' ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-amber-400/25 bg-amber-400/[0.08] text-amber-300'}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3.5 pr-5 text-right">
                          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:bg-white/[0.06] hover:text-ink ml-auto">
                            <Download className="h-3 w-3" />PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isBillingMockMode() && (
              <div className="flex items-center gap-2 rounded-[14px] border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-[12px] text-amber-200/70">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                Mock billing is active. Real invoices will appear here once Stripe is configured.
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Upgrade / Downgrade modal ── */}
      <AnimatePresence>
        {confirmPlan !== null && (() => {
          const cp = confirmPlan;
          const target = BILLING_PLANS[cp];
          const targetLim = getPlanEntitlements(cp);
          const tIdx = TIERS.indexOf(cp);
          const isUp = tIdx > tierIdx;
          const price = getPlanPrice(cp, billing.interval);
          return (
            <motion.div
              key="billing-modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setConfirmPlan(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="mx-4 w-full max-w-md rounded-[24px] border border-white/[0.12] bg-surface p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{isUp ? 'Upgrade to' : 'Downgrade to'}</p>
                    <h3 className={`mt-0.5 font-heading text-2xl font-extrabold ${planNameColor[cp]}`}>{target.name}</h3>
                  </div>
                  <button onClick={() => setConfirmPlan(null)} className="rounded-lg p-1.5 text-muted transition hover:bg-white/[0.06] hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className={`mt-4 rounded-[14px] border p-4 ${planAccent[cp]}`}>
                  <p className="text-[13px] text-muted">{price === 0 ? 'Free forever' : `$${price}/mo (billed ${billing.interval})`}</p>
                  <ul className="mt-3 space-y-1.5">
                    {[
                      targetLim.aiAntMessages === 'unlimited' ? 'Unlimited AI Ant messages' : `${targetLim.aiAntMessages} AI Ant messages/mo`,
                      targetLim.workflowRuns === 'unlimited' ? 'Unlimited workflow runs' : `${targetLim.workflowRuns} workflow runs/mo`,
                      targetLim.crewRuns === 'unlimited' ? 'Unlimited crew runs' : `${targetLim.crewRuns} crew runs/mo`,
                      `${targetLim.storageMb === 'unlimited' ? 'Unlimited' : `${targetLim.storageMb.toLocaleString()} MB`} storage`,
                      targetLim.projects === 'unlimited' ? 'Unlimited projects' : `${targetLim.projects} projects`,
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[12px] text-muted">
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent" />{f}
                      </li>
                    ))}
                  </ul>
                </div>

                {!isUp && (
                  <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-amber-400/20 bg-amber-400/[0.04] p-3">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <p className="text-[12px] text-amber-200">Some features will be restricted after downgrade.</p>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setConfirmPlan(null)} className="rounded-xl border border-white/[0.14] px-4 py-2 text-[13px] font-semibold text-muted transition hover:bg-white/[0.06]">
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmUpgrade(cp)}
                    className={`rounded-xl px-4 py-2 text-[13px] font-bold text-white transition ${isUp ? 'bg-accent hover:bg-accent/85' : 'bg-amber-500/80 hover:bg-amber-500/70'}`}
                  >
                    {isUp ? `Upgrade to ${target.name}` : `Downgrade to ${target.name}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
