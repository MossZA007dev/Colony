import React, { useState } from 'react';
import { Search, Plus, X, MoreHorizontal, FolderOpen, Users, Workflow, Layers3, FileText, ShieldCheck } from 'lucide-react';
import type { Page } from '../../types/navigation';
import type { WorkspaceProject } from '../../App';

const PROJ_TYPE_META: Record<string, { label: string; tone: string }> = {
  crew:       { label: 'Colony Crew', tone: 'border-blue-400/30 bg-blue-400/[0.08] text-blue-300' },
  enterprise: { label: 'Enterprise',  tone: 'border-violet-400/30 bg-violet-400/[0.08] text-violet-300' },
  workflow:   { label: 'Workflow',    tone: 'border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-300' },
  mixed:      { label: 'Mixed',       tone: 'border-white/15 bg-white/[0.05] text-white/55' },
};

const PROJ_STATUS_META: Record<string, { label: string; tone: string }> = {
  draft:          { label: 'Draft',          tone: 'border-white/12 bg-white/[0.04] text-white/38' },
  running:        { label: 'Running',        tone: 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300' },
  waiting:        { label: 'Waiting',        tone: 'border-amber-400/30 bg-amber-400/[0.08] text-amber-300' },
  completed:      { label: 'Completed',      tone: 'border-sky-400/30 bg-sky-400/[0.08] text-sky-300' },
  paused:         { label: 'Paused',         tone: 'border-white/15 bg-white/[0.05] text-white/42' },
  needs_approval: { label: 'Needs approval', tone: 'border-rose-400/30 bg-rose-400/[0.08] text-rose-300' },
};

export function ProjectsOSPage({
  setPage,
  wsProjects,
  createWsProject,
  renameWsProject,
  archiveWsProject,
  deleteWsProject,
}: {
  setPage: (page: Page) => void;
  wsProjects: WorkspaceProject[];
  createWsProject: (name: string, goal: string, description?: string, projectType?: WorkspaceProject['type']) => string;
  renameWsProject: (id: string, name: string) => void;
  archiveWsProject: (id: string) => void;
  deleteWsProject: (id: string) => void;
}) {
  type ProjectFilter = 'all' | 'running' | 'needs_approval' | 'workflow' | 'enterprise' | 'crew' | 'completed' | 'draft';
  type ProjectSort = 'updated' | 'created' | 'status' | 'progress';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [sort, setSort] = useState<ProjectSort>('updated');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newType, setNewType] = useState<WorkspaceProject['type']>('mixed');

  const activeProjects = wsProjects.filter(p => !p.isArchived && p.status !== 'completed');
  const pendingApprovals = wsProjects.reduce((s, p) => s + (p.approvalCount ?? 0), 0);
  const totalDeliverables = wsProjects.reduce((s, p) => s + (p.deliverableCount ?? 0), 0);
  const activeWorkflows = wsProjects.filter(p => !p.isArchived && (p.type === 'workflow' || p.type === 'mixed') && (p.workflowCount ?? 0) > 0).length;
  const runningTasks = wsProjects.filter(p => p.status === 'running').reduce((s, p) => s + (p.taskCount ?? 0), 0);

  const visible = wsProjects
    .filter(p => !p.isArchived)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.goal ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    })
    .filter(p => {
      const st = p.status ?? 'draft';
      const ty = p.type ?? 'mixed';
      switch (filter) {
        case 'running':        return st === 'running';
        case 'needs_approval': return st === 'needs_approval';
        case 'workflow':       return ty === 'workflow';
        case 'enterprise':     return ty === 'enterprise';
        case 'crew':           return ty === 'crew';
        case 'completed':      return st === 'completed';
        case 'draft':          return st === 'draft';
        default:               return true;
      }
    })
    .sort((a, b) => {
      if (sort === 'updated')  return b.updatedAt - a.updatedAt;
      if (sort === 'created')  return b.createdAt - a.createdAt;
      if (sort === 'status')   return (a.status ?? 'draft').localeCompare(b.status ?? 'draft');
      if (sort === 'progress') return (b.progress ?? 0) - (a.progress ?? 0);
      return 0;
    });

  const detailProject = wsProjects.find(p => p.id === detailsId) ?? null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWsProject(newName.trim(), newGoal.trim() || 'Define your goal.', undefined, newType);
    setShowNewModal(false);
    setNewName(''); setNewGoal(''); setNewType('mixed');
  };

  const handleRename = () => {
    if (renameId && renameValue.trim()) renameWsProject(renameId, renameValue.trim());
    setRenameId(null); setRenameValue('');
  };

  const handleDelete = (id: string) => {
    deleteWsProject(id);
    setDeleteConfirmId(null);
    if (detailsId === id) setDetailsId(null);
  };

  const FILTERS: Array<{ id: ProjectFilter; label: string }> = [
    { id: 'all',           label: 'All' },
    { id: 'running',       label: 'Running' },
    { id: 'needs_approval',label: 'Needs approval' },
    { id: 'workflow',      label: 'Workflows' },
    { id: 'enterprise',    label: 'Enterprise' },
    { id: 'crew',          label: 'AI Teams' },
    { id: 'completed',     label: 'Completed' },
    { id: 'draft',         label: 'Draft' },
  ];

  return (
    <div className="relative min-h-full bg-[#070B14] text-white" onClick={() => setMenuId(null)}>
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/60">Goal workspaces</p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-white">Projects</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              Goal-based workspaces for AI teams, workflows, approvals, knowledge, and deliverables.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage('AI Ant')}
              className="rounded-[12px] border border-white/[0.10] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white/80"
            >
              Start with AI Ant
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 rounded-[12px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {[
            { label: 'Active projects',  value: String(activeProjects.length),  detail: 'Goal-based workspaces' },
            { label: 'Running tasks',    value: String(runningTasks),            detail: 'Across AI teams' },
            { label: 'Pending approvals',value: String(pendingApprovals),        detail: 'Review before AI acts' },
            { label: 'Deliverables',     value: String(totalDeliverables),       detail: 'Ready or in progress' },
            { label: 'Active workflows', value: String(activeWorkflows),         detail: 'Repeating processes' },
          ].map(item => (
            <div key={item.label} className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
              <p className="mt-1 truncate text-xs text-white/38">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, workflows, agents, or deliverables…"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 transition hover:text-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as ProjectSort)}
            className="rounded-[10px] border border-white/[0.09] bg-[#070B14] px-3 py-2.5 text-xs font-semibold text-white/55 outline-none transition hover:border-white/15 hover:text-white/75"
          >
            <option value="updated">Last updated</option>
            <option value="created">Created date</option>
            <option value="status">Status</option>
            <option value="progress">Most active</option>
          </select>
        </div>

        {/* Filter pills */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? 'bg-violet-600 text-white'
                  : 'border border-white/[0.09] bg-white/[0.03] text-white/48 hover:border-white/15 hover:text-white/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/[0.07] bg-white/[0.02] py-20 text-center">
            <FolderOpen className="mb-4 h-10 w-10 text-white/15" />
            <h3 className="font-heading text-lg font-bold text-white/50">
              {search || filter !== 'all' ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/30">
              {search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Start with AI Ant and describe what you want to accomplish. Colony will create a project, crew, or workflow when needed.'}
            </p>
            {!search && filter === 'all' && (
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setPage('AI Ant')}
                  className="rounded-[10px] bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500"
                >
                  Start with AI Ant
                </button>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="rounded-[10px] border border-white/[0.10] px-4 py-2 text-sm font-semibold text-white/50 transition hover:text-white/80"
                >
                  Create project manually
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Project cards grid */
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(p => {
              const typeMeta   = PROJ_TYPE_META[p.type ?? 'mixed'];
              const statusMeta = PROJ_STATUS_META[p.status ?? 'draft'];
              const isMenuOpen = menuId === p.id;
              const primaryLabel =
                p.status === 'needs_approval' ? 'Review approval' :
                p.status === 'paused' || p.status === 'waiting' ? 'Resume' : 'Open';

              return (
                <div
                  key={p.id}
                  className="relative rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:border-white/[0.11]"
                >
                  {/* Three-dot menu */}
                  <button
                    onClick={e => { e.stopPropagation(); setMenuId(isMenuOpen ? null : p.id); }}
                    className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-[8px] text-white/25 transition hover:bg-white/[0.07] hover:text-white/60"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isMenuOpen && (
                    <div
                      className="absolute right-4 top-12 z-30 min-w-[160px] overflow-hidden rounded-[14px] border border-white/[0.10] bg-[#0E1420] shadow-2xl"
                      onClick={e => e.stopPropagation()}
                    >
                      {([
                        { label: 'Rename',  onClick: () => { setRenameId(p.id); setRenameValue(p.name); setMenuId(null); } },
                        { label: 'Archive', onClick: () => { archiveWsProject(p.id); setMenuId(null); }, danger: false },
                        { label: 'Delete',  onClick: () => { setDeleteConfirmId(p.id); setMenuId(null); }, danger: true },
                      ] as Array<{ label: string; onClick: () => void; danger?: boolean }>).map(action => (
                        <button
                          key={action.label}
                          onClick={action.onClick}
                          className={`flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-white/[0.05] ${action.danger ? 'text-rose-300/80 hover:text-rose-200' : 'text-white/60 hover:text-white/85'}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Type + Status badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 pr-8">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeMeta.tone}`}>{typeMeta.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta.tone}`}>{statusMeta.label}</span>
                  </div>

                  {/* Name + goal */}
                  <h3 className="font-heading text-base font-bold text-white">{p.name}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/45">{p.goal}</p>

                  {/* Progress bar */}
                  {p.progress !== undefined && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Progress</span>
                        <span className="text-[11px] font-bold text-white/40">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={`h-full rounded-full ${
                            p.status === 'running'        ? 'bg-emerald-400' :
                            p.status === 'needs_approval' ? 'bg-rose-400'    :
                            p.status === 'completed'      ? 'bg-sky-400'     : 'bg-violet-400'
                          }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Counts */}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                    {([
                      { label: 'agents',      value: p.agentCount,      Icon: Users    },
                      { label: 'workflows',   value: p.workflowCount,   Icon: Workflow },
                      { label: 'tasks',       value: p.taskCount,       Icon: Layers3  },
                      { label: 'deliverables',value: p.deliverableCount,Icon: FileText },
                      ...(p.approvalCount ? [{ label: 'approval pending', value: p.approvalCount, Icon: ShieldCheck }] : []),
                    ] as Array<{ label: string; value?: number; Icon: React.ElementType }>)
                      .filter(c => c.value)
                      .map(c => (
                        <div key={c.label} className="flex items-center gap-1 text-[11px] text-white/35">
                          <c.Icon className="h-3 w-3 shrink-0" />
                          <span>{c.value} {c.label}</span>
                        </div>
                      ))}
                  </div>

                  {/* Activity + next action */}
                  {(p.lastActivity || p.nextAction) && (
                    <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4">
                      {p.lastActivity && (
                        <p className="text-[11px] text-white/32">
                          <span className="font-bold text-white/42">Latest: </span>{p.lastActivity}
                        </p>
                      )}
                      {p.nextAction && (
                        <p className="text-[11px] text-white/32">
                          <span className="font-bold text-white/42">Next: </span>{p.nextAction}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setDetailsId(p.id === detailsId ? null : p.id)}
                      className={`rounded-[10px] px-3.5 py-2 text-xs font-bold transition ${
                        p.status === 'needs_approval'
                          ? 'bg-rose-500 text-white hover:bg-rose-400'
                          : 'bg-[#ffffff] text-[#070B14] hover:bg-[#f0f2ff]'
                      }`}
                    >
                      {primaryLabel}
                    </button>
                    <button
                      onClick={() => setDetailsId(p.id === detailsId ? null : p.id)}
                      className="rounded-[10px] border border-white/[0.18] bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/65 transition hover:border-white/28 hover:bg-white/[0.09] hover:text-white/85"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Project details drawer ─────────────────────────────── */}
      {detailsId && detailProject && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setDetailsId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-white/[0.08] bg-[#0A0F1B] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/60">Project details</p>
                <h2 className="mt-1 font-heading text-xl font-bold text-white">{detailProject.name}</h2>
              </div>
              <button
                onClick={() => setDetailsId(null)}
                className="grid h-8 w-8 place-items-center rounded-[8px] text-white/30 transition hover:bg-white/[0.07] hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-5">
              {/* Overview */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Overview</p>
                <div className="space-y-3 rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PROJ_TYPE_META[detailProject.type ?? 'mixed'].tone}`}>
                      {PROJ_TYPE_META[detailProject.type ?? 'mixed'].label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PROJ_STATUS_META[detailProject.status ?? 'draft'].tone}`}>
                      {PROJ_STATUS_META[detailProject.status ?? 'draft'].label}
                    </span>
                  </div>
                  <p className="text-sm text-white/55">{detailProject.goal}</p>
                  {detailProject.progress !== undefined && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Progress</span>
                        <span className="text-[11px] font-bold text-white/45">{detailProject.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-violet-400" style={{ width: `${detailProject.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {detailProject.lastActivity && (
                    <p className="text-xs text-white/35">
                      <span className="font-bold text-white/45">Latest activity: </span>{detailProject.lastActivity}
                    </p>
                  )}
                  {detailProject.nextAction && (
                    <p className="text-xs text-white/35">
                      <span className="font-bold text-white/45">Next action: </span>{detailProject.nextAction}
                    </p>
                  )}
                </div>
              </section>

              {/* AI Team */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">AI Team</p>
                {(detailProject.agentCount ?? 0) > 0 ? (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/55">
                      <Users className="h-4 w-4 shrink-0 text-blue-300/60" />
                      <span>{detailProject.agentCount} agents assigned to this project</span>
                    </div>
                    <p className="mt-2 text-xs text-white/30">Open the workspace to manage individual agents and their tasks.</p>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">No AI agents assigned yet.</div>
                )}
              </section>

              {/* Workflows */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Workflows</p>
                {(detailProject.workflowCount ?? 0) > 0 ? (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/55">
                      <Workflow className="h-4 w-4 shrink-0 text-cyan-300/60" />
                      <span>{detailProject.workflowCount} workflow{(detailProject.workflowCount ?? 0) > 1 ? 's' : ''} attached</span>
                    </div>
                    <p className="mt-2 text-xs text-white/30">Manage schedules and triggers in the Workflows page.</p>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">No workflows attached.</div>
                )}
              </section>

              {/* Tasks */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Tasks</p>
                {(detailProject.taskCount ?? 0) > 0 ? (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/55">
                      <Layers3 className="h-4 w-4 shrink-0 text-violet-300/60" />
                      <span>{detailProject.taskCount} task{(detailProject.taskCount ?? 0) > 1 ? 's' : ''} in this project</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/30">
                      <span className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2 py-1">Todo</span>
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2 py-1 text-emerald-300/60">Running</span>
                      <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2 py-1 text-amber-300/60">Review</span>
                      <span className="rounded-full border border-sky-400/25 bg-sky-400/[0.07] px-2 py-1 text-sky-300/60">Done</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">No tasks yet.</div>
                )}
              </section>

              {/* Deliverables */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Deliverables</p>
                {(detailProject.deliverableCount ?? 0) > 0 ? (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/55">
                      <FileText className="h-4 w-4 shrink-0 text-sky-300/60" />
                      <span>{detailProject.deliverableCount} deliverable{(detailProject.deliverableCount ?? 0) > 1 ? 's' : ''} produced</span>
                    </div>
                    <p className="mt-2 text-xs text-white/30">View and export all finished outputs from the Deliverables page.</p>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">No deliverables yet.</div>
                )}
              </section>

              {/* Approvals */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Approvals</p>
                {(detailProject.approvalCount ?? 0) > 0 ? (
                  <div className="rounded-[16px] border border-rose-400/20 bg-rose-400/[0.04] p-4">
                    <div className="flex items-center gap-2 text-sm text-rose-200/70">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>{detailProject.approvalCount} approval{(detailProject.approvalCount ?? 0) > 1 ? 's' : ''} pending — review before AI acts</span>
                    </div>
                    <button
                      onClick={() => setPage('Approvals')}
                      className="mt-3 rounded-[10px] bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-400"
                    >
                      Go to Approvals
                    </button>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">No pending approvals.</div>
                )}
              </section>

              {/* Knowledge */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Knowledge</p>
                <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/30">
                  Manage files, sources, and agent learnings in the Knowledge page.
                </div>
              </section>

              {/* Activity */}
              <section>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Activity</p>
                <div className="space-y-2">
                  {[
                    detailProject.lastActivity
                      ? { text: detailProject.lastActivity, tone: 'text-white/42' }
                      : null,
                    {
                      text: `Project created ${new Date(detailProject.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                      tone: 'text-white/28',
                    },
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                        <p className={`text-xs leading-relaxed ${(item as { text: string; tone: string }).tone}`}>
                          {(item as { text: string; tone: string }).text}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ── New project modal ──────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#0A0F1B] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-white">New project</h2>
              <button onClick={() => setShowNewModal(false)} className="grid h-8 w-8 place-items-center rounded-[8px] text-white/30 transition hover:bg-white/[0.07] hover:text-white/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/35">Project name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="e.g. Weekly Reporting Workflow"
                  className="w-full rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/35">Goal</label>
                <textarea
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  placeholder="Describe what this project should accomplish…"
                  rows={3}
                  className="w-full resize-none rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/35">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['enterprise', 'crew', 'workflow', 'mixed'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`rounded-[12px] border px-4 py-2.5 text-left text-xs font-semibold transition ${
                        newType === t
                          ? 'border-violet-500/50 bg-violet-500/10 text-violet-200'
                          : 'border-white/[0.09] bg-white/[0.02] text-white/45 hover:border-white/15 hover:text-white/65'
                      }`}
                    >
                      {PROJ_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-white/[0.07] px-6 py-4">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 rounded-[12px] bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                Create project
              </button>
              <button
                onClick={() => { setShowNewModal(false); setPage('AI Ant'); }}
                className="flex-1 rounded-[12px] border border-white/[0.10] py-2.5 text-sm font-semibold text-white/55 transition hover:text-white/80"
              >
                Create with AI Ant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename modal ──────────────────────────────────────── */}
      {renameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRenameId(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-sm rounded-[20px] border border-white/[0.10] bg-[#0A0F1B] p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-4 font-heading text-base font-bold text-white">Rename project</h2>
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenameId(null); }}
              className="w-full rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={handleRename} className="flex-1 rounded-[12px] bg-violet-600 py-2 text-sm font-bold text-white transition hover:bg-violet-500">Save</button>
              <button onClick={() => setRenameId(null)} className="flex-1 rounded-[12px] border border-white/[0.10] py-2 text-sm font-semibold text-white/50 transition hover:text-white/75">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ───────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-sm rounded-[20px] border border-white/[0.10] bg-[#0A0F1B] p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-2 font-heading text-base font-bold text-white">Delete project?</h2>
            <p className="mb-5 text-sm text-white/45">This will permanently remove the project. Chats will stay in history. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-[12px] bg-rose-500 py-2 text-sm font-bold text-white transition hover:bg-rose-400"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-[12px] border border-white/[0.10] py-2 text-sm font-semibold text-white/50 transition hover:text-white/75"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
