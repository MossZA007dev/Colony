import React, { useState } from 'react';
import { ClipboardCheck, CreditCard, FolderOpen, MessageSquarePlus, Plug, Settings, StickyNote, Users, Workflow, X } from 'lucide-react';
import type { Page } from '../../types/navigation';
import { WORK_STATUS_LABELS, WORK_TYPE_META, resolveChatWorkStatus, resolveWorkItemType } from '../../lib/workspace/workspaceApi';
import type { AppDrawerView, WorkspaceChat, WorkspaceProject } from '../../lib/types/appTypes';

export function AppDrawer({
  view, onClose, page, setPage, wsChats, wsProjects, activeWsChatId, onNewChat, onOpenWsChat, onNewWsProject,
}: {
  view: AppDrawerView | null;
  onClose: () => void;
  page: Page;
  setPage: (page: Page) => void;
  wsChats: WorkspaceChat[];
  wsProjects: WorkspaceProject[];
  activeWsChatId: string | null;
  onNewChat: () => void;
  onOpenWsChat: (id: string) => void;
  onNewWsProject: (name: string, goal: string) => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');

  if (!view) return null;

  const go = (target: Page) => {
    setPage(target);
    onClose();
  };
  const title = view === 'ai-ant' ? 'AI Ant' : view === 'projects' ? 'Projects' : 'More';
  const subtitle = view === 'ai-ant' ? 'Recent chats and command context' : view === 'projects' ? 'Goal workspaces' : 'Workspace navigation';
  const moreItems: Array<{ label: Page; icon: React.ElementType }> = [
    { label: 'AI Teams', icon: Users },
    { label: 'Workflows', icon: Workflow },
    { label: 'Knowledge', icon: StickyNote },
    { label: 'Approvals', icon: ClipboardCheck },
    { label: 'Connectors', icon: Plug },
    { label: 'Settings', icon: Settings },
    { label: 'Billing', icon: CreditCard },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] md:left-[72px]" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,292px)] flex-col border-r border-white/[0.09] bg-[#0a0f1d]/98 text-white shadow-[28px_0_80px_rgba(0,0,0,0.42)] backdrop-blur-xl md:left-[72px]">
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-4">
          <div>
            <p className="font-heading text-sm font-extrabold text-white/90">{title}</p>
            <p className="mt-0.5 text-[11px] text-white/35">{subtitle}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/40 transition hover:bg-white/[0.08] hover:text-white/75">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-3">
          {view === 'ai-ant' && (
            <div className="space-y-5">
              <button onClick={() => { onNewChat(); onClose(); }} className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#ffffff] px-3 py-2.5 text-sm font-bold text-[#070B14] transition hover:bg-[#f0f2ff]">
                <MessageSquarePlus className="h-4 w-4" /> New chat
              </button>
              <section>
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Recent chats</p>
                <div className="space-y-1">
                  {wsChats.slice(0, 10).map((chat) => {
                    const active = page === 'AI Ant' && activeWsChatId === chat.id;
                    const type = resolveWorkItemType(chat);
                    const meta = WORK_TYPE_META[type];
                    const Icon = meta.icon;
                    const status = resolveChatWorkStatus(chat);
                    return (
                      <button key={chat.id} onClick={() => { onOpenWsChat(chat.id); onClose(); }}
                        className={`flex w-full items-start gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] transition ${active ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/20' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'}`}>
                        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{chat.title}</span>
                          <span className={`mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-[0.06em] ${meta.tone}`}>
                            <span>{meta.label}</span>
                            {status && <><span className="opacity-40">·</span><span className="normal-case tracking-normal">{WORK_STATUS_LABELS[status]}</span></>}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="grid gap-2">
                {moreItems.slice(0, 4).map(({ label, icon: Icon }) => (
                  <button key={label} onClick={() => go(label)} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white/85">
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </section>
            </div>
          )}

          {view === 'projects' && (
            <div className="space-y-5">
              <section className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Create project</p>
                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" className="mb-2 w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25" />
                <input value={projectGoal} onChange={(e) => setProjectGoal(e.target.value)} placeholder="Goal" className="mb-3 w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25" />
                <button
                  onClick={() => {
                    const name = projectName.trim();
                    if (!name) return;
                    onNewWsProject(name, projectGoal.trim() || 'New Colony project');
                    setProjectName('');
                    setProjectGoal('');
                    go('Projects');
                  }}
                  className="w-full rounded-[10px] bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500"
                >
                  Create project
                </button>
              </section>
              <section>
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Your projects</p>
                <div className="space-y-1">
                  {wsProjects.map((project) => (
                    <button key={project.id} onClick={() => go('Projects')} className="flex w-full items-start gap-2.5 rounded-[10px] px-3 py-2 text-left transition hover:bg-white/[0.05]">
                      <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-white/38" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-white/75">{project.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-white/32">{project.goal}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === 'more' && (
            <div className="space-y-1">
              {moreItems.map(({ label, icon: Icon }) => (
                <button key={label} onClick={() => go(label)}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition ${page === label ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/20' : 'text-white/58 hover:bg-white/[0.05] hover:text-white/85'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

