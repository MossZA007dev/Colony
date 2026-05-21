import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  Clock3,
  Database,
  DollarSign,
  Filter,
  Lock,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { AdminMetricCard } from './AdminMetricCard';
import type { AdminPlan, AdminStore, AdminTab, AdminUser, AdminUserStatus, FeatureName, SystemError, UserRole } from '../../lib/admin/adminTypes';
import { FEATURE_LABELS } from '../../lib/admin/adminTypes';
import { loadAdminStore, saveAdminStore } from '../../lib/admin/adminMockData';
import {
  calculateAdminMetrics,
  calculateAdminWarnings,
  featureEventSummary,
  formatCompactNumber,
  formatCurrency,
  usageByFeature,
  usageByModel,
  usageByUser,
} from '../../lib/admin/adminMetrics';

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'usage', label: 'Usage' },
  { id: 'features', label: 'Features' },
  { id: 'logs', label: 'Logs' },
  { id: 'settings', label: 'Settings' },
];

const roleOptions: Array<UserRole | 'all'> = ['all', 'user', 'admin', 'developer'];
const planOptions: Array<AdminPlan | 'all'> = ['all', 'free', 'basic', 'pro', 'max'];
const statusOptions: Array<AdminUserStatus | 'all'> = ['all', 'active', 'suspended', 'deleted'];
const featureOptions: Array<FeatureName | 'all'> = ['all', 'ai_ant', 'colony_crew', 'one_man_enterprise', 'connected_workspace', 'workflow', 'image_generation', 'video_generation', 'tts_generation', 'custom_models', 'approval'];

export function AdminDashboard({ currentUserEmail, onBack }: { currentUserEmail: string; onBack: () => void }) {
  const [store, setStore] = useState<AdminStore>(() => loadAdminStore());
  const [tab, setTab] = useState<AdminTab>('overview');

  const updateStore = (next: AdminStore) => {
    setStore(next);
    saveAdminStore(next);
  };

  const currentAdmin = store.users.find((user) => user.email === currentUserEmail);

  return (
    <div className="h-full overflow-y-auto bg-[#070711] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Internal
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              Monitor Colony usage, cost, users, AI requests, and system health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              {currentAdmin?.role ?? 'developer'}
            </span>
            <button onClick={onBack} className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-xs font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">
              Back to AI Ant
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-1.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-[10px] px-4 py-2 text-xs font-bold transition ${tab === item.id ? 'bg-[#ffffff] text-[#090914]' : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab store={store} />}
        {tab === 'users' && <UsersTab store={store} updateStore={updateStore} />}
        {tab === 'usage' && <UsageTab store={store} />}
        {tab === 'features' && <FeaturesTab store={store} />}
        {tab === 'logs' && <LogsTab store={store} updateStore={updateStore} />}
        {tab === 'settings' && <SettingsTab store={store} updateStore={updateStore} />}
      </div>
    </div>
  );
}

export function AdminForbidden({ onBack }: { onBack: () => void }) {
  return (
    <div className="grid h-full min-h-screen place-items-center bg-[#070711] px-5 text-white">
      <div className="max-w-md rounded-[22px] border border-red-400/20 bg-red-400/[0.06] p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-400/15 text-red-200">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold">403: Admin access required</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          This area is limited to admin and developer roles. Real admin authorization must be enforced on backend.
        </p>
        <button onClick={onBack} className="mt-6 rounded-[12px] bg-[#ffffff] px-4 py-2.5 text-sm font-bold text-[#080812]">
          Return to AI Ant
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ store }: { store: AdminStore }) {
  const metrics = useMemo(() => calculateAdminMetrics(store), [store]);
  const warnings = useMemo(() => calculateAdminWarnings(store), [store]);
  const byFeature = useMemo(() => usageByFeature(store.aiRequests), [store]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Total Users" value={metrics.totalUsers} trend="+12 this week" detail="Excludes deleted accounts" icon={Users} />
        <AdminMetricCard title="Active Today" value={metrics.activeUsersToday} trend={`${metrics.monthlyActiveUsers} monthly active`} detail="Based on last login" icon={Activity} />
        <AdminMetricCard title="AI Requests" value={metrics.totalAIRequests} trend={`${metrics.successfulRequests} successful`} detail={`${metrics.failedRequests} failed`} icon={Bot} />
        <AdminMetricCard title="Total Tokens" value={formatCompactNumber(metrics.totalTokens)} trend={`${formatCompactNumber(metrics.totalPromptTokens)} prompt`} detail={`${formatCompactNumber(metrics.totalCompletionTokens)} completion`} icon={Zap} />
        <AdminMetricCard title="Estimated Cost" value={formatCurrency(metrics.estimatedCost)} trend={`${formatCurrency(metrics.avgCostPerUser)} / user`} detail="Mock pricing rules" icon={DollarSign} />
        <AdminMetricCard title="Error Rate" value={`${metrics.errorRate.toFixed(1)}%`} trend="Last 24h monitored" detail={`${store.systemErrors.filter((error) => !error.resolved).length} open errors`} icon={AlertTriangle} />
        <AdminMetricCard title="Active Projects" value={metrics.activeProjects} trend="Workspace activity" detail="From user summaries" icon={Database} />
        <AdminMetricCard title="Avg Tokens" value={formatCompactNumber(metrics.avgTokensPerRequest)} trend="Per AI request" detail="Prompt + completion" icon={BarChart3} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Cost by Feature" subtitle="Estimated AI spend distribution">
          <SimpleBars rows={byFeature.map((row) => ({ label: FEATURE_LABELS[row.key as FeatureName] ?? row.label, value: row.cost, suffix: formatCurrency(row.cost) }))} />
        </Panel>
        <Panel title="Warnings" subtitle="Computed from mock admin data">
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-2 rounded-[12px] border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2.5 text-sm text-amber-100/80">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Plan Distribution" subtitle="Users by centralized subscription plan">
          <SimpleBars rows={metrics.planDistribution.map((row) => ({ label: row.label, value: row.count, suffix: `${row.count} users` }))} />
        </Panel>
        <Panel title="Subscription Status" subtitle="Revenue-ready account state">
          <SimpleBars rows={metrics.subscriptionStatusDistribution.map((row) => ({ label: row.label, value: row.count, suffix: `${row.count} accounts` }))} />
        </Panel>
      </section>
    </div>
  );
}

function UsersTab({ store, updateStore }: { store: AdminStore; updateStore: (store: AdminStore) => void }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [plan, setPlan] = useState<AdminPlan | 'all'>('all');
  const [status, setStatus] = useState<AdminUserStatus | 'all'>('all');
  const [sort, setSort] = useState<'createdAt' | 'lastLoginAt' | 'totalTokens' | 'estimatedCost'>('lastLoginAt');
  const [selectedId, setSelectedId] = useState(store.users[0]?.id ?? '');
  const selected = store.users.find((user) => user.id === selectedId) ?? store.users[0];

  const users = store.users
    .filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()))
    .filter((user) => role === 'all' || user.role === role)
    .filter((user) => plan === 'all' || user.plan === plan)
    .filter((user) => status === 'all' || user.status === status)
    .sort((a, b) => {
      if (sort === 'totalTokens' || sort === 'estimatedCost') return b[sort] - a[sort];
      return new Date(b[sort]).getTime() - new Date(a[sort]).getTime();
    });

  const patchUser = (id: string, patch: Partial<AdminUser>) => {
    updateStore({ ...store, users: store.users.map((user) => user.id === id ? { ...user, ...patch } : user) });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Panel title="Users" subtitle="Search, filter, suspend, and change roles locally">
        <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_repeat(4,150px)]">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name or email..." />
          <Select value={role} onChange={(value) => setRole(value as UserRole | 'all')} options={roleOptions} />
          <Select value={plan} onChange={(value) => setPlan(value as AdminPlan | 'all')} options={planOptions} />
          <Select value={status} onChange={(value) => setStatus(value as AdminUserStatus | 'all')} options={statusOptions} />
          <Select value={sort} onChange={(value) => setSort(value as typeof sort)} options={['lastLoginAt', 'createdAt', 'totalTokens', 'estimatedCost']} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-white/35">
              <tr className="border-b border-white/[0.08]">
        {['User', 'Email', 'Role', 'Plan', 'Subscription', 'Usage', 'Status', 'Created', 'Last Login', 'Tokens', 'Cost', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => setSelectedId(user.id)} className="cursor-pointer border-b border-white/[0.05] text-white/70 hover:bg-white/[0.035]">
                  <td className="px-3 py-3 font-semibold text-white">{user.name}</td>
                  <td className="px-3 py-3">{user.email}</td>
                  <td className="px-3 py-3"><Badge tone="violet">{user.role}</Badge></td>
                  <td className="px-3 py-3">{user.plan}</td>
                  <td className="px-3 py-3"><Badge tone={user.subscriptionStatus === 'active' ? 'green' : 'red'}>{user.subscriptionStatus}</Badge></td>
                  <td className="px-3 py-3">{user.usagePercent}%</td>
                  <td className="px-3 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-3 py-3">{shortDate(user.createdAt)}</td>
                  <td className="px-3 py-3">{shortDate(user.lastLoginAt)}</td>
                  <td className="px-3 py-3">{formatCompactNumber(user.totalTokens)}</td>
                  <td className="px-3 py-3">{formatCurrency(user.estimatedCost)}</td>
                  <td className="px-3 py-3">
                    <button onClick={(event) => { event.stopPropagation(); patchUser(user.id, { status: user.status === 'suspended' ? 'active' : 'suspended' }); }} className="rounded-lg border border-white/[0.10] px-2.5 py-1 text-[11px] font-bold text-white/55 hover:text-white">
                      {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {selected && (
        <Panel title="User Details" subtitle={selected.email}>
          <div className="space-y-4 text-sm text-white/65">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/20 text-lg font-bold text-violet-100">{selected.name.slice(0, 1)}</div>
              <div>
                <p className="font-bold text-white">{selected.name}</p>
                <p className="text-xs text-white/35">{selected.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Detail label="Chats" value={selected.totalChats} />
              <Detail label="Projects" value={selected.totalProjects} />
              <Detail label="Tokens" value={formatCompactNumber(selected.totalTokens)} />
              <Detail label="Cost" value={formatCurrency(selected.estimatedCost)} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-white/35">Role</span>
              <Select value={selected.role} onChange={(value) => patchUser(selected.id, { role: value as UserRole })} options={['user', 'admin', 'developer']} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/35">Plan</span>
              <Select value={selected.plan} onChange={(value) => patchUser(selected.id, { plan: value as AdminPlan })} options={['free', 'basic', 'pro', 'max']} />
            </label>
            <Detail label="Subscription" value={selected.subscriptionStatus} />
            <Detail label="Usage percent" value={`${selected.usagePercent}%`} />
            <RecentList title="Recent AI Requests" items={store.aiRequests.filter((request) => request.userId === selected.id).slice(0, 4).map((request) => `${FEATURE_LABELS[request.feature]} - ${request.status} - ${formatCompactNumber(request.totalTokens)} tokens`)} />
            <RecentList title="Recent Errors" items={store.systemErrors.filter((error) => error.userId === selected.id).slice(0, 3).map((error) => `${error.level}: ${error.message}`)} />
          </div>
        </Panel>
      )}
    </div>
  );
}

function UsageTab({ store }: { store: AdminStore }) {
  const [feature, setFeature] = useState<FeatureName | 'all'>('all');
  const [model, setModel] = useState('all');
  const [status, setStatus] = useState<'all' | 'success' | 'failed'>('all');
  const metrics = calculateAdminMetrics(store);
  const models = ['all', ...Array.from(new Set(store.aiRequests.map((request) => request.model)))];
  const requests = store.aiRequests
    .filter((request) => feature === 'all' || request.feature === feature)
    .filter((request) => model === 'all' || request.model === model)
    .filter((request) => status === 'all' || request.status === status)
    .slice(0, 35);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <AdminMetricCard title="Total Tokens" value={formatCompactNumber(metrics.totalTokens)} trend={`${formatCompactNumber(metrics.avgTokensPerRequest)} avg/request`} icon={Zap} />
        <AdminMetricCard title="Prompt Tokens" value={formatCompactNumber(metrics.totalPromptTokens)} trend="Input usage" icon={Database} />
        <AdminMetricCard title="Completion Tokens" value={formatCompactNumber(metrics.totalCompletionTokens)} trend="Output usage" icon={Bot} />
        <AdminMetricCard title="Estimated Cost" value={formatCurrency(metrics.estimatedCost)} trend={`${formatCurrency(metrics.avgCostPerUser)} avg/user`} icon={DollarSign} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top Users by Token Usage" subtitle="Highest consumers first">
          <SimpleBars rows={usageByUser(store.aiRequests).slice(0, 8).map((row) => ({ label: row.label, value: row.tokens, suffix: formatCompactNumber(row.tokens) }))} />
        </Panel>
        <Panel title="Usage by Model" subtitle="Request volume and cost">
          <SimpleBars rows={usageByModel(store.aiRequests).map((row) => ({ label: row.label, value: row.tokens, suffix: `${formatCompactNumber(row.tokens)} / ${formatCurrency(row.cost)}` }))} />
        </Panel>
      </div>
      <Panel title="Recent AI Requests" subtitle="Filter by feature, model, and status">
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <Select value={feature} onChange={(value) => setFeature(value as FeatureName | 'all')} options={featureOptions} />
          <Select value={model} onChange={setModel} options={models} />
          <Select value={status} onChange={(value) => setStatus(value as 'all' | 'success' | 'failed')} options={['all', 'success', 'failed']} />
        </div>
        <AdminRequestsTable requests={requests} />
      </Panel>
    </div>
  );
}

function FeaturesTab({ store }: { store: AdminStore }) {
  const summary = featureEventSummary(store);
  const deviceApprovalRate = summary.deviceActionsRequested ? Math.round((summary.deviceActionsApproved / summary.deviceActionsRequested) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Colony Crew" value={summary.colonyCrewRuns} trend="Runs tracked" detail="Avg 4 agents/run in mock data" icon={Users} />
        <AdminMetricCard title="Colony Bridge" value={summary.deviceActionsRequested} trend={`${summary.deviceActionsApproved} approved`} detail={`${deviceApprovalRate}% approval rate`} icon={ShieldCheck} />
        <AdminMetricCard title="One-Man Enterprise" value={summary.oneManEnterpriseWorkspaces} trend="Workspaces created" detail="Project generation events" icon={Database} />
        <AdminMetricCard title="Approvals" value={`${summary.approvalRate.toFixed(0)}%`} trend="Approval rate" detail={`${summary.rejectionRate.toFixed(0)}% rejected`} icon={Check} />
      </div>
      <Panel title="Feature Analytics" subtitle="Event count and active users by product area">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.cards.map((card) => (
            <div key={card.feature} className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-white">{FEATURE_LABELS[card.feature]}</p>
              <p className="mt-3 text-2xl font-bold">{card.eventCount}</p>
              <p className="mt-1 text-xs text-white/35">{card.activeUsers} active users</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LogsTab({ store, updateStore }: { store: AdminStore; updateStore: (store: AdminStore) => void }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<SystemError['level'] | 'all'>('all');
  const [source, setSource] = useState<SystemError['source'] | 'all'>('all');
  const [selectedId, setSelectedId] = useState(store.systemErrors[0]?.id ?? '');
  const selected = store.systemErrors.find((error) => error.id === selectedId);
  const sources = ['all', ...Array.from(new Set(store.systemErrors.map((error) => error.source)))];
  const errors = store.systemErrors
    .filter((error) => error.message.toLowerCase().includes(query.toLowerCase()))
    .filter((error) => level === 'all' || error.level === level)
    .filter((error) => source === 'all' || error.source === source);

  const toggleResolved = (id: string) => {
    updateStore({ ...store, systemErrors: store.systemErrors.map((error) => error.id === id ? { ...error, resolved: !error.resolved } : error) });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Panel title="Logs & Errors" subtitle="Filter, inspect, and resolve system errors">
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <SearchBox value={query} onChange={setQuery} placeholder="Search messages..." />
          <Select value={level} onChange={(value) => setLevel(value as SystemError['level'] | 'all')} options={['all', 'info', 'warning', 'error', 'critical']} />
          <Select value={source} onChange={(value) => setSource(value as SystemError['source'] | 'all')} options={sources} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-white/35">
              <tr className="border-b border-white/[0.08]">
                {['Time', 'Level', 'Source', 'Message', 'User', 'Resolved', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => (
                <tr key={error.id} onClick={() => setSelectedId(error.id)} className="cursor-pointer border-b border-white/[0.05] text-white/65 hover:bg-white/[0.035]">
                  <td className="px-3 py-3">{shortDate(error.createdAt)}</td>
                  <td className="px-3 py-3"><LevelBadge level={error.level} /></td>
                  <td className="px-3 py-3">{error.source}</td>
                  <td className="max-w-md px-3 py-3 text-white/80">{error.message}</td>
                  <td className="px-3 py-3">{error.userEmail ?? 'system'}</td>
                  <td className="px-3 py-3">{error.resolved ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3">
                    <button onClick={(event) => { event.stopPropagation(); toggleResolved(error.id); }} className="rounded-lg border border-white/[0.10] px-2.5 py-1 text-[11px] font-bold text-white/55 hover:text-white">
                      {error.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Error Details" subtitle={selected?.id ?? 'Select an error'}>
        {selected && (
          <div className="space-y-3 text-sm text-white/65">
            <LevelBadge level={selected.level} />
            <p className="text-white">{selected.message}</p>
            <Detail label="Source" value={selected.source} />
            <Detail label="User" value={selected.userEmail ?? 'system'} />
            <Detail label="Timestamp" value={new Date(selected.createdAt).toLocaleString()} />
            <button onClick={() => toggleResolved(selected.id)} className="w-full rounded-[12px] bg-[#ffffff] px-3 py-2 text-sm font-bold text-[#080812]">
              {selected.resolved ? 'Mark unresolved' : 'Mark resolved'}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SettingsTab({ store, updateStore }: { store: AdminStore; updateStore: (store: AdminStore) => void }) {
  const settings = store.settings;
  const patch = (next: Partial<typeof settings>) => updateStore({ ...store, settings: { ...settings, ...next } });

  return (
    <Panel title="Admin Settings" subtitle="Saved locally for MVP">
      <div className="grid gap-4 lg:grid-cols-2">
        <Toggle label="Safety Mode default" value={settings.safetyModeDefault} onChange={(value) => patch({ safetyModeDefault: value })} />
        <Toggle label="Enable Colony Crew" value={settings.colonyCrewEnabled} onChange={(value) => patch({ colonyCrewEnabled: value })} />
        <Toggle label="Enable Device actions" value={settings.deviceActionsEnabled} onChange={(value) => patch({ deviceActionsEnabled: value })} />
        <Toggle label="Require approval for high-risk actions" value={settings.requireApprovalForHighRisk} onChange={(value) => patch({ requireApprovalForHighRisk: value })} />
        <Toggle label="Maintenance mode" value={settings.maintenanceMode} onChange={(value) => patch({ maintenanceMode: value })} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/45">Default user plan</span>
          <Select value={settings.defaultUserPlan} onChange={(value) => patch({ defaultUserPlan: value as 'free' | 'pro' })} options={['free', 'pro']} />
        </label>
        <NumberInput label="Free user token limit" value={settings.freeUserTokenLimit} onChange={(value) => patch({ freeUserTokenLimit: value })} />
        <NumberInput label="Pro user token limit" value={settings.proUserTokenLimit} onChange={(value) => patch({ proUserTokenLimit: value })} />
      </div>
    </Panel>
  );
}

function AdminRequestsTable({ requests }: { requests: AdminStore['aiRequests'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-white/35">
          <tr className="border-b border-white/[0.08]">
            {['Time', 'User', 'Feature', 'Model', 'Prompt', 'Completion', 'Total', 'Cost', 'Status', 'Latency'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-white/[0.05] text-white/65">
              <td className="px-3 py-3">{shortDate(request.createdAt)}</td>
              <td className="px-3 py-3">{request.userEmail}</td>
              <td className="px-3 py-3">{FEATURE_LABELS[request.feature]}</td>
              <td className="px-3 py-3">{request.model}</td>
              <td className="px-3 py-3">{request.promptTokens.toLocaleString()}</td>
              <td className="px-3 py-3">{request.completionTokens.toLocaleString()}</td>
              <td className="px-3 py-3">{request.totalTokens.toLocaleString()}</td>
              <td className="px-3 py-3">{formatCurrency(request.estimatedCost)}</td>
              <td className="px-3 py-3"><Badge tone={request.status === 'success' ? 'green' : 'red'}>{request.status}</Badge></td>
              <td className="px-3 py-3">{request.latencyMs}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-white/35">{subtitle}</p>}
        </div>
        <Filter className="h-4 w-4 text-white/20" />
      </div>
      {children}
    </section>
  );
}

function SimpleBars({ rows }: { rows: { label: string; value: number; suffix: string }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="text-white/65">{row.label}</span>
            <span className="font-semibold text-white/80">{row.suffix}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-[12px] border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/45" />
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[12px] border border-white/[0.08] bg-[#10101d] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function Badge({ children, tone = 'violet' }: { children: React.ReactNode; tone?: 'violet' | 'green' | 'red' }) {
  const tones = {
    violet: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
    green: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    red: 'border-red-300/20 bg-red-400/10 text-red-200',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function StatusBadge({ status }: { status: AdminUserStatus }) {
  if (status === 'active') return <Badge tone="green">active</Badge>;
  if (status === 'suspended') return <Badge tone="red">suspended</Badge>;
  return <Badge>deleted</Badge>;
}

function LevelBadge({ level }: { level: SystemError['level'] }) {
  const tone = level === 'info' ? 'border-blue-300/20 bg-blue-400/10 text-blue-200'
    : level === 'warning' ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
    : level === 'critical' ? 'border-fuchsia-300/25 bg-fuchsia-500/15 text-fuchsia-100'
    : 'border-red-300/20 bg-red-400/10 text-red-200';
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone}`}>{level}</span>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function RecentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/35">{title}</p>
      <div className="space-y-2">
        {items.length ? items.map((item) => <p key={item} className="rounded-[10px] bg-white/[0.04] px-3 py-2 text-xs text-white/60">{item}</p>) : <p className="text-xs text-white/30">No recent activity.</p>}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center justify-between rounded-[14px] border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-left">
      <span className="text-sm font-semibold text-white/75">{label}</span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition ${value ? 'bg-emerald-500' : 'bg-white/15'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/45">{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45" />
    </label>
  );
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
