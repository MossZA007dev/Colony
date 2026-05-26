import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, FileText, MessageSquare, Bot, Layers3, LinkIcon, Clock3, X, Workflow, Users, Eye, Brain, FolderOpen } from 'lucide-react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import type { Page } from '../../types/navigation';
import type { AppDeliverable, WorkspaceChat, WorkspaceProject } from '../../App';

type DeliverablesFilter = 'all' | 'needs_review' | 'approved' | 'report' | 'strategy' | 'workflow_automation' | 'from_chat' | 'from_workflow' | 'from_crew' | 'missing_source';

const DELIV_STATUS_META: Record<AppDeliverable['status'], { label: string; cls: string }> = {
  draft:         { label: 'Draft',        cls: 'border-white/15 bg-white/[0.05] text-white/50' },
  needs_review:  { label: 'Needs review', cls: 'border-amber-400/30 bg-amber-400/[0.08] text-amber-300' },
  approved:      { label: 'Approved',     cls: 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300' },
  export_ready:  { label: 'Export ready', cls: 'border-violet-400/30 bg-violet-400/[0.08] text-violet-300' },
};

const DELIV_TYPE_META: Record<AppDeliverable['type'], { label: string; icon: string }> = {
  report:               { label: 'Report',               icon: '📊' },
  strategy:             { label: 'Strategy',             icon: '🎯' },
  summary:              { label: 'Summary',              icon: '📝' },
  plan:                 { label: 'Plan',                 icon: '📅' },
  draft:                { label: 'Draft',                icon: '✏️' },
  workflow_automation:  { label: 'Workflow automation',  icon: '⚡' },
  research:             { label: 'Research',             icon: '🔍' },
};

function deliverableSourceLabel(d: AppDeliverable, chats: WorkspaceChat[]): string {
  if (d.sourceChatId) {
    const chat = chats.find((c) => c.id === d.sourceChatId);
    return `Created from: ${chat?.title ?? 'Chat conversation'}`;
  }
  if (d.sourceCrewRunId) return 'Source: Colony Crew run';
  if (d.sourceWorkflowId) return 'Source: Workflow run';
  if (d.ownerAgent) return `Created by: ${d.ownerAgent}`;
  return '';
}

function DeliverableDetailPanel({
  deliverable,
  wsChats,
  wsProjects,
  onClose,
  onOpenChat,
  onOpenProject,
}: {
  deliverable: AppDeliverable;
  wsChats: WorkspaceChat[];
  wsProjects: WorkspaceProject[];
  onClose: () => void;
  onOpenChat: (id: string) => void;
  onOpenProject: (id: string) => void;
}) {
  const sm = DELIV_STATUS_META[deliverable.status];
  const tm = DELIV_TYPE_META[deliverable.type];
  const sourceChat = wsChats.find((c) => c.id === deliverable.sourceChatId);
  const sourceProject = wsProjects.find((p) => p.id === deliverable.projectId);
  const hasChatSource = !!deliverable.sourceChatId;
  const hasProjectSource = !!deliverable.projectId;

  return (
    <motion.aside
      initial={{ x: 480, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 480, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 z-[70] flex w-[clamp(360px,30vw,440px)] flex-col border-l border-white/[0.09] bg-[#070912] shadow-[0_0_80px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-base">{tm.icon}</span>
            <span className="text-[11px] font-semibold text-muted">{tm.label}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.cls}`}>{sm.label}</span>
          </div>
          <h3 className="font-heading text-lg font-bold leading-tight text-white">{deliverable.title}</h3>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">

        {/* Summary */}
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Summary</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] text-muted">Version</p>
              <p className="mt-0.5 font-bold">v{deliverable.version}</p>
            </div>
            <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] text-muted">Updated</p>
              <p className="mt-0.5 font-bold">{new Date(deliverable.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          {deliverable.description && <p className="mt-3 leading-relaxed text-white/60">{deliverable.description}</p>}
        </div>

        {/* Source context */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/35">Source context</p>
          <div className="space-y-2">
            {sourceChat ? (
              <div className="flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare size={12} className="shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted">Source chat</p>
                    <p className="truncate text-[13px] font-semibold">{sourceChat.title}</p>
                  </div>
                </div>
                <button onClick={() => onOpenChat(sourceChat.id)} className="shrink-0 rounded-lg border border-accent/25 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/15">
                  Open
                </button>
              </div>
            ) : deliverable.sourceChatId ? (
              <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="text-[12px] text-muted">Source chat is no longer available, but the deliverable is still saved.</p>
              </div>
            ) : null}

            {sourceProject ? (
              <div className="flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers3 size={12} className="shrink-0 text-blue-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted">Project</p>
                    <p className="truncate text-[13px] font-semibold">{sourceProject.name}</p>
                  </div>
                </div>
                <button onClick={() => onOpenProject(sourceProject.id)} className="shrink-0 rounded-lg border border-blue-400/25 bg-blue-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition hover:bg-blue-400/15">
                  Open
                </button>
              </div>
            ) : deliverable.projectName ? (
              <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-center gap-1.5">
                  <Layers3 size={12} className="text-blue-400/50" />
                  <span className="text-[12px] text-muted">{deliverable.projectName}</span>
                </div>
              </div>
            ) : null}

            {deliverable.sourceCrewRunId && (
              <div className="flex items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
                <Users size={12} className="shrink-0 text-violet-400" />
                <div>
                  <p className="text-[10px] text-muted">Colony Crew run</p>
                  <p className="text-[12px] font-mono text-white/50">{deliverable.sourceCrewRunId}</p>
                </div>
              </div>
            )}

            {deliverable.sourceWorkflowId && (
              <div className="flex items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
                <Workflow size={12} className="shrink-0 text-cyan-400" />
                <div>
                  <p className="text-[10px] text-muted">Workflow run</p>
                  <p className="text-[12px] font-mono text-white/50">{deliverable.sourceWorkflowId}</p>
                </div>
              </div>
            )}

            {!hasChatSource && !hasProjectSource && !deliverable.sourceCrewRunId && !deliverable.sourceWorkflowId && (
              <p className="text-[12px] text-muted">No source context linked to this deliverable.</p>
            )}
          </div>
        </div>

        {/* Owner agent */}
        {deliverable.ownerAgent && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Owner agent</p>
            <div className="flex items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
              <Bot size={13} className="text-violet-400" />
              <span className="text-[13px] font-semibold">{deliverable.ownerAgent}</span>
            </div>
          </div>
        )}

        {/* Original prompt */}
        {deliverable.sourcePrompt && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Original prompt</p>
            <p className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3 text-[12px] leading-relaxed text-white/55">{deliverable.sourcePrompt}</p>
          </div>
        )}

        {/* Content preview */}
        {deliverable.content && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Content preview</p>
            <p className="whitespace-pre-wrap rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3 text-[12px] leading-relaxed text-white/55">{deliverable.content}</p>
          </div>
        )}

        {/* Version history */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/35">Version history</p>
          <div className="space-y-1.5">
            {Array.from({ length: deliverable.version }, (_, i) => deliverable.version - i).map((v) => (
              <div key={v} className={`flex items-center justify-between rounded-[10px] border px-3 py-2 ${v === deliverable.version ? 'border-accent/20 bg-accent/[0.05]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-bold ${v === deliverable.version ? 'text-accent' : 'text-muted'}`}>v{v}</span>
                  {v === deliverable.version && <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent">Current</span>}
                </div>
                <span className="text-[11px] text-muted">
                  {v === deliverable.version ? new Date(deliverable.updatedAt).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="border-t border-white/[0.07] p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => hasChatSource && deliverable.sourceChatId && onOpenChat(deliverable.sourceChatId)}
            disabled={!hasChatSource}
            title={!hasChatSource ? 'No source chat linked' : undefined}
            className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
          >
            View source chat
          </button>
          <button
            onClick={() => hasProjectSource && deliverable.projectId && onOpenProject(deliverable.projectId)}
            disabled={!hasProjectSource}
            title={!hasProjectSource ? 'No project linked' : undefined}
            className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Open project
          </button>
        </div>
        <div className="flex gap-2">
          {deliverable.status === 'needs_review' && (
            <button className="flex-1 rounded-[10px] bg-emerald-600 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-500">
              Approve
            </button>
          )}
          <button className="flex-1 rounded-[10px] bg-[#ffffff] px-3 py-2 text-[12px] font-bold text-[#070B14] hover:bg-[#f0f2ff]">
            Open deliverable
          </button>
          <button className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-[12px] font-semibold text-white/50 transition hover:bg-white/[0.06]">
            Export
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

export function DeliverablesOSPage({
  deliverables,
  setDeliverables,
  wsChats,
  wsProjects,
  setPage,
  onOpenChat,
}: {
  deliverables: AppDeliverable[];
  setDeliverables: (fn: (prev: AppDeliverable[]) => AppDeliverable[]) => void;
  wsChats: WorkspaceChat[];
  wsProjects: WorkspaceProject[];
  setPage: (p: Page) => void;
  onOpenChat: (id: string) => void;
}) {
  const [filter, setFilter] = useState<DeliverablesFilter>('all');
  const [showSourceFilters, setShowSourceFilters] = useState(false);
  const [detailItem, setDetailItem] = useState<AppDeliverable | null>(null);
  const [sourceBanner, setSourceBanner] = useState<string | null>(null);

  const PRIMARY_FILTERS: Array<{ id: DeliverablesFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'needs_review', label: 'Needs review' },
    { id: 'approved', label: 'Approved' },
    { id: 'report', label: 'Report' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'workflow_automation', label: 'Workflow automation' },
  ];

  const SOURCE_FILTERS: Array<{ id: DeliverablesFilter; label: string }> = [
    { id: 'from_chat', label: 'From chat' },
    { id: 'from_workflow', label: 'From workflow' },
    { id: 'from_crew', label: 'From crew' },
    { id: 'missing_source', label: 'Missing source' },
  ];

  const filtered = deliverables.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'needs_review') return d.status === 'needs_review';
    if (filter === 'approved') return d.status === 'approved';
    if (filter === 'report') return d.type === 'report';
    if (filter === 'strategy') return d.type === 'strategy';
    if (filter === 'workflow_automation') return d.type === 'workflow_automation';
    if (filter === 'from_chat') return !!d.sourceChatId;
    if (filter === 'from_workflow') return !!d.sourceWorkflowId;
    if (filter === 'from_crew') return !!d.sourceCrewRunId;
    if (filter === 'missing_source') return !d.sourceChatId && !d.projectId && !d.sourceWorkflowId && !d.sourceCrewRunId;
    return true;
  });

  const openDeliverableSource = (d: AppDeliverable) => {
    if (d.sourceChatId) {
      const chat = wsChats.find((c) => c.id === d.sourceChatId);
      if (chat) {
        setSourceBanner(`Viewing source conversation for "${d.title}"`);
        setTimeout(() => setSourceBanner(null), 4000);
        onOpenChat(d.sourceChatId);
      } else {
        setSourceBanner(`The original chat is no longer available, but the deliverable is still saved.`);
        setTimeout(() => setSourceBanner(null), 4000);
      }
      return;
    }
    if (d.projectId) {
      setPage('Projects');
      return;
    }
    if (d.sourceWorkflowId || d.sourceCrewRunId) {
      setPage('Workflows');
      return;
    }
    setSourceBanner('No source context found for this deliverable.');
    setTimeout(() => setSourceBanner(null), 3000);
  };

  return (
    <OSPageShell eyebrow="Finished work" title="Deliverables" subtitle="Reports, strategies, summaries, plans, drafts, and automations produced by AI Ant and your AI teams.">

      {/* Source banner */}
      <AnimatePresence>
        {sourceBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-[14px] border border-accent/25 bg-accent/[0.07] px-4 py-3 text-[13px] font-semibold text-accent"
          >
            <MessageSquare size={13} className="shrink-0" />
            {sourceBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {PRIMARY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setShowSourceFilters(false); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === f.id ? 'border-accent/40 bg-accent/[0.12] text-accent' : 'border-white/[0.09] bg-white/[0.03] text-white/48 hover:text-white/70'}`}
          >
            {f.label}
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowSourceFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${SOURCE_FILTERS.some((f) => f.id === filter) ? 'border-accent/40 bg-accent/[0.12] text-accent' : 'border-white/[0.09] bg-white/[0.03] text-white/48 hover:text-white/70'}`}
          >
            <Filter size={10} />Source
          </button>
          {showSourceFilters && (
            <div className="absolute left-0 top-9 z-20 min-w-[160px] rounded-[14px] border border-white/[0.09] bg-[#0b0f1a] p-1.5 shadow-xl">
              {SOURCE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setShowSourceFilters(false); }}
                  className={`block w-full rounded-[10px] px-3 py-2 text-left text-[12px] font-semibold transition ${filter === f.id ? 'bg-accent/15 text-accent' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/75'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {deliverables.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[22px] border border-white/[0.07] bg-white/[0.02] py-20 text-center">
          <FileText size={32} className="mb-4 text-white/20" />
          <p className="text-[15px] font-bold text-white/40">No deliverables yet</p>
          <p className="mt-1.5 max-w-xs text-sm text-white/28">Ask AI Ant to create a report, plan, workflow, or summary. It will appear here.</p>
          <button onClick={() => setPage('AI Ant')} className="mt-5 rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent/85">
            Open AI Ant
          </button>
        </div>
      )}

      {/* Filtered empty */}
      {deliverables.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[22px] border border-white/[0.07] bg-white/[0.02] py-14 text-center">
          <p className="text-sm text-white/35">No deliverables match this filter.</p>
          <button onClick={() => setFilter('all')} className="mt-3 rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink">
            Show all
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => {
          const sm = DELIV_STATUS_META[d.status];
          const tm = DELIV_TYPE_META[d.type];
          const sourceLabel = deliverableSourceLabel(d, wsChats);
          const hasChat = !!d.sourceChatId && wsChats.some((c) => c.id === d.sourceChatId);
          const hasProject = !!d.projectId;

          return (
            <div key={d.id} className="flex flex-col rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition hover:border-white/[0.12]">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-sm">{tm.icon}</span>
                    <span className="text-[11px] text-muted">{tm.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.cls}`}>{sm.label}</span>
                  </div>
                  <h3 className="font-heading text-[15px] font-bold leading-snug text-white">{d.title}</h3>
                </div>
                <span className="shrink-0 rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-muted">v{d.version}</span>
              </div>

              {/* Description */}
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/50">{d.description}</p>

              {/* Metadata row */}
              <div className="mt-3 space-y-1">
                {d.ownerAgent && (
                  <div className="flex items-center gap-1.5">
                    <Bot size={11} className="shrink-0 text-violet-400/70" />
                    <span className="text-[11px] text-muted">Owner: {d.ownerAgent}</span>
                  </div>
                )}
                {d.projectName && (
                  <div className="flex items-center gap-1.5">
                    <Layers3 size={11} className="shrink-0 text-blue-400/70" />
                    <span className="text-[11px] text-muted">{d.projectName}</span>
                  </div>
                )}
                {sourceLabel && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon size={11} className="shrink-0 text-accent/60" />
                    <span className="text-[11px] text-accent/70">{sourceLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock3 size={11} className="shrink-0 text-muted/50" />
                  <span className="text-[11px] text-muted/60">Updated {new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-[10px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]">
                  Open
                </button>
                <button onClick={() => setDetailItem(d)} className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/[0.20] hover:text-white/70">
                  Details
                </button>
                <button
                  onClick={() => openDeliverableSource(d)}
                  title={!d.sourceChatId && !d.projectId && !d.sourceWorkflowId && !d.sourceCrewRunId ? 'No source chat linked' : undefined}
                  disabled={!d.sourceChatId && !d.projectId && !d.sourceWorkflowId && !d.sourceCrewRunId}
                  className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.10] px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-accent/30 hover:text-accent/80 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <MessageSquare size={11} />View source
                </button>
                {hasProject && (
                  <button onClick={() => setPage('Projects')} className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.10] px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-blue-400/30 hover:text-blue-300/80">
                    <Layers3 size={11} />Project
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detailItem && (
          <>
            <motion.div
              key="detail-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setDetailItem(null)}
            />
            <DeliverableDetailPanel
              deliverable={detailItem}
              wsChats={wsChats}
              wsProjects={wsProjects}
              onClose={() => setDetailItem(null)}
              onOpenChat={(id) => { setDetailItem(null); onOpenChat(id); }}
              onOpenProject={() => { setDetailItem(null); setPage('Projects'); }}
            />
          </>
        )}
      </AnimatePresence>

    </OSPageShell>
  );
}
