import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Bot, Building2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, CreditCard, FileText, FolderOpen, FolderPlus, HelpCircle, Home, Laptop, Layers3, LogOut, MessageSquarePlus, MoreHorizontal, Network, Pin, Plug, Search, Settings, Sparkles, StickyNote, Sun, Terminal, User, Users, Workflow, X, Zap } from 'lucide-react';
import type { Page } from '../../types/navigation';
import { ColonyLogo } from '../brand/BrandMarks';
import { ContextMenu } from '../modals/ContextMenu';
import { AppModal } from '../modals/AppModal';
import { isAdminRole } from '../../lib/profile/profileApi';
import { WORK_STATUS_LABELS, WORK_TYPE_META, resolveChatWorkStatus, resolveWorkItemType } from '../../lib/workspace/workspaceApi';
import { getProjectIcon } from '../../lib/data/chatSeedData';
import type { BridgeSession } from '../../lib/bridge/bridgeSessionStore';
import type { ChatProjectDef, NewProjectType, UserProfile, WorkspaceChat, WorkspaceProject } from '../../lib/types/appTypes';
import type { UsageState } from '../../lib/types/billingTypes';

const menuGroups: Array<{ title: string; items: Array<{ label: Exclude<Page, 'Landing' | 'Login'>; icon: React.ElementType }> }> = [
  {
    title: 'WORKSPACE',
    items: [
      { label: 'AI Ant', icon: Bot },
      { label: 'Projects', icon: Home },
      { label: 'AI Teams', icon: Users },
      { label: 'Workflows', icon: Workflow },
      { label: 'Deliverables', icon: FileText },
    ],
  },
  {
    title: 'LIBRARY',
    items: [
      { label: 'Templates', icon: Layers3 },
      { label: 'Connectors', icon: Plug },
      { label: 'Knowledge', icon: StickyNote },
      { label: 'Approvals', icon: ClipboardCheck },
    ],
  },
];

const moreMenuItems: Array<{ label: Exclude<Page, 'Landing' | 'Login'>; icon: React.ElementType }> = [
  { label: 'Settings', icon: Settings },
  { label: 'Billing', icon: CreditCard },
];


export function Sidebar({
  page, setPage, isMobileOpen, setIsMobileOpen,
  activeProjectId, setActiveProjectId, projects, onNewProject,
  onRenameProject, onDeleteProject, onDuplicateProject, onUpdateProjectInstructions,
  profile, usageState, wsChats, wsProjects, activeWsChatId, onNewChat, onNewWsProject, onOpenWsChat,
}: {
  page: Page;
  setPage: (page: Page) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  projects: ChatProjectDef[];
  onNewProject: (name: string, type: NewProjectType) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onUpdateProjectInstructions: (id: string, instructions: string) => void;
  profile: UserProfile;
  usageState: UsageState;
  wsChats: WorkspaceChat[];
  wsProjects: WorkspaceProject[];
  activeWsChatId: string | null;
  onNewChat: () => void;
  onNewWsProject: (name: string, goal: string) => void;
  onOpenWsChat: (id: string) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [wsProjModal, setWsProjModal] = useState(false);
  const [wsProjName, setWsProjName] = useState('');
  const [wsProjGoal, setWsProjGoal] = useState('');
  const [newProjectInput, setNewProjectInput] = useState('');
  const [newProjectType, setNewProjectType] = useState<NewProjectType>('Custom');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);
  const [modal, setModal] = useState<
    | { type: 'rename'; projectId: string; currentName: string }
    | { type: 'instructions'; projectId: string; currentInstructions: string; projectName: string }
    | { type: 'confirm-delete'; projectId: string; projectName: string }
    | null
  >(null);

  const commitNewProject = () => {
    const name = newProjectInput.trim();
    if (name) onNewProject(name, newProjectType);
    setNewProjectInput('');
    setNewProjectType('Custom');
    setShowNewProjectInput(false);
  };

  const contextProject = contextMenu ? projects.find((p) => p.id === contextMenu.projectId) : null;

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[240px] transform flex-col border-r border-white-07 bg-surface transition-transform duration-300 md:relative md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between p-5">
          <button onClick={() => setPage('Landing')} className="flex items-center gap-2">
            <ColonyLogo size={32} />
            <span className="font-heading text-lg font-extrabold tracking-tight text-ink">Colony</span>
          </button>
          <button className="text-muted hover:text-ink md:hidden" onClick={() => setIsMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary actions */}
        <div className="mb-5 space-y-2 px-4">
          <button
            onClick={() => { onNewChat(); setIsMobileOpen(false); }}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-[#1a1a2e]"
          >
            <MessageSquarePlus className="h-4 w-4" /> New Chat
          </button>
          <button
            onClick={() => setWsProjModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-ink"
          >
            <FolderPlus className="h-4 w-4" /> New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">

          {/* Main nav groups */}
          <div className="space-y-5">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-subtle">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map(({ label, icon: Icon }) => {
                    const isActive = page === label;
                    return (
                      <button
                        key={label}
                        onClick={() => { setPage(label); setIsMobileOpen(false); }}
                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-accent/15 text-ink ring-1 ring-accent/20' : 'text-muted hover:bg-surface2 hover:text-ink'}`}
                      >
                        {isActive && <span className="absolute left-0 top-1/2 h-3/4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent" />}
                        <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : ''}`} />
                        {label === 'Templates' ? 'Template Community' : label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* More (collapsible) */}
          <div className="mt-5">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-subtle transition hover:text-ink"
            >
              More
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="space-y-0.5">
                {moreMenuItems.map(({ label, icon: Icon }) => {
                  const isActive = page === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { setPage(label); setIsMobileOpen(false); }}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-accent/15 text-ink ring-1 ring-accent/20' : 'text-muted hover:bg-surface2 hover:text-ink'}`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : ''}`} />
                      {label}
                    </button>
                  );
                })}
                {['Usage', 'Help', 'Keyboard shortcuts', 'Developer', 'System status'].map((m) => (
                  <button key={m} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted/70 transition hover:bg-surface2 hover:text-ink">
                    <HelpCircle className="h-4 w-4 opacity-60" />
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent chats */}
          {wsChats.length > 0 && (
            <div className="mt-6">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-subtle">Recent chats</p>
              <div className="space-y-0.5">
                {wsChats.slice(0, 8).map((c) => {
                  const isActive = page === 'AI Ant' && activeWsChatId === c.id;
                  const type = resolveWorkItemType(c);
                  const meta = WORK_TYPE_META[type];
                  const Icon = meta.icon;
                  const status = resolveChatWorkStatus(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onOpenWsChat(c.id); setIsMobileOpen(false); }}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-all duration-200 ${isActive ? 'bg-accent/15 font-medium text-ink ring-1 ring-accent/20' : 'font-normal text-muted hover:bg-surface2 hover:text-ink'}`}
                    >
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{c.title}</span>
                        <span className={`mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-[0.06em] ${meta.tone}`}>
                          <span>{meta.label}</span>
                          {status && <><span className="opacity-40">·</span><span className="normal-case tracking-normal">{WORK_STATUS_LABELS[status]}</span></>}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workspace projects */}
          {wsProjects.length > 0 && (
            <div className="mt-6">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-subtle">Your projects</p>
              <div className="space-y-0.5">
                {wsProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPage('Projects'); setIsMobileOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-normal text-muted transition-all duration-200 hover:bg-surface2 hover:text-ink"
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas projects — hidden from main sidebar; accessible via Workflows page */}
          <div className="hidden mt-6">
            <div className="mb-1.5 flex items-center justify-between px-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle">Advanced canvas</p>
              <button
                onClick={() => setShowNewProjectInput(true)}
                className="rounded p-0.5 text-subtle transition hover:bg-black/[0.05] hover:text-ink"
                title="New project"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6.5 1v11M1 6.5h11"/>
                </svg>
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => { setActiveProjectId(project.id); setPage('Projects'); setIsMobileOpen(false); }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
                    }}
                    className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${isActive ? 'bg-accent/15 font-medium text-ink ring-1 ring-accent/20' : 'font-normal text-muted hover:bg-surface2 hover:text-ink'}`}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 h-3/4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent" />}
                    <span className="text-sm">{getProjectIcon(project)}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{project.name}</span>
                    {project.instructions && (
                      <span className="shrink-0 text-[8px] text-accent/60" title="Project instructions active">●</span>
                    )}
                    {project.projectStatus === 'running' && (
                      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
                    )}
                    {project.projectStatus === 'waiting' && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}

              {/* Inline new-project input */}
              {showNewProjectInput && (
                <div className="space-y-2 px-1 py-1">
                  <input
                    autoFocus
                    value={newProjectInput}
                    onChange={(e) => setNewProjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNewProject();
                      if (e.key === 'Escape') { setNewProjectInput(''); setShowNewProjectInput(false); }
                    }}
                    placeholder="Project name…"
                    className="w-full rounded-lg border border-accent/30 bg-surface2 px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />
                  <select
                    value={newProjectType}
                    onChange={(event) => setNewProjectType(event.target.value as NewProjectType)}
                    className="w-full rounded-lg border border-white-07 bg-surface2 px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent/60"
                  >
                    <option>Sales Analysis</option>
                    <option>Content Workflow</option>
                    <option>File Report</option>
                    <option>Custom</option>
                  </select>
                  <div className="flex gap-1.5">
                    <button onClick={commitNewProject} className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-accent/85">
                      Create
                    </button>
                    <button onClick={() => { setNewProjectInput(''); setShowNewProjectInput(false); }} className="rounded-lg border border-white-07 px-2 py-1.5 text-[11px] font-bold text-muted transition hover:bg-surface2 hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowNewProjectInput(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium text-subtle transition hover:bg-surface2 hover:text-ink"
              >
                <span className="text-[10px]">＋</span> New Project
              </button>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="border-t border-white-07 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/20 text-[12px] font-bold uppercase text-accent">
              {(profile.name || 'Y').slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{profile.name || 'You'}</p>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const planColors: Record<string, string> = { free: 'text-white/40 bg-white/[0.07]', basic: 'text-[#4f9eff] bg-[#4f9eff]/15', pro: 'text-[#a78bfa] bg-[#7c5cfc]/15', max: 'text-[#f5c842] bg-[#f5c842]/15' };
                  return <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${planColors[usageState.currentPlan] ?? planColors.free}`}>{usageState.currentPlan}</span>;
                })()}
                {usageState.currentPlan !== 'max' && (
                  <button onClick={() => setPage('Billing')} className="text-[11px] text-muted transition hover:text-white/80">Upgrade</button>
                )}
              </div>
            </div>
            <button onClick={() => setPage('Settings')} title="Settings" className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-white/[0.06] hover:text-ink">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* New Project modal */}
      {wsProjModal && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" onClick={() => setWsProjModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-surface p-6 shadow-[var(--shadow-pop)]">
            <h3 className="mb-1 font-heading text-xl font-extrabold text-ink">New project</h3>
            <p className="mb-5 text-[13px] text-muted">A project keeps its chats, sources, AI teams, and deliverables together. Or just describe a goal to AI Ant.</p>
            <label className="mb-1 block text-[12px] font-semibold text-muted">Project name</label>
            <input
              autoFocus value={wsProjName} onChange={(e) => setWsProjName(e.target.value)}
              placeholder="e.g. Daily Sales Report"
              className="mb-3 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
            />
            <label className="mb-1 block text-[12px] font-semibold text-muted">Goal</label>
            <textarea
              value={wsProjGoal} onChange={(e) => setWsProjGoal(e.target.value)}
              placeholder="What should AI Ant accomplish in this project?"
              rows={3}
              className="mb-5 w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
            />
            <div className="flex gap-3">
              <button onClick={() => setWsProjModal(false)} className="flex-1 rounded-xl border border-white/[0.18] py-2.5 text-[13px] font-semibold text-muted transition hover:bg-white/[0.06]">Cancel</button>
              <button
                disabled={!wsProjName.trim()}
                onClick={() => {
                  onNewWsProject(wsProjName.trim(), wsProjGoal.trim());
                  setWsProjName(''); setWsProjGoal(''); setWsProjModal(false);
                  setPage('Projects');
                }}
                className="flex-1 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-white transition hover:bg-accent/85 disabled:opacity-50"
              >
                Create project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project context menu */}
      {contextMenu && contextProject && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Rename Project',
              icon: '✏️',
              onClick: () => setModal({ type: 'rename', projectId: contextMenu.projectId, currentName: contextProject.name }),
            },
            {
              label: 'Edit Instructions',
              icon: '📋',
              onClick: () => setModal({ type: 'instructions', projectId: contextMenu.projectId, currentInstructions: contextProject.instructions ?? '', projectName: contextProject.name }),
            },
            {
              label: 'Duplicate Project',
              icon: '⧉',
              onClick: () => onDuplicateProject(contextMenu.projectId),
            },
            { separator: true, label: '', onClick: () => {} },
            {
              label: 'Delete Project',
              icon: '🗑',
              danger: true,
              onClick: () => {
                if (projects.length <= 1) return;
                setModal({ type: 'confirm-delete', projectId: contextMenu.projectId, projectName: contextProject.name });
              },
            },
          ]}
        />
      )}

      {/* Project modals */}
      {modal?.type === 'rename' && (
        <AppModal
          type="rename"
          title="Rename Project"
          initialValue={modal.currentName}
          onSave={(name) => { onRenameProject(modal.projectId, name); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'instructions' && (
        <AppModal
          type="text-edit"
          title={`Instructions — ${modal.projectName}`}
          initialValue={modal.currentInstructions}
          placeholder="e.g. Always summarize in Thai. Focus on profit and cost warnings."
          helperText="These instructions apply to all AI agents inside this project."
          onSave={(text) => { onUpdateProjectInstructions(modal.projectId, text); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'confirm-delete' && (
        <AppModal
          type="confirm"
          title="Delete Project"
          message={`Delete "${modal.projectName}"? This will remove all channels and messages in this project. This action cannot be undone.`}
          confirmLabel="Delete Project"
          onConfirm={() => { onDeleteProject(modal.projectId); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}


export function KimiStyleSidebar({
  page, profile, usageState, wsChats, wsProjects, activeWsChatId, collapsed, setCollapsed,
  activeWorkItemId,
  onNavigate, onNewChat, onOpenWsChat, onRenameChat, onTogglePinChat, onArchiveChat, onDeleteChat,
  onRenameWsProject, onArchiveWsProject, onDeleteWsProject,
  onNewWsProject, onOpenSettings, onSignOut,
  bridgeSessions, activeBridgeSessionId, onOpenBridgeSession,
}: {
  page: Page;
  profile: UserProfile;
  usageState: UsageState;
  wsChats: WorkspaceChat[];
  wsProjects: WorkspaceProject[];
  activeWsChatId: string | null;
  activeWorkItemId: string | null;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNavigate: (page: Page) => void;
  onNewChat: () => void;
  onOpenWsChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onTogglePinChat: (id: string) => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameWsProject: (id: string, name: string) => void;
  onArchiveWsProject: (id: string) => void;
  onDeleteWsProject: (id: string) => void;
  onNewWsProject: (name: string, goal: string) => void;
  onOpenSettings: (tab?: string) => void;
  onSignOut: () => void | Promise<void>;
  bridgeSessions: BridgeSession[];
  activeBridgeSessionId: string | null;
  onOpenBridgeSession: (sessionId: string) => void;
}) {
  const [contextMenu, setContextMenu] = React.useState<
    | { type: 'chat'; id: string; x: number; y: number }
    | { type: 'project'; id: string; x: number; y: number }
    | null
  >(null);
  const [modal, setModal] = React.useState<
    | { type: 'rename-chat'; id: string; currentTitle: string }
    | { type: 'rename-project'; id: string; currentName: string }
    | { type: 'new-project' }
    | null
  >(null);
  const [projectsExpanded, setProjectsExpanded] = React.useState<boolean>(() => {
    try { return localStorage.getItem('colony.sidebar.projectsExpanded.v1') !== '0'; } catch { return true; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('colony.sidebar.projectsExpanded.v1', projectsExpanded ? '1' : '0'); } catch { /* ignore */ }
  }, [projectsExpanded]);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectGoal, setNewProjectGoal] = React.useState('');
  const accountTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const accountPopoverRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!accountOpen) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountPopoverRef.current?.contains(target)) return;
      if (accountTriggerRef.current?.contains(target)) return;
      setAccountOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountTriggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [accountOpen]);

  const openNewProject = () => {
    setNewProjectName('');
    setNewProjectGoal('');
    setModal({ type: 'new-project' });
  };

  const libraryItems: Array<{ label: string; icon: React.ElementType; page: Page }> = [
    { label: 'Template Community', icon: Layers3, page: 'Templates' },
    { label: 'Connectors', icon: Plug, page: 'Connectors' },
    { label: 'Knowledge', icon: StickyNote, page: 'Knowledge' },
  ];
  const planTone: Record<string, string> = {
    free: 'border-white/[0.10] bg-white/[0.04] text-white/45',
    basic: 'border-blue-400/25 bg-blue-400/10 text-blue-200',
    pro: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
    max: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  };
  const visibleChats = [...wsChats]
    .filter((chat) => !chat.isArchived)
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.updatedAt - a.updatedAt);
  const visibleProjects = wsProjects.filter((project) => !project.isArchived);
  const menuChat = contextMenu?.type === 'chat' ? wsChats.find((chat) => chat.id === contextMenu.id) : null;
  const menuProject = contextMenu?.type === 'project' ? wsProjects.find((project) => project.id === contextMenu.id) : null;

  return (
    <>
    <aside className={`z-40 hidden h-screen shrink-0 flex-col border-r border-white/[0.07] bg-[#070B14]/96 text-white shadow-[18px_0_70px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-[width] duration-300 md:flex ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      <div className="flex shrink-0 items-center justify-between px-3 py-3">
        <button onClick={() => onNavigate('Landing')} className={`flex min-w-0 items-center gap-2 rounded-[14px] px-2 py-2 transition hover:bg-white/[0.06] ${collapsed ? 'justify-center' : ''}`} title="Colony">
          <ColonyLogo size={28} />
          {!collapsed && <span className="font-heading text-base font-extrabold tracking-tight text-white/90">Colony</span>}
        </button>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-white/75" title="Collapse sidebar">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-white/75" title="Expand sidebar">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 pb-3">
        <button onClick={onNewChat}
          className={`flex w-full items-center justify-center gap-2 rounded-[14px] !bg-white px-3 py-2.5 text-sm font-bold !text-[#070B14] shadow-[0_0_28px_rgba(124,92,252,0.24)] transition hover:!bg-white/90 ${collapsed ? 'px-0' : ''}`}
          title="New Chat">
          <MessageSquarePlus className="h-4 w-4" />
          {!collapsed && <><span className="flex-1 text-left">New Chat</span><span className="rounded-md bg-black/[0.07] px-1.5 py-0.5 text-[10px] font-bold text-black/45">⌘K</span></>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              key="label-main"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/24"
            >Main</motion.p>
          )}
        </AnimatePresence>
        <nav className="space-y-0.5">
          <SidebarProjectsSection
            active={page === 'Projects'}
            collapsed={collapsed}
            expanded={projectsExpanded}
            onToggleExpanded={() => setProjectsExpanded((v) => !v)}
            onNavigateProjects={() => onNavigate('Projects')}
            onNewProject={openNewProject}
            order={0}
          />
          <SidebarNavButton
            key="Deliverables"
            label="Deliverables"
            Icon={FileText}
            active={page === 'Deliverables'}
            collapsed={collapsed}
            order={1}
            onClick={() => onNavigate('Deliverables')}
          />
          <SidebarNavButton
            key="Approvals"
            label="Approvals"
            Icon={ClipboardCheck}
            active={page === 'Approvals'}
            collapsed={collapsed}
            order={2}
            onClick={() => onNavigate('Approvals')}
          />
        </nav>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              key="label-library"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mb-1.5 mt-5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/24"
            >Library</motion.p>
          )}
        </AnimatePresence>
        <nav className="space-y-0.5">
          {libraryItems.map(({ label, icon: Icon, page: targetPage }, idx) => {
            const active = page === targetPage;
            return (
              <SidebarNavButton
                key={label}
                label={label}
                Icon={Icon}
                active={active}
                collapsed={collapsed}
                order={3 + idx}
                onClick={() => onNavigate(targetPage)}
              />
            );
          })}
        </nav>

        {isAdminRole(profile.role) && (
          <>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  key="label-internal"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-1.5 mt-5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/24"
                >Internal</motion.p>
              )}
            </AnimatePresence>
            <nav className="space-y-0.5">
              <SidebarNavButton
                label="Admin Dashboard"
                Icon={Terminal}
                active={page === 'Admin'}
                collapsed={collapsed}
                order={3 + libraryItems.length}
                onClick={() => onNavigate('Admin')}
              />
            </nav>
          </>
        )}

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="sidebar-lists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
            >
              <motion.section
                className="mt-5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/24">Your Projects</p>
                <motion.div
                  className="space-y-0.5"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.035 } } }}
                  initial="hidden"
                  animate="visible"
                >
                  {visibleProjects.slice(0, 4).map((project) => {
                    const selected = page === 'Projects';
                    return (
                      <motion.div
                        key={project.id}
                        variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="group relative"
                      >
                        <button onClick={() => onNavigate('Projects')} className={`flex w-full items-center gap-2 rounded-[10px] px-2 py-2 pr-8 text-left text-[12px] transition ${selected ? 'bg-violet-500/12 text-white ring-1 ring-violet-400/15' : 'text-white/42 hover:bg-white/[0.045] hover:text-white/75'}`}>
                          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{project.name}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenu({ type: 'project', id: project.id, x: rect.right - 180, y: rect.bottom + 6 });
                          }}
                          className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-white/28 opacity-0 transition hover:bg-white/[0.08] hover:text-white/75 group-hover:opacity-100"
                          title="Project options"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.section>

              <motion.section
                className="mt-5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              >
                <div className="mb-1.5 flex items-center justify-between px-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/24">Recent Work</p>
                  <button className="text-[11px] font-semibold text-violet-300/60 transition hover:text-violet-200">All</button>
                </div>
                {bridgeSessions.length > 0 && (
                  <div className="mb-2 space-y-0.5">
                    {bridgeSessions.slice(0, 6).map((session) => {
                      const active = activeWorkItemId === `bridge-${session.id}` || (page === 'Bridge' && activeBridgeSessionId === session.id);
                      const statusTone =
                        session.status === 'waiting_approval' ? 'text-amber-200/85'
                          : session.status === 'completed' ? 'text-emerald-200/75'
                            : session.status === 'failed' ? 'text-red-200/80'
                              : 'text-violet-200/80';
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => onOpenBridgeSession(session.id)}
                          className={`flex w-full items-start gap-2 rounded-[10px] px-2 py-2 text-left text-[12px] transition-colors ${active ? 'bg-violet-500/[0.12] text-white ring-1 ring-violet-400/20' : 'text-white/55 hover:bg-white/[0.045] hover:text-white/85'}`}
                        >
                          <Network className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300/85" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium">{session.title}</span>
                            <span className={`mt-0.5 block truncate text-[10.5px] ${statusTone}`}>
                              <span className="font-semibold uppercase tracking-[0.06em]">Bridge</span>
                              <span className="mx-1 opacity-40">·</span>
                              {session.status === 'waiting_approval' ? 'Approval required'
                                : session.status === 'completed' ? 'Completed'
                                  : session.status === 'failed' ? 'Interrupted'
                                    : session.status === 'paused' ? 'Paused'
                                      : 'Running'}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {(() => {
                  const recent = visibleChats.slice(0, 12);
                  const pinnedChats = recent.filter((chat) => chat.isPinned);
                  const unpinnedChats = recent.filter((chat) => !chat.isPinned).slice(0, 8);

                  const renderChatRow = (chat: WorkspaceChat) => {
                    const active = activeWorkItemId === chat.id || (page === 'AI Ant' && activeWsChatId === chat.id);
                    const type = resolveWorkItemType(chat);
                    const meta = WORK_TYPE_META[type];
                    const Icon = meta.icon;
                    const status = resolveChatWorkStatus(chat);
                    return (
                      <motion.div
                        key={chat.id}
                        layout="position"
                        variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                        exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], layout: { type: 'spring', stiffness: 480, damping: 36, mass: 0.7 } }}
                        className="group relative"
                      >
                        <button onClick={() => onOpenWsChat(chat.id)}
                          className={`flex w-full items-start gap-2 rounded-[10px] px-2 py-2 pr-14 text-left text-[12px] transition-colors ${active ? 'bg-white/[0.075] text-white' : 'text-white/42 hover:bg-white/[0.045] hover:text-white/75'}`}>
                          <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium">{chat.title}</span>
                            <span className={`mt-0.5 flex min-w-0 items-center gap-1 truncate text-[10.5px] font-semibold uppercase tracking-[0.06em] ${meta.tone}`}>
                              <span>{meta.label}</span>
                              {status && (
                                <>
                                  <span className="opacity-40">·</span>
                                  <span className="normal-case tracking-normal">{WORK_STATUS_LABELS[status]}</span>
                                </>
                              )}
                            </span>
                          </span>
                        </button>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); onTogglePinChat(chat.id); }}
                          whileTap={{ scale: 0.85 }}
                          aria-label={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
                          title={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
                          className={`absolute right-8 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] transition ${
                            chat.isPinned
                              ? 'text-violet-300/85 hover:bg-violet-500/12 hover:text-violet-100'
                              : 'text-white/28 opacity-0 hover:bg-white/[0.08] hover:text-white/75 group-hover:opacity-100'
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {chat.isPinned ? (
                              <motion.span
                                key="pinned"
                                initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="grid place-items-center"
                              >
                                <Pin className="h-3.5 w-3.5 fill-current" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="unpinned"
                                initial={{ opacity: 0, rotate: 35, scale: 0.7 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: -35, scale: 0.7 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="grid place-items-center"
                              >
                                <Pin className="h-3.5 w-3.5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenu({ type: 'chat', id: chat.id, x: rect.right - 180, y: rect.bottom + 6 });
                          }}
                          className={`absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-white/28 transition hover:bg-white/[0.08] hover:text-white/75 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          title="Chat options"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  };

                  return (
                    <motion.div
                      layout
                      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2"
                    >
                      <AnimatePresence initial={false}>
                        {pinnedChats.length > 0 && (
                          <motion.div
                            key="pinned-group"
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <motion.p
                              layout="position"
                              className="mb-1 flex items-center gap-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-200/55"
                            >
                              <Pin className="h-2.5 w-2.5 fill-current" />
                              Pinned
                            </motion.p>
                            <div className="space-y-0.5">
                              <AnimatePresence initial={false}>
                                {pinnedChats.map(renderChatRow)}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div layout="position" className="space-y-0.5">
                        {pinnedChats.length > 0 && (
                          <motion.p
                            layout="position"
                            className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/24"
                          >Recent</motion.p>
                        )}
                        <AnimatePresence initial={false}>
                          {unpinnedChats.map(renderChatRow)}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative shrink-0 border-t border-white/[0.07] p-3">
        <button className={`mb-2 flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-[12px] text-white/42 transition hover:bg-white/[0.05] hover:text-white/75 ${collapsed ? 'justify-center' : ''}`} title="Get Desktop App">
          <Laptop className="h-4 w-4" />
          {!collapsed && <span>Get Desktop App</span>}
        </button>
        <button
          ref={accountTriggerRef}
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label={`Account menu for ${profile.name}`}
          className={`flex w-full items-center gap-2 rounded-[12px] border p-2 text-left transition-colors duration-150 ease-out hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40 motion-reduce:transition-none ${
            accountOpen ? 'border-white/[0.14] bg-white/[0.05]' : 'border-white/[0.08] bg-white/[0.035]'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-violet-500/18 text-xs font-bold text-violet-100">
            {profile.name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-bold text-white/82">{profile.name}</span>
                <span className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${planTone[usageState.currentPlan] ?? planTone.free}`}>
                  {usageState.currentPlan}
                </span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-white/35 transition-transform duration-200 ease-out motion-reduce:transition-none ${accountOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>
        <AnimatePresence>
          {accountOpen && (
            <SidebarAccountPopover
              ref={accountPopoverRef}
              profile={profile}
              usageState={usageState}
              currentPage={page}
              collapsed={collapsed}
              onClose={() => setAccountOpen(false)}
              onNavigate={onNavigate}
              onOpenSettings={onOpenSettings}
              onSignOut={onSignOut}
            />
          )}
        </AnimatePresence>
      </div>
    </aside>
    {contextMenu?.type === 'chat' && menuChat && (
      <ContextMenu
        dark
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(null)}
        items={[
          { label: 'Share', icon: '↗', onClick: () => {} },
          { label: 'Rename', icon: '✎', onClick: () => setModal({ type: 'rename-chat', id: menuChat.id, currentTitle: menuChat.title }) },
          { label: 'Move to project', icon: '▣', onClick: () => {} },
          { label: menuChat.isPinned ? 'Unpin chat' : 'Pin chat', icon: '⌖', onClick: () => onTogglePinChat(menuChat.id) },
          { label: 'Archive', icon: '◴', onClick: () => onArchiveChat(menuChat.id) },
          { separator: true, label: '', onClick: () => {} },
          { label: 'Delete', icon: '×', danger: true, onClick: () => onDeleteChat(menuChat.id) },
        ]}
      />
    )}
    {contextMenu?.type === 'project' && menuProject && (
      <ContextMenu
        dark
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(null)}
        items={[
          { label: 'Open project', icon: '↗', onClick: () => onNavigate('Projects') },
          { label: 'Rename', icon: '✎', onClick: () => setModal({ type: 'rename-project', id: menuProject.id, currentName: menuProject.name }) },
          { label: 'Archive project', icon: '◴', onClick: () => onArchiveWsProject(menuProject.id) },
          { separator: true, label: '', onClick: () => {} },
          { label: 'Delete project', icon: '×', danger: true, onClick: () => onDeleteWsProject(menuProject.id) },
        ]}
      />
    )}
    {modal?.type === 'rename-chat' && (
      <AppModal
        type="rename"
        title="Rename Chat"
        initialValue={modal.currentTitle}
        onSave={(title) => { onRenameChat(modal.id, title); setModal(null); }}
        onCancel={() => setModal(null)}
      />
    )}
    {modal?.type === 'rename-project' && (
      <AppModal
        type="rename"
        title="Rename Project"
        initialValue={modal.currentName}
        onSave={(name) => { onRenameWsProject(modal.id, name); setModal(null); }}
        onCancel={() => setModal(null)}
      />
    )}
    {modal?.type === 'new-project' && (
      <div className="fixed inset-0 z-[140] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" onClick={() => setModal(null)}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c111c] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <h3 className="mb-1 font-heading text-xl font-extrabold">New project</h3>
          <p className="mb-5 text-[13px] text-white/45">A project keeps its chats, sources, AI teams, and deliverables together.</p>
          <label className="mb-1 block text-[12px] font-semibold text-white/55">Project name</label>
          <input
            autoFocus
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="e.g. Daily Sales Report"
            className="mb-3 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/40"
          />
          <label className="mb-1 block text-[12px] font-semibold text-white/55">Goal (optional)</label>
          <textarea
            value={newProjectGoal}
            onChange={(e) => setNewProjectGoal(e.target.value)}
            placeholder="What should AI Ant accomplish in this project?"
            rows={3}
            className="mb-5 w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/40"
          />
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-white/[0.18] py-2.5 text-[13px] font-semibold text-white/60 transition hover:bg-white/[0.06]">Cancel</button>
            <button
              disabled={!newProjectName.trim()}
              onClick={() => {
                const name = newProjectName.trim();
                if (!name) return;
                onNewWsProject(name, newProjectGoal.trim());
                setNewProjectName('');
                setNewProjectGoal('');
                setModal(null);
              }}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              Create project
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export function SidebarNavButton({
  label, Icon, active, collapsed, order, onClick,
}: {
  label: string;
  Icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  order: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={collapsed ? label : undefined}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.02 * order }}
      whileHover={{ x: collapsed ? 0 : 2 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2 text-[13px] font-medium transition-colors ${
        active ? 'bg-violet-500/16 text-white ring-1 ring-violet-400/20' : 'text-white/48 hover:bg-white/[0.055] hover:text-white/85'
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-rail"
          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-violet-400"
          transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.6 }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1 truncate text-left"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {collapsed && (
        <span className="pointer-events-none absolute left-[54px] z-50 hidden whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#111827] px-2 py-1 text-xs text-white/80 shadow-xl group-hover:block">{label}</span>
      )}
    </motion.button>
  );
}

export function SidebarProjectsSection({
  active,
  collapsed,
  expanded,
  onToggleExpanded,
  onNavigateProjects,
  onNewProject,
  order,
}: {
  active: boolean;
  collapsed: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onNavigateProjects: () => void;
  onNewProject: () => void;
  order: number;
}) {
  if (collapsed) {
    return (
      <SidebarNavButton
        label="Projects"
        Icon={FolderOpen}
        active={active}
        collapsed={collapsed}
        order={order}
        onClick={onNavigateProjects}
      />
    );
  }
  return (
    <div className="group/projects relative">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.02 * order }}
        className={`relative flex h-9 w-full items-center gap-2.5 rounded-[10px] pl-2 pr-1 text-[13px] font-medium transition-colors ${
          active ? 'bg-violet-500/16 text-white ring-1 ring-violet-400/20' : 'text-white/48 hover:bg-white/[0.055] hover:text-white/85'
        }`}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active-rail"
            className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-violet-400"
            transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.6 }}
          />
        )}
        <button
          type="button"
          onClick={onNavigateProjects}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[8px] text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40"
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Projects</span>
        </button>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={expanded ? 'Collapse projects menu' : 'Expand projects menu'}
          aria-expanded={expanded}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      </motion.div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="projects-children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-[14px] mt-1 space-y-0.5 border-l border-white/[0.06] pl-2.5">
              <button
                type="button"
                onClick={onNavigateProjects}
                className={`flex h-7 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[12px] transition-colors ${
                  active ? 'text-white/85' : 'text-white/45 hover:bg-white/[0.045] hover:text-white/80'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">All projects</span>
              </button>
              <button
                type="button"
                onClick={onNewProject}
                className="group/new flex h-7 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[12px] text-white/70 transition-colors hover:bg-violet-500/10 hover:text-white"
              >
                <FolderPlus className="h-3.5 w-3.5 shrink-0 text-violet-300/80 group-hover/new:text-violet-200" />
                <span className="truncate">New project</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const SidebarAccountPopover = React.forwardRef<HTMLDivElement, {
  profile: UserProfile;
  usageState: UsageState;
  currentPage: Page;
  collapsed: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onOpenSettings: (tab?: string) => void;
  onSignOut: () => void | Promise<void>;
}>(function SidebarAccountPopover({ profile, usageState, currentPage, collapsed, onClose, onNavigate, onOpenSettings, onSignOut }, ref) {
  const planLabel = usageState.currentPlan.charAt(0).toUpperCase() + usageState.currentPlan.slice(1);
  const planTone: Record<string, string> = {
    free: 'border-white/[0.10] bg-white/[0.04] text-white/55',
    basic: 'border-blue-400/25 bg-blue-400/10 text-blue-200',
    pro: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
    max: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  };
  const handle = (fn: () => void) => () => { onClose(); fn(); };
  const items: Array<{
    label: string;
    icon: React.ElementType;
    onSelect?: () => void;
    active?: boolean;
    disabled?: boolean;
    badge?: string;
    danger?: boolean;
    tone?: 'accent';
  }> = [
    { label: 'Upgrade plan', icon: Sparkles, tone: 'accent', onSelect: handle(() => onNavigate('Billing')) },
    { label: 'Personalization', icon: Sun, onSelect: handle(() => onOpenSettings('Appearance')) },
    { label: 'Profile', icon: User, active: currentPage === 'Settings', onSelect: handle(() => onOpenSettings('Account')) },
    { label: 'Settings', icon: Settings, onSelect: handle(() => onOpenSettings()) },
    { label: 'Help', icon: HelpCircle, disabled: true, badge: 'Soon' },
    { label: 'Log out', icon: LogOut, danger: true, onSelect: async () => { onClose(); await onSignOut(); } },
  ];
  const primary = items.slice(0, 4);
  const secondary = items.slice(4);
  const containerWidth = collapsed ? 'w-[260px] left-3' : 'left-3 right-3';
  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label="Account menu"
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.985 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: 'bottom left' }}
      className={`absolute bottom-[calc(100%+6px)] z-50 rounded-[14px] border border-white/[0.08] bg-[#0c111c]/97 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl motion-reduce:transition-none ${containerWidth}`}
    >
      <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-violet-500/20 text-sm font-bold text-violet-100">
          {profile.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-white/88">{profile.name}</span>
          <span className={`mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${planTone[usageState.currentPlan] ?? planTone.free}`}>
            {planLabel}
          </span>
        </span>
      </div>
      <div className="my-1 h-px bg-white/[0.05]" />
      <ul className="flex flex-col">
        {primary.map((item) => (
          <li key={item.label}>
            <AccountMenuRow item={item} />
          </li>
        ))}
      </ul>
      <div className="my-1 h-px bg-white/[0.05]" />
      <ul className="flex flex-col">
        {secondary.map((item) => (
          <li key={item.label}>
            <AccountMenuRow item={item} />
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export function AccountMenuRow({ item }: {
  item: {
    label: string;
    icon: React.ElementType;
    onSelect?: () => void;
    active?: boolean;
    disabled?: boolean;
    badge?: string;
    danger?: boolean;
    tone?: 'accent';
  };
}) {
  const Icon = item.icon;
  const base = 'group/row flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2 text-left text-[12.5px] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40 motion-reduce:transition-none';
  const stateClass = item.disabled
    ? 'cursor-not-allowed text-white/30'
    : item.active
      ? 'bg-violet-500/12 text-white/95 ring-1 ring-violet-400/15'
      : item.danger
        ? 'text-white/70 hover:bg-red-400/10 hover:text-red-200'
        : 'text-white/72 hover:bg-white/[0.05] hover:text-white';
  const iconClass = item.disabled
    ? 'text-white/25'
    : item.tone === 'accent'
      ? 'text-violet-300 group-hover/row:text-violet-200'
      : item.danger
        ? 'text-white/45 group-hover/row:text-red-200'
        : item.active
          ? 'text-violet-200'
          : 'text-white/45 group-hover/row:text-white/80';
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={item.onSelect}
      aria-label={item.label}
      className={`${base} ${stateClass}`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
          {item.badge}
        </span>
      )}
    </button>
  );
}

