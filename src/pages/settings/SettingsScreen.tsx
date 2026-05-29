import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, BarChart3, Brain, Check, ChevronDown, ClipboardCheck, CreditCard, Eye, EyeOff, Globe, LogOut, MessageSquare, Monitor, Moon, Plug, Settings, ShieldCheck, Sparkles, Sun, Terminal, Trash2, User, Zap } from 'lucide-react';
import { canSeeDeveloperSettings, roleBadgeLabel } from '../../lib/auth/roles';
import { getCurrentUser } from '../../lib/auth/mockAuth';
import type { AuthProvider } from '../../lib/auth/mockAuth';
import type { UserRole } from '../../lib/admin/adminTypes';
import { WS_CHATS_KEY, WS_PROJECTS_KEY } from '../../lib/workspace/workspaceApi';
import { ConfirmModal, DeleteAccountModal } from '../../components/modals/Modals';
import type { UserProfile } from '../../lib/types/appTypes';

export const SETTINGS_NAV: { group: string; items: { id: string; icon: React.ElementType }[] }[] = [
  { group: 'General', items: [
    { id: 'Account', icon: User },
    { id: 'Appearance', icon: Sun },
    { id: 'Notifications', icon: MessageSquare },
    { id: 'Privacy', icon: ShieldCheck },
  ]},
  { group: 'AI Ant', items: [
    { id: 'Safety Mode', icon: ShieldCheck },
    { id: 'Approval Rules', icon: ClipboardCheck },
    { id: 'Memory', icon: Brain },
    { id: 'Tool Permissions', icon: Plug },
  ]},
  { group: 'Developer', items: [
    { id: 'API Keys', icon: Terminal },
    { id: 'Logs', icon: Activity },
  ]},
  { group: 'Billing', items: [
    { id: 'Plan', icon: CreditCard },
    { id: 'Usage', icon: BarChart3 },
  ]},
];

export function SettingsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? 'bg-violet-600' : 'bg-white/[0.12]'}`}>
      <span className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

export function SettingsScreen({ onBack, profile, safetyMode, setSafetyMode, theme, setTheme, goBilling, onSignOut, onSwitchAccount, onChangePassword, initialActive }: {
  onBack: () => void;
  profile: UserProfile;
  safetyMode: boolean;
  setSafetyMode: (v: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  goBilling: () => void;
  onSignOut: () => void | Promise<void>;
  onSwitchAccount: () => void | Promise<void>;
  onChangePassword: () => void;
  initialActive?: string;
}) {
  const [active, setActive] = useState(initialActive ?? 'Account');
  const [confirm, setConfirm] = useState<null | 'logout' | 'switch' | 'delete'>(null);
  const [deleteText, setDeleteText] = useState('');

  // Resolve the auth provider from the active mock session so we know whether
  // to show "Change password" (only meaningful for email/password accounts).
  const currentAuth = getCurrentUser();
  const authProvider: AuthProvider = currentAuth?.provider ?? 'email';

  const filteredNav = SETTINGS_NAV
    .map((group) => {
      if (group.group === 'Developer' && !canSeeDeveloperSettings(profile)) return null;
      return group;
    })
    .filter((group): group is (typeof SETTINGS_NAV)[number] => Boolean(group));

  // If a non-developer landed on a Developer-only setting (e.g. via a stale URL),
  // pop back to Account so the page doesn't render a developer-only screen.
  useEffect(() => {
    const developerOnly = new Set(['API Keys', 'Logs']);
    if (developerOnly.has(active) && !canSeeDeveloperSettings(profile)) setActive('Account');
  }, [active, profile]);

  const handleConfirm = async () => {
    const action = confirm;
    setConfirm(null);
    setDeleteText('');
    if (action === 'logout') await onSignOut();
    if (action === 'switch') await onSwitchAccount();
    if (action === 'delete') {
      // Mock-mode local deletion: wipe local profile + workspace caches and
      // sign out. Backend account deletion must happen server-side.
      try {
        localStorage.removeItem('colony.profile.v1');
        localStorage.removeItem('colony_current_user');
        localStorage.removeItem('colony_users');
        localStorage.removeItem(WS_CHATS_KEY);
        localStorage.removeItem(WS_PROJECTS_KEY);
      } catch { /* ignore */ }
      await onSignOut();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#07070f] text-white">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-5 py-3 backdrop-blur-xl">
        <button onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/45 transition hover:bg-white/[0.05] hover:text-white/80">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-white/15">/</span>
        <h1 className="font-heading text-[15px] font-extrabold text-white/90">Settings</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="hidden w-[220px] shrink-0 overflow-y-auto border-r border-white/[0.06] py-5 md:block">
          {/* Profile summary */}
          <div className="mb-5 flex items-center gap-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">
              {(profile.name || 'Y').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white/90">{profile.name || 'You'}</p>
              <p className="truncate text-[11px] text-white/35">{profile.email || 'no email'}</p>
            </div>
          </div>
          <div className="mb-5 h-px bg-white/[0.06] mx-4" />

          {filteredNav.map(({ group, items }) => (
            <div key={group} className="mb-4 px-2">
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">{group}</p>
              {items.map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setActive(id)}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition ${
                    active === id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80'
                  }`}>
                  <Icon size={14} className={active === id ? 'text-violet-400' : 'text-white/30'} />
                  {id}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Right content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-8">
          <h2 className="mb-6 font-heading text-2xl font-extrabold text-white/95">{active}</h2>

          {active === 'Account' && (
            <div className="space-y-4 max-w-xl">
              {/* Card 1 — Profile */}
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xl font-bold text-white">
                    {(profile.name || 'Y').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white/90">{profile.name || 'You'}</p>
                    <p className="text-sm text-white/40">{profile.email || 'no email on file'}</p>
                    <button className="mt-2 text-[12px] font-semibold text-violet-400 hover:text-violet-300 transition">Edit profile</button>
                  </div>
                </div>
              </div>

              {/* Card 2 — Session & account */}
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-sm font-bold text-white/90">Session &amp; account</p>
                <p className="mt-1 text-[12.5px] text-white/45">{profile.email || 'No email on file'}</p>
                <div className="mt-3 flex items-center gap-2 text-[11.5px] text-white/55">
                  <RoleBadge role={profile.role} />
                  <span className="text-white/22">·</span>
                  <span>Signed in with {authMethodLabel(authProvider)}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setConfirm('switch')}
                    className="rounded-[10px] border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-[12.5px] font-semibold text-white/85 transition hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
                  >
                    Switch account
                  </button>
                  <button
                    onClick={() => setConfirm('logout')}
                    className="rounded-[10px] border border-white/[0.14] bg-transparent px-3.5 py-2 text-[12.5px] font-semibold text-white/75 transition hover:border-white/[0.28] hover:bg-white/[0.04] hover:text-white"
                  >
                    Log out
                  </button>
                  {authProvider === 'email' && (
                    <button
                      onClick={onChangePassword}
                      className="ml-auto rounded-[10px] px-3 py-2 text-[12px] font-semibold text-violet-300 transition hover:bg-violet-500/[0.08] hover:text-violet-200"
                    >
                      Change password
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3 — Current plan */}
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white/90">Current Plan</p>
                    <p className="mt-0.5 text-sm text-white/40">Free — 200 messages / month</p>
                  </div>
                  <button onClick={goBilling}
                    className="rounded-[10px] bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-500">
                    Upgrade
                  </button>
                </div>
                <button onClick={goBilling}
                  className="mt-3 text-[12px] font-semibold text-violet-300 transition hover:text-violet-200">
                  Manage Billing &amp; Plans →
                </button>
              </div>

              {/* Card 4 — Danger zone */}
              <div className="rounded-[18px] border border-rose-500/15 bg-rose-500/[0.04] p-5">
                <p className="text-sm font-bold text-white/90">Danger zone</p>
                <p className="mt-1 text-[12px] text-white/45">
                  Delete your account and clear local app data on this device. Project data stored independently is not affected.
                </p>
                <button
                  onClick={() => { setDeleteText(''); setConfirm('delete'); }}
                  className="mt-4 rounded-[10px] border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-[12.5px] font-semibold text-rose-300 transition hover:border-rose-400/45 hover:bg-rose-500/15 hover:text-rose-200"
                >
                  Delete account
                </button>
              </div>
            </div>
          )}

          {active === 'Appearance' && (
            <div className="max-w-xl space-y-4">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="mb-4 text-sm font-bold text-white/90">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {([['light', Sun], ['dark', Moon], ['system', Monitor]] as [string, React.ElementType][]).map(([t, Ic]) => (
                    <button key={t} onClick={() => setTheme(t as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-2 rounded-[14px] border p-4 transition ${
                        theme === t ? 'border-violet-400/40 bg-violet-400/[0.07]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]'
                      }`}>
                      <Ic size={20} className={theme === t ? 'text-violet-400' : 'text-white/35'} />
                      <span className={`text-[13px] font-semibold capitalize ${theme === t ? 'text-white' : 'text-white/45'}`}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'Safety Mode' && (
            <div className="max-w-xl space-y-4">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/90">Safety Mode</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/40">AI Ant asks for approval before sending messages, editing files, publishing content, or running irreversible actions. Recommended for all production use.</p>
                  </div>
                  <SettingsToggle on={safetyMode} onToggle={() => setSafetyMode(!safetyMode)} />
                </div>
                {safetyMode ? (
                  <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5 text-[12px] text-emerald-300">
                    <ShieldCheck size={12} className="shrink-0" /> Safety Mode is ON — nothing runs without your approval.
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2.5 text-[12px] text-rose-300">
                    <AlertTriangle size={12} className="shrink-0" /> Safety Mode is OFF — agents may act without confirmation.
                  </div>
                )}
              </div>
            </div>
          )}

          {active === 'Plan' && (
            <div className="max-w-xl">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-sm font-bold text-white/90">Your plan</p>
                <p className="mt-1 text-sm text-white/40">Free — 200 messages / month</p>
                <button onClick={goBilling} className="mt-4 rounded-[10px] bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-500">
                  View all plans
                </button>
              </div>
            </div>
          )}

          {!['Account', 'Appearance', 'Safety Mode', 'Plan'].includes(active) && (
            <div className="max-w-xl rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-8 text-center">
              <Settings size={24} className="mx-auto mb-3 text-white/20" />
              <p className="text-sm text-white/35">{active} settings — calm defaults applied. Advanced controls will appear here.</p>
            </div>
          )}
        </main>
      </div>

      {confirm === 'switch' && (
        <ConfirmModal
          title="Switch account?"
          body="You will be signed out of this account and returned to the sign-in page."
          confirmLabel="Continue"
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      )}
      {confirm === 'logout' && (
        <ConfirmModal
          title="Log out of Colony?"
          body="You can sign back in at any time."
          confirmLabel="Log out"
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      )}
      {confirm === 'delete' && (
        <DeleteAccountModal
          deleteText={deleteText}
          setDeleteText={setDeleteText}
          onCancel={() => { setConfirm(null); setDeleteText(''); }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// ── Settings helpers ─────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role?: UserRole }) {
  const label = roleBadgeLabel(role);
  const tone =
    label === 'Admin'
      ? 'border-violet-400/30 bg-violet-500/12 text-violet-100'
      : label === 'Developer'
      ? 'border-sky-400/30 bg-sky-500/12 text-sky-100'
      : 'border-white/[0.12] bg-white/[0.05] text-white/70';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${tone}`}>
      {label}
    </span>
  );
}

export function authMethodLabel(provider: AuthProvider): string {
  if (provider === 'google') return 'Google';
  if (provider === 'development') return 'Development account';
  return 'Email';
}
