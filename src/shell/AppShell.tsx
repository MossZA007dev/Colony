import React, { useCallback, useEffect, useState } from 'react';
import { Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { AdminDashboard, AdminForbidden } from '../components/admin/AdminDashboard';
import { AntMark } from '../components/brand/BrandMarks';
import { AppDrawer } from '../components/drawer/AppDrawer';
import { KimiStyleSidebar } from '../components/sidebar/Sidebar';
import { BillingScreen } from '../pages/billing/BillingScreen';
import { SettingsScreen } from '../pages/settings/SettingsScreen';
import { ProjectsOSPage } from '../pages/projects/ProjectsOSPage';
import { BridgeOperatorPage } from '../pages/bridge/BridgeOperatorPage';
import { TeamsOSPage } from '../pages/teams/TeamsOSPage';
import { WorkflowsOSPage } from '../pages/workflows/WorkflowsOSPage';
import { DeliverablesOSPage } from '../pages/deliverables/DeliverablesOSPage';
import { ApprovalsOSPage } from '../pages/approvals/ApprovalsOSPage';
import { KnowledgeOSPage } from '../pages/knowledge/KnowledgeOSPage';
import { TemplatesCommunityPage } from '../pages/templates/TemplatesCommunityPage';
import { ConnectorsMarketplacePage } from '../pages/connectors/ConnectorsMarketplacePage';
import { canAccessAdminDashboard } from '../lib/auth/roles';
import { DEFAULT_USAGE_STATE } from '../lib/data/runSeedData';
import { CHAT_PROJECTS, getProjectIcon } from '../lib/data/chatSeedData';
import { INITIAL_CONNECTORS } from '../lib/data/connectorSeedData';
import { createBridgeSessionFromTask } from '../lib/bridge/bridgeIntake';
import { loadBridgeSessions, upsertBridgeSession, type BridgeSession } from '../lib/bridge/bridgeSessionStore';
import { resolveBackendUserId } from '../lib/profile/profileApi';
import {
  WS_CHATS_KEY,
  WS_PROJECTS_KEY,
  generateChatTitle,
  isEmptyDraftStandaloneChat,
  loadAppDeliverables,
  loadWorkspaceChats,
  loadWorkspaceProjects,
  saveAppDeliverables,
  SEED_WS_DELIVERABLES,
} from '../lib/workspace/workspaceApi';
import type { AppConnector, AppDeliverable, AppDrawerView, ChatProjectDef, NewProjectType, UserProfile, WorkspaceChat, WorkspaceDeliverableItem, WorkspaceMessage, WorkspaceProject } from '../lib/types/appTypes';
import type { Page } from '../types/navigation';
import type { UsageState } from '../lib/types/billingTypes';
import type { EnterpriseWorkspaceProject } from '../pages/one-man-enterprse/oneManEnterprise';
import { type WorkItemStatus, type WorkItemType } from '../lib/work/workItems';

const shellGlyph = {
  chart: '\uD83D\uDCCA',
  writer: '\u270D\uFE0F',
  folder: '\uD83D\uDCC1',
  board: '\uD83D\uDCCB',
};

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="card-hover flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white-07 bg-surface p-8 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-white-07 bg-surface2">
        <Sparkles className="h-8 w-8 text-muted" />
      </div>
      <h3 className="mb-2 font-heading text-2xl font-bold text-ink">{title}</h3>
      <p className="mx-auto max-w-md text-muted">{message}</p>
    </div>
  );
}

export function AppShell({ page, setPage, profile, onSignOut, onSwitchAccount, AIAntPageComponent, CreateAgentTeamComponent }: {
  page: Page;
  setPage: (page: Page) => void;
  profile: UserProfile;
  onSignOut: () => void | Promise<void>;
  onSwitchAccount: () => void | Promise<void>;
  AIAntPageComponent: React.ComponentType<any>;
  CreateAgentTeamComponent: React.ComponentType<any>;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<AppDrawerView | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState<ChatProjectDef[]>(CHAT_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState('daily-sales');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [bridgeSessions, setBridgeSessions] = useState<BridgeSession[]>(() => loadBridgeSessions());
  const [activeBridgeSessionId, setActiveBridgeSessionId] = useState<string | null>(null);
  const [activeWorkItemId, setActiveWorkItemId] = useState<string | null>(null);

  const refreshBridgeSessions = useCallback(() => {
    setBridgeSessions(loadBridgeSessions());
  }, []);

  const launchBridgeSession = useCallback((taskText: string, sourceConversationId?: string) => {
    const session = createBridgeSessionFromTask({ taskText, sourceConversationId });
    upsertBridgeSession(session);
    refreshBridgeSessions();
    setActiveBridgeSessionId(session.id);
    setActiveWorkItemId(`bridge-${session.id}`);
    setPage('Bridge');
    return session;
  }, [refreshBridgeSessions, setPage]);

  const handleBridgeSessionUpdate = useCallback((updated: BridgeSession) => {
    setBridgeSessions((prev) => {
      const without = prev.filter((s) => s.id !== updated.id);
      return [updated, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const openBridgeSession = useCallback((sessionId: string) => {
    setActiveBridgeSessionId(sessionId);
    setActiveWorkItemId(`bridge-${sessionId}`);
    setPage('Bridge');
  }, [setPage]);
  const [connectors, setConnectors] = useState<AppConnector[]>(INITIAL_CONNECTORS);
  const [safetyMode, setSafetyMode] = useState(true);
  const [usageState, setUsageState] = useState<UsageState>(DEFAULT_USAGE_STATE);

  // Colony workspace model — powers the ChatGPT/Kimi sidebar + AI Ant.
  const [wsProjects, setWsProjects] = useState<WorkspaceProject[]>(() => loadWorkspaceProjects());
  const [wsChats, setWsChats] = useState<WorkspaceChat[]>(() => loadWorkspaceChats());
  const [wsDeliverables] = useState<WorkspaceDeliverableItem[]>(SEED_WS_DELIVERABLES);
  const [activeWsChatId, setActiveWsChatId] = useState<string | null>(null);
  const [appDeliverables, setAppDeliverables] = useState<AppDeliverable[]>(() => loadAppDeliverables());

  const publishDeliverable = useCallback((d: AppDeliverable) => {
    setAppDeliverables((prev) => {
      const next = [d, ...prev.filter((x) => x.id !== d.id)].slice(0, 50);
      saveAppDeliverables(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(WS_CHATS_KEY, JSON.stringify(wsChats)); } catch { /* ignore */ }
  }, [wsChats]);

  useEffect(() => {
    try { localStorage.setItem(WS_PROJECTS_KEY, JSON.stringify(wsProjects)); } catch { /* ignore */ }
  }, [wsProjects]);

  const createWsChat = (projectId: string | null = null): string => {
    const id = `wsc-${Date.now()}`;
    const now = Date.now();
    setWsChats((prev) => [
      { id, projectId, title: 'New chat', mode: 'simple_chat', messages: [], workType: 'chat', workStatus: 'draft', createdAt: now, updatedAt: now },
      ...prev,
    ]);
    setActiveWsChatId(id);
    setActiveWorkItemId(id);
    setPage('AI Ant');
    return id;
  };

  const markWsChatWork = useCallback((id: string, workType: WorkItemType, workStatus?: WorkItemStatus) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, workType, workStatus, updatedAt: Date.now() } : chat));
    setActiveWorkItemId(id);
  }, []);

  const createFeatureWorkItem = useCallback((input: { type: Exclude<WorkItemType, 'chat' | 'bridge'>; title: string; status: WorkItemStatus; sourceConversationId?: string; sessionId?: string; replaceChatId?: string; enterpriseWorkspace?: EnterpriseWorkspaceProject }) => {
    const now = Date.now();
    const sessionId = input.sessionId ?? `${input.type}-${now}`;
    const id = input.replaceChatId ?? `wsc-${input.type}-${sessionId}`;
    setWsChats((prev) => {
      const withoutExisting = prev.filter((chat) => chat.id !== id && chat.sessionId !== sessionId);
      return [
        {
          id,
          projectId: null,
          title: input.title || 'Untitled work',
          mode: input.type === 'crew' ? 'ai_team_task' : input.type === 'automation' ? 'workflow_task' : 'one_man_enterprise',
          messages: [],
          workType: input.type,
          workStatus: input.status,
          sourceConversationId: input.sourceConversationId,
          sessionId,
          enterpriseWorkspace: input.enterpriseWorkspace,
          createdAt: now,
          updatedAt: now,
        },
        ...withoutExisting,
      ];
    });
    setActiveWsChatId(id);
    setActiveWorkItemId(id);
    setPage('AI Ant');
    return id;
  }, [setPage]);

  const updateWorkItem = useCallback((id: string, patch: Partial<Pick<WorkspaceChat, 'title' | 'workStatus' | 'sourceConversationId' | 'sessionId' | 'enterpriseWorkspace'>>) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, ...patch, updatedAt: Date.now() } : chat));
    setActiveWorkItemId(id);
  }, []);

  const discardDraftChat = useCallback((id: string) => {
    setWsChats((prev) => prev.filter((chat) => !(chat.id === id && isEmptyDraftStandaloneChat(chat))));
    setActiveWsChatId((current) => current === id ? null : current);
    setActiveWorkItemId((current) => current === id ? null : current);
  }, []);

  const updateWsChatMessages = useCallback((id: string, messages: WorkspaceMessage[]) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, messages, updatedAt: Date.now() } : chat));
  }, []);

  const autoTitleWsChat = useCallback((id: string, message: string) => {
    setWsChats((prev) => prev.map((chat) => {
      if (chat.id !== id || chat.userRenamed || chat.title !== 'New chat') return chat;
      return { ...chat, title: generateChatTitle(message), updatedAt: Date.now() };
    }));
  }, []);

  const renameWsChat = (id: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, title: nextTitle, userRenamed: true, updatedAt: Date.now() } : chat));
  };

  const togglePinWsChat = (id: string) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, isPinned: !chat.isPinned, updatedAt: Date.now() } : chat));
  };

  const archiveWsChat = (id: string) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, isArchived: true, updatedAt: Date.now() } : chat));
    if (activeWsChatId === id) createWsChat(null);
  };

  const deleteWsChat = (id: string) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    const nextChats = wsChats.filter((chat) => chat.id !== id);
    setWsChats(nextChats);
    if (activeWsChatId === id) {
      setActiveWsChatId(nextChats.find((chat) => !chat.isArchived)?.id ?? null);
      setPage('AI Ant');
    }
  };

  const renameWsProject = (id: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    setWsProjects((prev) => prev.map((project) => project.id === id ? { ...project, name: nextName, updatedAt: Date.now() } : project));
  };

  const archiveWsProject = (id: string) => {
    setWsProjects((prev) => prev.map((project) => project.id === id ? { ...project, isArchived: true, updatedAt: Date.now() } : project));
  };

  const deleteWsProject = (id: string) => {
    if (!window.confirm('Delete this project? Chats will stay in history but leave the project.')) return;
    setWsProjects((prev) => prev.filter((project) => project.id !== id));
    setWsChats((prev) => prev.map((chat) => chat.projectId === id ? { ...chat, projectId: null } : chat));
  };

  const deleteWsProjectRaw = (id: string) => {
    setWsProjects((prev) => prev.filter((project) => project.id !== id));
    setWsChats((prev) => prev.map((chat) => chat.projectId === id ? { ...chat, projectId: null } : chat));
  };

  const createWsProject = (name: string, goal: string, description?: string, projectType?: WorkspaceProject['type']): string => {
    const id = `wsp-${Date.now()}`;
    const now = Date.now();
    setWsProjects((prev) => [
      { id, name, goal, description, type: projectType ?? 'mixed', status: 'draft' as const, progress: 0, agentCount: 0, workflowCount: 0, taskCount: 0, deliverableCount: 0, approvalCount: 0, createdAt: now, updatedAt: now },
      ...prev,
    ]);
    return id;
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('theme-dark');
      root.classList.remove('theme-light', 'theme-system');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      root.classList.add('theme-system');
      root.classList.toggle('theme-dark', prefersDark);
      root.classList.toggle('theme-light', !prefersDark);
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.add('theme-light');
      root.classList.remove('theme-dark', 'theme-system');
    }
  }, [theme]);

  const onNewProject = (name: string, type: NewProjectType) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const id = `proj-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const projectMeta: Record<NewProjectType, { icon: string; description: string }> = {
      'Sales Analysis': { icon: shellGlyph.chart, description: 'Sales analysis workspace' },
      'Content Workflow': { icon: shellGlyph.writer, description: 'Research, scripts, captions, publishing' },
      'File Report': { icon: shellGlyph.folder, description: 'File summary and reporting workspace' },
      Custom: { icon: shellGlyph.board, description: 'Custom project workspace' },
    };
    const newProject: ChatProjectDef = {
      id,
      icon: projectMeta[type].icon,
      emoji: '📋',
      name,
      description: projectMeta[type].description,
      status: 'Draft',
      projectStatus: 'idle',
      channels: [
        { id: 'team-room', name: 'team-room', type: 'main' },
        { id: 'approvals', name: 'approvals', type: 'approval' },
        { id: 'reports', name: 'reports', type: 'report' },
      ],
      channelMessages: {
        'team-room': [
          { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: `"${name}" project is ready. Add agents to this workflow canvas to get started.`, timestamp: ts },
        ],
        approvals: [
          { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Approval channel is ready. Agent actions will wait here before anything is sent or exported.', timestamp: ts },
        ],
        reports: [
          { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Reports channel is ready. Generated summaries will appear here.', timestamp: ts },
        ],
      },
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(id);
    setPage('Create Agent Team');
  };

  const onRenameProject = (id: string, newName: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: newName } : p));
  };

  const onDeleteProject = (id: string) => {
    setProjects((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((p) => p.id !== id);
      if (activeProjectId === id) setActiveProjectId(next[0]?.id ?? '');
      return next;
    });
  };

  const onDuplicateProject = (id: string) => {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newId = `proj-copy-${Date.now()}`;
    const copy: ChatProjectDef = {
      ...src,
      id: newId,
      name: `${src.name} Copy`,
      projectStatus: 'idle',
      status: 'Draft',
      channelMessages: {
        'team-room': [
          { role: 'agent', sender: 'System', text: `"${src.name} Copy" created as a duplicate project.`, timestamp: ts },
        ],
      },
    };
    setProjects((prev) => [...prev, copy]);
    setActiveProjectId(newId);
    setPage('Create Agent Team');
  };

  const onUpdateProjectInstructions = (id: string, instructions: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, instructions } : p));
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  // Settings & Billing are standalone full-page routes — never nested in the
  // AI Ant workspace shell (no sidebar).
  if (page === 'Settings') {
    return (
      <SettingsScreen
        onBack={() => { setSettingsInitialTab(undefined); setPage('AI Ant'); }}
        profile={profile}
        safetyMode={safetyMode} setSafetyMode={setSafetyMode}
        theme={theme} setTheme={setTheme}
        goBilling={() => setPage('Billing')}
        onSignOut={onSignOut}
        onSwitchAccount={onSwitchAccount}
        onChangePassword={() => setPage('ForgotPassword')}
        initialActive={settingsInitialTab}
      />
    );
  }
  if (page === 'Billing') {
    return <BillingScreen onBack={() => setPage('AI Ant')} profile={profile} usageState={usageState} setUsageState={setUsageState} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-dmsans text-ink">
      <KimiStyleSidebar
        page={page}
        profile={profile}
        usageState={usageState}
        wsChats={wsChats}
        wsProjects={wsProjects}
        activeWsChatId={activeWsChatId}
        activeWorkItemId={activeWorkItemId}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNavigate={(target) => { setPage(target); setDrawerView(null); }}
        onNewChat={() => { createWsChat(null); setDrawerView(null); }}
        onOpenWsChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
        onRenameChat={renameWsChat}
        onTogglePinChat={togglePinWsChat}
        onArchiveChat={archiveWsChat}
        onDeleteChat={deleteWsChat}
        onRenameWsProject={renameWsProject}
        onArchiveWsProject={archiveWsProject}
        onDeleteWsProject={deleteWsProject}
        onNewWsProject={(name, goal) => { createWsProject(name, goal); setPage('Projects'); setDrawerView(null); }}
        onOpenSettings={(tab) => { setSettingsInitialTab(tab); setPage('Settings'); setDrawerView(null); }}
        onSignOut={onSignOut}
        bridgeSessions={bridgeSessions}
        activeBridgeSessionId={activeBridgeSessionId}
        onOpenBridgeSession={openBridgeSession}
      />
      <AppDrawer
        view={drawerView || (isMobileOpen ? 'more' : null)}
        onClose={() => { setDrawerView(null); setIsMobileOpen(false); }}
        page={page}
        setPage={setPage}
        wsChats={wsChats}
        wsProjects={wsProjects}
        activeWsChatId={activeWsChatId}
        onNewChat={() => createWsChat(null)}
        onNewWsProject={(name, goal) => { createWsProject(name, goal); }}
        onOpenWsChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
      />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="z-10 flex items-center justify-between border-b border-white-07 bg-surface p-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink"><AntMark tone="white" size={15} /></span>
            <span className="font-heading font-bold">Colony</span>
          </div>
          <button className="p-2 text-muted hover:text-ink" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Desktop top-right: active project + safety badge (hidden on pages with own topbar) */}
        <div className={`absolute right-6 top-4 z-20 items-center gap-3 ${page === 'AI Ant' || page === 'Bridge' ? 'hidden' : 'hidden md:flex'}`}>
          {page === 'Create Agent Team' && (
            <span className="rounded-full border border-white-07 bg-surface px-3 py-1.5 text-xs font-medium text-muted">
              {getProjectIcon(activeProject)} {activeProject.name}
            </span>
          )}
          <button
            onClick={() => setSafetyMode((v) => !v)}
            title={safetyMode ? 'Safety Mode ON — click to turn off' : 'Safety Mode OFF — click to enable'}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${
              safetyMode
                ? 'border-warning/20 bg-warning/10 text-warning'
                : 'border-red-400/30 bg-red-400/10 text-red-400'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Safety Mode: {safetyMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <main className="relative flex-1 overflow-y-auto">
          {page === 'AI Ant' && (
            <AIAntPageComponent
              setPage={setPage}
              safetyMode={safetyMode}
              currentUserId={resolveBackendUserId(profile)}
              activeChat={wsChats.find((chat) => chat.id === activeWsChatId) ?? null}
              onEnsureChat={() => activeWsChatId ?? createWsChat(null)}
              onPersistChatMessages={updateWsChatMessages}
              onAutoTitleChat={autoTitleWsChat}
              onPublishDeliverable={publishDeliverable}
              onLaunchBridgeSession={(taskText: string, sourceConversationId?: string) => {
                launchBridgeSession(taskText, sourceConversationId ?? activeWsChatId ?? undefined);
              }}
              onMarkChatWork={markWsChatWork}
              onCreateFeatureWorkItem={createFeatureWorkItem}
              onUpdateWorkItem={updateWorkItem}
              onDiscardDraftChat={discardDraftChat}
            />
          )}
          {page === 'Projects' && (
            <ProjectsOSPage
              setPage={setPage}
              wsProjects={wsProjects}
              createWsProject={createWsProject}
              renameWsProject={renameWsProject}
              archiveWsProject={archiveWsProject}
              deleteWsProject={deleteWsProjectRaw}
            />
          )}
          {page === 'Bridge' && (
            <BridgeOperatorPage
              session={bridgeSessions.find((s) => s.id === activeBridgeSessionId) ?? null}
              onBackToConversation={(conversationId) => {
                setActiveWsChatId(conversationId);
                setActiveWorkItemId(conversationId);
                setActiveBridgeSessionId(null);
                setPage('AI Ant');
              }}
              onSessionUpdate={handleBridgeSessionUpdate}
              onStartFromHome={() => { setActiveBridgeSessionId(null); setPage('AI Ant'); }}
            />
          )}
          {page === 'AI Teams' && <TeamsOSPage setPage={setPage} />}
          {page === 'Workflows' && <WorkflowsOSPage setPage={setPage} />}
          {page === 'Deliverables' && (
            <DeliverablesOSPage
              deliverables={appDeliverables}
              setDeliverables={setAppDeliverables}
              wsChats={wsChats}
              wsProjects={wsProjects}
              setPage={setPage}
              onOpenChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
            />
          )}
          {page === 'Approvals' && <ApprovalsOSPage />}
          {page === 'Knowledge' && <KnowledgeOSPage />}
          {page === 'Templates' && <TemplatesCommunityPage setPage={setPage} />}
          {page === 'Admin' && (
            canAccessAdminDashboard(profile)
              ? <AdminDashboard currentUserEmail={profile.email} onBack={() => setPage('AI Ant')} />
              : <AdminForbidden onBack={() => setPage('AI Ant')} />
          )}
          {page === 'Create Agent Team' && (
            <CreateAgentTeamComponent
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              projects={projects}
              onUpdateProjectInstructions={onUpdateProjectInstructions}
              connectors={connectors}
              safetyMode={safetyMode}
              setSafetyMode={setSafetyMode}
              usageState={usageState}
              setUsageState={setUsageState}
              setPage={setPage}
            />
          )}
          {page === 'Connectors' && <ConnectorsMarketplacePage />}
          {!['AI Ant', 'Bridge', 'Projects', 'AI Teams', 'Workflows', 'Deliverables', 'Approvals', 'Knowledge', 'Templates', 'Admin', 'Create Agent Team', 'Connectors', 'Billing', 'Settings'].includes(page) && (
            <div className="h-full p-6 md:p-12">
              <h2 className="mb-6 font-heading text-3xl font-extrabold">{page}</h2>
              <EmptyState
                title={`${page} coming soon`}
                message={`This feature lives inside each project in Colony. Open a project from the sidebar and access it from the canvas.`}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
